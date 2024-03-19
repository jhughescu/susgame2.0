const QRCode = require('qrcode');
const fs = require('fs');

const data = 'this is a QR code';

const generateQR = (data, id) => {
    QRCode.toDataURL(data, (err, url) => {
        if (err) {
            console.error(err);
            return;
        }
        QRCode.toFile(`public/assets/qr/qrcode-${id}.png`, data, (err) => {
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
