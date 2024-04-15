import fs from 'fs'
import path from "path"

import {isSet} from './utils.js';
import DOptions from './DOptions.js'
import DDropbox from './DDropbox.js'
import DArchiver from './DArchiver.js'

const MUST_LOG_INFO = process.env.DROBADI_BACKUP_VERBOSE === "true" || false;
const TEMP_LOCAL_FILE = '__drobadi_tmp_archive.zip';

const assumeOptions = (opt) => (opt === null || opt === undefined || !(opt instanceof DOptions)) ? new DOptions(opt) : opt;

export default class DropboxBackupDirectory {
    constructor() {
        this.dbx = new DDropbox();
        this.arch = new DArchiver();
    }

    list(opt) {
        return new Promise((resolve, reject) => {
            const options = assumeOptions(opt);
            this.dbx.listFromDropbox(options)
                .then(result => resolve(result))
                .catch(err => reject(err));
        });
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
            MUST_LOG_INFO && console.log(`zip ${outArchFile} - ${itemToBackup}`);
            dbd.arch.zip(outArchFile, itemToBackup)
                .then(zipResult => {
                    MUST_LOG_INFO && console.log(`uploadOnDropbox as ${backupZipDestinationName}`);
                    dbd.dbx.uploadOnDropbox(solvedOptions, zipResult, backupZipDestinationName)
                        .then(uploadResult => {
                            // MUST_LOG_INFO && console.log(`uploadResult - ${JSON.stringify(uploadResult)}`);
                            MUST_LOG_INFO && console.log(`zip ${itemToBackup} - upload as ${uploadResult.dropboxFile}`);
                            fs.unlinkSync(outArchFile);// remove temp zip file
                            resolve({target: itemToBackup, zipResult, uploadResult});
                        })
                        .catch(uploadError => {
                            fs.unlinkSync(outArchFile);// remove temp zip file
                            reject(uploadError);
                        })
                })
                .catch(reject)
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
                .then(downloadResult => {
                    MUST_LOG_INFO && console.log(`zip ${dbxBackupFile} - downloaded as ${downloadResult.localFile}`);
                    resolve({downloadResult});
                })
                .catch(reject)
        });
    }
}
