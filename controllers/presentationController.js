let Presentation = null;
let game = null;
let presentation = null;

const gameController = require('./../controllers/gameController');
const sessionController = require('./../controllers/sessionController');
const { getEventEmitter } = require('./../controllers/eventController');

const eventEmitter = getEventEmitter();
const setPresentation = () => {};
const nextSlide = (cb) => {
    presentation.nextSlide(cb);
    sessionController.updateSession(game.uniqueID, {slide: presentation.currentSlide});
};
const previousSlide = (cb) => {
    presentation.previousSlide(cb);
    sessionController.updateSession(game.uniqueID, {slide: presentation.currentSlide});
};
const reloadSlide = (cb) => {
    presentation.reloadSlide(cb);
};
const play = (cb) => {
    presentation.play(cb);
};
const pause = (cb) => {
    presentation.pause(cb);
};
const toggleAutoPlay = (cb) => {
    presentation.toggleAutoPlay(cb);
};
const pEvent = (ob, cb) => {
//    console.log(`pEvent:`, ob);
    game = gameController.getGame(ob.gameID);
    if (game) {
        presentation = game.presentation;
        if (presentation) {
            switch (ob.event) {
                case 'next':
                    nextSlide(cb);
                    break;
                case 'previous':
                    previousSlide(cb);
                    break;
                case 'play':
                    play(cb);
                    break;
                case 'pause':
                    pause(cb);
                    break;
                case 'reload':
                    reloadSlide(cb);
                    break;
                case 'auto':
                    toggleAutoPlay(cb);
                    break;
                default:
                    console.log(`I don't know what this is`);
            }
        }
    } else {
        console.log(`no such game ${ob.gameID}`);
    }
};
module.exports = { pEvent };
