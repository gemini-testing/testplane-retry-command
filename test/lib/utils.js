'use strict';

const {isParamIncluded, isWdioLatest} = require('../../lib/utils');

describe('utils/isParamIncluded', () => {
    it('should allow to pass matcher as a string', () => {
        const result = isParamIncluded('bar', 'bar');

        assert.isTrue(result);
    });

    describe('should return true', () => {
        it('if param is found by string', () => {
            const result = isParamIncluded(['bar'], 'bar');

            assert.isTrue(result);
        });

        it('if param is found by regular expression', () => {
            const result = isParamIncluded([/ba.*/], 'bar');

            assert.isTrue(result);
        });
    });

    describe('should return false', () => {
        it('if param is not found by string', () => {
            const result = isParamIncluded(['foo', 'baz'], 'bar');

            assert.isFalse(result);
        });

        it('if matchers are empty', () => {
            const result = isParamIncluded([], 'bar');

            assert.isFalse(result);
        });

        it('if param is empty', () => {
            const result = isParamIncluded(['foo', 'bar'], '');

            assert.isFalse(result);
        });
    });

    describe('isWdioLatest', () => {
        it('should return "true" if "overwriteCommand" method is exists', () => {
            const browser = {overwriteCommand: () => {}};

            assert.isTrue(isWdioLatest(browser));
        });

        it('should return "false" if "overwriteCommand" method is not exists', () => {
            const browser = {};

            assert.isFalse(isWdioLatest(browser));
        });
    });
});
