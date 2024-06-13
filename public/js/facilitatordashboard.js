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

    let session = null;
    let game = null;
    let gameSeekTimeout = null;

    const playerSortOrder = {prop: null, dir: true, timeout: -1};
    const SLIDESHOW_CONTROL = 'facilitator-slideshow-controls';
    const gameState = {disconnected: [], timeout: -1}

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
    const addToLogFeed = (msg) => {
        logFeed.push(`${logFeed.length + 1}: ${msg}`);
        logFeedArchive.push(`${logFeed.length + 1}: ${msg}`);
        renderLogFeed();
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
    const resetSession = () => {
        const w = confirm('Are you sure you want to reset the session?');
        if (w) {
            socket.emit('resetSession', session.uniqueID, (rtn) => {
                if (typeof(rtn) === 'string') {
                    alert(rtn);
                } else {
                    console.log(`session reset`);
                    session = rtn;
                    renderSession();
                }
            });
        }
    };
    const startGame = () => {
        addToLogFeed('start new game');
        if (session.state === 'pending') {
            socket.emit('preparePresentation', {sessionID: session.uniqueID, type: session.type});
            socket.emit('startGame', JSON.stringify(session), (rgame) => {
//                game = rgame;
                console.log(`startGame callback, rgame:`, rgame);
                updateGame(rgame);
                addToLogFeed('game ready');
                getSession(game.uniqueID, () => {
    //                console.log('game cb');
                });
                renderGame();
                openTab('game');
            });
        } else {
            alert(`cannot start game (session ${session.state})`)
        }
    };
    const emitRestoreGame = () => {
        socket.emit('restoreGame', JSON.stringify(session), (rgame) => {
            // Extra check to ensure game is not updated unnecessarily
            if (game == null) {
//                console.log('I SHOULD ONLY HAPPEN ONCE')
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
    const endGame = () => {
        socket.emit('endGame', game, (rgame) => {
            //returns modified game, render this
//            game = rgame;
            updateGame(rgame);
            renderGame();
        });
        return;
        // NOTE Use below in deployment
        let sure = window.prompt('Warning: this action cannot be undone. Enter your password to continue.');
        if (sure) {
            socket.emit('testPassword', {session: session.uniqueID, pw: sure}, (boo) => {
                if (boo) {
//                    console.log(`OK to end`)
                    socket.emit('endGame', game, (rgame) => {
                        //returns modified game, render this
//                        game = rgame;
                        updateGame(rgame);
                        renderGame();
                    });
                } else {
                    alert('Incorrect password')
                }
            });
        }

    };
    const resetGame = () => {
        let go = window.confirm('Are you sure? This will reset all game progress and return you to the Session tab.');
        if (go) {
            const id = game.uniqueID;
            addToLogFeed(`resetting game ${id}`);
            socket.emit('resetGame', id, (rs) => {
                session = rs;

                openTab('session');
                renderSession();
                renderGame(true);

            });
        }
    };
    const updateGame = (ngame) => {
        // Method to use any time the game is updated (i.e never use "game = ...")
        if (game) {
            Object.assign(game, ngame);
        } else {
            game = Object.assign({}, ngame);
            window.gameShare(game);
            // \/ optional method; listens for change to game object (use in dev only)
//            setupWatch(game, handleChange);
        }
    };
    const launchPresentation = () => {
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
            const rendO = {disableAssignTeams: hasTeams, game: game};
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
    const renderPlayers = (l) => {
        if (game || l) {
            let basicList = game.players.slice(0);
            const pf = Object.assign({}, game.playersFull);
//            console.log(`I think this is the culprit, basicList is ${basicList.hasOwnProperty('length') ? 'array' : 'object'}, full list is ${pf.hasOwnProperty('length') ? 'array' : 'object'}`)
            basicList.forEach((p, i) => basicList[i] = {id: p, connected: false});
            let list = l ? l : basicList;
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
            renderTemplate('contentPlayers', 'playerlist', list, () => {
                setupPlayerControls();

            })
        }
    };
    let renderTimeout = null;
    const addWidget = (id, ob, cb) => {
        const wid = `#${id}`;
        const wd = $(wid);
        const widID = `wid-${game.uniqueID}${wid}`;
        const rOb = {
            x: ob.x ? ob.x : 0,
            y: ob.y ? ob.y : 0,
            w: ob.w ? ob.w : 0,
            h: ob.h ? ob.h : 0,
            ob: ob.ob ? ob.ob: {}
        };
//        console.log(JSON.parse(JSON.stringify(ob)));
//        console.log(JSON.parse(JSON.stringify(rOb)));
//        console.log(rOb);
//        console.log(`add widget: ${id}, ${wd.length}`)
        if (wd.length === 0) {
            // (can't use 'w' in here because this block runs only when 'w' does not exist)
            $(`#overlay`).append(`<div class="widget" id="${id}"></div>`);
            let stOb = localStorage.getItem(widID);
            if (stOb) {
                Object.assign(rOb, JSON.parse(stOb));
            }
            $(wid).draggable({
                stop: function () {
                    const pOb = {x: $(this).position().left, y: $(this).position().top};
                    const stOb = JSON.parse(localStorage.getItem(widID));
                    if (pOb && stOb) {
                        localStorage.setItem(widID, JSON.stringify(Object.assign(stOb, pOb)));
                    }
                }
            });
            const tOb = {id: id, partialName: id};
//            console.log(tOb);
            renderTemplate(id, 'facilitator.widget', tOb, () => {
                $(wid).css({left: `${rOb.x}px`, top: `${rOb.y}px`, width: `${rOb.w}px`, height: `${rOb.h}px`});
                localStorage.setItem(widID, JSON.stringify(rOb));
                if (cb) {
                    cb();
                }
            });
        }
    };
    const playergraph = () => {
//        console.log(`playergraph`);
//        return;
        // graphically display the number of connected players
        // Add the widget if it doesn't exist:
        addWidget(`playergraph`, {x: 400, y: 200, w: 150, h: 300});
        const plc = Object.values(game.playersFull).filter(p => p.connected);
        const plReq = game.mainTeamSize * game.persistentData.mainTeams.length;
        let perc = (plc.length / plReq) * 100;
        perc = perc > 100 ? 100 : perc;
//        console.log(game);
//        console.log(plc.length, plReq, perc);
        $('#graph-inner').css({height: `${perc}%`});
        $('#graph-n-count').html(plc.length);
        $('#graph-n-total').html(plReq);
    };
    const previewTeams = () => {
        const assOb = {address: game.address, type: 'order', preview: true};
        socket.emit('assignTeams', assOb, (rgame) => {
//            console.log(`previewTeams callback`)
//            console.log(rgame);
            if (typeof(rgame) === 'string') {
                alert(rgame);
            } else {
                const tms = rgame.persistentData.teams;
                const tm = rgame.teams;
                let str = 'Team breakdown Preview:\n';
                tm.forEach((t, i) => {
                    str += `${tms['t' + i].title}:  ${t.join(', ')} (${t.length} player${t.length === 1 ? '' : 's'})\n`;
                });
                alert(str);
            }
        });
    };
    const setTeamSize = () => {
        const gameID = `game-${game.uniqueID}`;
        const n = parseInt($('#teamInput').val());
        socket.emit('setTeamSize', { gameID, n }, (rgame) => {
            updateGame(rgame);
//            renderControls();
            playergraph();
        })
    };
    const assignTeams = (force) => {
        const assOb = {address: game.address, type: 'order', preview: false};
        if (force) {
            assOb.force = true;
        }
        socket.emit('assignTeams', assOb, (rgame) => {
            if (typeof(rgame) === 'string') {
                const force = confirm(`${rgame} Click OK to assign teams regardless, or click cancel and try reducing the minimum team size.`);
                if (force) {
                    assignTeams(true);
                }
            } else {
                addToLogFeed('teams assigned');
//                game = rgame;
                updateGame(rgame);
//                renderControls();
                highlightTab('teams');
            }
        });
    };
    const resetTeams = () => {
        socket.emit('resetTeams', {address: game.address}, (rgame) => {
            addToLogFeed('teams reset');
            console.log(`resetTeams:`);
            console.log(rgame);
//            game.teams = rgame.teams;
//            game = rgame;
            updateGame(rgame);
//            renderControls();
//            renderTeams();
        });
    };
    const identifyPlayers = () => {
//        console.log('identifyPlayers');
        socket.emit('identifyPlayers', game);
    };

    const setupTab = (arg) => {
//        console.log(`setupTab: ${arg}`);
//        console.log(`setupTab: ${window.toCamelCase(arg)}`);
//        console.log($(`#content${window.toCamelCase(arg)}`));
//        console.log($(`#content${window.toCamelCase(arg)}`).children().length);
//        console.log(`currentTab: ${getCurrentTab().title}`);
//        console.log(getCurrentTab());
        const alwaysUpdate = ['players', 'scores', 'game', 'session'];
        const neverStatic = alwaysUpdate.indexOf(arg, 0) > -1;
        // Try running only if the tab has changed:
        if ($(`#content${window.toCamelCase(arg)}`).children().length === 0 || neverStatic) {
//            console.log(`yes, setupTab: ${window.toCamelCase(arg)}`);
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
            case 'players':
                renderPlayers();
                break;
            case 'teams':
                renderTeams();
                break;
            case 'scores':
                renderScores();
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
        gTab.prop('disabled', !gameOn);
        cTab.prop('disabled', !gameOn);
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
                openTab($(this).attr('id').replace('link', ''));
            });
            const t = window.location.hash ? window.location.hash.replace('#', '') : 'session';
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
        const ids = ['#preview', '#resize', '#assign', '#reset', '#identify', '#startRound', '#completeRound', '#checkRound', '#slideshow', '#setName'];
        const rSel = $('#contentControls').find('.buttonSet').find('button');
        const rVal = $('#roundInput');
//        console.log(`setupControlLinks`);
//        console.log(rSel);
        ids.forEach(id => {
            const element = $(id);
            element.off('click').on('click', () => {
//                console.log(`click ${id}`)
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
                }
            });
        });
        rSel.off('click').on('click', function () {
            const iv = $(this).closest('td').prev('td').find('.valInput');
            const rNow = parseInt(iv.val());
            iv.val($(this).html() === '+' ? rNow + 1 : rNow - 1);
            iv.val(parseInt(iv.val()) < -1 ? -1 : iv.val())
        })
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

//                console.log(`i also got t1`, t1);
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
                    })
                })
            }, 1000);

        }
    };
    const renderScoresV1 = () => {
        if (game) {
            const ob = {scores: game.scores};
            // run on a timeout to avoid multiple interations in dev
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                socket.emit(`getScorePackets`, game.uniqueID, (sp) => {
                    ob.scorePackets = sp;
                    const scoresR1 = buildScoreDetail(sp.filter(p => p.round === 1));
                    const scoresR2 = buildScoreDetail(sp.filter(p => p.round === 2));
                    const scoresR3 = buildScoreDetail(sp.filter(p => p.round === 3));
                    const scores = {};
                    game.persistentData.rounds.forEach(r => {
                        scores[`scoresR${r.n}`] = buildScoreDetail(sp.filter(p => p.round === r.n));
                    });
                    window.sortBy(scoresR2, 'dest');
                    const dests = Array.from(new Set(scores.scoresR2.map(item => item.dest)));
                    const srcs = Array.from(new Set(scores.scoresR2.map(item => item.src)));
                    const plrs = Array.from(new Set(scores.scoresR2.map(item => item.client)));
//                    console.log(plrs);
                    ob.scoresR1 = scores.scoresR1;
                    ob.scoresR2 = scores.scoresR2;
                    ob.scoresR3 = scores.scoresR3;
                    ob.aggregates = [];
                    ob.expenditure = [];
                    ob.perPlayer = [];
                    srcs.forEach(s => {
                        const srcScores = scoresR2.filter(p => p.src === s);
                        const tOb = {team: game.persistentData.teamsArray[s].title, total: 0, count: 0, average: 0};
                        srcScores.forEach(sc => {
                            tOb.total += Math.abs(sc.val);
                            tOb.count += (sc.val === 0 ? 0 : 1);
                            tOb.average = (tOb.total === 0 ? 0 : (Math.round((tOb.total / tOb.count) * 1000) / 1000));
                        });
                        ob.expenditure.push(tOb)
                    });
                    dests.forEach(d => {
                        const destScores = scores.scoresR2.filter(p => p.dest === d);
                        const tOb = {total: 0, average: 0, count: 0, team: game.persistentData.teamsArray[d].title};
                        destScores.forEach(s => {
                            tOb.count += (s.val === 0 ? 0 : 1);
                            tOb.total += s.val;
                            tOb.average = (tOb.total === 0 ? 0 : (Math.round((tOb.total / tOb.count) * 1000) / 1000));
                        });
                        ob[`aggregate${d}`] = Object.assign({}, tOb);
                        ob.aggregates.push(tOb);
                    });
                    plrs.forEach(s => {
                        const plScores = scores.scoresR2.filter(p => p.client === s);
                        const tOb = {total: 0, count: 0, average: 0, player: game.players[s]};
                        plScores.forEach(sc => {
                            tOb.count += sc.val === 0 ? 0 : 1;
                            tOb.total += Math.abs(sc.val);
                        });
                        ob.perPlayer.push(tOb);
                    });
                    game.scoreBreakdown = Object.assign({}, ob);
                    ob.gameInfo = {
                        roundComplete: game.round.toString().indexOf('*', 0) > -1
                    };
                    game.persistentData.rounds.forEach(r => {
                        ob.gameInfo[`round${r.n}`] = justNumber(game.round) === r.n;
                    });
                    console.log(`render scores with`, ob);
                    renderTemplate('contentScores', 'facilitator.scores', ob, () => {
                        setupScoreControls();
                    })
                })
            }, 1000);

        }
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
            socket.emit('requestCSV', ob, (csv) => {
                try {
                    const csvData = csv
                    // Create a Blob from the CSV data
                    const blob = new Blob([csvData], { type: 'text/csv' });
                    // Create a link element
                    const link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
//                    link.download = 'data.csv';
                    link.download = `scores_${id}.csv`;
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
    const setupPlayerControls = () => {
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
            console.log(plOb);
            console.log(plOb.player);
            console.log(typeof(plOb.player));
            console.log(game.playersFull[`${id}`]);
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
                if (player.hasOwnProperty('teamObj')) {
                    alert('Note: removing a player already assigned to a team may cause unexpected results');
//                    return;
                }

            }
            const warn = confirm(`Are you absolutely sure you want to remove player ${id}`);
            if (warn) {
                socket.emit('removePlayer', plOb);
            }
        });
        const rollovers = $('.rollover');
//        console.log(rollovers.length);
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
    const tryStartRound = (r) => {
        const t = game.teams;
//        const gr = parseInt(game.round.toString().replace(/\D/g, ''));
//        console.log(`tryStartRound: ${r}`);
//        console.log(game);
        const gr = window.justNumber(game.round);
        const ric = game.round.toString().indexOf('*', 0) > -1 || gr === 0;
        const oneUp = (r - gr) === 1;
        const idm = socket.emit('checkDevMode', (dm) => {
//            console.log(`idm ${dm}`);
        });
        let ok = idm;
//        ok = false;
        let msg = `Cannot start round ${r}:\n`;
        if (t.length === 0) {
            // Teams not yet assigned, must wait for allocation
            msg += `teams not yet assigned, must wait for allocation`;
            ok = false;
            // Note - NEVER allow scoring prior to team assignment
        } else if (r === gr) {
                   // This is the round already in progress
            msg += `this is the round already in progress`;
        } else if (!ric) {
            // Current round incomplete, must wait for completion
            msg += `current round incomplete, must wait for completion`;
        } else if (!oneUp) {
            // Gap between rounds is not exactly 1, cannot continue
            msg += `gap between rounds is not exactly 1, cannot continue`;
        } else {
            ok = true;
        }

        if (ok) {
            alert(`OK to start round ${r}`);
            socket.emit('startRound', {gameID: game.uniqueID, round: r});
        } else {
            alert(msg);
        }
//        console.log(`the teams: ${t}, ${t.length}`);
//        console.log(game);
//        console.log(`tryStartRound: ${r} (${typeof(r)}) - current: ${gr} (${typeof(gr)}), is next? ${r === gr + 1}`);
        return;
        if (t.length > 0) {
            if (r != gr) {
                if (r === (gr + 1) || r < 0) {
                    if (game.round.toString().indexOf('*', 0) === -1 || (gr === 0 && r === 1)) {
                        socket.emit('startRound', {gameID: game.uniqueID, round: r});
                    } else {
                        alert(`Current round (${gr}) not yet completed, cannot start round ${r}`);
                    }
                } else {
                    alert(`Cannot start round ${r} - rounds must be completed sequentially (current round is ${gr}).`)
                }
            } else {
                alert(`round ${r} is already in progress.`)
            }
        } else {
            alert(`cannot start round ${r} before teams have been allocated.`);
        }
    };
    const showScoreSummary = (summ, teams) => {
        let str = 'Team submitted score:\n\n';
        teams.forEach((t, i) => {
            str += `${t.title}? ${summ[i]}\n`
        });
        alert(str);
    };
    const showRoundCompleter = () => {
//        const r = parseInt(game.round.toString().replace(/\D/g, ''));
//        console.log(`showRoundCompleter`)
        const r = window.justNumber(game.round);
        if (r > 0) {
            const round = game.persistentData.rounds[r];
            const subs = round.submissions;
            const teams = game.persistentData[round.teams];
            // scores assumed to be always required:
//            const scores = game.scores.filter(sc => sc.startsWith(r));
            const scorePackets = filterScorePackets(game.scores.map(unpackScore), 'round', round.n);
//            console.log(`scorePackets`, scorePackets);
            let scorers = [];
//            console.log(`round`, round);
//            console.log(`teams`, teams);
            const rOb = {teams: [], players: [], scorers: []};
            if (round.type === 1) {
                // teams score
                scorers = teams;
            } else {
                // players score
                teams.forEach(t => {
//                    console.log(t)
                    const tm = game.teams[t.id];
                    tm.forEach(p => {
//                        console.log(game.playersFull[p]);
                        scorers.push(game.playersFull[p]);
                    });
                });
            }
//            console.log(`scorers`, scorers);
//            console.log(`scorePackets`, scorePackets);

            scorers.forEach(t => {
//                if (scores.filter(sc => (parseInt(sc.split('_')[1])) === t.id).length === 0) {
                console.log(t);
                const comp = round.type === 1 ? {prop: 'src', val: t.id} : {prop: 'client', val: justNumber(t.id)};
                if (filterScorePackets(scorePackets, comp.prop, comp.val).length === 0) {
//                    console.log('comp', comp)
//                    console.log(`scorer has not scored:`, filterScorePackets(scorePackets, comp.prop, comp.val));
                    rOb.scorers.push(Object.assign({flag: round.type === 1 ? t.title : `${t.teamObj.title} ${t.id}`}, t));
                } else {
//                    console.log(`scorer HAS scored`);
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
//                        console.log(`id: ${id}, round type: ${round.type}`);
                        if (round.type === 1) {
                            tOb.teamObj = game.persistentData.teams[`t${id}`];
                        } else {
                            game.teams.forEach((t, i) => {
//                                console.log(t)
                                if (t.indexOf(id, 0) > -1) {
                                    tOb.teamObj = game.persistentData.teams[`t${i}`];
                                }
                            });
                        }
//                        const pl = game.playersFull[game.teams[tOb.teamObj.id][0]];
                        const pl = game.playersFull[round.type === 1 ? game.teams[tOb.teamObj.id][0] : id];
//                        console.log('pl', pl);
                        tOb.game = game;
                        pl.teamObj = Object.assign({}, tOb.teamObj);
                        $('#formname').html(tOb.teamObj.title);
                        renderPartial('formzone', `game-${round.template}`, tOb, () => {
                            $('.resources-btn').css({
                                width: '30px',
                                height: '30px',
                                'background-color': 'green'
                            });
                            if (round.type === 1) {
                                window.setupAllocationControl(pl);
                            } else {
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
    const showRoundCompleterV1 = () => {
//        const r = parseInt(game.round.toString().replace(/\D/g, ''));
        console.log(`showRoundCompleter`)
        const r = window.justNumber(game.round);
        if (r > 0) {
            const round = game.persistentData.rounds[r];
            const subs = round.submissions;
            const teams = game.persistentData[round.teams];
            // scores assumed to be always required:
            const scores = game.scores.filter(sc => sc.startsWith(r));
            const scorePackets = game.scores.map(unpackScore);
            console.log(`game.scores`, game.scores);
            console.log(`scorePackets`, scorePackets);
            console.log(filterScorePackets(scorePackets, 'round', round.n));
//            console.log(filterScorePackets(scorePackets, 'src', 0));
//            console.log(filterScorePackets(scorePackets, 'val', 1));
            let scorers = [];
            console.log(`round`, round);
            console.log(`teams`, teams);
            const rOb = {teams: [], players: []};
            if (round.type === 1) {
                // teams score
                scorers = teams;
            } else {
                // players score
                teams.forEach(t => {
//                    console.log(t)
                    const tm = game.teams[t.id];
                    tm.forEach(p => {
//                        console.log(game.playersFull[p]);
                        scorers.push(game.playersFull[p]);
                    });
                });
            }
            console.log(`scorers`, scorers);
            console.log(`scores`, scores);

            teams.forEach(t => {
                if (scores.filter(sc => (parseInt(sc.split('_')[1])) === t.id).length === 0) {
                    rOb.teams.push(Object.assign({}, t));
                }
//                console.log(game.teams[t.id]);
                if (round.type === 2) {
                    // all players must score
                    const tm = game.teams[t.id];
                    tm.forEach(p => {
//                        console.log(game.playersFull[p]);
                    });
                } else {

                }
            });
            $('#modal').modal({
                closeExisting: true
            });
            rOb.isLead = true;
            rOb.currentRoundComplete = false;
            if (rOb.teams.length > 0) {
                renderTemplate('modaltheatre', 'facilitator.roundcompleter', rOb, () => {
                    let tl = $('.modtablinks');
                    tl.off('click');
                    tl.on('click', function () {
                        const tOb = {isLead: true, currentRoundComplete: false};
                        const id = $(this).attr('id').replace('link_', '');
                        tOb.teamObj = game.persistentData.teams[`t${id}`];
                        const pl = game.playersFull[game.teams[tOb.teamObj.id][0]];
                        tOb.game = game;
                        pl.teamObj = Object.assign({}, tOb.teamObj);
                        $('#formname').html(tOb.teamObj.title);
                        renderPartial('formzone', `game-${round.template}`, tOb, () => {
                            $('.resources-btn').css({
                                width: '30px',
                                height: '30px',
                                'background-color': 'green'
                            });
                            if (round.type === 1) {
                                window.setupAllocationControl(pl);
                            } else {
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
    const initSession = async () => {
        addToLogFeed(`initSession, session state? ${session.state}`);
        setupBaseLinks();
//        console.log(`initSession, session:`, session);
//        console.log(session);
//        const dm = await window.checkDevMode();
//        console.log('powwwwwwwwwwwwww');
//        console.log(`devMode: ${dm}`);
//        console.log(`session.state: ${session.state}`);
        if (session.state === 'started') {
            addToLogFeed('session already started, restore');
//            console.log('session already started, restore');
            restoreGame();
        } else {
//            console.log('session not started, no action');
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
        if (l !== ct.title && ct.hasOwnProperty('el')) {
            $(`#content${window.toCamelCase(ct.title)}`).html('');
        }
        window.location.hash = l.toLocaleLowerCase();
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
        return JSON.stringify(a) === JSON.stringify(b);
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
    }


    function handleChange(prop) {
//        console.log(`change detected for property ${prop}`);
        if (typeof(game.players[0]) !== 'string') {
//            console.log(`Game has changed, players updated with non-string values: ${prop}`);
//            console.log(game.players);
        }
    }

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
    }


    const sockInit = () => {
//        console.log(`sockInit`);
        const sessionID = getSessionID();
        window.socketShare(socket);
        addToLogFeed(`sessionID: ${sessionID}`);
        if (sessionID) {
            getSession(sessionID);
        }
    };
    const domInit = () => {
//        setupBaseLinks();
    };

    let renderInt = null;
    socket.on('test', () => {console.log('test')});
    socket.on('gameUpdate', (g) => {
//        console.log(`###############################################`);
//        console.log(`gameUpdate:`, g);
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
                playergraph();
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
    socket.on('playerUpdate', (ob) => {

    });
    socket.on('scoreSubmitted', (ob) => {
        // Nothing here, look for gameUpdate instead
    });
    socket.on('gameWarning', (ob) => {
        alert(ob.warning)
    });
    socket.on('gotoNext', () => {
//        console.log(`facilitatorDashboard hears gotoNext`);
        window.pEvent('next');
    });



//    window.showGame = showGame;
    renderTemplate = window.renderTemplate;
    renderPartial = window.renderPartial;
    procVal = window.procVal;
    //
    window.showGame = showGame;
    const closeModal = () => {
        $('#modal').modal('close');
        console.log('closed');
        console.log($('#modal'));
    }
    window.closeModal = closeModal;
    //
    domInit();
});

