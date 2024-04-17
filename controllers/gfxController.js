const QRCode = require('qrcode');
const fs = require('fs');

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
        const output = `public/assets/qr/qrcode-${id}.svg`;
//        console.log(`generateQR, data: ${data}, id: ${id}, output: ${output}`);
        QRCode.toFile(output, data, options, (err) => {
            if (err) {
                console.error(err);
                return;
            }
        });
    });

}
const generateSessionQR = (session) => {
    generateQR(`${session.base}${session.address}`, session.uniqueID);
}
module.exports = {
    generateQR,
    generateSessionQR,
}
