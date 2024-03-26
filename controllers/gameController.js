let Game = null;
let Player = null;
let Team = null;
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
        Team = require(`./../models/team.${session.type}`);
        const newGame = await new Game(session.uniqueID, session.type);
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
    return rg;
};
async function restoreGame (o, cb) {
    // restoreGame will set up a game that has been started, but due to some sort of failure has been removed from the 'games' object.
    // Restore by creating a new instance of Game and then loading any stored info from the database.
    // NOTE a Game is a far more complex object than a Session, which comprises only the persistent data, hence the need to rebuild.
    let game = await startGame(o);
    log(`restoreGame: ${game.uniqueID}`);
    const session = await sessionController.getSessionWithID(game.uniqueID);
    if (session) {
        game = Object.assign(game, session._doc);
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

        } else {}
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
    //                console.log(`${i} to new array`);
                } else {
                    game[i] = {};
    //                console.log(`${i} to new object`);
                }
            }
        }
    //    game.players = [];
    //    game.teams = [];
        game.state = 'pending';
        const session = await sessionController.updateSession(id, {state: 'pending', players: game.players, teams: game.teams});
        if (session) {
            log('return updated session here');
            log(session);
            if (cb) {
                cb(session);
            }
        }
    }
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
//    log(games)
    if (id.indexOf('/', 0) > -1) {
        // presume searching with address
//        log(`presume searching with address`);
        gg = getGameWithAddress(id);
    } else {
        // presume searching with uniqueID
//        log(`presume searching with uniqueID`);
        gg = getGameWithUniqueID(id);
    }
//    log(gg);
    if (cb) {
        cb(gg);
    }
    return gg;
};
const getGameWithUniqueID = (id) => {
    for (let g in games) {
        if (games[g].uniqueID === id) {
//            log(games[g].uniqueID)
            return games[g];
        }
    }
};
const getGameWithAddress = (add) => {
    for (let g in games) {
        if (games[g].address === add) {
            return games[g];
        }
    }
};
const assignTeams = (ob, cb) => {
    const game = getGameWithAddress(ob.address);
    let t = null;
    switch (ob.type) {
        case 'order':
            t = game.assignTeamsOrder();
            break;
        default:
            log('no order type specified');
        }
    if (t) {
        if (typeof(t) === 'object') {
            // successful return of team data
            const uo = {teams: t};
            sessionController.updateSession(game.uniqueID, uo);
            game.teams = t;
            game.setTeams();
//            games[`game-${game.uniqueID}`];
            eventEmitter.emit('teamsAssigned', game);
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
//    log('assignTeams');

//    eventEmitter.emit('teamsAssigned', game);
//    if (cb) {
//        cb(game);
//    }
};
const resetTeams = (ob, cb) => {
    const game = getGameWithAddress(ob.address);
    let t = [];
    const uo = {teams: t};
//    log('reseeeter');
    sessionController.updateSession(game.uniqueID, uo);
    game.teams = t;
//    log(game);
    if (cb) {
        cb(game);
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
const getRenderState = (game, id) => {
    // returns an object which tells the player which template to render
//    log(`getRenderState, game state: ${game.state}, callerID: ${id}`);
//    log(game.playersFull[id])
//    log(getFullTeam(id, game))
//    console.log(game);
    let rs = {};
    if (game.state === 'ended') {
        rs.temp = 'game.gameover';
    } else if (game.state === 'pending') {
        rs.temp = 'game.pending';
    } else {
        // only remaining state is 'started'
        if (game.teams.length > 0) {
            rs.temp = 'game.main';
//            rs.ob = {teamObj: getFullTeam(id, game)};
            rs.ob = game.playersFull[id];
        } else {
            rs.temp = 'game.intro';
        }
    }
//    log(rs);
    return rs;
};
const registerPlayer = (ob, cb) => {
//    log(`registerPlayer to game ${ob.game}`);
//    log(ob)
    const game = getGameWithAddress(ob.game);
    let ID = null;
    let newP = null;
    let timer = null;
    if (game) {
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
                console.log(`create new player with id ${ID} at index ${index}`);

                const pl = new Player(ID, ob.socketID);
                if (index > -1) {
                    // only add index for new players
                    pl.index = index;
                }
                game.playersFull[ID] = pl;
                game.setTeam(pl);
            }
        } else {
            ID = `p${ob.fake ? 'f' : ''}${game.players.length + 1}`;
            game.players.push(ID);
            newP = true;
        }
        if (newP && game.teams.length > 0) {
            console.log(`looks like a new player (${ID}) joining after teams are assigned`);
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
            cb({id: ID, renderState: getRenderState(game, ID)});
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
module.exports = {
    getGame,
    getGameCount,
    startGame,
    endGame,
    restoreGame,
    resetGame,
    registerPlayer,
    assignTeams,
    resetTeams
};
