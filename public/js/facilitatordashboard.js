document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    const clientData = {role: 'facilitator'};
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
    socket.on('connectedDB', () => {
//        console.log('database ready')
    });
    socket.on('dbReady', (boo) => {
//        console.log(`database ready? ${boo}`)
    });
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
                console.log(data);
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

