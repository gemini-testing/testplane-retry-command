'use strict';

const debug = require('debug')('hermione-retry-command:assert-view-failed');
const Promise = require('bluebird');

module.exports = (browser, {retryCount, retryInterval, retryOnlyFirst}) => {
    const originAssertView = browser.assertView.bind(browser);

    browser.addCommand('assertView', async function(...args) {
        let retriesLeft = retryCount;
        let result;

        if (retryOnlyFirst && this.executionContext.hasCalledAssertView) {
            return await originAssertView(...args);
        }

        this.executionContext.hasCalledAssertView = true;

        result = await originAssertView(...args);

        const hermioneCtx = this.executionContext.hermioneCtx;
        let assertViewResults = hermioneCtx.assertViewResults.get();
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
                    hermioneCtx.assertViewResults.add(lastResult);
                }

                debug(`Failed to make assertView after assert-view-failed: ${e}`);
            }
        }

        return result;
    }, true);
};
