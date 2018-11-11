'use strict';

const {isBlankScreenshot} = require('../../../../lib/conditions/blank-screenshot/utils');

const screenshots = require('./screenshots');

describe('blank-screenshot/utils', () => {
    it('should detect blank screenshot', () => {
        assert.isTrue(isBlankScreenshot(screenshots['blank']));
    });

    it('should detect non-blank screenshot', () => {
        assert.isFalse(isBlankScreenshot(screenshots['non-blank']));
    });
});
