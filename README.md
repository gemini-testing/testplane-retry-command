# hermione-retry-command [![Build Status](https://travis-ci.org/gemini-testing/hermione-retry-command.svg?branch=master)](https://travis-ci.org/gemini-testing/hermione-retry-command)
Plugin for [hermione](https://github.com/gemini-testing/hermione) to retry commands at low level

You can read more about hermione plugins [here](https://github.com/gemini-testing/hermione#plugins).

## Installation

```bash
npm install hermione-retry-command
```

## Usage

### Configuration

Plugin has the following configuration:

* **enabled** (optional) `Boolean` – enable/disable the plugin; by default the plugin is enabled
* **rules** (required) `Array` – describes set of conditions for which retries should run
  * **condition** (required) `String` – see `lib/conditions` for available retry conditions
  * **browsers** (optional) `String|RegExp|Array<String|RegExp>` – browsers in which retries should run, by default is null that means retries should run in all browsers
  * **retryIntervals** (optional) `Array` – defines delays in ms before each retry, so the number of delays in this array defines the number of retries. By default `retryIntervals` is set to [100] that means that only one retry should be done in 100 ms after failed command. Be careful when setting retry intervals as this can affect performance of your tests dramatically by downgrading it.
* **path** (optional) `String` – a path to the plugin's folder to log commands that were retried. By default the path is `hermione-retry-command`. Log messages are written to `data.js` file in the given folder.

Also you can override plugin parameters by CLI options or environment variables (see [configparser](https://github.com/gemini-testing/configparser)). Use `hermione_retry_command_` prefix for the environment variables and `--hermione-retry-command-` for the cli options.

### Hermione usage

Add plugin to your `hermione` config file:

```js
module.exports = {
    // ...
    system: {
        plugins: {
            'hermione-retry-command': {
                enabled: true,
                rules: [
                    {
                        condition: 'blank-screenshot',
                        browsers: ['chrome'],
                        retryIntervals: [100, 150]
                    }
                ],
                path: 'hermione-retry-command'
            }
        }
    },
    //...
}
```

## Testing

Run [mocha](http://mochajs.org) tests:
```bash
npm run test-unit
```

Run [eslint](http://eslint.org) codestyle verification
```bash
npm run lint
```
