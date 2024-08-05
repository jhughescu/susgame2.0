document.addEventListener('DOMContentLoaded', function() {
    const gameID = window.location.hash.replace('#', '');
    const socket = io('', {
        query: {
            role: 'displaygame',
            id: gameID
        }
    });
    const processGame = (g) => {
        const rg = {};
        for (let i in g) {
            if (typeof(g[i]) !== 'object') {
                rg[i] = g[i];
            }
        }
        return rg;
    };
    const showStuff = (g) => {
        console.log(g);
        const pg = processGame(g);
        window.renderTemplate('content', 'displaygame', {game: pg, scores: g.scores});
    };
    const init = () => {
        socket.emit('getGame', `/${gameID}`, (id, game) => {
            showStuff(game);
        });
    };
    socket.on('gameUpdate', (g) => {
        showStuff(g);
    });
    init();
});
