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

const gameNamespaces = {};

const log = (msg) => {
    if (process.env.ISDEV) {

        if (typeof(msg) === 'object' && !msg.hasOwnProperty('length')) {
            console.log(Object.assign({loggedBy: 'socketController'}, msg));
        } else {
            console.log(`socketController: ${msg}`);
        }
    }
}
const procVal = (v) => {
    // process values into numbers, booleans etc
    if (!isNaN(parseInt(v))) {
        v = parseInt(v);
    } else if (v === 'true') {
        v = true;
    } else if (v === 'false') {
        v = false;
    }
    return v;
}
const getQueries = (u) => {
//    log(u);
    let r = u.split('?');
    let qu = {};
    if (r.length > 1) {
        r = r[1].split('&');
        r.forEach(q => {
            q = q.split('=');
            qu[q[0]] = procVal(q[1]);
        });
    }
//    console.log(qu);
    return qu;
};

// Function to initialize socket.io
function initSocket(server) {

    io = socketIo(server);
//    log('INIT');
    // Handle client events
    io.on('connection', async (socket) => {
        let ref = socket.request.headers.referer;
        let src = ref.split('?')[0]
        src = src.split('/').reverse()[0];
        src = `/${src}`;
        if (src.indexOf('/game', 0) > -1) {
            // This is a player client, add it to the relevant room (unless admin preview)
            socket.join(src);
            const queries = getQueries(ref);
            const isReal = queries['isAdmin'] !== true;
//            console.log(queries);
            if (isReal) {
                const gameID = src.replace('/', '');
                const session = await sessionController.getSessionWithAddress(`/${gameID}`);

                if (session) {
                    socket.emit('playerConnect', process.env.STORAGE_ID);
                }
                socket.on('registerPlayer', (data, cb) => {
                    gameController.registerPlayer(data, cb);
                });
                socket.on('getGameCount', (cb) => {
                    gameController.getGameCount(cb);
                });
                const hasID = queries.hasOwnProperty('fid');
                const idStr = hasID ? ` with ID ${queries.fid}` : '';
                log(`${queries['fake'] ? 'fake' : 'real'} player${idStr} added to game ${src}`);
            }

        }

        socket.on('disconnect', () => {
            log('User disconnected (HTTP or WebSocket)');
        });

        // Handle other socket events
        socket.on('getSesssionWithID', (id) => {
            // Call appropriate controller method
//            log('sock');
            sessionController.getSessionWithID(id);
        });

        // Add more event handlers as needed
    });

    // Define a separate namespace for socket.io connections related to the admin dashboard
    adminDashboardNamespace = io.of('/admin/systemdashboard');
    adminDashboardNamespace.on('connection', (socket) => {
//        log('A user connected to the admin dashboard');
        socket.on('disconnect', () => {
//            log('User disconnected from the admin dashboard');
        });

        // Handle other socket events specific to the admin dashboard...
    });

    // Define a separate namespace for socket.io connections related to all facilitator dashboards
    facilitatorDashboardNamespace = io.of('/facilitatordashboard');
    facilitatorDashboardNamespace.on('connection', (socket) => {
//        log('A user connected to a facilitator dashboard - has their game started?');
        socket.emit('checkOnConnection');
        socket.on('disconnect', () => {
//            log('User disconnected from a facilitator dashboard');
        });
        socket.on('getGame', (id, cb) => {
            gameController.getGame(id, cb);
        });
        socket.on('startGame', (o, cb) => {
//            log(`startGame`);
            gameController.startGame(o, cb);
        });
        socket.on('restoreGame', (o, cb) => {
            gameController.restoreGame(o, cb);
        });
        socket.on('resetSession', (id, cb) => {
            sessionController.resetSession(id, cb);
        });
        socket.on('resetGame', (id, cb) => {
            gameController.resetGame(id, cb);
        });
        socket.on('endGame', (game, cb) => {
            gameController.endGame(game, cb);
        });
        socket.on('assignTeams', (ob, cb) => {
            gameController.assignTeams(ob, cb);
        });
        socket.on('resetTeams', (ob, cb) => {
            gameController.resetTeams(ob, cb);
        });
        socket.on('identifyPlayers', (game) => {
            io.to(game.address).emit('identifyPlayer');
        });
        socket.on('testPassword', async (ob, cb) => {
//            console.log(`testPassword`);
            let s = await sessionController.getSessionPassword(ob.session);
            if (s) {
                if (cb) {
                    cb(s.password === ob.pw);
                }
            } else {
                console.log(`no session found with id ${ob.session}`)
            }
        });
    });



    eventEmitter.on('gameUpdate', (game) => {
        facilitatorDashboardNamespace.emit('gameUpdate', game);
    });
    eventEmitter.on('teamsAssigned', (game) => {
        log(`teamsAssigned: ${game.uniqueID}`);
        io.to(game.address).emit('teamsAssigned', game);
    });
    eventEmitter.on('resetAll', (address) => {
//        playerNamespace.emit('resetAll');
        log(`resetAll: ${address}`);
        io.to(address).emit('resetAll');
    });
    eventEmitter.on('gameEnded', (game) => {
        console.log('this is the end');
        console.log(game)
        const upO = {
            players: game.players,
            teams: game.teams,
            state: game.state,
        }
        sessionController.updateSession(game.uniqueID, upO);
        console.log(`attempt to emit to game clients`)
        io.to(game.address).emit('gameOver');
    });
    eventEmitter.on('createNamespace', (id) => {
        console.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! createNameSpace has been removed, delete any emit methods which call it')
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
    emitAll,
    gameNamespaces
};
