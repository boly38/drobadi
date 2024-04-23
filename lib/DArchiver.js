import process from 'node:process'
import fs from 'fs';
import archiver from 'archiver';
import unzipper from "unzipper"; // https://github.com/ZJONSSON/node-unzipper
import {logInfo, logWarn} from './utils.js';

const MUST_LOG_INFO = process.env.DROBADI_ARCHIVER_VERBOSE || false;
const MUST_LOG_WARN = process.env.DROBADI_ARCHIVER_WARNING || true;

export default class DArchiver {

    /**
     * zip the inputDirectoryToZip into destinationZipFileToCreate
     *
     * @param inputDirectoryToZip directory content to put in archive
     * @param destinationZipFileToCreate name of the zip file to create
     * @param includeIntermediateFoldersInArchive when true, intermediate folders from current directory to
     * inputDirectoryToZip are represented in archive. Else when false, archive tree is relative to inputDirectoryToZip
     * @returns {Promise<unknown>}
     */
    zip(inputDirectoryToZip, destinationZipFileToCreate, includeIntermediateFoldersInArchive = true) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(destinationZipFileToCreate);
            const archive = archiver('zip', {zlib: {level: 9}}); // Sets the compression level.
            archive.pipe(output);
            if (includeIntermediateFoldersInArchive) { // legacy
                archive.directory(inputDirectoryToZip, null, null);
            } else {
                archive.directory(inputDirectoryToZip, false);
            }
            archive.on('warning', function (err) {
                MUST_LOG_WARN && logWarn(JSON.stringify(err));
            });
            archive.on('error', function (err) {
                reject(err);
            });
            output.on('close', function () {
                MUST_LOG_INFO && logInfo(`${archive.pointer()} total bytes`);
                MUST_LOG_INFO && logInfo(`archiver output file descriptor has closed.`);
                resolve(destinationZipFileToCreate);
            });
            archive.finalize().then(() => {
                MUST_LOG_INFO && logInfo(`archiver finalize done`);
            });

        });
    }

    /**
     * unzip inputArchiveZipFileToUnzip and put content into destinationDirectory
     * @param inputArchiveZipFileToUnzip file to unzip
     * @param destinationDirectory unzip destination
     * @returns {*}
     */
    unzip(inputArchiveZipFileToUnzip, destinationDirectory) {
        return fs.createReadStream(inputArchiveZipFileToUnzip)
            .pipe(unzipper.Extract({"path": destinationDirectory}))
            .promise();
    }
}
