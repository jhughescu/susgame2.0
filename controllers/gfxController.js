const QRCode = require('qrcode');
const fs = require('fs');

const path = `public/assets/qr/qrcode-ID.svg`;
const data = 'this is a QR code';

const generateQR = (data, id) => {
    QRCode.toDataURL(data, (err, url) => {
        if (err) {
            console.error(err);
            return;
        }
        const options = {
            size: 300,
            type: 'svg'
        }
        //        const output = `public/assets/qr/qrcode-${id}.svg`;
        const output = path.replace('ID', id);
        //        console.log(`generateQR, data: ${data}, id: ${id}, output: ${output}`);
        QRCode.toFile(output, data, options, (err) => {
            if (err) {
                console.error(err);
                return;
            }
        });
    });

}
const deleteQR = (id) => {
    const qr = path.replace('ID', id);
//    console.log(`attempt to delete ${qr}`);
//    console.log(fs.readFileSync(qr));
    fs.unlink(qr, (err) => {
        if (err) {
            console.error(`Error deleting file ${qr}:`, err);
            return;
        }
        console.log(`File ${qr} deleted successfully`);
    });

}
const generateSessionQR = (session) => {
    generateQR(`${session.base}${session.address}`, session.uniqueID);
}
module.exports = {
    generateQR,
    deleteQR,
    generateSessionQR,
}
