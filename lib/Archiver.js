const fs = require('fs');
const archiver = require('archiver');
const MUST_LOG_INFO = false;
const MUST_LOG_WARN = true;

class Archiver {
  zip(outArchFile, toZipDirectory) {
    return new Promise(async function(resolve, reject) {
      const output = fs.createWriteStream(outArchFile);
      const archive = archiver('zip', { zlib: { level: 9 } }); // Sets the compression level.
      output.on('close', function() {
        MUST_LOG_INFO && console.log('info| ' + archive.pointer() + ' total bytes');
        MUST_LOG_INFO && console.log('info| archiver has been finalized and the output file descriptor has closed.');
        resolve(outArchFile);
      });
      archive.on('warning', function(err) {
        MUST_LOG_WARN && console.log('warn| ' + JSON.stringify(err));
      });
      archive.on('error', function(err) {
        reject(err);
      });
      archive.pipe(output);
      archive.directory(toZipDirectory, false);
      archive.finalize();
    });
  }
}
module.exports = Archiver;
