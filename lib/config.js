'use strict';

const {root, section, option, map} = require('gemini-configparser');

const ENV_PREFIX = 'hermione_retry_command_';
const CLI_PREFIX = '--retry-command-';

const assertRequestedType = (name, type) => {
    type = [].concat(type);

    return (v) => {
        const result = type.some((t) => v.constructor.name === t);

        if (!result) {
            throw new Error(`"${name}" option must be: ${type.join(' or ')}, but got ${typeof v}`);
        }
    };
};

const isBoolean = (name) => assertRequestedType(name, 'Boolean');

const isString = (name) => assertRequestedType(name, 'String');

const isArray = (name) => assertRequestedType(name, 'Array');

const getParser = () => {
    return root(section({
        enabled: option({
            defaultValue: true,
            parseEnv: JSON.parse,
            parseCli: JSON.parse,
            validate: isBoolean('enabled')
        }),
        rules: map(
            section({
                condition: option({
                    validate: isString('condition')
                }),
                browsers: option({
                    defaultValue: null,
                    validate: assertRequestedType(
                        'browsers',
                        ['String', 'RegExp', 'Array']
                    )
                }),
                retryIntervals: option({
                    defaultValue: [100],
                    validate: isArray('retryIntervals')
                })
            })
        ),
        path: option({
            defaultValue: 'hermione-retry-command',
            validate: isString('path')
        })
    }), {envPrefix: ENV_PREFIX, cliPrefix: CLI_PREFIX});
};

module.exports = (options) => {
    const env = process.env;
    const argv = process.argv;

    return getParser()({options, env, argv});
};
