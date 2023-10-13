import fs from 'fs'
import path from "path"
import DOptions from './DOptions.js'
import Dropbox from './Dropbox.js'
import Archiver from './Archiver.js'

const MUST_LOG_INFO = false;
const TEMP_LOCAL_FILE = '__drobadi_tmp_archive.zip';

export default class DropboxBackupDir {
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

  backup(options, itemToBackup, backupZipDestinationName) {
    const solvedOptions = assumeOptions(options);
    const dbd = this;
    return new Promise(async function(resolve, reject) {
      if (!isSet(itemToBackup) || !fs.existsSync(itemToBackup)) {
        reject(`target directory '${itemToBackup}' doesn’t exist`);
        return;
      }
      const outArchFile = process.cwd() + '/' + TEMP_LOCAL_FILE;
      fs.existsSync(outArchFile) && fs.unlinkSync(outArchFile);
      const zipResult = await dbd.arch.zip(outArchFile, itemToBackup).catch(reject);
      if (!zipResult) {
        return;
      }
      const uploadResult = await dbd.dbx.uploadOnDropbox(solvedOptions, zipResult, backupZipDestinationName).catch(reject);
      if (uploadResult === undefined) {
        return;
      }
      MUST_LOG_INFO && console.log(`zip ${itemToBackup} - upload as ${uploadResult.path_display}`);
      // remove temp zip file
      fs.unlinkSync(outArchFile);
      return resolve({target: itemToBackup, zipResult, uploadResult});
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
  if (opt === null || opt === undefined || !(opt instanceof DOptions)) {
    return new DOptions(opt);
  }
  return opt;
}

function isSet(variable) {
  return (variable !== undefined && variable !== null);
}