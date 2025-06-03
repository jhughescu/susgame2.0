// mutexRegistry.js
// Manages possible concurrent method calls
const { Mutex } = require('async-mutex');

const gameLocks = {};

function getGameMutex(gameID) {
    if (!gameLocks[gameID]) {
        gameLocks[gameID] = new Mutex();
    }
    return gameLocks[gameID];
}

module.exports = { getGameMutex };
