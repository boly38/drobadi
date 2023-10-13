import DOptions from './DOptions.js';
import DropboxBackupDir from "./DropboxBackupDir.js";
import fs from 'fs';
import path from 'path';
const MUST_LOG_INFO = true;

const commands = ['setup',
                  'backup <directory> [<targetName>:myBackup.zip]',
                  'forceBackup <directory> [<targetName>:myBackup.zip]',
                  'list',
                  'download <myBackup.zip> [<localFile]',
                  'unlink'];
const withArgsCommands = ['backup', 'download', 'get', 'retrieve', 'forceBackup'];

export default class Command {
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
    const possibleActionsAre = `Possibles actions are:\n${commands.map(c => '\t' + c  + '\n').join('')}`
    console.log(`Usage:\t${launchCmd} <action> [<action args>]\n${possibleActionsAre}`);
  }

  async doAction(action = null, args = null) {
    const cmd = this;

    if (withArgsCommands.includes(action) && (args === null || args.length < 1)) {
      this.printUsage();
      return;
    }

    if (['list', 'ls', 'dir'].includes(action)) {
      this.dbd.list(new DOptions())
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

    if (['setup', 'install', 'config'].includes(action)) {
      await DOptions.setup();
      console.log("TIP: use 'unlink' action to remove default setup config file")
      return;
    }

    if (['unlink', 'uninstall', 'remove'].includes(action)) {
      await DOptions.unlink();
      console.log("Thanks for using drobadi.\nSuggest your idea to https://github.com/boly38/drobadi/issues !")
      return;
    }

    if (['backup', 'forceBackup'].includes(action)) {
      const opt = {};
      if ('forceBackup' === action) {
        opt.force = true;
      }
      this.dbd.backup(new DOptions(opt), process.cwd() + '/' + args[0], args[1] || 'myBackup.zip')
        .then((backupResult) => {
           cmd.logSuccess(`Backup done ${backupResult.uploadResult.size}o - path:${backupResult.uploadResult.path_display}`)
        })
        .catch(cmd.logError.bind(cmd));
      return;
    }

    if (['download', 'get', 'retrieve'].includes(action)) {
      this.dbd.download(new DOptions(), args[0], args[1])
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
