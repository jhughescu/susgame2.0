const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

const connectDB = require('./controllers/databaseController');
const sessionController = require('./controllers/sessionController');
const adminController = require('./controllers/adminController');
const Session = require('./models/session');

// Use body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
//    console.log('A user connected (HTTP or WebSocket)');
    socket.on('disconnect', () => {
//        console.log('User disconnected (HTTP or WebSocket)');
    });

    // Handle other socket events...
});

// Define a separate namespace for socket.io connections related to the admin dashboard
const adminDashboardNamespace = io.of('/admin/systemdashboard');
adminDashboardNamespace.on('connection', (socket) => {
//    console.log('A user connected to the admin dashboard');
    socket.on('disconnect', () => {
//        console.log('User disconnected from the admin dashboard');
    });

    // Handle other socket events specific to the admin dashboard...
});


app.get('/admin/systemlogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'systemlogin.html'));
});
app.post('/admin/systemlogin', adminController.adminAuth, (req, res) => {
    res.redirect('/admin/systemdashboard'); // Redirect to admin dashboard upon successful login
});
app.get('/admin/systemdashboard', adminController.checkSessionTimeoutAndRedirect, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'systemdashboard.html'));
});
app.get('/admin/reset-timeout', (req, res) => {
//    console.log('reset timeout');
    adminController.resetAdmin();
});
app.get('/admin/loggedout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'loggedout.html'));
});

// session stuff
app.post('/admin/createSession', async (req, res) => {
    sessionController.newSession(req, res);
});
app.post('/admin/getSessions', async (req, res) => {
    sessionController.getSessions(req, res);
});
app.post('/admin/getSession', async (req, res) => {
    sessionController.getSession(req, res);
});


connectDB();
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
