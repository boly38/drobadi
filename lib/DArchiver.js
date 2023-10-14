import fs from 'fs';
import archiver from 'archiver';
import {logInfo, logWarn} from './utils.js';

const MUST_LOG_INFO = process.env.DROBADI_ARCHIVER_VERBOSE || false;
const MUST_LOG_WARN = process.env.DROBADI_ARCHIVER_WARNING || true;

export default class DArchiver {
    zip(outArchFile, toZipDirectory) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outArchFile);
            const archive = archiver('zip', {zlib: {level: 9}}); // Sets the compression level.
            archive.pipe(output);
            archive.directory(toZipDirectory, null, null);
            archive.on('warning', function (err) {
                MUST_LOG_WARN && logWarn(JSON.stringify(err));
            });
            archive.on('error', function (err) {
                reject(err);
            });
            output.on('close', function () {
                MUST_LOG_INFO && logInfo(`${archive.pointer()} total bytes`);
                MUST_LOG_INFO && logInfo(`archiver output file descriptor has closed.`);
                resolve(outArchFile);
            });
            archive.finalize().then(() => {
                MUST_LOG_INFO && logInfo(`archiver finalize done`);
            });

        });
    }
}
