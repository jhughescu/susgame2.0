const dbController = require('./../controllers/databaseController');
dbController.dbEvents.on('databaseChange', (ch) => {
    console.log('yes way')
});
