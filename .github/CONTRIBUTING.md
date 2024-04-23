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
- execute tests and linter

### tests
* launch tests using `npm test`.

* you have a verbose mode : `DROBADI_TEST_VERBOSE=true npm test`

Think about environment setup.

### linter
*  launch lint using `npm run lint`.

About linter :
- locally ESLint 9.0 is used as dev dependencies and rely on `eslint.config.js` ([doc](https://eslint.org/docs/latest/use/configure/configuration-files))
- on GitHub PR, [HoundCi service](https://houndci.com) is triggered and rely on [`.hound.yml`](../.hound.yml) file and derived file. HoundCi is yet not compatible with 9.0 config file ([src](http://help.houndci.com/en/articles/2461415-supported-linters) - [eslint 8.0 config file doc](https://eslint.org/docs/v8.x/use/configure/configuration-files).


# Maintainers HowTos

## HowTo release using Gren

```bash
# provide PAT with permissions to create release on current repository
export GREN_GITHUB_TOKEN=your_token_here
# one time setup
npm install github-release-notes -g

# make a release v1.0.1 with all history
gren release --data-source=prs -t "v1.0.1" --milestone-match="v1.0.1"
# overrides release v1.0.1 with history from v1.0.0
gren release --data-source=prs -t "v1.0.1..v1.0.0" --milestone-match="v1.0.1" --override
```
