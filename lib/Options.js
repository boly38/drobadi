const fs = require('fs');
const yesno = require('yesno');
const prompt = require('prompt');
const HOMEDIR = require('os').homedir();
const CONFIG_FILE = `${HOMEDIR}/.drobadi`;
const CONFIG_FILE_FRIENDLY = '~/.drobadi';

const tokenSetupHelp = "please follow the instructions:\n\n"+
        " 1) Open the following URL in your Browser, and log in using your account: https://www.dropbox.com/developers/apps\n"+
        " 2) Click on `Create App`, then select `Scoped access`, a type of access (ex. folder) and name your app to create it.\n"+
        " 3) In the configuration, choose the app `Permissions` : you must check `files.content.write` and `files.content.read` and submit.\n"+
        " 4) In the configuration, choose the app `Settings` : click on the `Generate` button located under \n"+
        " the `Generated access token` section.\n\n"+
        " The generated value is your dropboxToken. Copy/paste the value here\n\n";

var optionConfig = null;
try {
  const configJsonString = fs.readFileSync(CONFIG_FILE);
  optionConfig = JSON.parse(configJsonString);
} catch (err) {
}

class Options {
  constructor(options) {
    const opt = options ? options : {};
    this.description= "this is options for node package 'drobadi'";
    this.dropboxToken = assumeOptionPrecedence(opt, "dropboxToken", process.env.DBD_DROPBOX_TOKEN, null);// dropbox application access token value
    this.path         = assumeOptionPrecedence(opt, "path", process.env.DBD_PATH, 'backup');// dropbox target backup directory
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
function isSet(variable) {
  return (variable !== undefined && variable !== null);
}


function assumeOptionPrecedence(options, optionName, envValue, defaultValue) {
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

async function setupOptions() {
  var currentOption = new Options();
  if (!isSet(currentOption.dropboxToken)
    || (await yesno({ question: 'Would you like to set dropboxToken ? (y/n)', defaultValue: null }))) {
    currentOption = await setupToken(currentOption);
  }
  if (await yesno({ question: `Would you like to set dropbox directory(${currentOption.path}) ? (y/n)`, defaultValue: null })) {
    currentOption = await setupDropboxDirectory(currentOption);
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentOption, null, 2));
  // DEBUG // console.log(currentOption);
  console.log(`${CONFIG_FILE_FRIENDLY} OK`);
}

async function setupToken(option) {
  return new Promise(async function(resolve, reject) {
    prompt.get([{ name: 'dropboxToken', description: tokenSetupHelp + 'Dropbox generated token', type: 'string', required: true }],
        function(err, results) {
            if (err) {
              reject(err);
              return;
            }
            option.dropboxToken = results.dropboxToken;
            resolve(option);
        });
    prompt.start();
  });
}

async function setupDropboxDirectory(option) {
  return new Promise(async function(resolve, reject) {
    prompt.get([{ name: 'path', description: 'Dropbox target directory',
                  type: 'string', required: true,
                  pattern: /^\w+$/,
                  message: 'path must be letter',
                  default: option.path
                  }],
        function(err, results) {
            if (err) {
              reject(err);
              return;
            }
            option.path = results.path;
            resolve(option);
        });
    prompt.start();
  });
}


module.exports = Options;