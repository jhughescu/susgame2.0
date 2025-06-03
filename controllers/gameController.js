let Game = null;
let Player = null;
let Presentation = null;
let Team = null;
let ScorePacket = null;
const sessionController = require('./../controllers/sessionController');
const { getEventEmitter } = require('./../controllers/eventController');
const routeController = require('./../controllers/routeController');
const gfxController = require('./../controllers/gfxController');
const logController = require('./../controllers/logController');
const { getGameMutex } = require('./mutexRegistry');

const chalk = require('chalk');
const tools = require('./../controllers/tools');

const eventEmitter = getEventEmitter();
const toString = () => {return 'gameController'};
let updateDelay = null;
const games = {};
const autoTeam = true; /* autoTeam means players will be assigned a team upon entering the session */

const log = (msg) => {
    const m = toString();
    const logging = logController.moduleLogging(m);
    if (process.env.ISDEV && logging) {
        if (typeof(msg) === 'object' && !msg.hasOwnProperty('length')) {
            console.log(Object.assign({loggedBy: m}, msg));
        } else {
            console.log(chalk.bgWhite.black(m), chalk.yellow(msg));
        }
    }
};
const error = (msg) => {
    console.log(`>>>>>>>>>>> gameController error: ${msg}`);
};

async function startGame (o, cb) {
    // startGame will create a new game if one does not exist, and return the Game in either case
    const session = JSON.parse(o);
//    console.log(`gameController startGame, session:`);
//    console.log(session);
    const game = `game-${session.uniqueID}`;
//    log(`startGame: ${game}`);
    let rg = null;
    if (!games.hasOwnProperty(game)) {
//        console.log('no game exists, create it');
        if (session.hasOwnProperty('type')) {
            Game = require(`./../models/game.${session.type}`);
            Player = require(`./../models/player.${session.type}`);
            Presentation = require(`./../models/presentation.${session.type}`);
            Team = require(`./../models/team.${session.type}`);
            ScorePacket = require(`./../models/scorepacket.${session.type}`);
            const newGame = await new Game(session.uniqueID, session.type);
            const presentation = await new Presentation(session.uniqueID, session.type);
            await presentation.loadPersistentData();
            presentation.currentSlide = session.slide;
            newGame.presentation = presentation;
            games[game] = newGame;
//            console.log(`start it up ${newGame.presentation.currentSlide}`);
        } else {
            log('cannot start game, session has no "type" property');
        }
    } else {
//        console.log('game already exists, do nothing');
    }
    games[game].presentation.currentSlide = session.slide;
//    console.log(`the game`);
//    console.log(games[game]);
//    console.log('session.slide', session.slide);
//    console.log('game.presentation.currentSlide', games[game].presentation.currentSlide);
    // Only set state to 'started' if it is currently pending
//    console.log(`session.state: ${session.state}`);
    if (session.state ===  'pending') {

        const rSession = await sessionController.updateSession(session.uniqueID, {state: 'started'});
        if (rSession) {
            session.state = rSession.state;
//            console.log('OK, the return is good');
//            console.log(`session`, session);
//            console.log(`rSession`, rSession);

        }
    }

    rg = games[game];
    Object.assign(rg, session);
    routeController.createRoute(`${session.address}`);
////    console.log(`gameController sets the QR`);
//    console.log(session);
    gfxController.generateSessionQR(session);
    try {
        await rg.loadPersistentData(session.type);
    } catch (error) {
        console.error('Error loading persistent data:', error);
    }
    const smts = session.mainTeamSize;
    const pdts = rg.persistentData.teamSize;
    if (!smts) {
        sessionController.updateSession(session.uniqueID, {mainTeamSize: pdts});
    }
    eventEmitter.emit('gameReady', rg);
    if (cb) {
//        console.log('game to return:', rg);
        cb(rg);
    }

//    console.log('result of startGame:');
//    console.log(rg);


    return rg;
};
async function restoreGame (o, cb) {
//    log('RESTORE');
//    console.log(o);
//    console.log(JSON.parse(o));
    // restoreGame will set up a game that has been started, but due to some sort of failure has been removed from the 'games' object.
    // Restore by creating a new instance of Game and then loading any stored info from the database.
    // NOTE a Game is a far more complex object than a Session, which comprises only the persistent data, hence the need to rebuild.
    let game = await startGame(o);
//    console.log(`restoreGame looks for session with ID ${game.uniqueID}`);
    const session = await sessionController.getSessionWithID(game.uniqueID);
    if (session) {
        game = Object.assign(game, session._doc);
//        log(`num players: ${game.players.length} num fullplayers: ${Object.values(game.playersFull).length}`);
//        log(`num developed fullplayers: ${Object.values(game.playersFull).filter(p => p.hasOwnProperty('teamObj')).length}`);
//        log(`num undeveloped fullplayers: ${Object.values(game.playersFull).filter(p => !p.hasOwnProperty('teamObj'))}`);
        Object.values(game.playersFull).forEach((p, i) => {
            const s = `${i} ${p.id} ${p.teamObj ? p.teamObj.title : ''}`;
//            log(s);
        });

        // RETAIN LINE BELOW:
//        log(`gameController.restoreGame has restored the game ${game.uniqueID}`);
        if (tools.isDev()) {
//            restoreClients(game.address);
        }
        // instead of refreshing clients /\ try renewing \/ them with updated game data
        renewClients(game);
        eventEmitter.emit('gameRestored', {game: game.address});
    }
//    console.log(game);
    if (cb) {
        cb(game);
    } else {
        console.error('restoreGame requires a callback');
    }
};
async function resetGame(id, cb) {
    log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> reset game');
    const game = getGameWithUniqueID(id);
    const exclusions = ['presentation', 'persistentData', 'players'];
    if (game) {
        // Note: add a condition that only system admin can reset a game with state='ended'
        if (game.state === 'ended') {

        } else {

        }

        // ADD A NEW CONDITION HERE THAT PREVENTS THE ERASURE OF 'PLAYERS'
        // NOTE: TRY JUST NOT RESETTING THE SESSION; IF THE STORED DATA SURVIVES THIS MAY BE ENOUGH



        eventEmitter.emit('resetAll', game.address);
        Object.entries(game).forEach(value => {
            if (typeof(value) === 'object') {
                if (value.hasOwnProperty.length) {
                    value = [];
                } else {
                    value = {};
                }
            }
        });
        for (let i in game) {
            if (typeof(game[i]) === 'object' && exclusions.indexOf(i, 0) === -1) {
                if (game[i].hasOwnProperty('length')) {
                    game[i] = [];
                } else {
                    game[i] = {};
                }
            }
        }
        game.state = 'pending';
        game.state = 'started';
        game.round = 0;
        game.slide = 0;
        const sOb = {
            state: 'pending',
            state: 'started',
            players: game.players,
//            teams: game.teams,
            teams: [],
            scores: [],
            values: [],
            slide: game.slide,
            round: game.round
        };
        const session = await sessionController.updateSession(id, sOb);
        if (session) {
            log('return updated session here');
            log(session);
            if (cb) {
                cb(session);
            }
        } else {
            log('no session')
        }
        const eGame = Object.assign({'_updateSource': {event: 'gameController resetGame', type: 'game'}}, game);
        // eventEmitter.emit('gameUpdate', eGame);
        emitUpdate(eGame);
    } else {
        log('no game');
    }
};
async function makeLead (ob) {
    // change the team lead based on the object passed
    const game = games[`game-${ob.game}`];
    if (game) {
        let t = game.teams[ob.team].slice();
        t.splice(t.indexOf(ob.player), 1);
        t.unshift(ob.player);
        game.teams[ob.team] = t;
        const leadNew = game.playersFull[ob.player];
        const leadOld = game.playersFull[t[1]];
        game.setTeam(leadNew);
        //  \/ changes the existing lead (which has now been shunted to index 2)
        game.setTeam(leadOld);
        const session = await sessionController.updateSession(ob.game, {teams: game.teams});
//        const eGame = Object.assign({'_updateEvent': 'makeLead'}, game);
        const eGame = Object.assign({'_updateSource': {event: 'gameController makeLead', playerID: ob.player.id, type: 'team'}}, game);
        // eventEmitter.emit('gameUpdate', eGame);
        emitUpdate(eGame);
        eventEmitter.emit('singlePlayerGameUpdate', {player: leadNew, game});
        eventEmitter.emit('singlePlayerGameUpdate', {player: leadOld, game});
    } else {
        log(`cannot change lead; no game with ID game-${ob.game}`)
    }

};
async function reassignTeam (ob) {
    // assign a player to a different team
    const game = games[`game-${ob.game}`];
    if (game) {
//        console.log(ob);
        let oldT = game.teams[ob.team].slice();
        let newT = game.teams[ob.newTeam].slice();
//        console.log(oldT);
//        console.log(newT);
        oldT.splice(oldT.indexOf(ob.player), 1);
        newT.push(ob.player);
//        console.log(`new team`, newT);
//        console.log(`old team`, oldT);
//        return;
//        t.splice(t.indexOf(ob.player), 1);
//        t.unshift(ob.player);
        game.teams[ob.team] = oldT;
        game.teams[ob.newTeam] = newT;
        const player = game.playersFull[ob.player];
        game.setTeam(player);
        //  \/ changes the existing lead (which has now been shunted to index 2)
//        game.setTeam(leadOld);
        const session = await sessionController.updateSession(ob.game, {teams: game.teams});
//        const eGame = Object.assign({'_updateEvent': 'reassignTeam'}, game);
        const eGame = Object.assign({'_updateSource': {event: 'gameController reassignTeam', playerID: player.id, type: 'team'}}, game);
        // eventEmitter.emit('gameUpdate', eGame);
        emitUpdate(eGame);
        eventEmitter.emit('singlePlayerGameUpdate', {player: player, game});
    } else {
        log(`cannot reassign player; no game with ID game-${ob.game}`)
    }

};
async function removePlayer (ob, cb) {
//    console.log('removePlayer:');
//    console.log(ob);
    const pl = ob.player;
    if (!cb) {
        cb = () => {};
    }
    const game = games[`game-${ob.game}`];
    if (game) {
        try {
            // remove player from any teams they belong to
            const t = game.teams.filter(tm => tm.indexOf(pl, 0) > -1);
            game.teams.forEach((tm, i) => {
                if (tm.indexOf(ob.player, 0) > -1) {
                    if (tm.length === 1) {
//                        throw new Error('player is only team member');
                    }
                    game.teams[i].splice(game.teams[i].indexOf(pl), 1);
                }
            });
            const newP = game.players.splice(game.players.indexOf(pl, 0), 1);
            const session = await sessionController.updateSession(ob.game, {players: game.players, teams: game.teams});
//            console.log('detective');
//            console.log(pl);
//            console.log(game.playersFull[pl]);
            let fullPlayer = game.playersFull[pl] ? JSON.parse(JSON.stringify(game.playersFull[pl])) : false;
            const removeObj = {
                game: game.address,
                player: pl,
                temp: 'game.removed'
            };
            // add to removeObj all props of ob EXCEPT player and game
            Object.entries(ob).forEach(e => {
                if (e[0] !== 'game' && e[0] !== 'player') {
                    removeObj[e[0]] = e[1];
                }
            });
            if (fullPlayer) {
                removeObj.sock = fullPlayer.socketID;
            }
            delete game.playersFull[pl];
            const eGame = Object.assign({'_updateSource': {event: 'gameController removePlayer', playerID: pl.id, type: 'player'}}, game);
            emitUpdate(eGame);
            log('PLAYER REMOVED');
            eventEmitter.emit('playerRemoved', removeObj);
            if (cb) {
                cb({success: true});
            }
        } catch (error) {
            cb({data: null, err: error.message, success: false});
        }
    } else {
        console.log(`can't remove player, specifed game doesn't exist.`);
    }
};
async function changeName (ob, cb) {
//    console.log(`changeName:`);
    if (isNaN(ob.gameID)) {
        ob.gameID = parseInt(ob.gameID);
    }
//    console.log(ob);
    const sesh = await sessionController.updateSession(`${ob.gameID}`, {name: ob.name});
//    console.log(sesh);
    const game = games[`game-${ob.gameID}`];
    if (sesh) {
        if (game) {
            game.name = sesh.name;
//            const eGame = Object.assign({'_updateEvent': 'changeName'}, game);
            const eGame = Object.assign({'_updateSource': {event: 'gameController changeName', type: 'session'}}, game);
            // eventEmitter.emit('gameUpdate', eGame);
            emitUpdate(eGame);
        }
        if (cb) {
            cb(sesh.uniqueID);
        }
    } else {
        error(`gameController: can't change name, game or session undefined`)
    }
};

const temp = () => {
    log('hiaisoj')
};
const clearPlayers = (gID) => {
    // clear the players AND teams
    const g = games[gID];
//    log('clearPlayers method');
//    console.log(g);
    if (g) {
        g.players = [];
        g.playersFull = {};
        g.teams = [];
        g.teamObjects = {};
    } else {
//        log(`game not found: ${gID}`);
    }
};
const resetSession = async (id, cb) => {
    // dev only method for now
    log(`resetSession, id: ${id}`);
    const sesh = await sessionController.resetSession(id);
    const gID = `game-${id}`;
//    console.log(games[gID])
//    deleteGame(gID);
    clearPlayers(gID);
    if (sesh) {
//        delete games[gID];
        if (cb) {
            cb('chips')
        }
        return;
        startGame(JSON.stringify(sesh), (rgame) => {
            cb({game: tools.mapSessionToGame(sesh, rgame), session: sesh});
//            console.log('THE CALLBACK CALLBACK')
        });
    }
};
const mapSessionToGameGONETOTOOLS = (s, g) => {
    const rg = Object.assign({}, g);
    for (let i in g) {
        if (g.hasOwnProperty(i)) {
            rg[i] = s[i];
        }
    }
    return rg;
};
const emitUpdate = (eGame) => {
    if (eGame.hasOwnProperty('_updateSource')) {
        const us = JSON.stringify(eGame._updateSource);
        if (tools.isValidJSON(us)) {
//            console.log(eGame.address);
            logController.addUpdate({game: eGame.address, update: us});
        } else {
            log('JSON error');
        }
    }
//    log('emit an update');
    eventEmitter.emit('gameUpdate', eGame);
};
const restoreClients = (address) => {
    // refresh connected clients on game restore
    setTimeout(() => {
        eventEmitter.emit('getSockets', address, (socks) => {
            if (socks) {
                if (socks.size > 0) {
//                    console.log(`${address} has ${socks.size} clients connected`);
                    // game has connected clients, wait then refresh them
                    setTimeout(() => {
                        eventEmitter.emit('refreshSockets', address);
                    }, 1000);
                }
            }
        });
    }, 500);
};
const renewClients = (game) => {
    // renew connected clients on game restore
    setTimeout(() => {
        eventEmitter.emit('getSockets', game.address, (socks) => {
            if (socks) {
                if (socks.size > 0) {
//                    console.log(`${address} has ${socks.size} clients connected`);
                    // game has connected clients, wait then refresh them
                    setTimeout(() => {
                        eventEmitter.emit('renewSockets', game);
                    }, 1000);
                }
            }
        });
    }, 500);
};
const getGameCount = (cb) => {
//    log('getGames');
//    log(cb);
    if (cb) {
        cb(Object.keys(games).length);
    }
    return games;
};
const getGame = (id, cb) => {
    let gg = null;
//    log(`get game with id ${id}`);
//    log(games);
    id = id.toString();
    if (id.indexOf('/', 0) > -1) {
        // presume searching with address
//        log(`presume searching with address`);
        gg = getGameWithAddress(id);
    } else {
        // presume searching with uniqueID
//        log(`presume searching with uniqueID`);
        gg = getGameWithUniqueID(id);
    }
    if (!gg) {
        log(`no game with ID ${id}`)
    } else {
        gg.detailedScorePackets = gg.getDetailedScorePackets();
    }

//    log(gg);
    if (cb) {
        cb(gg);
    }
    return gg;
};
const gameExists = (gid) => {
    Object.keys(games).forEach(g => {
//        log(g);
    });
    return games.hasOwnProperty(gid);
};
const getGameWithUniqueID = (id) => {
//    console.log(`getGameWithUniqueID`, id, Object.values(games).length)
    for (let g in games) {
//        console.log('-', games[g].uniqueID.toString(), id.toString())
//        console.log(games[g].uniqueID.toString() === id.toString())
        if (games[g].uniqueID.toString() === id.toString()) {
//            log(games[g].uniqueID)
            return games[g];
        }
    }
};
const getGameWithAddress = (add) => {
//    console.log(`GETGAMEWITHADDRESS: ${add} (${Object.values(games).length} games)`);
    for (let g in games) {
//        console.log(games[g].address, add);
        if (games[g].address === add) {
//            console.log('#################################################################')
            return games[g];
        }
    }
    return null;
};
const getScores = (gameID, cb) => {
//    console.log(`getScores`);
    const game = games[gameID];
    let ss = [];
    if (game) {
        log(`game.scores`, game.scores);
        game.scores.forEach(s => {
            ss.push(s)
        });
    } else {
        log(`no game with ID ${gameID}`);
    }
    if (cb) {
        log(`getScores callback, ss:`, ss);
        cb(ss);
    }
    return ss;
};
const getScorePackets = (gameID, cb) => {
//    console.log(`call to getScorePackets`);
    if (gameID.toString().indexOf('game', 0) === -1) {
        gameID = `game-${gameID}`
    }
    const game = games[gameID];
    let sps = [];
    if (game) {
//        console.log(`game.scores`, game.scores);
        game.scores.forEach(s => {
            sps.push(new ScorePacket(s))
        });
    } else {
        log(`no game with ID ${gameID}`);
    }
    if (cb) {
//        console.log(`getScorePackets callback, sps:`, sps);
//        console.log(`getScorePackets callback, returns ${sps.length} scores`);
        cb(sps);
    }
    return sps;
};

const getTotals1 = (gameID, cb) => {
    if (gameID.toString().indexOf('game', 0) === -1) {
        gameID = `game-${gameID}`
    }
    const game = games[gameID];
    if (game) {
//        console.log('we have a game');
        cb(game.getTotals1())
    } else {
//        console.log('no game no way');
    }
};
const getTotals2 = (gameID, cb) => {
    if (gameID.toString().indexOf('game', 0) === -1) {
        gameID = `game-${gameID}`
    }
    const game = games[gameID];
    if (game) {
//        console.log('we have a game');
        cb(game.getTotals2())
    } else {
//        console.log('no game no way');
    }
};
const getTotals3 = (gameID, cb) => {
    if (gameID.toString().indexOf('game', 0) === -1) {
        gameID = `game-${gameID}`
    }
    const game = games[gameID];
    if (game) {
//        console.log('we have a game');
        cb(game.getTotals3())
    } else {
//        console.log('no game no way');
    }
};
const getTotals4 = (gameID, cb) => {
    if (gameID.toString().indexOf('game', 0) === -1) {
        gameID = `game-${gameID}`
    }
    const game = games[gameID];
    if (game) {
        log('we have a game');
        cb(game.getTotals4())
    } else {
//        console.log('no game no way');
    }
};

const filterScorePackets = (gameID, prop, val, spIn) => {
    const sp = spIn ? spIn : getScorePackets(gameID);
    const spo = [];
    sp.forEach(s => {
        if (s[prop] === val) {
            spo.push(s);
        }
    });
    return spo;
};
const getRoundNum = (rs) => {
    // since round has become a string, it is useful to be able access just the numeric aspect

    return parseInt(rs.toString().replace(/\D/g, ''));
};
const createAggregate = (ob, cb) => {
    // filter score packets for round and src, then create aggregate/average values for each dest
    const gameID = ob.gameID;
    const round = ob.round;
    const src = ob.src;
    const game = games[gameID];
    let a = [];
    let report = '';
    if (game) {
        let spStatic = game.getScorePackets().slice(0);
        spStatic.forEach((p, i) => {spStatic[i] = new ScorePacket(p)});
        let sp = game.getScorePackets().slice(0);
        report += `number of score packets: ${sp.length}`;
        sp.forEach((s, i) => {
            if (typeof(s) !== 'object') {
                sp[i] = new ScorePacket(s);
            }
        });
        sp = filterScorePackets(gameID, 'round', round, sp);
        report += `, after filtering: ${sp.length}`;
        const dests = Array.from(new Set(sp.map(item => item.dest)));
        dests.forEach(d => {
            const spsd = filterScorePackets(gameID, 'dest', d, sp);
            report += `\n${d} - dest-specific packets: ${spsd.length}`;
            let valTotal = 0;
            const agOb = {dest: d, valTotal: 0, valAverage: 0, valCount: 0}
            spsd.forEach((p, i) => {
                valTotal += p.val;
                agOb.valCount = (i + 1);
                agOb.valTotal = valTotal;
                agOb.valAverage = valTotal / (i + 1);
            });
            a[d] = agOb;
        });

        if (cb) {
            cb(a, spStatic, report);
        } else {
            log(`createAggregate error: no callback sent`)
        }
    } else {
        log(`createAggregate error; no ame with ID ${gameID}`);
    }
};
const getAllValues = (gameID, cb) => {
    const game = games[gameID];
//    console.log(games);
    let vs = [];
    if (game) {
        game.values.forEach(v => {
            vs.push(v);
        });
    } else {
        log(`no game with ID ${gameID}`);
    }
    if (cb) {
        cb(vs);
    }
    return vs;
};
const getValues = (idOb, cb) => {
    const game = games[idOb.gameID];
    if (game) {
        for (let v in game.values) {
//            console.log(v)
//            console.log(v.team, idOb.team, v.team === idOb.team)
            if (game.values[v].team === idOb.team) {
                cb(game.values[v]);
                return game.values[v];
            }
        }
    } else {
        log(`no game called ${idOb.gameID}`);
    }
};
const onTeamsAssigned = (t, g) => {
    // requites args t (game.teams) and g (game)
    const ok = t !== undefined && g !== undefined;
    if (ok) {
        const uo = {teams: t};
        sessionController.updateSession(g.uniqueID, uo);
        g.setTeams();
        eventEmitter.emit('teamsAssigned', g);
    } else {
        log(`ERROR: attempt to call onTeamsAssigned without sufficient args`)
    }
};
const assignTeams = (ob, cb) => {
    const game = getGameWithAddress(ob.address);
    let t = null;
    switch (ob.type) {
        case 'order':
            t = game.assignTeamsOrder(ob);
            log('teams as assigned:');
            log(t);
            break;
        default:
            log('no order type specified');
        }
    if (t) {
        if (typeof(t) === 'object') {
            // successful return of team data
            // Don't run if previewing
            game.teams = t;
            if (!ob.preview) {
                onTeamsAssigned(t, game);
                // below moved to onTeamsAssigned
                /*
                const uo = {teams: t};
                sessionController.updateSession(game.uniqueID, uo);
                game.setTeams();
                eventEmitter.emit('teamsAssigned', game);
                */
            }
            if (cb) {
                cb(game);
            }
        } else {
            // method has returned an error message
            if (cb) {
                cb(t);
            }
        }
    }
};

const assignToNextTeam = (game, player, ID) => {

    const PD = game.persistentData;
    const ts = game.mainTeamSize ?? 5;

    if (!PD) {
        log('assignToNextTeam: persistentData missing');
        return;
    }

    if (game.teams.length === 0) {
        game.teams = new Array(PD.mainTeams.length).fill(null).map(() => []);
    }

    if (game.teams.flat().includes(ID)) {
//        log(`assignToNextTeam: player ${ID} already assigned`);
        return;
    }

    let teamID = -1;

    const mainTeamLimit = PD.mainTeams.length;
    const totalTeamLimit = mainTeamLimit + PD.secondaryTeams.length;

    // Main teams not full
    const availableMainTeams = game.teams.slice(0, mainTeamLimit).filter(t => t.length < ts);
//    log(`we have ${availableMainTeams.length} main team(s)`);
    if (availableMainTeams.length > 0) {
        const smallestTeam = availableMainTeams.reduce((a, b) => (a.length <= b.length ? a : b));
        teamID = game.teams.indexOf(smallestTeam);
//        log(`set teamID to ${teamID}`);
        smallestTeam.push(ID);
    } else {
        // Fill secondary teams
        while (game.teams.length < totalTeamLimit) {
            game.teams.push([]);
        }

        const st1 = game.teams[mainTeamLimit];
        const st2 = game.teams[mainTeamLimit + 1];

        const target = st1.length <= st2.length ? st1 : st2;
        target.push(ID);
        teamID = game.teams.indexOf(target);
    }

    // Final check
    const fullTeamStack = game.teams.length === totalTeamLimit;
    const allTeamsOccupied = game.teams.every(t => t.length > 0);

    if (fullTeamStack && allTeamsOccupied) {
        onTeamsAssigned(game.teams, game);
    }

    // Get team name from ordered list of team keys
    const teamKeyList = [...PD.mainTeams, ...PD.secondaryTeams];
    const teamKey = teamKeyList[teamID];
    let teamObj = PD.teams[teamKey];
    if (!teamObj) {
        teamObj = PD.teams['t' + teamID];
    }
//    log(`KEYS, teamKey: ${teamKey}, teamID: ${teamID}`);
//    log(`existing is undefined? ${PD.teams[teamKey] === undefined}`);
//    log(`new is undefined? ${PD.teams['t' + teamID] === undefined}`);
    if (!teamObj) {
        log(`assignToNextTeam: No team object found for teamID=${teamID}, key=${teamKey}`);
    }

    player.teamObj = teamObj;
//    log(`here we add ${ID} to playersFull`);
    game.playersFull[ID] = player;

    sessionController.updateSession(game.uniqueID, { teams: game.teams }, () => {game
    /*
    log(
          'Player ' + ID +
          ' assigned to ' + (teamObj && teamObj.title ? teamObj.title : 'unknown team') +
          ' (socket: ' + player.socketID + ')'
        );
                                                                                 */
    });
};
const resetTeams = (ob, cb) => {
    log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> resetTeams');
    const game = getGameWithAddress(ob.address);
    let t = [];
    const uo = {teams: t};
//    log('reseeeter');
    sessionController.updateSession(game.uniqueID, uo);
    game.unsetTeams();
    game.teams = t;
    eventEmitter.emit('teamsReset', game);
//    log(game);
    if (cb) {
        cb(game);
    }
};
const setTeamSize = (ob, cb) => {
    const game = games[ob.gameID];
    if (game) {
        games[ob.gameID].mainTeamSize = ob.n;
//        console.log(games[ob.gameID]);
        sessionController.updateSession(ob.gameID.replace('game-', ''), {mainTeamSize: ob.n});
        cb(games[ob.gameID]);
    } else {
        log(`setTeamSize: no game with ID ${ob.gameID} exists`);
        Object.keys(games).forEach(g => console.log(g))
    }
};
const getFullTeam = (id, game) => {
//    log(`getFullTeam for ${id}`);
//    log(game);
    const arr = game.teams;
    let ti = -1;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].includes(id)) {
            ti = i;
            break;
        }
    }
    const t = game.persistentData.teams[`t${ti}`];
//    log(t);
    return t;
};
const showGames = () => {
    log(`showGames:`)
    Object.keys(games).forEach(g => console.log(g));
};
const endGame = (game, cb) => {
    log(`end game with address ${game.address}`);
    routeController.destroyRoute(game.address);
    game.players = [];
    game.playersFull = {};
    game.teams = [];
    game.state = 'ended';
    if (cb) {
        cb(game);
    }
    eventEmitter.emit('gameEnded', game);
};
const deleteGame = (gameID) => {
    log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> deleteGame');
    // Heavyweight deletion method. Called from socketController via sessionController, which have password safeguards etc.
    // Do not implement via other modules without adding significant protection.
    const killID = gameID.includes('game-') ? gameID : `game-${gameID}`;
    const game = games[killID];
    if (game) {
//        console.log(`prepare to delete game`);
        // remove any created assets:
        gfxController.deleteQR(gameID);
        // destroy any associated routes:
        routeController.destroyRoute(game.address);
        // finally destroy the entire game object:
        delete games[killID];
//        gamez = Object.assign({}, games);
//        console.log(`at the final reckoning we have ${Object.values(gamez).length} games left in the system`);
//        showGames();
    } else {
        console.log(`Attempt to delete game failed as no game with ID ${killID} has been initialised`);
    }
};
const newGetTheRenderState = (game, id) => {
    let rs = {};
//    console.log(`####################### newGetTheRenderState: ${game.uniqueID}`);
    game = games[`game-${game.uniqueID}`];
    if (game) {
//        console.log('game exists');
        if (game.persistentData) {
//            console.log('game.persistentData exists');
            const player = game.playersFull[id];
            let scoreCompletionMetric = false;
            let canInteract = false;
            let inThisRound = false;
            if (player) {
//                console.log('player exists')
                rs.ob = player;
                const team = player.teamObj;
                if (team) {
//                    console.log('has teamObj');
                    let roundComplete = false;
                    let round = null;
                    let roundNum = null;
                    let roundInfo = {}
                    inThisRound = false;
                    if (game.round) {
                        roundComplete = game.round.toString().indexOf('*', 0) > -1;
                        round = game.round;
                        roundNum = tools.justNumber(game.round);
                        roundInfo = game.persistentData.rounds[roundNum];
                        inThisRound = team.type === roundInfo.type;
                    }
                    const scores = game.scores;
                    const scorePackets = [];
                    scores.forEach(s => {scorePackets.push(new ScorePacket(s))});
                    const roundScores = filterScorePackets(game.uniqueID, 'round', roundNum, scorePackets);
                    const playerHasScored = filterScorePackets(game.uniqueID, 'client', tools.justNumber(player.id), roundScores).length > 0;
                    canInteract = player.isLead || !team.hasLead;
                    const teamHasScored = filterScorePackets(game.uniqueID, 'src', team.id, roundScores).length > 0;
                    scoreCompletionMetric = team.type === 1 ? teamHasScored : playerHasScored;
                    if (scoreCompletionMetric === undefined) {
                        // crappy conditional designed to avoid server crash
                        scoreCompletionMetric = false;
                    }
                    const msg = `I am player ${player.id} of team ${team.title} have I already scored? ${scoreCompletionMetric} - can I interact in round ${roundNum}? ${!scoreCompletionMetric && canInteract && inThisRound}`;
                    rs.msg = msg;
                    rs.temp = 'game.main';
                    rs.partialName = 'game-links';
                    rs.summary = {
                        canInteract: canInteract,
                        intThisRound: inThisRound,
                        playerHasScored: playerHasScored,
                        teamHasScored: teamHasScored,
                        scoreCompletionMetric: scoreCompletionMetric,
                        gameRound: roundNum,
                        gameRoundFull: round,
                        roundComplete: roundComplete,
                        teamScoresChecked: filterScorePackets(game.uniqueID, 'src', team.id, scorePackets),
                        roundScoresChecked: roundScores
                    };
                    if (!scoreCompletionMetric && canInteract && inThisRound) {
                        rs.temp =  `game.${roundInfo.template}`;
                        rs.tempType = 'interaction';
                    }
                    if (scoreCompletionMetric && canInteract && inThisRound) {
                        if (roundComplete) {
                            rs.temp = `game.main`;
                        } else {
//                            console.log(roundInfo);
//                            rs.temp = `game.${roundInfo.template}.${roundInfo.template === 'allocation' || roundInfo.template === 'vote' ? `r${roundInfo.n}.` : ``}complete`;
                            rs.temp = `game.${roundInfo.template}.${roundInfo.template === 'allocation' ? `r${roundInfo.n}.` : ``}complete`;
                        }
                    }
                } else {
                    if (game.state === 'ended') {
                        rs.temp = 'game.gameover';
                    } else if (game.state === 'pending') {
                        rs.temp = 'game.pending';
                    } else {
                        if (game.teams.length > 0) {
                            // only remaining state is 'started'
                            // default state is always main page with links
                            rs.temp = 'game.main';
                            rs.partialName = 'game-links';
                            if (!scoreCompletionMetric && canInteract && inThisRound) {
                                rs.temp = `game.${roundInfo.template}`;
                                rs.tempType = 'interaction';
                            } else {
//                                    console.log(`conditions not met`)''
                            }

                        } else {
                            rs.temp = 'game.intro';
                        }
                    }
                }
            } else {
//                console.log('no player, no temp will be created');
//                console.log('no player, use the pending template');
                rs.temp = 'game.pending';
            }
        }
    }
//    console.log(rs);
    rs.theGame = Object.assign({}, game);
    if (rs.temp === undefined) {
//        console.log('set temp to problem')
        rs.temp = 'game.problem';
    }
    return rs;
};
const getTheRenderState = (game, id) => {
    const newRs = newGetTheRenderState(game, id);
    // returns an object which tells the player which template to render
    let rs = {};
    // Ensure current game data by deriving & fetching from the games object:
//    console.log(`####################### ORIGINAL getTheRenderState: ${game.uniqueID}`);
    game = games[`game-${game.uniqueID}`];
    if (game) {
        if (game.persistentData) {
            const gameRound = tools.justNumber(game.round);
            let roundComplete = false;
            if (game.round) {
                roundComplete = game.round.toString().indexOf('*', 0) > -1;
            }
            const player = game.playersFull[id];
            const round = game.persistentData.rounds[gameRound];
            let leads = game.teams.map(c => c[0]);
            // trim the 'leads' array so it only uses main teams (sub teams have no lead)
            leads = leads.splice(0, game.persistentData.mainTeams.length);
            const isLead = leads.includes(id);
            const team = game.teams.findIndex(t => t.includes(id));
            const teamObj = game.persistentData.teams[`t${team}`];
            let hasLead = false;
            if (teamObj) {
                hasLead = teamObj.hasLead;
            }
            const scoreRef = gameRound ? `${getRoundNum(gameRound)}_${team}` : null;
            // check this value \/ , the map array should have only one element
            const hasScore = game.scores.map(s => s.substr(0, 3) === scoreRef)[0];
            if (game.state === 'ended') {
                rs.temp = 'game.gameover';
            } else if (game.state === 'pending') {
                rs.temp = 'game.pending';
            } else {
                // only remaining state is 'started'
                if (game.teams.length > 0) {
                    rs.temp = 'game.main';
                    rs.partialName = 'game-links';
                    if (game.state === 'started') {
                        if (isLead || !hasLead) {
                            if (hasScore && hasLead) {
                                rs.temp = 'game.main';
                            } else {
                                if (round) {
                                    if (round.n > 0) {
                                        rs.temp =  `game.${round.template}`;
                                        rs.tempType = 'interaction';
                                    }
                                }
                            }
                        }
                    } else {
                        rs.sub = null;
                    }
                    rs.ob = game.playersFull[id];
                } else {
                    rs.temp = 'game.intro';
                }
            }
            const rsCopy = Object.assign({}, rs);
        }
    } else {
        console.log(`getTheRenderState cannot complete; game not defined ()`)
    }
    rs.newRs = newRs;
    rs = newRs;
    return rs;
};
const getRenderState = (ob, cb) => {
//    console.log(`getRenderState:`);
//    console.log(ob);
    cb(getTheRenderState(ob.game, ob.playerID));
};

const retrieveTeam = (id, G) => {
    // working from a playerID and a game, get the team object if player exists in the game.teams array
    let t = null;
    const T = G.teams;
    const PT = G.persistentData.teamsArray;
//    console.log(`search for team of player ${id}`);
//    console.log('teams', T.flat());
//    console.log('in?', T.flat().includes(id));
//    console.log(`PD has ${PT.length} teams`)
    if (T.flat().includes(id)) {
        const index = T.findIndex(i => i.includes(id));
//        console.log(`index: ${index}`);
        if (index > -1) {
            t = PT[index];
        }
    }
    return t;
};
const registerPlayer = (ob, cb) => {

    const game = getGameWithAddress(ob.game);
    if (!game) {
        const idStr = ob.player === undefined ? '' : `(${ob.player})`;
//        console.log(`No game found at ${ob.game}. Retrying... ${idStr}`);
//        setTimeout(() => registerPlayer(ob, cb), 500);
        return;
    }
    const mutex = getGameMutex(game.uniqueID);
    mutex.runExclusive(async () => {
        const plOrig = JSON.stringify(game.players);
        let ID = ob.player || `p${ob.fake ? 'f' : ''}${game.players.length + 1}`;
//        log(` *  *  *  *  *  *  * registerPlayer: ${ID}`);
        const isNewPlayer = !game.players.includes(ID);
        if (isNewPlayer) {
            game.players.push(ID);
        }
        const alreadyRegistered = game.playersFull.hasOwnProperty(ID);
        let player;
        if (alreadyRegistered) {
            // Reconnect case
            player = game.playersFull[ID];
            player.socketID = ob.socketID;
//            log(`Player ${ID} reconnected`);
            if (player.teamObj === null) {
//                player.teamObj = retrieveTeam(player.id, game);
                const t = retrieveTeam(player.id, game);
                const T = game.teams;
//                log(`BUT has no team, add one: ${t.title}`);
//                console.log(T);
//                console.log(T.filter(te => te.includes(ID))[0]);
//                console.log(T.filter(te => te.includes(ID))[0].indexOf(ID));
//                console.log(T.filter(te => te.includes(ID))[0].indexOf(ID) === 0);
                player.teamObj = t;
                player.isLead = T.filter(te => te.includes(ID))[0].indexOf(ID) === 0;
//                log(t);
            }
        } else {
            // New player
            const index = game.players.indexOf(ID);
            player = new Player(ID, index, ob.socketID);
//            log(`create new player:`);
//            log(player);
            player.idNum = tools.justNumber(player.idNum);
            game.playersFull[ID] = player;
//            log(`New player ${ID} added without team assignment`);
            if (autoTeam) {
                assignToNextTeam(game, player, ID);
                game.setTeam(player); // Optional: if game.setTeam sets internal flags
            } else {
                game.playersFull[ID] = player;
//                log(`New player ${ID} added without team assignment`);
            }
        }
        // Handle late joiner logic if teams are already assigned
        if (isNewPlayer && !autoTeam && game.teams.length > 0) {
    //        console.log(`Late joiner detected: ${ID}`);
            game.addLatecomer(player);
            sessionController.updateSession(game.uniqueID, { teams: game.teams });
        }
        // Debounced player list update
        if (JSON.stringify(game.players) !== plOrig) {
            clearTimeout(updateDelay);
            updateDelay = setTimeout(() => {
                sessionController.updateSession(game.uniqueID, { players: game.players });
            }, 5000);
        }
        // Emit current game state to the client
        const eGame = {
            ...game,
            _updateSource: {
                event: 'gameController registerPlayer',
                playerID: player.id,
                type: 'player'
            },
        };
        emitUpdate(eGame);
        if (cb) {
            const renDo = getTheRenderState(game, ID);
            cb({ id: ID, renderState: renDo, game: JSON.stringify(game) });
        } else {
            log('registerPlayer: no callback');
        }
        return ID;
    }).catch(err => {
        console.error('Failed to assign player due to mutex error:', err);
    });
};



const playerConnectEvent = (ob) => {
    const gameID = ob.gameID;
    const playerID = ob.socketID;
    const boo = ob.connect;
    const game = getGameWithAddress(`/${gameID}`);

//    console.log(ob);

    if (game) {
//        log(`game OK: ${playerID}`);
//        console.log(game.playersFull);
        const playerArray = Object.values(game.playersFull);
        const socketIDs = playerArray.map(player => player.socketID);
        const player = playerArray[socketIDs.indexOf(playerID)];
//        console.log(playerArray);
//        console.log(socketIDs);
//        console.log(player);
        if (player) {
//            log(`playerConnectEvent, player (${player.id}) OK, boo: ${boo}`);
            player.connected = boo;
            const usv1 = {
                event: 'gameController playerConnectEvent',
                var: boo,
                playerID: playerID,
                pid: player.id,
                type: 'player'
            };
            // us object remodelled to use playerID instead of socketID
            const us = {
                event: 'gameController playerConnectEvent',
                var: boo,
                playerID: player.id,
                socketID: playerID,
//                pid: player.id,
                type: 'player'
            };
            const eGame = Object.assign({'_updateSource': us}, game);
            emitUpdate(eGame);
        } else {
//            log('NO PLAYER');
        }
    } else {
//        console.log('whoops, no game');
    }
};

const startRound = async (ob) => {
    const okToUpdate = ob.hasOwnProperty('ok') ? ob.ok : true;
    const gameID = ob.gameID;
    const round = ob.round;
    const game_id = `game-${gameID}`;
    const game = games[game_id];
//    console.log(`startRound:`);
//    console.log(round);
    if (game) {
        const rounds = game.persistentData.rounds;
//        console.log(rounds[round]);
        const rIndex = ob.round - 1;
        if (ob.round > rounds.length) {
            const warning = `cannot start round ${ob.round}, game only has ${rounds.length} rounds.`;
            eventEmitter.emit('gameWarning', {gameID: game.address, warning: warning});
        } else {
            if (okToUpdate) {
                game.round = ob.round;
            }
            const session = await sessionController.updateSession(gameID, { round });
//            console.log(session);
            eventEmitter.emit('updatePlayers', {game: game, update: 'startRound', val: round});
            if (okToUpdate) {
                const eGame = Object.assign({'_updateSource': {event: 'gameController startRound', type: 'game'}}, game);
                emitUpdate(eGame);
            } else {
                console.log('startRound will not emit gameUpdate (ob.ok set to false)');
            }
        }
    } else {
        log(`game not found: ${game_id}`);
    }
};
const checkRound = (ob, cb) => {
//    console.log(`checkRound`);
    // Check submitted scores against current round
    const gameID = typeof(ob) === 'string' || typeof(ob) === 'number' ? ob : ob.gameID;
    const game = games[`game-${gameID}`];
    if (game) {
        const round = ob.hasOwnProperty('round') ? ob.round : game.round;
        if (round > 0) {
            const rScores = game.scores.filter(item => item.startsWith(round));
            const gRound = game.persistentData.rounds[round];
            const teams = game.persistentData[gRound.teams];
//            const players = Object.values(game.playersFull).filter(p => p.teamObj.type === 2);
            const players = Object.values(game.playersFull).filter(p => p.teamObj.type === gRound.type);
            const pa = [];
            players.forEach(p => {
                const comp = gRound.type === 1 ? p.index.toString() : tools.justNumber(p.id).toString();
                const sub1 = rScores.filter(item => item.split('_')[4] === p.index.toString());
                const sub2 = rScores.filter(item => item.split('_')[4].toString() === tools.justNumber(p.id).toString());
                const sub = rScores.filter(item => item.split('_')[4].toString() === comp);
                pa.push(Boolean(sub.length));
            });
            const ta = [];
            teams.forEach(t => {
                ta.push(Boolean(rScores.filter(item => item.charAt(2) === t.id.toString()).length));
            });
//            const ra = gRound.type === 1 || gRound.type === 2 ? ta : pa;
            const ra = gRound.type === 1 ? ta : pa;
            logController.addLog('roundAll', {game: game.address, roundType: gRound.type, submissions: ra, playerSubs: pa, teamSubs: ta, rScores: rScores});
            if (cb) {
                cb(ra);
            }
            return ra;
        } else {
            console.log(`checkRound: invalid round (${round})`)
            return [false];
        }
    } else {
        console.log(`game not ready: ${ob.gameID}`);
        return [false];
    }
};
const endRound = async (ob, cb) => {
    const gameID = ob.game;
    const round = ob.round;
    const game_id = `game-${gameID}`;
    const game = games[game_id];
    if (game) {
        const session = await sessionController.updateSession(ob.game, {round: `${game.round}*`});
        if (session) {
            game.round = session.round;
            const eGame = Object.assign({'_updateSource': {event: 'gameController endRound', type: 'game'}}, game);
            emitUpdate(eGame);
        }
    } else {
        console.log(`endGame cannot complete, no game exists with ID ${game_id}`);
    }
};
const setAllScores = async (ob, cb) => {
    const sc = ob.scoreCode;
    const game = games[`game-${ob.game}`];
    if (game) {
        // once game confirmed, carry out any requisite conversion and send to server, also update the current game

    }
};
const onScoresSent = async (o, cb) => {
//    console.log(typeof(games), games.hasOwnProperty('length'));
//    Object.keys(games).forEach(k => {console.log(k)});
//    console.log(o);
    const ro = {};
    if (!o.hasOwnProperty('gameID')) {
        ro.msg = 'no gameID provided';
    } else {
        if (!games[o.gameID]) {
            ro.msg = `no game with ID ${o.gameID}`;
        } else {
            const G = games[o.gameID];
            ro.G = G;
//            const sesh = await sessionController.getSessionWithAddress(o.gameID.replace('game-', ''));
//            if (sesh) {
//                console.log(sesh)
//            }
            const spw = await sessionController.getSessionPassword(o.gameID.replace('game-', ''));
//            console.log(o.pw, spw.password)
            if (o.pw === process.env.ADMIN_PASSWORD || o.pw === spw.password) {
                ro.msg = 'password success, session not set';
                if (o.scores) {
                    G.scores = o.scores;
                    const session = await sessionController.updateSession(o.gameID.replace('game-', ''), {scores: o.scores});
                    if (session) {
                        ro.msg = 'password success, session set success';

                    }
                }

            } else {
                ro.msg = 'failure - wrong password';
            }
        }
    }
    if (cb) {
        cb(ro);
    }

};
const scoreSubmitted = async (ob, cb) => {
//    console.log(`scoreSubmitted`);
    const sc = ob.scoreCode;
    const game = games[`game-${ob.game}`];
    if (game) {
        let sp = new ScorePacket(ob.forceRound ? sc.round : game.round, sc.src, sc.dest, sc.val, 1);
        let p = sp.getPacket();
        let d = sp.getDetail();
        if (game.scores.indexOf(p) > -1) {
            // Duplicate scores are not allowed (score packets must be unique)
            // In case of a duplicate score submission, callback the scores and end the method.
            console.log(`oh no, a duplicate score`);
            if (cb) {
                cb(game.scores);
            }
            return;
        }
        if (p) {
            game.scores.push(p);
            const session = await sessionController.updateSession(ob.game, { $push: {scores: p}});
            if (session) {
                const game = games[`game-${ob.game}`];
//                console.log('FINAL', game.scores)
                if (game) {
                    const roundComplete = checkRound(ob.game).indexOf(false) === -1;
                    if (cb) {
                        cb(game.scores);
                    }
                    const eGame = Object.assign({_updateSource: {event: 'gameController scoreSubmitted', src: ob, type: 'score'}}, game);
                    eventEmitter.emit('scoresUpdated', eGame);
                    if (roundComplete) {
                        eventEmitter.emit('roundComplete', eGame);
                    };
                    if (roundComplete) {
                        endRound(ob);
                    }
                } else {
                    console.log(`no game with ID game-${ob.game}`);
                }
            }
            return d;
        } else {
            console.log(`cannot save score, packet improperly defined (see models.scorepacket.<n>.js)`);
            return false;
        }
    } else {
        console.log(`no game with ID game-${ob.game}`);
        return false;
    }
};
const forceScore = async (ob, cb) => {
    const sc = ob.scoreCode;
    const game = games[`game-${ob.game}`];
    if (game) {
        const sub = sc.split('_').slice(0, 3).join('_');
        const m = game.scores.filter(i => i.startsWith(sub));
//        console.log('forceScore:');
        if (m.length < 2) {
            let na = game.scores.filter(i => !i.startsWith(sub));
            game.scores = na;
            const session = await sessionController.updateSession(ob.game, {scores: na});
            if (session) {
                scoreSubmitted({scoreCode: ob.scorePacket, game: ob.game, forceRound: true}, cb);
            }
        } else {
            console.log(`more than one matched score for ${sc}, this is likely an error.`)
        }

    }
};
const scoreForAverageSubmitted = async (ob, cb) => {
    // A score, or set of scores, submitted which must be averaged out over a team
    const sc = ob.scoreCode;
    const gameID = `game-${ob.game}`;
    const game = games[gameID];
    const scOut = [];
    if (game) {
        sc.forEach(s => {
            let sp = new ScorePacket(game.round, s.src, s.dest, s.val, s.client);
            let p = sp.getPacket();
            let d = sp.getDetail();
            scOut.push(p);
        });
        game.scores = [...new Set([...game.scores, ...scOut])];
        const session = await sessionController.updateSession(ob.game, { $push: {scores: { $each: scOut}}});
        if (session) {
            const roundDetail = checkRound(ob.game);
            logController.addLog('round', {game: game.address, roundType: game.round.type, submissions: roundDetail});
            const roundComplete = roundDetail.indexOf(false) === -1;
            const eGame = Object.assign({_updateSource: {event: 'gameController scoreForAverageSubmitted', src: ob, type: 'score'}}, game);
            eventEmitter.emit('scoresUpdated', eGame);
            if (roundComplete) {
                eventEmitter.emit('roundComplete', eGame);
            }
            if (roundComplete) {
                endRound(ob);
            }
        }
        let ssp = filterScorePackets(gameID, 'round', 2);
        ssp = filterScorePackets(gameID, 'src', sc[0].src, ssp);
    } else {
        console.log(`scoreForAverageSubmitted: game not found (game-${ob.game})`);
    }
};
const valuesSubmitted = async (ob) => {
//    console.log(`valuesSubmitted:`);
//    console.log(ob);
    if (typeof (ob.round) === 'string') {
        ob.round = parseInt(ob.round);
    }
    if (ob.hasOwnProperty('values')) {
        console.log(`valuesSubmitted`, ob);
        const session = await sessionController.updateSession(ob.game, { $push: {values: ob.values}});
        if (session) {
            const game = games[`game-${ob.game}`];
            if (game) {
                game.values = session.values;
            } else {
                console.log(`no game with ID game-${ob.game}`);
            }
        }
    } else {
        console.log('no values sent');
    }
};
const presentationAction = (ob) => {
    // An action triggered from a presentation frame
//    console.log(`presentationAction:`);
//    console.log(ob);


    // NOTE: this functionality is being given to the facilitator dashboard


    const game = getGameWithAddress(ob.address);
    if (game) {
        game.slide = ob.ref;
    }
    const eGame = Object.assign({'_updateSource': {event: 'gameController presentationAction', type: 'presentation'}}, game);
    // eventEmitter.emit('gameUpdate', eGame);
    emitUpdate(eGame);


    return;



    if (ob.hasOwnProperty('action')) {
        if (ob.action.toLowerCase().indexOf('startround', 0) > -1) {
            const rOb = {gameID: getGameWithAddress(ob.address).uniqueID, round: ob.action.replace(/\D/g, '')};
//            console.log(rOb);
            startRound(rOb);
        }
    }
};

const get = (id, prop) => {

    const game = games[`game-${id}`];

    let p = null;
    if (game) {
        let dsp = game.getDetailedScorePackets();
        console.log(dsp);
        if (game.hasOwnProperty(prop)) {
            p = game[prop];
        }
    }
    return p;
};

module.exports = {
    getGame,
    gameExists,
    getGameCount,
    getGameWithAddress,
    getGameWithUniqueID,
    startGame,
    endGame,
    restoreGame,
    resetGame,
    resetSession,
    changeName,
    deleteGame,
    registerPlayer,
    playerConnectEvent,
    assignTeams,
    removePlayer,
    resetTeams,
    setTeamSize,
    makeLead,
    reassignTeam,
    startRound,
    checkRound,
    scoreSubmitted,
    forceScore,
    onScoresSent,
    scoreForAverageSubmitted,
    createAggregate,
    valuesSubmitted,
    presentationAction,
    getScorePackets,
    getScores,
    getTotals1,
    getTotals2,
    getTotals3,
    getTotals4,
    getRenderState,
    getAllValues,
    getValues,
    get
};
