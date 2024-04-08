'use strict';

const debug = require('debug')('testplane-retry-command:blank-screenshot');

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

exports.isBlankScreenshot = (s) => {
    return isPossiblyBlankScreenshot(s) ? s.includes(BLANK_CHAR.repeat(expectedBlankCharCount(s))) : false;
};
