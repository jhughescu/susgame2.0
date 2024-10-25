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
    let showDev = true;
    let currentSlideObject = null;
    let storePrefix = null;
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
//                    console.log('init', initSlide);
                    showSlide(initSlide);
                }
                setStorePrefix();
//                console.log('store thing sought:', getStorePrefix());
//                console.log(localStorage.getItem(`${getStorePrefix()}-watch`));
                if (localStorage.getItem(`${getStorePrefix()}-watch`)) {
//                    console.log('store thing found')
                    setWatch(localStorage.getItem(`${getStorePrefix()}-watch`));
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
        socket.on('roundComplete', () => {
//            console.log(`game round: ${game.round}`);
//            console.log(this[`showRound${game.round}`]);
            const meth = this[`showRound${game.round}`];
            if (Boolean(meth)) {
                if (typeof (meth) === 'function') {
                    meth();
                }
            }
        });
        socket.on('togglePresInfo', toggleDevInfo);
    };
    const setCurrentSlideObject = (slOb) => {
        currentSlideObject = Object.assign({}, slOb);
    };
    const getCurrentSlideObject = () => {
        return currentSlideObject ? currentSlideObject : '';
    };
    const onGameUpdate = (rGame) => {
//        console.log(`onGameUpdate, watchFor: ${watchFor}`);
        if (watchFor) {
            if (game[watchFor].toString() !== rGame[watchFor].toString()) {
                if (watchFor === 'scores') {

                }
//                console.log(`a match for the watch, update slide`);
                updateSlide()
            }
        }
        if (game.round !== rGame.round) {
            setWatch('scores');
        }
//        console.log(`onGameUpdate`, rGame.values);
        game = rGame;

    };
    const estPanopto  = () => {
        // Loads the Panopto API script for controlling video content
        var tag = document.createElement('script');
        tag.src = "https://developers.panopto.com/scripts/embedapi.min.js"
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        console.log('Panopto API ready');
    };
    const setStorePrefix = () => {
        storePrefix = `presStore-${game.address}`;
//        console.log(`storePrefix set to ${storePrefix}`);
    };
    const getStorePrefix = () => {
        return storePrefix;
    };
    const setWatch = (l) => {
        // set a property of the game to watch
//        console.log(`watch for ${l}`);

        watchFor = l;
        localStorage.setItem(`${getStorePrefix()}-watch`, l);
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
//        console.log(`showValues`);
        socket.emit('getAllValues', `game-${game.uniqueID}`, (v) => {
//            console.log(`getAllValues callback`);
            const vals = Object.assign({}, v);
            console.log(game)
            for (let i in vals) {
                vals[i].teamTitle = game.persistentData.teamsArray[vals[i].team].title;
            }
//            console.log(vals);
            const valsArr = Object.values(vals);
            valsArr = sortByProperty(valsArr, 'team');
//            console.log(valsArr);
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
//        console.log(`scores values match? ${v.length === s.length}`);

        if (v.length !== s.length) {
            socket.emit('getAllValues', `game-${game.uniqueID}`, (v) => {
                game.values = v;
            })
            return false;
        }
        s = filterScorePackets(s, 'round', 1);
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
//        console.log(`prepScoresR1`);
//        console.log(sStatic);
//        console.log(v);
        sStatic.forEach(sp => {
            const vl = v.find(obj => obj.team === sp.src);
            if (vl) {
                const ob = {
                    team: sp.src,
                    title: t[sp.src].title,
                    action: vl.action,
                    description: vl.description,
                    value: sp.val,
                    teamObj: t[sp.src]
                };
                rArrNew.push(ob);
            } else {
                console.warn(`no vl found`)
            }
        });
        return rArrNew;
    };
    const prepScoresR3 = (sc) => {
        const t = game.persistentData.teamsArray;
        const v = game.values;
        let rArrNew = [];
        let s = sc ? sc : game.scores;
        s = filterScorePackets(s, 'round', 3);
        let sStatic = s.slice(0);
        // use only r3 scores:
        sStatic = filterScorePackets(sStatic, 'round', 3);
        sStatic.forEach(sp => {
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
        return rArrNew;
    };

    const showRound1 = () => {
//        console.log('showRound1');
        setWatch('scores');
        socket.emit('getGame', `${game.uniqueID}`, (rgame) => {
            const preScores = filterScorePackets(game.scores.map(s => unpackScore(s)), 'round', 1);
            socket.emit('getScores', `game-${game.uniqueID}`, (rs) => {
                rs = filterScorePackets(rs, 'round', 1);
                const allScores = prepScoresR1(rs);
//                console.log(allScores)
                if (!allScores) {
                    console.log('fail due to values not being in place yet, return and run again after short delay');
                    setTimeout(showRound1, 100);
                    return;
                }
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
//                console.log(`render r1 template:`)
                renderTemplate(targ, 'slides/showround1', rOb, () => {
//                    console.log(`render callback`);
//                    console.log(rOb);
                    allScores.forEach(s => {
                        const scoredBefore = filterScorePackets(preScores, 'src', s.team).length > 0;
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
    const showRound3v1 = () => {
        const preScores = filterScorePackets(game.scores.map(s => unpackScore(s)), 'round', 3);
        const rOb = {};
        const t = game.persistentData.teamsArray;
        const mtl = game.persistentData.mainTeams.length;
        t.forEach((tm, i) => {
            if (i < mtl) {
                const ob = Object.assign({}, tm);
                rOb[`card_${tm.id}`] = ob;
            }
        });
        socket.emit('getGame', `${game.uniqueID}`, (rgame) => {
            socket.emit('getScores', `game-${game.uniqueID}`, (rs) => {
                const allScores = prepScoresR3(rs);
                for (var i in rOb) {
                    const jn = window.justNumber(i);
                    rOb[i] = allScores[jn];
                    if (rOb[i]) {
                        const obCopy = JSON.parse(JSON.stringify(rOb[i]));
                        rOb[i].displayColour = obCopy.teamObj.displayColour;
                        rOb[i].id = obCopy.teamObj.id;
                        rOb[i].votes = [];
                        allScores.forEach(tm => {
                            if (tm.team !== rOb[i].team) {
                                const tOb = {
                                    displayColour: tm.teamObj.displayColour,
                                    value: tm.value
                                };
                                rOb[i].votes.push(tOb);
                            }
                        });
                    }
                }
                renderTemplate(targ, 'slides/showround3', rOb, () => {
                    console.log(allScores);
                    console.log(allScores3);
                    console.log(rOb);
                });
            });
        });
    };
    let delay = null;
    const showRound3Delay = () => {
        console.log(`%cHIT IT`, 'color: yellow;')
    }
    const showRound3 = () => {
        clearTimeout(delay);
        delay = setTimeout(showRound3Delay, 1000);
        setWatch('scores');
        console.log(`showRound3`)
        const mt = game.persistentData.mainTeams;
        const t = game.persistentData.teamsArray.slice(0, mt.length);
        const fsp = window.filterScorePackets;
        const v = game.values;
//        console.log(v);
        const outArr = [];
        const outOb = {};
        socket.emit('getGame', `${game.uniqueID}`, (rgame) => {
            socket.emit('getScores', `game-${game.uniqueID}`, (rs) => {
                const sr3 = fsp(rs, 'round', 3);
                console.log(`${rs.length} scores returned`);
                console.log(rs);
                console.log(sr3);
                t.forEach(tm => {
//                    console.log(`%c${tm.title.toUpperCase()}`, 'color: green;');
//                    console.log(tm.title, fsp(sr3, 'dest', tm.id));
//                    const otherTeams = t.filter(ot => ot.id !== tm.id);
                    const otherTeams = t.slice(0);
                    const ac = v.filter(vp => vp.team === tm.id)[0];
                    const o = {
                        id: tm.id,
                        title: tm.title,
                        displayColour: tm.displayColour,
                        action: ac.action,
                        description: ac.description,
                        votes: []
                    };
                    otherTeams.forEach(ot => {
                        const tv = fsp(fsp(sr3, 'dest', tm.id), 'src', ot.id);
//                        console.log(ot.title, tv);

                        o.votes.push({
                            id: ot.id,
                            title: ot.title,
                            displayColour: ot.displayColour,
                            value: tv.length > 0 ? tv[0].val : '',
                            opacity: tv.length > 0 ? 1 : 0.5,
                            td: ot.id === tm.id ? 'hide' : 'show'
                        })
                    });
                    outArr.push(o);
                });
//                console.log(outArr);
                outArr.forEach((tm, i) => {
                    outOb[`card_${i}`] = tm;
                });
                console.log(`call the render`);
                renderTemplate(targ, 'slides/showround3', outOb, () => {
//                    console.log(outOb);
                    console.log(`render complete`)
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
//            console.log(`render with`, slOb)
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
    const renderTotals = async (o) => {
        const barsPos = $($('.barchart').find('tr')[0]).find('.bar');
        const barsNeg = $($('.barchart').find('tr')[1]).find('.bar');
        const round = o.hasOwnProperty('actionArg') ? o.actionArg : window.justNumber(game.round);
        let totals = await emitWithPromise(socket, `getTotals${round}`, game.uniqueID);

        if (typeof(totals) === 'string') {
            totals = JSON.parse(totals);
        }
        let orig = {};
        if (!totals.hasOwnProperty('length')) {
            orig = JSON.parse(JSON.stringify(totals));
            totals = Object.values(totals);

        }
        totals = totals.map(s => s.gt);
        let tAbs = totals.map(s => s = Math.abs(s));
        const max = tAbs.sort(sortNumber)[0];
        const mult = 100 / max;
        $(`.totalNum`).html('');
        barsPos.each((i, b) => {
            const perc = totals[i] * mult;
            let newH = perc;
            let neg = Math.abs(newH);
            if (newH < 0) {
                newH = 0;
            } else {
                neg = 0;
            }
            const positive = (newH / 100) * $(b).parent().height();
            const negative = (neg / 100) * $(b).parent().height();
            $(b).animate({height: `${newH}%`});
            const total = neg === 0 ? $(`#tn${i}Pos`) : $(`#tn${i}Neg`);
            total.html(roundNumber(totals[i], 1));
            const tPos = neg === 0 ? positive + 50 : positive;

            if (justNumber(total.html()) === 0) {
                total.css({bottom: '40px'});
                console.log('trtgfgfhff');
            } else {
                total.animate({bottom: `${tPos}px`});
            }
            $(`#b${i}Neg`).animate({height: `${neg}%`});
        });
    };
    const renderTotalsV1 = async (o) => {
        setWatch('scores');
        const barsPos = $($('.barchart').find('tr')[0]).find('.bar');
        const barsNeg = $($('.barchart').find('tr')[1]).find('.bar');
        const round = o.hasOwnProperty('actionArg') ? o.actionArg : window.justNumber(game.round);
        let totals = await emitWithPromise(socket, `getTotals${round}`, game.uniqueID);

        if (typeof(totals) === 'string') {
            totals = JSON.parse(totals);
        }
        let orig = {};
        console.log(`renderTotals: ${Boolean(totals)}`);
        console.log(totals);
        if (!totals.hasOwnProperty('length')) {
            orig = JSON.parse(JSON.stringify(totals));
            console.log('convert array:');
            totals = Object.values(totals);
            console.log(totals);
        }
        totals = totals.map(s => s.gt);

//        console.log(JSON.parse(JSON.stringify(totals)));
        let tAbs = totals.map(s => s = Math.abs(s));
        const max = tAbs.sort(sortNumber)[0];
        const mult = 100 / max;
        $(`.totalNum`).html('');
        barsPos.each((i, b) => {
            const ob = Boolean(totals[i]) ? totals[i] : orig[`t${i}`];
            console.log(`using ${Boolean(totals[i]) ? 'array': 'object'}`)
//            const perc = totals[i] * mult;
            const perc = ob * mult;
            let newH = perc;
            let neg = Math.abs(newH);
            if (newH < 0) {
                newH = 0;
            } else {
                neg = 0;
            }
            const positive = (newH / 100) * $(b).parent().height();
            const negative = (neg / 100) * $(b).parent().height();
            $(b).animate({height: `${newH}%`});
            const total = neg === 0 ? $(`#tn${i}Pos`) : $(`#tn${i}Neg`);
            total.html(roundNumber(totals[i], 1));
            const tPos = neg === 0 ? positive + 50 : positive;
            total.animate({bottom: `${tPos}px`});
            console.log(i, perc, totals[i], mult, newH, total.html());
            console.log(totals[`t${i}`]);
            console.log(orig[`t${i}`]);
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
    const toggleDevInfo = () => {
        const devStr = `presDev-${game.address}`;
//        console.log('toggle the devInfo', devStr, showDev, typeof(showDev));
        if (localStorage.getItem(devStr)) {
            showDev = localStorage.getItem(devStr);
        }
        showDev = procVal(showDev);
//        console.log('toggle the devInfo', devStr, showDev, typeof(showDev));
        showDev = !showDev;
        localStorage.setItem(devStr, showDev);
//        console.log(`toggleDevInfo, showDev:`, showDev);
        devInfo();

    };
    const devInfo = (slOb) => {
//        let isDev = false;
//        showDev = !showDev;
        const devStr = `presDev-${game.address}`;
//        console.log(`devInfo`, showDev);
        if (localStorage.getItem(devStr)) {
            showDev = localStorage.getItem(devStr);
        }
        showDev = procVal(showDev);
        if (!Boolean(slOb)) {
//            console.log(`make a slOb`);
            slOb = game.presentation.slideData.slideList[game.slide];
        }
//        let isDev = showDev;
        let q = window.location.hash.split('?')[1];
        if (q) {
            q = Object.fromEntries(new URLSearchParams(q));
            if (q.hasOwnProperty('dev')) {
                isDev = procVal(q.dev);
            }
        }
        const p = $('#devoverlay');
        if (showDev) {
//            console.log('ooh ahh')
            if (p.length > 0) {
//                console.log('chips');
                p.show();
                if (p.is(':visible')) {
//                    console.log('mice');
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
//    window.devInfo = devInfo;
//    window.toggleDevInfo = toggleDevInfo;
    const slideAction = (slOb) => {
        const rOb = {gameID: game.uniqueID};

//        console.log(`slide has action`, slOb.hasOwnProperty('action'));
        if (slOb.hasOwnProperty('action')) {
//            console.log(`the action is`, slOb.action);
            if (slOb.action.includes(':')) {
                const s = slOb.action.split(':');
//                console.log(`action item:`, s)
                slOb.action = s[0];
                rOb.actionArg = s[1];
            }
            if (window[slOb.action]) {
//                console.log('action exists in the code, rOb:');
//                console.log(rOb)
                window[slOb.action](rOb);
            } else {
//                console.log(`action does not exist in code (${slOb.action})`);
            }
        }
    };
    const showSlide = (slOb) => {
//        console.log(`showSlide`, slOb);
        devInfo(slOb);
        setCurrentSlideObject(slOb);
//        console.log(`currentSlideObject set to `, slOb);
//        console.log(`getCurrentSlide returns:`, getCurrentSlide());
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
//        console.log(`updateSlide`);
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

    this.showRound1 = showRound1;
    this.showRound3 = showRound3;

    window.showScores = showScores;
    window.showValues = showValues;
    window.showRound1 = showRound1;
    window.showRound3 = showRound3;
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
