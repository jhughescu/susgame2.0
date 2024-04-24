let Game = null;
let Player = null;
let Presentation = null;
let Team = null;
let ScorePacket = null;
const sessionController = require('./../controllers/sessionController');
const { getEventEmitter } = require('./../controllers/eventController');
const routeController = require('./../controllers/routeController');
const gfxController = require('./../controllers/gfxController');

const eventEmitter = getEventEmitter();
let updateDelay = null;
const games = {};
const logging = true;

const log = (msg) => {
    if (process.env.ISDEV && logging) {
        if (typeof(msg) === 'object' && !msg.hasOwnProperty('length')) {
            console.log(Object.assign({loggedBy: `gameController`}, msg));
        } else {
            console.log(`gameController: ${msg}`);
        }
    }
};

async function startGame (o, cb) {
    // startGame will create a new game if one does not exist, and return the Game in either case
    const session = JSON.parse(o);
    const game = `game-${session.uniqueID}`;
    log(`startGame: ${game}`);
    let rg = null;
    if (!games.hasOwnProperty(game)) {
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
    }
    // Only set state to 'started' if it is currently pending
    if (session.state ===  'pending') {
        sessionController.updateSession(session.uniqueID, {state: 'started'});
    }
    rg = games[game];

    routeController.createRoute(`${session.address}`);
    gfxController.generateSessionQR(session);
    try {
        await rg.loadPersistentData(session.type);
    } catch (error) {
        console.error('Error loading persistent data:', error);
    }
    log(`returned game is ready`);
//    log(rg);
    if (cb) {
        cb(rg);
    }
//    showGames();
    return rg;
};
async function restoreGame (o, cb) {
    // restoreGame will set up a game that has been started, but due to some sort of failure has been removed from the 'games' object.
    // Restore by creating a new instance of Game and then loading any stored info from the database.
    // NOTE a Game is a far more complex object than a Session, which comprises only the persistent data, hence the need to rebuild.
    let game = await startGame(o);
    const session = await sessionController.getSessionWithID(game.uniqueID);
    if (session) {
        game = Object.assign(game, session._doc);
        // RETAIN LINE BELOW:
        console.log(`gameController.restoreGame has restored the game ${game.uniqueID}`);
        restoreClients(game.address);
    }
    if (cb) {
        cb(game);
    } else {
        console.error('restoreGame requires a callback');
    }
};
async function resetGame(id, cb) {
    const game = getGameWithUniqueID(id);
    if (game) {
        // Note: add a condition that only system admin can reset a game with state='ended'
        if (game.state === 'ended') {

        } else {

        }
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
            if (typeof(game[i]) === 'object' && i !== 'persistentData') {
                if (game[i].hasOwnProperty('length')) {
                    game[i] = [];
                } else {
                    game[i] = {};
                }
            }
        }
        game.state = 'pending';
        const session = await sessionController.updateSession(id, {state: 'pending', players: game.players, teams: game.teams, scores: [], values: []});
        if (session) {
            log('return updated session here');
            log(session);
            if (cb) {
                cb(session);
            }
        }
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
        eventEmitter.emit('gameUpdate', game);
        eventEmitter.emit('singlePlayerGameUpdate', {player: leadNew, game});
        eventEmitter.emit('singlePlayerGameUpdate', {player: leadOld, game});
    } else {
        console.log(`cannot change lead; no game with ID game-${ob.game}`)
    }

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
        console.log(`no game with ID ${id}`)
    }
//    log(gg);
    if (cb) {
        cb(gg);
    }
    return gg;
};
const getGameWithUniqueID = (id) => {
    for (let g in games) {
//        console.log(games[g].uniqueID.toString(), id.toString())
//        console.log(games[g].uniqueID.toString() === id.toString())
        if (games[g].uniqueID.toString() === id.toString()) {
//            log(games[g].uniqueID)
            return games[g];
        }
    }
};
const getGameWithAddress = (add) => {
//    console.log(`GETGAMEWITHADDRESS: ${add}`)
    for (let g in games) {
//        console.log(games[g].address, add)
        if (games[g].address === add) {
            return games[g];
        }
    }
    return null;
};
const getScorePackets = (gameID, cb) => {
    const game = games[gameID];
    let sps = [];
    if (game) {
        game.scores.forEach(s => {
            sps.push(new ScorePacket(s))
        });
    } else {
        console.log(`no game with ID ${gameID}`);
    }
    if (cb) {
        cb(sps);
    }
    return sps;
};
const getAllValues = (gameID, cb) => {
    const game = games[gameID];
    let vs = [];
    if (game) {
        game.values.forEach(v => {
            vs.push(v);
        });
    } else {
        console.log(`no game with ID ${gameID}`);
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
        console.log(`no game called ${idOb.gameID}`);
    }
};
const assignTeams = (ob, cb) => {
    const game = getGameWithAddress(ob.address);
    let t = null;
    switch (ob.type) {
        case 'order':
            t = game.assignTeamsOrder(ob);
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
                const uo = {teams: t};
                sessionController.updateSession(game.uniqueID, uo);

                game.setTeams();
                eventEmitter.emit('teamsAssigned', game);
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

const resetTeams = (ob, cb) => {
    const game = getGameWithAddress(ob.address);
    let t = [];
    const uo = {teams: t};
//    log('reseeeter');
    sessionController.updateSession(game.uniqueID, uo);
    game.unsetTeams();
    game.teams = t;
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
        cb(games[ob.gameID]);
    } else {
        console.log(`setTeamSize: no game with ID ${ob.gameID} exists`);
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
    console.log(`showGames:`)
    Object.keys(games).forEach(g => console.log(g));
}
const endGame = (game, cb) => {
    console.log(`end game with address ${game.address}`);
    routeController.destroyRoute(game.address);
    game.players = [];
    game.teams = [];
    game.state = 'ended';
    if (cb) {
        cb(game);
    }
    eventEmitter.emit('gameEnded', game);
};
const deleteGame = (gameID) => {
    // Heavyweight deletion method. Called from socketController via sessionController, which have password safeguards etc.
    // Do not implement via other modules without adding significant protection.
    const killID = `game-${gameID}`;
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
const getTheRenderState = (game, id) => {
    // returns an object which tells the player which template to render
    // Ensure current game data by deriving & fetching from the games object:
    game = games[`game-${game.uniqueID}`];
//    log(`getTheRenderState: ${id}, round: ${game.round}`);
    const round = game.persistentData.rounds[game.round];
    const leads = game.teams.map(c => c[0]);
    const isLead = leads.includes(id);
    const team = game.teams.findIndex(t => t.includes(id));
    const scoreRef = `${game.round}_${team}`;
    // check this value \/ , the map array should have only one element
    const hasScore = game.scores.map(s => s.substr(0, 3) === scoreRef)[0];
    let rs = {};
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
                if (isLead) {
                    if (hasScore) {
                        rs.temp = 'game.main';
                    } else {
                        if (round) {
                            if (round.n > 0) {
                                rs.temp = 'game.allocation';
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
    rs.stuff = `id: ${id}, isLead: '${isLead}, team: ${team}, hasScore: ${hasScore}, gameState: ${game.state}, round: ${round ? round.n : false }`;
    const rsCopy = Object.assign({}, rs);
    delete rsCopy.ob;
//    log('rs:');
//    log(rsCopy);
    return rs;
};
const getRenderState = (ob, cb) => {
//    console.log(`getRenderState:`);
//    console.log(ob);
    cb(getTheRenderState(ob.game, ob.playerID));
}
const registerPlayer = (ob, cb) => {
//    log(`registerPlayer to game ${ob.game}`);
//    log(ob)
    const game = getGameWithAddress(ob.game);
    let ID = null;
    let newP = null;
    let timer = null;
    let player = null;
    if (game) {
//        log(game);
        // store a copy of the list of players for later comparison
        const plOrig = JSON.stringify(game.players);
        // index will be the joining order (i.e first connected player index = 1 etc)
        let index = -1;
        if (ob.player) {
            ID = ob.player;
            const pl = game.players.reduce((acc, plID) => {
                acc[plID] = true;
                return acc;
            }, {});
            newP = !pl.hasOwnProperty(ob.player);
            if (newP) {
                game.players.push(ob.player);
                index = game.players.length;
            }
            if (!game.playersFull.hasOwnProperty(ID)) {
                let plIndex = index > -1 ? index : game.players.indexOf(ID) + 1;
//                log(`create new player with id ${ID} at index ${plIndex}`);
                player = new Player(ID, plIndex, ob.socketID);
                game.playersFull[ID] = player;
                game.setTeam(player);
            } else {
                // update the existing player object with the new socketID
                game.playersFull[ID].socketID = ob.socketID;
            }
        } else {
            ID = `p${ob.fake ? 'f' : ''}${game.players.length + 1}`;
            game.players.push(ID);
            newP = true;
        }
        if (newP && game.teams.length > 0) {
            console.log(`looks like a new player (${ID}) joining after teams are assigned`);
            game.addLatecomer(player);
            // NOTE no functionality added yet - assign player to whichever PV team has fewer members
        }

        eventEmitter.emit('gameUpdate', game);
        // Compare the list of players with the stored list & update database if they differ
        if (JSON.stringify(game.players) !== plOrig) {
            clearTimeout(updateDelay);
            updateDelay = setTimeout(() => {
                // save list of players, but do so on a timeout so as not to address the database too frequently
                sessionController.updateSession(game.uniqueID, {players: game.players})
            }, 5000);
        }
        if (cb) {
            cb({id: ID, renderState: getTheRenderState(game, ID), game: JSON.stringify(game)});
        } else {
            log('reg P, no CB');
        }
//        log(`registerPlayer to game ${ob.game} with id: ${ID}`);
        return ID;
    } else {
        // safeguard against registration prior to completion of game setup
        const idStr = ob.player === undefined ? '' : `(${ob.player})`;
        log(`no game exists with address ${ob.game}, try again after delay ${idStr}`);
        setTimeout(() => {
            registerPlayer(ob, cb);
        }, 500);
    }
};
const playerConnectEvent = (gameID, playerID, boo) => {
    const game = getGameWithAddress(`/${gameID}`);
    if (game) {
        const playerArray = Object.values(game.playersFull);
        const socketIDs = playerArray.map(player => player.socketID);
        const player = playerArray[socketIDs.indexOf(playerID)];
        if (player) {
//            log(gameID, playerID, boo, (game ? 'yep' : 'nope'));
            player.connected = boo;
            eventEmitter.emit('gameUpdate', game);
        }
    }
};

const startRound = async (ob) => {
    console.log(`startRound:`);
    console.log(ob);
    const gameID = ob.gameID;
    const round = ob.round;
    const game_id = `game-${gameID}`;
    const game = games[game_id];
    if (game) {
        console.log(`yes, game`);
        const rounds = game.persistentData.rounds;
        const rIndex = ob.round - 1;
        if (ob.round > rounds.length) {
            const warning = `cannot start round ${ob.round}, game only has ${rounds.length} rounds.`;
            eventEmitter.emit('gameWarning', {gameID: game.address, warning: warning});
        } else {
            game.round = ob.round;
            console.log(`change round to ${ob.round}`);
            const session = await sessionController.updateSession(gameID, { round });
            eventEmitter.emit('updatePlayers', {game: game, update: 'startRound', val: round});
            eventEmitter.emit('gameUpdate', game);
        }
    } else {
        log(`game not found: ${game_id}`);
    }
};
const checkRound = (ob, cb) => {
    // Check submitted scores against current round
    const game = games[`game-${ob.gameID}`];
    if (game) {
        const round = ob.hasOwnProperty('round') ? ob.round : game.round;
        const rScores = game.scores.filter(item => item.startsWith(round));
        const gRound = game.persistentData.rounds[round];
        const teams = game.persistentData[gRound.teams];
        const ta = [];
        teams.forEach(t => {
//                console.log(t.title, t.id, rScores.filter(item => item.charAt(2) === t.id.toString()).length);
            ta.push(Boolean(rScores.filter(item => item.charAt(2) === t.id.toString()).length));
        })
        console.log(ta);
        cb(ta);
//        console.log(round);
//        console.log(game.scores);
//        console.log(rScores);
//        console.log(gRound);
//        console.log(gRound.teams);
//        console.log(teams.length);
//        if (rScores.length === teams.length) {
//            console.log(`all teams have scored`);
//        } else {
//
//        }
    } else {
        console.log(`game not ready: ${ob.gameID}`);
    }
};
const scoreSubmitted = async (ob, cb) => {
    const sc = ob.scoreCode;
    const game = games[`game-${ob.game}`];
    if (game) {
        let sp = new ScorePacket(game.round, sc.src, sc.dest, sc.val, 1);
        let p = sp.getPacket();
        let d = sp.getDetail();
        if (p) {
            const session = await sessionController.updateSession(ob.game, { $push: {scores: p}});
            if (session) {
                const game = games[`game-${ob.game}`];
                if (game) {
                    game.scores = session.scores;
                    checkRound(ob.game);
                    if (cb) {
                        cb(game.scores);
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
const valuesSubmitted = async (ob) => {
    if (ob.hasOwnProperty('values')) {
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
        console.log('no values sent')
    }
};

module.exports = {
    getGame,
    getGameCount,
    getGameWithAddress,
    startGame,
    endGame,
    restoreGame,
    resetGame,
    deleteGame,
    registerPlayer,
    playerConnectEvent,
    assignTeams,
    resetTeams,
    setTeamSize,
    makeLead,
    startRound,
    checkRound,
    scoreSubmitted,
    valuesSubmitted,
    getScorePackets,
    getRenderState,
    getAllValues,
    getValues
};
