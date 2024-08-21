// Import necessary modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const handlebars = require('handlebars');
const { app } = require('./../app'); // Import app from app.js
const adminController = require('./../controllers/adminController');
const sessionController = require('./../controllers/sessionController');
const templateController = require('./../controllers/templateController');

const basePath = path.join(__dirname, '..', 'public');
const routeAccessTimes = {};

let buildInfo;
const buildInfoPath = path.join(__dirname, '..', 'build-info.json');
if (fs.existsSync(buildInfoPath)) {
    buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf-8'));
} else {
    buildInfo = { error: 'Build info not found' };
}
app.get('/build-info', (req, res) => {
    res.json(buildInfo);
//    res.send('buildInfo');
});

app.use(express.static(basePath));
// Use body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
    /// middleware to store access times for routes
    const currentTime = new Date().toISOString();
    routeAccessTimes[req.path] = currentTime;
//    console.log(`Route ${req.path} accessed at ${currentTime}`);
//    console.log(req.client)
    next();
});
//app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '0.5mb' }));
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
    let rt = r.indexOf('http', 0) > -1 ? r.split('/').reverse()[0] : r;
//    console.log(`create route: ${rt}`);
    rt = rt.substr(0, 1) === '/' ? rt : '/' + rt;
    app._router.stack = app._router.stack.filter(layer => layer.handle !== notFoundHandler);
    if (!routeExists(rt)) {
//        console.log(`created route: ${rt}`);
        app.get(rt, (req, res) => {
            res.sendFile(path.join(basePath, 'player.html'));
        });
        app.use(notFoundHandler);
    }
};
const destroyRoute = (id) => {
    console.log(`let's destroy a route: ${id}`);
    console.log(`before: ${app._router.stack.length}`);
    const index = app._router.stack.findIndex(layer => {
        if (layer.route) {
            return layer.route.path === id;
        }
        return false;
    });
    if (index) {
        app._router.stack.splice(index, 1);
    }
    console.log(`after: ${app._router.stack.length}`);
}
// route definitions:
app.get('/testbed', (req, res) => {
    res.sendFile(path.join(basePath, 'testbed.html'));
});
app.get('/player', (req, res) => {
    res.sendFile(path.join(basePath, 'player.html'));
});
app.get('/gameover', (req, res) => {
    res.sendFile(path.join(basePath, 'gameover.html'));
});
app.get('/teamtest', (req, res) => {
    res.render(`game_connecton_team`);
});


app.get('/admin/systemlogin', (req, res) => {
//    res.sendFile(path.join(basePath, 'systemlogin.html'));
    res.sendFile(path.join(basePath, 'systemlogin2.html'));
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

//app.get('/facilitatordashboard', adminController.verifyTokenExpiration, (req, res) => {
app.get('/facilitatordashboard', (req, res) => {
//    const token = req.headers.authorization;
//    const token = req.query.token;
//    const token = localStorage.getItem('token');
    const token = req.cookies.token;
//    console.log('token?');
//    console.log(token);
//    console.log('FDB route');
//    console.log(req);
//    console.log(res);
    res.sendFile(path.join(basePath, 'facilitatordashboard.html'));
});
app.post('/facilitatorlogin', adminController.facAuth, (req, res) => {
    const session = req.body.session;
    const token = adminController.generateToken({ session });
    res.cookie('token', token, { httpOnly: true });
    res.cookie('sessionID', session, { httpOnly: false });
    res.redirect(`/facilitatordashboard?token=${token}`); // Redirect to admin dashboard upon successful login
});
app.get('/fakegenerator', (req, res) => {
    res.sendFile(path.join(basePath, 'fakegenerator.html'));
});


app.get('/loginfail', (req, res) => {
//    res.sendFile(path.join(basePath, 'loginfail.html'));
    const message = req.query.message || 'login failed'
    res.render('loginfail', { message });
});

app.get('/presentation', (req, res) => {
    res.sendFile(path.join(basePath, 'presentation.html'));
});

app.get('/displaygame', (req, res) => {
    res.sendFile(path.join(basePath, 'displaygame.html'));
});
app.get('/admin/sessionview', (req, res) => {
    res.sendFile(path.join(basePath, 'admin.session.view.html'));
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
//    console.log('request to admin/getSession');
    sessionController.getSession(req, res);
});


app.post('/getTemplate', (req, res) => {
    templateController.getTemplate(req, res);
});
app.get('/partials', async (req, res) => {
    const partials = await templateController.getPartials();
//    console.log(`server tries to get those partials`);
//    console.log(partials);
    res.json({ partials });
});
app.get('/partialsV1', (req, res) => {
    const partials = templateController.getPartials();
    console.log(`server tries to get those partials`);
    console.log(partials);
    const serialised = {};
    for (const name in partials) {
//        serialised[name] = partials[name];
        serialised[name] = handlebars.partials[name](null);
    }
    console.log(serialised);
    res.json({ partials: serialised });
});
app.get(`/updatelog`, (req, res) => {
    res.sendFile(path.join(basePath, 'updatelog.html'));
});


// Declare the 404 response
const notFoundHandler = (req, res) => {
    res.status(404).sendFile(path.join(basePath, '404.html'));
};
// Initial 404 handler
app.use(notFoundHandler);


// Export createRoute function
module.exports = {
    createRoute,
    destroyRoute
};
