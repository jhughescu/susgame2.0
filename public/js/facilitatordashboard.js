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
    const launchFakeGenerator = () => {
//        console.log(game);
        window.open(`/fakegenerator#${game.address}`, '_blank');
    };
    const renderTeams = () => {
        let rendO = {};
        if (game) {
            const T = game.persistentData.teams;
            const t = game.teams;
//            console.log(`renderTeams`);
//            console.log(t);
            Object.values(T).forEach((el, id) => {
//                console.log(el, id)
                if (el.hasOwnProperty('id')) {
                    rendO[el.id] = {name: el.title, team: t[id].toString()}
                }
            });
//            console.log(rendO);
            window.renderTemplate('controlsInfo', 'teamsCard', rendO);
        }
    };
    const renderControls = () => {
        if (game) {
            const hasTeams = game.teams.length > 0;
            const rendO = {disableAssignTeams: hasTeams};
            window.renderTemplate('contentControls', 'facilitatorcontrols', rendO, () => {
                setupControlLinks();
                if (hasTeams) {
                    renderTeams();
                }
            });
        } else {
            console.log('no game');
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
        if (aID < bID) {
            return playerSortOrder.dir ? -1 : 1;
        } else if (aID > bID) {
            return playerSortOrder.dir ? 1 : -1;
        } else {
            return 0;
        }
    };
    const sortListTeam = (a, b) => {
        const aID = a.teamObj.title;
        const bID = b.teamObj.title;
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
    }
    const renderPlayers = (l) => {
        if (game || l) {
            let list = l ? l : Object.values(Object.assign({}, game.playersFull));
            const pso = playerSortOrder;
//            console.log(list);
            switch (pso.prop) {
                case 'index':
                    list.sort(sortListIndex);
                    break;
                case 'ID':
                    list.sort(sortListID);
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
    const assignTeams = () => {
        socket.emit('assignTeams', {address: game.address, type: 'order'}, (rgame) => {
//            console.log(rgame);
            if (typeof(rgame) === 'string') {
                alert('error assigning teams, try again');
            } else {
                addToLogFeed('teams assigned');
                console.log('ready to check');
                game = rgame;
                renderControls();
    //            renderTeams();
            }
        });
    };
    const resetTeams = () => {

        socket.emit('resetTeams', {address: game.address}, (rgame) => {
            addToLogFeed('teams reset');
            game.teams = rgame.teams;
            renderControls();
//            renderTeams();
        });
    };
    const identifyPlayers = () => {
//        console.log('identifyPlayers');
        socket.emit('identifyPlayers', game);
    };
    const setupTab = (arg) => {
//        console.log(`setupTab`)
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
        default:
            console.log(`invalid argument provided.`);
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
                const ids = ['#gameReset', '#makeFakes', '#gameEnd'];
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
        const ids = ['#assign', '#reset', '#identify', '#testRound'];
        ids.forEach(id => {
            const element = $(id);
            element.off('click').on('click', () => {
//                console.log(`a click: ${id}`)
                switch (id) {
                    case '#assign':
                        assignTeams();
                        break;
                    case '#reset':
                        resetTeams();
                        break;
                    case '#identify':
                        identifyPlayers();
                        break;
                    case '#testRound':
                        socket.emit('testRound', game.uniqueID);
                        break;
                }
            });
        });
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
//        console.log(`initSession`);
//        console.log(session);
//        renderSession();
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
        console.log(game);
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

            renderGame();
            renderPlayers();
        }
    });
    socket.on('playerUpdate', (ob) => {

    });
    socket.on('scoreSubmitted', (ob) => {
        console.log(`actions submitted by ${ob.player.teamObj.title}:`);
        console.log(`action: ${ob.action}`);
        console.log(`description: ${ob.desc}`);
        console.log(`value assigned: ${ob.score}`)
    });

//    window.showGame = showGame;
    renderTemplate = window.renderTemplate;
    procVal = window.procVal;
    domInit();
});

