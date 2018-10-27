'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');

function screenshotWithRetries(browser, originScreenshot, retryIntervals) {
    const dataTransfer = _.get(browser, 'executionContext.hermioneCtx');

    if (!dataTransfer) {
        throw new Error('Failed to get hermioneCtx');
    }

    dataTransfer.commandRetry = dataTransfer.commandRetry || {logs: []};

    const log = (msg) => {
        const fullMsg = `${moment().format()} command screenshot(): ${msg}`;

        dataTransfer.commandRetry.logs.push(fullMsg);
    };

    const isScreenshotBlank = (s) => {
        const sLen = s.length;

        // in blank screenshots there will be at least 51% of recurring 'A' chars,
        // 51% has been chosen empirically
        const blankChar = 'A';
        const blankThreshold = 0.51;

        // fast checking that screenshot is not blank by looking at chars at positions:
        // 1/2, 1/4, 3/4, 1/2 plus-minus 1
        // this works only for blankThreshold = 0.51
        // fast check reduces complexity of this algorithm to O(1) for 99.9% of screenshots

        const indexThreshold = Math.ceil(blankThreshold * sLen);
        const indexNextThreshold = Math.ceil(indexThreshold * blankThreshold);

        const notBlank = s[indexThreshold - 1] !== blankChar ||
            (s[indexNextThreshold - 1] !== blankChar && s[sLen - indexNextThreshold] !== blankChar) ||
            (s[indexNextThreshold - 1] === blankChar && s[indexThreshold - 2] !== blankChar) ||
            (s[sLen - indexNextThreshold] === blankChar && s[indexThreshold] !== blankChar);

        if (notBlank) {
            return false;
        }

        log('Screenshot is probably blank');

        // fast check has failed
        // so let's count maximum recurring blank-chars
        // algorithm complexity is O(N), where N is base64-string length
        // for blank screenshot N ~ 5000
        // (to compare, for not-blank screenshot N ~ 500 000)

        let maxCount = 0;
        const indexLimit = sLen - indexThreshold;

        for (let i = 0, count = 0, waitingBlankChar = true; i < sLen; i++) {
            if (waitingBlankChar) {
                if (s[i] === blankChar) {
                    count++;
                    waitingBlankChar = false;
                } else if (i > indexLimit) {
                    break; // no chance to get specified % of blankChar already
                }
            } else if (s[i] === blankChar) {
                count++;

                if (count >= indexThreshold) {
                    maxCount = Math.max(maxCount, count);
                    break;
                }
            } else {
                maxCount = Math.max(maxCount, count);

                waitingBlankChar = true;
                count = 0;

                if (i > indexLimit) {
                    break; // no chance to get specified % of blankChar already
                }
            }
        }

        const isBlank = (maxCount >= indexThreshold);

        log(isBlank ? 'Detected blank screenshot' : 'Screenshot is not blank');

        return isBlank;
    };

    const retryScreenshot = (retryIndex, prevBase64) => {
        const noRetriesLeft = retryIndex >= retryIntervals.length;

        const retryInterval = noRetriesLeft ? null : retryIntervals[retryIndex];

        retryIndex += 1;

        return originScreenshot()
            .then(base64 => {
                if (noRetriesLeft || (base64 && !isScreenshotBlank(base64.value))) {
                    return base64;
                }

                log(`Retrying #${retryIndex} ${base64 ? 'blank' : 'null'} screenshot in ${retryInterval} ms`);

                if (retryInterval > 0) {
                    return Promise.delay(retryInterval).then(() => retryScreenshot(retryIndex, base64));
                }

                return retryScreenshot(retryIndex, base64);
            })
            .catch((e) => {
                log(`Failed to make screenshot: ${e}`);

                if (noRetriesLeft) {
                    if (prevBase64) {
                        return prevBase64;
                    } else {
                        throw e;
                    }
                }

                log(`Retrying #${retryIndex} failed screenshot in ${retryInterval} ms`);

                if (retryInterval > 0) {
                    return Promise.delay(retryInterval).then(() => retryScreenshot(retryIndex, prevBase64));
                }

                return retryScreenshot(retryIndex, prevBase64);
            });
    };

    return retryScreenshot(0, null);
}

module.exports = (browser, retryIntervals) => {
    const originScreenshot = browser.screenshot.bind(browser);

    browser.addCommand('screenshot', () => screenshotWithRetries(browser, originScreenshot, retryIntervals), true);
};
