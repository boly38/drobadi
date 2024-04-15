import {isSet} from "./utils.js";
import fs from "fs";
import DOptions, {DEFAULT_CONFIG_FILE, DEFAULT_CONFIG_FILE_FRIENDLY} from "./DOptions.js";
import yesno from 'yesno';
import inquirer from 'inquirer';

const dropboxDeveloperSetupApplication = () => console.log(
    "please follow this instructions to create a dropbox application:\n\n" +
    "\t1) Open the following URL in your Browser, and log in using your account: https://www.dropbox.com/developers/apps (keep free default option with 2GB)\n" +
    "\t2) Go to developer center : https://www.dropbox.com/developers/apps/\n and Click on `Create App`, then select `Scoped access`, a type of access (ex. folder) and name your app to create it.\n" +
    "\t3) In the configuration, choose the app `Permissions` tab : you must check `files.content.write` and `files.content.read` and submit.\n" +
    "\t4) In the configuration, choose the app `Settings` tab : you have here 'App key' and 'App secret'.\n"
);

const dropboxDeveloperApplicationRefreshToken = () => console.log(
    "please obtains a dropbox offline long-lived refresh token for your application: you must follow HowTo from https://github.com/boly38/dropbox-refresh-token"
);

const setupOptionValueFromPrompt = (option, name, message) => {
    return new Promise(resolve => {
        const questions = [{type: 'input', name, message}];
        inquirer.prompt(questions).then(answers => {
            option[name] = answers[name];
            resolve(option);
        });
    });
}

const setupOptionDropboxRefreshToken = option => {
    dropboxDeveloperSetupApplication();
    return new Promise(resolve => {
        setupOptionValueFromPrompt(option, "dropboxAppKey", "Dropbox App key ").then(optionAppK => {
            setupOptionValueFromPrompt(optionAppK, "dropboxAppSecret", "Dropbox App secret").then(optionAppKS => {
                dropboxDeveloperApplicationRefreshToken();
                setupOptionValueFromPrompt(optionAppKS, "dropboxRefreshToken", "Dropbox Refresh Token").then(optionAppKSRT => {
                    resolve(optionAppKSRT);
                });
            });
        });
    })
}

const setupTargetConfigFile = (defaultConfigFile) => {
    return new Promise(resolve => {
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

export const dOptionLocalConfigFileSetup = async () => {
    let targetConfigFile = DEFAULT_CONFIG_FILE;
    let currentOption = new DOptions();
    if (!isSet(currentOption.dropboxToken)
        || (await yesno({
            question: 'Would you like to set dropbox application and refresh-token ? (y/n)',
            defaultValue: null
        }))) {
        currentOption = await setupOptionDropboxRefreshToken(currentOption);
    }
    if (await yesno({
        question: `Would you like to update default dropbox directory(default: ${currentOption.path}) ? (y/n)`,
        defaultValue: null
    })) {
        currentOption = await setupOptionValueFromPrompt(currentOption, "path", "Dropbox target directory");
    }
    if (await yesno({
        question: `Would you like to write drobadi config file in custom location (instead of default: ${DEFAULT_CONFIG_FILE_FRIENDLY}) ? (y/n)`,
        defaultValue: null
    })) {
        targetConfigFile = await setupTargetConfigFile(DEFAULT_CONFIG_FILE_FRIENDLY);
    }
    fs.writeFileSync(targetConfigFile, JSON.stringify(currentOption, null, 2));
    // DEBUG // console.log(currentOption);
    console.log(`${targetConfigFile} OK`);
}

// TODO : test this