document.addEventListener('DOMContentLoaded', function() {
//    console.log('a player');
    const socket = io('/player');
    let gID = null;
    let lID = null;
    let now = null;
    const getGames = () => {
//        console.log(`get games ${now}`);
        socket.emit('getGameCount', (g) => {
            if (g === 0) {
                if (Date.now() - now < 10000) {
                    setTimeout(getGames, 500);
                } else {
                    console.log('giving up looking for games');
                }
            } else {
//                console.log('games available');
                const initObj = {game: gID, player: localStorage.getItem(lID), fake: window.location.search.indexOf('fake', 0) > -1};
                socket.emit('regPlayer', initObj, (res) => {
                    if (res) {
                        localStorage.setItem(lID, res)
                    }
//                    console.log(`regPlayer CB, ID: ${res}`);
//                    console.log(res);
                });
            }
        });
    };
    const onConnect = () => {
        // ping the game controller until some games are available
//        console.log(gID);
        now = Date.now();
        getGames();
    };
    socket.on('playerConnect', (lid) => {
        gID = window.location.pathname;
        lID = lid;
//        socket.emit('regPlayer', localStorage.getItem(id));
        onConnect();
    })
});
