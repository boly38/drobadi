import fs from 'fs';
import path from "path";
import {Dropbox} from 'dropbox'; // https://www.npmjs.com/package/dropbox
import {isSet, mkdirSync} from './utils.js';

const MUST_LOG_DEBUG = process.env.DROBADI_DROPBOX_DEBUG || false;
const MUST_LOG_INFO = process.env.DROBADI_DROPBOX_VERBOSE || false;
const getDropbox = options => {
    const accessToken = options.dropboxToken;
    if (!isSet(accessToken)) {
        throw new Error("Dropbox token is not set");
    }
    return new Dropbox({accessToken});
};

export default class DDropbox {
    // https://github.com/dropbox/dropbox-sdk-js/blob/main/examples/javascript/node/basic.js
    listFromDropbox(options) {
        const dbx = getDropbox(options);
        const path = options.getDropboxPath();
        MUST_LOG_INFO && console.log(`list ${path}:`);
        return new Promise((resolve, reject) => {
            // DEBUG // console.log(`Dropbox filesListFolder ${path}:`);
            dbx.filesListFolder({path})
                .then(response => {
                    MUST_LOG_DEBUG && console.log(response.result);
                    MUST_LOG_DEBUG && console.log(response.headers);
                    const fileNames = response.result.entries
                        .filter(e => e[".tag"] === "file")
                        .map(e => e.path_lower);
                    MUST_LOG_DEBUG && console.log('response', fileNames)
                    resolve(fileNames);
                })
                .catch(filesListError => {
                    if (filesListError.code === 409) {
                        reject(new Error(`Dropbox target ${path} dont exist`));
                        return;
                    }
                    reject(filesListError);
                });
        });
    }

    // https://github.com/dropbox/dropbox-sdk-js/blob/main/examples/javascript/node/upload.js
    uploadOnDropbox(options, backupFile, dbxFilename) {
        const dbxPath = options.getDropboxPath();
        const dbxFullFilename = dbxPath + "/" + dbxFilename;
        const mode = (options.force === true) ? 'overwrite' : 'add';// {('add'|'overwrite'|'update')} // https://github.com/dropbox/dropbox-sdk-js/blob/main/lib/types.js#L2539C23-L2539C32
        MUST_LOG_DEBUG && console.log(`uploadOnDropbox file:${backupFile} to ${dbxFullFilename} mode:${mode}`);
        return new Promise((resolve, reject) => {
            fs.readFile(backupFile, (readFileError, contents) => {
                if (readFileError) {
                    return reject(readFileError);
                }
                const dbx = getDropbox(options);
                let filesUploadArgs = {"path": dbxFullFilename, mode, contents};// https://github.com/dropbox/dropbox-sdk-js/blob/main/lib/types.js#L2274
                dbx.filesUpload(filesUploadArgs)
                    .then(response => {
                        const result = response.result;
                        resolve({
                            "dropboxFile": result.path_display,
                            "dropboxFileSize": result.size,
                            "message": `backup uploaded on dropbox as ${dbxFullFilename}`
                        });
                    })
                    .catch(uploadErr => {
                        MUST_LOG_DEBUG && console.log("files/upload", JSON.stringify(uploadErr));
                        if (uploadErr.code === 409) {
                            reject(new Error(`Dropbox target ${dbxFullFilename} already exists`));
                        }
                        return reject(uploadErr);
                    })
            });
        })
    }

    // https://github.com/dropbox/dropbox-sdk-js/blob/main/examples/javascript/node/download.js
    downloadFromDropbox(options, dbxFilename, localFile) {
        if (!isSet(dbxFilename)) {
            return Promise.reject(new Error(`please provide a target dropbox filename`));
        }
        if (!isSet(localFile)) {
            return Promise.reject(new Error(`please provide a local filename`));
        }
        return new Promise((resolve, reject) => {
            MUST_LOG_DEBUG && console.log(`dbxFilename:${dbxFilename}, localFile:${localFile}`);
            const fileToDownload = this.prepareFileToUpload(dbxFilename, options);
            this.prepareLocalPath(localFile);

            MUST_LOG_DEBUG && console.log("files/download", fileToDownload);
            const dbx = getDropbox(options);
            dbx.filesDownload({"path": fileToDownload})
                .then(reponse => {
                    const responseResult = reponse.result;
                    // DEBUG // console.log(reponse.result);
                    fs.writeFileSync(localFile, responseResult.fileBinary);
                    resolve({
                        "dropboxFile": responseResult.path_display,
                        "dropboxFileSize": responseResult.size,
                        "message": `backup downloaded into ${localFile} (${responseResult.size}o)`,
                        localFile
                    });
                })
                .catch(uploadErr => {
                    MUST_LOG_DEBUG && console.log("files/download", JSON.stringify(uploadErr));
                    if (uploadErr) {
                        // remove temp zip file
                        fs.unlinkSync(localFile);
                        if (uploadErr.code === 409) {
                            reject(new Error(`Dropbox is not able to download ${fileToDownload} : ${uploadErr.error_summary})`));
                        } else {
                            reject(uploadErr);
                        }
                    }
                });

        });
    }

    prepareFileToUpload(dbxFilename, options) {
        const dbxPath = options.getDropboxPath();
        return dbxFilename.startsWith('/') ? dbxFilename : dbxPath + '/' + dbxFilename;
    }

    prepareLocalPath(localFile) {
        const localPath = localFile && path.dirname(localFile) && path.dirname(localFile) !== '' ? path.dirname(localFile) : process.cwd();
        mkdirSync(localPath);
    }
}
