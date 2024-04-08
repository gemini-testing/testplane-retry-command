'use strict';

const EventEmitter = require('events');
const plugin = require('../');
const conditions = require('../lib/conditions');
const utils = require('../lib/utils');

const events = {
    NEW_BROWSER: 'fooBar'
};

describe('@testplane/retry-command', () => {
    const sandbox = sinon.createSandbox();

    const mkTestplaneStub_ = () => {
        const testplane = new EventEmitter();
        testplane.events = events;

        return testplane;
    };

    const stubBrowser_ = () => ({});

    beforeEach(() => {
        sandbox.stub(conditions, 'blank-screenshot');
        sandbox.stub(utils, 'isParamIncluded');
    });

    afterEach(() => sandbox.restore());

    it('should be enabled by default', () => {
        const testplane = mkTestplaneStub_();

        plugin(testplane);

        assert.equal(testplane.listenerCount(events.NEW_BROWSER), 1);
    });

    it('should do nothing if disabled', () => {
        const testplane = mkTestplaneStub_();

        plugin(testplane, {enabled: false});

        assert.equal(testplane.listenerCount(events.NEW_BROWSER), 0);
    });

    it('should check browser is included in config', () => {
        const testplane = mkTestplaneStub_();

        plugin(testplane, {
            rules: [
                {
                    condition: 'blank-screenshot',
                    browsers: ['bar', 'baz']
                }
            ]
        });

        testplane.emit(events.NEW_BROWSER, stubBrowser_(), {browserId: 'foo'});

        assert.calledOnceWith(utils.isParamIncluded, sinon.match(['bar', 'baz']), 'foo');
    });

    it('should apply condition for browser', () => {
        const testplane = mkTestplaneStub_();
        const rule = {
            browsers: /.*/,
            condition: 'blank-screenshot',
            retryCount: 100,
            retryInterval: 500,
            retryOnlyFirst: false
        };

        plugin(testplane, {
            rules: [rule]
        });

        utils.isParamIncluded.returns(true);

        const browser = stubBrowser_();

        testplane.emit(events.NEW_BROWSER, browser, {});

        assert.calledOnceWith(conditions['blank-screenshot'], browser, rule);
    });

    it('should not apply condition for unknown browser', () => {
        const testplane = mkTestplaneStub_();

        plugin(testplane, {
            rules: [
                {
                    condition: 'blank-screenshot'
                }
            ]
        });

        utils.isParamIncluded.returns(false);

        testplane.emit(events.NEW_BROWSER, stubBrowser_(), {});

        assert.notCalled(conditions['blank-screenshot']);
    });
});
