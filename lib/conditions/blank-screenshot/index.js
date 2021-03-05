'use strict';

const debug = require('debug')('hermione-retry-command:blank-screenshot');
const Promise = require('bluebird');

const utils = require('./utils');
const commonUtils = require('../../utils');

module.exports = (browser, {retryCount, retryInterval}) => {
    const originScreenshot = browser.screenshot.bind(browser);
    const isWdioLatest = commonUtils.isWdioLatest(browser);

    const screenshotWithRetries = async () => {
        let retriesLeft = retryCount;
        let base64;

        try {
            base64 = await originScreenshot();
        } catch (e) {
            throw e;
        }

        const strBase64 = isWdioLatest ? base64 : base64.value;
        while (retriesLeft && utils.isBlankScreenshot(strBase64)) {
            await Promise.delay(retryInterval);

            debug(`Retrying #${retryCount - retriesLeft + 1} blank screenshot in ${retryInterval} ms`);

            retriesLeft -= 1;

            try {
                base64 = await originScreenshot();
            } catch (e) {
                retriesLeft = 0;

                debug(`Failed to make screenshot after blank screenshot: ${e}`);
            }
        }

        return base64;
    };

    browser.addCommand('screenshot', async () => await screenshotWithRetries(), true);
};
