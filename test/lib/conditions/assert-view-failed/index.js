'use strict';

const Promise = require('bluebird');
const EventEmitter = require('events');
const plugin = require('../../../../');

const events = {
    NEW_BROWSER: 'fooBar'
};

describe('assert-view-failed', () => {
    const sandbox = sinon.createSandbox();
    const defaultRetryCount = 2;
    let setResult = function(result) {
        return function() {
            this.executionContext.hermioneCtx.assertViewResults.add(result);
        };
    };

    const stubBrowser_ = ({assertView} = {}) => {
        const browser = {
            executionContext: {
                hermioneCtx: {
                    assertViewResults: {
                        _results: [],
                        get() {
                            return this._results;
                        },
                        add(result) {
                            this._results.push(result);
                        }
                    }
                }
            }
        };
        assertView = assertView.bind(browser);
        setResult = setResult.bind(browser);

        const element = {
            selector: '.selector',
            assertView: assertView || sinon.stub().callsFake(setResult({}))
        };

        browser.$ = sinon.stub().named('$').resolves(element);
        browser.assertView = assertView || sinon.stub().callsFake(setResult({}));
        browser.addCommand = sinon.stub().callsFake((name, command, isElement) => {
            const target = isElement ? element : browser;

            target[name] = command.bind(target);
            sinon.spy(target, name);
        });

        browser.overwriteCommand = sinon.stub().callsFake((name, command, isElement) => {
            const target = isElement ? element : browser;

            target[name] = command.bind(target, target[name]);
            sinon.spy(target, name);
        });

        return browser;
    };

    const mkHermioneStub_ = () => {
        const hermione = new EventEmitter();
        hermione.events = events;

        return hermione;
    };

    const init_ = (browserOpts, config = {retryCount: defaultRetryCount, retryInterval: 100}) => {
        const browser = stubBrowser_(browserOpts);

        const hermione = mkHermioneStub_();

        plugin(hermione, {
            rules: [
                {
                    condition: 'assert-view-failed',
                    browsers: 'bar',
                    ...config
                }
            ]
        });

        hermione.emit(events.NEW_BROWSER, browser, {browserId: 'bar'});

        return browser;
    };

    beforeEach(() => {
        sandbox.stub(Promise, 'delay').resolves();
    });

    afterEach(() => sandbox.restore());

    it('should wrap assertView command of browser', () => {
        const assertView = sinon.stub();

        const browser = init_({assertView});

        const firstCallArgs = browser.overwriteCommand.firstCall.args;
        assert.deepEqual([firstCallArgs[0], firstCallArgs[2]], ['assertView', undefined]);
    });

    it('should call base assertView on browser', async () => {
        const assertView = sinon.stub();
        const browser = init_({assertView});

        await browser.assertView();

        assert.called(assertView);
    });

    it('should call base assertView command again after assertView failed', async () => {
        const assertView = sinon.stub()
            .onCall(0).callsFake(setResult({name: 'ImageDiffError'}))
            .callsFake(setResult({}));

        const browser = init_({assertView});

        await browser.assertView();

        assert.calledTwice(assertView);
    });

    it('should rewrite previous result after call base assertView command again', async () => {
        const results = [
            {name: 'ImageDiffError', index: 0},
            {name: 'ImageDiffError', index: 1},
            {index: 2}
        ];
        const assertView = sinon.stub()
            .onFirstCall().callsFake(setResult(results[0]))
            .onSecondCall().callsFake(setResult(results[1]))
            .onThirdCall().callsFake(setResult(results[2]));
        const browser = init_({assertView});

        await browser.assertView();

        assert.deepEqual(browser.executionContext.hermioneCtx.assertViewResults.get(), results.slice(results.length - 1));
    });

    it('should write previous result if next base assertView rejects', async () => {
        const err = new Error();
        const results = [
            {name: 'ImageDiffError', index: 0},
            {name: 'ImageDiffError', index: 1}
        ];
        const assertView = sinon.stub()
            .onFirstCall().callsFake(setResult(results[0]))
            .onSecondCall().callsFake(setResult(results[1]))
            .onThirdCall().rejects(err);
        const browser = init_({assertView});

        await browser.assertView();

        assert.deepEqual(browser.executionContext.hermioneCtx.assertViewResults.get(), results.slice(results.length - 1));
    });

    it('should retry assertView specified number of times', async () => {
        const retryCount = 3;

        const assertView = sinon.stub().callsFake(setResult({name: 'ImageDiffError'}));
        const browser = init_({assertView}, {retryCount});

        await browser.assertView();

        assert.callCount(assertView, retryCount + 1);
    });

    it('should retry assertView in specified intervals', async () => {
        const retryInterval = 500;

        const assertView = sinon.stub().callsFake(setResult({name: 'ImageDiffError'}));
        const browser = init_({assertView}, {retryInterval});

        await browser.assertView();

        assert.alwaysCalledWith(Promise.delay, retryInterval);
    });

    it('should not retry if first base assertView rejects', async () => {
        const err = new Error();
        const assertView = sinon.stub().rejects(err);
        const browser = init_({assertView});

        try {
            await browser.assertView();
        } catch (e) {
            assert.equal(e, err);
            return;
        }

        assert(false, 'should reject');
    });

    it('should not retry second assertView if retryOnlyFirst is true', async () => {
        const retryOnlyFirst = true;

        const assertView = sinon.stub().callsFake(setResult({name: 'ImageDiffError'}));
        const browser = init_({assertView}, {retryOnlyFirst});

        await browser.assertView();
        await browser.assertView();

        assert.callCount(assertView, defaultRetryCount + 2);
    });
});
