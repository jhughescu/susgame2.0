//const { createRoute} = require('./../app');
const Game = require('./../models/game');
const sessionController = require('./../controllers/sessionController');
const { getEventEmitter } = require('./../controllers/eventController');
const routeController = require('./../controllers/routeController');

const eventEmitter = getEventEmitter();
const games = {};
async function startGame (o, cb) {
    // startGame will create a new game if one does not exist, and return the Game in either case
    const session = JSON.parse(o);
    const game = `game-${session.uniqueID}`;
    let rg = null;
    if (!games.hasOwnProperty(game)) {
        games[game] = new Game(session.uniqueID, session.type);
        // Only set state to 'started' if it is currently pending
        if (session.state ===  'pending') {
            sessionController.updateSession(session.uniqueID, {state: 'started'});
        }
    }
    rg = games[game];
    routeController.createRoute(`${session.address}`);
    try {
        await rg.loadPersistentData(session.type);
    } catch (error) {
        console.error('Error loading persistent data:', error);
    }
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
//    console.log(`============================ restoreGame: ${game.uniqueID}`);
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
const getGameCount = (cb) => {
//    console.log('getGames');
//    console.log(cb);
    if (cb) {
        cb(Object.keys(games).length);
    }
    return games;
};
const getGame = (id) => {
    console.log(`get game with id ${id}`);
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
async function resetGame(id, cb) {

    // CURRENTLY RESETS ALL - ALL - THE PLAYERS
    eventEmitter.emit('resetAll');
    const game = getGameWithUniqueID(id);
//    console.log(game);
    game.players = [];
    game.state = 'pending';

    // NEED TO UPDATE THE ASSOCIATED SESSION
    console.log('setting state to pending')
    const session = await sessionController.updateSession(id, {state: 'pending'});
    if (session) {
        console.log('return updated session');
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
    if (game) {
//        console.log(game.players)
        if (ob.player) {
//            console.log(`yep, we have ob.player`);
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
//            console.log('no ob.player')
            ID = `p${ob.fake ? 'f' : ''}${game.players.length + 1}`;
            game.players.push(ID);
            newP = true;
            if (cb) {
                cb(ID);
            } else {
                console.log('reg P, no CB');
            }
        }
        console.log(`register ${ID} with game ${ob.game}, (${newP ? 'new' : 'existing'} ${ob.fake ? 'fake' : 'real'} player) - ${JSON.stringify(ob)}`);
//        console.log(ob);
        eventEmitter.emit('gameUpdate', game);
        return ID;
    } else {
        console.log('no game exists with that address');
    }
};
module.exports = { getGame , getGameCount , startGame, restoreGame, resetGame, registerPlayer };
