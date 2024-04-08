'use strict';

const _ = require('lodash');

const parseConfig = require('./lib/config');
const conditions = require('./lib/conditions');
const utils = require('./lib/utils');

module.exports = (testplane, options) => {
    const pluginConfig = parseConfig(options);

    if (!pluginConfig.enabled) {
        return;
    }

    testplane.on(testplane.events.NEW_BROWSER, (browser, {browserId}) => {
        _.each(pluginConfig.rules, rule => {
            if (utils.isParamIncluded(rule.browsers, browserId)) {
                const applyCondition = conditions[rule.condition];

                applyCondition(browser, rule);
            }
        });
    });
};
