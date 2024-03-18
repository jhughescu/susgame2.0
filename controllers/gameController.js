//const { createRoute} = require('./../app');
//const Game = require('./../models/game');
let Game = null;
//let Game = require(`./../models/game.1`);
const sessionController = require('./../controllers/sessionController');
const { getEventEmitter } = require('./../controllers/eventController');
const routeController = require('./../controllers/routeController');

const eventEmitter = getEventEmitter();
let updateDelay = null;
const games = {};

const log = (msg) => {
    console.log(`======================== gameController: ${msg}`);
};
async function startGame (o, cb) {
    // startGame will create a new game if one does not exist, and return the Game in either case
    log('startGame')
    const session = JSON.parse(o);
    const game = `game-${session.uniqueID}`;
    let rg = null;
    if (!games.hasOwnProperty(game)) {
        Game = require(`./../models/game.${session.type}`);
//        games[game] = new Game(session.uniqueID, session.type);
        const newGame = await new Game(session.uniqueID, session.type);
//        console.log(`newGame`);
//        console.log(newGame);
//        console.log(newGame.assignTeams);
//        newGame.assignTeams();
        games[game] = newGame;
//        console.log(games[game])
    }
    // Only set state to 'started' if it is currently pending
    if (session.state ===  'pending') {
        sessionController.updateSession(session.uniqueID, {state: 'started'});
    }
    rg = games[game];

    routeController.createRoute(`${session.address}`);
    try {
        await rg.loadPersistentData(session.type);
    } catch (error) {
        console.error('Error loading persistent data:', error);
    }
    log(`returned game is ready`);
//    console.log(rg);
//    console.log(rg.assignTeams());
//    rg.assignTeams();
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
    log(`============================ restoreGame: ${game.uniqueID}`);
//    console.log(game);
    console.log(game.assignTeams);
//    console.log(game);
    const session = await sessionController.getSessionWithID(game.uniqueID);
    if (session) {
        game = Object.assign(game, session._doc);
    }
    if (cb) {
    console.log(game.assignTeams);
        cb(game);
    } else {
        console.error('restoreGame requires a callback');
    }
};

const getGameCount = (cb) => {
//    console.log('getGames');
//    console.log(cb);
    if (cb) {
        cb(Object.keys(games).length);
    }
    return games;
};
const getGame = (id, cb) => {
    let gg = null;
    log(`get game with id ${id}`);
    log(games)
    if (id.indexOf('/', 0) > -1) {
        // presume searching with address
        console.log(`presume searching with address`);
        gg = getGameWithAddress(id);
    } else {
        // presume searching with uniqueID
        console.log(`presume searching with uniqueID`);
        gg = getGameWithUniqueID(id);
    }
    console.log(gg);
    if (cb) {
        cb(gg);
    }
    return gg;
};
const getGameWithUniqueID = (id) => {
    for (let g in games) {
        if (games[g].uniqueID === id) {
//            console.log(games[g].uniqueID)
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
            console.log('no order type specified');
        }
    if (t) {
        const uo = {teams: t};
        console.log(uo);
        sessionController.updateSession(game.uniqueID, uo);
    }
    if (cb) {
        cb(t);
    }
}
async function resetGame(id, cb) {

    // CURRENTLY RESETS ALL - ALL - THE PLAYERS
    eventEmitter.emit('resetAll');
    const game = getGameWithUniqueID(id);
//    console.log(game);
    game.players = [];
    game.state = 'pending';

    // NEED TO UPDATE THE ASSOCIATED SESSION
    console.log('setting state to pending');
    const session = await sessionController.updateSession(id, {state: 'pending', players: game.players});
    if (session) {
        console.log('return updated session here');
        console.log(session);
        if (cb) {
            cb(session);
        }
    }
};
const registerPlayer = (ob, cb, socket) => {
//    console.log(`registerPlayer to game ${ob.game}`);
//    console.log(ob)
    const game = getGameWithAddress(ob.game);
    let ID = null;
    let newP = null;
    let timer = null;
    if (game) {
        const plOrig = JSON.stringify(game.players);
        if (ob.player) {
            ID = ob.player;
            const pl = game.players.reduce((acc, plID) => {
                acc[plID] = true;
                return acc;
            }, {});
            newP = !pl.hasOwnProperty(ob.player);
            if (newP) {
                game.players.push(ob.player);
            }
        } else {
            ID = `p${ob.fake ? 'f' : ''}${game.players.length + 1}`;
            game.players.push(ID);
            newP = true;
            // \/ moved to end
//            if (cb) {
//                cb(ID);
//            } else {
//                console.log('reg P, no CB');
//            }
        }
//        console.log(`register ${ID} with game ${ob.game}, (${newP ? 'new' : 'existing'} ${ob.fake ? 'fake' : 'real'} player) - ${JSON.stringify(ob)}`);
//        console.log(plOrig);
//        console.log(ob);
        eventEmitter.emit('gameUpdate', game);
        clearTimeout(updateDelay);
//        console.log(JSON.stringify(game.players), plOrig, JSON.stringify(game.players) === plOrig)
        if (JSON.stringify(game.players) !== plOrig) {
//            console.log('change to players, will write data')
        }
        if (JSON.stringify(game.players) !== plOrig) {
            updateDelay = setTimeout(() => {
                // save list of players, but do so on a timeout so as not to address the database too frequently
                sessionController.updateSession(game.uniqueID, {players: game.players})
            }, 5000);
        }
        if (cb) {
            cb(ID);
        } else {
            console.log('reg P, no CB');
        }
        return ID;
    } else {
//        console.log('no game exists with that address');
    }
};
module.exports = { getGame , getGameCount , startGame, restoreGame, resetGame, registerPlayer, assignTeams };
