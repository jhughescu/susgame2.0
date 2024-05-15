const socketIo = require('socket.io');
const { getEventEmitter } = require('./../controllers/eventController');
const gameController = require('./../controllers/gameController');
const routeController = require('./../controllers/routeController');
const sessionController = require('./../controllers/sessionController');
const adminController = require('./../controllers/adminController');
const presentationController = require('./../controllers/presentationController');

const eventEmitter = getEventEmitter();

let io = null;
let adminDashboardNamespace = null;
let facilitatorDashboardNamespace = null;
let playerNamespace = null;
const logging = true;

const gameNamespaces = {};

const log = (msg) => {
    if (process.env.ISDEV && logging) {
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

const showRoomSize = (id) => {
    const roomName = id;
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room) {
        const numSockets = room.size;
//        console.log(room);
        log(`Number of sockets in room ${roomName}: ${numSockets}`);
        return room.size;
    } else {
        log(`Room ${roomName} does not exist or has no sockets.`);
        return null;
    }
};
const getRoomSockets = (id) => {
    const roomName = id;
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room) {
        return room;
    } else {
        return null;
    }
};
// Function to initialize socket.io
function initSocket(server) {
    io = socketIo(server);
    // Handle client events
    io.on('connection', async (socket) => {
        let ref = socket.request.headers.referer;
        let src = ref.split('?')[0]
        src = src.split('/').reverse()[0];
        src = `/${src}`;
        const Q = socket.handshake.query;

        // Player clients ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (src.indexOf('/game', 0) > -1) {
            // This is a player client, add it to the relevant room (unless admin preview)
            socket.join(src);
//            showRoomSize(src);
//            log(`player joins room ${src}`);
            const queries = getQueries(ref);
            const isReal = queries['isAdmin'] !== true;
            if (isReal) {
                const gameID = src.replace('/', '');
                const facilitator = `${src}-fac`;
                gameController.playerConnectEvent(gameID, socket.id, true);
//                io.to(facilitator).emit('playerUpdate', {event: 'connection', val: true, ref: ref});
                const session = await sessionController.getSessionWithAddress(`/${gameID}`);
                if (session) {
                    socket.emit('playerConnect', process.env.STORAGE_ID);
                }
                const hasID = queries.hasOwnProperty('fid');
                const idStr = hasID ? `with ID ${queries.fid}` : '';
                socket.on('registerPlayer', (data, cb) => {
//                    log(`emit registerPlayer, game: ${data.game}, player: ${data.player}`);
                    gameController.registerPlayer(data, cb);
                    gameController.playerConnectEvent(gameID, socket.id, true);
                });
                socket.on('getRenderState', (ob, cb) => {
//                    console.log(`getRenderState heard`)
                    gameController.getRenderState(ob, cb);
                });
                socket.on('getGameCount', (cb) => {
                    gameController.getGameCount(cb);
                });
                socket.on('disconnect', () => {
//                    log(`${queries['fake'] ? 'fake' : 'real'} player disconnected from game ${src} ${idStr}`);
                    gameController.playerConnectEvent(gameID, socket.id, false);
//                    io.to(facilitator).emit('playerUpdate', {event: 'connection', val: false, ref: ref});
                });
                socket.on('submitScore', (ob, cb) => {
                    const sp = gameController.scoreSubmitted(ob, cb);
                    io.to(facilitator).emit('scoreSubmitted', sp);
                });
                socket.on('submitScoreForAverage', (ob, cb) => {
                    const sp = gameController.scoreForAverageSubmitted(ob, cb);
//                    io.to(facilitator).emit('scoreForAverageSubmitted', sp);
                });
                socket.on('submitValues', (ob) => {
                    const sp = gameController.valuesSubmitted(ob);
                    io.to(facilitator).emit('valuesSubmitted', sp);
                });
                socket.on('getScorePackets', (gameID, cb) => {
                    gameController.getScorePackets(gameID, cb);
                });
                socket.on('getValues', (idOb, cb) => {
                    gameController.getValues(idOb, cb);
                });
                socket.on('getAggregates', (ob, cb) => {
                    gameController.createAggregate(ob, cb);
                });
                log(`${queries['fake'] ? 'fake' : 'real'} player connected to game ${src} with ID ${idStr}`);
//                console.log(Boolean(gameController.getGameWithAddress(src)));
                if (!Boolean(gameController.getGameWithAddress(src))) {
                    console.log(`game not ready, request a retry`);
                    socket.emit('waitForGame');
//                    res.status(404).set('Refresh', '5;url=/'); // Refresh after 5 seconds and redirect to the home page
//                    res.send('Game not ready yet. Please wait and refresh the page.');

//                    return; // Exit the function to prevent further processing
                }
            }

        }
        // End player clients ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        // Facilitator clients ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (Q.role === 'facilitator') {
            // this is a dashboard - needs further conditions to distinguish from system admin (which currently uses a namespace)
            socket.emit('checkOnConnection');
            let roomID = null;
            if (Q.id.indexOf('game', 0) > -1) {
//                const session = await sessionController.getSessionWithAddress(Q.id);
                roomID = `${Q.id}-fac`
            } else {
                const session = await sessionController.getSessionWithID(Q.id);
                roomID = `${session.address}-fac`;
            }
//            roomID = '/trouot';
            log(`facilitator joins room ${roomID}`);
            socket.join(roomID);
//            showRoomSize(roomID);

            socket.on('disconnect', () => {
    //            log('User disconnected from a facilitator dashboard');
            });
            socket.on('checkDevMode', () => {
                const isDev = process.env.ISDEV;
//                console.log(`socketController isDev: ${isDev}, emit returnDevMode`);
                socket.emit('returnDevMode', isDev);
            })
            socket.on('getGame', (id, cb) => {
//                console.log(`on getGame`)
                gameController.getGame(id, cb);
            });
            socket.on('startGame', async (o, cb) => {
                const g = await gameController.startGame(o, cb);
                if (g) {
                    // if there are any players connected, refresh the clients
                    io.to(g.address).emit('forceRefresh');
                }
            });
            socket.on('restoreGame', (o, cb) => {
                console.log(`restoreGame heard in socketController`);
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
            socket.on('identifyPlayer', (ob) => {
                io.to(ob.game.address).emit('identifySinglePlayer', ob.player);
            });
            socket.on('makeLead', (obj) => {
                gameController.makeLead(obj);
            });
            socket.on('reassignTeam', (obj) => {
                gameController.reassignTeam(obj);
            });
            socket.on('refreshClient', (clOb) => {
//                gameController.makeLead(obj);
//                console.log(clOb);
                io.to(clOb.socketID).emit('forceRefresh');
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
            socket.on('isSocketConnected', (socketID, cb) => {
                const socks = io.sockets.sockets;
                let sc = false;
//                console.log(socks)
//                console.log(`check for ${socketID}`);
                for (const socket of socks.values()) {
                    // Check if the socket ID matches the specified ID

                    if (socket.id === socketID) {
//                        cb(socket);
//                        console.log(socket.id, socketID, socket.id === socketID);
                        sc = true;
//                        return socket; // Return the socket if found
                    }
                }
                cb(sc);
            });
            socket.on('startRound', (ob) => {
                gameController.startRound(ob);
            });
            socket.on('checkRound', (ob, cb) => {
                gameController.checkRound(ob, cb);
            });
            socket.on('getScorePackets', (gameID, cb) => {
                gameController.getScorePackets(gameID, cb);
            });
            socket.on('submitScore', (ob, cb) => {
//                    console.log(`submitScore`)
                const sp = gameController.scoreSubmitted(ob, cb);
//                io.to(facilitator).emit('scoreSubmitted', sp);
                socket.emit('scoreSubmitted', sp);
            });
            socket.on('submitValues', (ob) => {
                const sp = gameController.valuesSubmitted(ob);
//                io.to(facilitator).emit('valuesSubmitted', sp);
                socket.emit('valuesSubmitted', sp);
            });
            socket.on('setTeamSize', (ob, cb) => {
                gameController.setTeamSize(ob, cb);
            });
        }
        // End facilitator clients ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        // presentation (or slideshow) controller ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (Q.role === 'presentation-control') {
            socket.on('presentationEvent', (ob, cb) => {
                presentationController.pEvent(ob, cb);
            });
        }
        // Presentation client ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (Q.role === 'presentation') {
//            console.log('############################################## presentation connected:');
//            console.log(src);
//            console.log(Q);
//            console.log(`seek game with address /${Q.id}: `);
            const roomID = `/${Q.id}-pres`;
//            const session = await sessionController.getSessionWithAddress(`/${Q.id}`);
//            console.log(session)
//            const roomID = `${session.uniqueID}-pres`;
            socket.join(roomID);
            log(`presentation joined ${roomID}`);
            socket.emit('setGame', gameController.getGameWithAddress(`/${Q.id}`));
            socket.on('getScores', (gameID, cb) => {
                gameController.getScorePackets(gameID, cb);
            });
            socket.on('getAllValues', (gameID, cb) => {
                gameController.getAllValues(gameID, cb);
            });
            socket.on('getGame', (gameID, cb) => {
                gameController.getGame(gameID, cb);
            });
            socket.on('gotoNextSlide', (ob) => {
//                console.log(`emit to ${ob.address}-fac`);
//                const rooms = getRoomSockets(`${ob.address}-fac`);
//                console.log('rooms', rooms)
                io.to(`${ob.address}-fac`).emit('gotoNext');
//                presentationController.pEvent({gameID: gameID, event: 'next'}, () => {
//                    console.log(`empty callback`)
//                });
//                presentationController.nextSlide();
            });
        }
        // End presentation clients ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        // videoPlayer client ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (Q.role === 'videoPlayer') {
            const roomID = `/${Q.id}-videoPlayer`;
            console.log(`we have a player: ${roomID}`);
            socket.join(roomID);
            showRoomSize(roomID);
        }
        // End videoPlayer clients ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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
        socket.on('requestSessionDelete', async (ob, cb) => {
            const g = gameController.getGame(`${ob.sID}`);
            let msg = '';
            let okToDelete = false;
            if (g) {
//                console.log(`a game with that ID has been found: ${g.address}`);
                const cliFac = getRoomSockets(`${g.address}-fac`);
                const cliPla = getRoomSockets(`${g.address}`);
                if (cliFac || cliPla) {
//                    console.log(`${cliFac.size} facilitator window${cliFac.size > 1 ? 's' : ''} connected`);
                    msg = `one or more clients are connected to the game ${g.address}, cannot delete the session at this time.`
                } else {
                    okToDelete = true;
                    if (adminController.adminPasswordCheck(ob.pw)) {
                        msg = await sessionController.deleteSession(ob);
                    } else {
                        msg = 'incorrect password provided, session not deleted';
                    }
                }
            } else {
                // no game at all, fine to delete
                okToDelete = true;
            }
            if (okToDelete) {
                if (adminController.adminPasswordCheck(ob.pw)) {
                    msg = await sessionController.deleteSession(ob);
                } else {
                    msg = 'incorrect password provided, session not deleted';
                }
            }
            const cbMsg = typeof(msg) === 'string' ? {msg: msg, success: false} : msg;
            if (cbMsg.success) {
//                console.log('succcess - delete game next');
                gameController.deleteGame(ob.sID);
            }
            cb(cbMsg);
        });
        socket.on('getSessionsSock', async (cb) => {
//            if (adminController.adminPasswordCheck(ob.pw)) {
                const s = sessionController.getSessionsSock(cb);
//            } else {
//                console.log(`can't get sessions without a password`)
//            }
        });

        // Handle other socket events specific to the admin dashboard...
    });



    eventEmitter.on('gameUpdate', (game) => {
        let roomName = `${game.address}-fac`;
//        console.log(`gameUpdate emmitted to room ${roomName}`);
//        showRoomSize(roomName);
        const eGame = Object.assign({'updateSource': 'eventEmitter'}, game);
        io.to(roomName).emit('gameUpdate', eGame);
//        roomName = `${game.address}`;
//        console.log(`gameUpdate emmitted to room ${roomName}`);
//        showRoomSize(roomName);
//        io.to(roomName).emit('gameUpdate', game);
    });
    eventEmitter.on('scoresUpdated', (game) => {
        console.log(`on scoresUpdated:`);
//        console.log(game);
        console.log(game.scores);
//        console.log(game.address);
        const rp = `${game.address}-pres`;
        io.to(rp).emit('scoresUpdated', game.scores);
        const rf = `${game.address}-fac`;
        showRoomSize(rf);
        io.to(rf).emit('gameUpdate', game);
    });
    eventEmitter.on('singlePlayerGameUpdate', (ob) => {
        // requires an object: {player: <playerObject>, game}
        if (ob.hasOwnProperty('player') && ob.hasOwnProperty('game')) {
            io.to(ob.player.socketID).emit('gameUpdate', ob.game);
        } else {
            console.log(`singlePlayerGameUpdate requires an object: {player: <playerObject>, game}`)
        }
    });
    eventEmitter.on('gameWarning', (ob) => {
        let room = `${ob.gameID}-fac`;
//        showRoomSize(room);
        io.to(room).emit('gameWarning', ob);
    });
    eventEmitter.on('teamsAssigned', (game) => {
//        log(`teamsAssigned: ${game.uniqueID}, address: ${game.address}`);
        const room = io.sockets.adapter.rooms.get(game.address);
        if (room) {
            const numSockets = room.size;
            log(`Number of sockets in room ${game.address}: ${numSockets}`);
        } else {
            log(`Room ${game.address} does not exist or has no sockets.`);
        }
        io.to(game.address).emit('teamsAssigned', game);
    });
    eventEmitter.on('updatePlayers', (ob) => {
//        log(`teamsAssigned: ${game.uniqueID}, address: ${game.address}`);
        log(`we will emit ${ob.update}`);
        log(ob);
        const add = ob.game.address;
        const room = io.sockets.adapter.rooms.get(add);
        if (room) {
            const numSockets = room.size;
            log(`Number of sockets in room ${add}: ${numSockets}`);
        } else {
            log(`Room ${add} does not exist or has no sockets.`);
        }
        io.to(add).emit(ob.update, ob);
    });
    eventEmitter.on('resetAll', (address) => {
//        playerNamespace.emit('resetAll');
        log(`resetAll: ${address}`);
        showRoomSize(address)
        io.to(address).emit('resetPlayer');
    });
    eventEmitter.on('gameEnded', (game) => {
//        console.log('this is the end');
//        console.log(game)
        const upO = {
            players: game.players,
            teams: game.teams,
            state: game.state,
        }
        sessionController.updateSession(game.uniqueID, upO);
//        console.log(`attempt to emit to game clients`)
        io.to(game.address).emit('gameOver');
    });
    eventEmitter.on('test', (player) => {
//        console.log(`emit test to ${player.socketID}`)
        if (player.socketID) {
            io.to(player.socketID).emit('test');
        }
    })
    eventEmitter.on('createNamespace', (id) => {
        console.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! createNameSpace has been removed, delete any emit methods which call it')
    });
    eventEmitter.on('getSockets', (id, cb) => {
//        console.log(`getSockets heard:`);
        cb(getSockets(id));
//        return getSockets(id);
    });
    eventEmitter.on('refreshSockets', (id) => {
        io.to(id).emit('forceRefresh');
    });
    eventEmitter.on('showSlide', (slOb) => {
//        console.log('I hear you');
//        console.log(slOb);
//        if (slOb.hasOwnProperty('action')) {
            gameController.presentationAction(slOb);
//        }
        io.to(`${slOb.address}-pres`).emit('showSlide', slOb);
    });
    eventEmitter.on('updatePresentationProperty', (slOb) => {
//        console.log('I hear you');
//        console.log(slOb);
        io.to(`${slOb.address}-pres`).emit('updateProperty', slOb);
    });
    eventEmitter.on('videoAction', aOb => {
        console.log('an action for the presentation', aOb);
        const vidRoom = `${aOb.address}-videoPlayer`;
        showRoomSize(vidRoom);
        io.to(vidRoom).emit('videoAction', aOb);
    });
    eventEmitter.on('gameReady', (game) => {
        const ID = `${game.address}-pres`;
//        console.log(`I hear you, ID: ${ID}`);
//        console.log(slOb);
//        console.log(getRoomSockets(ID));
        io.to(ID).emit('gameReady', game);
    });
    eventEmitter.on('refreshPresentationWindow', gOb => {
        console.log(`refresh pres window with address ${gOb.address}`);
        const r = `${gOb.address}-pres`;
        io.to(r).emit('refreshWindow');
    });

};

const emitAll = (ev, o) => {
    io.emit(ev, o);
};
const emitSystem = (ev, o) => {
    if (io) {
        adminDashboardNamespace.emit(ev, o)
    }
};
const getSockets = (id) => {
    return getRoomSockets(id);
};
module.exports = {
    initSocket,
    eventEmitter,
    emitSystem,
    emitAll,
    gameNamespaces
};
