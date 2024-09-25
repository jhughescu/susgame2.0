document.addEventListener('DOMContentLoaded', function() {
    const getSessionID = () => {
        const cookies = document.cookie.split(';');
//        console.log(`getSessionID`);
        for (let cookie of cookies) {
//            console.log(cookie);
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === 'sessionID') {
                return decodeURIComponent(cookieValue);
            }
        }
        return null;
    };
    const socket = io('', {
        query: {
            role: 'presentation-control',
            id: getSessionID()
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
    const updatePresentationStatus = (boo) => {
        // update to the online status of the game's presentation client
        const status = `o${boo ? 'n' : 'ff'}line`;
        const span = $('#status');
        span.html(status);
        span.removeClass('online offline');
        span.addClass(status);
//        console.log(`presentation ${status}`);
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
//                const sID = parseInt($(this).attr('id').split('_')[2]);
                const sID = parseInt($(this).closest('.slide_info').attr('id').split('_')[2]);
                console.log(`click the slide link, call gotoSlide`);
                gotoSlide(sID);
            });
            $('.replay').off('click').on('click', function () {
                const sID = parseInt($(this).closest('.slide_info').attr('id').split('_')[2]);
//                console.log(`clicked ${sID}`);
                const eOb = {gameID: game.uniqueID, event: 'reload'};
                socket.emit(`presentationEvent`, eOb, (ob) => {
                    eventUpdate(ob);
                });
//                const sID = parseInt($(this).attr('id').split('_')[2]);
//                gotoSlide(sID);
            });
        });
    };
    const gotoSlide = async (v) => {
//        const
//        return;
        console.log(`gotoSlide will call slideTest`);
        const gOb = {gameID: game.uniqueID, event: 'gotoSlide', val: v};
//        const gOb = {gameID: game.uniqueID, event: 'gotoSlide', val: v, test: await window.slideTest(v)};
        console.log(`slideClick`, gOb);
//        console.log(window.slideTest(v));
        socket.emit('presentationEvent', gOb, (ob) => {
            eventUpdate(ob);
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
//        console.log(ob);
        //     \/  communicate with the facilitator dashboard, which can carry out game actions
        window.facilitatorSlideChange(ob);
        window.renderTemplate('slide_detail_previous', 'facilitator.slideshow.detail', {title: 'previous', info: slides[ob.currentSlide - 1], valid: ob.currentSlide > 0});
        window.renderTemplate('slide_detail_current', 'facilitator.slideshow.detail', {title: 'current', info: slides[ob.currentSlide], valid: true});
        window.renderTemplate('slide_detail_next', 'facilitator.slideshow.detail', {title: 'next', info: slides[ob.currentSlide + 1], valid: ob.currentSlide < slides.length - 1});
        $('#sb_previous').attr({disabled: !presentation.hasPrevious});
        $('#sb_next').attr({disabled: !presentation.hasNext});
    };
    const pEvent = (ev) => {
        console.log(`pEvent`);
        console.log(ev);
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
        let b = base.find('.buttons').find('button');
        b = b.add($('.slideshow_control'));
//        console.log(b);
        b.each((bt, el) => {
            let btn = $(el);
            let id = btn.attr('id').replace('sb_', '');
            btn.off('click').on('click', function () {
                pEvent(id);
            })
        });
        socket.emit('checkSocket', {sock: 'pres', address: game.address}, (o) => {
//            console.log(`checkSocket callback`, o);
            updatePresentationStatus(Boolean(o.total));
        });
    };
    const findRoundTrigger = (r) => {
        // looks for a slide which is to be triggered by scoring for a given round
        console.log(`look for a trigger for round ${r}`);
        const sl = presentation.slideData.slideList;
        const trig = sl.filter(o => o.trigger && o.trigger.includes(`scoreRound:${r}`));
        if (trig.length > 1) {
            console.warn(`multiple slides contain same trigger action.`);
        } else {
            if (trig.length) {
                const trigSlideRef = trig[0].ref;
                if (trigSlideRef !== presentation.currentSlide) {
                    console.log(`findRoundTrigger will call gotoSlide`);
                    gotoSlide(trigSlideRef);
                }
            }
        }
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
    socket.on('presentationSlideUpdated', (ob) => {
//        console.log('slideshowControl presentationSlideUpdated', ob)
    });
    socket.on('videoPositionUpdate', (ob) => {
//        console.log('slideshowControl videoPositionUpdate', ob);
        const prog = $(`#slide_info_${ob.slideID}`).find('.progress');
//        console.log(prog);
        prog.css({width: `${ob.perc}%`})
    });
    socket.on('presentationConnect', (boo) => {
//        console.log(`pres connect: ${boo}`, boo);
        updatePresentationStatus(boo.connected);
    });
    // expose methods to the parent page (make available to scriptpresentation.js)
    window.slideContolsInit = init;
    window.pEvent = pEvent;
    window.findRoundTrigger = findRoundTrigger;
});
