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
}
module.exports = { getGame , startGame };
