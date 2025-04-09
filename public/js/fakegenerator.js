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
    let game = null;
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
    const getQR = () => {
        const c = countFakes();
        console.log(`getQR, ${c} fake${c === 1 ? '' : 's'} registered`);
        if (!isNaN(c)) {
            const url = `${game.localDevAddress}${game.address}?fake=true&fid=pf${c + 1}`;
            $('#qroverlay').html('');
            socket.emit('getQrString', url, (str) => {
                console.log(`update QR to ${url}`);
                const qrstr = `${url}${str}`;
                $('#qroverlay').html(qrstr);
            });
        }
    };
    const showQR = () => {};
    const countFakes = () => {
        let c = null;
        const g = game;
        if (g) {
            c = g.players.filter(p => p.includes('f')).length;
        }
        return c;
    };
    const countFakesV1 = () => {
        let c = null;
        const g = game;
        if (g) {
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
            c = p.length;
        }
        return c;
//        console.log(`we currently have ${c} fake player${c === 1 ? '': 's'}`);
    };
    const onGameUpdate = () => {
        console.log(`game update, number of fakes: ${countFakes()}`);
        console.log(game.players);
        console.log(game.playersFull);
        getQR();
    };
    socket.on('checkOnConnection', () => {
        socket.emit('getGame', gameID, (g) => {
            game = g;
            onGameUpdate();
        });
    });
    socket.on('gameUpdate', (o) => {
        game = o;
        onGameUpdate();
    });
    window.launchFakes = launchFakes;
    window.reopenFakes = reopenFakes;
    window.checkInputType = checkInputType;

});
