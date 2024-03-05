const express = require('express');
const cookieParser = require('cookie-parser');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

const databaseController = require('./controllers/databaseController');
const sessionController = require('./controllers/sessionController');
const adminController = require('./controllers/adminController');
const Session = require('./models/session');

// Use body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser())


app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views'),
    defaultLayout: false
}));
app.set('view engine', '.hbs');

io.on('connection', (socket) => {
//    console.log('A user connected (HTTP or WebSocket)');
    socket.on('disconnect', () => {
//        console.log('User disconnected (HTTP or WebSocket)');
    });
    socket.on('getSesssionWithID', (id) => {
//        console.log(`id: ${id}`);
        sessionController.getSessionWithID(id);
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

// Routes
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
app.get('/admin/systemfail', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'unauthorised.html'));
});


app.get('/facilitatorlogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'faclogin.html'));
});
app.get('/facilitatorloggedout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'facilitatorloggedout.html'));
});

app.get('/facilitatordashboard', adminController.verifyTokenExpiration, (req, res) => {
//    const token = req.headers.authorization;
//    const token = req.query.token;
//    const token = localStorage.getItem('token');
    const token = req.cookies.token;
//    console.log('token?');
//    console.log(token);
    res.sendFile(path.join(__dirname, 'public', 'facilitatordashboard.html'));
});
app.post('/facilitatorlogin', adminController.facAuth, (req, res) => {
    const session = req.body.session;
    const token = adminController.generateToken({ session });
    res.cookie('token', token, { httpOnly: true });
    res.cookie('sessionID', session, { httpOnly: false });
//    res.redirect(`/facilitatordashboard`);
//    console.log(session)
//    res.render(`facilitatordashboard`, {session});
    res.redirect(`/facilitatordashboard?token=${token}`); // Redirect to admin dashboard upon successful login
});



app.get('/loginfail', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'loginfail.html'));
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


databaseController.dbConnect();
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
