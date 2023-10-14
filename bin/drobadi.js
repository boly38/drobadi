#!/usr/bin/env node

const {DCommand} = require('../lib/drobadi.js');
// take first command line argument
const action = process.argv.slice(2)[0];
const args = process.argv.slice(3);
(new DCommand()).doAction(action, args);
