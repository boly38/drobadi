[ < Back](../README.md)

# Github users HowTos

## HowTo contribute

Please create an [issue](https://github.com/boly38/drobadi/issues) describing your goal / idea / question / bug description...

If you want to push some code :
- following next `HowTo push some code` guide,
- create a [pull request](https://github.com/boly38/drobadi/pulls) that link your issue using `#<issue_id>`.

## HowTo push some code

Follow this steps:
- fork the repository using Github portal.
- Clone your fork locally
- Prepare a feature branch `checkout -b my_idea`
- add some code
- double check green Unit Tests : `DROBADI_TEST_VERBOSE=true npm test`


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