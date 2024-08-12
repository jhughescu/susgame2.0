const fs = require('fs').promises;
const path = require('path');
const beautify = require('json-beautify');
const tools = require('./tools.js');
const { getEventEmitter } = require('./../controllers/eventController');

const eventEmitter = getEventEmitter();

const LOG_UPDATE = 'logs/updates.json';
let updateTime = null;
const updateList = [];


const isDev = () => {
    return true;
    return Boolean(tools.procVal(process.env.isDev));
};
/**
 * Empties all the contents of the specified folder, leaving the folder itself intact.
 * @param {string} directoryPath - The path to the folder to be emptied.
 */
async function emptyFolder(directoryPath) {
    if (isDev()) {
        try {
            const files = await fs.readdir(directoryPath);
            for (const file of files) {
                const filePath = path.join(directoryPath, file);
                const stat = await fs.stat(filePath);

                if (stat.isDirectory()) {
                    await fs.rmdir(filePath, {
                        recursive: true
                    });
                } else {
                    if (filePath.replace(/[\/\\]/g, '') !== LOG_UPDATE.replace(/[\/\\]/g, '')) {
                        await fs.unlink(filePath);
                    }
                }
            }
            console.log(`All contents deleted from ${directoryPath}`);
//            fs.writeFile('logs/updates.json', JSON.stringify({piss: 'boil'}));
        } catch (err) {
            console.error(`Error clearing directory: ${err.message}`);
        }
    }
}

/**
 * Formats the current date and time with British Summer Time adjustment.
 * @returns {string} The formatted timestamp string.
 */
function getFormattedTimestamp() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Europe/London'
    };

    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const parts = formatter.formatToParts(now);

    const datePart = parts.find(p => p.type === 'year').value +
        parts.find(p => p.type === 'month').value +
        parts.find(p => p.type === 'day').value;

    const timePart = parts.find(p => p.type === 'hour').value +
        parts.find(p => p.type === 'minute').value +
        parts.find(p => p.type === 'second').value;

    return `${datePart}-${timePart}`;
}

/**
 * Writes a beautified JSON file to the specified folder with a timestamp appended to the filename.
 * @param {string} directoryPath - The path to the folder where the file will be added.
 * @param {string} fileName - The base name of the new file to create (without extension).
 * @param {object} data - The JSON data to write into the new file.
 */
async function writeBeautifiedJson(directoryPath, fileName, data) {
    try {
        const timestamp = getFormattedTimestamp();
        const newFileName = `${fileName}_${timestamp}.json`;
        const newFilePath = path.join(directoryPath, newFileName);
        // Beautify JSON
        const beautifiedJson = beautify(data, null, 2, 100);
        if (isDev()) {
            await fs.writeFile(newFilePath, beautifiedJson);
        }
    } catch (err) {
        console.error(`Error creating file: ${err.message}`);
    }
};

const updateUpdates = async () => {
    let uf = await fs.readFile(LOG_UPDATE);
    uf = JSON.parse(uf);
    let index = Object.keys(uf).length;
    while (updateList.length > 0) {
        const uo = updateList.shift();
        const u = JSON.parse(uo.update);
        u.game = uo.game;
        u.timestamp = uo.timestamp;
        const newI = `update_${index}`;
        uf[newI] = u;
        index++;
    }
    const writer = beautify(uf, null, 2, 100);
    await fs.writeFile(LOG_UPDATE, writer);
    eventEmitter.emit('updateLogUpdated', writer);
}
const getUpdateLog = async (cb) => {
    const ul = await fs.readFile(LOG_UPDATE, 'utf-8');
    if (cb) {
        cb(ul);
    }
};
async function addUpdate(ob) {
    ob.timestamp = getFormattedTimestamp();
//    console.log(typeof(ob))
//    console.log(ob);
    updateList.push(ob);
    clearTimeout(updateTime);
    updateTime = setTimeout(updateUpdates, 500);
}
async function addUpdateV1(ob) {
    return;
    console.log(`OK, let's add an update ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`)
    console.log(ob)
    console.log(tools.isValidJSON(ob), isDev()  )
//    console.log(`##########################################`)
    let msg = '';
    try {
        const ts = getFormattedTimestamp();
        const fn ='logs/updates.json';
//        const fn = path.join(__dirname, 'logs/updates.json');
        let l = {};
        if (isDev()) {
            try {
                const fileContent = await fs.readFile(fn, 'utf-8');
                console.log(fileContent);
                console.log(`END END END END END END END END END END END END END END END END END END END END END END END END END `);
                l = JSON.parse(fileContent);
                if (l) {

                } else {
                    console.log('ERROR')
                }
                msg = 'read the file';
            } catch (readError) {
                console.log(`ERROR ERROR ERROR ERROR ERROR ERROR ERROR `)
                if (readError.code === 'ENOENT') {
                    // File does not exist, initialize a new log object
                    msg = 'file not found, initializing new log';
                } else {
                    // Some other error occurred
                    console.log('###############################', readError.message)

                    throw readError;
                }
            }

            const index = Object.entries(l).length;
            l[`update-${index}`] = Object.assign({ timestamp: ts }, JSON.parse(ob));
//            console.log(ob._updateSource);
            await fs.writeFile(fn, beautify(l, null, 2, 100));
            console.log('WRITE COMPLETE')
        }
    } catch (err) {
        console.error(`failure to add update log, error: ${err.message}`);
    }
}
const init = () => {
    fs.writeFile(LOG_UPDATE, '{}');
}
init();
module.exports = {
    emptyFolder,
    writeBeautifiedJson,
    addUpdate,
    getUpdateLog
};
