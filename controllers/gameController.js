//const { createRoute} = require('./../app');
const Game = require('./../models/game');
const sessionController = require('./../controllers/sessionController');
const games = {};
const startGame = (o, cb) => {
    const game = `game-${o.id}`;
    if (!games.hasOwnProperty(game)) {
        games[game] = new Game(o.id, o.type);
        sessionController.updateSession(o.id, {state: 'started'});
    }
    if (cb) {
        cb(games[game]);
    } else {
        console.log('no CB');
    }
    return games[game];
};
const getGame = (id) => {
    console.log(`get game with id ${id}`);
};
const getGameWithUniqueID = (id) => {
    for (let g in games) {
//        console.log(g)
//        console.log(games[g])
        if (games[g].gameID === id) {
            return games[g];
        }
    }
};
const registerPlayer = (session, data) => {
    console.log(`registerPlayer to game ${session.uniqueID}`);
//    console.log(games);
    console.log(getGameWithUniqueID(session.uniqueID));
//    console.log(session);
}
module.exports = { getGame , startGame, registerPlayer };
