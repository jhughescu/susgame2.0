const socketIo = require('socket.io');
const gameController = require('./../controllers/gameController');
const routeController = require('./../controllers/routeController');
const sessionController = require('./../controllers/sessionController');
//console.log(gameController)
//console.log(app)
let io = null;
let adminDashboardNamespace = null;
let facilitatorDashboardNamespace = null;
// Function to initialize socket.io
function initSocket(server) {
    io = socketIo(server);
    console.log('INIT');
    // Handle client events
    io.on('connection', (socket) => {
        socket.on('disconnect', () => {
            console.log('User disconnected (HTTP or WebSocket)');
        });

        // Handle other socket events
        socket.on('getSesssionWithID', (id) => {
            // Call appropriate controller method
            sessionController.getSessionWithID(id);
        });

        // Add more event handlers as needed
    });

    // Define a separate namespace for socket.io connections related to the admin dashboard
    adminDashboardNamespace = io.of('/admin/systemdashboard');
    adminDashboardNamespace.on('connection', (socket) => {
        console.log('A user connected to the admin dashboard');
        socket.on('disconnect', () => {
            console.log('User disconnected from the admin dashboard');
        });

        // Handle other socket events specific to the admin dashboard...
    });

    // Define a separate namespace for socket.io connections related to all facilitator dashboards
    facilitatorDashboardNamespace = io.of('/facilitatordashboard');
    facilitatorDashboardNamespace.on('connection', (socket) => {
        console.log('A user connected to a facilitator dashboard');
        socket.on('disconnect', () => {
            console.log('User disconnected from a facilitator dashboard');
        });
        socket.on('getGame', (id) => {
            gameController.getGame(id);
        });
        socket.on('startGame', (o, cb) => {
            gameController.startGame(o, cb);
        });
        socket.on('activateSession', (session) => {
            routeController.createRoute(session.address);
            sessionController.activateSession(session);

        });
        // Handle other socket events specific to the admin dashboard...
    });
    theIO = io;
}
const emitSystem = (ev, o) => {
    if (io) {
        adminDashboardNamespace.emit(ev, o)
    }
}

module.exports = {
    initSocket,
    emitSystem
};
