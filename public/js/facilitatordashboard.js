document.addEventListener('DOMContentLoaded', function() {

    const getSessionID = () => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === 'sessionID') {
                return decodeURIComponent(cookieValue);
            }
        }
        return null;
    };
    const socket = io('', {
        query: {
            role: 'facilitator',
            type: 'dashboard',
            id: getSessionID()
//            session: session
        }
    });
    const clientData = {role: 'facilitator'};

    // logFeed is an array of messages to be revealed to the client
    const logFeed = [];
    const logFeedArchive = [];
//    console.log(`null the session`);
    let session = null;
    let game = null;
    let gameSeekTimeout = null;
    let renderDelay = 0;
    let renderTimeout = null;

    const playerSortOrder = {prop: null, dir: true, timeout: -1};
    const SLIDESHOW_CONTROL = 'facilitator-slideshow-controls';
    const gameState = {disconnected: [], timeout: -1};
    const DEFAULT_TAB = `facilitate`;
    const messages = {
        RESET_WARN: 'Are you sure? This will reset all game progress, and any connected players will need to rejoin.',
        RESET_DONE: `The game has been reset. Any connected players will need to refresh their browser to rejoin.`,
        END_WARN: `Ending the game cannot be undone, please enter your password to continue.`,
        SESSION_WARN: `Continuing will reset the session, remove all players and mark this game as 'pending'. Are you sure you want to do this?`,
        SESSION_DONE: `The session has been reset.`,
        NORESET: 'Cannot reset teams once scores have been submitted',
        noStart: {
            started: `The game has already started.`,
            ended: `Cannot start game, this session has already concluded.`
        }
    };

    socket.on('checkOnConnection', () => {
//        console.log('connected one way or another, find out if there is a game on, game:');
//        console.log('no hang on, I will erase the game and start again regardless');
        game = null;
//        console.log(game);
        addToLogFeed('connected to app');
        sockInit();
    });
    const getStoragePrefix = () => {
        const sp = `facilitator-${game.uniqueID}sid-`;
        return sp;
    };
    const showImportantLog = (log) => {
        const mw = $('#facilitateMessage');
        if (mw) {
            mw.html(`<p>${log.msg}</p>`);
            setTimeout(() => {
                return;
//                mw.find('span').fadeOut(1000, () => {
//                    mw.html('')
//                });
            }, 5000);
        }
    };
    const clearMessage = () => {
        const mw = $('#facilitateMessage');
        if (mw) {
            mw.html('')
        }
    };
    const addToLogFeed = (msg, important) => {
        const log = {id: logFeed.length, msg: msg, important: important === undefined ? false : true};

        logFeed.push(`${logFeed.length + 1}: ${msg}`);
        logFeedArchive.push(`${logFeed.length + 1}: ${msg}`);
        renderLogFeed();
        if (important) {
            showImportantLog(log);
        }
    };
    const renderLogFeed = () => {
        const lf = $('#logFeed');
        if (!lf.is(':visible')) {
            setTimeout(() => {
                lf.show();
            }, 200);
        }
        window.renderTemplate('logFeed', 'facilitatorLogFeed', logFeed);
    };
    const clearLogFeed = () => {
        logFeed.splice(0, logFeed.length);
        renderLogFeed();
    };

    const clearAdvancedLocalStorage = () => {
        let ls = localStorage;
        const kill = ['votes', 'collabs', 'renderState', 'roundState'];
        Object.keys(ls).forEach(i => {
            const toKill = kill.some(t => i.includes(t));
            if (toKill) {
                localStorage.removeItem(i);
            }
        });
        ls = localStorage;
    };
    const resetSession = (cb) => {
//        const w1 = confirm('Are you sure you want to reset the session?');
        const w = true;
        if (w) {
            socket.emit('resetSession', session.uniqueID, (rtn) => {
//                console.log(`resetSession`, rtn);
                if (typeof(rtn) === 'string') {
//                    alert(rtn);
//                    console.log('resetter')
                } else {
                    const rgame = rtn.game;
                    debugger;
                    updateGame(rgame);
                    debugger;
                    session = rtn.session;
                    debugger;
                    localStorage.clear();
                    debugger;
//                    renderSession();
                    openTab(DEFAULT_TAB);
                    if (cb) {
                        cb();
                    }
                }
                localStorage.clear();
                window.location.reload();
            });
        }
    };
    const startGame = () => {
        addToLogFeed('start new game');
//        console.log(`start new game: ${session.state}`);
        if (session.state === 'pending') {
            socket.emit('preparePresentation', {sessionID: session.uniqueID, type: session.type});
            socket.emit('startGame', JSON.stringify(session), (rgame) => {
//                game = rgame;
//                console.log(`startGame callback, rgame:`, rgame);
                updateGame(rgame);
                addToLogFeed('game ready');
                getSession(game.uniqueID, () => {
    //                console.log('game cb');
                });
                renderGame();
//                openTab('game');
                openTab('facilitate');
            });
        } else {
            alert(messages.noStart[session.state]);
        }
    };
    const emitRestoreGame = () => {
        socket.emit('restoreGame', JSON.stringify(session), (rgame) => {
            // Extra check to ensure game is not updated unnecessarily
            if (game === null) {
//                console.log('I SHOULD ONLY HAPPEN ONCE');
                clearTimeout(gameSeekTimeout);
                addToLogFeed('game restore complete - game can recommence');
                updateGame(rgame);
                renderGame();
            }
        });
    };
    const restoreGame = () => {
        // restoreGame must complete successfully for the game to be reestablished
        // This method will repeat until game is established
//        console.log(`restoreGame, game === null? ${game === null}`);
        if (game === null) {
            emitRestoreGame();
            clearTimeout(gameSeekTimeout);
            gameSeekTimeout = setTimeout(restoreGame, 200);
        }
    };
    const onGameRestored = (gOb) => {
//        console.log(`game restored!`);
//        console.log(game);
//        console.log(gOb);
    };
    const endGame = (cb) => {
        /*
        socket.emit('endGame', game, (rgame) => {
            //returns modified game, render this
//            game = rgame;
            updateGame(rgame);
            renderGame();
        });
        return;
        */
        // NOTE Use below in deployment
        let sure = window.prompt(messages.END_WARN);
        if (sure) {
            socket.emit('testPassword', {session: session.uniqueID, pw: sure}, (boo) => {
                if (boo) {
                    console.log(`OK to end`);
                    socket.emit('endGame', game, (rgame) => {
                        //returns modified game, render this
//                        game = rgame;
                        updateGame(rgame);
                        renderGame();
                        openTab(DEFAULT_TAB);
                        if (cb) {
                            cb();
                        }
                    });
                } else {
                    alert('Incorrect password')
                }
            });
        }

    };
    const resetGame = (cb) => {
        let go = window.confirm(messages.RESET_WARN);
        if (go) {
            const id = game.uniqueID;
            addToLogFeed(`resetting game ${id}`);
            socket.emit('resetGame', id, (rs) => {
                session = rs;
                openTab(DEFAULT_TAB);
                renderSession();
                renderGame(true);
                if (cb) {
                    cb();
                }
                clearAdvancedLocalStorage();
                window.location.reload();
            });
        }
    };
    const updateGame = (ngame) => {
        // Method to use any time the game is updated (i.e never use "game = ...")
//        console.log(`let's update the game:`);
//        console.log(`old`, JSON.parse(JSON.stringify(game)));
//        console.log(`new`, JSON.parse(JSON.stringify(ngame)));
        if (game) {
            Object.assign(game, ngame);
        } else {
            game = Object.assign({}, ngame);
            window.gameShare(game);
            // \/ optional method; listens for change to game object (use in dev only)
//            setupWatch(game, handleChange);
        }
//        console.log(`let's update the game:`, JSON.parse(JSON.stringify(game)).teams);
    };
    const onScoreChange = (diff) => {
        console.log(`score change detected:`);

        if (diff.length > 1) {
            console.warn(`multiple score changes detected - should not be possible, check code`);
        }
        const sc = diff.map(unpackScore)[0];
        window.findRoundTrigger(sc.round);
        renderScoreboard();
//        socket.emit('scoreUpdate', {address: game.address, sp: sc});
    };
    const onGameUpdate = (g) => {
//        console.log(`###############################################`);
//        console.log(`gameUpdate:`, g);
//        console.log(g._updateSource);
        const pv = procVal;
        let comp = 'playersFull';
        // cg will be an array of updated values, precluding any changes to props containing 'warning'
        const cg = compareGames(g, comp);
        // scoreDiff will be an array of any scores that have changed in this update
        const scoreDiff = compareScores(g.scores);
        if (scoreDiff.length > 0) {
            onScoreChange(scoreDiff);
        }
        if (g.round.toString().includes('*')) {
//            alert(`round complete!]`);
            addToLogFeed(`round ${game.round} complete`);
        }
        if (g.hasOwnProperty('_updateSource')) {
            if (g._updateSource.hasOwnProperty('event')) {
                const us = g._updateSource;
                const ev = us.event.split(' ')[1].toLowerCase();
                let col = 'white';
                switch (ev) {
                    case 'scoresubmitted':
                        col = 'red';
                        break;
                    case 'scoreforaveragesubmitted':
                        col = 'red';
                        break;
                    case 'endround':
                        col = 'green';
                        break;
                    default:
                        col = 'white';
                }
//                console.log(`update event: %c${ev}`, `color: ${col};`)
            }

        };
        if (cg) {
            const cgf = cg.filter(str => !str.includes('warning'));
            const displayedProperty = Boolean(cgf.slice(0).indexOf('socketID', 0) === -1);
//            console.log(`cgf`, cgf);
            if (pv(g.uniqueID) === pv(getSessionID())) {
                addToLogFeed('gameUpdate');
                updateGame(g);
                if (displayedProperty) {
                    setupTab(getCurrentTab().title);
                }
                // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> need a better approach to line below - player lists will be updated on any/all game updates
                // 20240701 added a delay to avoid multiple renders on app restart. Consider removing this in production.
                clearTimeout(renderDelay);
                renderDelay = setTimeout(() => {
                    renderPlayers('facilitatePlayersContent');
                    updatePlayerMeter();
                    updateRoundDisplay();
                    renderAdvanced();
//                    console.log('the render')
                }, 300);
//                refreshAllWidgets();
                if ($('#roundcompleter').length > 0) {
                    if ($('#roundcompleter').is(':visible')) {
                        closeModal();
                        showRoundCompleter();
                    }
                }
            }
        } else {
            console.warn(`gameUpdate has not completed due to a failure at compareGames method`);
        }
    };
    const launchPresentation = () => {

//         console.log(`/presentation#${game.address.replace('/', '')}`, '_blank');
         window.open(`/presentation#${game.address.replace('/', '')}`, '_blank');
    };
    const launchFakeGenerator = () => {
//        console.log(game);
        window.open(`/fakegenerator#${game.address}`, '_blank');
    };
    const setupTeamsLinks = () => {
        const tl = $('#contentTeams').find('.link');
//        console.log(tl);
        tl.off('click');
        tl.on('click', function () {
//            console.log($(this).attr('id'))
            socket.emit('identifyPlayer', {game: game, player: $(this).attr('id').split('_')[2]})
        });
    };
    const sortListConnected = (a, b) => {
        if (a.connected && !b.connected) {
            return playerSortOrder.dir ? -1 : 1;
        } else if (!a.connected && b.connected) {
            return playerSortOrder.dir ? 1 : -1;
        } else {
            return 0;
        }
    };
    const sortListisLead = (a, b) => {
        if (a.isLead && !b.isLead) {
            return playerSortOrder.dir ? -1 : 1;
        } else if (!a.islead && b.isLead) {
            return playerSortOrder.dir ? 1 : -1;
        } else {
            return 0;
        }
    };
    const sortListIndex = (a, b) => {
        const aID = parseInt(a.index);
        const bID = parseInt(b.index);
        if (aID === undefined || bID === undefined) {
            return 0;
        }
        if (aID < bID) {
            return playerSortOrder.dir ? -1 : 1;
        } else if (aID > bID) {
            return playerSortOrder.dir ? 1 : -1;
        } else {
            return 0;
        }
    };
    const sortListID = (a, b) => {
        const aID = parseInt(a.id.replace(/pf/g, ''));
        const bID = parseInt(b.id.replace(/pf/g, ''));
        if (aID === undefined || bID === undefined) {
            return 0;
        }
        if (aID < bID) {
            return playerSortOrder.dir ? -1 : 1;
        } else if (aID > bID) {
            return playerSortOrder.dir ? 1 : -1;
        } else {
            return 0;
        }
    };
    const sortListTeam = (a, b) => {
        const aT = a.teamObj;
        const bT = b.teamObj;
        if (aT === undefined || bT === undefined) {
            return 0;
        }
        const aID = aT.title;
        const bID = bT.title;
        if (aID === undefined || bID === undefined) {
            return 0;
        }
        if (aID < bID) {
            return playerSortOrder.dir ? -1 : 1;
        } else if (aID > bID) {
            return playerSortOrder.dir ? 1 : -1;
        } else {
            return 0;
        }
    };
    const restoreWidgets = () => {
        const w = Object.keys({ ...localStorage }).filter(i => i.includes('wid'));
        // Can't do it - widgets are launched by various methods which pass data, would have to locate/build data and find the method to launch widgets
//        console.log(w);
        if (w) {
            w.forEach(id => {
                const o = JSON.parse(localStorage.getItem(id));
                if (o.hasOwnProperty('launchMethod')) {
//                    console.log(this);
//                    console.log(o.launchMethod, typeof(this[o.launchMethod]) === 'function', typeof(this['launchAdvanced']) === 'function');
                }
            });
        }
    };
    const removeWidget = (w) => {
        w.remove();
    };
    const removeThisWidget = (w) => {
//        console.log(w);
        const wid = w.closest('.widget').attr('id');
//        console.log(wid);
        removeWidget($(`#${wid}`));
    };
    const removeAllWidgets = () => {
        const w = $('#overlay').find('.widget');
        w.each((i, wd) => {
            $(wd).remove();
        });
    };
    const refreshAllWidgets = () => {
        const w = $('#overlay').find('.widget');
        w.each((i, wd) => {
            console.log($(wd).attr('id'));
//            $(wd).remove();
//            add
        });
    };
    const updateWidgetInfo = (id, ob) => {
//        console.log(id, ob);
        let po = {}
        let stored = localStorage.getItem(id);
        if (stored) {
            po = JSON.parse(stored);
        }
        po = Object.assign(po, ob);

//        console.log(id, po);
        localStorage.setItem(id, JSON.stringify(po));
    };
    const addWidget = (id, ob, cb) => {
        const wid = `#${id}`;
        const wd = $(wid);
        const widID = `wid-${game.uniqueID}${wid}`;
        const rOb = {
            x: ob.x ? ob.x : 0,
            y: ob.y ? ob.y : 0,
            w: ob.w ? ob.w : 0,
            h: ob.h ? ob.h : 0
        };
//        console.log(ob);
        if (wd.length === 0) {
            // (can't use 'w' in here because this block runs only when 'w' does not exist)
            $(`#overlay`).append(`<div class="widget" id="${id}"></div>`);
            let stOb = localStorage.getItem(widID);
            if (stOb) {
                Object.assign(rOb, JSON.parse(stOb));
            }
            let tOb = {id: id, partialName: id};
            if (ob.hasOwnProperty('data')) {
                tOb = Object.assign(tOb, ob.data);
            }
//            console.log(`addWidget`, tOb);
            const temp = ob.data.preventTemplate ? 'facilitator.widget.nopartial' : 'facilitator.widget';
//            console.log((rOb.x + rOb.w), window.innerWidth, (rOb.x + rOb.w) > window.innerWidth);
            rOb.x = (rOb.w + rOb.x) > window.innerWidth ? window.innerWidth - rOb.w - 40 : rOb.x;
            rOb.y = (rOb.h + rOb.y) > window.innerHeight ? window.innerHeight - rOb.h - 40 : rOb.y;
            const stD = {open: true};
            if (ob.hasOwnProperty('data')) {
                if (ob.data.hasOwnProperty('launchMethod')) {
                    stD.launchMethod = ob.data.launchMethod;
                }
            }
            updateWidgetInfo(widID, stD);
            renderTemplate(id, temp, tOb, () => {
                $(wid).css({left: `${rOb.x}px`, top: `${rOb.y}px`, width: `${rOb.w}px`, height: `${rOb.h}px`});
                const strOb = {x: rOb.x, y: rOb.y};
                const widbody = $(wid).find('#widgetouter');
                const widbar = $(wid).find('#widgethandle');
                const widclose = $(wid).find('#widgethandle').find('.widgetclose');
                widbody.css({width: `100%`, height: '100%'});
                widclose.off('click').on('click', function () {
                    updateWidgetInfo(widID, {open: false});
                    removeWidget($(wid));
                })
                $(wid).draggable({
                    handle: widbar,
                    containment: 'window',
                    stop: function () {
                        const pOb = {x: $(this).position().left, y: $(this).position().top};
//                        localStorage.setItem(widID, JSON.stringify(pOb));
                        updateWidgetInfo(widID, pOb);
                    }
                });
                if (cb) {
                    cb($(wid));
                }
            });
        }
    };
    const previewTeams = async () => {
        const assOb = {address: game.address, type: 'order', preview: true};
        const canComplete = false;
        socket.emit('assignTeams', assOb, (rgame) => {
//            console.log(`previewTeams callback`)
//            console.log(rgame);
            if (typeof(rgame) === 'string') {
//                alert(rgame);
            } else {
                const tms = rgame.persistentData.teams;
                const tm = rgame.teams;
                let str = 'Team breakdown Preview:\n';
                tm.forEach((t, i) => {
                    str += `${tms['t' + i].title}:  ${t.join(', ')} (${t.length} player${t.length === 1 ? '' : 's'})\n`;
                });
                canComplete = true;
            }
//            console.log(`canComplete ${canComplete}`);
            return canComplete;
        });
    };
    const setTeamSize = () => {
        const gameID = `game-${game.uniqueID}`;
        const n = parseInt($('#teamInput').val());
        socket.emit('setTeamSize', { gameID, n }, (rgame) => {
            onGameUpdate(rgame);
        })
    };
    const assignTeams = (force) => {
        console.log('assignTeams')
        const assOb = {address: game.address, type: 'order', preview: false};
        let rtn = false;
        if (force) {
            assOb.force = true;
        }
        if (game.teams.length === 0) {
            socket.emit('assignTeams', assOb, (rgame) => {
                if (typeof(rgame) === 'string') {
                    addToLogFeed(rgame, true);
                } else {
                    addToLogFeed('teams successfully assigned', true);
                    onGameUpdate(rgame);
                    highlightTab('teams');
//                    renderSlidelist(rgame);
                    rtn = true;
                }
            });
        } else {
            addToLogFeed(`teams already assigned`, true);
        }
        return rtn;
    };
    window.assignTeams = assignTeams;
    const resetTeams = () => {
//        console.log(`resetTeams: ${game.scores.length}`);
        if (game.scores.length === 0) {
            socket.emit('resetTeams', {address: game.address}, (rgame) => {
                addToLogFeed('teams reset');
                onGameUpdate(rgame);
//                console.log(`resetTeams`)
//                console.log(rgame)
            });
        } else {
            alert(messages.NORESET);
        }
    };
    const identifyPlayers = () => {
//        console.log('identifyPlayers');
        socket.emit('identifyPlayers', game);
    };
    const signOut = () => {
        const go = confirm('Are you sure you want to sign out of this session?');
        if (go) {
            document.cookie.split(';').forEach(c => {
                const eqPos = c.indexOf('=');
                const name = eqPos > -1 ? c.substring(0, eqPos) : c;
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
            });
            window.location.replace('facilitatorlogin');
        }
    };

    const setupTab = (arg) => {
//        console.log(`setupTab`);
        const alwaysUpdate = ['players', 'scores', 'game', 'session'];
        const neverStatic = alwaysUpdate.indexOf(arg, 0) > -1;
        // Try running only if the tab has changed:
        if ($(`#content${window.toCamelCase(arg)}`).children().length === 0 || neverStatic) {
            switch (arg) {
            case 'session':
                renderSession();
                setupSessionLinks();
                break;
            case 'game':
                renderGame();
                setupGameLinks();
                break;
            case 'controls':
                renderControls();
                break;
            case 'facilitate':
                renderFacilitate();
                break;
            case 'players':
                renderPlayers('contentPlayers');
                break;
            case 'teams':
                renderTeams();
                break;
            case 'scores':
                renderScores();
                renderScores2();
                break;
            default:
                console.log(`setupTab: invalid argument provided.`);
            }
        }

    };
    const setupTabLinks = () => {
        // enable/disable top level tab links depending on game condition
        const gameOn = session.state === 'started';
        const gTab = $('#linkGame');
        const cTab = $('#linkControls');
        const fTab = $('#linkFacilitate');
        const sTab = $('#linkScores');
        gTab.prop('disabled', !gameOn);
        cTab.prop('disabled', !gameOn);
//        fTab.prop('disabled', !gameOn);
        sTab.prop('disabled', !gameOn);
    };
    const highlightTab = (t) => {
        const id = `#link${toCamelCase(t)}`;
        const tab = $(id);
//        console.log(id, tab);
        const colin = tab.css('color');
        const hlColour = 'red';
        const del = 100;
        const timer = 500;
//        console.log(colin);
//        tab;
        tab.css({color: hlColour, 'background-color': 'yellow'})
            .delay(del)
            .animate({color: colin, 'background-color': 'transparent'}, timer)
            .animate({color: hlColour, 'background-color': 'yellow'}, 10)
            .delay(del)
            .animate({color: colin, 'background-color': 'transparent'}, timer)
            .animate({color: hlColour, 'background-color': 'yellow'}, 10)
            .delay(del)
            .animate({color: colin, 'background-color': 'transparent'}, timer);
    };
    const getCurrentTab = () => {
        // return object representing currently open tab {el: <jQuery element>, title: <title>}
        const t = $('.tabcontent:visible');
        const ob = {title: 'noTab'};
        if (t.length > 0) {
            ob.el = t;
            ob.title = t.attr('id').replace('tab', '').toLowerCase();
        }
        return ob;
    };
    const setupBaseLinks = () => {
        // adding a timeout because some elements don't appear to be present at init (for some weird reason)
        setTimeout(() => {
            let cl = $('#clearLog');
            let tl = $('.tablinks');
            cl.off('click');
            tl.off('click');
            cl.on('click', () => {
                clearLogFeed();
            });
            tl.on('click', function () {
                removeAllWidgets();
                openTab($(this).attr('id').replace('link', ''));
            });
//            const t = window.location.hash ? window.location.hash.replace('#', '') : DEFAULT_TAB;
            const t = DEFAULT_TAB;
            setupTabLinks();
            openTab(t);
        }, 500);
    };
    const setupSessionLinks = () => {
//        console.log('setupSessionLinks');
        addToLogFeed('setupSessionLinks');
        let sg = $('#gameStart');
        let sr = $('#sessionReset');
        let gl = $('#gameLaunch');
        $('.link').off('click');
        sg.on('click', startGame);
        sr.on('click', resetSession);
        if (session.state !== 'started') {
            gl.addClass('disabled');
            if (document.getElementById('gameLaunch')) {
                document.getElementById('gameLaunch').addEventListener('click', (ev) => {
                    ev.preventDefault();
                });
            }
        }
    };
    const setupGameLinks = () => {
        if (game) {
            if (game.state === 'started') {
                const ids = ['#gameReset', '#makeFakes', '#gameEnd', '#makePres'];
                ids.forEach(id => {
                    const element = $(id);
                    element.off('click').on('click', () => {
                        switch (id) {
                            case '#gameReset':
                                resetGame();
                                break;
                            case '#makeFakes':
                                launchFakeGenerator();
                                break;
                            case '#makePres':
                                launchPresentation();
                                break;
                            case '#gameEnd':
                                endGame();
                                break;
                        }
                    });
                });
            }
        }


    };
    const setupControlLinks = () => {
        const ids = ['#preview', '#resize', '#assign', '#reset', '#identify', '#startRound', '#completeRound', '#checkRound', '#slideshow', '#setName', '#clearConsole', '#presInfo', '#downloadRes', '#signOut'];
        const rSel = $('#contentControls').find('.buttonSet').find('button');
        const rVal = $('#roundInput');
        ids.forEach(id => {
            const element = $(id);
            element.off('click').on('click', () => {
                const r = parseInt($('#roundInput').val());
                switch (id) {
                    case '#setName':
                        const sn = $('#nameInput').val();
                        if (sn) {
                            socket.emit('sessionNameChange', {gameID: game.uniqueID, name: sn});
                        } else {
                            alert('no name provided')
                        }
//                        setSessionName();
                        break;
                    case '#preview':
                        previewTeams();
                        break;
                    case '#resize':
                        setTeamSize();
                        break;
                    case '#assign':
                        assignTeams();
                        break;
                    case '#reset':
                        resetTeams();
                        break;
                    case '#identify':
                        identifyPlayers();
                        break;
                    case '#slideshow':
                        launchSlideshowControls();
                        break;
                    case '#startRound':
                        tryStartRound(r)
                        break;
                    case '#completeRound':
                        showRoundCompleter(r);
                        break;
                    case '#checkRound':
                        const cr = parseInt($('#roundInput').val());
                        socket.emit('checkRound', {gameID: game.uniqueID, round: cr}, (summary) => {
                            showScoreSummary(summary, game.persistentData[game.persistentData.rounds[cr].teams]);
                        });
                        break;
                    case '#clearConsole':
                        console.clear();
                        break;
                    case '#presInfo':
                        socket.emit('togglePresInfo', game.address);
                        break;
                    case '#downloadRes':
                        exportResults();
                        break;
                    case '#signOut':
                        signOut();
                        break;
                }

            });
        });
        rSel.off('click').on('click', function () {
            const iv = $(this).parent().parent().find('.valInput');
            const rNow = parseInt(iv.val());
            iv.val($(this).html() === '+' ? rNow + 1 : rNow - 1);
            iv.val(parseInt(iv.val()) < -1 ? -1 : iv.val())
        });
            setupAdvancedLinks();
    };
    const setupAdvancedLinks = () => {
        // amends links already setup in the setupControlLinks method
        const al = $('#facilitator-advanced');
        const bt = al.find('#reset');
        const qr = al.find('#showqr');
        const ge = al.find('#gameEnding');
        const gr = al.find('#gameReset');
        const sr = al.find('#sessionReset');
        const fg = al.find('#fakeGen');
//        console.log(qr);
        bt.add('#completeRound');
        bt.each((i, b) => {
            if ($(b).attr('id')) {
                // the buttons which have an id call method which should refresh the widget
                $(b).on('click', function () {
                    removeThisWidget($(this));
                });
            }
        });
        qr.off('click').on('click', () => {
            socket.emit('presentationOverlay', {type: 'qr', game: game.address});
        });
        ge.off('click').on('click', () => {
            endGame(() => {
                removeThisWidget(ge);
            });
//            const go = confirm(messages.END_WARN);
//            if (go) {
//
//            }
        });
        sr.off('click').on('click', () => {
            const go = confirm(messages.SESSION_WARN);
            if (go) {
                resetSession(() => {
                    removeThisWidget(sr);
                    alert(messages.SESSION_DONE);
                });
            }
        });
        /*
        ge.off('click').on('click', () => {
            alert(messages.END_WARN);
            resetSession(() => {
                removeThisWidget(gr);
//                console.log('dunne');
//                console.log(session);
//                console.log(game);
                openTab(DEFAULT_TAB);
            });
        });
        */
        gr.off('click').on('click', () => {
            resetGame(() => {
                removeThisWidget(gr);
//                alert(messages.RESET_DONE);
            });
        });
        fg.off('click').on('click', () => {
            launchFakeGenerator();
        });
    };
    const buildScoreDetail = (s) => {
        s.forEach(sp => {
            sp.teamSrc = game.persistentData.teamsArray[sp.src].title;
            sp.teamDest = game.persistentData.teamsArray[sp.dest].title;
            sp.player = game.players[sp.client];
//            console.log(sp);
        });
        return s;
    };
    const bestScore = (a, b) => {
        // sort array of teams based on [val].grandTotal
        const val = 'summary2030';
        if (a[val].grandTotal > b[val].grandTotal) {
            return -1;
        } else if (a[val].grandTotal < b[val].grandTotal) {
            return 1;
        } else {
            return 0;
        }
    };
    const emitWithPromiseCOMMONNOW = (event, data) => {
        return new Promise((resolve, reject) => {
            socket.emit(event, data, (response) => {
                resolve(response);
            });
        });
    };

    const openScoreTab = (l) => {
        const id = `${l.substr(0, 1).toUpperCase()}${l.substr(1).toLowerCase()}`;
        localStorage.setItem(`${getStoragePrefix()}scoretab`, id);
        const tabcontent = $('.tabcontentScore');
        const tablinks = $('.tablinksScore');
        const tabTarg = $(`#tab${id}`);
        const tabLink = $(`#link${id}`);
        tabcontent.hide();
        tablinks.removeClass('active');
        tabTarg.show();
        tabLink.addClass('active');
    };
    const setupScoreControls = () => {
        const dlb = $('.downloadBtn');
        if (game.scores.length > 0) {
            dlb.off('click').on('click', function () {
                const id = $(this).attr('id').replace($(this).attr('class'), '');
                const round = window.justNumber($(this).closest('.tabcontentScore').attr('id'));
                let fileID = `${id}`;
                if (round) {
                    fileID = `round${round}-${fileID}`;
                }
                const ob = game.scoreBreakdown[id];
                console.log(`object to download:`, fileID, ob);
                downloadScores(ob, fileID);
            });
        } else {
            dlb.prop('disabled', true);
        }
        // tabs
        let tl = $('.tablinksScore');
        tl.off('click');
        tl.on('click', function () {
            openScoreTab($(this).attr('id').replace('link', ''));
        });
        const savedTab = localStorage.getItem(`${getStoragePrefix()}scoretab`);
        openScoreTab(savedTab ? savedTab.toLowerCase() : 'raw');
    };

    const fetchAndDownloadScores = async () => {
        socket.emit('getScorePackets', game.uniqueID, (sp) => {
            downloadScores(sp, 'allpackets');
        });
    };
    const downloadScores = async (ob, id) => {
        downloadFile(ob, `scores_${id}`);
    }
    const downloadFile = async (ob, id) => {
            socket.emit('requestCSV', ob, (csv) => {
                try {
                    const csvData = csv
                    // Create a Blob from the CSV data
                    const blob = new Blob([csvData], { type: 'text/csv' });
                    // Create a link element
                    const link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
//                    link.download = 'data.csv';
                    link.download = `${id}.csv`;
                    // Append the link to the body and click it
                    document.body.appendChild(link);
                    link.click();
                    // Clean up
                    document.body.removeChild(link);
                } catch (error) {
                    console.error('Error:', error);
                }
            });

    };
    const setupPlayerControls = (baseID) => {
        const pso = playerSortOrder;
        const theBaseID = baseID ? baseID : `contentPlayers`;
        const base = $(`#${theBaseID}`);
        const listSort = base.find('.listSort');
        const makeLead = base.find('.makeLead');
        const reassign = base.find('.reassign');
        const refresh = base.find('.refresh');
        const remove = base.find('.remove');
        const rollovers = base.find('.rollover');
        const warning = base.find('.warning');
        listSort.off('click').on('click', function () {
            pso.dir = pso.prop === this.textContent ? !pso.dir : true;
            pso.prop = this.textContent;
            renderPlayers(baseID);
            const index = listSort.filter(function() {
                return $(this).text().trim() === pso.prop;
            }).index();
            $(listSort[index]).addClass('highlight');
        });
        makeLead.off('click').on('click', function () {
            const leader = $(this).attr('id').split('_').splice(1);
            const leadObj = {game: game.uniqueID, team: parseInt(leader[0]), player: leader[1]};
            socket.emit('makeLead', leadObj);
        });
        reassign.off('click').on('click', function () {
            const leader = $(this).attr('id').split('_').splice(1);
            const tID = parseInt(leader[0]);
            const leadObj = {game: game.uniqueID, team: tID, player: leader[1]};
            const ts = game.persistentData.teamsArray;
            if (game.teams[tID].indexOf(leader[1]) === 0 && ts[tID].type !== 2) {
//                console.log();
                alert('Cannot reassign a team lead');
                return;
            }
            let str = '';
            let poss = [];
//                    console.log(t)
            ts.forEach(t => {
                if (t.id != tID) {
                    poss.push(t.id)
                    str += `\n${t.id} ${t.title}`;
                }
            });
            let newT = prompt(`Type the NUMBER of the team you would like to reassign ${leader[1]} to:${str}`);
            if (newT) {
                if (!isNaN(parseInt(newT))) {
                    newT = parseInt(newT);
                    if (poss.indexOf(newT) > -1) {
                        const go = confirm(`You are about to move ${leader[1]} to the ${ts[newT].title} team, is this OK?`);
                        leadObj.newTeam = newT;
                        if (go) {
                            socket.emit('reassignTeam', leadObj);
                        }
                    } else {
                        alert(`Not possible, the allowed set of options is ${poss}.`);
                    }
                } else {
                    alert('You need to enter the number for the team you would like to rassign to, please try again.');
                }
            } else {

            }
        });
        refresh.off('click').on('click', function () {
            const id = $(this).attr('id').split('_').splice(2);
            const pl = game.playersFull[`${id}`];
            const sock = pl.socketID;
            const clOb = {game: game.uniqueID, player: pl, socketID: sock};
            socket.emit(`refreshClient`, clOb);
        });
        remove.off('click').on('click', function () {
            const id = $(this).attr('id').split('_')[2];
            const plOb = {game: game.uniqueID, player: id};
            if (game.playersFull.hasOwnProperty(`${id}`)) {
                const player = game.playersFull[`${id}`];
                if (player.isLead) {
                    alert('cannot remove a team lead, assign a new lead before trying again');
                    return;
                }
                if (player.connected) {
                    alert('Note: removing a currently connected player may cause unexpected results');
//                    return;
                }
                if (player.teamObj) {
                    alert('Note: removing a player already assigned to a team may cause unexpected results');
//                    return;
                }

            }
            const warn = confirm(`Are you absolutely sure you want to remove player ${id}`);
            if (warn) {
                socket.emit('removePlayer', plOb, (r) => {
                    console.log(r);
                    if (r.hasOwnProperty('err')) {
                        alert(`Cannot remove ${id}: ${r.err}`);
                    }
                });
            }
        });
        warning.off('click').on('click', function () {
            // NOTE: the collection of TRs includes the header, hence adjust rowIndex below:
            const rowIndex = $(this).closest('tr').index() - 1;
            alert(list[rowIndex].warningMessage)
        });
        const but = base.find('.material-icons');
        const butd = base.find('.material-icons:disabled');
//        console.log(butd)
        butd.removeAttr('title');

    };
    const setupPlayerControlsV1 = () => {
        const pso = playerSortOrder;
        $('.listSort').off('click');
        $('.listSort').on('click', function () {
            pso.dir = pso.prop === this.textContent ? !pso.dir : true;
            pso.prop = this.textContent;
            renderPlayers();
            const index = $('.listSort').filter(function() {
                return $(this).text().trim() === pso.prop;
            }).index();
            $($('.listSort')[index]).addClass('highlight');
        });
        $('.makeLead').off('click');
        $('.makeLead').on('click', function () {
            const leader = $(this).attr('id').split('_').splice(1);
            const leadObj = {game: game.uniqueID, team: parseInt(leader[0]), player: leader[1]};
            socket.emit('makeLead', leadObj);
        });
        $('.reassign').off('click');
        $('.reassign').on('click', function () {
            const leader = $(this).attr('id').split('_').splice(1);
            const tID = parseInt(leader[0]);
            const leadObj = {game: game.uniqueID, team: tID, player: leader[1]};
            const ts = game.persistentData.teamsArray;
            if (game.teams[tID].indexOf(leader[1]) === 0 && ts[tID].type !== 2) {
//                console.log();
                alert('Cannot reassign a team lead');
                return;
            }
            let str = '';
            let poss = [];
//                    console.log(t)
            ts.forEach(t => {
                if (t.id != tID) {
                    poss.push(t.id)
                    str += `\n${t.id} ${t.title}`;
                }
            });
            let newT = prompt(`Type the NUMBER of the team you would like to reassign ${leader[1]} to:${str}`);
            if (newT) {
                if (!isNaN(parseInt(newT))) {
                    newT = parseInt(newT);
                    if (poss.indexOf(newT) > -1) {
                        const go = confirm(`You are about to move ${leader[1]} to the ${ts[newT].title} team, is this OK?`);
                        leadObj.newTeam = newT;
                        if (go) {
                            socket.emit('reassignTeam', leadObj);
                        }
                    } else {
                        alert(`Not possible, the allowed set of options is ${poss}.`);
                    }
                } else {
                    alert('You need to enter the number for the team you would like to rassign to, please try again.');
                }
            } else {

            }
        });
        $('.refresh').off('click');
        $('.refresh').on('click', function () {
            const id = $(this).attr('id').split('_').splice(2);
            const pl = game.playersFull[`${id}`];
            const sock = pl.socketID;
            const clOb = {game: game.uniqueID, player: pl, socketID: sock};
            socket.emit(`refreshClient`, clOb);
        });
        $(`.remove`).off('click').on('click', function () {
            const id = $(this).attr('id').split('_')[2];
            const plOb = {game: game.uniqueID, player: id};
            if (game.playersFull.hasOwnProperty(`${id}`)) {
                const player = game.playersFull[`${id}`];
                if (player.isLead) {
                    alert('cannot remove a team lead, assign a new lead before trying again');
                    return;
                }
                if (player.connected) {
                    alert('Note: removing a currently connected player may cause unexpected results');
//                    return;
                }
                if (player.teamObj) {
                    alert('Note: removing a player already assigned to a team may cause unexpected results');
//                    return;
                }

            }
            const warn = confirm(`Are you absolutely sure you want to remove player ${id}`);
            if (warn) {
                socket.emit('removePlayer', plOb, (r) => {
                    console.log(r);
                    if (r.hasOwnProperty('err')) {
                        alert(`Cannot remove ${id}: ${r.err}`);
                    }
                });
            }
        });
        const rollovers = $('.rollover');
        rollovers.on('hover', function () {
            alert(0)
        })
        $('.warning').off('click');
        $('.warning').on('click', function () {
            // NOTE: the collection of TRs includes the header, hence adjust rowIndex below:
            const rowIndex = $(this).closest('tr').index() - 1;
            alert(list[rowIndex].warningMessage)
        });
    };
    const launchSlideshowControls = () => {
//        console.log(game);
//        console.log(game.presentation.slideData);
        addWidget(SLIDESHOW_CONTROL, {x: 400, y: 200, w: 600, h: 600}, () => {
            window.slideContolsInit(game);
        });
    };
    const launchAdvanced = () => {
        const rOb = {x: 100, y: 100, w: 500, h: 230, data: {preventTemplate: true, launchMethod: 'launchAdvanced'}};
//        rOb.data.teamsAssigned = game.teams.length > 0;
//        rOb.data.roundActive = game.round > 0;
//        rOb.data.preventTemplate = true;
        const id = 'facilitator-advanced';
        addWidget(id, rOb, (w) => {
            renderAdvanced();
        });

    };
    const tryStartRound = (r, noemit) => {
        const t = game.teams;
        const p = game.players;
        const emitting = noemit === undefined ? true : noemit;
        r = window.justNumber(r);
        const gr = window.justNumber(game.round);
        const ric = game.round.toString().indexOf('*', 0) > -1 || gr === 0;
//        const ric = game.round.toString().indexOf('*', 0) > -1;
//        console.log(`ric: ${ric}`);
//        console.log(game)
        const oneUp = (r - gr) === 1;
        const idm = socket.emit('checkDevMode', (dm) => {
//            console.log(`idm ${dm}`);
        });
        let ok = idm;
//        ok = false;
        let msg = `Cannot start round ${r}:\n`;
        if (p.length === 0 && r > 0) {
            // Teams not yet assigned, must wait for allocation
            msg += `no players connected, cannot start round`;
            ok = false;
            // Note - NEVER allow scoring prior to team assignment
        } else if (t.length === 0 && r > 0) {
            // Teams not yet assigned, must wait for allocation
            msg += `teams not yet assigned, must wait for allocation`;
            ok = false;
            // Note - NEVER allow scoring prior to team assignment
        } else if (ric && gr > 0 && gr === r) {
            msg += `round is already completed`
            ok = false;
        } else if (r === gr) {
                   // This is the round already in progress
            msg += `round already in progress`;
            ok = false;
        } else if (!ric) {
            // Current round incomplete, must wait for completion
            msg += `current round incomplete, must wait for completion`;
            ok = false;
        } else if (!oneUp) {
            // Gap between rounds is not exactly 1, cannot continue
            msg += `gap between rounds is not exactly 1, cannot continue`;
        } else {
            ok = true;
        }
//        console.log(`tryStartRound, current: ${gr}, requested: ${r}, ok? ${ok}`);
//        ok = true;
        if (ok) {
            addToLogFeed(`round ${r} started successfully`, true);
//            console.log(`emitting startRound`)

        } else {
            addToLogFeed(msg, true);
        }
        if (emitting) {
            console.log('emit the startRound event');
            socket.emit('startRound', {gameID: game.uniqueID, round: r, ok: ok});
        }
//        console.log(`the teams: ${t}, ${t.length}`);
//        console.log(game);
//        console.log(`tryStartRound: ${r} (${typeof(r)}) - current: ${gr} (${typeof(gr)}), is next? ${r === gr + 1}`);
        console.log(`tryStartRound, r: ${r}, gr: ${gr}, ric: ${ric}, msg: ${msg} r === gr ? ${r === gr}, game.round: ${game.round}`);
        return ok;
    };
    const showScoreSummary = (summ, teams) => {
        let str = 'Team submitted score:\n\n';
        teams.forEach((t, i) => {
            str += `${t.title}? ${summ[i]}\n`
        });
        alert(str);
    };
    const showRoundCompleter = () => {
        const r = window.justNumber(game.round);
        const pf = game.playersFull;
        if ($.isEmptyObject(pf)) {
            alert(`Can't complete this action, game.playersFull is not defined. Try reconnecting any fake player clients.`);
            return;
        }
        if (r > 0) {
            const round = game.persistentData.rounds[r];
            const subs = round.submissions;
            const teams = game.persistentData[round.teams];
            // scores assumed to be always required:
            const scorePackets = filterScorePackets(game.scores.map(unpackScore), 'round', round.n);
            let scorers = [];
            const rOb = {teams: [], players: [], scorers: []};
            if (round.type === 1) {
                // teams score
                scorers = teams;
            } else {
                // players score
                teams.forEach(t => {
                    const tm = game.teams[t.id];
                    tm.forEach(p => {
                        scorers.push(game.playersFull[p]);
                    });
                });
            }
            scorers.forEach(t => {
                const comp = round.type === 1 ? {prop: 'src', val: t.id} : {prop: 'client', val: justNumber(t.id)};
                if (filterScorePackets(scorePackets, comp.prop, comp.val).length === 0) {
                    rOb.scorers.push(Object.assign({flag: round.type === 1 ? t.title : `${t.teamObj.title} ${t.id}`}, t));
                }
            });
            $('#modal').modal({
                closeExisting: true
            });
            rOb.isLead = true;
            rOb.currentRoundComplete = false;
            if (rOb.scorers.length > 0) {
                renderTemplate('modaltheatre', 'facilitator.roundcompleter', rOb, () => {
                    let tl = $('.modtablinks');
                    tl.off('click');
                    tl.on('click', function () {
                        const tOb = {isLead: true, currentRoundComplete: false};
                        const id = $(this).attr('id').replace('link_', '');
                        if (round.type === 1) {
                            tOb.teamObj = game.persistentData.teams[`t${id}`];
                        } else {
                            game.teams.forEach((t, i) => {
                                if (t.indexOf(id, 0) > -1) {
                                    tOb.teamObj = game.persistentData.teams[`t${i}`];
                                }
                            });
                        }
                        const pl = game.playersFull[round.type === 1 ? game.teams[tOb.teamObj.id][0] : id];
                        tOb.game = game;
                        pl.teamObj = Object.assign({}, tOb.teamObj);
                        $('#formname').html(tOb.teamObj.title);
                        console.log(`render game-${round.template}`);
//                        console.log(tOb);
                        tOb.dynamicTeamData = window.createDynamicTeamData();
                        renderPartial('formzone', `game-${round.template}`, tOb, () => {
                            $('.resources-btn').css({
                                width: '30px',
                                height: '30px',
                                'background-color': 'green'
                            });
                            console.log(round);
                            console.log(round.type);
                            if (round.type === 1) {
                                if (round.n === 3) {
                                    window.setupCollaborationControl(pl)
                                } else {
                                    window.setupAllocationControl(pl);
                                }
                            } else {
//                                console.log('sheep');
                                window.setupVoteControl(pl);
                            }
                        });
                    });
                });
            } else {
                $(`#modaltheatre`).html(`Round ${r} is complete, no further input needed.`);
            }
        } else {
            alert(`No round currently active.`);
        }
    };
    const updatePlayerMeter = () => {

        const p = game.playersFull;
        const t = new Array((game.mainTeamSize * game.persistentData.mainTeams.length) + game.persistentData.secondaryTeams.length).fill('no');
        let c = 0;
        Object.values(p).forEach(pl => {
            if (pl.connected) {
                if (c < t.length) {
                    t[c] = 'yes';
                }
                c++;
            }
        });
//        t.reverse();
        renderTemplate('playermeter', 'facilitator.playermeter', {total: t, required: t.length, connected: c}, () => {

        });
    };
    const updateRoundDisplay = () => {
        const rounds = game.persistentData.rounds;
        const slides = game.presentation.slideData.slideList;
        const rArr = [];
        slides.forEach(s => {
            if (s.hasOwnProperty('action')) {
                if (s.action.includes('startRound')) {
                    const r = s.action.split(':')[1];
                    const ob = {
                        round: r,
                        titleFull: s.title,
                        title: s.title.replace(/\([^)]*\)/g, ''),
                        data: rounds[r],
                        current: justNumber(game.round) === justNumber(r),
                        complete: game.round.toString().includes('*') && justNumber(game.round) === justNumber(r) || justNumber(game.round) > justNumber(r)
                    }
                    rArr.push(ob)
                }
            }
        });
        renderTemplate('facilitateRoundsContent', 'facilitator.rounds', rArr, () => {

        });
    };
    const processPlayers = (list) => {
        // add any special conditions prior to rendering the player list
        // Note add nothing here that should persist, this is a display-only method.
        list.forEach((pl, i) => {
            if (!pl.connected && pl.isLead) {
                list[i].warning = true;
                list[i].warningMessage = 'Team lead is disconnected, consider assigning new lead if they do not reconnect shortly.'
            }
        });
        return list;
    };

    const renderPlayers = (targ) => {
        if (game) {
            let basicList = game.players.slice(0);
            const pf = Object.assign({}, game.playersFull);
            basicList.forEach((p, i) => basicList[i] = {id: p, connected: false});
            let list = basicList;
            list.forEach((p, i) => {
                if (pf.hasOwnProperty(p.id)) {
                    list[i] = pf[p.id];
                } else if (p.id.hasOwnProperty('id')) {
                    if (pf.hasOwnProperty(p.id.id)) {
                        list[i] = pf[p.id.id];
                    } else {
                        // Seems to be a disconnected player
                        list[i] = p.id;
                    }
                }
                const l = 8;
                if (list[i].teamObj) {
                    const ti = list[i].teamObj.title;
                    list[i].teamObj.titleClip = `${ti.substr(0, l)}${ti.length > l ? '..' + ti.substr(ti.length - 1, 1) : ''}`;
                }
            });
            const pso = playerSortOrder;
            switch (pso.prop) {
                case 'index':
                    list.sort(sortListIndex);
                    break;
                case 'ID':
                    list.sort(sortListID);
                    break;
                case 'connected':
                    list.sort(sortListConnected);
                    break;
                case 'team':
                    list.sort(sortListTeam);
                    break;
                case 'isLead':
                    list.sort(sortListisLead);
                    break;
                default:
            }
            list = processPlayers(list);
            clearTimeout(pso.timeout);
            renderTemplate(targ, 'playerlist', list, () => {
                setupPlayerControls(targ);
            })
        }
    };
    const renderSession = () => {
//        addToLogFeed(`renderSession (see console)`);
//        console.log(`renderSession`);
//        console.log(session);
        const targ = 'contentSession';
        window.setupObserver(targ, () => {
//            console.log('mutationObserver detects change in sessionCard');
            setupSessionLinks();
//            $('#gameRestore').addClass('disabled');
//            $('#gameEnd').addClass('disabled');
//            obs.disconnect();
        });
        window.renderTemplate(targ, 'sessionCardFacilitator', session, () => {
//            console.log('the renderTemplate callback');
            setupSessionLinks()
        });
    };
    const renderGame = (clear) => {
        // 'clear' is a Boolean, when true the game card will be rendered blank
//        addToLogFeed(`renderGame`);
//        console.log(`render the game (doesn't get from server)`);
        const targ = 'contentGame';
        window.setupObserver(targ, () => {
            setupGameLinks();
        });
        // Render the game object excluding the persistent data
        let rOb = {game: window.copyObjectWithExclusions(game, ['persistentData', 'playersFull', 'scorePackets', 'detailedScorePackets', 'teamObjects', 'presentation', 'updateSource', 'teams', 'players', 'scores', 'values'])};
        rOb.gameInactive = rOb.game.state !== 'started';
        if (clear) {
            $(`#${targ}`).html('');
        } else {
            window.renderTemplate(targ, 'gameCard', rOb, () => {
    //            console.log('the renderTemplate callback');
            });
        }
    };
    const developScores2 = async (cb) => {
        // prep scores for display
        if (game) {
            const ob = {scores: game.scores};
            const gp = game.persistentData;
            const ts = gp.mainTeams;
//            const ro = {};
            const ro = [];
            const mapT1 = {
                t: 'team',
                gt: 'grandTotal',
                s: 'self',
                s1: 'pv1',
                s2: 'pv2',
                st: 'pvTotal'
            };
            socket.emit(`getScorePackets`, game.uniqueID, (sp) => {
                ts.forEach(t => {
                    const mine = sp.filter(p => p.dest === t.id);
//                    console.log(t);
                    const tOb = {
                        team: `${t.title.substr(0, 10)}${t.title.length > 10 ? '..' : ''}`,
                        abbr: t.abbr,
                        id: t.id,
                        r1: mine.filter(p => p.round === 1),
                        r2s5: mine.filter(p => p.round === 2).filter(p => p.src === 5),
                        r2s6: mine.filter(p => p.round === 2).filter(p => p.src === 6),
                        r2s5Summary: {total: 0, average: 0, scores: []},
                        r2s6Summary: {total: 0, average: 0, scores: []},
                        r3:  mine.filter(p => p.round === 3),
                        r3Summary: [],
                        r3Total: 0,
                        r4s5: mine.filter(p => p.round === 4).filter(p => p.src === 5),
                        r4s6: mine.filter(p => p.round === 4).filter(p => p.src === 6),
                        r4s5Summary: {total: 0, average: 0, scores: []},
                        r4s6Summary: {total: 0, average: 0, scores: []}
                    };
                    tOb.r1Summary = {total: tOb.r1.length === 0 ? 0 : tOb.r1[0].val};
                    tOb.r2s5.forEach(p => {tOb.r2s5Summary.total += p.val, tOb.r2s5Summary.scores.push(p.val)});
                    tOb.r2s6.forEach(p => {tOb.r2s6Summary.total += p.val, tOb.r2s6Summary.scores.push(p.val)});
                    tOb.r2s5Summary.average = tOb.r2s5.length === 0 ? 0 : (tOb.r2s5Summary.total / tOb.r2s5.length);
                    tOb.r2s6Summary.average = tOb.r2s6.length === 0 ? 0 : (tOb.r2s6Summary.total / tOb.r2s6.length);
                    tOb.r1Total = tOb.r1Summary.total;
                    tOb.r2s5All = tOb.r2s5Summary.scores.length === 0 ? 'n/a' : tOb.r2s5Summary.scores.join(',');
                    tOb.r2s5Av = tOb.r2s5Summary.average;
                    tOb.r2s6All = tOb.r2s6Summary.scores.length === 0 ? 'n/a' : tOb.r2s6Summary.scores.join(',');
                    tOb.r2s6Av = tOb.r2s6Summary.average;
                    tOb.r2Total = tOb.r2s5Summary.average + tOb.r2s6Summary.average;
                    tOb.grandTotal1 = tOb.r2Total * tOb.r1Total;
                    tOb.r3.forEach(p => {tOb.r3Total += p.val, tOb.r3Summary.push({s: p.src, v: p.val})});
                    tOb.r4s5.forEach(p => {tOb.r4s5Summary.total += p.val, tOb.r4s5Summary.scores.push(p.val)});
                    tOb.r4s6.forEach(p => {tOb.r4s6Summary.total += p.val, tOb.r4s6Summary.scores.push(p.val)});
                    tOb.r4s5Summary.average = tOb.r4s5.length === 0 ? 0 : (tOb.r4s5Summary.total / tOb.r4s5.length);
                    tOb.r4s6Summary.average = tOb.r4s6.length === 0 ? 0 : (tOb.r4s6Summary.total / tOb.r4s6.length);
                    tOb.r4s5All = tOb.r4s5Summary.scores.length === 0 ? 'n/a' : tOb.r4s5Summary.scores.join(',');
                    tOb.r4s5Av = tOb.r4s5Summary.average;
                    tOb.r4s6All = tOb.r4s6Summary.scores.length === 0 ? 'n/a' : tOb.r4s6Summary.scores.join(',');
                    tOb.r4s6Av = tOb.r4s6Summary.average;
                    tOb.r4Total = tOb.r4s5Av + tOb.r4s6Av;
                    tOb.grandTotalFinal = (tOb.r1Total + tOb.r3Total) * (tOb.r2Total + tOb.r4Total);
                    ro.push(tOb);
                });
                sortBy(ro, 'grandTotal', true);
                if (cb) {
//                    console.log(ro)
                    cb(ro);
                }
            });
        } else {
            if (cb) {
                cb('nuffink');
            }
        }
    };
    const developScores = async (cb) => {
        // prep scores for display
        if (game) {
            const ob = {scores: game.scores};
            const gp = game.persistentData;
            const ts = gp.mainTeams;
//            const ro = {};
            const ro = [];
            const mapT1 = {
                t: 'team',
                gt: 'grandTotal',
                s: 'self',
                s1: 'pv1',
                s2: 'pv2',
                st: 'pvTotal'
            };
            let t1 = await emitWithPromise(socket, 'getTotals1', game.uniqueID);
            if (t1) {
                t1 = JSON.parse(t1);
                t1 = roundAll(t1);
            }
            socket.emit(`getScorePackets`, game.uniqueID, (sp) => {
                ts.forEach(t => {
                    const mine = sp.filter(p => p.dest === t.id);
                    const tOb = {
                        team: `${t.title.substr(0, 10)}${t.title.length > 10 ? '..' : ''}`,
                        id: t.id,
                        r1: mine.filter(p => p.round === 1),
                        r2s5: mine.filter(p => p.round === 2).filter(p => p.src === 5),
                        r2s6: mine.filter(p => p.round === 2).filter(p => p.src === 6),
                        r2s5Summary: {total: 0, average: 0, scores: []},
                        r2s6Summary: {total: 0, average: 0, scores: []}
                    };
                    tOb.r1Summary = {total: tOb.r1.length === 0 ? 0 : tOb.r1[0].val};
                    tOb.r2s5.forEach(p => {tOb.r2s5Summary.total += p.val, tOb.r2s5Summary.scores.push(p.val)});
                    tOb.r2s6.forEach(p => {tOb.r2s6Summary.total += p.val, tOb.r2s6Summary.scores.push(p.val)});
                    tOb.r2s5Summary.average = tOb.r2s5.length === 0 ? 0 : (tOb.r2s5Summary.total / tOb.r2s5.length);
                    tOb.r2s6Summary.average = tOb.r2s6.length === 0 ? 0 : (tOb.r2s6Summary.total / tOb.r2s6.length);
                    tOb.r1Total = tOb.r1Summary.total;
                    tOb.r2s5All = tOb.r2s5Summary.scores.length === 0 ? 'n/a' : tOb.r2s5Summary.scores.join(',');
                    tOb.r2s5Av = tOb.r2s5Summary.average;
                    tOb.r2s6All = tOb.r2s6Summary.scores.length === 0 ? 'n/a' : tOb.r2s6Summary.scores.join(',');
                    tOb.r2s6Av = tOb.r2s6Summary.average;
                    tOb.r2Total = tOb.r2s5Summary.average + tOb.r2s6Summary.average;
                    tOb.grandTotal = tOb.r2Total * tOb.r1Total;
                    ro.push(tOb);
                });
                sortBy(ro, 'grandTotal', true);
                if (cb) {
                    cb(ro);
                }
            });
        } else {
            if (cb) {
                cb('nuffink');
            }
        }
    };
    const scoreSummaryInit = () => {

        // NOT USED


        var hoverTimeout;
        console.log('askfasjkfdasjkasjdkask')
        // Apply hover effect ONLY to 'PN' and 'Q' columns (2nd and 4th th elements)
        $('.contracted').hover(
            function() {
                var $this = $(this);
                var colIndex = $this.index();
                console.log('hover')
                // Set a delay of 1 second (1000 ms) before expanding
                hoverTimeout = setTimeout(function() {
                    $this.removeClass('contracted').addClass('expanded');
                    console.log('hmmm')
                }, 1000); // 1 second delay
                console.log($this)
                // After transition completes, show full column name and cell values
                $this.on('transitionend', function() {
                    console.log('end')
                    $this.addClass('show-full-name'); // Show full name after expansion completes

                    // Set full value for the corresponding column's table cells
                    $('#scoresummaries').find('tr').each(function() {
                        var $td = $(this).find('td').eq(colIndex);
                        $td.text($td.data('full-value')); // Show full value
                        console.log('dunne');
                        console.log($td.data('full-value'));
                    });
                });
            },
            function() {
                // Clear the timeout if the mouse leaves before the delay ends
                clearTimeout(hoverTimeout);

                var $this = $(this);
                var colIndex = $this.index();

                // Immediately contract the column and show initials
                $(this).removeClass('expanded show-full-name').addClass('contracted');

                // Set '...' for the corresponding column's table cells
                $('#scoresummaries').find('tr').each(function() {
                    var $td = $(this).find('td').eq(colIndex);
                    $td.text('..'); // Show dots when contracted
                });

                // Ensure we don't keep triggering transitionend events during contraction
                $(this).off('transitionend');
            }
        );
    }
    const renderScoreboard = async () => {
        developScores2(o => {
            o = JSON.parse(JSON.stringify(o));
            o.forEach(t => {
                for (var i in t) {
                    if (typeof(t[i]) === 'number') {
                        t[i] = Math.round(t[i] * 100) / 100;
                    }
                }
            });
            const newOb = {totalsObject: o};
            console.log(newOb);
            renderTemplate('facilitateScoresContent', 'facilitator.totals', newOb, () => {
//                scoreSummaryInit();
                document.querySelectorAll('.aligndecimal').forEach(function(el) {
                    let number = el.textContent.trim();
                    let [integer, decimal] = number.split('.');
                    if (!decimal) {
                        decimal = ''; // Make sure decimal is defined
                    }
                    let paddedNumber = `${integer.padStart(3, '\u00A0')}${parseInt(number) === parseFloat(number) ? '\u00A0': '.'}${decimal.padEnd(1, '\u00A0')}`;
                    $(el).html(paddedNumber);
                });

            });
        });
    };
    const renderScores2 = async () => {
        if (game) {
            const ob = {scores: game.scores};
            const gp = game.persistentData;
            // run on a timeout to avoid multiple interations in dev
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(async () => {
                let t = await emitWithPromise(socket, 'getTotals4', game.uniqueID);
                if (t) {
                    console.log(`we have tea`, t)
                }
            });
        }
    };
    const renderScores = async () => {

        if (game) {
            const ob = {scores: game.scores};
            const gp = game.persistentData;
            // run on a timeout to avoid multiple interations in dev
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(async () => {
                let t1 = await emitWithPromise(socket, 'getTotals1', game.uniqueID);
                if (t1) {
                    t1 = JSON.parse(t1);
                    t1 = roundAll(t1);
                }
                socket.emit(`getScorePackets`, game.uniqueID, (sp) => {
                    ob.scorePackets = sp;
                    const scores = {};
                    gp.rounds.forEach(r => {
                        scores[`scoresR${r.n}`] = buildScoreDetail(sp.filter(p => p.round === r.n));
                        ob[`scoresR${r.n}`] = scores[`scoresR${r.n}`];
                    });
                    window.sortBy(scores.scoresR2, 'dest');
                    const dests = Array.from(new Set(scores.scoresR2.map(item => item.dest)));
                    let srcs = Array.from(new Set(scores.scoresR2.map(item => item.src)));
//                    console.log(srcs)
                    const plrs = Array.from(new Set(scores.scoresR2.map(item => item.client)));
                    ob.aggregates = [];
                    ob.expenditure = [];
                    ob.perPlayer = [];
                    ob.teamAlloc = [];
                    // R2
                    // Calculate R2 expendature per PV team
                    srcs.forEach(s => {
                        const srcScores = scores.scoresR2.filter(p => p.src === s);
                        const tOb = {team: gp.teamsArray[s].title, total: 0, count: 0, average: 0};
                        srcScores.forEach(sc => {
                            tOb.total += Math.abs(sc.val);
                            tOb.count += (sc.val === 0 ? 0 : 1);
                            tOb.average = (tOb.total === 0 ? 0 : (Math.round((tOb.total / tOb.count) * 1000) / 1000));
                        });
                        ob.expenditure.push(tOb)
                    });
                    // Aggregated scores received by each stakeholder
                    dests.forEach(d => {
                        const destScores = scores.scoresR2.filter(p => p.dest === d);
                        const tOb = {total: 0, average: 0, count: 0, team: gp.teamsArray[d].title};
                        destScores.forEach(s => {
                            tOb.count += (s.val === 0 ? 0 : 1);
                            tOb.total += s.val;
                            tOb.average = (tOb.total === 0 ? 0 : (Math.round((tOb.total / tOb.count) * 1000) / 1000));
                        });
                        ob[`aggregate${d}`] = Object.assign({}, tOb);
                        ob.aggregates.push(tOb);
                    });
                    // R2 expenditure by player
                    plrs.forEach(s => {
                        const plScores = scores.scoresR2.filter(p => p.client === s);
                        const tOb = {total: 0, count: 0, average: 0, player: game.players[s]};
                        plScores.forEach(sc => {
                            tOb.count += sc.val === 0 ? 0 : 1;
                            tOb.total += Math.abs(sc.val);
                        });
                        ob.perPlayer.push(tOb);
                    });
                    // R3
                    srcs = Array.from(new Set(scores.scoresR3.map(item => item.src)));
                    srcs.forEach(s => {
                        const plScores = scores.scoresR3.filter(p => p.src === s);
                        const tOb = {teamSrc: gp.teamsArray[s].title, scores: []};
                        plScores.forEach(sc => {
                            tOb.scores.push({dest: gp.teamsArray[sc.dest].title, val: sc.val});
                        });
                        ob.teamAlloc.push(tOb);
                    });
                    // Totals
                    // 2030
                    ob.totals2030Simple = t1;
                    const mapT1 = {
                        t: 'team',
                        gt: 'grandTotal',
                        s: 'self',
                        s1: 'pv1',
                        s2: 'pv2',
                        st: 'pvTotal'
                    };
                    ob.totals2030Simple.forEach(t => {
                        t.t = gp.teamsArray[t.t].title;
                        for (let i in mapT1) {
                            if (t.hasOwnProperty(i)) {
                                t[mapT1[i]] = t[i];
                                delete t[i];
                            }
                        }
                    });
                    sortBy(ob.totals2030Simple, 'grandTotal', true);
                    game.scoreBreakdown = Object.assign({}, ob);
                    ob.gameInfo = {
                        roundComplete: game.round.toString().indexOf('*', 0) > -1
                    };
                    game.persistentData.rounds.forEach(r => {
                        ob.gameInfo[`round${r.n}`] = justNumber(game.round) === r.n;
                    });
//                    console.log(`render scores with`, ob);
                    renderTemplate('contentScores', 'facilitator.scores', ob, () => {
                        setupScoreControls();
                    });

                })
            }, 1000);

        }
    };
    const showScores = async () => {
        let t1 = await emitWithPromise(socket, 'getTotals1', game.uniqueID);
//        console.log(t1);
        if (t1) {
            console.log(JSON.parse(t1));
            return t1;
        } else {
            return 'nothing to show'
        }
    };
    const renderTeams = () => {
        let rendO = {};
        if (game) {
            const T = game.persistentData.teams;
            const t = game.teams;
            Object.values(T).forEach((el, id) => {
                if (el.hasOwnProperty('id') && t[id]) {
                    rendO[el.id] = {name: el.title, team: t[id].toString(), players: t[id]}
                }
            });
//            console.log(rendO);
//            window.renderTemplate('controlsInfo', 'teamsCard', rendO);
            window.renderTemplate('contentTeams', 'teamsCard', rendO, () => {
                setupTeamsLinks();
            });
        }
    };
    const renderControls = () => {
        if (game) {
            const hasTeams = game.teams.length > 0;
            const rendO = {
                disableAssignTeams: hasTeams,
                disableDownload: game.round !== '4*',
                game: game
            };
//            console.log(rendO);
            window.renderTemplate('contentControls', 'facilitator.controls', rendO, () => {
                setupControlLinks();
                if (hasTeams) {
                    renderTeams();
                }
                if (localStorage.getItem(SLIDESHOW_CONTROL)) {
                    launchSlideshowControls();
                }
            });
        } else {
            console.log('no game');
        }
    };
    const renderIntro = () => {
         const ob = Object.assign({
            hasName: session.name !== undefined,
            playersConnected: session.players.length > 0,
            playerCount: session.players.length
        }, session);
        renderTemplate('contentFacilitate', 'facilitator.start', ob, () => {
            window.loadCSS(`facilitator.intro`);
            window.facIntroInit(ob);
        });
    };
    const renderOutro = async () => {
        const sc = await developScores((o) => {
            console.log('scores?');
            console.log(o);
        });
        console.log(`renderOutro`);
        console.log(game);
        console.log(session);
//        console.log(sc);
        renderTemplate('contentFacilitate', 'facilitator.end', session, () => {
            const reset = $('#adminGameReset');
            reset.off('click').on('click', () => {
                let sure = window.prompt('Enter admin password');
                if (sure) {
                    socket.emit('testPassword', {adminOnly: true, session: session.uniqueID, pw: sure}, (boo) => {
                        socket.emit('resetEndedGame', {pw: sure, session: session.uniqueID}, (ob) => {
                            if (typeof(ob) === 'object') {
                                session = Object.assign(session, ob);
                                const nGame = window.mapSessionToGame(ob, game);
                                updateGame(nGame);
                                renderFacilitate();
                            } else {
                                alert(boo ? 'OK to reset, but a session object has not been returned.' : 'Cannot reset, password incorrect.')
                            }
                        });
                    });
                }
            });
        });
    };
    const renderSlidelist = (game) => {
//        console.log(`renderSlidelist (new)`);
        let sl = game.presentation.slideData.slideList.slice(0);
        sl.forEach((s, i) => {
            s._titleSimple = s.title;
            s.title = s.title.replace(/\(/gm, '<span class="hint">(').replace(/\)/gm, ')</span>');
            sl[i] = window.reorderObject(s, '_titleSimple');
        });
//        console.log(`renderFacilitate`, sl);
//        console.log(`slidelist length: ${sl.length}`);
        // 20250325 don't render any slides marked as 'exclude'
        const sla = sl.filter(s => !s.exclude);
//        console.log(`slidelist length: ${sla.length}`);
//        console.log(sla);
        renderTemplate(`slidelist`, `facilitator.slidelist`, sla, () => {
            $('#tabFacilitate').css({height: '700px'});
            slideContolsInit(game);
            window.updateSlideList();
        });
    };
    const renderFacilitate = () => {
        // Screen which can be used to run the whole game
//        console.log(`renderFacilitate`);
        if (game) {
            if (game.state === 'ended') {
//                console.log('game pending');
                renderOutro();
            } else if (game.state === 'pending') {
                renderIntro();
            } else {
//                console.log(`game NOT pending: ${game.state}`);
                game.urlPresentation = `${game.base}/presentation#${game.address.replace('/', '')}`
                renderTemplate(`contentFacilitate`, `facilitator.facilitate`, game, () => {

                    renderSlidelist(game);
                    /*
                    const sl = game.presentation.slideData.slideList.slice(0);
                    sl.forEach((s, i) => {
                        s._titleSimple = s.title;
                        s.title = s.title.replace(/\(/gm, '<span class="hint">(').replace(/\)/gm, ')</span>');
                        sl[i] = window.reorderObject(s, '_titleSimple');
                    });
                    console.log(`renderFacilitate`, sl)
                    renderTemplate(`slidelist`, `facilitator.slidelist`, sl, () => {
                        $('#tabFacilitate').css({height: '700px'});
                        slideContolsInit(game);
                    });
                    */

                    renderPlayers('facilitatePlayersContent');
                    const launchBut = $('#facilitateSlideshow').find('#makePres');
                    launchBut.off('click').on('click', () => {
                        launchPresentation();
                    });
                    updatePlayerMeter();
                    updateRoundDisplay();
                    const openAdvanced = $('#openAdvanced');
                    openAdvanced.off('click').on('click', () => {
                        launchAdvanced();
                    });
                    window.createCopyLinks();
                    renderScoreboard();
                });
            }
        } else {
//            console.log('no game yet')
//            renderIntro();
            switch (session.state) {
                case 'pending':
                    renderIntro();
                    break;
                case 'ended':
                    renderOutro();
                    break
            }

        }
    };
    const renderAdvanced = async () => {
        const id = 'facilitator-advanced';
        const rOb = {game: game};
        const isDev = await window.checkDevMode();
        rOb.teamsAssigned = game.teams.length > 0;
        rOb.roundActive = game.round > 0;
        rOb.scoresSubmitted = game.scores.length > 0;
        rOb.preventTemplate = true;
        rOb.disableDownload = game.round !== '4*';
        rOb.isDev = isDev;
        renderTemplate(`widgetinner${id}`, 'facilitator.advanced', rOb, () => {
            const inner = $(`#widgetinner${id}`);
            const outer = $(`#widgetinner${id}`).parent();
            const controls = inner.find('div');
            outer.css({height: `${controls.height() + 50}px`});
            setupControlLinks();
            // (see also setupAdvancedLinks)
        });
    };

    const initSession = async () => {
        addToLogFeed(`initSession, session state? ${session.state}`);
        setupBaseLinks();
        restoreWidgets();
        if (session.state === 'started') {
            addToLogFeed('session already started, restore');
            restoreGame();
        }
    };
    const getSession = (sessionId) => {
        fetch('/admin/getSession?sessionID=' + sessionId, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    const msg = 'Failed to get session data';
                    addToLogFeed(msg);
                    throw new Error(msg);
                }
                return response.json();
            })
            .then(data => {
                session = data;
                session.base = window.location.origin;
                if (session.localIP) {
//                    console.log(`session.localIP: ${session.localIP}`);
                    session.localIP = window.procVal(session.localIP);
                    if (session.localIP) {
                        session.base = session.base.replace('localhost', session.localIP);
                    }
                }
//                console.log(`session.base: ${session.base}`);
//                console.log(`session.localIP: ${session.localIP}`);
                session.playerURL = `${session.base}${session.address}`
                addToLogFeed('session data found:');
//            console.log(data)
                addToLogFeed(`${JSON.stringify(data).substr(0, 45)}...`);
                initSession();
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };
    const openTab = (l) => {
        const ct = getCurrentTab();
//        console.log(`openTab`, l, ct)
        if (l !== ct.title && ct.hasOwnProperty('el')) {
            $(`#content${window.toCamelCase(ct.title)}`).html('');
        }
        $(`#content${window.toCamelCase(ct.title)}`).html('');
//        window.location.hash = l.toLocaleLowerCase();
        const id = `${l.substr(0, 1).toUpperCase()}${l.substr(1).toLowerCase()}`
        const tabcontent = $('.tabcontent');
        const tablinks = $('.tablinks');
        const tabTarg = $(`#tab${id}`);
        const tabLink = $(`#link${id}`);
        tabcontent.hide();
        tablinks.removeClass('active');
        tabTarg.show();
        tabLink.addClass('active');
        setupTab(l.toLowerCase());
        setupTabLinks();
    }
    const showGame = () => {
//        console.log(game);
        return game;
    };
    const compare = (a, b) => {
        const as = JSON.stringify(a);
        const bs = JSON.stringify(b);
//        console.log(`compare: ${as === bs}`);
//        console.log(as);
//        console.log(bs);
        return as === bs;
    };
    let compCount = 0;
    let changeReport = [];
    const showChangeReport = () => {
        const rep = changeReport.filter(obj => !obj.prop.includes('warning'));
        rep.forEach(r => {
            console.log(`${r.player} ${r.prop} from ${r.old} to ${r.new}`);
        });
    };
    window.showChangeReport = showChangeReport;
    const compareGames = (g, comp) => {
        // compare a newly supplied game object with the existing game and reveal differences (dev method)
        if (game) {
            const src = g.hasOwnProperty('updateSource') ? g.updateSource : 'no source provided';
            let out = [];
            if (!compare(g[comp], game[comp])) {
                out = [];
                compCount++;
                Object.entries(g[comp]).forEach((pl, i) => {
                    if (!compare(pl[1], game[comp][pl[0]])) {
                        const pre = game[comp][pl[0]];
                        const post = pl[1];
                        for (let n in pre) {
                            if (!compare(pre[n], post[n])) {
    //                            console.log(`mismatch between player objects ${pl[0]}: ${n}`);
                                const ob = {player: pl[0], prop: n, old: pre[n], new: post[n]};
                                changeReport.push(ob);
                                out.push(n);
                            }
                        }
                    }
                })
            }
            return out;
        }
    };
    const compareScores = (sc) => {
        const a1 = game ? game.scores : [];
        const a2 = sc;
        const a1c = [...a1];
        const a2c = [...a2];
        const difference = a1c.filter(x => !a2.includes(x)).concat(a2c.filter(x => !a1.includes(x)));
//        console.log(`comparing:`);
//        console.log(a1);
//        console.log(a2);
        return difference;
    };

    const exportResults = async () => {
        const mt = game.persistentData.mainTeams;
//        console.log(mt);
        const r = await emitWithPromise(socket, 'getTotals4', game.uniqueID);
        const out = [];
//        console.log(r);
        if (r) {
            r.forEach((t, i) => {
                const o = {
                    team: t.team,
                    "Player Resources": t.self
                };
                o['Public Voice Resources 1'] = roundNumber(t.pvR2Total, 3);
//                console.log(`run the loop for ${t.team}:`);
//                console.log(t);
                mt.forEach(tm => {
//                    console.log(`team: ${tm.id}`);
//                    console.log(t.summary_r3);
                    o[tm.abbr] = tm.id === i ? 'x' : t.summary_r3[tm.id];
                });
                o['Total Player Resources'] = t.total;
                o['Public Voice Resources 2'] = roundNumber(t.pvR4Total, 3);
                o['Total Score'] = t.gtRound;
                out.push(o);
            });
//            console.log(out);
            out.forEach(t => console.log(t));
            downloadFile(out, `sus_${game.address.replace('/', '')}_results`);
        }
    };

    // slideshow event handling
    const slideActions = {
        rAssignTeams: assignTeams
    };
    const facilitatorSlideChange = (ob) => {
//        console.log(`slide change`, ob);
        clearMessage();
        const sl = game.presentation.slideData.slideList[ob.currentSlide];
        if (sl.action) {
//            console.log(`i am action: ${sl.action}`);
            if (sl.action.includes(`startRound`)) {
//                console.log(sl.action.split(':'));
//                console.log(`fac slide change`);


                //////////////////////////////////////////////////////////////////////////////////////////// one use of the tryStartRound - which one to keep??


//                tryStartRound(justNumber(sl.action.split(':')[1]));
            }
            if (sl.action.includes(`showRound`)) {
//                console.log(`showRound`);
//                console.log(sl.action.split(':'));
            }
            if (slideActions.hasOwnProperty(sl.action)) {
//                console.log(slideActions[sl.action]);
                slideActions[sl.action]();
            }
        }
    };
    const onShowSlide = async (slOb) => {
        // To be used to trigger actions on slide auto-advance

        // Not working yet - doesn't fire until another action is called, so can't be used to trigger pres actions.
        // Either find a way to trigger this earlier in the event stack OR add a flag to the object so that the socket emit only occurs when activated via autoplay.
//        console.log(`onShowSlide`);
//        console.log(slOb);
        const v = slOb.ref;
        const test = await slideTest(v);


//        const gOb = {gameID: game.uniqueID, event: 'gotoSlide', val: v, test: await slideTest(v)};
//        socket.emit('presentationEvent', gOb, (ob) => {
//            eventUpdate(ob);
//        });
    };
    const slideTest = async (n) => {
        // tests whether a slide can be loaded, returns Boolean. By default return true unless a test is defined by the action property
        if (!game) {
            return;
        }
        const sl = game.presentation.slideData.slideList[n];
        let test = true;
        let tested = false;
        let ac = null;
        try {
            if (sl) {
                if (sl.hasOwnProperty('action')) {
                    ac = sl.action;
                    if (ac.includes('startRound')) {
                        const r = parseInt(ac.split(':')[1]);
                        tested = true;


                        //////////////////////////////////////////////////////////////////////////////////////////// another use of the tryStartRound - which one to keep??

                        console.log(`slide test calls tryStartRound: ${r}, action: ${sl.action}`);
                        test = tryStartRound(r);
                    }
//                    console.log(ac);
                    if (ac.toLowerCase().includes('assignteams')) {
                        // Use preview teams as this method does not update the game model
                        tested = true;
                        console.log('yesy!');
                        const teamer = await emitWithPromise(socket, 'assignTeams', {address: game.address, type: 'order', preview: true});
                        test = typeof(teamer) === 'object' && game.teams.length === 0;
//                        if (test) {
//                            console.log(test);
//                        } else {
//                            console.log('no test');
//                        }
//                        let t1 = await emitWithPromise(socket, 'getTotals1', game.uniqueID);
                    }
                } else {
                    throw new Error('no action');
                }
            } else {
                throw new Error('no slide');
            }
            if (sl) {

            }
        } catch (error) {
//            console.log(`${error}`);
        }
        return {tested: tested, test: test, ac: ac};
    };


    function handleChange(prop) {
//        console.log(`change detected for property ${prop}`);
        if (typeof(game.players[0]) !== 'string') {
//            console.log(`Game has changed, players updated with non-string values: ${prop}`);
//            console.log(game.players);
        }
    };
    // Define a function to set up the watch
    function setupWatch(obj, callback) {
        // Iterate over each property of the object
        for (let key in obj) {
            // Get the current value of the property
            let value = obj[key];

            // Define a getter and setter for the property
            Object.defineProperty(obj, key, {
                get() {
                    return value;
                },
                set(newValue) {
                    value = newValue;
                    callback(key); // Call the callback function with the property name
                }
            });
        }
    };


    const sockInit = () => {
        const sessionID = getSessionID();
//        console.log(`sockInit, sessionID: ${sessionID}`);
        window.socketShare(socket, 'fdb_socket');
        addToLogFeed(`sessionID: ${sessionID}`);
        if (sessionID) {
            getSession(sessionID);
        }
    };
    const domInit = () => {
//        setupBaseLinks();
        if (getSessionID() === null) {
//            alert('The dashboard cannot be launched standalone, please open facilitatorlogin instead');
            window.location.replace('facilitatorlogin');
        }
    };

    let renderInt = null;
    socket.on('test', () => {console.log('test')});
    socket.on('gameUpdate', (g) => {
        onGameUpdate(g);
    });
    socket.on('gameUpdateOLD', (g) => {
        console.log(`###############################################`);
        console.log(`gameUpdate:`, g);
        const pv = procVal;
        let comp = 'playersFull';
        // cg will be an array of updated values, precluding any changes to props containing 'warning'
        const cg = compareGames(g, comp);
        if (cg) {
            const cgf = cg.filter(str => !str.includes('warning'));
            const displayedProperty = Boolean(cgf.slice(0).indexOf('socketID', 0) === -1);
            if (pv(g.uniqueID) === pv(getSessionID())) {
                addToLogFeed('gameUpdate');
                updateGame(g);
                if (displayedProperty) {
                    setupTab(getCurrentTab().title);
                }
                // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> need a better approach to line below - player lists will be updated on any/all game updates
                renderPlayers('facilitatePlayersContent');
                updatePlayerMeter();
                updateRoundDisplay();
                if ($('#roundcompleter').length > 0) {
                    if ($('#roundcompleter').is(':visible')) {
                        closeModal();
                        showRoundCompleter();
                    }
                }
            }
        } else {
            console.warn(`gameUpdate has not completed due to a failure at compareGames method`);
        }
    });
    socket.on('onGameRestored', (gOb) => {
//        console.log('game restored!', gOb);
        onGameRestored(gOb);
    });
    socket.on('playerUpdate', (ob) => {

    });
    socket.on('teamsAssigned', (rgame) => {
//        console.log('teamsAssigned', rgame);
        game.teams = rgame.teams;
        game.playersFull = rgame.playersFull;
        renderPlayers('facilitatePlayersContent');
        renderSlidelist(rgame)
    });
    socket.on('scoreSubmitted', (ob) => {
        // Nothing here, look for gameUpdate instead
//        console.log('score hup');
    });
    socket.on('presentationSlideUpdated', (ob) => {
//        console.log('presentationSlideUpdated', ob);
    });
    socket.on('onShowSlide', slOb => {
        onShowSlide(slOb);
    });
    socket.on('gameWarning', (ob) => {
        alert(ob.warning)
    });
    socket.on('gotoNext', () => {
        console.log(`facilitatorDashboard hears gotoNext`);
        window.pEvent('next');
    });
    socket.on('roundComplete', (game) => {
        addToLogFeed(`yes, round ${game.round} complete`, true);
//        console.log(`game.rounds[game.round].completionMsg`)
//        console.log(game.persistentData.rounds[game.round].completionMsg);
        if (game.round > 0 && game.persistentData.rounds[game.round].hasOwnProperty('completionMsg')) {
//            alert(game.persistentData.rounds[game.round].completionMsg);
        }
    });



//    window.showGame = showGame;
    renderTemplate = window.renderTemplate;
    renderPartial = window.renderPartial;

    procVal = window.procVal;
    //
    window.showGame = showGame;
    window.startGame = startGame;
    window.getSessionID = getSessionID;
//    console.log(`getSessionID defined on window scope`);
    window.showScores = showScores;
    window.facilitatorSlideChange = facilitatorSlideChange;
    window.renderFacilitate = renderFacilitate;
    window.slideTest = slideTest;
    const closeModal = () => {
        $('#modal').modal('close');
//        console.log('closed');
//        console.log($('#modal'));
    }
    window.closeModal = closeModal;
    window.devCompleteR1 = () => {
        const t = game.persistentData.mainTeams;
        t.forEach((tm, i) => {
            console.log(i, Math.round(Math.random() * 5))
            const sob = {scoreCode: {src: i, dest: i, val: Math.round(Math.random() * 5)}, game: game.uniqueID, client: i};
            socket.emit('submitScore', sob, (scores) => {
                window.setupAllocationControl();
            });
        });
//        const sob = {scoreCode: {src: 4, dest: 4, val: 12}, game: game.uniqueID, client: 4};
//        socket.emit('submitScore', sob, (scores) => {
//            window.setupAllocationControl();
//        });
    };
    window.rScores = renderScoreboard;
    window.rf = renderFacilitate;

//    window.oo = exportResults
    //
    domInit();
});

