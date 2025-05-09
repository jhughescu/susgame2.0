const socketIo = require('socket.io');
const { getEventEmitter } = require('./../controllers/eventController');
const gameController = require('./../controllers/gameController');
const routeController = require('./../controllers/routeController');
const sessionController = require('./../controllers/sessionController');
const adminController = require('./../controllers/adminController');
const presentationController = require('./../controllers/presentationController');
const downloadController = require('./../controllers/downloadController');
const logController = require('./../controllers/logController');
const gfxController = require('./../controllers/gfxController');

const tools = require('./../controllers/tools');

const eventEmitter = getEventEmitter();

let io = null;
let adminDashboardNamespace = null;
let facilitatorDashboardNamespace = null;
let playerNamespace = null;
const logging = false;

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
//        console.log(room)
        return room;
    } else {
        return new Set([]);
    }
};
// Function to initialize socket.io
function initSocket(server) {
    io = socketIo(server);
    logController.emptyFolder('logs');
    // Handle client events
    io.on('connection', async (socket) => {
        let ref = socket.request.headers.referer;
        let src = ref.split('?')[0]
        src = src.split('/').reverse()[0];
        src = `/${src}`;
        const Q = socket.handshake.query;

        socket.on('checkSocket', (o, cb) => {
//            console.log(`request for sock: ${o.sock}, ${o.address}`);
            const sock = `${o.address}-${o.sock}`;
            const ro = {total: showRoomSize(sock)};
//            console.log(`request for sock: ${sock}`);
//            const total = getRoomSockets(sock);
//            console.log(sock);
//            console.log(total);
//            console.log(getRoomSockets(sock));
            if (cb) {
                cb(ro);
//                console.log(`there is one`);
            } else {
                console.log(`no callback provided`);
            }
        });

        // System admin client ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (Q.role === 'systemadmin') {
            console.log('system admin connected');
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
//                console.log('new approach #####################################');
    //            if (adminController.adminPasswordCheck(ob.pw)) {
                    const s = sessionController.getSessionsSock(cb);
    //            } else {
    //                console.log(`can't get sessions without a password`)
    //            }
            });
            socket.on('sessionNameChange', async (ob, cb) => {
                console.log('snc')
                gameController.changeName(ob, cb);
            });
            socket.on('testPassword', async (pw, cb) => {
                if (cb) {
                    cb(pw === process.env.ADMIN_PASSWORD);
                }
            });
        }
        // End ystem admin client ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



        // Player clients ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        if (src.indexOf('/game', 0) > -1) {
            // This is a player client, add it to the relevant room (unless admin preview)
            socket.join(src);
//            showRoomSize(src);
            console.log(`player joins room ${src}, socket: ${socket.id}`);
            const queries = getQueries(ref);
            const isReal = queries['isAdmin'] !== true;
            if (isReal) {
                const gameID = src.replace('/', '');
                const facilitator = `${src}-fac`;
                const pceo = {
                    gameID: gameID,
                    socketID: socket.id,
                    connect: true
                };
//                gameController.playerConnectEvent(gameID, socket.id, true);
                gameController.playerConnectEvent(pceo);
//                io.to(facilitator).emit('playerUpdate', {event: 'connection', val: true, ref: ref});
                const session = await sessionController.getSessionWithAddress(`/${gameID}`);
                if (session) {
                    socket.emit('playerConnect', process.env.STORAGE_ID);
                }
                const hasID = queries.hasOwnProperty('fid');
                const idStr = hasID ? `with ID ${queries.fid}` : '';
                socket.on('registerPlayer', (data, cb) => {
                    const pceo = {
                        gameID: gameID,
                        socketID: socket.id,
                        connect: true
                    };
                    gameController.registerPlayer(data, cb);
//                    gameController.playerConnectEvent(gameID, socket.id, true);
                    gameController.playerConnectEvent(pceo);
                });
                socket.on('getRenderState', (ob, cb) => {
//                    console.log(`getRenderState heard`)
                    gameController.getRenderState(ob, cb);
                });
                socket.on('getGameCount', (cb) => {
                    gameController.getGameCount(cb);
                });
                socket.on('disconnect', () => {
                    const pceo = {
                        gameID: gameID,
                        socketID: socket.id,
                        connect: false
                    };
//                    gameController.playerConnectEvent(gameID, socket.id, false);
                    gameController.playerConnectEvent(pceo);
                });
                socket.on('submitScore', (ob, cb) => {
//                    console.log(`submitScore heard in socket`);
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
                socket.on('ping', () => {
//                    console.log('pinged')
                    socket.emit('pong');
                });
                socket.on('recordthegame', (g) => {
//                    console.log('herd');
                    logController.writeBeautifiedJson(`logs`, `game`, g);
                });
                socket.on('playerErrorReport', (o) => {
                    console.log(`PLAYER ERROR: ${o.err}`);
                    if (o.player) {
                        console.log(`PLAYER ERROR ADDITIONAL: ${o.err} (${o.player.id})`);
                    }
                });
                log(`${queries['fake'] ? 'fake' : 'real'} player connected to game ${src} with ID ${idStr}`);
//                console.log(Boolean(gameController.getGameWithAddress(src)));
                if (!Boolean(gameController.getGameWithAddress(src))) {
//                    console.log(`game not ready, request a retry`);
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
                console.log(`facilitator attempts to find session with ID ${Q.id}`);
                const session = await sessionController.getSessionWithID(Q.id);
                if (session) {
                    roomID = `${session.address}-fac`;
                } else {
                    console.log(`facilitator connection found no session (id: ${Q.id})`)
                }
            }
//            roomID = '/trouot';
//            console.log(`facilitator joins room ${roomID}`);
            socket.join(roomID);
//            showRoomSize(roomID);

            socket.on('disconnect', () => {
    //            log('User disconnected from a facilitator dashboard');
            });
            socket.on('checkDevMode', () => {
                const isDev = tools.procVal(process.env.ISDEV);
//                console.log(`socketController isDev: ${isDev}, emit returnDevMode`);
                socket.emit('returnDevMode', isDev);
            });
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
//                sessionController.resetSession(id, cb);
//                console.log(`#################################################################### socketController resetSession`);
                gameController.resetSession(id, cb);
            });
            socket.on('resetGame', (id, cb) => {
                gameController.resetGame(id, cb);
            });
            socket.on('endGame', (game, cb) => {
                gameController.endGame(game, cb);
            });
            socket.on('sessionNameChange', async (ob, cb) => {
                console.log(ob);
                console.log(`${ob.gameID}`, {name: ob.name});
                gameController.changeName(ob);
//                return;
//                const sesh = await sessionController.updateSession(`${ob.gameID}`, {name: ob.name});
//                if (sesh) {
//                    console.log(sesh);
//                    if (cb) {
//                        console.log('yes cb')
//                        cb(sesh);
//                        io.to(ob.gameID)
//                    } else {
//                        console.log('no cb')
//                    }
//                } else {
//                    console.log('not a sesh')
//                }
//                sessionController.updateSession(ob.game, {name: ob.name});
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
            socket.on('removePlayer', (plOb, cb) => {
//                gameController.makeLead(obj);
//                console.log(clOb);
                gameController.removePlayer(plOb, cb);
//                io.to(clOb.socketID).emit('forceRefresh');
            });
            socket.on('testPassword', async (ob, cb) => {
                let s = ob.adminOnly ? true : await sessionController.getSessionPassword(ob.session);
                if (s) {
                    if (cb) {
                        cb(ob.pw === s.password || ob.pw === process.env.ADMIN_PASSWORD);
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
            socket.on('getDetailedScorePackets', (gameID, cb) => {
                gameController.getDetailedScorePackets(gameID, cb);
            });
            socket.on('getScorePackets', (gameID, cb) => {
                gameController.getScorePackets(gameID, cb);
            });
            socket.on('getScores', (gameID, cb) => {
                gameController.getScores(gameID, cb);
            });
            socket.on('getTotals1', (gameID, cb) => {
                gameController.getTotals1(gameID, cb);
            });
            socket.on('getTotals2', (gameID, cb) => {
                gameController.getTotals2(gameID, cb);
            });
            socket.on('getTotals3', (gameID, cb) => {
                gameController.getTotals3(gameID, cb);
            });
            socket.on('getTotals4', (gameID, cb) => {
                gameController.getTotals4(gameID, cb);
            });
            socket.on('submitScore', (ob, cb) => {
//                console.log(`############################ submitScore`);
                const sp = gameController.scoreSubmitted(ob, cb);
//                io.to(facilitator).emit('scoreSubmitted', sp);
                socket.emit('scoreSubmitted', sp);
            });
            socket.on('submitValues', (ob) => {
                const sp = gameController.valuesSubmitted(ob);
//                io.to(facilitator).emit('valuesSubmitted', sp);
                socket.emit('valuesSubmitted', sp);
            });
            socket.on('getAggregates', (ob, cb) => {
                gameController.createAggregate(ob, cb);

            });
            socket.on('submitScoreForAverage', (ob, cb) => {
                const sp = gameController.scoreForAverageSubmitted(ob, cb);
//                    io.to(facilitator).emit('scoreForAverageSubmitted', sp);
            });
            socket.on('setTeamSize', (ob, cb) => {
                gameController.setTeamSize(ob, cb);
            });
            socket.on('requestCSV', (ob, cb) => {
//                console.log(`requestCSV`, ob)
                const data = ob;
                if (data) {
//                    console.log(data);
//                    return;
                    const csv = downloadController.convertToCSV(data);
                    if (cb) {
                        cb(csv);
                    } else {
                        console.log(`requestCSV: no callback provided`)
                    }
                } else {
                    console.log('requestCSV: no data returned');
                }
            });
            socket.on('scoreUpdate', (ob) => {
//                console.log('new score update:');
//                console.log(sp);
                const rooms = ['-pres', '-pres-control', '']; /* empty value for the player clients */
                rooms.forEach(r => {
                    const room = `${ob.address}${r}`;
//                    console.log(`emit scoreUpdate to room ${room} which has ${getRoomSockets(room).size} socket(s)`);
        //            console.log(getRoomSockets(room));
                    io.to(room).emit('scoreUpdate', ob.sp);
                });
            });
            socket.on('presentationOverlay', (ob) => {
                const rid = `${ob.game}-pres`;
//                console.log(`pre rooms: ${rid} ${showRoomSize(rid)}`);
                io.to(rid).emit('toggleOverlay', ob.type);
            });
            socket.on('preparePresentation', (ob) => {
                const rid = `${ob.address}-pres`;
//                console.log(`pre rooms: ${rid} ${showRoomSize(rid)}`);
//                console.log(ob)
                io.to(rid).emit('preparePresentation', ob);
                const ridC = `${ob.address}-pres-control`;
//                console.log(`pre rooms: ${ridC} ${showRoomSize(ridC)}`);
//                console.log(ob)
                io.to(ridC).emit('preparePresentation', ob);
            });
            socket.on('resetEndedGame', (ob, cb) => {
//                console.log(`resetEndedGame`);
                const ok = ob.pw === process.env.ADMIN_PASSWORD;
                if (ok) {
                    sessionController.resetSession(ob.session, cb);
                } else {
                    if (cb) {
                        cb(ok);
                    }
                }
//                cb(ok);
            });
            socket.on('test', (cb) => {
                if (cb) {
                    cb();
                }
            });
            socket.on('togglePresInfo', address => {
                const room = `${address}-pres`;
                const rooms = getRoomSockets(room);
                io.to(room).emit('togglePresInfo');
            });
            socket.on('getQrString', (url, cb) => {
                gfxController.generateQRText(url, cb);
            });
        }
        // End facilitator clients ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        // presentation (or slideshow) controller ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (Q.role === 'presentation-control') {
//            const roomID = `/${Q.id}-pres-control`;
            console.log(`socketController - presentation-control calls getWithSessionID with ID ${Q.id}`);
            const session = await sessionController.getSessionWithID(Q.id);
            if (session) {
            roomID = `${session.address}-pres-control`;
                socket.join(roomID);
    //            console.log(`the pres control registers as ${roomID}`);
                socket.on('presentationEvent', (ob, cb) => {
                    presentationController.pEvent(ob, cb);
                });
            }
        }
        // log update display ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (Q.role === 'updatelog') {
//            console.log(`'''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''' go logger`);
            roomID = `updateLog`;
            socket.join(roomID);
            socket.on('getUpdateLog', cb => {
                logController.getUpdateLog(cb);
            });
        }

        // Presentation client ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (Q.role === 'presentation') {
//            console.log('############################################## presentation connected:');
//            console.log(src);
//            console.log(Q);
//            console.log(`seek game with address /${Q.id}: `);
            const roomID = `/${Q.id}-pres`;
            const controlID = `/${Q.id}-pres-control`;
            console.log(`presentation roomID: ${roomID}`);
//            showRoomSize(facID);
//            const session = await sessionController.getSessionWithAddress(`/${Q.id}`);
//            console.log(session)
//            const roomID = `${session.uniqueID}-pres`;
            socket.join(roomID);
//            log(`presentation joined ${roomID}`);
            socket.emit('setGame', gameController.getGameWithAddress(`/${Q.id}`));
            socket.on('getScores', (gameID, cb) => {
                console.log(`presentation requests scores`);
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
            socket.on('getTotals1', (gameID, cb) => {
                gameController.getTotals1(gameID, cb);
            });
            socket.on('getTotals2', (gameID, cb) => {
                gameController.getTotals2(gameID, cb);
            });
            socket.on('getTotals3', (gameID, cb) => {
                gameController.getTotals3(gameID, cb);
            });
            socket.on('getTotals4', (gameID, cb) => {
                gameController.getTotals4(gameID, cb);
            });
            socket.on('slideUpdated', (ob) => {
                const targs = ['fac', 'pres-control'];
                targs.forEach(t => {
                    const r = `${ob.gameAddress}-${t}`;
                    io.to(r).emit('presentationSlideUpdated', ob);
                });
            });
            socket.on('videoPositionUpdate', (ob) => {
                const roomID = `${ob.address}-pres-control`;
//                showRoomSize(roomID)
                io.to(roomID).emit('videoPositionUpdate', ob);
            });
            io.to(controlID).emit('presentationConnect', {room: `/${Q.id}-fac`, connected: true});
            socket.on('disconnect', () => {
                io.to(controlID).emit('presentationConnect', {room: `/${Q.id}-fac`, connected: false});
            });
        }
        // End presentation clients ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        // videoPlayer client ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (Q.role === 'videoPlayer') {
            const roomID = `/${Q.id}-videoPlayer`;
//            console.log(`we have a player: ${roomID}`);
            socket.join(roomID);
            showRoomSize(roomID);
        }
        // End videoPlayer clients ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


        if (Q.role === 'displaygame') {
            const roomID = `/${Q.id}-displaygame`;
            socket.join(roomID);

            showRoomSize(roomID);
            socket.on('getGame', (id, cb) => {
                const g = gameController.getGameWithAddress(id);
                if (cb) {
                    cb(id, g);
                }
            });
        }


        // session display client ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (Q.role === 'adminsessiondisplay') {
            const roomID = `/${Q.id}-displaysession`;
            socket.join(roomID);
            console.log(`displaygame client connected, roomID: ${roomID}`);
            socket.on('getSession', (id, cb) => {
                const sessions = sessionController.getSessionsSock((all) => {
                    const seshes = all.filter(s => s.address === id);
                    if (cb) {
                        cb(seshes.length > 0 ? seshes[0] : false);
                    }
                });
            });
            socket.on('getGame', (id, cb) => {
                const g = gameController.getGameWithAddress(id);
                if (cb) {
                    cb(g);
                }
            });
        }
         // end session display client ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        // scoretest client ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (Q.role) {
            if (Q.role.split('.')[0] === 'scoretest') {
                const id = Q.id.replace('game-', '');
                const roomID = `/game-${id}-scoreSetter`;
                socket.join(roomID);
    //            console.log('############################## scoretest room size', roomID, showRoomSize(roomID));
                socket.on('sendScores', (o, cb) => {
    //                console.log('scores Sent');
                    gameController.onScoresSent(o, cb);
                });
                socket.on('getGame', (o, cb) => {
    //                console.log('try to get the game');
                    cb(gameController.getGameWithAddress(`/game-${o}`));
                });
                socket.on('forceScore', (o, cb) => {
                    gameController.forceScore(o, cb);
                });
            }
        }
        // end scoretest client ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        // help page client (doesn't need to be linked to a game) ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if (src.includes('/help')) {
            socket.emit('helpSetup', {
                storageID: process.env.STORAGE_ID
            });
        }
        // end help page client ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        // Handle other socket events
        socket.on('getSesssionWithID', (id) => {
            // Call appropriate controller method
//            log('sock');
            console.log(`"other" event looks for session with ID ${id}`);
            sessionController.getSessionWithID(id);
        });

        // Add more event handlers as needed
    });

    // Define a separate namespace for socket.io connections related to the admin dashboard
    adminDashboardNamespace = io.of('/admin/systemdashboardGONENOWMOVEDTONEWSYSTEMADMINROLE');
    adminDashboardNamespace.on('connection', (socket) => {
//        log('A user connected to the admin dashboard');
        /*
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
        socket.on('sessionNameChange', async (ob, cb) => {
            gameController.changeName(ob, cb);
        });
        */
        // Handle other socket events specific to the admin dashboard...
    });

    eventEmitter.on('gameUpdate', (game) => {
//        const eGame = Object.assign({'updateSource': 'eventEmitter'}, game);
        const eGame = Object.assign({}, game);
        eGame._updateSource = Object.assign({conduit: `eventEmitter`}, eGame._updateSource);
//        eGame.updateSource = Object.assign({'updateSource': 'eventEmitter'}, game);
        const rooms = ['-pres', '-pres-control', '-fac', '', '-displaygame', '-scoreSetter']; /* empty value for the player clients */
//        console.log('hup date');
        rooms.forEach(r => {
            const room = `${game.address}${r}`;
//            console.log(`emit gameUpdate to room ${room} which has ${getRoomSockets(room).size} socket(s)`);
            io.to(room).emit('gameUpdate', eGame);
        });
    });
    eventEmitter.on('gameRestored', (gOb) => {
        let roomName = `${gOb.game}-fac`;
//        console.log('noo event');
        showRoomSize(roomName);
        io.to(roomName).emit('onGameRestored', gOb);
        roomName = `${gOb.game}-pres`;
//        console.log('noo event');
        showRoomSize(roomName);
        io.to(roomName).emit('onGameRestored', gOb);
    });
    eventEmitter.on('scoresUpdated', (game) => {

        // NOTE scoresUpdated is being used by the presentation but should really be replaced by the more general & useful gameUpdate event
//        console.log(`on scoresUpdated:`);

        const rooms = ['-pres', '-fac', '', '-scoreSetter']; /* empty value for the player clients */
        rooms.forEach(r => {
            const room = `${game.address}${r}`;
//            console.log(`emit to room ${room} which has some socket(s)`);
//            showRoomSize(room)
//            console.log(`emit scoresUpdated to room ${room} which has ${getRoomSockets(room).size} socket(s)`);
//            const eGame = Object.assign({_updateSource: {event: ''}}, game);
//            console.log(getRoomSockets(room));
            const eGame = Object.assign({}, game);
            eGame._updateSource = Object.assign({conduit: `eventEmitter`}, eGame._updateSource);
            io.to(room).emit('gameUpdate', eGame);
        });
//        const rp = `${game.address}-pres`;
//        io.to(rp).emit('scoresUpdated', game.scores);
//        const rf = `${game.address}-fac`;
//        showRoomSize(rf);
//        io.to(rf).emit('gameUpdate', game);
    });
    eventEmitter.on('singlePlayerGameUpdate', (ob) => {
        // requires an object: {player: <playerObject>, game}
        if (ob.hasOwnProperty('player') && ob.hasOwnProperty('game')) {
            const rOb = {game: ob.game, emitType: 'singlePlayer'};
            io.to(ob.player.socketID).emit('gameUpdate', rOb);
            io.to(ob.player.socketID).emit('playerUpdate', rOb);
//            console.log(`emit to ${ob.player.socketID} (${typeof(ob.player.socketID)})`);
        } else {
            console.log(`singlePlayerGameUpdate requires an object: {player: <playerObject>, game}`)
        }
    });
    eventEmitter.on('playerRemoved', (ob) => {
//        console.log(`removed player`);
//        console.log(ob);
//        console.log(`emit to ${ob.sock} (${typeof(ob.sock)})`);
//        showRoomSize(ob.player.sock)
//        io.to(ob.game).emit('playerRemoved', Object.assign({src: 'all game'}, ob));
        io.to(ob.sock).emit('playerRemoved', Object.assign({src: 'just socket'}, ob));
    });
    eventEmitter.on('gameWarning', (ob) => {
        let room = `${ob.gameID}-fac`;
//        showRoomSize(room);
        io.to(room).emit('gameWarning', ob);
    });
    eventEmitter.on('teamsAssigned', (game) => {
//        log(`teamsAssigned: ${game.uniqueID}, address: ${game.address}`);
        let room = io.sockets.adapter.rooms.get(game.address);
        if (room) {
            const numSockets = room.size;
            log(`Number of sockets in room ${game.address}: ${numSockets}`);
        } else {
            log(`Room ${game.address} does not exist or has no sockets.`);
        }
        io.to(game.address).emit('teamsAssigned', game);
        let roomName = `${game.address}-fac`;
        room = io.sockets.adapter.rooms.get(roomName);
//        console.log('teamsAssigned');
        if (room) {
            const numSockets = room.size;
            log(`Number of sockets in room ${game.address}: ${numSockets}`);
        } else {
            log(`Room ${game.address} does not exist or has no sockets.`);
        }
        io.to(roomName).emit('teamsAssigned', game);
    });
    eventEmitter.on('teamsReset', (game) => {
//        log(`teamsAssigned: ${game.uniqueID}, address: ${game.address}`);
        let room = io.sockets.adapter.rooms.get(game.address);
        if (room) {
            const numSockets = room.size;
//            log(`Number of sockets in room ${game.address}: ${numSockets}`);
        } else {
//            log(`Room ${game.address} does not exist or has no sockets.`);
        }
        io.to(game.address).emit('teamsReset', game);
    });
    eventEmitter.on('updatePlayers', (ob) => {
//        log(`teamsAssigned: ${game.uniqueID}, address: ${game.address}`);
//        console.log(`we will emit ${ob.update}`);
//        log(ob);
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
        io.to(`${slOb.address}-fac`).emit('onShowSlide', slOb);
        io.to(`${slOb.address}-pres`).emit('showSlide', slOb);
    });
    eventEmitter.on('updatePresentationProperty', (slOb) => {
//        console.log('I hear you');
//        console.log(slOb);
        io.to(`${slOb.address}-pres`).emit('updateProperty', slOb);
    });
    eventEmitter.on('videoAction', aOb => {
//        console.log('an action for the presentation', aOb);
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
//        console.log(`refresh pres window with address ${gOb.address}`);
        const r = `${gOb.address}-pres`;
        io.to(r).emit('refreshWindow');
    });
    eventEmitter.on('updateLogUpdated', ob => {
//        console.log(`update log updated: ${JSON.parse(ob).update_0.event}`);
        const roomID = `updateLog`;
        io.to(roomID).emit('logsUpdated', ob);
    });
    eventEmitter.on('roundComplete', game => {
        const rooms = ['-pres', '-fac', ''];
        rooms.forEach(r => {
            const room = `${game.address}${r}`;
//            console.log(`emit roundComplete to room ${room} which has ${getRoomSockets(room).size} socket(s)`);
            const eGame = Object.assign({}, game);
            eGame._updateSource = Object.assign({conduit: `eventEmitter`}, eGame._updateSource);
            io.to(room).emit('roundComplete', eGame);
        });
    });
    eventEmitter.on('sessionUpdated', (s) => {
//        console.log('I have a session update:');
//        console.log(s);
        const roomID = `${s.address}-displaysession`;
//        console.log(`emit onSessionUpdated to room ${roomID} which has ${getRoomSockets(roomID).size} socket(s)`);
        io.to(roomID).emit('onSessionUpdated', s);
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
