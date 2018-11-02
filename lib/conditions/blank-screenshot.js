'use strict';

const debug = require('debug')('hermione-retry-command:blank-screenshot');
const Promise = require('bluebird');

// in blank screenshots there will be at least 51% of recurring 'A' chars,
// 51% has been chosen empirically

const BLANK_CHAR = 'A';
const BLANK_CHAR_RATIO = 0.51;

const expectedBlankCharCount = (s) => Math.ceil(s.length * BLANK_CHAR_RATIO);

const isPossiblyBlankScreenshot = (s) => {
    const c = expectedBlankCharCount(s);

    const _0_5 = c - 1;
    const _0_25 = _0_5 - Math.ceil(c / 2);
    const _0_75 = _0_5 + Math.ceil(c / 2);

    const isPossiblyBlank = (s[_0_5] === BLANK_CHAR && (s[_0_25] === BLANK_CHAR || s[_0_75] === BLANK_CHAR));

    isPossiblyBlank && debug('Screenshot is possibly blank');

    return isPossiblyBlank;
};

const isBlankScreenshot = (s) => {
    return isPossiblyBlankScreenshot(s) ? s.includes(BLANK_CHAR.repeat(expectedBlankCharCount(s))) : false;
};

module.exports = (browser, retryCount, retryInterval) => {
    const originScreenshot = browser.screenshot.bind(browser);

    const retryScreenshot = (retriesLeft, prevBase64 = null) => {
        const retryIndex = retryCount - retriesLeft + 1;

        return originScreenshot()
            .then(base64 => {
                if (!retriesLeft || (base64 && !isBlankScreenshot(base64.value))) {
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
