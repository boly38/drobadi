import path from 'path';
import {logInfo, logError, logSuccess} from './utils.js';
import DOptions from './DOptions.js';
import DropboxBackupDirectory from "./DropboxBackupDirectory.js";

const commands = [
    'setup',
    'backup <directory> [<targetName>:myBackup.zip]',
    'forceBackup <directory> [<targetName>:myBackup.zip]',
    'list',
    'download <myBackup.zip> [<localFile]',
    'unlink'
];
const withArgsCommands = ['backup', 'download', 'get', 'retrieve', 'forceBackup'];

export default class DCommand {
    constructor() {
        this.dbd = new DropboxBackupDirectory();
    }

    logErrorReject(err) {
        let reason;
        if (err?.status) {
            reason = `${err.status} ${JSON.stringify(err.error, null, 4)}`;
        } else if (err?.message) {
            reason = err.message;
        } else if (err?.text) {
            reason = err.text;
        } else {
            reason = JSON.stringify(err, null, 4);
        }
        logError(reason);
        return Promise.reject(reason)
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
        const possibleActionsAre = `Possibles actions are:\n${commands.map(c => '\t' + c + '\n').join('')}`
        console.log(`Usage:\t${launchCmd} <action> [<action args>]\n${possibleActionsAre}`);
        return Promise.resolve();
    }

    list() {
        this.dbd.list(new DOptions())
            .catch(this.logErrorReject)
            .then(listResult => {
                if (!Array.isArray(listResult) || !listResult.length) {
                    logInfo("aucun backup");
                    return Promise.resolve();
                } else {
                    logInfo("dropbox backups :\n");
                    logInfo(listResult.map(r => `\t${r}\n`).join(''));
                }
                return Promise.resolve();
            });
    }

    backup(force, toBackup, zipDestinationName = 'myBackup.zip') {
        let dOptions = new DOptions({force});
        let itemToBackup = process.cwd() + '/' + toBackup;
        this.dbd.backup(dOptions, itemToBackup, zipDestinationName)
            .catch(this.logErrorReject)
            .then(backupResult => {
                logSuccess(`Backup done ${backupResult.uploadResult.size}o - path:${backupResult.uploadResult.path_display}`);
                return Promise.resolve();
            });
    }

    retrieve(dbxBackupFile, localFile = null) {
        this.dbd.download(new DOptions(), dbxBackupFile, localFile)
            .catch(this.logErrorReject)
            .then(downloadResult => {
                logSuccess(downloadResult.downloadResult.message)
                return Promise.resolve();
            });
    }

    doAction(action = null, args = null) {
        const cmd = this;
        return new Promise((resolve, reject) => {
            if (action === null || (withArgsCommands.includes(action) && (args === null || args.length < 1))) {
                return cmd.printUsage();
            }

            if (['list', 'ls', 'dir'].includes(action)) {
                return cmd.list();
            }

            if (['setup', 'install', 'config'].includes(action)) {
                DOptions.setup().catch(reject).then(() => {
                    logInfo("TIP: use 'unlink' action to remove default setup config file")
                    resolve();
                });
            }

            if (['unlink', 'uninstall', 'remove'].includes(action)) {
                logInfo("Thanks for using drobadi.\nSuggest your idea to https://github.com/boly38/drobadi/issues !")
                DOptions.unlink();
                resolve();
            }

            if (['backup', 'forceBackup'].includes(action)) {
                return cmd.backup(('forceBackup' === action), args[0], args[1]);
            }

            if (['download', 'get', 'retrieve'].includes(action)) {
                return this.retrieve(args[0], args[1]);
            }

            // Note for Windows users: pin case of path issue, set MSYS_NO_PATHCONV=1 may help.
            return this.printUsage();
        });
    }

}
