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
const testDropboxZipDestinationFilename = "drobadi-archive123.zip";// warn this file is removed by pre-condition
const testDropboxTargetDirectory = "drobadi-test";
const expectedRestoredFile = `./${testDropboxZipDestinationFilename}`;

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
    rmDirSync(expectedRestoredFile);
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

    it("should backup a local directory into a dropbox zip file", (done) => {
        const givenSampleFiles = directory => {
            mkdirSync(directory);
            const subDirectory = directory + "/inside";
            mkdirSync(subDirectory)
            fs.writeFileSync(directory + "/hello", "HELLO WORLD !");
            fs.writeFileSync(subDirectory + "/bonjour", "BONJOUR MONDE !");
        }
        mkdirSync("tmp");
        givenSampleFiles(testBackupDirectory);

        drobadi.backup(testDOptions, testBackupDirectory, testDropboxZipDestinationFilename)
            .then(backupResult => {
                const uploadResult = backupResult.uploadResult;
                VERBOSE && logSuccess(uploadResult.message);
                backupResult.target.should.be.eql(testBackupDirectory);
                expect(uploadResult.dropboxFile).to.be.eql(`/${testDropboxTargetDirectory}/${testDropboxZipDestinationFilename}`);
                expect(uploadResult.dropboxFileSize).to.be.within(300, 500);
                lastArchiveSize = uploadResult.dropboxFileSize;
                done();
            })
            .catch(_expectNoError);

    });

    it("should list backup", (done) => {
        drobadi.list(testDOptions)
            .then(listResult => {
                VERBOSE && logSuccess(listResult);
                expect(listResult).to.contain(testDropboxZipDestinationFilename);
                done();
            }).catch(_expectNoError);
    });

    it("should restore backup in current directory", (done) => {
        drobadi.download(testDOptions, testDropboxZipDestinationFilename)
            .then(restoreResult => {
                const downloadResult = restoreResult.downloadResult;
                VERBOSE && logSuccess(downloadResult.message);

                expect(downloadResult.dropboxFile).to.be.eql(`/${testDropboxTargetDirectory}/${testDropboxZipDestinationFilename}`);
                expect(downloadResult.localFile).to.be.eql(testDropboxZipDestinationFilename);
                expect(downloadResult.dropboxFileSize).to.be.eql(lastArchiveSize);

                expect(file(expectedRestoredFile)).to.exist;
                expect(fs.statSync(expectedRestoredFile).size).to.be.eql(lastArchiveSize);
                done();
            }).catch(_expectNoError);
    });

    it("should restore backup in specified file", (done) => {
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

})


