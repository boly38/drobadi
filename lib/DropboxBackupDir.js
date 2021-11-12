const fs = require('fs');
const path = require("path");
const Options = require('./Options')
const Dropbox = require('./Dropbox')
const Archiver = require('./Archiver')

const MUST_LOG_INFO = false;

class DropboxBackupDir {
  constructor() {
    this.dbx = new Dropbox();
    this.arch = new Archiver();
  }

  list(opt) {
    const options = assumeOptions(opt);
    const dbd = this;
    return new Promise(async function(resolve, reject) {
        const dropboxList = await dbd.dbx.listFromDropbox(options).catch(reject);
        if (dropboxList === undefined) {
          return;
        }
        return resolve(dropboxList);
    });
  }

  backup(opt, target, filename) {
    const options = assumeOptions(opt);
    const dbd = this;
    return new Promise(async function(resolve, reject) {
      if (!isSet(target) || !fs.existsSync(target)) {
        reject(`target directory '${target}' doesn’t exist`);
        return;
      }
      const outArchFile = process.cwd() + '/__dbdArch.zip';
      const zipResult = await dbd.arch.zip(outArchFile, target).catch(reject);
      if (!zipResult) {
        return;
      }
      const uploadResult = await dbd.dbx.uploadOnDropbox(options, zipResult, filename).catch(reject);
      if (uploadResult === undefined) {
        return;
      }
      MUST_LOG_INFO && console.log(`zip ${target} - upload as ${uploadResult.path_display}`);
      // remove temp zip file
      fs.unlinkSync(outArchFile);
      return resolve({target, zipResult, uploadResult});
    });
  }

  download(opt, dbxBackupFile, localFile = null) {
    const options = assumeOptions(opt);
    const dbd = this;
    return new Promise(async function(resolve, reject) {
      if (!isSet(dbxBackupFile)) {
        reject(`please provide a target dropbox backup name`);
        return;
      }
      const toGetFile = isSet(localFile) ? localFile : path.basename(dbxBackupFile);
      const downloadResult = await dbd.dbx.downloadFromDropbox(options, dbxBackupFile, toGetFile).catch(reject);
      if (downloadResult === undefined) {
        return;
      }
      MUST_LOG_INFO && console.log(`zip ${dbxBackupFile} - downloaded as ${downloadResult.localFile}`);
      return resolve({downloadResult});
    });
  }
}

//~ private world
function assumeOptions(opt) {
  if (opt === null || opt === undefined || !(opt instanceof Options)) {
    return new Options(opt);
  }
  return opt;
}

function isSet(variable) {
  return (variable !== undefined && variable !== null);
}

module.exports = DropboxBackupDir;