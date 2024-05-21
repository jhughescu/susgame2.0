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
    const home = {note: 'home setting', temp: 'game.main', partialName: 'game-links', ob: player, tempType: 'home', sub: null};
//    console.log(window.location);
    const qu = window.getQueries(window.location.href);
    const fake = qu.fake === 'true';
//    console.log(fake);
    const showGame = () => {
        return game;
    };
    const updateGame = (ob) => {
        if ($.isEmptyObject(game)) {
            game = ob;
            window.gameShare(game);
        } else {
            Object.assign(game, ob);
        }
    };
    const registerwithGame = () => {
        let ID = qu.hasOwnProperty(fID) ? qu[fID] : fake ? '': localStorage.getItem(lID);
        const initObj = {game: gID, player: ID, fake: fake, socketID: socket.id};
        window.socketShare(socket);
//        console.log('reg with game')
        socket.emit('registerPlayer', initObj, (ob) => {
            console.log(`the callback`)
            if (ob) {
                console.log(`registerwithGame`, ob);
                let res = ob.id;
                if (ob.game) {
                    ob.game = JSON.parse(ob.game);
                    updateGame(ob.game);
                    setPlayer(game);
                }
                // amend for fake players
                if (res.indexOf('f', 0) > -1) {
                    lID = lID + res;
                }
                localStorage.setItem(lID, res);
                if (ob.renderState) {
                    ob.renderState.source = `registerPlayer event`;
                    updateRenderState(ob.renderState);
                }
                let hash = window.location.hash;
                if (hash) {
                    let rOb = {temptype: 'sub'};
                    if (/\d/.test(hash)) {
                        // number found in hash; assume a team page, fetch object accordingly
                        const n = parseInt(hash.match(/\d+/)[0]);
                        rOb.ob = Object.assign({}, game.persistentData.teams[`t${n}`]);
                        delete rOb.ob.game;
                        hash = hash.replace(/\d/g, '');
                    }
                    rOb.temp = `game.${hash.replace('#', '')}`;
                    updateRenderState(rOb);
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
            console.log(`getGameCount callback: ${g}`);
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
        window.playerShare(player);
//        console.log(player);
    };
    const teamsAssigned = (game) => {
        updateGame(game);
        setPlayer(game);
//        renderState = {temp: 'game.main', ob: player};
        updateRenderState({temp: 'game.main', ob: player, partialName: 'game-links'});
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
        const ID = `${lID}-roundState`;
//        console.log(`setRoundState ${ID} ${boo}`);
        localStorage.setItem(ID, boo);
    };
    const getRoundState = (boo) => {
        const ID = `${lID}-roundState`;
        let rs = localStorage.getItem(ID);
//        console.log(rs, typeof(rs));
        rs = procVal(rs);
//        console.log(rs, typeof(rs));
        return rs;
    };
    const activateYourmove = async () => {
        // light up the yourmove button & bring it into focus
//        console.log(`activateYourmove`);
        const ymb = $('.yourmove-btn');
        if (ymb.length > 0) {
            ymb.removeClass('disabled');
            ymb.off('click').on('click', async () => {
                setRoundState(true);
                const rs = await new Promise((resolve, reject) => {
                    socket.emit('getRenderState', {game: game, playerID: player.id}, (rs) => {
                        console.log(`game`, game);
                        console.log(`renderState`, rs);
                        resolve(rs);
                        updateRenderState(rs);
                        render();
                    });
                });
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
    const onStartRound = async (ob) => {
        console.log(`onStartRound, ob:`, ob);
        if (ob.game) {
            updateGame(ob.game);
        }
        //    \/ two different possible arg types - not ideal, but a quick type check fixes it.
        const r = typeof(ob) === 'object' ? ob.val : ob;
//        console.log(`r ${r}`);
//        console.log(game.persistentData.rounds)
        round = game.persistentData.rounds[r];
        if (r === -1) {
            updateRenderState({temp: 'game.main', partialName: 'game-links'});
            render();
        }
        if (round) {
            console.log(`yep, round is OK`);
            if (round.type === player.teamObj.type) {
                console.log('conditions met');
                const rs = await thisRoundScored();
                console.log('hmmmm', rs);
                if (!rs.hasScore) {
                    console.log('activate')
                    activateYourmove();
                }
            } else {
//                console.log(`conditions not met`);
            }
        } else {
//            console.log('no round at all')
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
            rs.source = 'getRenderState event';
            returnRenderState = rs;
        }
        hb.off('click');
        hb.on('click', async () => {
            setHash();
            homeState();
            setRoundState(false);
            resetScroll();
            render();
            const round = game.persistentData.rounds[game.round];
            if (round) {
                const rs = await thisRoundScored();
                if (!rs.hasScore) {
                    activateYourmove();
                }
            }

        });
    };
    const setHash = (hash) => {
        hash = Boolean(hash) ? `#${hash}` : '';
//        console.log(`setHash: ${hash}`);
//        if (!window.location.hash.includes(hash) || hash === '') {
        if (!window.location.hash.includes(hash) || hash === '') {
            let cURL = window.location.href;
            cURL = cURL.replace(window.location.hash, '');
            cURL += hash;
            window.history.replaceState({}, '', cURL);
        }
    };
    const setupMainControl = () => {
        const l = $('.link_main');
        const ls = $(`#link_resources`);
        const lg = $(`#link_global`);
        const lc = $(`#link_connecton`);
        l.off('click');
        lg.on('click', () => {
            setHash(`global`);
            updateRenderState({temp: 'game.global', sub: null, tempType: 'sub', ob: {hasContent: true}});
            resetScroll();
            render();
        });
        lc.on('click', () => {
            setHash(`connecton`);
            updateRenderState({temp: 'game.connecton', sub: null, tempType: 'sub'});
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
        const a = $('a');
        a.off('click').on('click', function () {
            const t = $(this).attr('id').split('_')[1];
            const tm = Object.assign({}, game.persistentData.teams[`t${t}`]);
            tm.game = {};
            delete tm.game;
            setHash(`connecton.team${t}`)
            updateRenderState({temp: `game.connecton.team`, ob: tm});
            render(() => {
                console.log(`ok, we can set up the button now`)
            });
        })
    };
    const setupTeamControl = () => {
        // Just needs a return to Connecton button
        const b = $('#connecton_btn');
        b.off('click').on('click', () => {
            updateRenderState({temp: 'game.connecton', ob: {}});
            // Note: set hash to 'reset' first, as the setHash method will not overwrite hash if it includes the new hash
            setHash('reset');
            setHash('connecton');
            render();
        });
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
                window.setupAllocationControl();
                break;
            case 'vote':
                window.setupVoteControl();
                break;
            case 'connecton.team':
                setupTeamControl();
                break;
            default:
                console.warn(`no controls defined for ${type}`);
        }
    };
    const getStoredRenderState = () => {
        console.warn(`call to getStoredRenderState, which is being phased out`)
        let srs = localStorage.getItem('renderState');
        if (srs) {
            srs = JSON.parse(srs);
            srs.source = 'localStorage';
        };
        return srs;
    }
    const storeRenderState = () => {
        // knocking this out for the time being 20240416
        return;

        localStorage.setItem('renderState', JSON.stringify(renderState));
    }
    const updateRenderState = (ob) => {
        if (ob) {
            console.log(`updating the renderState`);
            console.log(ob)
            console.log(renderState)
            const deletions = [];
            Object.assign(renderState, ob);
            for (let i in renderState) {
                if (renderState[i] === null) {
//                    console.log(`deleted ${i}`);
                    deletions.push(i);
                    delete renderState[i]
                }
            }
            storeRenderState();
            const show = Object.assign({}, renderState);
            if (show.msg) {
                console.log(show.msg);
            }
            delete renderState.note;
        }
    };
    const homeState = () => {
//        console.log(`set to home state`);
        home.ob = player;
        updateRenderState(home);
    };
    const resetScroll = () => {
        $('html, body').animate({
            scrollTop: 0
        }, 300);
    };
    const render = (cb) => {
        // render can accept an optional callback
        if (typeof(renderState) === 'object') {
            const GAMESTUB = `game.`;
            const targ = renderState.hasOwnProperty('targ') ? renderState.targ : 'insertion';
            const rOb = renderState.hasOwnProperty('ob') ? renderState.ob: {};
            rOb.game = game;
            if (renderState.hasOwnProperty('partialName')) {
                rOb.partialName = renderState.partialName;
            }
            if (renderState.tempType) {
                if (renderState.tempType === 'interaction') {
                    // interactions must be 'activated' for their templates to be rendered, otherwise the home template should be rendered (with trigger button enabled)
                    if (getRoundState()) {
//                        console.log(`button has been clicked, interactive template allowed`)
                    } else {
//                        console.log(`button not clicked, return to home`)
                        homeState();
                    }
                }
            }
            console.log(`renderState`, renderState);
            const rType = renderState.temp.replace(GAMESTUB, '');
            // delete playersFull from the render object 'game' object, as this causes circularity
            delete rOb.game.playersFull;
            renderTemplate(targ, renderState.temp, rOb, () => {
                setupControl(rType);
                if (renderState.hasOwnProperty('sub')) {
                    console.warn('"sub" functionality removed 20240416')
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
//                console.log('Change detected in the div:', mutation);
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
    socket.on('forceRefresh', () => {
//        console.log('make me refresh');
        window.location.reload();
//        console.log(`I feel refreshed`)
    });
    socket.on('startRound', (ob) => {
        console.log(`startRound heard, ob:`, ob);
        onStartRound(ob);
    });
    socket.on('waitForGame', () => {
//        console.log('waitForGame - connected but no game, try again in a minute');
//        window.location.reload();
    })
    renderTemplate = window.renderTemplate;
    procVal = window.procVal;
    //
    window.showGame = showGame;
//    window.renderTeam = renderTeam;
    /*
    window.addEventListener('beforeunload', function(event) {
        // Cancel the event as stated by the standard.
        event.preventDefault();
        // Chrome requires returnValue to be set.
        event.returnValue = 'Are you sure you want to leave? You may not be able to rejoin the session.';
    });
    */
});
