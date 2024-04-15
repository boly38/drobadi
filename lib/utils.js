import fs from "fs";

export const isSet = value => value !== undefined && value !== null && value !== "";
export const logInfo    = msg => console.info(`INFO  ${msg}`);
export const logWarn    = msg => console.warn(`WARN  ${msg}`);
export const logError   = msg => console.error(` ERR  ${msg}`);
export const logSuccess = msg => console.info(`  OK  ${msg}`);
export const mkdirSync = directory => fs.mkdirSync(directory, {recursive: true});

export const unlinkIfExists = localFilePath =>  {
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }
}
