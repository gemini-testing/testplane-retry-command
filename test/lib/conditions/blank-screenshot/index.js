'use strict';

const Promise = require('bluebird');
const EventEmitter = require('events');
const utils = require('../../../../lib/conditions/blank-screenshot/utils');
const plugin = require('../../../../');

const events = {
    NEW_BROWSER: 'fooBar'
};

describe('blank-screenshot', () => {
    const sandbox = sinon.createSandbox();

    const stubBrowser_ = ({screenshot} = {}) => {
        const browser = {
            screenshot: screenshot || sinon.stub().resolves({})
        };

        browser.addCommand = sinon.stub().callsFake((name, fn) => {
            browser[name] = fn.bind(browser);
        });

        return browser;
    };

    const mkHermioneStub_ = () => {
        const hermione = new EventEmitter();
        hermione.events = events;

        return hermione;
    };

    const init_ = ({screenshot}, config = {retryCount: 2, retryInterval: 100}) => {
        const browser = stubBrowser_({screenshot});

        const hermione = mkHermioneStub_();

        plugin(hermione, {
            rules: [
                {
                    condition: 'blank-screenshot',
                    browsers: 'bar',
                    ...config
                }
            ]
        });

        hermione.emit(events.NEW_BROWSER, browser, {browserId: 'bar'});

        return browser;
    };

    beforeEach(() => {
        sandbox.stub(utils, 'isBlankScreenshot').returns(false);
        sandbox.stub(Promise, 'delay').resolves();
    });

    afterEach(() => sandbox.restore());

    it('should wrap screenshot command of browser', () => {
        const screenshot = sinon.stub().named('screenshot').resolves({});

        const browser = init_({screenshot});

        assert.calledOnceWith(browser.addCommand, 'screenshot', sinon.match.func, true);
    });

    it('should call base screenshot', async () => {
        const screenshot = sinon.stub().named('baseScreenshot').resolves({});
        const browser = init_({screenshot});

        await browser.screenshot();

        assert.called(screenshot);
        assert.calledOn(screenshot, browser);
    });

    it('should return screenshot if it is not blank', async () => {
        const screenshot = sinon.stub().resolves({value: 'non-blank-screenshot'});
        const browser = init_({screenshot});

        const result = await browser.screenshot();

        assert.deepEqual(result, {value: 'non-blank-screenshot'});
    });

    it('should call base screenshot command again for blank screenshot', async () => {
        const screenshot = sinon.stub().named('baseScreenshot').resolves({});

        const browser = init_({screenshot});

        utils.isBlankScreenshot.onFirstCall().returns(true);

        await browser.screenshot();

        assert.calledTwice(screenshot);
    });

    it('should return non-blank screenshot if retry succeeds', async () => {
        const screenshot = sinon.stub()
            .onFirstCall().resolves({value: 'blank-screenshot'})
            .onSecondCall().resolves({value: 'non-blank-screenshot'});

        const browser = init_({screenshot});

        utils.isBlankScreenshot.withArgs('blank-screenshot').returns(true);
        utils.isBlankScreenshot.withArgs('non-blank-screenshot').returns(false);

        const result = await browser.screenshot();

        assert.deepEqual(result, {value: 'non-blank-screenshot'});
    });

    it('should return previous screenshot if retry failed', async () => {
        const screenshot = sinon.stub()
            .onFirstCall().resolves({value: 'blank-screenshot'})
            .onSecondCall().rejects(new Error());

        const browser = init_({screenshot});

        utils.isBlankScreenshot.withArgs('blank-screenshot').returns(true);

        const result = await browser.screenshot();

        assert.deepEqual(result, {value: 'blank-screenshot'});
    });

    it('should not retry if first screenshot failed', async () => {
        const err = new Error();
        const screenshot = sinon.stub().rejects(err);
        const browser = init_({screenshot});

        try {
            await browser.screenshot();
        } catch (e) {
            assert.equal(e, err);
            return;
        }

        assert(false, 'should reject');
    });

    it('should retry blank screenshots specified number of times', async () => {
        const retryCount = 3;

        const screenshot = sinon.stub().resolves({});
        const browser = init_({screenshot}, {retryCount});

        utils.isBlankScreenshot.returns(true);

        await browser.screenshot();

        assert.callCount(screenshot, retryCount + 1);
    });

    it('should retry blank screenshots in specified intervals', async () => {
        const retryInterval = 500;

        const screenshot = sinon.stub().resolves({});
        const browser = init_({screenshot}, {retryInterval});

        utils.isBlankScreenshot.returns(true);

        await browser.screenshot();

        assert.alwaysCalledWith(Promise.delay, retryInterval);
    });
});
