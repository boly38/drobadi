[ < Back](../README.md)

# Github users HowTos


## HowTo contribute

Please create an [issue](https://github.com/boly38/drobadi/issues) describing your goal / idea / question / bug description...

If you want to push some code :
- following next `HowTo push some code` guide,
- create a [pull request](https://github.com/boly38/drobadi/pulls) that link your issue using `#<issue_id>`.


## HowTo push some code

Follow this steps:
- fork the repository using GitHub portal.
- Clone your fork locally
- Prepare a feature branch `checkout -b my_idea`
- add some code
- assume environment setup is set (via  dedicated [initEnv](../env/initEnv.template.sh))
- execute tests and linter

### tests

* launch tests using `pnpm test`.
* launch tests in verbose mode : `export DROBADI_TEST_VERBOSE=true && pnpm test`

### linter
*  launch lint using `pnpm lint`.

About linter :
- locally ESLint 9.37.0 is used as dev dependencies and rely on `eslint.config.js` ([doc](https://eslint.org/docs/latest/use/configure/configuration-files))
- on GitHub PR, [HoundCi service](https://houndci.com) is triggered and rely on [`.hound.yml`](../.hound.yml) file and derived file.

(TO BE REFRESHED) HoundCi is yet not compatible with 9.0 config file ([src](http://help.houndci.com/en/articles/2461415-supported-linters) - [eslint 8.0 config file doc](https://eslint.org/docs/v8.x/use/configure/configuration-files).


# Maintainers HowTos

## HowTo create a fresh version
- use patch or minor or major workflow

this will make a new version and on version tag, the main ci workflow will push a new npmjs version too.

## HowTo release using `gh`

Install and create automatically a draft release version using [gh client](https://cli.github.com/)
- the version tag must exist

Example to create v1.1.4
```bash
gh release create v1.1.4 --draft --generate-notes
```
this will make a new draft release. Verify it in [releases list](https://github.com/boly38/botEnSky/releases)

- ⚠️ the repository apply immutable releases since #65 (v1.1.4) and above, so you can't modify a release once published
- publish the release when ready