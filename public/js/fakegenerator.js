document.addEventListener('DOMContentLoaded', function() {
    const gameID = window.location.hash.replace('#', '');
    const socket = io('', {
        query: {
            role: 'facilitator',
            type: 'fakeGenerator',
            id: gameID
//            session: session
        }
    });
    socket.on('checkOnConnection', () => {
    });
    function rsort () {
        return Math.floor(Math.random() * 3) - 1;
    }

    const nsort = (a, b) => {
        let rn = 0;
        if (a < b) {
            rn = -1;
        } else if (a > b) {
            rn = 1;
        }
        return rn;
    }
    function launchFakes(event) {
        event.preventDefault();
        const num = parseInt(document.getElementById('num').value);
        let top = 0;
        socket.emit('getGame', gameID, (game) => {
//            console.log('i got a game');
//            console.log(game.players);
            if (game) {
                let p = game.players.filter(item => item.includes('f')).map(item => parseInt(item.replace('pf', ''))).sort(rsort).sort(nsort);
    //            console.log(p);
                if (p.length > 0) {
                    top = p[p.length - 1] + 1;
                }
                console.log(top);
                for (let i = 0; i < num; i++) {
                    const d = (i + 1) * 500;
                    setTimeout(() => {
        //                console.log(`a launch ${d}`);
                        window.open(`${gameID}?fake=true&fid=pf${top + i}`, '_blank');
                    }, d);
        //            window.open(`${gameID}?fake=true`, '_blank');
                }
            } else {
                console.log(`no game "${gameID}" found`);
            }
        });

    }
    const checkInputType = () => {

    }
    window.launchFakes = launchFakes;
    window.checkInputType = checkInputType;
});
