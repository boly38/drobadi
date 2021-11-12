# drobadi

Dropbox backup directory

A NodeJS tool to 
- zip a directory and create backup onto Dropbox, 
- list backups, 
- or download a backup.

[![NPM](https://nodei.co/npm/drobadi.png?compact=true)](https://npmjs.org/package/drobadi)


## Command line usage

### Setup
**install drobadi**

```
npm install drobadi --global
```

**set your preferences**

A dropbox access token is required.

```
drobadi setup
```
_(first time only) create a drobadi config file `~/.drobadi`_

To remove this setup
```
drobadi unlink
```

### Show help
- `drobadi`

_show actions_

### Create a backup
- `drobadi backup <localDirectory> [<myBackup.zip>]`

_create a remote zip backup from local directory_

Example: zip local directory `../tmp/backup/myDir` then upload as dropbox backup `/backup/biolo.zip` 
```
drobadi backup ../tmp/backup/myDir biolo.zip
```

This action will success if the target dropbox already exists with the same zip file.

This action will fail if a different target dropbox already exists (use `forceBackup` to override it).

`backup` is the default dropbox backup target directory and may be changed using options.

### Create or override a backup
- `drobadi forceBackup <localDirectory> [<myBackup.zip>]`

### List backups

- `drobadi list`

_list remote backups_


### Download a backup

- `drobadi download <myBackup.zip> [<localFile.zip>]`

_download a remote backup into local file_

Example: download dropbox file `/backup/biolo.zip` as local file `./biolo.zip`
```
drobadi download biolo.zip
```

Example: download dropbox file `/backup/biolo.zip` as local file `/tmp/ddd.zip`
```
drobadi download biolo.zip /tmp/ddd.zip
```

## Options
Drobadi options are
- `dropboxToken` (or `DBD_DROPBOX_TOKEN` env. Default: `null`. **Mandatory**) : dropbox access token value,
- `path` (or `DBD_PATH` env. Default: `backup`) : dropbox backup directory.
- `force` (or `DBD_FORCE` env. Default: `false`) : override target backup.

Note that `drobadi setup` creates a `~/.drobadi` config file.

Options precedence: options object, or env value or config file or default value.

## How to contribute
You're not a dev ? just submit an issue (bug, improvements, questions). Or else:
* Clone
* Install deps
* Then mocha tests
```
git clone https://github.com/boly38/drobadi.git
npm install
npm run test
```
* you could also fork, feature branch, then submit a pull request.

### Services or activated bots

| badge  | name   | description  |
|--------|-------|:--------|
| ![CI/CD](https://github.com/boly38/drobadi/workflows/drobadi-ci/badge.svg) |Github actions|Continuous tests.
| [![Audit](https://github.com/boly38/drobadi/actions/workflows/audit.yml/badge.svg)](https://github.com/boly38/ndrobadi/actions/workflows/audit.yml) |Github actions|Continuous vulnerability audit.
| [![Reviewed by Hound](https://img.shields.io/badge/Reviewed_by-Hound-8E64B0.svg)](https://houndci.com)|[Houndci](https://houndci.com/)|JavaScript  automated review (configured by `.hound.yml`)|

