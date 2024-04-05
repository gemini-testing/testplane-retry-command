# @testplane/retry-command

## Overview

Use the `@testplane/retry-command` plugin to retry commands at low level.

## Install

```bash
npm install -D @testplane/retry-command
```

## Setup

Add the plugin to the `plugins` section of the `testplane` config:

```javascript
module.exports = {
    plugins: {
        '@testplane/retry-command': {
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
        },

        // other testplane plugins...
    },

    // other testplane settings...
}
```

### Description of configuration parameters

| **Parameter** | **Type** | **Default value** | **Description** |
| :--- | :---: | :---: | :--- |
| enabled | Boolean | true | Enable / disable the plugin. |
| rules | Array | _N/A_ | A set of rules according to which commands will be retried. Required parameter. |

### rules

The `rules` parameter is an array of objects. Each object describes a separate rule for retrying commands.

Parameters this rule consists of:

| **Parameter** | **Type** | **Default value** | **Description** |
| :--- | :---: | :---: | :--- |
| condition | String | _N/A_ | Condition to retry: _blank-screenshot_ or _assert-view-failed_. For more information, see below. |
| browsers | String/RegExp/Array | /.*/ | A list of browsers in which retries should run. |
| [retryCount | Number | 2 | The number of retries. |
| [retryInterval | Number | 100 | Delay before each retry, in ms. |
| [retryOnlyFirst | Boolean | false | Retry only the first command in the test. This option is applied only at the _assert-view-failed_ condition. |

### condition

The condition under which you need to retry. There are 2 values available:
* `blank-screenshot` &mdash; retry the low-level screenshot command [takeScreenshot][take-screenshot] if an empty screenshot is returned as a result of the command;
* `assert-view-failed` &mdash; retry testplane's high-level command `assertView` to take a screenshot if it failed.

### browsers

A list of browsers in which you need to apply low-level retries for commands. It can be set as a string (if it is one browser), a regular expression, or an array of strings/regular expressions. By default, the `browsers` parameter has the value `/.*/`, which all browsers fall under.

### retryCount

The parameter determines how many times the command needs to be retried if the condition specified in the `condition` parameter is met.

### retryInterval
  
The parameter specifies the time in milliseconds to wait before trying to repeat the command again.

_Be careful when setting a value for this parameter, as too large a value can dramatically reduce the speed of your tests._

### retryOnlyFirst

Allows to retry only the first `assertView` command in the test if the value is set to `true`. This parameter is not used for other conditions.

[@testplane/retry-command]: https://github.com/gemini-testing/testplane-retry-command
[take-screenshot]: https://webdriver.io/docs/api/webdriver/#takescreenshot
