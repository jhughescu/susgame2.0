const { eventEmitter } = require('./../controllers/eventController');
console.log('testController')
setInterval(() => {
    console.log(eventEmitter);
}, 2000);

module.exports = {
    eventEmitter
};
