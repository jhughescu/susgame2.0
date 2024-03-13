// Import necessary modules
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { app } = require('./../app'); // Import app from app.js
const adminController = require('./../controllers/adminController');
const sessionController = require('./../controllers/sessionController');
const templateController = require('./../controllers/templateController');

const basePath = path.join(__dirname, '..', 'public');
app.use(express.static(basePath));
// Use body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());


const showRoutes = (routeName) => {
    const routes = app._router.stack;
    for (const layer of routes) {
//        if (layer.name === 'bound dispatch') {
            console.log(layer);
//        }
    }
    return false; // Route with the requested name does not exist
};
const routeExists = (routeName) => {
    const routes = app._router.stack;
    for (const layer of routes) {
        if (layer.route && layer.route.path === routeName) {
            return true; // Route with the requested name already exists
        }
    }
    return false; // Route with the requested name does not exist
};
const createRoute = (r) => {
//    return;
//    console.log('CREATE ROUTE');
    let rt = r.indexOf('http', 0) > -1 ? r.split('/').reverse()[0] : r;
    rt = rt.substr(0, 1) === '/' ? rt : '/' + rt;
    app._router.stack = app._router.stack.filter(layer => layer.handle !== notFoundHandler);
    if (!routeExists(rt)) {
        app.get(rt, (req, res) => {
            res.sendFile(path.join(basePath, 'player.html'));
        });
        app.use(notFoundHandler);
//        showRoutes();
    }
};

// route definitions:
app.get('/testbed', (req, res) => {
    res.sendFile(path.join(basePath, 'testbed.html'));
});
app.get('/player', (req, res) => {
    res.sendFile(path.join(basePath, 'player.html'));
});


app.get('/admin/systemlogin', (req, res) => {
    res.sendFile(path.join(basePath, 'systemlogin.html'));
});
app.post('/admin/systemlogin', adminController.adminAuth, (req, res) => {
    res.redirect('/admin/systemdashboard'); // Redirect to admin dashboard upon successful login
});
app.get('/admin/systemdashboard', adminController.checkSessionTimeoutAndRedirect, (req, res) => {
    templateController.setupPartials();
    console.log('>>>>> dev only, knock out in production (see app.js /admin/systemdashboard route)')
    res.sendFile(path.join(basePath, 'systemdashboard.html'));
});
app.get('/admin/reset-timeout', (req, res) => {
//    console.log('reset timeout');
    adminController.resetAdmin();
});
app.get('/admin/loggedout', (req, res) => {
    res.sendFile(path.join(basePath, 'loggedout.html'));
});
app.get('/admin/systemfail', (req, res) => {
    res.sendFile(path.join(basePath, 'unauthorised.html'));
});

app.get('/facilitatorlogin', (req, res) => {
    res.sendFile(path.join(basePath, 'faclogin.html'));
});
app.get('/facilitatorloggedout', (req, res) => {
    res.sendFile(path.join(basePath, 'facilitatorloggedout.html'));
});

app.get('/facilitatordashboard', adminController.verifyTokenExpiration, (req, res) => {
//    const token = req.headers.authorization;
//    const token = req.query.token;
//    const token = localStorage.getItem('token');
    const token = req.cookies.token;
//    console.log('token?');
//    console.log(token);
    res.sendFile(path.join(basePath, 'facilitatordashboard.html'));
});
app.post('/facilitatorlogin', adminController.facAuth, (req, res) => {
    const session = req.body.session;
    const token = adminController.generateToken({ session });
    res.cookie('token', token, { httpOnly: true });
    res.cookie('sessionID', session, { httpOnly: false });
    res.redirect(`/facilitatordashboard?token=${token}`); // Redirect to admin dashboard upon successful login
});


app.get('/loginfail', (req, res) => {
    res.sendFile(path.join(basePath, 'loginfail.html'));
});

// session stuff
app.post('/admin/createSession', async (req, res) => {
    try {
        const sesh = await sessionController.newSession(req, res);
    } catch (err) {
        console.log('createSession error')
        console.log(err)
    }
});
app.post('/admin/getSessions', async (req, res) => {
    sessionController.getSessions(req, res);
});
app.post('/admin/getSession', async (req, res) => {
    sessionController.getSession(req, res);
});

app.get('/getTemplate', (req, res) => {
    templateController.getTemplate(req, res);
});


// Declare the 404 response
const notFoundHandler = (req, res) => {
    res.status(404).sendFile(path.join(basePath, '404.html'));
};
// Initial 404 handler
app.use(notFoundHandler);


// Export createRoute function
module.exports = { createRoute };
