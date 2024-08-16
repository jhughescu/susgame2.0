document.addEventListener('DOMContentLoaded', function () {
    const targ = 'insertion';
//    const qrRenderMain = {qrlight: '#d1e5d133', qrdark: '#0d140d'};
    const qrRenderMain = {qrdark: '#ffffff88', qrlight: '#0d140d44'};
    const qrRenderTemp = {qrdark: '#ffffff99', qrlight: '#0d140d99'};
    let gameID = null;
    let game = null;
    let videoPlayer = null;
    let autoplay = true;
    let watchFor = null;
    let currentSlideObject = null;
    const getSessionID = () => {
        const ID = window.location.hash.split('?')[0].replace('#', '');
//        console.log(window.location.hash);
//        console.log(ID);
        gameID = ID;
        return ID;
    };
    let socket = null;
    const estSocket = () => {
        socket = io('', {
            query: {
                role: 'presentation',
                id: getSessionID()
            }
        });
        socket.on('setGame', (rgame) => {
            if (rgame) {
                game = rgame;
            }
//            console.log(`on setGame:`);
//            console.log(game);
            if (game) {
//                console.log(game);
                const initSlide = game.presentation.slideData.slideList[game.presentation.currentSlide];
                if (initSlide) {
                    console.log('init', initSlide)
                    showSlide(initSlide);
                }
            }
        });
        socket.on('gameReady', (rGame) => {
//            console.log(`oo, game is ready`, rGame);
            game = rGame;
        });
        socket.on('gameUpdate', (rGame) => {
//            console.log('a game update', rGame);
            onGameUpdate(rGame);
        });
        socket.on('scoresUpdated', (scores) => {
//            console.log('a score update', scores);
            onScoresUpdated(scores);
        });
        socket.on('scoreUpdate', (sp) => {
            // single score update
//            console.log(`new score`, sp);
            onScoreUpdate(sp);
        });
        socket.on('showSlide', (slOb) => {
            console.log(`socket event`, slOb)
            showSlide(slOb);
        });
        socket.on('updateProperty', (slOb) => {
            console.log(`updateProperty`, slOb);
            const uOb = {};
            uOb[slOb.prop] = slOb.val;
            Object.assign(game.presentation, uOb);
            console.log(game.presentation);
        });
        socket.on('refreshWindow', () => {
            window.location.reload();
        });
        socket.on('onGameRestored', (gOb) => {
//        console.log('game restored!', gOb);
            onGameRestored(gOb);
        });
        socket.on('toggleOverlay', (type) => {
            let oType = null;
            switch (type) {
                case 'qr':
                    oType = type;
                    break;
                default:
                    console.log(`no overlay of type ${type} specified`)
            }
            if (oType) {
                const ol = $('#facilitatoroverlay');
                const oid = `overlay_${oType}`;
                const tol = ol.find(`#${oid}`);
                if (tol.is(':visible')) {
                    ol.fadeOut();
                } else {
                    ol.show();
                    ol.css({display: 'block'});
                    const oc = ol.find('.ocontent');
                    oc.attr('id', oid);
                    oc.addClass('qr');
//                    renderTemplate(oid, 'qr.presentation.overlay', {gameID: game.uniqueID});
                    renderTemplate(oid, `qr/qrcode-${game.uniqueID}`, qrRenderTemp);
                }
            }
        });
    };
    const setCurrentSlideObject = (slOb) => {
        currentSlideObject = Object.assign({}, slOb);
    };
    const getCurrentSlideObject = () => {
        return currentSlideObject ? currentSlideObject : '';
    };
    const onGameUpdate = (rGame) => {
//        console.log(`a game update: new round? ${game.round !== rGame.round}`);
//        console.log(`watching for ${watchFor}`);
//        console.log(rGame);
//        console.log(rGame._updateSource);
        if (watchFor) {
//            console.log(game[watchFor] === rGame[watchFor]);
//            console.log(game[watchFor]);
//            console.log(rGame[watchFor]);
            if (game[watchFor].toString() !== rGame[watchFor].toString()) {
//                console.log(`watch diff (${watchFor}): ${rGame[watchFor]}`);
//                console.log(game[watchFor].toString());
//                console.log(rGame[watchFor].toString());
//                console.log(rGame[watchFor].toString() === game[watchFor].toString());
                if (watchFor === 'scores') {

                }
                updateSlide()
            }
        }
        if (game.round !== rGame.round) {
            setWatch('scores');
        }
        game = rGame;
//        console.log(game);

    };
    const estPanopto  = () => {
        // Loads the Panopto API script for controlling video content
        var tag = document.createElement('script');
        tag.src = "https://developers.panopto.com/scripts/embedapi.min.js"
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        console.log('Panopto API ready');
    };
    const setWatch = (l) => {
        // set a property of the game to watch
        console.log(`watch for ${l}`);
        watchFor = l;
    };
    const init = () => {
        // Delay required to ensure game is started prior to init; find a better way to do this.
        setTimeout(() => {
//            estPanopto();
            estSocket();
        }, 500);
    };
    const showScores = () => {
        socket.emit('getScores', `game-${game.uniqueID}`, (s) => {
            console.log(`showScores callback`);
            console.log(s);
            renderTemplate('insertion', 'slides/showscores', s);
        })
    };
    const sortByProperty = (array, property) => {
        return array.sort((a, b) => {
            // Extract the values of the specified property from each object
            const valueA = a[property];
            const valueB = b[property];

            // Compare the values and return the result
            if (valueA < valueB) {
                return -1;
            } else if (valueA > valueB) {
                return 1;
            } else {
                return 0;
            }
        });
    };
    const showValues = () => {
        socket.emit('getAllValues', `game-${game.uniqueID}`, (v) => {
//            console.log(`getAllValues callback`);
            const vals = Object.assign({}, v);
            console.log(game)
            for (let i in vals) {
                vals[i].teamTitle = game.persistentData.teamsArray[vals[i].team].title;
            }
            console.log(vals)
            const valsArr = Object.values(vals);
            valsArr = sortByProperty(valsArr, 'team');
            console.log(valsArr);
            renderTemplate('insertion', 'slides/showvalues', v);
        })
    };
    const prepScoresR1 = (sc) => {
        // prep R1 scores & values for rendering. Takes an optional 'sc' arg.
        // Returns an array of objects
        // NOTE "values" are always set prior to "scores", so "values" can be assumed here
        const t = game.persistentData.teamsArray;
//        console.log(`prepScoresR1`);

        let rArr = [];
        let v = game.values;
        let s = sc ? sc : game.scores;
        s = filterScorePackets(s, 'round', 1);
//        console.log(s)
        let sStatic = s.slice(0);
        if (v && s) {
            v = sortByProperty(v, 'team');
            s = sortByProperty(s, 'src');
            v.forEach((vu, i) => {
                const ob = {
                    team: vu.team,
                    title: t[vu.team].title,
                    action: vu.action,
                    description: vu.description,
                    value: s[i].val,
                    teamObj: t[vu.team]
                }
                rArr[i] = ob;
            });
        }
        let rArrNew = [];
        // use only r1 scores:
        sStatic = filterScorePackets(sStatic, 'round', 1);
//        console.log(sStatic)
        sStatic.forEach(sp => {
//            console.log(sp);
            const vl = v.find(obj => obj.team === sp.src);
//            console.log(vl);
            const ob = {
                team: sp.src,
                title: t[sp.src].title,
                action: vl.action,
                description: vl.description,
                value: sp.val,
                teamObj: t[sp.src]
            };
            rArrNew.push(ob);
        });
//        console.log(`new array`, rArrNew);
        return rArrNew;
    };
    const showRound1 = () => {
        console.log(`showRound1`);
        setWatch('scores');
        socket.emit('getGame', `${game.uniqueID}`, (rgame) => {
//            console.log(game)
            const preScores = filterScorePackets(game.scores.map(s => unpackScore(s)), 'round', 1);
            console.log(preScores);
            game = rgame;
            socket.emit('getScores', `game-${game.uniqueID}`, (rs) => {
                rs = filterScorePackets(rs, 'round', 1);
//                console.log(rs);
                const allScores = prepScoresR1(rs);
                const rOb = {allScores: allScores};
                const t = game.persistentData.teamsArray;
                t.forEach((s, i) => {
                    rOb[`card_${i}`] = {
                        id: s.id,
                        title: s.title,
                        displayColour: s.displayColour,
                        icon: `card_icon_${s.abbr}`
                    }
                })
                allScores.forEach(s => {
                    const card = rOb[`card_${s.team}`];
                    card.action = s.action,
                    card.description = s.description;
                    card.value = s.value;
                })
                renderTemplate(targ, 'slides/showround1', rOb, () => {
                    allScores.forEach(s => {
                        const scoredBefore = filterScorePackets(preScores, 'src', s.team).length > 0;
//                        console.log(`${s.title} has scored before? ${scoredBefore}`);
                        const leaf = $(`#stakeholder_card_${s.team}`).find('.leaf');
                        if (scoredBefore) {
                            leaf.show();
                        } else {
                            leaf.fadeIn();
                        }
                    })
                });
            });

        });
    };
    const getVidID = () => {
        // used in the panopto video player html to access current vid details
        let vid = null;
        if (getCurrentSlideObject().hasOwnProperty(`srcRef`)) {
            vid = getCurrentSlideObject().srcRef;
        }
        return vid;
    };
    const onVideoEnd = () => {
        const ap = game.presentation.autoplay;
        console.log('yes, a video has ended, ap:', ap);
        const cs = getCurrentSlide();
        const slideBehaviour = cs.behaviour;
//        console.log(slideBehaviour);
//        if (slideBehaviour !== 'default') {
            // slide behaviour set at data level will take precedence
            switch (slideBehaviour) {
                case 'loop':
                    showSlide(cs);
                    break;
                default:
                    if (ap) {
                        socket.emit('gotoNextSlide', {gameID: game.uniqueID, address: game.address});
                    }
                    break;
            }
//        }
    };
    const showVideo = (slOb) => {
        removeTemplate(targ, () => {
            console.log(`render with`, slOb)
            renderTemplate(targ, 'slides/video_player', slOb, () => {
                goVideo(slOb.srcRef);
                videoPlayer = $('#videoPlayer');
                setTimeout(() => {
    //                unmute();
                }, 500);
            });
        });
    };
    const videoPosition = (o) => {
        // called from videoplayer (html), sending a comparison object (total/now)
//        console.log(currentSlideObject);
        o.perc = 100 * (o.now / o.total);
        o.address = game.address;
        o.slideID = currentSlideObject.ref;
        socket.emit('videoPositionUpdate', o);
//        console.log(perc);
    }

    // Specific actions
    const showGameQR = (rOb) => {
        console.log(`showGameQR`, rOb);
        rOb = Object.assign(rOb, qrRenderMain);
        renderTemplate('qr', `qr/qrcode-${game.uniqueID}`, rOb, () => {
            console.log('rendered');
        })
    };

    const emitWithPromiseCOMMONNOW = (event, data) => {
        return new Promise((resolve, reject) => {
            socket.emit(event, data, (response) => {
                resolve(response);
            });
        });
    };
    const renderTotals = async () => {
        setWatch('scores');
        const barsPos = $($('.barchart').find('tr')[0]).find('.bar');
        const barsNeg = $($('.barchart').find('tr')[1]).find('.bar');
        let t1 = await emitWithPromise(socket, 'getTotals1', game.uniqueID);
        t1 = JSON.parse(t1);
        t1 = t1.map(s => s.gt);
        let tAbs = t1.map(s => s = Math.abs(s));
        const max = tAbs.sort(sortNumber)[0];
        const mult = 100 / max;
        $(`.totalNum`).html('');
        barsPos.each((i, b) => {
            const perc = t1[i] * mult;

            let newH = perc;
            let neg = Math.abs(newH);
            if (newH < 0) {
                newH = 0;
            } else {
                neg = 0;
            }
//            console.log($(b).parent().height());
            const positive = (newH / 100) * $(b).parent().height();
            const negative = (neg / 100) * $(b).parent().height();
            $(b).animate({height: `${newH}%`});
            const total = neg === 0 ? $(`#tn${i}Pos`) : $(`#tn${i}Neg`);

            total.html(roundNumber(t1[i]));
            const tPos = neg === 0 ? positive + 50 : positive;
            total.animate({bottom: `${tPos}px`});
//            total.animate({top: `${negative}px`});
            $(`#b${i}Neg`).animate({height: `${neg}%`});
        });
    };
    // End specific actions


    // Panopto API code:
    var embedApi;
    function goVideo(id) {
        console.log(`goVideo:`);
        return;
        if (embedApi) {
            delete embedApi.sessionID;
            if (embedApi.events) {
                delete embedApi.events.onIframeReady;
                delete embedApi.events.onReady;
                delete embedApi.events.onStateChange;
                delete embedApi.events;
            }
            console.log('deleted:');
            console.log(embedApi);
        }
        embedApi = {};
        embedApi = new EmbedApi("player", {
            width: "100%",
            height: "100%",
            //This is the URL of your Panopto site
            serverName: "cranfield.cloud.panopto.eu",
            sessionId: id,
            videoParams: { // Optional parameters
            //interactivity parameter controls if the user sees table of contents, discussions, notes, & in-video search
                "interactivity": "none",
                "showtitle": "false",
                "hideoverlay": false,
                "showcontrols": true
            },
            events: {
                "onIframeReady": onPanoptoIframeReady,
                "onReady": onPanoptoVideoReady,
                "onStateChange": onPanoptoStateUpdate
            }
        });
//        console.log(embedApi)
    };
    let int = null;
    let count = 0;
    function onPanoptoVideoReady () {
        console.log(`onPanoptoVideoReady ${Math.random()}`);
//        embedApi.seekTo(0);
        // knock out functionality below for now - it wil be required, but currently stops playback
        /*
        setTimeout(() => {
            maxVol();
        }, 1000);
        */
    };
    function onPanoptoIframeReady () {
        // The iframe is ready and the video is not yet loaded (on the splash screen)
        // Load video will begin playback
        console.log(`onPanoptoIframeReady ${Math.random()}`);
//        console.log(embedApi.sessionId);
        const s = getCurrentSlide();
        if (s.hasOwnProperty('srcRef')) {
//            console.log(s.srcRef);
        }
        embedApi.loadVideo();
//        embedApi.seekTo(0);
    };
    const ensurePlayback = () => {
        console.log('force it to play')
        embedApi.playVideo();
        setTimeout(ensurePlayback, 2000);
    };
    const ensureAudio = () => {
//        embedApi.unmuteVideo();
        embedApi.setVolume(1);
        setTimeout(ensureAudio, 4000);
    }
    const unmute = () => {
//        embedApi.unmuteVideo();
//        const ifr = $('#videoplayerframe');
//        const vifr = ifr.contents().find('iframe');
        const ifr = document.getElementById('videoplayerframe');
//        const vifr = ifr.contentWindow.document.getElementById('iframe');
        const vd = ifr.contentWindow.document;
        const vifr = vd.getElementsByTagName('iframe')[0].contentWindow;
        console.log(`the unmute:`);
        console.log(ifr);
        console.log(vifr);
//        if (vifr.length > 0) {
            vifr.postMessage(`{"msg":"iframeUnmute","source":"PanoptoEmbed","id":"player","data":""}`, `https://cranfield.cloud.panopto.eu`);
//        }
    }
    const maxVol = () => {
        embedApi.setVolume(1);
    }
    function onPanoptoStateUpdate (state) {
        if (state === PlayerState.Ended) {
            console.log(`A video has ended - multiple calls? ${Math.random()}`);
            const ap = game.presentation.autoplay;
            if (ap) {
                socket.emit('gotoNextSlide', {gameID: game.uniqueID, address: game.address});
            }
        }
    };
    // End Panopto
    const devInfo = (slOb) => {
        let isDev = false;
        let q = window.location.hash.split('?')[1];
        if (q) {
            q = Object.fromEntries(new URLSearchParams(q));
            if (q.hasOwnProperty('dev')) {
                isDev = procVal(q.dev);
            }
        }
        const p = $('#devoverlay');
        if (isDev) {
            if (p.length > 0) {
                if (p.is(':visible')) {
                    p.html('');
                    renderTemplate('devoverlay', 'presentation.devinfo', slOb, () => {
                        p.fadeIn();
                    });
                }
            }
        } else {
            p.hide();
        }
    };
    const slideAction = (slOb) => {
        const rOb = {gameID: game.uniqueID};

        console.log(`slide has action`, slOb.hasOwnProperty('action'));
        if (slOb.hasOwnProperty('action')) {
            console.log(`the action is`, slOb.action)
            if (window[slOb.action]) {
                console.log('action exists in the code');
                window[slOb.action](rOb);
            } else {
                console.log('action does not exist in code');
            }
        }
    };
    const showSlide = (slOb) => {
//        console.log(`showSlide`, slOb);
        devInfo(slOb);
         setCurrentSlideObject(slOb);
        console.log(`currentSlideObject set to `, slOb);
        console.log(`getCurrentSlide returns:`, getCurrentSlide());
        slOb.gameAddress = game.address;

        if (slOb.type === 'video') {
            showVideo(slOb)
        } else if (slOb.type === 'slide') {
            const slideID = `slides/${slOb.slide}`;
            renderTemplate(targ, slideID, game, () => {
                const rOb = {gameID: game.uniqueID};
                slideAction(slOb);
                Object.assign(rOb, qrRenderMain);
//                setCurrentSlideObject(slOb);
                socket.emit('slideUpdated', slOb);
            });
        } else {
            renderTemplate(targ, `slides/notready`, slOb, () => {});
        }
    };
    const updateSlide = () => {
        console.log(`updateSlide`);
        const slOb = currentSlideObject;
        if (slOb) {
            if (slOb.action) {
                slideAction(slOb);
            }
        }
    };
    const showGame = () => {
        console.log(game.presentation);
    };
    const getCurrentSlide = () => {
        const p = game.presentation;
        const cs = p.currentSlide;
        const s = p.slideData.slideList[cs];
        return s;
    };
    const onScoresUpdated = (sc) => {
        game.scores = sc;
//        console.log(game);
        showRound1();
    };
    const onScoreUpdate = (sp) => {
        // functionality moved to FDB
    };
    const onGameRestored = () => {
        window.location.reload();
    };
    init();

    renderTemplate = window.renderTemplate;
    getTemplate = window.getTemplate;
    window.showScores = showScores;
    window.showValues = showValues;
    window.showRound1 = showRound1;
    window.showGameQR = showGameQR;
    window.renderTotals = renderTotals;
    window.unmute = unmute;
    window.maxVol = maxVol;
    window.ensureAudio = ensureAudio;
    window.showGame = showGame;
    window.getVidID = getVidID;
    window.onVideoEnd = onVideoEnd;
    window.getCurrentSlide = getCurrentSlide;
    window.videoPosition = videoPosition;
//    window.pauseVideo = pauseVideo;
//    window.playVideo = playVideo;
//    window.videoCheck = videoCheck;
});
