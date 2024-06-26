document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    let gID = null;
    let lID = null;
    let fID = 'fid';
    let now = null;
    let player = null;
    let game = {};
    let renderState = {};
    let renderStateLocal = {};
    let renderStateServer = {};
    let returnRenderState = {};
    const homeStateObj = {note: 'homeState setting', temp: 'game.main', partialName: 'game-links', ob: player, tempType: 'homeState', sub: null};
    const homeState = JSON.stringify(homeStateObj);
    const qu = window.getQueries(window.location.href);
    const fake = qu.fake === 'true';
    //
    const getStorageID = (id) => {
        if (player) {
            return `ls-${player.id}-${id}`;
        } else {
//            console.warn(`cannot get storage ID - player not defined`);
        }
    };
    const addToStorage = (id, ob) => {
        const stId = getStorageID(id);
        localStorage.setItem(stId, JSON.stringify(ob));
    };
    const getFromStorage = (id) => {
        const stId = getStorageID(id);
        return JSON.parse(localStorage.getItem(stId));
    };
    const showPlayer = () => {
        return player;
    };
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
        socket.emit('registerPlayer', initObj, (ob) => {
//            console.log('regPlayer callback:', ob);
            if (ob) {
                let res = ob.id;
                if (ob.game) {
                    ob.game = JSON.parse(ob.game);
                    if (ob.game.round) {
                        ob.game.round = justNumber(ob.game.round);
                    }
                    updateGame(ob.game);
                    setPlayer(game);
                }
                // amend for fake players
                if (res.indexOf('f', 0) > -1 && lID.indexOf(res, 0) === -1) {
                    lID = lID + res;
//                    console.log(`registerwithGame, lID set to ${lID}`);
                }
                localStorage.setItem(lID, res);
                if (ob.renderState) {
                    ob.renderState.source = `registerPlayer event`;
                    updateRenderState(ob.renderState);
                    renderStateServer = ob.renderState;
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
//                console.log('here');
                render(() => {
//                    console.log(`the render callback: ${game.round} ${justNumber(game.round) > 0}`);

                    if (justNumber(game.round) > 0) {
//                        console.log(`call onStartRound with ${game.round} (${typeof(game.round)})`)
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
        localStorage.clear();
        updateRenderState({temp: 'game.pending'});
        render();
    };
    const getGames = () => {
        socket.emit('getGameCount', (g) => {
//            console.log(`getGameCount callback: ${g}`);
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
//        lID = lid;
        lID = `${lid}${getPlayerID()}`;
//        console.log(window.location.search);
//        console.log(`playerConnect, lID set to ${lID}`);
//        console.log(`heidee`, getPlayerID());
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
        const newPlayer = game.playersFull[getPlayerID()];

        if (player) {
//            console.log('player exists; this could be an update');
            if (player.teamObj) {
//                console.log(`old player`, player.teamObj.title);
//                console.log(`new player`, newPlayer.teamObj.title);
//                console.log(JSON.stringify(player) === JSON.stringify(newPlayer));

                if (player.teamObj.id !== newPlayer.teamObj.id || player.isLead !== newPlayer.isLead) {

//                    console.log('reload')
                    window.location.reload();
                }
            }
        }
        player = newPlayer;
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
            console.log('getTemplate returns:')
            console.log(temp)
            $('body').append(temp);
            window.renderTemplate('overlay', id, ob, () => {
//                $('.overlay').fadeIn(300).delay(2000).fadeOut(1000);
                console.log(id)
                console.log(ob)
                $('.overlay').fadeIn(300);
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
        const idOb = {id: getPlayerID(), sock: socket.id, stored: 'null', teamID: player.teamObj.id, team: player.teamObj.title};
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
//        console.log(`getRoundState, lID: ${lID}`);
//        console.log(rs, typeof(rs));
        rs = procVal(rs);
//        console.log(rs, typeof(rs));
        return rs;
    };
    const highlightElement = (el) => {
        if (!el.jquery) {
            el = $(`#${el}`);
        }
        $('html, body').animate({
            scrollTop: el.offset().top
        }, 300, () => {
            if (!el.data('flashed')) {
                el.data('flashed', true);
                el.fadeOut(100).fadeIn(200).fadeOut(100).fadeIn(200).fadeOut(100).fadeIn(200, () => {
                    el.data('flashed', false);
                });
            }
        });
    };
    const activateYourmoveButton = () => {
        const ymb = $('.yourmove-btn');
//        console.log(ymb);
        if (ymb.length > 0) {
            const rOb = Object.assign({}, renderState);
            rOb.active = false;
            rOb.source = `activateYourmove`;
            rOb.note = `set in scriptplayer.js`;
            setRenderStateLocal(rOb);
            ymb.removeClass('disabled');
            ymb.off('click').on('click', async () => {
                setRoundState(true);
                const rs = await new Promise((resolve, reject) => {
                    const idOb = {game: game, playerID: player.id};
                    socket.emit('getRenderState', idOb, (rs) => {
                        resolve(rs);
                        updateRenderState(rs);
                        const rOb = Object.assign({}, renderState);
                        rOb.active = true;
                        rOb.source = `yourmove click`;
                        rOb.note = `set in scriptplayer.js`;
                        setRenderStateLocal(rOb);
                        render();
                    });
                });
            });
            highlightElement(ymb);
        }
    }
    const activateYourmove = async () => {
        // If home page not displayed, go there.
        // Light up the yourmove button & bring it into focus
        // This method now includes a server call for score check
        if (renderState.temp && player) {
            if (player.teamObj) {
//                console.log(`activateYourmove`);
//                console.log(player)
                const home = renderState.temp.indexOf('main', 0) > -1;
                const interaction = renderState.tempType === 'interaction';
                const hasScored = false;
                const round = game.persistentData.rounds[procVal(game.round)];
                const inThisRound = round.type === player.teamObj.type;
                const rs = await thisRoundScored();

    //            console.log(`activateYourmove, home: ${home}, interaction: ${interaction}, hasScored: ${hasScored}`);
        //        console.log(`round`, round);
        //        console.log(`game.round`, game.round);
        //        console.log(`NEW - have I scored?`, iHaveScored(rs));
        //        console.log(`thisRoundScored`, rs);
    //            console.log(`inThisRound`, inThisRound);
    //            console.log(`renderState`, renderState);
        //        console.log(`game`, game);
        //        console.log(`player`, player);
                if (round.n > 0) {
        //            console.log('there is a round in progress');
                    // need further conditionals here - is this player invloved in the current round? Is the round already complete?
                    if (game.round.toString().indexOf('*', 0) === -1) {
        //                console.log(`round not complete`)
                        if (inThisRound) {
                            if (!iHaveScored(rs)) {
            //                    console.log(`I've not scored`);
                                if (!home && !interaction) {
                                    gotoHomeState();
                                    render(activateYourmoveButton);
                                } else {
        //                            if (interaction) {
                                        activateYourmoveButton();
        //                            }
                                }
                            } else {
//                                console.log(`I've already scored, apparently`)
                            }
                        }
                    } else {
                        // '*' in the round - round is complete
//                        console.log('the current round is complete');
                    }
                } else {
//                    console.log('no round right now')
                }
            }
        }
    };
    const iHaveScored = (sOb) => {
        // method takes a score object returned from the server, calculates whether player has scored based on type
//        console.log(`so, have I scored?`);
        // Ror type 1 (main teams) use src (team) as comp metric.
        // For type 2 (sub teams) use type - this is specific to a player rather than a team.
        const type = player.teamObj.type;
        const criteria = type === 1 ? 'src' : 'client';
//        const metric = justNumber(type === 2 ? player.index - 1 : player.teamObj.id);
//        const metric = justNumber(type === 2 ? player.index : player.teamObj.id);
        let metric = justNumber(type === 2 ? justNumber(player.id) : player.teamObj.id);
//        console.log(`metric unconverted`, (type === 2 ? justNumber(player.id) : player.teamObj.id));
//        console.log(`metric converted`, justNumber(type === 2 ? justNumber(player.id) : player.teamObj.id));
//        console.log(`type`, type);
//        console.log(`justNumber(player.id)`, justNumber(player.id));
//        console.log(`player.teamObj.id`,  player.teamObj.id);
//        console.log(`type: ${type}`);
//        console.log(`criteria: ${criteria}`);
//        console.log(`metric: ${metric} (${type === 2 ? 'player.index' : 'player.teamObj.id'})`);
        const sc = filterScorePackets(sOb.scorePackets, criteria, metric);
//        console.log(`sc`, sc);
        return sc.length > 0;
    }
    const iHaveScoredV1 = (sOb) => {
        // method takes a score object returned from the server, calculates whether player has scored based on type
//        console.log(`so, have I scored?`);
        // Ror type 1 (main teams) use src (team) as comp metric.
        // For type 2 (sub teams) use type - this is specific to a player rather than a team.
        const type = player.teamObj.type;
        const criteria = type === 1 ? 'src' : 'client';
        const metric = justNumber(type === 2 ? player.id : player.teamObj.id);
        console.log(`type: ${type}`);
        console.log(`criteria: ${criteria}`);
        console.log(`metric: ${metric} (${type === 2 ? 'player.id' : 'player.teamObj.id'})`);
        const sc = filterScorePackets(sOb.scorePackets, criteria, metric);
//        console.log(`sc`, sc);
        return sc.length > 0;
    }
    const onStartRound = async (ob) => {
//        console.log(`onStartRound, ob:`, ob);
//        console.log(`game`, game);
//        console.log(`player`, player);
        if (player) {
            const trs = await thisRoundScored(player);
    //        console.log(`thisRoundScored?`, trs);
    //        console.log(`thisRoundScored?`, trs.scorePackets);
    //        console.log(`iHaveScored?`, iHaveScored(trs));
            if (ob.game) {
                updateGame(ob.game);
            }
            //    \/ two different possible arg types - not ideal, but a quick type check fixes it.
            const r = justNumber(typeof(ob) === 'object' ? ob.val : ob);
            round = game.persistentData.rounds[r];
    //        console.log(`round`, round);
    //        console.log(`r`, r);
            if (r === -1) {
                updateRenderState({temp: 'game.main', partialName: 'game-links'});
                render();
            }
            if (round) {
    //            console.log(`round.type`, round.type);
    //            console.log(`player.teamObj.type`, player.teamObj.type);
                if (round.type === player.teamObj.type) {
    //                console.log('make it happen, bass player');
                    activateYourmove();
                } else {
    //                console.log(`conditions not met`);
                }
            } else {
    //            console.log('no round at all')
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
            rs.source = 'getRenderState event';
            returnRenderState = rs;
        }
        hb.off('click');
        hb.on('click', async () => {
            gotoHomeState();
            setRoundState(false);
            resetScroll();
            render(activateYourmove);
            const round = game.persistentData.rounds[game.round];
            if (round) {
                const rs = await thisRoundScored();
            }

        });
    };
    const setHash = (hash) => {
        // removed for now, replaced by localStorage
        return;
        hash = Boolean(hash) ? `#${hash}` : '';
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
            setRenderStateLocal({temp: 'game.global', sub: null, tempType: 'sub', ob: {hasContent: true}});
            updateRenderState({temp: 'game.global', sub: null, tempType: 'sub', ob: {hasContent: true}});
            resetScroll();
            render();
        });
        lc.on('click', () => {
            setHash(`connecton`);
            setRenderStateLocal({temp: 'game.connecton', sub: null, tempType: 'sub'});
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
//        const a = $('a');
        const a = $('.team-link');
        a.off('click').on('click', function () {
            const t = $(this).attr('id').split('_')[1];
            const tm = Object.assign({}, game.persistentData.teams[`t${t}`]);
            tm.game = {};
            delete tm.game;
//            console.log(`yep`, tm);
            setHash(`connecton.team${t}`)
            setRenderStateLocal({temp: `game.connecton.team`, ob: tm, preserveOb: true});
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
            const rOb = {temp: 'game.connecton', ob: {}, hash: 'connecton'};
            setRenderStateLocal(rOb);
            updateRenderState(rOb);
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
//                console.warn(`no controls defined for ${type}`);
        }
    };
    const getStoredRenderState = () => {
//        console.warn(`call to getStoredRenderState, which is being phased out`)
//        let srs = localStorage.getItem('renderState');
        let srs = getFromStorage('renderState');

        if (srs) {
            if (!srs.preserveOb) {
                srs.ob = player;
            }
            srs.source = 'localStorage';
        };
        return srs;
    };
    const setRenderStateLocal = (ob) => {
//        console.log(`setRenderStateLocal is the ONLY way to store a render state locally`)
        // make renderStateLocal into a duplicate of (not a pointer to) the arg.
        renderStateLocal = typeof(ob) === 'string' ? JSON.parse(ob) : Object.assign({}, ob);
        // 'ob' is player info, no need to store that - unless preserveOb = true
        if (ob) {
            if (!ob.preserveOb) {
                delete renderStateLocal.ob;
            }
        }
        // Only allow storage of correctly defined state data
        if (renderStateLocal.hasOwnProperty('temp')) {
            addToStorage('renderState', renderStateLocal);
//            console.log(`renderState stored with temp ${renderState.temp}`);
        } else {
//            console.warn(`renderState not stored as no 'temp' property found`);
        }
    };
    const updateRenderState = (ob) => {
        if (ob) {
            const deletions = [];
            Object.assign(renderState, ob);
            for (let i in renderState) {
                if (renderState[i] === null) {
                    deletions.push(i);
                    delete renderState[i]
                }
            }
            const show = Object.assign({}, renderState);
            delete renderState.note;
//            console.log(`updateRenderState`, ob)
        }
    };
    const gotoHomeState = () => {
        setRenderStateLocal(homeState);
        homeState.ob = player;
        updateRenderState(homeState);
    };
    const resetScroll = () => {
        $('html, body').animate({
            scrollTop: 0
        }, 300);
    };
    const render = (cb) => {
//        console.log('RENDER');
        // render can accept an optional callback
        // \/ temporary: default to stored state in all cases where it exists
        const srs = getStoredRenderState();
//        console.log(`srs`, srs);
        renderState = srs ? srs : renderState;
//        console.log(`renderState`, renderState);
        if (typeof(renderState) === 'object' && !$.isEmptyObject(renderState)) {
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
                        console.log(`button not clicked, return to home`);
                        gotoHomeState();
                    }
                }
            }
            let rType = null;
            if (renderState.temp) {
                rType = renderState.temp.replace(GAMESTUB, '');
            }
            // delete playersFull from the render object 'game' object, as this causes circularity
            delete rOb.game.playersFull;
//            console.log(`render with (${typeof(renderState)}, ${renderState.hasOwnProperty('length')})`, renderState);
//            console.log(`passing ob`, rOb);
//            console.log(`active`, renderState.active);
//            console.log(`active`, getStoredRenderState().active);
//            console.log(renderStateServer)
//            rOb.temp = 'game.allocation';
//            console.log(`renderState.temp`, renderState.temp);
//            console.log(`rOb`, rOb);
            renderTemplate(targ, renderState.temp, rOb, () => {
                setupControl(rType);
                setHash();
                if (cb) {
//                    console.log(`i do have a callback`)
                    cb();
                } else {
//                    console.log(`I have no callback`)
                }
                if (renderState.hasOwnProperty('sub')) {
//                    console.warn('"sub" functionality removed 20240416')
                } else {

                }
            });
        } else {
//            console.warn('rendering not possible; renderState undefined');
        }
    };
    const onGameEnd = () => {
//        console.log(`onGameEnd`);
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

    socket.on('gameUpdate', (rOb) => {
        const rgame = rOb.hasOwnProperty('game') ? rOb.game : rOb;
        if (rOb.hasOwnProperty('emitType')) {
//            console.log(`emitType: ${rOb.emitType}`);
        }
//        console.log(`game updated: ${getPlayerID()}`)
//        console.log(rgame);
        updateGame(rgame);
        setPlayer(game);
//        updateRenderState({source: 'gameUpdate event', temp: 'game.main', ob: player});
        render();
        activateYourmove();
    });
    socket.on('playerUpdate', (rOb) => {
        const rgame = rOb.hasOwnProperty('game') ? rOb.game : rOb;
        if (rOb.hasOwnProperty('emitType')) {
//            console.log(`emitType: ${rOb.emitType}`);
        }
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
//        console.log(`id me: ${pl}, ${player.id}`);
        if (pl === player.id) {
            identifyPlayer();
        }
    });
    socket.on('gameOver', () => {
//        console.log(`gameOver heard`);
        onGameEnd();
    });
    socket.on('renderPlayer', (rOb) => {
//        console.log(`renderPlayer`)
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
//        console.log(`startRound heard, ob:`, ob);
        onStartRound(ob);
    });
    socket.on('waitForGame', () => {
//        console.log('waitForGame - connected but no game, try again in a minute');
//        window.location.reload();
    });

    renderTemplate = window.renderTemplate;
    procVal = window.procVal;
    //
    const showHomeState = () => {
        console.log(`showHomeState`, homeState);
    };
    window.showHomeState = showHomeState;
    window.showGame = showGame;
    window.showPlayer = showPlayer;
    window.activateYourmove = activateYourmove;
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
