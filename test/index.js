'use strict';

const EventEmitter = require('events');
const plugin = require('../');
const conditions = require('../lib/conditions');
const utils = require('../lib/utils');

const events = {
    NEW_BROWSER: 'fooBar'
};

describe('hermione-retry-command', () => {
    const sandbox = sinon.createSandbox();

    const mkHermioneStub_ = () => {
        const hermione = new EventEmitter();
        hermione.events = events;

        return hermione;
    };

    const stubBrowser_ = () => ({});

    beforeEach(() => {
        sandbox.stub(conditions, 'blank-screenshot');
        sandbox.stub(utils, 'isParamIncluded');
    });

    afterEach(() => sandbox.restore());

    it('should be enabled by default', () => {
        const hermione = mkHermioneStub_();

        plugin(hermione);

        assert.equal(hermione.listenerCount(events.NEW_BROWSER), 1);
    });

    it('should do nothing if disabled', () => {
        const hermione = mkHermioneStub_();

        plugin(hermione, {enabled: false});

        assert.equal(hermione.listenerCount(events.NEW_BROWSER), 0);
    });

    it('should check browser is included in config', () => {
        const hermione = mkHermioneStub_();

        plugin(hermione, {
            rules: [
                {
                    condition: 'blank-screenshot',
                    browsers: ['bar', 'baz']
                }
            ]
        });

        hermione.emit(events.NEW_BROWSER, stubBrowser_(), {browserId: 'foo'});

        assert.calledOnceWith(utils.isParamIncluded, sinon.match(['bar', 'baz']), 'foo');
    });

    it('should apply condition for browser', () => {
        const hermione = mkHermioneStub_();
        const rule = {
            browsers: /.*/,
            condition: 'blank-screenshot',
            retryCount: 100,
            retryInterval: 500,
            retryOnlyFirst: false
        };

        plugin(hermione, {
            rules: [rule]
        });

        utils.isParamIncluded.returns(true);

        const browser = stubBrowser_();

        hermione.emit(events.NEW_BROWSER, browser, {});

        assert.calledOnceWith(conditions['blank-screenshot'], browser, rule);
    });

    it('should not apply condition for unknown browser', () => {
        const hermione = mkHermioneStub_();

        plugin(hermione, {
            rules: [
                {
                    condition: 'blank-screenshot'
                }
            ]
        });

        utils.isParamIncluded.returns(false);

        hermione.emit(events.NEW_BROWSER, stubBrowser_(), {});

        assert.notCalled(conditions['blank-screenshot']);
    });
});
