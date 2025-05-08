document.addEventListener('DOMContentLoaded', function() {
//    const socket = io();
    let socket = null;

    let gID = null;
    let lIDStub = null;
    let lID = null;
    let fID = 'fid';
    let now = null;
    let player = null;
    let game = {};
    let renderState = {};
    let renderStateLocal = {};
    let renderStateServer = {};
    let returnRenderState = {};
    let pingCheck = 0;
    let pingState = true;
    const connectionTimer = 500;
    const homeStateObj = {note: 'homeState setting', temp: 'game.main', partialName: 'game-links', ob: player, tempType: 'homeState', sub: null};
    let homeState = JSON.stringify(homeStateObj);
    const qu = window.getQueries(window.location.href);
    const fake = qu.fake === 'true';
    //
    const getStorageID = (id) => {
        let sid = ``;
        if (player) {
            sid = `ls-${player.id}-${id}`;
            return sid;
        } else {
//            console.warn(`cannot get storage ID - player not defined`);
        }
    };
    const clearMyStorage = () => {
        console.log(`clearMyStorage`, lID);
//        console.log(localStorage.getItem(lID));
        localStorage.removeItem(lID);
    }
    const addToStorage = (id, ob) => {
        const stId = getStorageID(id);
//        console.log(`addToStorage`, stId, JSON.stringify(ob));
//        console.log(`addToStorage`, stId, window.clone(ob));
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
        return justGame(game, 'show game');
    };
    const checkWebSocketConnection = () => {
        if (pingState) {
            pingState = false;
        } else {
            console.log('got disconnected');
        }
        socket.emit('ping');
    };

    const estSocket = () => {
//        console.log('############################### est socket');
        socket = io();
        setupSocket();
    };
    const connectCheck = () => {
//        console.log('checking content')
        if ($('#insertion').find('div').length === 1) {
//            console.log('no content rendered, try to establish socket');
            setTimeout(() => {
                estSocket();
                setTimeout(() => {
                    connectCheck();
                }, connectionTimer);
            }, connectionTimer);
        } else {
//            console.log('content rendered');
        }
    };
    setTimeout(() => {
//        console.log('connect socket');
        estSocket();
        setTimeout(() => {
            connectCheck();
        }, connectionTimer);
    }, connectionTimer);


    const checkGameChanges = (rg) => {
        console.log('chechChange', rg.round, game.round)
        if (game.round === `${rg.round}*`) {
            console.log('ROUND COMPLETION DETECTED');
        }
    }
    const updateGame = (ob) => {
//        console.log(`updateGame:`, ob)
        if ($.isEmptyObject(game)) {
            game = ob;
            window.gameShare(game);
        } else {
            game = Object.assign(game, ob);
        }
        isItHere(justGame(game, 'updated game'));
        isItHere(game.playersFull);
        if (player) {
            if (player.hasOwnProperty('index')) {
                if (player.index === 0) {
                    const lg = Object.assign({}, JSON.parse(JSON.stringify(game)));
                    delete lg.persistentData;
                    delete lg.presentation;
                    for (let i in lg.playersFull) {
                        showGame()
                        delete lg.playersFull[i].teamObj;
                    }
                    socket.emit('recordthegame', lg);
                }
            }
        }
    };
    const getFakeID = () => {
        let fid = false;
        let q = getQueries(window.location.href);
        if (q.fake) {
            console.log('FAKE')
        } else {
            console.log('REAL')
        }
    };

    const isItHere = (m) => {
//        console.log(m);
    };

    const registerwithGame = () => {
//        console.log(`reg with game`)
        lID = lIDStub + (qu.fake ? `-${qu[fID]}` : ``);
        let ID = qu.hasOwnProperty(fID) ? qu[fID] : fake ? '': localStorage.getItem(lID);
        const initObj = {game: gID, player: ID, fake: fake, socketID: socket.id};
        window.socketShare(socket);
        socket.emit('registerPlayer', initObj, (ob) => {
//            console.log(ob);
            if (ob) {
//                console.log('yep, ob');
                let res = ob.id;

                // amend for fake players
                if (res.indexOf('f', 0) > -1) {
                    lID = `${lIDStub}-${res}`;
                } else {
                    lID = lIDStub;
                }
//                console.log(`lID: ${lID}`);
                localStorage.setItem(lID, res);

                if (ob.game) {
//                    console.log('yep, game');
                    ob.game = JSON.parse(ob.game);
                    if (ob.game.round) {
                        ob.game.round = justNumber(ob.game.round);
                    }
                    updateGame(ob.game);
//                    console.log(`register with game:`);
//                    console.log(ob.game);
                    setPlayer(ob.game);
//                    setPlayer(game);
                }
                /*
                // Moved up /\
                // amend for fake players
                if (res.indexOf('f', 0) > -1) {
                    lID = `${lIDStub}-${res}`;
                } else {
                    lID = lIDStub;
                }
                console.log(`lID: ${lID}`);
                localStorage.setItem(lID, res);
                */
                if (ob.renderState) {
//                    console.log('yep, renderState')
                    ob.renderState.source = `registerPlayer event`;
                    updateRenderState(ob.renderState);
                    renderStateServer = ob.renderState;
                }
                let hash = window.location.hash;
                if (hash) {
//                    console.log(`yep, hash: ${hash}`);
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
//                console.log('call render')
                render(() => {
//                    console.log('render callback')
                    if (justNumber(game.round) > 0) {
//                        console.log('start a round');
                        onStartRound(game.round);
                    }
                });
                clearInterval(pingCheck);
                pingCheck = setInterval(() => {
                    checkWebSocketConnection();
                }, 2000);
//                console.log('COMPLETE');
            }
        });
    };
    const registerwithGameV1 = () => {
//        getFakeID();
//        lID = `${lIDStub}${qu.fake ? qu[fID] : ''}`;
        lID = lIDStub + (qu.fake ? `-${qu[fID]}` : ``);
//        console.log(qu);
//        console.log(lID);
        let ID = qu.hasOwnProperty(fID) ? qu[fID] : fake ? '': localStorage.getItem(lID);
//        console.log(`ID: ${ID}`);
        const initObj = {game: gID, player: ID, fake: fake, socketID: socket.id};
        window.socketShare(socket);
        socket.emit('registerPlayer', initObj, (ob) => {
//            console.log('regPlayer callback:', ob);
//            console.log(player)
            if (ob) {
                let res = ob.id;
                if (ob.game) {
                    ob.game = JSON.parse(ob.game);
                    if (ob.game.round) {
                        ob.game.round = justNumber(ob.game.round);
                    }
                    updateGame(ob.game);
                    setPlayer(game);
//                    console.log(player)
                }
                // amend for fake players
//                if (res.indexOf('f', 0) > -1 && lID.indexOf(res, 0) === -1) {
                if (res.indexOf('f', 0) > -1) {
//                    lID = lID + res;
                    lID = `${lIDStub}-${res}`;
//                    console.log(`registerwithGame, lID set to ${lID}`);
                } else {
                    lID = lIDStub;
                }
//                console.log(`storing`, lID, res);
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
                clearInterval(pingCheck);
                pingCheck = setInterval(() => {
                    checkWebSocketConnection();
                }, 2000);
            }
        });
    };
    const getPlayerID = () => {
        let id = null;
//        console.log(`getPlayerID`);
//        console.log(`lID: ${lID}`);
//        console.log(`get: ${localStorage.getItem(lID)}`);
        if (localStorage.getItem(lID)) {
            id = localStorage.getItem(lID);
        }
        let ID = qu.hasOwnProperty(fID) ? qu[fID] : fake ? '': id;
        return ID;
    };

    const resetPlayer = () => {
        isItHere(`resetPlayer`);
//        localStorage.clear();
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
//                console.log(`getGames initiates registerwithGame`)
                registerwithGame();
            }
        });
    };
    const onConnect = () => {
        // ping the game controller until some games are available
        now = Date.now();
        getGames();
    };
    const getAddress = () => {
        return window.location.pathname;
    };
    const startContentCheck = () =>{
        setInterval(() => {
            const c = $('#insertion').children(':visible').length === 0;
            if (c) {
                console.log('no content visible')
                socket.emit('playerErrorReport', {player: player, err: 'no page content; force refresh'});
//                debugger;
                window.location.reload();
            }
        }, 2000);
    };
    const playerConnect = (lid) => {
        gID = window.location.pathname;
        lIDStub = `${lid}-${getAddress()}`;
//        lID = lid;
//        lID = `${lid}${getPlayerID()}`;
//        console.log(window.location.search);
//        console.log(`playerConnect receives the iLID stub: ${lid}, creates lIDStub: ${lIDStub}`);
//        console.log(`heidee`, getPlayerID());
        startContentCheck();
        onConnect();
    };
    const getTeam = (fgame) => {
        const id = getPlayerID();
//        console.log(`id`, id);
        const arr = fgame.teams;
//        console.log(`arr`, arr);
        let ti = -1;
        for (let i = 0; i < arr.length; i++) {
//            console.log(' - ', arr[i], id);
            if (arr[i].includes(id)) {
                ti = i;
                break;
            }
        }
        const t = fgame.persistentData.teams[`t${ti}`];
        return t;
    };
    const setPlayer = (fgame) => {
//        console.log(`setPlayer will create the player object:`);
//        console.log(`fgame`, fgame);
        const t = getTeam(fgame);
//        console.log(`t`, t);
        const newPlayer = fgame.playersFull[getPlayerID()];
//        console.log(`newPlayer`, newPlayer);
        if (player) {
//            console.log('player exists');
            if (Boolean(player.teamObj) && Boolean(newPlayer.teamObj)) {
                if (player.teamObj.id !== newPlayer.teamObj.id || player.isLead !== newPlayer.isLead) {
                    window.location.reload();
                }
            }
        } else {
//            console.log('player does not exist');
        }

        player = newPlayer;
//        console.log(player);
//        console.log(newPlayer);
        window.playerShare(player);
    };
    const teamsAssigned = (fgame) => {
//        console.log(`teamsAssigned`);
//        console.log(fgame);
        updateGame(fgame);
        setPlayer(fgame);
        updateRenderState({temp: 'game.main', ob: player, partialName: 'game-links'});
//        isItHere(`teamsAssigned`);
        render();
    };
    const teamsReset = (fgame) => {
        updateGame(fgame);
        updateRenderState({temp: 'game.intro', ob: player});
//        isItHere(`teamsReset`);
        render();
    };
    const showOverlay = (id, ob) => {
//        console.log(`showOverlay`);
        if ($('.overlay')) {
//            console.log(`removed`)
            $('.overlay').remove();
        }
//        console.log($('overlay'));
        window.getTemplate('overlay', {}, (temp) => {
//            console.log(' NEW getTemplate returns:')
//            console.log(temp)
            $('body').append(temp);
//            $('.overlay').remove();
            window.renderTemplate('overlay', id, ob, () => {
//                $('.overlay').fadeIn(300).delay(2000).fadeOut(1000);
//                console.log(id);
//                console.log(ob);
                $('.overlay').fadeIn(300);
            });
        })
//        $('body').append(window.getTemplate('overlay', {}, (temp) => {
////            window.renderTemplate('overlay', id, ob, () => {
////
////            });
//        }));
    };
    const identifyPlayer = () => {
//        console.log(`id player ${getPlayerID()}`);
        const idOb = {id: getPlayerID(), sock: 'null', stored: 'null', teamID: 'null', team: 'null'};
        if (socket) {
            idOb.sock = socket.id;
        };
        if (player) {
            idOb.stored = player.socketID;
            if (Boolean(player.teamObj)) {
                idOb.teamID= player.teamObj.id;
                idOb.team = player.teamObj.title;
            }
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
//                        isItHere(`activateYourmoveButton`);
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
//                                    isItHere(`activateYourmove`);
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
    };
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
    };
    const onStartRound = async (ob) => {
//        console.log(`onStartRound`, ob);
        if (player) {
            const trs = await thisRoundScored(player);
            if (ob.game) {
                updateGame(ob.game);
            }
            //    \/ two different possible arg types - not ideal, but a quick type check fixes it.
            const r = justNumber(typeof(ob) === 'object' ? ob.val : ob);
            round = game.persistentData.rounds[r];
            if (r === -1) {
                updateRenderState({temp: 'game.main', partialName: 'game-links'});
                render();
            }
            if (round) {
                if (round.type === player.teamObj.type) {
//                    console.log('yes, I will activate your move');
                    activateYourmove();
                }
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
//            console.log('go home', JSON.parse(homeState));
            if (typeof(homeState) === 'string') {
                homeState = JSON.parse(homeState);
            }
            console.log('go home', homeState);
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
//        console.log(`setupMainControl`);
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
        setupHomeButton();
//        const a = $('a');
        const a = $('.team-link');
        a.off('click').on('click', function () {
//            console.clear();
            const t = $(this).attr('id').split('_')[1];
            const tm = Object.assign({}, game.persistentData.teams[`t${t}`]);
            tm.game = {};
            delete tm.game;
//            console.log(`yep`, tm);
            setHash(`connecton.team${t}`);
            const sob = {temp: `game.connecton.team`, ob: tm, preserveOb: true};
//            console.log(`setupConnectonControl sends:`, window.clone(sob));
            setRenderStateLocal(sob);
            // 20250507 Why was the line below included? It caused a render error...
//            updateRenderState({temp: `game.connecton.team`, ob: tm});
            render(() => {
                console.log(`ok, we can set up the button now`)
            });
        })
    };
    const setupConnectonControlV1 = () => {
        console.log(`setupConnectonControl`);
        setupHomeButton();
//        const a = $('a');
        const a = $('.team-link');
        a.off('click').on('click', function () {
            const t = $(this).attr('id').split('_')[1];
            const tm = Object.assign({}, game.persistentData.teams[`t${t}`]);
            tm.game = {};
            delete tm.game;
            console.log(`yep`, tm);
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
            case 'collaboration':
                window.setupCollaborationControl();
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
//        console.log(`******************** setRenderStateLocal hears:`, window.clone(ob));
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
//            addToStorage('renderState', renderStateLocal);
            addToStorage('renderState', window.clone(renderStateLocal));
//            console.log(`renderState stored with temp ${renderState.temp}`, window.clone(renderStateLocal));
        } else {
            console.warn(`renderState not stored as no 'temp' property found`);
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
//            console.log(`updateRenderState`, ob);
//            console.log(`renderState`, renderState);
//            console.log(`renderState`, typeof(renderState));
            if (typeof(renderState) === 'string') {
//                console.log(`can't be a string, convert to Ob if JSON`);
//                const amI = JSON.parse(renderState);
//                console.log(amI);
            }
            delete renderState.note;
            setRenderStateLocal(renderState);
        }
    };
    const gotoHomeState = () => {
        setRenderStateLocal(homeState);
//        if (window.isValidJSON(homeState))
        console.log(homeState)
        console.log(typeof(homeState))
        if (typeof(homeState) !== 'object') {
            homeState = JSON.parse(homeState);
        }
        homeState.ob = player;
//        console.log('homeState', typeof(homeState), isValidJSON(homeState), homeState);
//        const j = JSON.parse(homeState);
//        console.log(j);
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
//        console.log(renderState === srs);
//        console.log(srs);
        renderState = srs ? srs : renderState;
//        console.log(renderState);
        if (typeof(renderState) === 'object' && !$.isEmptyObject(renderState)) {
            const GAMESTUB = `game.`;
            const targ = renderState.hasOwnProperty('targ') ? renderState.targ : 'insertion';
            const rOb = renderState.hasOwnProperty('ob') && renderState.ob !== undefined ? renderState.ob : {};
            rOb.game = game;
            if (!player) {
//                console.log('OH NO, NO PLAYER');
                return;
            } else {
//                console.log('we have a player');
            }
            if (Boolean(player.teamObj)) {
                rOb.renderButton = !player.teamObj.hasLead || (player.teamObj.hasLead && Boolean(player.isLead));
            }
            if (renderState.hasOwnProperty('partialName')) {
                rOb.partialName = renderState.partialName;
            }
            if (renderState.tempType) {
                if (renderState.tempType === 'interaction') {
                    // interactions must be 'activated' for their templates to be rendered, otherwise the home template should be rendered (with trigger button enabled)
                    if (getRoundState()) {
                    } else {
                        gotoHomeState();
                    }
                }
            }
            let rType = null;
            const fsp = window.filterScorePackets;
            const gSPs = game.detailedScorePackets;
            rOb.dynamicTeamData = createDynamicTeamData();
            if (Boolean(player.teamObj)) {
                rOb.myDynamicTeamData = rOb.dynamicTeamData[player.teamObj.id]
            }
            if (player.teamObj) {
                rOb.dynamicSubTeamData = [];
                rOb.game.persistentData.secondaryTeams.forEach((t, i) => {
                    rOb.dynamicSubTeamData = rOb.dynamicSubTeamData.concat(rOb.game.teams[t.id]);
                });
                rOb.scoresOut = fsp(gSPs, 'src', player.teamObj.id);
                rOb.scoresOut1 = fsp(rOb.scoresOut, 'round', 1)[0];
                rOb.scoresOut3 = fsp(rOb.scoresOut, 'round', 3);
                rOb.scoresOut3All = [];
                game.persistentData.mainTeams.forEach((t, i) => {
                    const s = rOb.scoresOut3.filter(sp => sp.dest === t.id)[0];
                    rOb.scoresOut3All[i] = Object.assign({val: s ? s.val : 0}, t);
                });
                const rsp = window.filterScorePackets(game.detailedScorePackets, 'round', game.round);
                rOb.dynamicSubTeamData.forEach((t, i) => {
                    const prsp = window.filterScorePackets(rsp, 'client', justNumber(t)).map(sp => sp.val);
                    rOb.dynamicSubTeamData[i] = {id: t, votes: prsp};
                });
                rOb.myDynamicSubTeamData = rOb.dynamicSubTeamData.filter(td => td.id === player.id)[0];
            }

            if (renderState.temp) {
                rType = renderState.temp.replace(GAMESTUB, '');
            }
            // delete playersFull from the render object 'game' object, as this causes circularity
            delete rOb.game.playersFull;
//            console.log('RENDER', renderState);
            rOb.headlines = rOb.game.persistentData.headlines.slice(0);
            rOb.showHeadlines = justNumber(game.slide) > 4;

//            console.log(`do I know the round? ${game.round} (${typeof(game.round)})`);
//            console.log(`rendering ${renderState.temp} with rOb.showHeadlines: ${rOb.showHeadlines}, slide: ${game.slide}`);
//            console.log(`renderTemplate`, targ, renderState.temp, rOb);
            renderTemplate(targ, renderState.temp, rOb, () => {
                setupControl(rType);
                setHash();
                if (cb) {
                    cb();
                }
            });
        } else {
//            console.warn('rendering not possible; renderState undefined');
        }
    };
    const onGameEnd = () => {
        isItHere(`onGameEnd`);
        localStorage.clear();
//        renderState = {temp: 'game.gameover', ob: {}};
        updateRenderState({temp: 'game.gameover', ob: {}});
        render();
    };
    const onGameUpdate = (rOb) => {
//        console.log(`onGameUpdate`, rOb);
        const rgame = rOb.hasOwnProperty('game') ? rOb.game : rOb;
        let go = Boolean(player);
//        console.log(`go: ${go}`);
        if (rOb.hasOwnProperty('_updateSource')) {
            if (rOb._updateSource.hasOwnProperty('event')) {
                if (player) {
                    const us = rOb._updateSource;
                    const ev = us.event.split(' ')[1].toLowerCase();
//                    console.log(`ev: ${ev}`);
//                    checkGameChanges(rgame);
                    switch (ev) {
                        case 'playerconnectevent':
                            // playerConnectEvents are client-specfic; only render self
                            go = player.socketID === us.playerID;
                            break;
                        case 'registerplayer':
                            // registerPlayer is client-specfic; only render self
                            go = player.id === us.playerID;
                            break;
                        case 'scoresubmitted':
                            // \/ No need, specific client is updated via specific method
                            go = false;
                            break;
                        case 'scoreforaveragesubmitted':
                            go = us.src.player === player.id;
                            break;
                        case 'presentationaction':
                            go = false;
                            break;
                        case 'startround':
//                            window.location.reload();
                            if (renderState.temp !== 'game.main' && rgame.persistentData.rounds[rgame.round].type !== player.teamObj.type) {
                                // not in the home state and not involved in this round - go home
                                gotoHomeState();
                                render();
                            } else {
//                                console.log('%cno need to update me in this round', 'background-color: black; color: green;');
                            }
                            go = false;
                            break;
                        case 'endround':
                            break;
                        default:
                            go = false;
                    }
                }
            } else {
//                console.log(`but there is no event - so we go anyway!`);
            }
        } else {
//            console.log('no _updateSource');
        }
        if (go) {
            const back = objectSnapshot(rgame);
            updateGame(rgame);
//            console.log(`onGameUpdate`);
            setPlayer(game);
            render();
            activateYourmove();
        } else {
//            console.log('game update - do NOT render this client');
            // just update the game, don't render.
            updateGame(rgame);
        }
    };
    const forceUpdate = () => {
//        console.log(`I will force an update`);
        const idOb = {game: game, playerID: player.id};
//        console.log('yep');
        socket.emit('getRenderState', idOb, (rs) => {
//            console.log('returned state', rs);
            updateGame(rs.theGame);
            updateRenderState(rs);
            render();
        });
    };

    const objectSnapshot = (o) => {
        return JSON.parse(JSON.stringify(o));
    };
    const justGame = (g, id) => {
        const exc = ['updateSource'];
        const rg = Object.fromEntries(
            Object.entries(g).filter(([key]) => !exc.includes(key))
        );
        rg._id = id;
        const srg = sortObject(rg);
        return srg;
    }
    const sortObject = (o) => {
        const so = Object.fromEntries(
            Object.entries(o).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        );
        return so;
    };

    const onRemoval = (ob) => {
        // This is serious, better do some serious checking:
        const isGame = ob.game === game.address;
        const isSocket = ob.sock === player.socketID;
        const isPlayer = ob.player === player.id;
        const isDef = isGame && isSocket && isPlayer;
        console.log(isGame, isSocket, isPlayer, isDef);
        if (isDef) {
            clearMyStorage();
            updateRenderState({temp: ob.temp});
            isItHere(`onRemoval`);
            render();
        }
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
    const setupSocket = () => {
    socket.on('gameUpdate', (rOb) => {
//        console.log('socket hears gameUpdate');
//        console.log(rOb);
//        console.log(rOb._updateSource);
        onGameUpdate(rOb);
    });
    socket.on('playerUpdate', (rOb) => {
        const rgame = rOb.hasOwnProperty('game') ? rOb.game : rOb;
//        console.log('playerUpdate:', rgame);
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
    socket.on('teamsAssigned', (rgame) => {
//        console.log('the event')
        teamsAssigned(rgame);
    });
    socket.on('teamsReset', (rgame) => {
//        console.log('the event')
        teamsReset(rgame);
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
//        isItHere(`renderPlayer`)
//        isItHere(rOb)
        console.log(`renderPlayer`)
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
    });
    socket.on('playerRemoved', (ob) => {
        onRemoval(ob);
    });
    socket.on('pong', () => {
//        console.log('ponged');
        pingState = true;
    });
    }
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
    window.forceUpdate = forceUpdate;
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
