import fs from 'fs';
import path from "path";
import {Dropbox} from 'dropbox'; // https://www.npmjs.com/package/dropbox
import {isSet, mkdirSync, unlinkIfExists} from './utils.js';

import {refreshAccessToken, isAccessTokenValid} from "dropbox-refresh-token";

const MUST_LOG_DEBUG = process.env.DROBADI_DROPBOX_DEBUG === "true" || false;
const MUST_LOG_INFO = process.env.DROBADI_DROPBOX_VERBOSE  === "true"|| false;

const getDropbox = options => {
    return new Promise((resolve, reject) => {
        const {
            dropboxToken: accessToken,// keep legacy token
            dropboxRefreshToken, dropboxAppKey, dropboxAppSecret, // current way to proceed
            freshAccessToken // accessToken: set when already retrieved from current session
        } = options;
        if (MUST_LOG_DEBUG && isSet(freshAccessToken)) {
            console.log("we will reuse access-token")
        }
        const currentAccessToken = isSet(freshAccessToken) ? freshAccessToken : accessToken;
        isAccessTokenValid(currentAccessToken).then(result => {
            const {isValid, info} = result;
            if (isValid) {
                if (MUST_LOG_DEBUG) {
                    console.log(`use valid access-token from ${info.email}`)
                }
                resolve(new Dropbox({"accessToken": currentAccessToken}));
            }
        }).catch(rejectResult => {
            const {isValid, error} = rejectResult;
            MUST_LOG_DEBUG && console.log(`isValid:${isValid} error:${error} - so dropboxRefreshAccessToken`);
            if (!isSet(dropboxRefreshToken) || !isSet(dropboxAppKey) || !isSet(dropboxAppSecret)) {
                reject(new Error("to refresh a dropbox access token, following options are required: dropboxRefreshToken, dropboxAppKey, dropboxAppSecret"));
                return;
            }
            refreshAccessToken(dropboxRefreshToken, dropboxAppKey, dropboxAppSecret)
                .then(freshAccessToken => {
                    options.freshAccessToken = freshAccessToken;
                    resolve(new Dropbox({"accessToken": freshAccessToken}))
                })
                .catch(err => reject(err))
        });
    })
}

export default class DDropbox {
    // https://github.com/dropbox/dropbox-sdk-js/blob/main/examples/javascript/node/basic.js
    listFromDropbox(options) {
        return new Promise((resolve, reject) => {
            getDropbox(options).then(dbx => {
                const path = options.getDropboxPath();
                MUST_LOG_INFO && console.log(`list ${path}:`);
                // DEBUG // console.log(`Dropbox filesListFolder ${path}:`);
                dbx.filesListFolder({path})
                    .then(response => {
                        MUST_LOG_DEBUG && console.log(response.result);
                        MUST_LOG_DEBUG && console.log(response.headers);
                        const fileNames = response.result.entries
                            .filter(e => e[".tag"] === "file")
                            // remove prefix
                            .map(e => e.path_lower)
                            .map(e => { return e.startsWith(path) ? e.substring(path.length+1) : e; })
                        ;
                        MUST_LOG_DEBUG && console.log('response', fileNames)
                        resolve(fileNames);
                    })
                    .catch(filesListError => {
                        MUST_LOG_DEBUG && console.log('filesListError', filesListError)
                        const {status, error} = filesListError;
                        if (status === 409) {
                            reject(new Error(`Dropbox target '${path}' dont exist`));
                            return;
                        }
                        const errorMessage = `list ${path}: [status:${status}] ${error?.error_summary}`;
                        reject(new Error(errorMessage));
                    });
            }).catch(err => reject(err));

        });
    }

    // https://github.com/dropbox/dropbox-sdk-js/blob/main/examples/javascript/node/upload.js
    uploadOnDropbox(options, backupFile, dbxFilename) {
        return new Promise((resolve, reject) => {
            const dbxPath = options.getDropboxPath();
            const dbxFullFilename = dbxPath + "/" + dbxFilename;
            const mode = (options.force === true) ? 'overwrite' : 'add';// {('add'|'overwrite'|'update')} // https://github.com/dropbox/dropbox-sdk-js/blob/main/lib/types.js#L2539C23-L2539C32
            MUST_LOG_DEBUG && console.log(`uploadOnDropbox file:${backupFile} to ${dbxFullFilename} mode:${mode}`);
            fs.readFile(backupFile, (readFileError, contents) => {
                if (readFileError) {
                    return reject(readFileError);
                }
                getDropbox(options).then(dbx => {
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
                            const {status, error} = uploadErr;
                            if (status === 409) {
                                reject(new Error(`Dropbox target ${dbxFullFilename} already exists`));
                            }
                            if (error) {
                                const {error_summary} = error;
                                const errorMessage = `upload ${dbxFullFilename}: [status:${status}] ${error_summary}`;
                                reject(new Error(errorMessage));
                            }
                        })
                }).catch(err => reject(err));
            });
        })
    }

    // https://github.com/dropbox/dropbox-sdk-js/blob/main/examples/javascript/node/download.js
    downloadFromDropbox(options, dbxFilename, localFile) {
        return new Promise((resolve, reject) => {
            if (!isSet(dbxFilename)) {
                return reject(new Error(`please provide a target dropbox filename`));
            }
            if (!isSet(localFile)) {
                return reject(new Error(`please provide a local filename`));
            }
            MUST_LOG_DEBUG && console.log(`dbxFilename:${dbxFilename}, localFile:${localFile}`);
            const fileToDownload = this.prepareFileToUpload(dbxFilename, options);
            this.prepareLocalPath(localFile);

            MUST_LOG_DEBUG && console.log("files/download", fileToDownload);
            getDropbox(options).then(dbx => {
                dbx.filesDownload({"path": fileToDownload})
                    .then(response => {
                        // DEBUG // console.log(response.result);
                        const {path_display: dropboxFile, size: dropboxFileSize, fileBinary} = response.result;
                        fs.writeFileSync(localFile, fileBinary);
                        resolve({
                            dropboxFile,
                            dropboxFileSize,
                            "message": `backup downloaded into ${localFile} (${dropboxFileSize}o)`,
                            localFile
                        });
                    })
                    .catch(uploadErr => {
                        MUST_LOG_DEBUG && console.log("files/download", JSON.stringify(uploadErr));
                        const {status, error} = uploadErr;
                        if (error) {
                            const {error_summary} = error;
                            unlinkIfExists(localFile);// remove temp zip file
                            if (status === 409 && fileToDownload.includes("/C:/")) {
                                reject(new Error(`Dropbox is not able to download ${fileToDownload} : ${error_summary} `+
                                `\n\t-TIP- the file path is strange, you may type only filename to download without directory`));
                            } else if (status === 409) {
                                reject(new Error(`Dropbox is not able to download ${fileToDownload} : ${error_summary}`));
                            } else {
                                const errorMessage = `download ${fileToDownload}: [status:${status}] ${error_summary}`;
                                reject(new Error(errorMessage));
                            }
                        }
                    });
            }).catch(err => reject(err));

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
