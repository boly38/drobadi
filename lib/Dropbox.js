const fs = require('fs');
const path = require("path");
const dropboxV2Api = require('dropbox-v2-api');
const MUST_LOG_DEBUG = false;
const MUST_LOG_INFO = false;

class Dropbox {
  // https://www.dropbox.com/developers/documentation/http/documentation#files-list_folder
  listFromDropbox(options) {
    return new Promise(async function(resolve, reject) {
      try {
          const dbx = getDropbox(options);
          const path = options.getDropboxPath();
          MUST_LOG_INFO && console.log(`list ${path}:`);
          dbx({
              resource: 'files/list_folder',
              parameters: getDbxListFileFromPathParam(path)
          }, (err, result, response) => {
              if (err) {
                if (err.code === 409) {
                  reject(`Dropbox target ${path} doesn’t exist`);
                  return;
                }
                reject(err);
                return;
              }
              MUST_LOG_DEBUG && console.log(result);
              MUST_LOG_DEBUG && console.log(response.headers);
              const fileNames = result.entries
                                      .filter(e => e[".tag"] === "file")
                                      .map(e=>e.path_lower);
              MUST_LOG_DEBUG && console.log('response', fileNames)
              resolve(fileNames);
          });
      } catch (err) {
        reject(err);
      }
    });
  }

  // https://www.npmjs.com/package/dropbox-v2-api
  // https://www.dropbox.com/developers/documentation/http/documentation#files-upload
  uploadOnDropbox(options, backupFile, dbxFilename) {
    return new Promise(async function(resolve, reject) {
      const dbx = getDropbox(options);
      const dbxPath = options.getDropboxPath();
      const dbxFullFilename = dbxPath + "/" + dbxFilename;
      MUST_LOG_DEBUG && console.log(`uploadOnDropbox file:${backupFile} to ${dbxFullFilename}`);
      dbx({
          resource: 'files/upload',
          parameters: {
              path: dbxFullFilename
          },
          readStream: fs.createReadStream(backupFile)
      }, (err, result, response) => {
        MUST_LOG_DEBUG && console.log("files/upload", JSON.stringify(err), JSON.stringify(result), JSON.stringify(response));
        if (err) {
          if (err.code === 409) {
            reject(`Dropbox target ${dbxFullFilename} already exists`);
          }
          return reject(err);
        }
        result.dropboxFile = result.path_display;
        result.dropboxFileSize = result.size;
        result.message = `backup uploaded on dropbox as ${dbxFullFilename}`;
        resolve(result);
      });
    });
  }


  // https://www.npmjs.com/package/dropbox-v2-api
  // https://www.dropbox.com/developers/documentation/http/documentation#files-download
  downloadFromDropbox(options, dbxFilename, localFile) {
    if (!isSet(dbxFilename)) {
      return Promise.reject(`please provide a target dropbox filename`);
    }
    if (!isSet(localFile)) {
      return Promise.reject(`please provide a local filename`);
    }
    return new Promise(async function(resolve, reject) {
      const dbx = getDropbox(options);
      const dbxPath = options.getDropboxPath();
      MUST_LOG_DEBUG && console.log(`dbxFilename:${dbxFilename}, localFile:${localFile}`);
      const fileToDownload = dbxFilename.startsWith('/') ? dbxFilename : dbxPath + '/' + dbxFilename;
      const localPath = localFile && path.dirname(localFile) && path.dirname(localFile) !== '' ? path.dirname(localFile) : process.cwd();
      // create path if not exist
      if (!fs.existsSync(localPath)) {
        await fs.promises.mkdir(localPath, { recursive: true })
          .catch((err) => {
            return reject({ error: 'INVALID_OPTIONS', message: 'path: cannot create ' + localPath + ' :' + err });
          });
      }
      MUST_LOG_DEBUG && console.log("files/download", fileToDownload);
      dbx({
          resource: 'files/download',
          parameters: {
              path: fileToDownload
          }
      }, (err, result, response) => {
          MUST_LOG_DEBUG && console.log("files/download", JSON.stringify(err), JSON.stringify(result), JSON.stringify(response));
          if (err) {
            // remove temp zip file
            fs.unlinkSync(localFile);
            if (err.code === 409) {
              reject(`Dropbox is not able to download ${fileToDownload} : ${err.error_summary}`);
            } else {
              reject(err);
            }
            return;
          }
          result.dropboxFile = result.path_display;
          result.dropboxFileSize = result.size;
          result.message = `backup downloaded into ${localFile} (${result.size}o)`;
          result.localFile = localFile;
          resolve(result);
      })
      .pipe(fs.createWriteStream(localFile));
    });
  }
}

//~ private

//https://www.dropbox.com/developers/documentation/http/documentation#files-list_folder
function getDbxListFileFromPathParam(path) {
  return {path, "recursive":false, limit: 2000, include_non_downloadable_files: false};
}

function getDropbox(options) {
  const token = options.dropboxToken;
  if (!isSet(token)) {
    throw "Dropbox token is not set";
  }
  return dropboxV2Api.authenticate({ token: options.dropboxToken });
}

function isSet(variable) {
  return (variable !== undefined && variable !== null);
}


module.exports = Dropbox;