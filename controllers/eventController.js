const EventEmitter = require('events');
//const dbController = require('./../controllers/databaseController');
//const socketController = require('./../controllers/socketController');

const eventEmitter = new EventEmitter();

/*
dbController.dbEvents.on('databaseChange', (ch) => {
    socketController.emitSystem('databaseChange', ch);
});
*/

module.exports = eventEmitter;
console.log(module.exports)
