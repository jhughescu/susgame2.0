document.addEventListener('DOMContentLoaded', function() {
    const socket = io('/facilitatordashboard');
    const clientData = {role: 'facilitator'};

    let session = null;

    const onConnect = () => {

//        const sID = document.getElementById('sessionID').innerHTML;
//        console.log(sID);
//        console.log(sID);
//        console.log('getSesssionWithID');
//        socket.emit('getSesssionWithID', sID);
//        socket.emit('getSesssionWithID', sID.innerHTML, (sesh) => {
//            console.log(sesh);
//        });
    };
    socket.on('connect', () => {
//        console.log('admin cnnnect');
        onConnect();

    });
    const getSessionID = () => {
        const cookies = document.cookie.split(';');
//        console.log(`getSessionID`);
        for (let cookie of cookies) {
            console.log(cookie);
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === 'sessionID') {
                return decodeURIComponent(cookieValue);
            }
        }
        return null;
    };
    const startGame = () => {
//        console.log('start');
        const id = session.uniqueID;
        const type = session.type;
        socket.emit('startGame', { id, type }, (game) => {
//            console.log('this is the game:');
//            console.log(game);
            getSession(game.gameID);
        });
    };
    const restoreGame = () => {
        console.log('restore');
    };
    const endGame = () => {
        console.log('end');
    };
    const setupLinks = () => {
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
            document.getElementById('gameLaunch').addEventListener('click', (ev) => {
                ev.preventDefault();
            });
        }
    };
    const renderSession = () => {
        window.renderTemplate('sessionCard', 'session', session);
    };
    const initSession = () => {
        renderSession();
        setupLinks();
//        console.log(`initSession`)
//        console.log(session);
//        console.log(session.state === 'started');
        if (session.state === 'started') {
            // this session has already been started, activate it so users can connect
            socket.emit('activateSession', session);
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
                    throw new Error('Failed to get session data');
                }
                return response.json();
            })
            .then(data => {
                session = data;
                session.base = window.location.origin;
                initSession();
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
    const init = () => {
        const sessionID = getSessionID();
        if (sessionID) {
            getSession(sessionID);
        }
    };
    init();
});

