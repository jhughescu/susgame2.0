document.addEventListener('DOMContentLoaded', function() {
    const gameID = window.location.hash.replace('#', '').replace(/\?.*$/, '');
    const clientId = sessionStorage.getItem('clientId') || crypto.randomUUID();
    sessionStorage.setItem('clientId', clientId);
//    console.log(sessionStorage.getItem('clientId'));
    const socket = io('', {
        query: {
//            role: 'facilitator',
            role: 'fakegen',
            type: 'fakeGenerator',
            id: gameID,
            clientId: clientId
        }
    });
    const fakeNum = $('#num');
    const fakeRange = {min: 1, max: 40};
    let game = null;
    let myFakes;
    let fCount;
    let fakegenID;
    let launchType;
    const fakeStep = 40;
    let fDatum = parseInt(window.getQueries().start || 0);
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
    const updateMyFakes = () => {
        sessionStorage.setItem(getStoreID(), JSON.stringify(myFakes));
    };
    const reopenFakes = (event) => {
        event.preventDefault();
        showMyFakes();
        const closed = myFakes.filter(f => f.s === 2);
        if (closed.length > 0) {
            const conf = confirm(`This will reopen ${closed.length} fake player${closed.length > 1 ? 's' : ''}, are you sure you want to do this?`);
            if (conf) {
                launchType = 2;
                launchFake();
            }
        } else {
            alert('no closed fakes');
        }
    };
    function reopenFakesV1(event) {
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
    };
    const clearFakes = (ev) => {
        ev.preventDefault();
        const closed = myFakes.filter(f => !f.o);
        myFakes = myFakes.filter(f => f.o);
        sessionStorage.setItem(getStoreID(), JSON.stringify(myFakes));
        showMyFakes();
    }

    const launchFake = () => {
//        const unopened = myFakes.filter(f => f.o === false);
        const unopened = myFakes.filter(f => f.s === launchType);
        const nextF = unopened[0];
        if (unopened.length) {
            const pId = `pf${(fakegenID * fakeStep) + nextF.n}`;
            const lId = `${gameID}?fake=true&fid=${pId}`;
//            console.log('next to launch: ', nextF, lId);
            nextF.o = true;
            nextF.s = 1
            nextF.p = pId;
            updateMyFakes();
            window.open(lId, '_blank');
            setTimeout(launchFake, 300 + (Math.random() * 400));
        } else {
            $('#fakeForm').find('button').attr('disabled', false);
        }
    };
    const launchFakes = (event) => {
        event.preventDefault();
        $('#fakeForm').find('button').attr('disabled', true);
        fCount = parseFloat($('#num').val());
        const n = myFakes.length ? myFakes[myFakes.length - 1].n : 0;
        for (let i = 0; i < fCount; i++) {
            myFakes.push({n: i + n + 1, o: false, s: 0});
        }
//        console.log(myFakes.slice(0));
//        return;
        showMyFakes();
        launchType = 0;
        launchFake();
    };
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
        if (!isNaN(c) && game !== null) {
            const url = `${window.isLocal() ? game.localDevAddress : window.location.origin}${game.address}?fake=true&fid=pf${c + 1}`;
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
        if (!game) return 0;
        if (game.players.length === 0) return 0;
        const pMax = Math.max(...game.players.map(p => window.justNumber(p)));
        return pMax;
    };
    const countFakesV2 = () => {
        let c = null;
        const g = game;
        if (g) {
            c = g.players.filter(p => p.includes('f')).length;
        }
        const pMax = Math.max(...g.players.map(p => window.justNumber(p)));
        console.log(`max fake: ${pMax}`);
//        return c;
        return pMax;
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
//        console.log(`game update, number of fakes: ${countFakes()}`);
//        console.log(game.players);
//        console.log(game.playersFull);
        getQR();
    };
    const getStoreID = () => {
        // use only fater checkOnConnection
        return `fakegen-${gameID}-${fakegenID}-fakes`;
    };
    const showMyFakes = () => {
        if (myFakes.length) {
//            console.log('here are the fakes:')
//            myFakes.forEach(f => console.log(window.clone(f)));
        } else {
            console.log('no fakes exist')
        }
    };

    socket.on('checkOnConnection', (o) => {
//        console.log('connex', o);
        fakegenID = o.fakegenID;
        myFakes = sessionStorage.getItem(getStoreID()) || [];
        myFakes = typeof(myFakes) === 'string' ? JSON.parse(myFakes) : myFakes;
//        const baseTitle = document.title.replace(/(\d+\)$\s\/, '');
        const baseTitle = document.title.replace(/^\(\d+\)\s*/, '');
        document.title = `(${fakegenID}) ${baseTitle}`;
        const baseH = $('H1').html().replace(/^\(\d+\)\s*/, '');
        $('H1').html(`(${fakegenID}) ${baseH}`);
        $('H1').css({'font-size': '2rem'})
//        console.log(getStoreID());
//        console.log(myFakes);
        socket.emit('getGame', gameID, (g) => {
            game = g;
            onGameUpdate();
        });
    });
    socket.on('gameUpdate', (o) => {
        game = o;
        onGameUpdate();
//        console.log(o);
    });
    socket.on('playerRemoved', (o) => {
        const my = myFakes.filter(p => p.p === o.player)[0];
        my.o = false;
        my.s = 2;
        console.log(`playerRemoved`, o);
//        console.log(myFakes);
//        console.log(my);
        showMyFakes();
        updateMyFakes();
    })
    window.launchFakes = launchFakes;
    window.reopenFakes = reopenFakes;
    window.clearFakes = clearFakes;
    window.checkInputType = checkInputType;

});
