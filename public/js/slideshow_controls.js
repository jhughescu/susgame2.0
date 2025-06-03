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
        console.log('%cset game now', 'background-color: black; color: green; font-weight: bold;')
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
    const onGameUpdate = (rg) => {
        const og = JSON.parse(JSON.stringify(game));
        if (og) {
            const gt = og.teams;
            const event = rg._updateSource.event.split(' ').reverse()[0];
            const allowedEvents = ['startRound', 'endRound', 'presentationAction'];
            const isAllowed = allowedEvents.some(term => event.includes(term));
            game = rg;
            if (isAllowed) {
    //            \/ timeout used to ensure game has updated before this code runs
                setTimeout(() => {
                    const teamsChanged = game.teams.length !== gt.length;
                    const roundChanged = justNumber(game.round) !== justNumber(og.round);
                    const roundCompleted = rg.round.toString().includes('*');
                    if (teamsChanged || roundChanged || roundCompleted) {
                        updateSlidelist();
                    }
                    setupControls();
                }, 300)
            }
        }
    };
    const getBlankSlide = () => {
        return {isEnabled: false}
    };
    const updateSlidelist = () => {
        // knock out any excluded slides
        const sl = slides.slice().filter(s => !s.exclude);
//        console.log('slideObjects');
//        console.log(game);
        $('.slide_link').each((i, s) => {
            const slOb = sl[i];
            slOb.isEnabled = true;
            if (slOb.hasOwnProperty('action')) {
                if (slOb.action.toLowerCase().includes('assignteams')) {
                    if (game.teams.length > 0) {
                        slOb.isEnabled = false;
                    }
                }
                if (slOb.action.includes('startRound')) {
                    const slR = window.justNumber(slOb.action);
                    const gr = window.justNumber(game.round);
                    slOb.gameRound = {round: game.round, number: gr};
                    slOb.isNextRound = slR === gr + 1 && (game.round.toString().includes('*') || gr === 0);
                    slOb.rCompleteNotThisNext = game.round.toString().includes('*') && slR !== gr + 1;
                    if (!slOb.isNextRound && (slR !== gr)) {
                        slOb.isEnabled = false;
                    }
                    if (slOb.rCompleteNotThisNext) {
                        slOb.isEnabled = false;
                    }
                    slOb.teamsAssiged = game.teams.length > 0;
                    if (game.teams.length === 0) {
                        slOb.isEnabled = false;
                    }
                    slOb.title = `${slOb.title.includes('(R') ? '' : '(R' + slR + ') '}${slOb.title}`;
//                    console.log(slOb);
                }
            }
            slOb.title = `${slOb.type === 'video' && !slOb.title.includes('-symbols-') ? '<span class="slideicon material-symbols-outlined">movie</span>' : ''}${slOb.title}`;
            slOb.isCurrent = i === game.presentation.currentSlide;
        });
//        console.log(sl);
        window.renderTemplate('slidelist', 'facilitator.slidelist', sl, () => {
            const slidelink = $('.slide_link');
            slidelink.off('click').on('click', function () {
                const able = !$(this).attr('class').includes('disabled');
                const sID = parseInt($(this).closest('.slide_info').attr('id').split('_')[2]);
                if (able) {
                    gotoSlide(sID);
                }
            });
            let timer = null;
            slidelink.off('mouseover').on('mouseover', function () {
                const note = $(this).closest('.slide_info').find('.slidenote');
                if (Boolean(note.html())) {
                    timer = setTimeout(() => {
                        note.fadeIn();
                    }, 500)
                }
            });
            slidelink.off('mouseout').on('mouseout', function () {
                const note = $(this).closest('.slide_info').find('.slidenote');
                if (Boolean(note.html())) {
                    clearTimeout(timer);
                    note.fadeOut();
                }
            });
            $('.replay').off('click').on('click', function () {
                const sID = parseInt($(this).closest('.slide_info').attr('id').split('_')[2]);
                const eOb = {gameID: game.uniqueID, event: 'reload'};
                socket.emit(`presentationEvent`, eOb, (ob) => {
                    eventUpdate(ob);
                });
            });
        });
    };
    const gotoSlide = async (v) => {
//        const
//        return;
//        console.log(`gotoSlide will call slideTest`);
//        console.log(v);
        const gOb = {gameID: game.uniqueID, event: 'gotoSlide', val: v};
//        const gOb = {gameID: game.uniqueID, event: 'gotoSlide', val: v, test: await window.slideTest(v)};
//        console.log(`slideClick`, gOb);
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
//        console.log(`pEvent`, ev);
//        console.log(ev);
        if (ev) {
            const eOb = {gameID: game.uniqueID, event: ev};
            socket.emit(`presentationEvent`, eOb, (ob) => {
                eventUpdate(ob);
            });
        } else {
            console.warn(`pEvent requires an event name (string)`);
        }
    };
    const slideRoundTrigger = (sl) => {
        let tr = {triggers: false};
        if (sl) {
            if (sl.hasOwnProperty('action')) {
                if (sl.action.includes('startRound')) {
                    tr.triggers = true;
                    tr.round = sl.action.split(':')[1];
                }
            }
        }
        return tr
    }
    const setupControls = () => {
        let b = base.find('.buttons').find('button');
        const slPrevious = game.slide > 0 ? slides[game.slide - 1] : getBlankSlide();
        const slNext = game.slide === slides.length - 1 ? getBlankSlide() : slides[game.slide + 1];
        const disabled = {
            previous: !slPrevious.isEnabled,
            next: !slNext.isEnabled
        }
        b = b.add($('.slideshow_control'));
        b.each((bt, el) => {
            let btn = $(el);
            let id = btn.attr('id').replace('sb_', '');
            if (!Boolean(disabled[id])) {
                btn.off('click').on('click', function () {
                    pEvent(id);
                });
                btn.removeClass('disabled');
            } else {
                btn.addClass('disabled');
            }
        });
        socket.emit('checkSocket', {sock: 'pres', address: game.address}, (o) => {
            updatePresentationStatus(Boolean(o.total));
        });
    };
    const findRoundTrigger = (r) => {
        // looks for a slide which is to be triggered by scoring for a given round
//        console.log(`look for a trigger for round ${r}`);
        const sl = presentation.slideData.slideList;
        const trig = sl.filter(o => o.trigger && o.trigger.includes(`scoreRound:${r}`));
        if (trig.length > 1) {
            console.warn(`multiple slides contain same trigger action.`);
        } else {
            if (trig.length) {
//                console.log('we have trig length');
                const trigSlideRef = trig[0].ref;
//                console.log(`trigSlideRef: ${trigSlideRef}`);
                if (trigSlideRef !== presentation.currentSlide) {
//                    console.log(`findRoundTrigger will call gotoSlide`);
                    gotoSlide(trigSlideRef);
                }
            }
        }
    };
    const resetCheck = (ob) => {
        // called from the FDB, wait for slides to be initialised and then go to the first one
        if (slides) {
//            console.log('i have the slides now');
//            console.log(slides);
//            console.log(slides[0]);
            gotoSlide(0);
        } else {
            setTimeout(() => {
                resetCheck(ob);
            }, 300);
        }
    };
    const showSlides = () => {
        if (slides) {
            console.log(slides)
        } else {
            console.log('no slides to show');
        }
    };
    const init = (game) => {
//        console.log('init controls');
        setGame(game);
        base = $('#slideshow_controls');
        updatePresentation({hasPrevious: presentation.currentSlide > 0, hasNext: presentation.currentSlide < slides.length - 1});
        showCurrentSlide();
        updateSlidelist();
        setupControls();
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
    socket.on('gameUpdate', (rg) => {
        onGameUpdate(rg);
    });
    socket.on('preparePresentation', (ob) => {
        resetCheck(ob);
    });
    // expose methods to the parent page (make available to scriptpresentation.js)
    window.slideContolsInit = init;
    window.pEvent = pEvent;
    window.findRoundTrigger = findRoundTrigger;
    window.updateSlideList = updateSlidelist;
    window.showSlides = showSlides;
});
