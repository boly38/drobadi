export const isSet = value => value !== undefined && value !== null && value !== "";
export const logInfo    = msg => console.info(`INFO  ${msg}`);
export const logWarn    = msg => console.info(`WARN  ${msg}`);
export const logSuccess = msg => console.info(`  OK  ${msg}`);