import fs from 'fs';
import os from 'os';
import {isSet} from './utils.js';
import {dOptionLocalConfigFileSetup} from "./DOptionLocalConfigFile.js";

const assumeEnvPrecedence = (envValue, defaultValue) => isSet(envValue) ? envValue : defaultValue;

const HOMEDIR = os.homedir();
export const DEFAULT_CONFIG_FILE = `${HOMEDIR}/.drobadi`;
export const DEFAULT_CONFIG_FILE_FRIENDLY = '~/.drobadi';
const CONFIG_FILE = assumeEnvPrecedence(process.env.DBD_CONFIG_FILE, DEFAULT_CONFIG_FILE);

let optionConfig = null;
try {
    const configJsonString = fs.readFileSync(CONFIG_FILE);
    optionConfig = JSON.parse(configJsonString);
    optionConfig.configFile = CONFIG_FILE;
} catch (err) {
}

export default class DOptions {
    constructor(options) {
        const opt = options || {};
        this.description = "this is options for node package 'drobadi'";
        // legacy // deprecated
        this.dropboxToken = assumeOptionPrecedence(opt, "dropboxToken", process.env.DBD_DROPBOX_TOKEN, null);// deprecated // dropbox application access token value
        this.dropboxTokenDisableWarning = assumeOptionPrecedence(opt, "dropboxTokenDisableWarning", process.env.DBD_DROPBOX_TOKEN_DISABLE_WARNING, "false");

        // DEV // console.log("DOptions:", JSON.stringify(opt, null, 2));
        // DEV // console.log("this.dropboxToken:", this.dropboxToken);
        if (isSet(this.dropboxToken) && this.dropboxTokenDisableWarning === "false") {
            console.warn(
                "WARN : 'dropboxToken' (long-lived dropbox provided access token) option is deprecated since September 30th, 2021\n" +
                " doc : https://dropbox.tech/developers/migrating-app-permissions-and-access-tokens#retiring-legacy-tokens\n" +
                " please switch to : dropboxRefreshToken, dropboxApplicationKey, dropboxApplicationSecret\n" +
                " cf. drobadi readme for HowTo get them. This options will be removed in future drobadi version.");
        }
        // new oauth2 relying on long-lived refresh_token
        this.dropboxAppKey = assumeOptionPrecedence(opt, "dropboxAppKey", process.env.DBD_DROPBOX_APP_KEY, null);// dropbox application key
        this.dropboxAppSecret = assumeOptionPrecedence(opt, "dropboxAppSecret", process.env.DBD_DROPBOX_APP_SECRET, null);// dropbox application secret
        this.dropboxRefreshToken = assumeOptionPrecedence(opt, "dropboxRefreshToken", process.env.DBD_DROPBOX_REFRESH_TOKEN, null);// dropbox application refresh token value

        this.path = assumeOptionPrecedence(opt, "path", process.env.DBD_PATH, 'backup');// dropbox target backup directory
        this.overrideTargetBackup = assumeOptionPrecedence(opt, "overrideTargetBackup", process.env.DBD_OVERRIDE_TARGET_BACKUP, false);

    }

    getPath() {
        return ('path' in this) ? this.path : 'backup';
    }

    getDropboxPath() {
        return '/' + this.getPath();
    }

    static async setup() {
        await dOptionLocalConfigFileSetup();
    }

    static unlink() {
        fs.existsSync(CONFIG_FILE) && fs.unlinkSync(CONFIG_FILE)
    }

}

//~ private world

const assumeOptionPrecedence = (options, optionName, envValue, defaultValue) => {
    if (options && Object.keys(options).includes(optionName)) {
        return options[optionName];
    }
    if (isSet(envValue)) {
        return envValue;
    }
    if (optionConfig && Object.keys(optionConfig).includes(optionName)) {
        return optionConfig[optionName];
    }
    return defaultValue;
}
