document.addEventListener('DOMContentLoaded', function() {
    const socket = io('/facilitatordashboard');
    const clientData = {role: 'facilitator'};

    // logFeed is an array of messages to be revealed to the client
    const logFeed = [];
    const logFeedArchive = [];

    let session = null;
    let game = null;


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
    const startGame = () => {
        addToLogFeed('start new game');
        socket.emit('startGame', JSON.stringify(session), (rgame) => {
            game = rgame;
            addToLogFeed('game ready');
            getSession(game.uniqueID, () => {
//                console.log('game cb');
            });
            renderGame();
        });
    };
    const restoreGame = () => {
        socket.emit('restoreGame', JSON.stringify(session), (rgame) => {
            console.log('restoreGame callback');
            addToLogFeed('game restore complete - game can recommence');
            console.log(rgame);
            console.log(rgame.assignTeams);
            game = rgame;
            renderGame();
        });
    };
    const endGame = () => {
        console.log('end');
    };
    const resetGame = () => {
        const id = game.uniqueID;
        addToLogFeed(`resetting game ${id}`);
        socket.emit('resetGame', id, (rs) => {
//            console.log('resetGame callback');
//            console.log(rs);
            session = rs;
            renderSession();
        });
    };
    const launchFakeGenerator = () => {
        window.open(`/fakegenerator#${game.address}`, '_blank');
    };
    const setupTab = (arg) => {
        switch (arg) {
        case 'session':
            setupSessionLinks();
            break;
        case 'game':
            setupGameLinks();
            break;
        case 'controls':
            window.renderTemplate('contentControls', 'facilitatorcontrols', {}, () => {
                setupControlLinks();
            });

            break;
        default:
            console.log(`invalid argument provided.`);
    }

    }
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
            openTab(t);
        }, 200);
    };
    const setupSessionLinks = () => {
//        console.log('setupSessionLinks');
        addToLogFeed('setupSessionLinks');
        let sg = $('#gameStart');
        let gl = $('#gameLaunch');
        $('.link').off('click');
        sg.on('click', startGame);
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
        const rg = $('#gameReset');
        const mf = $('#makeFakes');
        $('.link').off('click');
        $('.mf').off('click');
        rg.on('click', resetGame);
        mf.on('click', launchFakeGenerator);
    };
    const setupControlLinks = () => {
        const al = $('#assign');
//        console.log(al);
        al.off('click');
        al.on('click', () => {
//            console.log(game.persistentData)
            console.log(game);
            socket.emit('assignTeams', {address: game.address, type: 'order'}, (game) => {
//                console.log('yep');
                console.log(game);
            });
//            console.log(game.assignTeams())
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
            $('#gameRestore').addClass('disabled');
            $('#gameEnd').addClass('disabled');
//            obs.disconnect();
        });
        window.renderTemplate(targ, 'sessionCardFacilitator', session, () => {
//            console.log('the renderTemplate callback');
        });
    };
    const renderGame = () => {
        addToLogFeed(`renderGame`);
        const targ = 'contentGame';
        window.setupObserver(targ, () => {
//            console.log('mutationObserver detects change in sessionCard');
            setupGameLinks();
        });
        // Render the game object excluding the persistent data
        window.renderTemplate(targ, 'gameCard', window.copyObjectWithExclusions(game, 'persistentData'), () => {
//            console.log('the renderTemplate callback');

        });
    };
    const initSession = () => {
        addToLogFeed(`initSession, session state? ${session.state}`);
        console.log(`initSession`);
        console.log(session);
        renderSession();
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
    }

    const sockInit = () => {
        const sessionID = getSessionID();
        addToLogFeed(`sessionID: ${sessionID}`);
        if (sessionID) {
            getSession(sessionID);
        }
    };
    const domInit = () => {
        setupBaseLinks();
    };

//    window.clearLogFeed = clearLogFeed;
    window.setupBaseLinks = setupBaseLinks;
    socket.on('gameUpdate', (g) => {
        addToLogFeed('gameUpdate');
//        console.log(g);
//        console.log(window.copyObjectWithExclusions(g, 'persistentData'));

//        console.log(JSON.stringify(g));
        game = g;
        renderGame();
    });
    domInit();
});

