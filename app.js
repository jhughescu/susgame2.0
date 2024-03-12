const express = require('express');
const fs = require('fs');
const handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const app = express();
const server = http.createServer(app);

module.exports = { app };
const { initSocket } = require('./controllers/socketController');
//const { createRoute } = require('./controllers/routeController');
const PORT = process.env.PORT || 3000;


const databaseController = require('./controllers/databaseController');
//const sessionController = require('./controllers/sessionController');
//const adminController = require('./controllers/adminController');
//const eventController = require('./controllers/eventController');
//const gameController = require('./controllers/gameController');
//const Session = require('./models/session');
//const Game = require('./models/game');




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
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
