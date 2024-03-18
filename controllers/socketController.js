const socketIo = require('socket.io');
const { getEventEmitter } = require('./../controllers/eventController');
const gameController = require('./../controllers/gameController');
const routeController = require('./../controllers/routeController');
const sessionController = require('./../controllers/sessionController');

const eventEmitter = getEventEmitter();

let io = null;
let adminDashboardNamespace = null;
let facilitatorDashboardNamespace = null;
let playerNamespace = null;

const log = (msg) => {
    console.log(`socketController: ${msg}`);
}

const getQueries = (u) => {
    let r = u.split('?');
    let qu = {};
    r.forEach(q => {
        q = q.split('=');
        qu[q[0]] = q[1];
    });
    return qu;
};

// Function to initialize socket.io
function initSocket(server) {

    io = socketIo(server);
//    console.log('INIT');
    // Handle client events
    io.on('connection', (socket) => {
        socket.on('disconnect', () => {
            console.log('User disconnected (HTTP or WebSocket)');
        });

        // Handle other socket events
        socket.on('getSesssionWithID', (id) => {
            // Call appropriate controller method
//            console.log('sock');
            sessionController.getSessionWithID(id);
        });

        // Add more event handlers as needed
    });

    // Define a separate namespace for socket.io connections related to the admin dashboard
    adminDashboardNamespace = io.of('/admin/systemdashboard');
    adminDashboardNamespace.on('connection', (socket) => {
//        console.log('A user connected to the admin dashboard');
        socket.on('disconnect', () => {
//            console.log('User disconnected from the admin dashboard');
        });

        // Handle other socket events specific to the admin dashboard...
    });

    // Define a separate namespace for socket.io connections related to all facilitator dashboards
    facilitatorDashboardNamespace = io.of('/facilitatordashboard');
    facilitatorDashboardNamespace.on('connection', (socket) => {
        console.log('A user connected to a facilitator dashboard - has their game started?');
        socket.emit('checkOnConnection');
        socket.on('disconnect', () => {
//            console.log('User disconnected from a facilitator dashboard');
        });
        socket.on('getGame', (id, cb) => {
            gameController.getGame(id, cb);
        });
        socket.on('startGame', (o, cb) => {
            log(`startGame`);
            gameController.startGame(o, cb);
        });
        socket.on('restoreGame', (o, cb) => {
            gameController.restoreGame(o, cb);
        });
        socket.on('resetGame', (id, cb) => {
            gameController.resetGame(id, cb);
        });
        socket.on('assignTeams', (ob, cb) => {
            gameController.assignTeams(ob, cb);
        })
    });

    playerNamespace = io.of('/player');
    playerNamespace.on('connection', async (socket) => {
        let ref = socket.request.headers.referer;
        const isReal = getQueries(ref)['isAdmin'] !== 'true';
//        console.log(`playerNamespace setup, isReal? ${isReal}`);
        if (isReal) {
            ref = ref.split('?')[0];
            const gameID = ref.split('/').reverse()[0];
            const session = await sessionController.getSessionWithAddress(`/${gameID}`);
            if (session) {
                socket.emit('playerConnect', process.env.STORAGE_ID);
            }
            socket.on('regPlayer', (data, cb) => {
//                console.log('regPlayer', data);
                gameController.registerPlayer(data, cb);
//                registerPlayer(data, cb);
            });
            socket.on('getGameCount', (cb) => {
                gameController.getGameCount(cb);
            });
        }
    });

    eventEmitter.on('gameUpdate', (game) => {
        facilitatorDashboardNamespace.emit('gameUpdate', game);
    });
    eventEmitter.on('resetAll', (id) => {
        playerNamespace.emit('resetAll');
    });

//    theIO = io;

}
const emitAll = (ev, o) => {
    io.emit(ev, o);
}
const emitSystem = (ev, o) => {
    if (io) {
        adminDashboardNamespace.emit(ev, o)
    }
}
module.exports = {
    initSocket,
    eventEmitter,
    emitSystem,
    emitAll
};
