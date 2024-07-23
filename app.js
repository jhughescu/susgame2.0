const express = require('express');
const fs = require('fs');
const handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const gfxController = require('./controllers/gfxController');
const app = express();
const server = http.createServer(app);
require('dotenv').config();

module.exports = { app };
const { initSocket } = require('./controllers/socketController');
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const databaseController = require('./controllers/databaseController');

const padNum = (n) => {
    if (n < 10) {
        return `0${n.toString()}`
    } else {
        return n;
    }
}
const getTimeStamp = () => {
    const d = new Date();
    const ts = `timestamp: ${d.getFullYear()}${padNum(d.getMonth())}${padNum(d.getDay())} ${padNum(d.getHours())}:${padNum(d.getMinutes())}:${padNum(d.getSeconds())}`;
    return ts;
};

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/models', express.static(path.join(__dirname, 'models')));
app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views'),
    partialsDir: path.join(__dirname, 'views/partials'),
    defaultLayout: false
}));
app.set('view engine', '.hbs');
app.get('/views/:templateName', (req, res) => {
    const templateName = req.params.templateName;
    res.sendFile(`${__dirname}/views/${templateName}`);
});
databaseController.dbConnect();
initSocket(server);
server.listen(PORT, HOST, () => {
//server.listen(PORT, () => {
    console.log(`Server running at http://${HOST}:${PORT} ${getTimeStamp()}`);
    console.log('test')
});
