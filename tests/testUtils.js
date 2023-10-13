import fs from "fs";
import { expect } from './testLib.js';
export const rmDirSync = directory => fs.rmSync(directory, {recursive: true, force: true});
export const _expectNoError = err => {
    console.trace(err)
    expect.fail(err);
};
