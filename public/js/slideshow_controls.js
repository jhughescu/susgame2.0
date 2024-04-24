document.addEventListener('DOMContentLoaded', function() {
    const socket = io('', {
        query: {
            role: 'presentation-control'
        }
    });
    let game = null;
    let slides = null;
    let presentation = null;
    let base = null;
    let output = null;
    const setGame = (g) => {
        game = g;
        slides = game.presentation.slideData.slideList;
        presentation = game.presentation;
    };
    const updatePresentation = (ob) => {
        Object.assign(presentation, ob);
//        console.log(presentation);
    };
    const updateSlidelist = () => {
        const sl = slides.slice();
        sl.forEach((s, i) => {
            s.isCurrent = i === game.presentation.currentSlide;
        });
        window.renderTemplate('slidelist', 'facilitator.slidelist', sl);
    };
    const showCurrentSlide = () => {
        const ob = {currentSlide: game.presentation.currentSlide};
//        console.log(slides[ob.currentSlide]);
        window.renderTemplate('slide_detail_previous', 'facilitator.slideshow.detail', {title: 'previous', info: slides[ob.currentSlide - 1], valid: ob.currentSlide > 0});
        window.renderTemplate('slide_detail_current', 'facilitator.slideshow.detail', {title: 'current', info: slides[ob.currentSlide], valid: true});
        window.renderTemplate('slide_detail_next', 'facilitator.slideshow.detail', {title: 'next', info: slides[ob.currentSlide + 1], valid: ob.currentSlide < slides.length - 1});
        $('#sb_previous').attr({disabled: !presentation.hasPrevious});
        $('#sb_next').attr({disabled: !presentation.hasNext});
    };
    const pEvent = (ev) => {
        if (ev) {
            socket.emit(`presentationEvent`, {gameID: game.uniqueID, event: ev}, (ob) => {
                updatePresentation(ob);
                showCurrentSlide();
                updateSlidelist();
            });
        } else {
            console.warn(`pEvent requires an event name (string)`);
        }
    }
    const setupControls = () => {
        const b = base.find('button');
        b.each((bt, el) => {
            let btn = $(el);
            let id = btn.attr('id').replace('sb_', '');
            btn.off('click').on('click', function () {
                pEvent(id);
//                socket.emit(`presentationEvent`, {gameID: game.uniqueID, event: id}, (ob) => {
//                    updatePresentation(ob);
//                    showCurrentSlide();
//                    updateSlidelist();
//                });
            })
        });
    };
    const init = (game) => {
//        console.log('init controls');
        setGame(game);
        base = $('#slideshow_controls');
        setupControls();
        updatePresentation({hasPrevious: presentation.currentSlide > 0, hasNext: presentation.currentSlide < slides.length - 1});
        showCurrentSlide();
        updateSlidelist();
    };
    // expose methods to the parent page (make available to scriptpresentation.js)
    window.slideContolsInit = init;
    window.pEvent = pEvent;
});
