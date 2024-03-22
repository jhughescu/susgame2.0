document.addEventListener('DOMContentLoaded', function() {
    console.log('a player');
    console.log(window.location.pathname);
//    const socket = io('/player');
    const socket = io();
    let gID = null;
    let lID = null;
    let fID = 'fid';
    let now = null;
    let renderState = null;
//    console.log(window.location);
    const qu = window.getQueries(window.location.href);
    const fake = qu.fake === 'true';
//    console.log(fake);
    const registerwithGame = () => {
        let ID = qu.hasOwnProperty(fID) ? qu[fID] : fake ? '': localStorage.getItem(lID);
        console.log(`registerwithGame: ${ID} ${qu.hasOwnProperty(fID) ? '(from query)' : ''}`);
        const initObj = {game: gID, player: ID, fake: fake};
        socket.emit('registerPlayer', initObj, (ob) => {
            if (ob) {
                console.log(ob)
                let res = ob.id;
                // amend for fake players
                console.log(`registerPlayer callback, res: ${res}`);
                if (res.indexOf('f', 0) > -1) {
                    lID = lID + res;
                }
                localStorage.setItem(lID, res);
                renderState = ob.renderState;
//                getTeamIndex();
                render();
            }
        });
    };
    const getPlayerID = () => {
        let id = null;
        if (localStorage.getItem(lID)) {
            id = localStorage.getItem(lID);
        }
        return id;
    };

    const resetFake = () => {
        console.log(`resetFake method (no action)`)
        return;



        const url = new URL(window.location.href);
        console.log(`resetFake:`);
        url.searchParams.delete(fID);
        history.pushState(null, '', url);
        localStorage.clear();
    };
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
    const getTeam = (game) => {
        const id = getPlayerID();
        const arr = game.teams;
        let ti = -1;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].includes(id)) {
                ti = i;
                break;
            }
        }
//        console.log(`ti ${ti}`);
//        console.log(game.persistentData.teams)
        const t = game.persistentData.teams[`t${ti}`];
//        console.log(t)
        return t;
    };
    console.log('why oh why');
    const teamsAssigned = (game) => {
        const t = getTeam(game);
        console.log(`teamAssigned`);
        console.log(t);
//        renderState = {temp: 'game.main', ob: {team: t.title}};
        renderState = {temp: 'game.main', ob: {teamObj: t}};
        render();
    };
    const showOverlay = (id, ob) => {
        if ($('.overlay')) {
            $('.overlay').remove();
        }
        window.getTemplate('overlay', {}, (temp) => {
            $('body').append(temp);
            window.renderTemplate('overlay', id, ob, () => {
                $('.overlay').fadeIn(300).delay(2000).fadeOut(1000);
            });
        })
//        $('body').append(window.getTemplate('overlay', {}, (temp) => {
////            window.renderTemplate('overlay', id, ob, () => {
////
////            });
//        }));
    }
    const identifyPlayer = () => {
        console.log(`id player ${getPlayerID()}`);
        showOverlay('playerID', {id: getPlayerID()});
    };

    const render = () => {
        if (typeof(renderState) === 'object') {
            const targ = renderState.hasOwnProperty('targ') ? renderState.targ : 'insertion';
            const rOb = renderState.hasOwnProperty('ob') ? renderState.ob: {};
            console.log(`call renderTemplate`);
            console.log(targ);
            console.log(renderState.temp);
            console.log(rOb);
            window.renderTemplate(targ, renderState.temp, rOb);
        } else {
            console.warn('rendering not possible; renderState undefined');
        }
    };
    const onGameEnd = () => {
        console.log(`onGameEnd`);
        localStorage.clear();
        renderState = {temp: 'game.gameover', ob: {}};
        render();
    };

    socket.on('playerConnect', (lid) => {
        playerConnect(lid);
    });
    socket.on('resetAll', resetFake);
    socket.on('teamsAssigned', (game) => {
        teamsAssigned(game);
    });
    socket.on('identifyPlayer', () => {
        identifyPlayer();
    });
    socket.on('gameOver', () => {
        console.log(`gameOver heard`);
        onGameEnd();
    });
    socket.on('renderPlayer', (rOb) => {
        const ob = rOb.hasOwnProperty(ob) ? rOb.ob : {};
        const temp = rOb.temp;
        renderState = {temp: temp, ob: ob};
        if (rOb.hasOwnProperty('targ')) {
            renderState.targ = rOb.targ;
        }
        render();
    });
    /*
    window.addEventListener('beforeunload', function(event) {
        // Cancel the event as stated by the standard.
        event.preventDefault();
        // Chrome requires returnValue to be set.
        event.returnValue = 'Are you sure you want to leave? You may not be able to rejoin the session.';
    });
    */
});
