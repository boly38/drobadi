import console from 'node:console'
import process from 'node:process'
import DCommand from './lib/DCommand.js';
import {isSet} from "./lib/utils.js";
// take first command line argument
const action = process.argv.slice(2)[0];
const args = process.argv.slice(3);
(new DCommand()).doAction(action, args)
    .then(result => {
        if (isSet(result)) {
            console.log(result);
        }
    })
    .catch(error => {
        console.warn(error.message)
    });