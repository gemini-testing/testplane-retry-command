'use strict';

const debug = require('debug')('hermione-retry-command:blank-screenshot');
const Promise = require('bluebird');

const utils = require('./utils');

module.exports = (browser, retryCount, retryInterval) => {
    const originScreenshot = browser.screenshot.bind(browser);

    const screenshotWithRetries = async () => {
        let retriesLeft = retryCount;
        let base64;

        try {
            base64 = await originScreenshot();
        } catch (e) {
            throw e;
        }

        while (retriesLeft && utils.isBlankScreenshot(base64.value)) {
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
