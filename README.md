# drobadi

Dropbox backup directory - NodeJS tool to zip a directory and create backup onto Dropbox.

[![NPM](https://nodei.co/npm/drobadi.png?compact=true)](https://npmjs.org/package/drobadi)

Features :
- `drobadi backup <localDirectory> [<myBackup.zip>]`

_create a remote zip backup from local directory_

- `drobadi list` 

_list remote backups_


## Command line usage

### Create a Dropbox application and access token
First time you want to use this script, please follow the instructions:

1) Open the following URL in your Browser, and log in using your account: https://www.dropbox.com/developers/apps
2) Click on `Create App`, then select `Scoped access`, a type of access (ex. folder) and name your app to create it.
3) In the configuration, choose the app `Permissions` : you must check `files.content.write` and `files.content.read` and submit.
4) In the configuration, choose the app `Settings` : click on the `Generate` button located under 
the `Generated access token` section.

Copy the generated value from step 4). This is the token you must use for the next step.

### Setup
**install drobadi**

```
npm install drobadi --global
```

**set your preferences**

A dropbox access token in required.

```
# linux
export DBD_DROPBOX_TOKEN=myDropboxGeneratedAccessTokenValueHere
# windows
set DBD_DROPBOX_TOKEN=myDropboxGeneratedAccessTokenValueHere
```



### Basic feature

 - show help
```
drobadi
```

 - list backups
```
drobadi list
```

 - create a dropbox backup 'biolo.zip' from local directory '../tmp/backup/myDir'
```
drobadi backup ../tmp/backup/myDir biolo.zip
```

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

