const QRCode = require('qrcode');
const fs = require('fs');

const imgPath = `public/assets/qr/qrcode-ID.svg`;
const temPath = `views/qr/qrcode-ID.hbs`;
const data = 'this is a QR code';

const colours = {dark: '#252721', light: '#ffffff'}

const generateQR = (data, id, session) => {
    QRCode.toDataURL(data, (err, url) => {
        if (err) {
            console.error(err);
            return;
        }
        const options = {
            size: 300,
            type: 'svg',
            border: 0,
            color: colours
        }
        //        const output = `public/assets/qr/qrcode-${id}.svg`;
        const output = imgPath.replace('ID', id);
        //        console.log(`generateQR, data: ${data}, id: ${id}, output: ${output}`);
        QRCode.toFile(output, data, options, (err) => {
            if (err) {
                console.error(err);
                return;
            } else {
                createTemplateQR(session);
            }
        });
    });

};
const deleteQR = (id) => {
    deleteQRTem(id);
    deleteQRImg(id);
}
const deleteQRTem = (id) => {
    const qr = temPath.replace('ID', id);
    fs.unlink(qr, (err) => {
        if (err) {
            console.error(`Error deleting file ${qr}:`, err);
            return;
        }
        console.log(`File ${qr} deleted successfully`);
    });
}
const deleteQRImg = (id) => {
    let qr = imgPath.replace('ID', id);
    fs.unlink(qr, (err) => {
        if (err) {
            console.error(`Error deleting file ${qr}:`, err);
            return;
        }
        console.log(`File ${qr} deleted successfully`);
    });
}
const generateSessionQR = (session) => {
    generateQR(`${session.base}${session.address}`, session.uniqueID, session);
};
const ensureDirectoryExists = async (directory) => {
    try {
        // Check if the directory exists
        await fs.promises.access(directory, fs.constants.F_OK);
    } catch (err) {
        // If the directory doesn't exist, create it
        if (err.code === 'ENOENT') {
            await fs.promises.mkdir(directory, { recursive: true });
        } else {
            throw err; // Throw any other errors that occur
        }
    }
}
const createTemplateQR = async (session) => {
    const filePath = imgPath.replace('ID', session.uniqueID);
    const outPath = temPath.replace('ID', session.uniqueID);
    try {
        // Read the file asynchronously
        const fileContent = await fs.promises.readFile(filePath, 'utf8');
        const content = fileContent.replace(colours.light, '{{light}}').replace(colours.dark, '{{dark}}');
        const dir = temPath.split('/').slice(0, 2).join('/');
        await ensureDirectoryExists(dir);
        await fs.promises.writeFile(temPath.replace('ID', session.uniqueID), content, 'utf8');
        return fileContent;
    } catch (err) {
        throw err; // Throw any errors that occur
    }
};
module.exports = {
    generateQR,
    deleteQR,
    generateSessionQR,
}
