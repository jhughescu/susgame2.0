document.addEventListener('DOMContentLoaded', function () {
    const targ = 'insertion';
//    const renderOb = {qrlight: '#d1e5d133', qrdark: '#0d140d'};
    const renderOb = {qrdark: '#ffffff88', qrlight: '#0d140d44'};
    let gameID = null;
    let game = null;
    let videoPlayer = null;
    let autoplay = true;
    let watchFor = null;
    let currentSlideObject = null;
    const getSessionID = () => {
        const ID = window.location.hash.replace('#', '');
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
            onGameUpdate(rGame);
        });
        socket.on('scoresUpdated', (scores) => {
            console.log('a score update', scores);
            onScoresUpdated(scores);
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
    };
    const setCurrentSlideObject = (slOb) => {
        currentSlideObject = Object.assign({}, slOb);
    };
    const onGameUpdate = (rGame) => {
        console.log('a game update:');
        console.log(`watching for ${watchFor}`);
        if (watchFor) {
            console.log(game[watchFor] === rGame[watchFor]);
            console.log(game[watchFor]);
            console.log(rGame[watchFor]);
            if (game[watchFor] !== rGame[watchFor]) {
                updateSlide()
            }
        }
        game = rGame;
        console.log(game);

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
            console.log(`getAllValues callback`);
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
        let rArr = [];
        let v = game.values;
        let s = sc ? sc : game.scores;
        let sStatic = s.slice(0);
        if (v && s) {
//            console.log(game);
//            console.log(s);
//            console.log(v);
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
//                console.log(ob)
            });
        }
//        console.log(`scoreArray`, rArr);
//        console.log(`sew`, sStatic);
//        console.log('values', v);
        let rArrNew = [];
        sStatic.forEach(sp => {
//            console.log(sp);
            const vl = v.find(obj => obj.team === sp.src);
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
        console.log(`new array`, rArrNew)
        return rArrNew;
    };
    const showRound1 = () => {
        socket.emit('getGame', `${game.uniqueID}`, (rgame) => {
            game = rgame;
            socket.emit('getScores', `game-${game.uniqueID}`, (rs) => {
                setWatch('scores')
                console.log(`got r1`, rs);
                renderTemplate(targ, 'slides/showround1', prepScoresR1(rs));
            });

        });
    };
    const getVidID = () => {
        let vid = null;
        if (getCurrentSlide().hasOwnProperty(`srcRef`)) {
            vid = getCurrentSlide().srcRef;
        }
        return vid;
    };
    const onVideoEnd = () => {
        console.log('a video has ended');
        const ap = game.presentation.autoplay;
        if (ap) {
            socket.emit('gotoNextSlide', {gameID: game.uniqueID, address: game.address});
        }
    };
    const showVideo = (slOb) => {
        renderTemplate(targ, 'slides/video_player', slOb, () => {
            goVideo(slOb.srcRef);
            videoPlayer = $('#videoPlayer');
            setTimeout(() => {
//                unmute();
            }, 500);
        });
    };

    // Specific actions
    const showGameQR = (rOb) => {
        renderTemplate('qr', `qr/qrcode-${game.uniqueID}`, rOb, () => {

        })
    };
    const renderTotals = () => {
        const barsPos = $($('.barchart').find('tr')[0]).find('.bar');
        const barsNeg = $($('.barchart').find('tr')[1]).find('.bar');
        barsPos.each((i, b) => {
            const perc = (Math.random() * 200) - 100;
            let newH = perc;
            let neg = Math.abs(newH);
            if (newH < 0) {
                newH = 0;
            } else {
                neg = 0;
            }
            $(b).animate({height: `${newH}%`});
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
        const p = $('#devoverlay');
        if (p.length > 0) {
            if (p.is(':visible')) {
                p.html('');
                renderTemplate('devoverlay', 'presentation.devinfo', slOb, () => {
                    p.fadeIn();
                });
            }
        }
    };
    const slideAction = (slOb) => {
        const rOb = {gameID: game.uniqueID};

        console.log(slOb.hasOwnProperty('action'));
        if (slOb.hasOwnProperty('action')) {
            console.log(slOb.action)
            if (window[slOb.action]) {
                console.log('yes');
                window[slOb.action](rOb);
            } else {
                console.log('no');
            }
        }
    };
    const showSlide = (slOb) => {
        console.log(`showSlide`, slOb);
        devInfo(slOb);
        if (slOb.type === 'video') {
            showVideo(slOb)
        } else if (slOb.type === 'slide') {
            const slideID = `slides/${slOb.slide}`;
            console.log(`slideID`, slideID);
//            console.log(`slOb`, slOb);
//            console.log(`renderOb`, renderOb);
//            console.log(`game`, game);
            renderTemplate(targ, slideID, game, () => {
                const rOb = {gameID: game.uniqueID};
                slideAction(slOb);
                Object.assign(rOb, renderOb);
                setCurrentSlideObject(slOb);
            });
        } else {
            renderTemplate(targ, `slides/notready`, slOb, () => {});
        }
    };
    const updateSlide = () => {
//        showSlide(currentSlideObject);
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
//    window.pauseVideo = pauseVideo;
//    window.playVideo = playVideo;
//    window.videoCheck = videoCheck;
});
