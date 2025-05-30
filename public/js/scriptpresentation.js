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
                updateGame(rgame);
            }
            if (game) {
                const initSlide = game.presentation.slideData.slideList[game.presentation.currentSlide];
                if (initSlide) {
                    showSlide(initSlide);
                }
                setStorePrefix();
                if (localStorage.getItem(`${getStorePrefix()}-watch`)) {
                    setWatch(localStorage.getItem(`${getStorePrefix()}-watch`));
                }
                window.initScoreboard(getSessionID(), 'presentation', game);
            }
        });
        socket.on('gameReady', (rGame) => {
//            console.log(`oo, game is ready`, rGame);
//            game = rGame;
            updateGame(rGame);
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
//            console.log(`socket event`, slOb);
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
        socket.on('preparePresentation', () => {
//            console.log('YES');
        });
    };
    const updateGame = (g) => {
        // unified method for updating the game object
        game = g;
    };
    const setCurrentSlideObject = (slOb) => {
        currentSlideObject = Object.assign({}, slOb);
//        console.log(`setCurrentSlideObject:`);
//        console.log(window.clone(slOb));
//        console.log(window.clone(currentSlideObject));
//        console.log('end of objects ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
    };
    const getCurrentSlideObject = () => {
        return currentSlideObject ? currentSlideObject : '';
    };
    const onGameUpdate = (rGame) => {
//        console.log(`onGameUpdate`, rGame);
//        console.log(`watchFor`, watchFor);
//        console.log('watched game: ', game[watchFor].toString());
//        console.log('watched rGame: ', rGame[watchFor].toString());
//        console.log('different?', (game[watchFor].toString() !== rGame[watchFor].toString()));
        if (watchFor) {
            if (game[watchFor].toString() !== rGame[watchFor].toString()) {
                if (watchFor === 'scores') {

                }
                updateSlide()
            }
        }
        if (game.round !== rGame.round) {
            setWatch('scores');
        }
//        game = rGame;
        updateGame(rGame);

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
            toggleOverlay();
            estSocket();
        }, 500);
    };
    const showScores = () => {
        socket.emit('getScores', `game-${game.uniqueID}`, (s) => {
//            console.log(`showScores callback`);
//            console.log(s);
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
//        console.log(v);
//        v = v.filter(p => p.round === 1);
//        console.log(v);
//        console.log(`scores values match? ${v.length === s.length}`);

        if (v.length !== s.length) {
            socket.emit('getAllValues', `game-${game.uniqueID}`, (v) => {
                game.values = v;
            })
            return false;
        }

        s = filterScorePackets(s, 'round', 1);
//        console.log(s);
        let sStatic = s.slice(0);
        if (v && s) {
            v = sortByProperty(v, 'team');
            s = sortByProperty(s, 'src');
//            console.log(s)
            v.forEach((vu, i) => {
//                console.log(s[i]);
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
    let valInt = null;
    const prepAllocations = (n, sc) => {
        // prep votes & values for rendering. Takes a required 'n' and an optional 'sc' arg.
        // Returns an array of objects
        // NOTE "values" are always set prior to "scores", so "values" can be assumed here
//        console.log(`${window.clone(game).values.length} values recorded`);
//        clearInterval(valInt);
//        valInt = setInterval(() => {
//            console.log(`${window.clone(game).values.length} values recorded`);
//        }, 500);
        const t = game.persistentData.teamsArray;
        let rArr = [];
        let v = game.values;
        let s = sc ? sc : game.scores;
        v = v.filter(p => p.round === n);
        s = filterScorePackets(s, 'round', n);
//        console.log(s);
        let sStatic = s.slice(0);
        if (v && s) {
            v = sortByProperty(v, 'team');
            s = sortByProperty(s, 'src');
            v.forEach((vu, i) => {
//                console.log(s[i]);
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
//        console.log(`prepAllocations, values: `, v);
        // use only r[n] scores:
        sStatic = filterScorePackets(sStatic, 'round', n);
        sStatic.forEach((sp, i) => {
//            console.log(sp);
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
    const prepScoresR3V1 = (sc) => {
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
    const prepCollaborations = (sc) => {
        console.log(`prepCollaborations`);
        const t = game.persistentData.teamsArray;
        const v = game.values;
        let rArrNew = [];
        let s = sc ? sc : game.scores;
        s = filterScorePackets(s, 'round', 4);
        let sStatic = s.slice(0);
        // use only r3 scores:
        sStatic = filterScorePackets(sStatic, 'round', 4);
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
        console.log(rArrNew);
        return rArrNew;
    };

    const showRound1 = () => {
        showAllocationSlide(1);
    };
    const showRound3 = () => {
        showAllocationSlide(3);
    };
    const showRound1V1 = () => {
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
    const showCollaboration = () => {
        console.log(`showCollaboration`);

        const preScores = filterScorePackets(game.scores.map(s => unpackScore(s)), 'round', 4);
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
//                const allScores = prepScoresR3(rs);
                const allScores = prepCollaborations(rs);
                const rOb2 = {};
                const scoreSumm = window.getScoresSummary();
                const vals1 = game.values.filter(v => v.round === 1);
                const vals3 = game.values.filter(v => v.round === 3);
                Object.entries(scoreSumm).forEach((r, i) => {
                    const votes = r[1].collScores;
                    votes.forEach((v, n) => {
                        votes[n] = {
                            value: typeof(v) === 'object' ? v.val : '',
                            displayColour: t[n].displayColour
                        };
                    });
                    votes.splice(i, 1);
                    const vals = vals3.filter(v => v.team === i)[0];

                    const ob = Object.assign(t[i], {
                        votes: votes,
                        action: vals.action,
                        description: vals.description
                    });
                    rOb2[`card_${i}`] = ob;
                });
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
//                console.log('go render', rOb);
                console.log('go render', rOb2);
                renderTemplate(targ, 'slides/showround4', rOb2, () => {});
            });
        });
    };
    let delay = null;
    const showRound3Delay = () => {
        console.log(`%cHIT IT`, 'color: yellow;')
    };
    const showRound3V1 = () => {
        clearTimeout(delay);
        delay = setTimeout(showRound3Delay, 1000);
        setWatch('scores');
        console.log(`showRound3`);
        const mt = game.persistentData.mainTeams;
        const t = game.persistentData.teamsArray.slice(0, mt.length);
        const fsp = window.filterScorePackets;
        const v = game.values;
        const outArr = [];
        const outOb = {};
        socket.emit('getGame', `${game.uniqueID}`, (rgame) => {
            socket.emit('getScores', `game-${game.uniqueID}`, (rs) => {
                const sr3 = fsp(rs, 'round', 3);
                console.log(`${rs.length} scores returned`);
                console.log(rs);
                console.log(sr3);
                t.forEach(tm => {
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
                outArr.forEach((tm, i) => {
                    outOb[`card_${i}`] = tm;
                });
                console.log(`call the render`);
                renderTemplate(targ, 'slides/showround3', outOb, () => {
                    console.log(`render complete`)
                });
            });
        });
    };
    let alloCount = 0;
    const showAllocationSlide = (n) => {
//        console.log(`showRound${n}, ${game.round}`);
        setWatch('scores');
        socket.emit('getGame', `${game.uniqueID}`, (rgame) => {
            onGameUpdate(rgame);
//            console.log(rgame.values);
            const preScores = filterScorePackets(game.scores.map(s => unpackScore(s)), 'round', n);
            socket.emit('getScores', `game-${game.uniqueID}`, (rs) => {
                rs = filterScorePackets(rs, 'round', n);
//                console.log(`${rs.length} r${n} scores found`);
//                console.log(`${rgame.values.length} values found`);
                if (rs.length !== rgame.values.length) {
//                    console.log('mismatch, try again');
//                    console.log(rgame.values);
                }
                const allScores = prepAllocations(n, rs);
                if (!allScores) {
                    console.log('fail due to values not being in place yet, return and run again after short delay');
                    if (alloCount++ < 5) {
                        // prevent this from running for too long
                        setTimeout(() => {
                            showAllocationSlide(n);
                        }, 100);
                        return;
                    }
                    return;
                } else {
                    alloCount = 0;
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
                renderTemplate(targ, 'slides/showround1', rOb, () => {
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
    const showRoundAllocation = (n) => {
        clearTimeout(delay);
        delay = setTimeout(showRound3Delay, 1000);
        setWatch('scores');
//        console.log(`showRound3`);
        const mt = game.persistentData.mainTeams;
        const t = game.persistentData.teamsArray.slice(0, mt.length);
        const fsp = window.filterScorePackets;
        const v = game.values;
//        console.log(v)
        const outArr = [];
        const outOb = {};
        socket.emit('getGame', `${game.uniqueID}`, (rgame) => {
            socket.emit('getScores', `game-${game.uniqueID}`, (rs) => {
                const sr3 = fsp(rs, 'round', n);
//                console.log(`${rs.length} scores returned`);
//                console.log(rs);
//                console.log(sr3);
                t.forEach((tm, i) => {
//                    console.log(i, tm.id);
                    const otherTeams = t.slice(0);
//                    const ac = v.filter(vp => vp.team === tm.id)[0];
                    let ac = v.filter(vp => vp.team === tm.id);
//                    console.log(ac);
                    let o = {votes: []}
                    if (ac) {
                        ac = ac.filter(vp => vp.round === n)[0];
//                        console.log(ac);
                        if (ac) {
                            o = {
                                id: tm.id,
                                title: tm.title,
                                displayColour: tm.displayColour,
                                action: ac.action,
                                description: ac.description,
                                round: ac.round,
                                votes: []
                            };
                            console.log(o);
                        }
                    }
                    otherTeams.forEach(ot => {
                        const tv = fsp(fsp(sr3, 'dest', tm.id), 'src', ot.id);
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
                    console.log('push', o)
                });
                outArr.forEach((tm, i) => {
                    outOb[`card_${i}`] = tm;
                });
                console.log(`call the render`, outOb);
//                return 'method complete';
                renderTemplate(targ, `slides/showround${n}`, outOb, () => {
                    console.log(`render complete`)
                });
            });
        });
        return 'showRoundAllocation has no return value';
    };
    window.tester = showAllocationSlide;
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
                slideAction(slOb);
                goVideo(slOb.srcRef);
                videoPlayer = $('#videoPlayer');
                setTimeout(() => {
    //                unmute();
                }, 500);
            });
        });
    };
    const showImage = (slOb) => {
        removeTemplate(targ, () => {
            renderTemplate(targ, 'slides/imageslide', slOb, () => {

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
//        console.log(`showGameQR`, rOb);
        rOb = Object.assign(rOb, qrRenderMain);
        renderTemplate('qr', `qr/qrcode-${game.uniqueID}`, rOb, () => {
//            console.log('rendered');
        })
    };

    const emitWithPromiseCOMMONNOW = (event, data) => {
        return new Promise((resolve, reject) => {
            socket.emit(event, data, (response) => {
                resolve(response);
            });
        });
    };
    const renderTotalsTable = () => {
        window.renderScoreboard('totals_table', 'presentation.results', () => {
            const ss = window.getScoresSummary();
            window.updateScoreTable();

        });
    };
    const renderTotals = async (o) => {
//        console.clear();
//        console.log(`+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`);
//        console.log(`renderTotals`, window.clone(o));
        // make sure the game object is up to date before proceeding
        socket.emit('getGame', `${game.uniqueID}`, (rgame) => {
            updateGame(rgame);
            const barsPos = $($('.barchart').find('tr')[0]).find('.bar');
            const barsNeg = $($('.barchart').find('tr')[1]).find('.bar');
            const typeMap = {
                t2030: 'total2030',
                t2040: 'scorePlusShare',
                tfinal: 'grandTotal'
            };
            const scoresSumm = window.getScoresSummary();
            const totals = Object.values(scoresSumm).map(s => s[typeMap[`t${o.actionArg}`]]);
//            console.log(o.actionArg);
//            console.log(typeMap[`t${o.actionArg}`]);
            let tAbs = totals.map(s => s = Math.abs(s));
            const max = tAbs.sort(sortNumber)[0];
            const mult = 100 / max;
            $(`.totalNum`).html('');
//            console.log(o);
//            console.log(scoresSumm);
//            console.log(totals);
            barsPos.each((i, b) => {
//                console.log(totals[i]);
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
                } else {
                    total.animate({bottom: `${tPos}px`});
                }
                $(`#b${i}Neg`).animate({height: `${neg}%`});
            });
        });
    };
    // End specific actions


    // Panopto API code:
    var embedApi;
    function goVideo(id) {
//        console.log(`goVideo:`);
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
//                        p.fadeIn();
                        p.hide();
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
        let tempAction = null;
        if (slOb.hasOwnProperty('action')) {
            if (slOb.action.includes(':')) {
                tempAction = slOb.action;
                const s = slOb.action.split(':');
                slOb.action = s[0];
                rOb.actionArg = s[1];
            }
            if (window[slOb.action]) {
                window[slOb.action](rOb);
                if (tempAction) {
                    slOb.action = tempAction;
                }
            } else {
//                console.log(`action does not exist in code (${slOb.action})`);
            }
        }
    };
    const showSlide = (slOb) => {
        console.log(`showSlide`, window.clone(slOb));
        devInfo(slOb);
        setCurrentSlideObject(slOb);
        console.log(`currentSlideObject set to `, slOb);
        console.log(`getCurrentSlide returns:`, getCurrentSlide());
        slOb.gameAddress = game.address;

        if (slOb.type === 'video') {
            showVideo(slOb)
        } else if (slOb.type === 'image') {
            showImage(slOb);
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
        const slOb = currentSlideObject;
//        console.log(`updateSlide, slOb:`, window.clone(slOb));
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
//        console.log(`onScoresUpdated`);
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

    const toggleOverlay = () => {
        let sequence = ["shift", "d", "b"];
        let index = 0;

        $(document).on("keydown", (e) => {
            if (e.key.toLowerCase() === sequence[index]) {
                index++;
                if (index === sequence.length) {
                    $("#devoverlay").toggle();
                    index = 0; // Reset sequence after triggering
                }
            } else {
                index = 0; // Reset if wrong key is pressed
            }
        });
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
    window.showCollaboration = showCollaboration;
    window.renderTotals = renderTotals;
    window.renderTotalsTable = renderTotalsTable;
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
