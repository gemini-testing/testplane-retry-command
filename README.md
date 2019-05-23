# hermione-retry-command [![Build Status](https://travis-ci.org/gemini-testing/hermione-retry-command.svg?branch=master)](https://travis-ci.org/gemini-testing/hermione-retry-command)
Plugin for [hermione](https://github.com/gemini-testing/hermione) to retry commands at low level.

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
  * **condition** (required) `String`
    * set `blank-screenshot` to retry screenshot commands that return blank screenshots
    * set `assert-view-failed` to retry assertView command if it has failed
  * **browsers** (optional) `String|RegExp|Array<String|RegExp>` – browsers in which retries should run, by default is `/.*/` that means retries should run in all browsers
  * **retryCount** (optional) `Integer` – defines the number of retries. By default `retryCount` is set to `2`
  * **retryInterval** (optional) `Integer` – defines delay in milliseconds before each retry. By default `retryInterval` is set to `100`. Be careful when setting retry interval as this can dramatically downgrade performance of your tests.
  * **retryOnlyFirst** (optional, only for `'assert-view-failed'`) `Boolean` – defines the plugin operation limit for the first call command in the test. By default `retryOnlyFirst` is set to `false`.

Also you can override plugin parameters by CLI options or environment variables (see [configparser](https://github.com/gemini-testing/configparser)). Use `hermione_retry_command_` prefix for the environment variables and `--hermione-retry-command-` for the cli options.

### Hermione usage

Add plugin to your `hermione` config file:

```js
module.exports = {
    // ...
    plugins: {
        'hermione-retry-command': {
            enabled: true,
            rules: [
                {
                    condition: 'blank-screenshot',
                    browsers: ['MicrosoftEdge'],
                    retryCount: 5,
                    retryInterval: 120
                },
                {
                    condition: 'assert-view-failed',
                    browsers: ['Chrome'],
                    retryCount: 1,
                    retryOnlyFirst: true
                }
            ]
        }
    }
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
