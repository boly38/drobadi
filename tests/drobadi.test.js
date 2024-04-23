import process from 'node:process'
import {before, after, describe, it} from "mocha";
import fs from "fs";
import {isSet, logInfo, logWarn, logSuccess, mkdirSync} from '../lib/utils.js';
import {file, expect} from './testLib.js';
import {_expectNoError, rmDirSync} from './testUtils.js';
import {Drobadi, DOptions} from "../lib/drobadi.js";

const {
    DROBADI_TEST_DROPBOX_TOKEN,
    DROBADI_TEST_APP_KEY,
    DROBADI_TEST_APP_SECRET,
    DROBADI_TEST_REFRESH_TOKEN
} = process.env;
const testBackupDirectory = "tmp/test-backup";
const testRestoreDirectory = "tmp/test-restore";
const testRestoreUnzippedDirectory = "tmp/test-restore-unzipped";
const testDropboxZipDestinationFilename = "drobadi-archive123.zip";// warn this file is removed by pre-condition
const testDropboxTargetDirectory = "drobadi-test";
const expectedRestoredFile = `./${testDropboxZipDestinationFilename}`;


/**
 * produce sample files :
 * - /hello
 * - /inside/bonjour
 * @param targetDirectory
 */
const produceSampleFiles = targetDirectory => {
    // file <targetDirectory>/hello
    mkdirSync(targetDirectory);
    fs.writeFileSync(targetDirectory + "/hello", "HELLO WORLD !");
    // file <targetDirectory>/inside/bonjour
    const subDirectory = targetDirectory + "/inside";
    mkdirSync(subDirectory)
    fs.writeFileSync(subDirectory + "/bonjour", "BONJOUR MONDE !");
}
const ZIP_FIRST_LEVEL_NAMES = ['hello', 'inside'];

let initialOptions = {
    "dropboxAppKey": DROBADI_TEST_APP_KEY,
    "dropboxAppSecret": DROBADI_TEST_APP_SECRET,
    "dropboxRefreshToken": DROBADI_TEST_REFRESH_TOKEN,
    "path": testDropboxTargetDirectory,
    "overrideTargetBackup": true // because test didnt remove backup
};
if (isSet(DROBADI_TEST_DROPBOX_TOKEN)) {
    initialOptions["dropboxToken"] = DROBADI_TEST_DROPBOX_TOKEN; // legacy and deprecated
}
const testDOptions = new DOptions(initialOptions);
let drobadi = new Drobadi();
let lastArchiveSize;

const VERBOSE = process.env.DROBADI_TEST_VERBOSE === "true" || false;

const cleanupConditions = () => {
    VERBOSE && logInfo(`cleanup test directories: ${testBackupDirectory},${testRestoreDirectory}`);
    rmDirSync(testBackupDirectory);
    rmDirSync(testRestoreDirectory);
    rmDirSync(testRestoreUnzippedDirectory);
    rmDirSync(expectedRestoredFile);
    rmDirSync("tmp");
};

const verifyDropboxTestTokenIsSet = () => {
    if (!isSet(DROBADI_TEST_APP_KEY) || !isSet(DROBADI_TEST_APP_SECRET) || !isSet(DROBADI_TEST_REFRESH_TOKEN)) {
        logWarn("A dropbox app key,secret,refresh token must be set in order to play tests");
        expect(DROBADI_TEST_APP_KEY, 'env.DROBADI_TEST_APP_KEY is NOT set').to.exist;
        expect(DROBADI_TEST_APP_SECRET, 'env.DROBADI_TEST_APP_SECRET is NOT set').to.exist;
        expect(DROBADI_TEST_REFRESH_TOKEN, 'env.DROBADI_TEST_REFRESH_TOKEN is NOT set').to.exist;
    }
}

describe("Drobadi", () => {
    verifyDropboxTestTokenIsSet();
    before(cleanupConditions);
    after(cleanupConditions)

    it("drobadi.backup : should backup a local directory into a dropbox zip file", (done) => {
        mkdirSync("tmp");
        produceSampleFiles(testBackupDirectory);

        drobadi.backup(testDOptions, testBackupDirectory, testDropboxZipDestinationFilename, false)
            .then(backupResult => {
                const uploadResult = backupResult.uploadResult;
                VERBOSE && logSuccess(uploadResult.message);
                expect(backupResult.target).to.be.eql(testBackupDirectory);
                expect(uploadResult.dropboxFile).to.be.eql(`/${testDropboxTargetDirectory}/${testDropboxZipDestinationFilename}`);
                expect(uploadResult.dropboxFileSize).to.be.within(300, 500);
                lastArchiveSize = uploadResult.dropboxFileSize;
                done();
            })
            .catch(_expectNoError);

    });

    it("drobadi.list : should list backup", (done) => {
        drobadi.list(testDOptions)
            .then(listResult => {
                VERBOSE && logSuccess(listResult);
                expect(listResult).to.contain(testDropboxZipDestinationFilename);
                done();
            }).catch(_expectNoError);
    });

    it("drobadi.download : should restore backup in current directory", (done) => {
        drobadi.download(testDOptions, testDropboxZipDestinationFilename)
            .then(restoreResult => {
                const downloadResult = restoreResult.downloadResult;
                VERBOSE && logSuccess(downloadResult.message);

                expect(downloadResult.dropboxFile).to.be.eql(`/${testDropboxTargetDirectory}/${testDropboxZipDestinationFilename}`);
                expect(downloadResult.localFile).to.be.eql(testDropboxZipDestinationFilename);
                expect(downloadResult.dropboxFileSize).to.be.eql(lastArchiveSize);

                expect(file(expectedRestoredFile)).to.exist;
                expect(fs.statSync(expectedRestoredFile).size).to.be.eql(lastArchiveSize);
                fs.rmSync(testDropboxZipDestinationFilename); // clean up
                done();
            }).catch(_expectNoError);
    });

    it("drobadi.download restored.zip : should restore backup in specified file", (done) => {
        VERBOSE && logInfo(`create empty ${testRestoreDirectory}`)
        mkdirSync(testRestoreDirectory);
        const destination = `${testRestoreDirectory}/restored.zip`;

        drobadi.download(testDOptions, testDropboxZipDestinationFilename, destination)
            .then(restoreResult => {
                const downloadResult = restoreResult.downloadResult;
                VERBOSE && logSuccess(downloadResult.message);

                expect(downloadResult.dropboxFile).to.be.eql(`/${testDropboxTargetDirectory}/${testDropboxZipDestinationFilename}`);
                expect(downloadResult.localFile).to.be.eql(destination);
                expect(downloadResult.dropboxFileSize).to.be.eql(lastArchiveSize);

                expect(file(destination)).to.exist;
                expect(fs.statSync(destination).size).to.be.eql(lastArchiveSize);
                done();
            })
            .catch(_expectNoError);
    });

    it("drobadi.downloadAndUnzip : should restore backup in specified directory", (done) => {
        const destination = `${testRestoreUnzippedDirectory}`;

        drobadi.downloadAndUnzip(testDOptions, testDropboxZipDestinationFilename, destination)
            .then(() => {
                console.log("unzip as directory done :")
                expect(fs.readdirSync(destination)).to.be.eql(ZIP_FIRST_LEVEL_NAMES)
                done();
            })
            .catch(_expectNoError);
    });

})


