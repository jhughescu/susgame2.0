document.addEventListener('DOMContentLoaded', function() {
    const socket = io('/facilitatordashboard');
    const clientData = {role: 'facilitator'};

    // logFeed is an array of messages to be revealed to the client
    const logFeed = [];

    let session = null;
    let game = null;


    socket.on('checkOnConnection', () => {
//        console.log('connected one way or another, find out if there is a game on');
        addToLogFeed('connected to app');
        init();
    });
    const addToLogFeed = (msg) => {
        logFeed.push(`${logFeed.length + 1}: ${msg}`);
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
                console.log('game cb');
//                renderGame();
            });
        });
    };
    const restoreGame = () => {
//        console.log('restore');
//        console.log(JSON.parse(JSON.stringify(session)));
        socket.emit('restoreGame', JSON.stringify(session), (rgame) => {
            console.log('restoreGame callback');
//            console.log(game);
            addToLogFeed('game restore complete - game can recommence');
//            console.log(rgame);
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
    const setupLinks = () => {
//        console.log('setupLinks');
        let sg = $('#gameStart');
        let rg = $('#gameRestore');
        let eg = $('#gameEnd');
        let gl = $('#gameLaunch');
        $('.link').off('click');
        sg.on('click', startGame);
        rg.on('click', restoreGame);
        eg.on('click', endGame);
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
        $('.link').off('click');
        rg.on('click', resetGame);
    };
    const renderSession = () => {
        window.setupObserver('sessionCard', () => {
//            console.log('mutationObserver detects change in sessionCard');
            setupLinks();
            $('#gameRestore').addClass('disabled');
            $('#gameEnd').addClass('disabled');
//            obs.disconnect();
        });
        window.renderTemplate('sessionCard', 'sessionCardFacilitator', session, () => {
//            console.log('the renderTemplate callback');
        });
    };
    const renderGame = () => {
        window.setupObserver('sessionCard', () => {
//            console.log('mutationObserver detects change in sessionCard');
            setupGameLinks();
        });
        // Render the game object excluding the persistent data
        window.renderTemplate('sessionCard', 'gameCard', window.copyObjectWithExclusions(game, 'persistentData'), () => {
//            console.log('the renderTemplate callback');

        });
    };
    const initSession = () => {
        renderSession();
//        renderGame();
        if (session.state === 'started') {
            addToLogFeed('session already started, restore');
            restoreGame();
//            renderSession();
        }
    }
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
    }
    const init = () => {
        const sessionID = getSessionID();
        addToLogFeed(`sessionID: ${sessionID}`);
        if (sessionID) {
            getSession(sessionID);
        }
    };

    socket.on('gameUpdate', (g) => {
//        console.log('gameUpdate');
//        console.log(g);
//        console.log(window.copyObjectWithExclusions(g, 'persistentData'));

//        console.log(JSON.stringify(g));
        game = g;
        renderGame();
    });
    init();
});

