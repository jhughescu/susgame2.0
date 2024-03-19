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
        console.log(`socketController: ${msg}`);
    }
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
//    log('INIT');
    // Handle client events
    io.on('connection', (socket) => {
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
        log('A user connected to a facilitator dashboard - has their game started?');
        socket.emit('checkOnConnection');
        socket.on('disconnect', () => {
//            log('User disconnected from a facilitator dashboard');
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
        });
        socket.on('resetTeams', (ob, cb) => {
            gameController.resetTeams(ob, cb);
        });
    });

    gameNamespace = io.of('/game-7bn3');
    gameNamespace.on('connection', async (socket) => {
        log('game connex')
    })

    playerNamespace = io.of('/player');
    playerNamespace.on('connection', async (socket) => {
        console.log('player connects');
        let ref = socket.request.headers.referer;
        const isReal = getQueries(ref)['isAdmin'] !== 'true';
//        log(`playerNamespace setup, isReal? ${isReal}`);
        if (isReal) {
            ref = ref.split('?')[0];
            const gameID = ref.split('/').reverse()[0];
            const session = await sessionController.getSessionWithAddress(`/${gameID}`);
            if (session) {
                socket.emit('playerConnect', process.env.STORAGE_ID);
            }
            socket.on('regPlayer', (data, cb) => {
                gameController.registerPlayer(data, cb);
            });
            socket.on('getGameCount', (cb) => {
                gameController.getGameCount(cb);
            });
            createGameNamespace(session.uniqueID);
//            console.log(`joiner: sessionID: ${session.uniqueID}, gameID: ${gameID}`);
            let gameNamespace = io.of(`/game-${gameID}`);
            if (gameNamespace) {
//                console.log('OK to join');
            } else {
//                console.log('no way')
            }
            socket.join(`/game${session.uniqueID}`);
        }
    });
    playerNamespaceBAD = io.of('/playerBAD');
    playerNamespaceBAD.on('connection', async (socket) => {
        let ref = socket.request.headers.referer;
        const isReal = getQueries(ref)['isAdmin'] !== 'true';
        if (isReal) {
            ref = ref.split('?')[0];
            const gameID = ref.split('/').reverse()[0];
            const session = await sessionController.getSessionWithAddress(`/${gameID}`);
            createGameNamespace(session.uniqueID);
            console.log(`player joins, sessionID: ${session.uniqueID}`);
            // test for namespace:
            let gameNamespace = io.of(`/game${session.uniqueID}`);
            if (gameNamespace) {
                console.log('OK to join'); // always appears
            } else {
                console.log('no way'); // never appears
            }
            socket.join(`/game${session.uniqueID}`);
            const socks = gameNamespaces[session.uniqueID].sockets;
            console.log(socks); // always returns "Map(0) {}"
            // test for non-existant namespace:
            gameNamespace = io.of(`/canary${session.uniqueID}`);
            if (gameNamespace) {
                console.log('OK to join NON-EXISTANT namespace'); // always appears
            } else {
                console.log('no way'); // never appears
            }
        }
    });

    eventEmitter.on('gameUpdate', (game) => {
        facilitatorDashboardNamespace.emit('gameUpdate', game);
    });
    eventEmitter.on('teamsAssigned', (game) => {
        console.log(`teamsAssigned: ${game.uniqueID}`);
        console.log(gameNamespaces.hasOwnProperty(game.uniqueID));
//        playerNamespace.emit('teamsAssigned', game);
        gameNamespaces[game.uniqueID].emit('teamsAssigned', game);
        const socks = gameNamespaces[game.uniqueID].sockets;
        for (const socketId in socks) {
            const socket = socks[socketId];
            // Access socket properties or perform actions
//            console.log(`Socket ID: ${socketId}, Connected: ${socket.connected}`);
        }
    });
    eventEmitter.on('resetAll', (id) => {
        playerNamespace.emit('resetAll');
    });
    eventEmitter.on('createNamespace', (id) => {
        createGameNamespace(id);
    });

//    theIO = io;

}// Function to initialize socket.io
function initSocketBAD(server) {

    io = socketIo(server);
//    log('INIT');
    // Handle client events
    io.on('connection', (socket) => {
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


    playerNamespaceBAD = io.of('/player');
    playerNamespaceBAD.on('connection', async (socket) => {
        let ref = socket.request.headers.referer;
        const isReal = getQueries(ref)['isAdmin'] !== 'true';
        if (isReal) {
            ref = ref.split('?')[0];
            const gameID = ref.split('/').reverse()[0];
            const session = await sessionController.getSessionWithAddress(`/${gameID}`);
            createGameNamespace(session.uniqueID);
            const playerRef = socket.handshake.headers.referer.split('=')[2]

//            console.log(socket.handshake.headers)
            const gameNamespace = gameNamespaces[`${session.uniqueID}`];

            if (gameNamespace) {
                const nsID = `game${session.uniqueID}`
//                console.log(`OK to join ${nsID}`); // always appears
                socket.join(nsID);
//                socket.join(gameNamespace);
                let socks = playerNamespace.sockets;

                if (playerRef === 'pf15') {
                    console.log(`========================================================= player joins, sessionID: ${session.uniqueID}, player: ${playerRef}`);
                    console.log(gameNamespace.name);
                    setTimeout(() => {
                        console.log(typeof(socks))
                        socks = Object.fromEntries(socks)
                        console.log(`socks ${Object.keys(socks).length}`);
//                        console.log(socks)
                        for (const socketId in socks) {
//                            console.log(socketId)
                            const socket = socks[socketId];
                            // Access socket properties or perform actions
                            console.log(`Socket ID: ${socketId}, Connected: ${socket.connected}`);
}
                    }, 1000);
                }
            } else {
                console.log('no way'); // never appears
            }
        }
    });

}
const createGameNamespace = (id) => {
    // create a game-specific namespace if one does not already exist
    const gameNamespace = id;
    if (!gameNamespaces.hasOwnProperty(id)) {
        log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ createGameNamespace: ${gameNamespace}`);
        gameNamespaces[id] = io.of(gameNamespace);
//        console.log(gameNamespaces[id]);
        gameNamespaces[id].on('connection', async (socket) => {
            log('new game connected');
        })
    }
};
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
    createGameNamespace,
    gameNamespaces
};
