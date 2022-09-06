'use strict';

const _ = require('lodash');

const isMatched = (matcher, value) => _.isRegExp(matcher) ? matcher.test(value) : _.isEqual(matcher, value);

exports.isParamIncluded = (paramMatchers, param) => {
    return _.some([].concat(paramMatchers), (paramMatcher) => isMatched(paramMatcher, param));
};
