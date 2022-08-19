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
    let browser;

    const stubBrowser_ = () => {
        const browser = {
            screenshot: sinon.stub().resolves({value: 'default-base64'}),
            takeScreenshot: sinon.stub().resolves('base64')
        };

        browser.overwriteCommand = sinon.stub().callsFake((name, command) => {
            browser[name] = command.bind(browser, browser[name]);
            sinon.spy(browser, name);
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
        sandbox.stub(Promise, 'delay').resolves();

        browser = stubBrowser_();
    });

    afterEach(() => sandbox.restore());

    it('should wrap "takeScreenshot" command of browser', () => {
        init_(browser);

        assert.calledOnceWith(browser.overwriteCommand, 'takeScreenshot', sinon.match.func);
    });

    it('should call base "takeScreenshot"', async () => {
        const baseScreenshot = browser.takeScreenshot;
        init_(browser);

        await browser.takeScreenshot();

        assert.called(baseScreenshot);
    });

    it('should return screenshot result if it is not blank', async () => {
        browser.takeScreenshot.resolves('non-blank-screenshot');
        init_(browser);

        const result = await browser.takeScreenshot();

        assert.deepEqual(result, 'non-blank-screenshot');
    });

    it('should call base "takeScreenshot" command again for blank screenshot', async () => {
        const baseScreenshot = browser.takeScreenshot.resolves('non-blank-screenshot');
        utils.isBlankScreenshot.onFirstCall().returns(true);
        init_(browser);

        await browser.takeScreenshot();

        assert.calledTwice(baseScreenshot);
    });

    it('should return non-blank "takeScreenshot" if retry succeeds', async () => {
        browser.takeScreenshot
            .onFirstCall().resolves('blank-screenshot')
            .onSecondCall().resolves('non-blank-screenshot');

        utils.isBlankScreenshot.withArgs('blank-screenshot').returns(true);
        utils.isBlankScreenshot.withArgs('non-blank-screenshot').returns(false);
        init_(browser, {retryCount: 1});

        const result = await browser.takeScreenshot();

        assert.deepEqual(result, 'non-blank-screenshot');
    });

    it('should return previous "takeScreenshot" result if retry failed', async () => {
        browser.takeScreenshot
            .onFirstCall().resolves('blank-screenshot')
            .onSecondCall().rejects(new Error());

        utils.isBlankScreenshot.withArgs('blank-screenshot').returns(true);
        init_(browser);

        const result = await browser.takeScreenshot();

        assert.deepEqual(result, 'blank-screenshot');
    });

    it('should not retry if first "takeScreenshot" failed', async () => {
        const err = new Error();
        browser.takeScreenshot.rejects(err);
        init_(browser);

        try {
            await browser.takeScreenshot();
        } catch (e) {
            assert.equal(e, err);
            return;
        }

        assert(false, 'should reject');
    });

    it('should retry blank screenshots specified number of times', async () => {
        const retryCount = 3;
        const baseScreenshot = browser.takeScreenshot;
        utils.isBlankScreenshot.returns(true);
        init_(browser, {retryCount});

        await browser.takeScreenshot();

        assert.callCount(baseScreenshot, retryCount + 1);
    });

    it('should retry blank screenshots in specified intervals', async () => {
        const retryInterval = 500;
        utils.isBlankScreenshot.returns(true);
        init_(browser, {retryInterval});

        await browser.takeScreenshot();

        assert.alwaysCalledWith(Promise.delay, retryInterval);
    });
});
