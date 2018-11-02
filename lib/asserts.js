'use strict';

const assertRequestedType = (name, type) => {
    type = [].concat(type);

    return (v) => {
        const result = type.some((t) => v.constructor.name === t);

        if (!result) {
            throw new Error(`"${name}" option must be: ${type.join(' or ')}, but got ${typeof v}`);
        }
    };
};

const assertBoolean = (name) => assertRequestedType(name, 'Boolean');

const assertString = (name) => assertRequestedType(name, 'String');

const assertInteger = (name) => assertRequestedType(name, 'Number');

const assertArray = (name) => assertRequestedType(name, 'Array');

const assertPositiveInteger = (name) => {
    return (v) => {
        if (typeof v !== 'number' || v <= 0) {
            throw new Error(`'${name}' must be positive integer, but got '${v}'`);
        }
    };
};

module.exports = {
    assertRequestedType,
    assertBoolean,
    assertString,
    assertInteger,
    assertArray,
    assertPositiveInteger
};
