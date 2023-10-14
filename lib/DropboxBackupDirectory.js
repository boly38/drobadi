import fs from 'fs'
import path from "path"

import {isSet} from './utils.js';
import DOptions from './DOptions.js'
import DDropbox from './DDropbox.js'
import DArchiver from './DArchiver.js'

const MUST_LOG_INFO = false;
const TEMP_LOCAL_FILE = '__drobadi_tmp_archive.zip';

const assumeOptions = (opt) => (opt === null || opt === undefined || !(opt instanceof DOptions)) ? new DOptions(opt) : opt;

export default class DropboxBackupDirectory {
    constructor() {
        this.dbx = new DDropbox();
        this.arch = new DArchiver();
    }

    list(opt) {
        const options = assumeOptions(opt);
        return this.dbx.listFromDropbox(options);
    }

    backup(options, itemToBackup, backupZipDestinationName) {
        if (!isSet(itemToBackup) || !fs.existsSync(itemToBackup)) {
            return Promise.reject(new Error(`target directory '${itemToBackup}' dont exist`));
        }
        const solvedOptions = assumeOptions(options);
        const dbd = this;
        return new Promise((resolve, reject) => {
            const outArchFile = process.cwd() + '/' + TEMP_LOCAL_FILE;
            fs.existsSync(outArchFile) && fs.unlinkSync(outArchFile);
            dbd.arch.zip(outArchFile, itemToBackup)
                .catch(reject)
                .then(zipResult => {
                    dbd.dbx.uploadOnDropbox(solvedOptions, zipResult, backupZipDestinationName)
                        .catch(uploadError => {
                            fs.unlinkSync(outArchFile);// remove temp zip file
                            reject(uploadError);
                        })
                        .then(uploadResult => {
                            MUST_LOG_INFO && console.log(`zip ${itemToBackup} - upload as ${uploadResult.path_display}`);
                            fs.unlinkSync(outArchFile);// remove temp zip file
                            resolve({target: itemToBackup, zipResult, uploadResult});
                        })
                })
        });
    }

    download(opt, dbxBackupFile, localFile = null) {
        if (!isSet(dbxBackupFile)) {
            return Promise.reject(new Error(`please provide a target dropbox backup name`));
        }
        const options = assumeOptions(opt);
        const dbd = this;
        return new Promise((resolve, reject) => {
            const toGetFile = isSet(localFile) ? localFile : path.basename(dbxBackupFile);
            dbd.dbx.downloadFromDropbox(options, dbxBackupFile, toGetFile)
                .catch(reject)
                .then(downloadResult => {
                    MUST_LOG_INFO && console.log(`zip ${dbxBackupFile} - downloaded as ${downloadResult.localFile}`);
                    resolve({downloadResult});
                })
        });
    }
}
