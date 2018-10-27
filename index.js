'use strict';

const _ = require('lodash');

const parseConfig = require('./lib/config');
const StreamWriter = require('./lib/stream-writer');

const isMatched = (matcher, value) => _.isRegExp(matcher) ? matcher.test(value) : _.isEqual(matcher, value);

const isBrowserIncluded = (browserMatchers, browserId) => {
    return _.isNull(browserMatchers) ||
        _.some([].concat(browserMatchers), (browserMatcher) => isMatched(browserMatcher, browserId));
};

module.exports = (hermione, options) => {
    const pluginConfig = parseConfig(options);

    if (!pluginConfig.enabled) {
        return;
    }

    let writeStream;

    hermione.on(hermione.events.RUNNER_START, () => {
        writeStream = StreamWriter.create(pluginConfig.path);
    });

    hermione.on(hermione.events.NEW_BROWSER, (browser, {browserId}) => {
        _.each(pluginConfig.rules, ({browsers, condition, retryIntervals}) => {
            if (isBrowserIncluded(browsers, browserId)) {
                require(`./lib/conditions/${condition}.js`)(browser, retryIntervals);
            }
        });
    });

    hermione.on(hermione.events.TEST_END, (test) => {
        if (test.pending) {
            return;
        }

        writeStream.write(test);
    });

    hermione.on(hermione.events.ERROR, () => writeStream.end());

    hermione.on(hermione.events.RUNNER_END, () => {
        writeStream.end();
    });
};
