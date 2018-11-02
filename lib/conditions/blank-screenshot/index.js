'use strict';

const debug = require('debug')('hermione-retry-command:blank-screenshot');
const Promise = require('bluebird');

const utils = require('./utils');

module.exports = (browser, retryCount, retryInterval) => {
    const originScreenshot = browser.screenshot.bind(browser);

    const retryScreenshot = (retriesLeft, prevBase64 = null) => {
        const retryIndex = retryCount - retriesLeft + 1;

        return originScreenshot()
            .then(base64 => {
                if (!retriesLeft || (base64 && !utils.isBlankScreenshot(base64.value))) {
                    return base64;
                }

                debug(`Retrying #${retryIndex} ${base64 ? 'blank' : 'null'} screenshot in ${retryInterval} ms`);

                retriesLeft -= 1;

                if (retryInterval > 0) {
                    return Promise.delay(retryInterval).then(() => retryScreenshot(retriesLeft, base64));
                }

                return retryScreenshot(retriesLeft, base64);
            })
            .catch((e) => {
                if (retriesLeft === retryCount) {
                    throw e;
                }

                debug(`Failed to make screenshot after blank screenshot: ${e}`);

                if (!retriesLeft) {
                    if (prevBase64) {
                        return prevBase64;
                    } else {
                        throw e;
                    }
                }

                debug(`Retrying #${retryIndex} failed screenshot in ${retryInterval} ms`);

                retriesLeft -= 1;

                if (retryInterval > 0) {
                    return Promise.delay(retryInterval).then(() => retryScreenshot(retriesLeft, prevBase64));
                }

                return retryScreenshot(retriesLeft, prevBase64);
            });
    };

    browser.addCommand('screenshot', () => retryScreenshot(retryCount), true);
};
