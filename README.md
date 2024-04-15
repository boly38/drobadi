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
npm install drobadi@latest --global
```

**set your preferences**

A dropbox application (`dropboxAppKey`,`dropboxAppSecret`), and long-lived refresh-token (`dropboxRefreshToken`) are required.

NB: in order to understand how-to get a `refresh-token, cf [dropbox-refresh-token](https://github.com/boly38/dropbox-refresh-token)

The old-long-lived access-token (`dropboxToken`) are always supported but this method is deprecated and will be removed in futur release.

```
drobadi setup
```
_(first time only) create a drobadi config file `~/.drobadi`_

To remove this setup
```
drobadi unlink
```

NB: you could create other custom drobadi config files, and choose custom drobadi config file by using `DBD_CONFIG_FILE` env.

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
- `DBD_CONFIG_FILE=./tmp/myDrobadiConfig drobadi list`

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

## DOptions
Drobadi options are
- `dropboxAppKey` (or `DBD_DROPBOX_APP_KEY` env. Default: `null`. **Required**) : [dropbox application](https://www.dropbox.com/developers/apps/) key.
- `dropboxAppSecret` (or `DBD_DROPBOX_APP_SECRET` env. Default: `null`. **Required**) : dropbox application secret.
- `dropboxRefreshToken` (or `DBD_DROPBOX_REFRESH_TOKEN`. Default: `null`.  env. **Required**) : dropbox application [refresh-token](https://github.com/boly38/dropbox-refresh-token).
- `path` (or `DBD_PATH` env. Default: `backup`) : dropbox target directory that receive backup files.
- `overrideTargetBackup` (or `DBD_OVERRIDE_TARGET_BACKUP` env. Default: `false`) : override target backup file.

Deprecated option:
- `dropboxToken` (or `DBD_DROPBOX_TOKEN` env. Default: `null`. **DEPRECATED**) : dropbox access-token value,
- `dropboxTokenDisableWarning` (or `DBD_DROPBOX_TOKEN_DISABLE_WARNING` env. Default: `false`.*) : change-it to disable warning log.

Note that `drobadi setup` help you to create a `~/.drobadi` config file.

DOptions precedence: options object, or env value or config file or default value.


## Library use

### Install dependency

You have to import as dependency
```
npm install drobadi
```

### Define the requirements, example:
``` 
import {Drobadi, DOptions} from "drobadi";

const dOptions = new DOptions({
    "dropboxToken": 'My dropbox token is a secret',
    "path": "from-drobadi",
    "overrideTargetBackup": true
});
let drobadi = new Drobadi();
```

### create a remote backup from local directory
```
let promiseResult =  drobadi.backup(dOptions, "./myData/", "dataBack.zip")
```

### list remote backups
```
let promiseResult = drobadi.list(dOptions);
```

### Restore remote backup in current directory
```
let promiseResult = drobadi.download(dOptions, "dataBack.zip")
```

### Restore remote backup in a given local destination
```
var promiseResult = drobadi.download(dOptions, "dataBack.zip", "/home/user/incomming/restored.zip")
```

NB: you could also have a look at tests : [drobadi.test.js](tests/drobadi.test.js)


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

| badge  | name                            | description                                               |
|--------|---------------------------------|:----------------------------------------------------------|
| ![CI/CD](https://github.com/boly38/drobadi/workflows/drobadi-ci/badge.svg) | Github actions                  | Continuous tests.                                         
| [![Audit](https://github.com/boly38/drobadi/actions/workflows/audit.yml/badge.svg)](https://github.com/boly38/ndrobadi/actions/workflows/audit.yml) | Github actions                  | Continuous vulnerability audit.                           
| [![Reviewed by Hound](https://img.shields.io/badge/Reviewed_by-Hound-8E64B0.svg)](https://houndci.com)| [Houndci](https://houndci.com/) | JavaScript  automated review (configured by `.hound.yml`) |

