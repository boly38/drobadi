import fs from "fs";
import {isSet, logInfo, logWarn, logSuccess} from '../lib/utils.js';
import {file, expect} from './testLib.js';
import {_expectNoError, rmDirSync} from './testUtils.js';
import {Drobadi, DOptions} from "../lib/drobadi.js";

const testDbToken = process.env.DROBADI_TEST_DROPBOX_TOKEN || null;
const testBackupDirectory = "tmp/test-backup";
const testRestoreDirectory = "tmp/test-restore";
const testDropboxZipDestinationFilename = "drobadi-archive123.zip";// warn this file is removed by pre-condition
const testDropboxTargetDirectory = "drobadi-test";
const expectedDropboxTargetFullName = `/${testDropboxTargetDirectory}/${testDropboxZipDestinationFilename}`
const expectedRestoredFile = `./${testDropboxZipDestinationFilename}`;
const testDOptions = new DOptions({
    "dropboxToken": testDbToken,
    "path": testDropboxTargetDirectory,
    "force": true
});

let drobadi = new Drobadi();
let lastArchiveSize;

const VERBOSE = process.env.DROBADI_TEST_VERBOSE || false;

const cleanupConditions = () => {
    VERBOSE && logInfo(`cleanup test directories: ${testBackupDirectory},${testRestoreDirectory}`);
    rmDirSync(testBackupDirectory);
    rmDirSync(testRestoreDirectory);
    rmDirSync(expectedRestoredFile);
};

const verifyDropboxTestTokenIsSet = () => {
    if (!isSet(testDbToken)) {
        logWarn("A dropbox token must be set in order to play tests");
        expect(testDbToken, 'env.DROBADI_TEST_DROPBOX_TOKEN is NOT set').to.exist;
    }
}

describe("Drobadi", () => {
    verifyDropboxTestTokenIsSet();
    before(cleanupConditions);
    after(cleanupConditions)

    it("should backup a local directory into a dropbox zip file", (done) => {
        const givenSampleFiles = directory => {
            fs.mkdirSync(directory);
            const subDirectory = directory + "/inside";
            fs.mkdirSync(subDirectory)
            fs.writeFileSync(directory + "/hello", "HELLO WORLD !");
            fs.writeFileSync(subDirectory + "/bonjour", "BONJOUR MONDE !");
        }
        fs.mkdirSync("tmp");
        givenSampleFiles(testBackupDirectory);

        drobadi.backup(testDOptions, testBackupDirectory, testDropboxZipDestinationFilename)
            .catch(_expectNoError)
            .then(backupResult => {
                const uploadResult = backupResult.uploadResult;
                VERBOSE && logSuccess(uploadResult.message);
                backupResult.target.should.be.eql(testBackupDirectory);
                expect(uploadResult.client_modified).to.not.be.empty;
                expect(uploadResult.content_hash).to.not.be.empty;
                expect(uploadResult.dropboxFile).to.be.eql(expectedDropboxTargetFullName);
                expect(uploadResult.dropboxFileSize).to.be.within(300, 500);
                expect(uploadResult.id).to.not.be.empty;
                expect(uploadResult.is_downloadable).to.be.true;
                expect(uploadResult.name).to.be.eql(testDropboxZipDestinationFilename);
                expect(uploadResult.path_display).to.be.eql(expectedDropboxTargetFullName);
                expect(uploadResult.path_lower).to.be.eql(expectedDropboxTargetFullName);
                expect(uploadResult.rev).to.not.be.empty;
                expect(uploadResult.server_modified).to.not.be.empty;
                expect(uploadResult.size).to.be.within(300, 500);
                lastArchiveSize = uploadResult.size;
                done();
            });

    });

    it("should list backup", (done) => {
        drobadi.list(testDOptions)
            .catch(_expectNoError)
            .then(listResult => {
                VERBOSE && logSuccess(listResult);
                expect(listResult).to.contain(expectedDropboxTargetFullName);
                done();
            })
    });

    it("should restore backup in current directory", (done) => {
        drobadi.download(testDOptions, testDropboxZipDestinationFilename)
            .catch(_expectNoError)
            .then(restoreResult => {
                const downloadResult = restoreResult.downloadResult;
                VERBOSE && logSuccess(downloadResult.message);

                expect(downloadResult.dropboxFile).to.be.eql(expectedDropboxTargetFullName);
                expect(downloadResult.localFile).to.be.eql(testDropboxZipDestinationFilename);
                expect(downloadResult.dropboxFileSize).to.be.eql(lastArchiveSize);

                expect(file(expectedRestoredFile)).to.exist;
                expect(fs.statSync(expectedRestoredFile).size).to.be.eql(lastArchiveSize);
                done();
            });
    });

    it("should restore backup in specified file", (done) => {
        VERBOSE && logInfo(`create empty ${testRestoreDirectory}`)
        fs.mkdirSync(testRestoreDirectory);
        const destination = `${testRestoreDirectory}/restored.zip`;

        drobadi.download(testDOptions, testDropboxZipDestinationFilename, destination)
            .catch(_expectNoError)
            .then(restoreResult => {
                const downloadResult = restoreResult.downloadResult;
                VERBOSE && logSuccess(downloadResult.message);

                expect(downloadResult.dropboxFile).to.be.eql(expectedDropboxTargetFullName);
                expect(downloadResult.localFile).to.be.eql(destination);
                expect(downloadResult.dropboxFileSize).to.be.eql(lastArchiveSize);

                expect(file(destination)).to.exist;
                expect(fs.statSync(destination).size).to.be.eql(lastArchiveSize);
                done();
            });
    });

})


