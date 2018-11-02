'use strict';

const _ = require('lodash');

const parseConfig = require('./lib/config');
const conditions = require('./lib/conditions');
const utils = require('./lib/utils');

module.exports = (hermione, options) => {
    const pluginConfig = parseConfig(options);

    if (!pluginConfig.enabled) {
        return;
    }

    hermione.on(hermione.events.NEW_BROWSER, (browser, {browserId}) => {
        _.each(pluginConfig.rules, ({browsers, condition, retryCount, retryInterval}) => {
            if (utils.isBrowserIncluded(browsers, browserId)) {
                conditions[condition](browser, retryCount, retryInterval);
            }
        });
    });
};
