import path from 'path';
import {logError, logInfo, logSuccess} from './utils.js';
import DOptions from './DOptions.js';
import DropboxBackupDirectory from "./DropboxBackupDirectory.js";
import {dOptionLocalConfigFileSetup} from "./DOptionLocalConfigFile.js";

const commands = [
    'setup',
    'backup <directory> [<targetName>:myBackup.zip]',
    'forceBackup <directory> [<targetName>:myBackup.zip]',
    'list',
    'download <myBackup.zip> [<localFile>]',
    'downloadAndUnzip <myBackup.zip> </local/path>',
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
        return new Promise((resolve, reject) => {
            this.dbd.list(new DOptions())
                .then(listResult => {
                    if (!Array.isArray(listResult) || !listResult.length) {
                        logInfo("aucun backup");
                    } else {
                        logInfo("dropbox backups :\n");
                        logInfo(listResult.map(r => `\t${r}\n`).join(''));
                    }
                    resolve();
                })
                .catch(reject);
        });
    }

    backup(overrideTargetBackup, toBackup, zipDestinationName = 'myBackup.zip') {
        return new Promise((resolve, reject) => {
            const options = overrideTargetBackup ? {overrideTargetBackup} : {};// keep classic precedence when false
            let dOptions = new DOptions(options);
            let itemToBackup = process.cwd() + '/' + toBackup;
            this.dbd.backup(dOptions, itemToBackup, zipDestinationName)
                .then(backupResult => {
                    logSuccess(`Backup done ${backupResult.uploadResult.dropboxFileSize}o - path:${backupResult.uploadResult.dropboxFile}`);
                    return Promise.resolve();
                })
                .catch(reject);
        });
    }

    download(dbxBackupFile, localFile = null) {
        return new Promise((resolve, reject) => {
            this.dbd.download(new DOptions(), dbxBackupFile, localFile)
                .then(downloadResult => {
                    logSuccess(downloadResult.downloadResult.message)
                    resolve();
                })
                .catch(reject);
        });
    }

    downloadAndUnzip(dbxBackupFile, localPath = null) {
        return new Promise((resolve, reject) => {
            this.dbd.downloadAndUnzip(new DOptions(), dbxBackupFile, localPath)
                .then(resolve)
                .catch(reject);
        });
    }

    doAction(action = null, args = null) {
        const cmd = this;
        return new Promise((resolve, reject) => {
            if (action === null || (withArgsCommands.includes(action) && (args === null || args.length < 1))) {
                return cmd.printUsage();
            }

            if (['list', 'ls', 'dir'].includes(action)) {
                return cmd.list().then(resolve).catch(reject);
            }

            if (['setup', 'install', 'config'].includes(action)) {
                dOptionLocalConfigFileSetup().catch(reject).then(() => {
                    logInfo("TIP: use 'unlink' action to remove default setup config file")
                    resolve();
                });
            } else if (['unlink', 'uninstall', 'remove'].includes(action)) {
                logInfo("Thanks for using drobadi.\nSuggest your idea to https://github.com/boly38/drobadi/issues !")
                DOptions.unlink();
                resolve();
            } else if (['backup', 'forceBackup'].includes(action)) {
                return cmd.backup(('forceBackup' === action), args[0], args[1]).then(resolve).catch(reject);
            } else if (['download', 'get', 'retrieve'].includes(action)) {
                return this.download(args[0], args[1]).then(resolve).catch(reject);
            } else if (['downloadAndUnzip'].includes(action)) {
                return this.downloadAndUnzip(args[0], args[1]).then(resolve).catch(reject);
            } else {
                // Note for Windows users: in case of path issue, set MSYS_NO_PATHCONV=1 may help.
                return this.printUsage();
            }
        });
    }

}
