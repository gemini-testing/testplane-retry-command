'use strict';

const {root, section, option, map} = require('gemini-configparser');
const {assertBoolean, assertString, assertRequestedType, assertPositiveInteger} = require('./asserts');

const ENV_PREFIX = 'testplane_retry_command_';
const CLI_PREFIX = '--testplane-retry-command-';

const getParser = () => {
    return root(section({
        enabled: option({
            defaultValue: true,
            parseEnv: JSON.parse,
            parseCli: JSON.parse,
            validate: assertBoolean('enabled')
        }),
        rules: map(
            section({
                condition: option({
                    validate: assertString('condition')
                }),
                browsers: option({
                    defaultValue: /.*/,
                    validate: assertRequestedType(
                        'browsers',
                        ['String', 'RegExp', 'Array']
                    )
                }),
                retryOnlyFirst: option({
                    defaultValue: false,
                    validate: assertBoolean('retryOnlyFirst')
                }),
                retryCount: option({
                    defaultValue: 2,
                    validate: assertPositiveInteger('retryCount')
                }),
                retryInterval: option({
                    defaultValue: 100,
                    validate: assertPositiveInteger('retryInterval')
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
