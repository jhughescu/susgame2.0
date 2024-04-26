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
//        console.log('in', ob);
//        console.log('pre', JSON.parse(JSON.stringify(presentation)));
        Object.assign(presentation, ob);
        game.presentation = presentation;
//        console.log('post', JSON.parse(JSON.stringify(presentation)));
//        console.log(presentation);
    };
    const eventUpdate = (ob) => {
        updatePresentation(ob);
        showCurrentSlide();
        updateSlidelist();
        updateAutoplay();
    };
    const updateSlidelist = () => {
        const sl = slides.slice();
        sl.forEach((s, i) => {
            s.isCurrent = i === game.presentation.currentSlide;
        });
        window.renderTemplate('slidelist', 'facilitator.slidelist', sl, () => {
            $('.slide_link').off('click').on('click', function () {
                console.log($(this).attr('id'));
                const gOb = {gameID: game.uniqueID, event: 'gotoSlide', val: parseInt($(this).attr('id').split('_')[2])};
                socket.emit('presentationEvent', gOb, (ob) => {
                    eventUpdate(ob);
                });
            })
        });
    };
    const updateAutoplay = () => {
        const ap = presentation.autoplay;
//        console.log(`updateAutoplay: ${ap}`)
        const btn = $('#sb_auto');
        btn.removeClass(`auto_${!ap}`).addClass(`auto_${ap}`);
    }
    const showCurrentSlide = () => {
        const ob = {currentSlide: game.presentation.currentSlide};
        window.renderTemplate('slide_detail_previous', 'facilitator.slideshow.detail', {title: 'previous', info: slides[ob.currentSlide - 1], valid: ob.currentSlide > 0});
        window.renderTemplate('slide_detail_current', 'facilitator.slideshow.detail', {title: 'current', info: slides[ob.currentSlide], valid: true});
        window.renderTemplate('slide_detail_next', 'facilitator.slideshow.detail', {title: 'next', info: slides[ob.currentSlide + 1], valid: ob.currentSlide < slides.length - 1});
        $('#sb_previous').attr({disabled: !presentation.hasPrevious});
        $('#sb_next').attr({disabled: !presentation.hasNext});
    };
    const pEvent = (ev) => {
        if (ev) {
            const eOb = {gameID: game.uniqueID, event: ev};
            socket.emit(`presentationEvent`, eOb, (ob) => {
                eventUpdate(ob);
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
        updateAutoplay();
    };
    // expose methods to the parent page (make available to scriptpresentation.js)
    window.slideContolsInit = init;
    window.pEvent = pEvent;
});
