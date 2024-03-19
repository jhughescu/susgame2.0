document.addEventListener('DOMContentLoaded', function () {
    console.log('a player');
    console.log(window.location.pathname);
    //    const socket = io('/player');
    let socket = null;

    let gID = null;
    let lID = null;
    let fID = 'fid';
    let now = null;
    //    console.log(window.location);
    const qu = window.getQueries(window.location.href);
    const fake = qu.fake === 'true';
    //    console.log(fake);
    const initConnection = () => {
        let int = null;
        socket = io(window.location.pathname);
        int = setInterval(() => {
            //            console.log(socket.connected)
            if (socket.connected) {
                clearInterval(int);
                initSocket();
                console.log('connected');
                window.navigator = window.navigator || {};
                window.navigator = window.navigator || {};
                document.getElementById('replace-your-button-ID').addEventListener('click', function () {
                    navigator.vibrate(100);
                });
            }
        }, 300);
        //        console.log(`connected? ${socket.connected}`);
        //        if (socket.connected) {
        //            console.log('success');
        //            initSocket();
        //        } else {
        //            setTimeout(initConnection, 1000);
        //        }
    };
    const registerwithGame = () => {
        let ID = qu.hasOwnProperty(fID) ? qu[fID] : fake ? '' : localStorage.getItem(lID);
        console.log(`registerwithGame: ${ID} ${qu.hasOwnProperty(fID) ? '(from query)' : ''}`);
        const initObj = {
            game: gID,
            player: ID,
            fake: fake
        };
        socket.emit('regPlayer', initObj, (res) => {
            //            console.log(`regPlayer callback, res: ${res}`);
            if (res) {
                // amend for fake players
                //                console.log(res);
                if (res.indexOf('f', 0) > -1) {
                    //                    console.log(`looks like a fake, does it have ID? ${qu.hasOwnProperty(fID)}`);
                    lID = lID + res;
                    if (!qu.hasOwnProperty(fID)) {
                        //                        const newURL = new URL(window.location.href);
                        //                        newURL.searchParams.set(fID, res);
                        //                        history.pushState(null, '', newURL);
                    }
                }
                //                console.log(`add to localStorage, ${lID}: ${res}`);
                localStorage.setItem(lID, res)
            }
        });
    };

    const resetFake = () => {
        return;



        const url = new URL(window.location.href);
        console.log(`resetFake:`);
        url.searchParams.delete(fID);
        history.pushState(null, '', url);
        localStorage.clear();
    };
    window.resetFake = resetFake;
    const getGames = () => {
        socket.emit('getGameCount', (g) => {
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
        lID = lid;
        onConnect();
    };
    const teamsAssigned = (game) => {
        console.log(`teamsAssigned`)
        console.log(game);
        console.log(game.address, gID);
        console.log(game.address === gID);
        if (game.address === gID) {
            // team assignment is relevant to this game

        }
    };
    const initSocket = () => {
        socket.on('playerConnect', (lid) => {
            playerConnect(lid);
        });
        socket.on('resetAll', resetFake);
        socket.on('teamsAssigned', (game) => {
            teamsAssigned(game);
        });
    }
    initConnection()
});
