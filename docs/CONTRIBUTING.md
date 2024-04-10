[ < Back](../README.md)

# HowTo Contribute

Please create an [issue](https://github.com/boly38/drobadi/issues) describing your goal / qustion / bug description..

If you want to push some code :
- fork and prepare a feature-git-branch, then create a [pull request](https://github.com/boly38/drobadi/pulls) that link your issue.

# Maintainer HowTos
## HowTo release using Gren

```bash
# provide PAT with permissions to create release on current repository
export GREN_GITHUB_TOKEN=xxx
# make a release v1.0.1 with all history
gren release --data-source=prs -t "v1.0.1" --milestone-match="v1.0.1"
# overrides release v1.0.1 with history from v1.0.0
gren release --data-source=prs -t "v1.0.1..v1.0.0" --milestone-match="v1.0.1" --override
```
