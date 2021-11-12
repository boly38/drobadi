const Options = require('./Options');
const DropboxBackupDir = require("./DropboxBackupDir");
const fs = require('fs');
const path = require('path');
const MUST_LOG_INFO = true;

class Command {
  constructor() {
    this.dbd = new DropboxBackupDir();
  }

  logSuccess(success) {
    console.info(`OK ${success}`);
  }

  logError(err) {
    if (err && err.status) {
      console.error(`Error ${err.status} ${JSON.stringify(err.error, null, 4)}`);
    } else if (err && err.message) {
      console.error(`Error ${err.message}`);
    } else if (err && err.text) {
      console.error(`Error ${err.text}`);
    } else {
      console.error(`Error ${JSON.stringify(err, null, 4)}`);
    }
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
    const launchCmd = this.filenameOnly(process.argv[0]) + ' ' + this.filenameOnly(process.argv[1]);
    const commands = ['setup',
                      'backup <directory> [<targetName>:myBackup.zip]',
                      'list',
                      'download </backup/myBackup.zip> [<targetUnzipDirectory]',
                      'unlink'];
    const possibleActionsAre = `Possibles actions are:\n${commands.map(c => '\t' + c  + '\n').join('')}`
    console.log(`Usage:\t${launchCmd} <action> [<action args>]\n${possibleActionsAre}`);
  }

  async doAction(action = null, args = null) {
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
    if (action === 'setup') {
      await Options.setup();
      console.log("Use 'unlink' action to remove setup config file")
      return;
    }
    if (action === 'unlink') {
      await Options.unlink();
      console.log("Thanks for using drobadi.\nSuggest your idea to https://github.com/boly38/drobadi/issues !")
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
    if (action === 'download') {
      this.dbd.download(new Options(), args[0], args[1])
              .then((downloadResult) => {
                 MUST_LOG_INFO && cmd.logSuccess(downloadResult.downloadResult.message)
              })
              .catch(cmd.logError.bind(cmd));
      return;
    }
    // Note for Windows users: pin case of path issue, set MSYS_NO_PATHCONV=1 may help.
    this.printUsage();
  }

}

module.exports = Command;