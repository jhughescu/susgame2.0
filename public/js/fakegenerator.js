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
    const fakeNum = $('#num');
    const fakeRange = {min: 1, max: 40};
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
    };
    const indexSort = (a, b) => {
        let rn = 0;
        const sortVal = 'index';
        if (a[sortVal] < b[sortVal]) {
            rn = -1;
        } else if (a[sortVal] > b[sortVal]) {
            rn = 1;
        }
        return rn;
    };
    function reopenFakes(event) {
        event.preventDefault();
        socket.emit('getGame', gameID, (g) => {
            const pb = g.players;
            const pf = g.playersFull;
            const p = []
            pb.forEach(pl => {
                if (pf.hasOwnProperty(pl)) {
                    if (!pf[pl].connected) {
                        p.push({id: pl});
                    }
                } else {
                    p.push({id: pl});
                }
            });
//            console.log(pt);
            if (p.length === 0) {
                alert('all registered fakes already open');
                return;
            } else {
                const sure = confirm(`This will reopen ${p.length} fake client${p.length > 1 ? 's' : ''}, continue?`);
                if (sure) {
                    p.forEach((pl, i) => {
                        setTimeout(() => {
                            window.open(`${gameID}?fake=true&fid=${pl.id}`, '_blank');
                        }, (i * 200));
                    });
                }
            }

        });
    }
    function launchFakes(event) {
        event.preventDefault();
        const num = parseInt(document.getElementById('num').value);
        let top = 0;
        socket.emit('getGame', gameID, (game) => {
            if (game) {
                let p = game.players.filter(item => item.includes('f')).map(item => parseInt(item.replace('pf', ''))).sort(rsort).sort(nsort);
                if (p.length > 0) {
                    top = p[p.length - 1] + 1;
                }
                for (let i = 0; i < num; i++) {
                    const d = (i + 1) * 500;
                    setTimeout(() => {
                        window.open(`${gameID}?fake=true&fid=pf${top + i}`, '_blank');
                    }, d);
                }
            } else {
                console.log(`no game "${gameID}" found`);
            }
        });

    }
    const checkInputType = () => {
//        console.log(fakeNum);
//        console.log(parseInt(fakeNum.val()));
        if (fakeNum.val() < fakeRange.min) {
            fakeNum.val(fakeRange.min)
        }
        if (fakeNum.val() > fakeRange.max) {
            fakeNum.val(fakeRange.max)
        }
    }

    socket.on('checkOnConnection', () => {
        //
    });
    socket.on('', () => {
        //
    });

    window.launchFakes = launchFakes;
    window.reopenFakes = reopenFakes;
    window.checkInputType = checkInputType;

});
