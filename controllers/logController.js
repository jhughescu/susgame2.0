const fs = require('fs').promises;
const path = require('path');
const beautify = require('json-beautify');

/**
 * Empties all the contents of the specified folder, leaving the folder itself intact.
 * @param {string} directoryPath - The path to the folder to be emptied.
 */
async function emptyFolder(directoryPath) {
  try {
    const files = await fs.readdir(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true });
      } else {
        await fs.unlink(filePath);
      }
    }
    console.log(`All contents deleted from ${directoryPath}`);
  } catch (err) {
    console.error(`Error clearing directory: ${err.message}`);
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

    // Write file
    await fs.writeFile(newFilePath, beautifiedJson);
    console.log(`Beautified JSON file created at ${newFilePath}`);
  } catch (err) {
    console.error(`Error creating file: ${err.message}`);
  }
}

module.exports = {
  emptyFolder,
  writeBeautifiedJson
};
