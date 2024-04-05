'use strict';

const debug = require('debug')('testplane-retry-command:assert-view-failed');
const Promise = require('bluebird');

module.exports = (browser, {retryCount, retryInterval, retryOnlyFirst}) => {
    browser.overwriteCommand('assertView', assertViewWrap);
    browser.overwriteCommand('assertView', assertViewWrap, true);

    async function assertViewWrap(originAssertView, ...args) {
        let retriesLeft = retryCount;
        let result;

        if (retryOnlyFirst && browser.executionContext.hasCalledAssertView) {
            return await originAssertView(...args);
        }

        browser.executionContext.hasCalledAssertView = true;

        result = await originAssertView(...args);

        const testplaneCtx = browser.executionContext.testplaneCtx;
        let assertViewResults = testplaneCtx.assertViewResults.get();
        let resultsLength = assertViewResults.length;
        let lastResult = assertViewResults[resultsLength - 1] || {};

        while (retriesLeft && (lastResult.name === 'ImageDiffError' || lastResult.name === 'NoRefImageError')) {
            await Promise.delay(retryInterval);

            debug(`Retrying #${retryCount - retriesLeft + 1} assert-view-failed in ${retryInterval} ms`);

            retriesLeft -= 1;

            assertViewResults.pop();
            resultsLength = assertViewResults.length;

            try {
                result = await originAssertView(...args);

                resultsLength = assertViewResults.length;
                lastResult = assertViewResults[resultsLength - 1] || {};
            } catch (e) {
                retriesLeft = 0;

                if (resultsLength === assertViewResults.length) {
                    testplaneCtx.assertViewResults.add(lastResult);
                }

                debug(`Failed to make assertView after assert-view-failed: ${e}`);
            }
        }

        return result;
    }
};
