'use strict';

const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');

module.exports = class StreamWriter {
    static create(reportPath) {
        return new StreamWriter(reportPath);
    }

    constructor(reportPath) {
        fs.ensureDirSync(reportPath);
        this._stream = fs.createWriteStream(path.join(reportPath, 'data.json'));
        this._empty = true;
    }

    write(test) {
        this._writeDelim();

        const commandRetryLogs = _.get(test, 'hermioneCtx.commandRetry.logs', []);

        if (!commandRetryLogs.length) {
            return;
        }

        const {sessionId, browserId} = test;

        const testInfo = {
            n: test.fullTitle(),
            sid: sessionId,
            bid: browserId,
            l: commandRetryLogs
        };

        this._stream.write(JSON.stringify(testInfo));
        this._empty = false;
    }

    end() {
        this._stream.end(']');
    }

    _writeDelim() {
        this._stream.write('[');

        this._writeDelim = () => {
            if (!this._empty) {
                this._stream.write(',');
            }
        };
    }
};
