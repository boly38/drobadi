import fs from 'fs';
import os from 'os';
import yesno from 'yesno';
import inquirer from 'inquirer';
import {isSet} from './utils.js';

const assumeEnvPrecedence = (envValue, defaultValue) => isSet(envValue) ? envValue : defaultValue;

const HOMEDIR = os.homedir();
const DEFAULT_CONFIG_FILE = `${HOMEDIR}/.drobadi`;
const CONFIG_FILE = assumeEnvPrecedence(process.env.DBD_CONFIG_FILE, DEFAULT_CONFIG_FILE);
const CONFIG_FILE_FRIENDLY = '~/.drobadi';

const tokenSetupHelp = () => console.log("please follow the instructions:\n\n" +
    " 1) Open the following URL in your Browser, and log in using your account: https://www.dropbox.com/developers/apps (keep free default option with 2GB)\n" +
    " 2) Go to developer center : https://www.dropbox.com/developers/apps/\n and Click on `Create App`, then select `Scoped access`, a type of access (ex. folder) and name your app to create it.\n" +
    " 3) In the configuration, choose the app `Permissions` : you must check `files.content.write` and `files.content.read` and submit.\n" +
    " 4) In the configuration, choose the app `Settings` : click on the `Generate` button located under \n" +
    " the `Generated access token` section.\n\n" +
    " The generated value is your dropboxToken. Copy/paste the value here\n\n");

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
        this.dropboxToken = assumeOptionPrecedence(opt, "dropboxToken", process.env.DBD_DROPBOX_TOKEN, null);// dropbox application access token value
        this.path = assumeOptionPrecedence(opt, "path", process.env.DBD_PATH, 'backup');// dropbox target backup directory
        this.force = assumeOptionPrecedence(opt, "force", process.env.DBD_FORCE, false);// override target backup
    }

    getPath() {
        return ('path' in this) ? this.path : 'backup';
    }

    getDropboxPath() {
        return '/' + this.getPath();
    }

    static async setup() {
        await setupOptions();
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

const setupOptions = async () => {
    let targetConfigFile = CONFIG_FILE;
    let currentOption = new DOptions();
    if (!isSet(currentOption.dropboxToken)
        || (await yesno({question: 'Would you like to set dropboxToken ? (y/n)', defaultValue: null}))) {
        currentOption = await setupToken(currentOption);
    }
    if (await yesno({
        question: `Would you like to set dropbox directory(${currentOption.path}) ? (y/n)`,
        defaultValue: null
    })) {
        currentOption = await setupDropboxDirectory(currentOption);
    }
    if (await yesno({
        question: `Would you like to change drobadi config file (${CONFIG_FILE_FRIENDLY}) ? (y/n)`,
        defaultValue: null
    })) {
        targetConfigFile = await setupTargetConfigFile(CONFIG_FILE_FRIENDLY);
    }
    fs.writeFileSync(targetConfigFile, JSON.stringify(currentOption, null, 2));
    // DEBUG // console.log(currentOption);
    console.log(`${targetConfigFile} OK`);
}

const setupToken = (option) => {
    tokenSetupHelp();
    return new Promise((resolve, reject) => {
        const questions = [{type: 'input', name: 'dropboxToken', message: 'Dropbox generated token'}];
        inquirer.prompt(questions).then((answers) => {
            option.dropboxToken = answers.dropboxToken;
            resolve(option);
        });
    });
}

const setupDropboxDirectory = (option) => {
    return new Promise((resolve, reject) => {
        const questions = [{type: 'input', name: 'path', message: 'Dropbox target directory'}];
        inquirer.prompt(questions).then((answers) => {
            option.path = answers.path;
            resolve(option);
        });
    });
}

const setupTargetConfigFile = (defaultConfigFile) => {
    return new Promise((resolve, reject) => {
        const questions = [{
            type: 'input',
            name: 'configLocation',
            message: `Dropbox target config file (default is ${defaultConfigFile})`
        }];
        inquirer.prompt(questions).then(answers => {
            resolve(answers.configLocation)
        });
    });
}