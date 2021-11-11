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
              if (err) { return reject(err); }
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
    const dbx = getDropbox(options);
    const path = options.getDropboxPath();
    const dbxFullFilename = path + "/" + dbxFilename;
    return new Promise(async function(resolve, reject) {
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