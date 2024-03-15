document.addEventListener('DOMContentLoaded', function() {
//    console.log('a player');
    const socket = io('/player');
    let gID = null;
    let lID = null;
    let fID = 'fid';
    let now = null;
//    console.log(window.location);
    const qu = window.getQueries(window.location.href);
    const fake = qu.fake === 'true';
//    console.log(fake);
    const registerwithGame = () => {
        let ID = qu.hasOwnProperty(fID) ? qu[fID] : fake ? '': localStorage.getItem(lID);
        console.log(`registerwithGame: ${ID}`);
        const initObj = {game: gID, player: ID, fake: fake};
        socket.emit('regPlayer', initObj, (res) => {
            console.log(`regPlayer callback, res: ${res}`);
            if (res) {
                // amend for fake players
                console.log(res);
                if (res.indexOf('f', 0) > -1) {
                    console.log(`looks like a fake, does it have ID? ${qu.hasOwnProperty(fID)}`);
                    lID = lID + res;
                    if (!qu.hasOwnProperty(fID)) {
                        const newURL = new URL(window.location.href);
                        newURL.searchParams.set(fID, res);
                        history.pushState(null, '', newURL);
                    }
                }
                localStorage.setItem(lID, res)
            }
        });
    };

    const resetFake = () => {
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
    socket.on('playerConnect', (lid) => {
        playerConnect(lid);
    });
    socket.on('resetAll', resetFake);
});
