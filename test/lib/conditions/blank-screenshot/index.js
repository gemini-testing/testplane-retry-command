'use strict';

const Promise = require('bluebird');
const EventEmitter = require('events');
const utils = require('../../../../lib/conditions/blank-screenshot/utils');
const commonUtils = require('../../../../lib/utils');
const plugin = require('../../../../');

const events = {
    NEW_BROWSER: 'fooBar'
};

describe('blank-screenshot', () => {
    const sandbox = sinon.createSandbox();
    let browser;

    const stubBrowser_ = () => {
        const browser = {
            screenshot: sinon.stub().resolves({value: 'default-base64'}),
            takeScreenshot: sinon.stub().resolves('base64')
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

    const init_ = (browser = stubBrowser_(), config = {retryCount: 2, retryInterval: 100}) => {
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
    };

    beforeEach(() => {
        sandbox.stub(utils, 'isBlankScreenshot').returns(false);
        sandbox.stub(commonUtils, 'isWdioLatest').returns(false);
        sandbox.stub(Promise, 'delay').resolves();

        browser = stubBrowser_();
    });

    afterEach(() => sandbox.restore());

    [
        {
            name: 'latest',
            cmdName: 'takeScreenshot',
            nonBlankScreenRes: 'non-blank-screenshot',
            blankScreenRes: 'blank-screenshot',
            isWdioLatestRes: true
        },
        {
            name: 'old',
            cmdName: 'screenshot',
            nonBlankScreenRes: {value: 'non-blank-screenshot'},
            blankScreenRes: {value: 'blank-screenshot'},
            isWdioLatestRes: false
        }
    ].forEach(({name, cmdName, nonBlankScreenRes, blankScreenRes, isWdioLatestRes}) => {
        describe(`executed with ${name} wdio`, () => {
            beforeEach(() => {
                commonUtils.isWdioLatest.returns(isWdioLatestRes);
            });

            it(`should wrap "${cmdName}" command of browser`, () => {
                init_(browser);

                assert.calledOnceWith(browser.addCommand, cmdName, sinon.match.func, true);
            });

            it(`should call base "${cmdName}"`, async () => {
                const baseScreenshot = browser[cmdName];
                init_(browser);

                await browser[cmdName]();

                assert.called(baseScreenshot);
                assert.calledOn(baseScreenshot, browser);
            });

            it('should return screenshot result if it is not blank', async () => {
                browser[cmdName].resolves(nonBlankScreenRes);
                init_(browser);

                const result = await browser[cmdName]();

                assert.deepEqual(result, nonBlankScreenRes);
            });

            it(`should call base "${cmdName}" command again for blank screenshot`, async () => {
                const baseScreenshot = browser[cmdName].resolves(nonBlankScreenRes);
                utils.isBlankScreenshot.onFirstCall().returns(true);
                init_(browser);

                await browser[cmdName]();

                assert.calledTwice(baseScreenshot);
            });

            it(`should return non-blank "${cmdName}" if retry succeeds`, async () => {
                browser[cmdName]
                    .onFirstCall().resolves(blankScreenRes)
                    .onSecondCall().resolves(nonBlankScreenRes);

                utils.isBlankScreenshot.withArgs('blank-screenshot').returns(true);
                utils.isBlankScreenshot.withArgs('non-blank-screenshot').returns(false);
                init_(browser, {retryCount: 1});

                const result = await browser[cmdName]();

                assert.deepEqual(result, nonBlankScreenRes);
            });

            it(`should return previous "${cmdName}" result if retry failed`, async () => {
                browser[cmdName]
                    .onFirstCall().resolves(blankScreenRes)
                    .onSecondCall().rejects(new Error());

                utils.isBlankScreenshot.withArgs('blank-screenshot').returns(true);
                init_(browser);

                const result = await browser[cmdName]();

                assert.deepEqual(result, blankScreenRes);
            });

            it(`should not retry if first "${cmdName}" failed`, async () => {
                const err = new Error();
                browser[cmdName].rejects(err);
                init_(browser);

                try {
                    await browser[cmdName]();
                } catch (e) {
                    assert.equal(e, err);
                    return;
                }

                assert(false, 'should reject');
            });

            it('should retry blank screenshots specified number of times', async () => {
                const retryCount = 3;
                const baseScreenshot = browser[cmdName];
                utils.isBlankScreenshot.returns(true);
                init_(browser, {retryCount});

                await browser[cmdName]();

                assert.callCount(baseScreenshot, retryCount + 1);
            });

            it('should retry blank screenshots in specified intervals', async () => {
                const retryInterval = 500;
                utils.isBlankScreenshot.returns(true);
                init_(browser, {retryInterval});

                await browser[cmdName]();

                assert.alwaysCalledWith(Promise.delay, retryInterval);
            });
        });
    });
});
