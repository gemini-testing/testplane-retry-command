'use strict';

const {root, section, option, map} = require('gemini-configparser');
const utils = require('./utils');

const ENV_PREFIX = 'hermione_retry_command_';
const CLI_PREFIX = '--hermione-retry-command-';

const getParser = () => {
    return root(section({
        enabled: option({
            defaultValue: true,
            parseEnv: JSON.parse,
            parseCli: JSON.parse,
            validate: utils.assertBoolean('enabled')
        }),
        rules: map(
            section({
                condition: option({
                    validate: utils.assertString('condition')
                }),
                browsers: option({
                    defaultValue: /.*/,
                    validate: utils.assertRequestedType(
                        'browsers',
                        ['String', 'RegExp', 'Array']
                    )
                }),
                retryCount: option({
                    defaultValue: 2,
                    validate: utils.assertPositiveInteger('retryCount')
                }),
                retryInterval: option({
                    defaultValue: 100,
                    validate: utils.assertPositiveInteger('retryInterval')
                })
            })
        )
    }), {envPrefix: ENV_PREFIX, cliPrefix: CLI_PREFIX});
};

module.exports = (options) => {
    const env = process.env;
    const argv = process.argv;

    return getParser()({options, env, argv});
};
