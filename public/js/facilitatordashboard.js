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

    const playerSortOrder = {prop: null, dir: true, timeout: -1};
    const gameState = {disconnected: [], timeout: -1}

    socket.on('checkOnConnection', () => {
//        console.log('connected one way or another, find out if there is a game on');
        addToLogFeed('connected to app');
        sockInit();
    });
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
        socket.emit('resetSession', session.uniqueID, (rtn) => {
            if (typeof(rtn) === 'string') {
                alert(rtn);
            } else {
                console.log(`session reset`);
                session = rtn;
                renderSession();
            }
        });
    };
    const startGame = () => {
        addToLogFeed('start new game');
        if (session.state === 'pending') {
            socket.emit('preparePresentation', {sessionID: session.uniqueID, type: session.type});
            socket.emit('startGame', JSON.stringify(session), (rgame) => {
                game = rgame;
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
    const restoreGame = () => {
        socket.emit('restoreGame', JSON.stringify(session), (rgame) => {
//            console.log('restoreGame callback');
            addToLogFeed('game restore complete - game can recommence');
//            console.log(rgame);
//            console.log(rgame.assignTeams);
            game = rgame;
            renderGame();
        });
    };
    const endGame = () => {
        socket.emit('endGame', game, (rgame) => {
            //returns modified game, render this
            game = rgame;
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
                        game = rgame;
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
//        console.log(game.mainTeamSize);
//        console.log(ngame.mainTeamSize);
        Object.assign(game, ngame);
//        console.log(game.mainTeamSize);
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
    const renderPlayersV2 = () => {
        let list = game.players;
        list.forEach((p, i) => list[i] = {id: p, connected: false});
        console.log(list);
        renderTemplate('contentPlayers', 'playerlist', list, () => {

        })
    };
    const renderPlayers = (l) => {
//        console.clear();
//        console.log(`renderPlayers`)
        if (game || l) {
//            console.log(`yep - list provided? ${Boolean(l)}`);
//            console.log(game);
            let basicList = game.players;
            const pf = game.playersFull;
            basicList.forEach((p, i) => basicList[i] = {id: p, connected: false});

            let list = l ? l : basicList;
            list.forEach((p, i) => {
//                console.log(p.id)
                if (pf.hasOwnProperty(p.id)) {
//                    console.log(`ID found in PF`);
//                    console.log(pf[p.id]);
                    list[i] = pf[p.id];
                } else if (p.id.hasOwnProperty('id')) {
//                    console.log(`p.id is an object which has an ID property: ${p.id.id}`)
                    if (pf.hasOwnProperty(p.id.id)) {
//                        console.log(`yep, it should have been done`)
                        list[i] = pf[p.id.id];
                    } else {
//                        console.log(`${p.id.id} not found in PF`);
//                        console.log(pf);
                        // Seems to be a disconnected player
                        list[i] = p.id;
                    }
                } else {
//                    console.log(`not found in playersFull: ${p.id}`)
//                    console.log(p.id)
                }
            });
//            let list = l ? l : Object.values(Object.assign({}, game.playersFull));
            const pso = playerSortOrder;
//            console.log(list);
//            console.log(game);
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
//                    console.log('nosort');
            }
            list = processPlayers(list);
            clearTimeout(pso.timeout);
//            pso.timeout = setTimeout(() => {console.log(list)}, 2000);
            renderTemplate('contentPlayers', 'playerlist', list, () => {
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
                $('.warning').off('click');
                $('.warning').on('click', function () {
//                    console.log($(this));
                    // NOTE: the collection of TRs includes the header, hence adjust rowIndex below:
                    const rowIndex = $(this).closest('tr').index() - 1;
//                    console.log('Row index:', rowIndex);
//                    console.log(list)
                    alert(list[rowIndex].warningMessage)
                });

            })
        }
    };
//    const addWidget = (id, x, y, w, h, cb) => {
    const addWidget = (id, ob, cb) => {
        const wid = `#${id}`;
        const wd = $(wid);
        const rOb = {
            x: ob.x ? ob.x : 0,
            y: ob.y ? ob.y : 0,
            w: ob.w ? ob.w : 0,
            h: ob.h ? ob.h : 0,
            ob: ob.ob ? ob.ob: {}
        };
        if (wd.length === 0) {
            // (can't use 'w' in here because this block runs only when 'w' does not exist)
            $(`#overlay`).append(`<div class="widget" id="${id}"></div>`);
            $(wid).draggable();
            renderTemplate(id, 'facilitator.widget', {id: id, partialName: id}, () => {
                $(wid).css({left: `${ob.x}px`, top: `${ob.y}px`, width: `${ob.w}px`, height: `${ob.h}px`});
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
                    str += `${tms['t' + i].title}:  ${t.join(', ')} (${t.length} players)\n`;
                });
                alert(str);
            }
        });
    };
    const setTeamSize = () => {
//        console.log(`setTeamSize`);
        const gameID = `game-${game.uniqueID}`;
        const n = parseInt($('#teamInput').val());
//        console.log({ gameID, n });
        socket.emit('setTeamSize', { gameID, n }, (rgame) => {
//            console.log(`setTeamSize callback:`);
//            console.log(rgame);
//            game = Object.assign(game, rgame);
            updateGame(rgame);
//            console.log(game);
            renderControls();
            playergraph();
//            window.location.reload();
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
                game = rgame;
                renderControls();
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
            game = rgame;
            renderControls();
//            renderTeams();
        });
    };
    const identifyPlayers = () => {
//        console.log('identifyPlayers');
        socket.emit('identifyPlayers', game);
    };

    const setupTab = (arg) => {
//        console.log(`setupTab: ${arg}`)
        switch (arg) {
        case 'session':
            renderSession();
            setupSessionLinks();
            break;
        case 'game':
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
        default:
            console.log(`setupTab: invalid argument provided.`);
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
        tab.css({color: hlColour}).delay(del).animate({color: colin}, timer).animate({color: hlColour}, 10).delay(del).animate({color: colin}, timer).animate({color: hlColour}, 10).delay(del).animate({color: colin}, timer);
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
        const ids = ['#preview', '#resize', '#assign', '#reset', '#identify', '#startRound', '#checkRound', '#slideshow'];
        const rSel = $('#contentControls').find('.buttonSet').find('button');
        const rVal = $('#roundInput');
//        console.log(rSel);
        ids.forEach(id => {
            const element = $(id);
            element.off('click').on('click', () => {
//                console.log(`click ${id}`)
                switch (id) {
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
                        const r = parseInt($('#roundInput').val());
                        socket.emit('startRound', {gameID: game.uniqueID, round: r});
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
    const launchSlideshowControls = () => {
//        console.log(game);
//        console.log(game.presentation.slideData);
        addWidget('facilitator-slideshow-controls', {x: 400, y: 200, w: 600, h: 600}, () => {
            window.slideContolsInit(game);
        });
    };
    setTimeout(() => {
        launchSlideshowControls();
    }, 500);
    const showScoreSummary = (summ, teams) => {
        let str = 'Team submitted score:\n\n';
        teams.forEach((t, i) => {
            str += `${t.title}? ${summ[i]}\n`
        });
        alert(str);
    };
    const renderSession = () => {
        addToLogFeed(`renderSession (see console)`);
        console.log(`renderSession`);
        console.log(session);
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
        addToLogFeed(`renderGame`);
        const targ = 'contentGame';
        window.setupObserver(targ, () => {
            setupGameLinks();
        });
        // Render the game object excluding the persistent data
        let rOb = {game: window.copyObjectWithExclusions(game, ['persistentData', 'playersFull'])};
        rOb.gameInactive = rOb.game.state !== 'started';
        if (clear) {
            $(`#${targ}`).html('');
        } else {
            window.renderTemplate(targ, 'gameCard', rOb, () => {
    //            console.log('the renderTemplate callback');
            });
        }
    };
    const initSession = () => {
        addToLogFeed(`initSession, session state? ${session.state}`);
        setupBaseLinks();
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
//        console.log(l)
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

    const sockInit = () => {
//        console.log(`sockInit`)
        const sessionID = getSessionID();
        addToLogFeed(`sessionID: ${sessionID}`);
        if (sessionID) {
            getSession(sessionID);
        }
    };
    const domInit = () => {
//        setupBaseLinks();
    };

    socket.on('test', () => {console.log('test')})
    socket.on('gameUpdate', (g) => {
        const pv = procVal;
//        console.log(`attempt to update the game, ${pv(g.uniqueID)}, ${pv(getSessionID())}`);
        // As there currently is no game-specific Facilitator room/namespace a conditional is required:
        if (pv(g.uniqueID) === pv(getSessionID())) {
            addToLogFeed('gameUpdate');
            game = g;
//            console.log(game)

            renderGame();
            renderPlayers();
            playergraph();
        }
    });
    socket.on('playerUpdate', (ob) => {

    });
    socket.on('scoreSubmitted', (ob) => {
//        console.log(`score submitted by ${ob.player.teamObj.title}:`);
        console.log(ob);
//        console.log(`action: ${ob.action}`);
//        console.log(`description: ${ob.desc}`);
//        console.log(`value assigned: ${ob.score}`)
    });
    socket.on('gameWarning', (ob) => {
        alert(ob.warning)
    });


//    window.showGame = showGame;
    renderTemplate = window.renderTemplate;
    procVal = window.procVal;
    //
    window.showGame = showGame;
    //
    domInit();
});

