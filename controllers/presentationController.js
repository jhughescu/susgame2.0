let Presentation = null;
let game = null;
let presentation = null;

const gameController = require('./../controllers/gameController');
const sessionController = require('./../controllers/sessionController');
const { getEventEmitter } = require('./../controllers/eventController');

const eventEmitter = getEventEmitter();
const setPresentation = () => {};
const showSlide = () => {
    const slOb = presentation.slideData.slideList[presentation.currentSlide];
    slOb.address = game.address;
//    console.log(`showSlide`, slOb);
    eventEmitter.emit('showSlide', slOb);
};
const nextSlide = (cb) => {
    const rOb = presentation.nextSlide(cb);
    Object.assign(game.presentation, rOb);
    sessionController.updateSession(game.uniqueID, {slide: presentation.currentSlide});
    showSlide();
};
const previousSlide = (cb) => {
    const rOb = presentation.previousSlide(cb);
    Object.assign(game.presentation, rOb);
    sessionController.updateSession(game.uniqueID, {slide: presentation.currentSlide});
    showSlide();
};
const gotoSlide = (sl, cb) => {
    if (presentation) {
        if (presentation.gotoSlide) {
            const rOb = presentation.gotoSlide(sl, cb);
            Object.assign(game.presentation, rOb);
            sessionController.updateSession(game.uniqueID, {slide: presentation.currentSlide});
            showSlide();
        }
    }
};
const reloadSlide = (cb) => {
    presentation.reloadSlide(cb);
    showSlide();
};
const play = (cb) => {
    presentation.play(cb);
};
const pause = (cb) => {
    presentation.pause(cb);
};
const toggleAutoPlay = (cb) => {
    const slOb = {prop: 'autoplay', val: presentation.toggleAutoPlay(cb), address: game.address};
    eventEmitter.emit('updatePresentationProperty', slOb);
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
                case 'gotoSlide':
                    gotoSlide(ob.val, cb);
                    break;
                default:
                    console.log(`presentationController: unknown pEvent event`);
            }
        }
    } else {
        console.log(`no such game ${ob.gameID}`);
    }
};
module.exports = { pEvent };
