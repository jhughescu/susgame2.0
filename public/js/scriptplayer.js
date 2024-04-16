document.addEventListener('DOMContentLoaded', function() {
//    console.log('a player');
//    console.log(window.location.pathname);
//    const socket = io('/player');
    const socket = io();
    let gID = null;
    let lID = null;
    let fID = 'fid';
    let now = null;
    let player = null;
    let game = {};
    let renderState = {};
    let returnRenderState = {};
//    console.log(window.location);
    const qu = window.getQueries(window.location.href);
    const fake = qu.fake === 'true';
//    console.log(fake);
    const updateGame = (ob) => {
        Object.assign(game, ob);
    };
    const registerwithGame = () => {
        let ID = qu.hasOwnProperty(fID) ? qu[fID] : fake ? '': localStorage.getItem(lID);
        const initObj = {game: gID, player: ID, fake: fake, socketID: socket.id};
//        console.log(initObj);
//        console.log('reg player')
        socket.emit('registerPlayer', initObj, (ob) => {
            if (ob) {
                let res = ob.id;
                if (ob.game) {
                    ob.game = JSON.parse(ob.game);
                    updateGame(ob.game);
                    setPlayer(game);
                }
//                console.log(`register player:`);
//                console.log(ob);
                // amend for fake players
                if (res.indexOf('f', 0) > -1) {
                    lID = lID + res;
                }
                localStorage.setItem(lID, res);
                // use renderstate from localStorage if possible
                // ob.renderState can overwrite stored renderstate
                const srs = getStoredRenderState();
                /*
                if (srs) {
                    srs.source = 'localStorage'
                    updateRenderState(srs);
                }
                */
                if (ob.renderState) {
                    ob.renderState.source = `registerPlayer event`;
                    updateRenderState(ob.renderState);
                }
                const hash = window.location.hash;
                if (hash) {
//                    console.log(`do something with hash ${hash}`);
                    updateRenderState({temp: `game.${hash.replace('#', '')}`});
//                    console.log(renderState);
                }
                render(() => {
                    if (game.round > 0) {
                        onStartRound(game.round);
                    }
                });

            }
        });
    };
    const getPlayerID = () => {
        let id = null;
        if (localStorage.getItem(lID)) {
            id = localStorage.getItem(lID);
        }
        let ID = qu.hasOwnProperty(fID) ? qu[fID] : fake ? '': id;
        return ID;
    };

    const resetPlayer = () => {
//        console.log(`resetFake method (no action)`)
//        return;



//        const url = new URL(window.location.href);
//        console.log(`resetFake:`);
//        url.searchParams.delete(fID);
//        history.pushState(null, '', url);
        localStorage.clear();
        updateRenderState({temp: 'game.intro'});
        render();
    };
    const getGames = () => {
        socket.emit('getGameCount', (g) => {
            if (g === 0) {
                if (Date.now() - now < 10000) {
                    setTimeout(getGames, 500);
                } else {
                    console.log('giving up looking for games');
                }
            } else {
                registerwithGame();
            }
        });
    };
    const onConnect = () => {
        // ping the game controller until some games are available
        now = Date.now();
        getGames();
    };
    const playerConnect = (lid) => {
        gID = window.location.pathname;
        lID = lid;
        onConnect();
    };
    const getTeam = (game) => {
        const id = getPlayerID();
        const arr = game.teams;
        let ti = -1;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].includes(id)) {
                ti = i;
                break;
            }
        }
//        console.log(`ti ${ti}`);
//        console.log(game.persistentData.teams)
        const t = game.persistentData.teams[`t${ti}`];
//        console.log(t)
        return t;
    };
    const setPlayer = (game) => {
//        console.log(`setPlayer ${getPlayerID()}`);
//        console.log(game)
        const t = getTeam(game);
        player = game.playersFull[getPlayerID()];
//        console.log(player);
    };
    const teamsAssigned = (game) => {
        updateGame(game);
        setPlayer(game);
//        renderState = {temp: 'game.main', ob: player};
        updateRenderState({temp: 'game.main', ob: player});
        render();
    };
    const showOverlay = (id, ob) => {
        if ($('.overlay')) {
            $('.overlay').remove();
        }
        window.getTemplate('overlay', {}, (temp) => {
//            console.log('getTemplate returns:')
//            console.log(temp)
            $('body').append(temp);
            window.renderTemplate('overlay', id, ob, () => {
                $('.overlay').fadeIn(300).delay(2000).fadeOut(1000);
            });
        })
//        $('body').append(window.getTemplate('overlay', {}, (temp) => {
////            window.renderTemplate('overlay', id, ob, () => {
////
////            });
//        }));
    }
    const identifyPlayer = () => {
//        console.log(`id player ${getPlayerID()}`);
        const idOb = {id: getPlayerID(), sock: socket.id, stored: 'null'};
        if (player) {
            idOb.stored = player.socketID;
        }
        showOverlay('playerID', idOb);
    };

    // interactions
    const setRoundState = (boo) => {
        // store a state which can be used to check whether the current round has been 'activated' or not.
        localStorage.setItem('roundState', boo);
    };
    const getRoundState = (boo) => {
        return localStorage.getItem('roundState');
    };
    const thisRoundScored = () => {
        return new Promise((resolve, reject) => {
            socket.emit('getScorePackets', `game-${game.uniqueID}`, (sps) => {
                const scoreSumm = sps.map(s => `${s.round}.${s.src}`);
                const rID = `${game.round}.${player.teamObj.id}`;
                const spi = scoreSumm.indexOf(rID);
//                console.log(scoreSumm, rID);
//                console.log(`thisRoundScored: ${isS}`);
                resolve({hasScore: spi > -1, scorePacket: sps[spi]});
            });
        })
    };
    const setupAllocationControl = async () => {
        const butMinus = $('#vote_btn_minus');
        const butPlus = $('#vote_btn_plus');
        const val = $('.tempV');
        const submit = $(`#buttonAllocate`);
        const action = $(`#action-choice`);
        const desc = $(`#actionDesc`);
        const ints = $('#vote_btn_minus, #vote_btn_plus, #buttonAllocate, #action-choice, #actionDesc');
        const hasS = await thisRoundScored();
//        console.log('see if the round has been scored already:');
//        console.log(hasS);
        if (hasS.hasScore) {
            const vOb = {gameID: `game-${game.uniqueID}`, team: player.teamObj.id};
            socket.emit('getValues', vOb, (v) => {
//                console.log('test the values')
//                console.log(v)
                ints.prop('disabled', true);
                ints.addClass('disabled');
                val.html(hasS.scorePacket.val);
                desc.html(v.description);
                action.val(v.action);
            });
        } else {
            ints.off('click');
            butPlus.on('click', () => {
                let v = parseInt(val.html());
                if (v < 10) {
                    v += 1;
                    val.html(v);
                }
            });
            butMinus.on('click', () => {
                let v = parseInt(val.html());
                if (v > 1) {
                    v -= 1;
                    val.html(v);
                }
            });
            submit.on('click', () => {
                let scoreV = parseInt(val.html());
                let actionV = action.val();
                let descV = desc.val();
                if (scoreV === 0 || actionV === '' || descV === '') {
                    alert('Please complete all options and allocate at least 1 resource')
                } else {
                    const tID = player.teamObj.id;
                    let t = player.teamObj.id;
                    const vob = {game: game.uniqueID, values: {team: t, action: actionV, description: descV}};
                    socket.emit('submitValues', vob);
                    const sob = {scoreCode: {src: t, dest: t, val: scoreV}, game: game.uniqueID};
                    socket.emit('submitScore', sob, (scores) => {
                        setupAllocationControl();
                    });

//                    setupAllocation(false);
                }
            });
        }
    };
    const activateYourmove = async () => {
        // light up the yourmove button & bring it into focus
        const ymb = $('.yourmove-btn');
        if (ymb.length > 0) {
            ymb.removeClass('disabled');
            ymb.off('click').on('click', () => {
//                updateRenderState({temp: 'game.allocation', targ: 'main-content'});
//                updateRenderState({temp: 'game.allocation'});
                setRoundState(true);
                setTimeout(async () => {
//                    render();
                    const rs = await new Promise((resolve, reject) => {
                        socket.emit('getRenderState', {game: game, playerID: player.id}, (rs) => {
                            console.log('we can go mofo');
                            resolve(rs);
                            render();
                        });
                    });
                }, 1000);
            });
            $('html, body').animate({
                scrollTop: ymb.offset().top
            }, 300, () => {
                if (!ymb.data('flashed')) {
                    ymb.data('flashed', true);
                    ymb.fadeOut(100).fadeIn(200).fadeOut(100).fadeIn(200).fadeOut(100).fadeIn(200, () => {
                        ymb.data('flashed', false);
                    });
                }
            });
        }
    };
    const onStartRound = (r) => {
//        console.log(`onStartRound`)
//        console.log(r);
//        console.log(ob.val);
        round = game.persistentData.rounds[r];
//        console.log(round);
        if (round) {
            if (round.type === 1) {
                activateYourmove();
            }
        }
    };

    const setupHomeButton = async () => {
        const hb = $('.home_btn');
        if ($.isEmptyObject(returnRenderState)) {
            const rs = await new Promise((resolve, reject) => {
                socket.emit('getRenderState', {game: game, playerID: player.id}, (rs) => {
                    resolve(rs);
                });
            });
            rs.source = 'getRenderState event'
            returnRenderState = rs;
        }
        hb.off('click');
        hb.on('click', async () => {
            setHash();
            updateRenderState(returnRenderState);
            resetScroll();
            render();
        });
    };
    const setHash = (hash) => {
        hash = Boolean(hash) ? `#${hash}` : '';
        if (!window.location.hash.includes(hash) || hash === '') {
            let cURL = window.location.href;
            cURL = cURL.replace(window.location.hash, '');
            cURL += hash;
            window.history.replaceState({}, '', cURL);
        }
    };
    const setupMainControl = () => {
//        console.log(`setupMainControl`);
        const l = $('.link_main');
        const ls = $(`#link_resources`);
        const lg = $(`#link_global`);
        const lc = $(`#link_connecton`);
//        console.log(lg)
        l.off('click');
        lg.on('click', () => {
            setHash(`global`);
            updateRenderState({temp: 'game.global', sub: null, ob: {}});
            resetScroll();
            render();
        });
        lc.on('click', () => {
            setHash(`connecton`);
//            returnRenderState = Object.assign({}, renderState);
//            updateRenderState({temp: 'game.connecton', sub: null, ob: Object.values(game.persistentData.teams)});
            updateRenderState({temp: 'game.connecton', sub: null});
            resetScroll();
            render();
        });
    };
    const setupGlobalControl = () => {
        setupHomeButton();
    };
    const setupConnectonControl = () => {
//        console.log(`setupConnectonControl`);
        setupHomeButton();
    };
    const setupControl = (type) => {
        // On template rendered, set up any controls
//        console.log(`setupControl: ${type}`);
        switch (type) {
            case 'main':
                setupMainControl();
                break;
            case 'global':
                setupGlobalControl();
                break;
            case 'connecton':
                setupConnectonControl();
                break;
            case 'allocation':
                setupAllocationControl();
                break;
            default:
                console.warn(`no controls defined for ${type}`);
        }
    };
    const getStoredRenderState = () => {
        let srs = localStorage.getItem('renderState');
        if (srs) {
            srs = JSON.parse(srs);
            srs.source = 'localStorage';
        };
        return srs;
    }
    const storeRenderState = () => {
        localStorage.setItem('renderState', JSON.stringify(renderState));
    }
    const updateRenderState = (ob) => {
        if (ob) {
//            console.log(`updating the renderState`);
            Object.assign(renderState, ob);
            for (let i in renderState) {
                if (renderState[i] === null) {
                    delete renderState[i]
                }
            }
            storeRenderState();
//            console.log(renderState);
        }
    };
    const resetScroll = () => {
        $('html, body').animate({
            scrollTop: 0
        }, 300);
    };
    const render = (cb) => {
        // render can accept an optional callback
        console.log(`render:`);
        console.log(renderState);
        if (typeof(renderState) === 'object') {
            const GAMESTUB = `game.`;
            const targ = renderState.hasOwnProperty('targ') ? renderState.targ : 'insertion';
            const rOb = renderState.hasOwnProperty('ob') ? renderState.ob: {};
            if (renderState.hasOwnProperty('tempActive')) {
                // current state has two possible veriants, select which to use via getRoundState
                renderState.temp = renderState[`temp${Boolean(getRoundState()) ? 'Active' : 'Passive'}`];
            }
            const rType = renderState.temp.replace(GAMESTUB, '');
            rOb.game = game;
            if (renderState.hasOwnProperty('partialName')) {
                rOb.partialName = renderState.partialName;
            }
            renderTemplate(targ, renderState.temp, rOb, () => {
                setupControl(rType);
                if (renderState.hasOwnProperty('sub')) {
                    renderTemplate('sub', renderState.sub, rOb, () => {
                        switch (renderState.sub.replace(GAMESTUB, '')) {
                            case 'allocation':
                                activateYourmove(true);
//                                setupAllocation(true);
                        }
                        if (cb) {
                            cb();
                        }
                    });
                } else {
                    if (cb) {
                        cb();
                    }
                }
            });
        } else {
            console.warn('rendering not possible; renderState undefined');
        }
    };
    const onGameEnd = () => {
        console.log(`onGameEnd`);
        localStorage.clear();
//        renderState = {temp: 'game.gameover', ob: {}};
        updateRenderState({temp: 'game.gameover', ob: {}});
        render();
    };

    // Select the target div element
    const targetDiv = document.getElementById('insertion');

    // Create a new MutationObserver instance
    const observer = new MutationObserver((mutationsList, observer) => {
        // Iterate through each mutation in the mutations list
        mutationsList.forEach(mutation => {
            // Check if the mutation type is 'childList' (indicating a change in the child elements)
            if (mutation.type === 'childList') {
                // Handle the change here
                console.log('Change detected in the div:', mutation);
                if ($('.home_btn').length > 0) {
                    setupHomeButton();
                }
            }
        });
    });

    // Configure the MutationObserver to watch for changes in the child nodes of the target div
    const config = { childList: true };

    // Start observing the target div for changes
    observer.observe(targetDiv, config);

    socket.on('gameUpdate', (rgame) => {
//        console.log(`game updated: ${getPlayerID()}`)
//        console.log(rgame);
        updateGame(rgame);
        setPlayer(game);
        updateRenderState({source: 'gameUpdate event', temp: 'game.main', ob: player});
        render();
    });
    socket.on('test', () => {
        console.log('testing')
    });
    socket.on('playerConnect', (lid) => {
        playerConnect(lid);
    });
    socket.on('resetPlayer', resetPlayer);
    socket.on('teamsAssigned', (game) => {
//        console.log('the event')
        teamsAssigned(game);
    });
    socket.on('identifyPlayer', () => {
        identifyPlayer();
    });
    socket.on('identifySinglePlayer', (pl) => {
        console.log(`id me: ${pl}, ${player.id}`);
        if (pl === player.id) {
            identifyPlayer();
        }
    });
    socket.on('gameOver', () => {
        console.log(`gameOver heard`);
        onGameEnd();
    });
    socket.on('renderPlayer', (rOb) => {
        const ob = rOb.hasOwnProperty(ob) ? rOb.ob : {};
        const temp = rOb.temp;
//        renderState = {temp: temp, ob: ob};
        updateRenderState({temp: temp, ob: ob});
        if (rOb.hasOwnProperty('targ')) {
            renderState.targ = rOb.targ;
        }
        render();
    });
    socket.on('testRoundGONE', (game) => {
//        console.log('testRound heard');
        if (player.teamObj.hasLead && player.isLead) {
            const rOb = player.teamObj;
            rOb.currentRoundComplete = false;
            updateRenderState({sub: 'game.allocation'})
            renderTemplate(`sub`, 'game.allocation', rOb, () => {
                const butMinus = $('#vote_btn_minus');
                const butPlus = $('#vote_btn_plus');
                const val = $('.tempV');
                const submit = $(`#buttonAllocate`);
                const action = $(`#action-choice`);
                const desc = $(`#actionDesc`);
                console.log(submit)
                console.log(val.html())
                butPlus.off('click');
                butPlus.on('click', () => {
                    let v = parseInt(val.html());
                    if (v < 10) {
                        v += 1;
                        val.html(v)
                    }
                });
                butMinus.off('click');
                butMinus.on('click', () => {
                    let v = parseInt(val.html());
                    if (v > 1) {
                        v -= 1;
                        val.html(v)
                    }
                });
                submit.off('click');

                submit.on('click', () => {
                    let scoreV = parseInt(val.html());
                    let actionV = action.val();
                    let descV = desc.val();
                    const tID = player.teamObj.id;
                    let t = player.teamObj.id;
                    let ob = {scoreCode: {src: t, dest: t, val: scoreV}, game: game.uniqueID};
                    socket.emit('submitScore', ob);
                });
            });
        } else {
            console.log('not a lead')
        }
    });
    socket.on('forceRefresh', () => {
        console.log('make me refresh');
        window.location.reload();
    });
    socket.on('startRound', (ob) => {
        onStartRound(ob.val);
    });
    renderTemplate = window.renderTemplate;
    /*
    window.addEventListener('beforeunload', function(event) {
        // Cancel the event as stated by the standard.
        event.preventDefault();
        // Chrome requires returnValue to be set.
        event.returnValue = 'Are you sure you want to leave? You may not be able to rejoin the session.';
    });
    */
});
