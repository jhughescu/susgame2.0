const dbController = require('./../controllers/databaseController');
const socketController = require('./../controllers/socketController');
dbController.dbEvents.on('databaseChange', (ch) => {
//    console.log('yes way');
    socketController.emitSystem('databaseChange', ch);
});
