'use strict';

const debug = require('debug')('testplane-retry-command:blank-screenshot');
const Promise = require('bluebird');

const utils = require('./utils');

module.exports = (browser, {retryCount, retryInterval}) => {
    browser.overwriteCommand('takeScreenshot', screenshotWithRetries);

    async function screenshotWithRetries(originTakeScreenshotFn) {
        let retriesLeft = retryCount;
        let base64;

        try {
            base64 = await originTakeScreenshotFn();
        } catch (e) {
            throw e;
        }

        while (retriesLeft && utils.isBlankScreenshot(base64)) {
            await Promise.delay(retryInterval);

            debug(`Retrying #${retryCount - retriesLeft + 1} blank screenshot in ${retryInterval} ms`);

            retriesLeft -= 1;

            try {
                base64 = await originTakeScreenshotFn();
            } catch (e) {
                retriesLeft = 0;

                debug(`Failed to make screenshot after blank screenshot: ${e}`);
            }
        }

        return base64;
    }
};
