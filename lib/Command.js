const Options = require('./Options');
const DropboxBackupDir = require("./DropboxBackupDir")
const path = require('path')
const MUST_LOG_INFO = false;

class Command {
  constructor() {
    this.dbd = new DropboxBackupDir();
  }

  logOutput(result) {
    if (result.stdout) { console.info('stdout:', result.stdout); }
    if (result.stderr) { console.error('stderr:', result.stderr); }
  }

  logSuccess(success) {
    this.logOutput(success);
    if (success.message && success.fullFileName) {
      console.info(`OK ${success.message} - local dump:${success.fullFileName}`);
    } else if (success.message) {
      console.info(`OK ${success.message}`);
    } else {
      console.info(`OK ${JSON.stringify(success, null, 4)}`);
    }
  }

  logError(err) {
    // DEBUG // console.error(JSON.stringify(err));
    if (err && err.status) {
        console.error(`Error ${err.status} ${JSON.stringify(err.error, null, 4)}`);
    } else if (err && err.message) {
      console.error(`Error ${err.message}`);
    } else if (err && err.text) {
      console.error(`Error ${err.text}`);
    } else {
      console.error(`Error ${JSON.stringify(err, null, 4)}`);
    }
    this.logOutput(err);
  }

  /**
   * pick filename only from full file+path string
   */
  filenameOnly(fullName) {
      return fullName ? fullName.substring(fullName.lastIndexOf(path.sep) + 1, fullName.length) : '';
  }

  /**
   * help user on usage
   */
  printUsage() {
    var launchCmd = this.filenameOnly(process.argv[0]) + ' ' + this.filenameOnly(process.argv[1]);
    console.log('Usage:\t' + launchCmd + ' <list|backup <directory> [<targetName>:myBackup.zip]');
  }

  doAction(action = null, args = null) {
    const cmd = this;
    if (action === 'list') {
      this.dbd.list(new Options())
              .then((listResult) => {
                if (!Array.isArray(listResult) || !listResult.length) {
                  console.log("aucun backup");
                  return;
                }
                MUST_LOG_INFO && console.log("dropbox backups :\n");
                console.log(listResult.map( r => `\t${r}\n`).join(''));
              })
              .catch(cmd.logError.bind(cmd));
      return;
    }
    if (action === 'backup' && (args === null || args.length < 1)) {
      this.printUsage();
      return;
    }
    if (action === 'backup') {
      this.dbd.backup(new Options(), process.cwd() + '/' + args[0], args[1] || 'myBackup.zip')
              .then((backupResult) => {
                 cmd.logSuccess(`Backup done ${backupResult.uploadResult.size}o - path:${backupResult.uploadResult.path_display}`)
              })
              .catch(cmd.logError.bind(cmd));
      return;
    }
    this.printUsage();
  }

}

module.exports = Command;