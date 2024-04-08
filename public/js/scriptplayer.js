document.addEventListener('DOMContentLoaded', function() {
    console.log('a player');
    console.log(window.location.pathname);
//    const socket = io('/player');
    const socket = io();
    let gID = null;
    let lID = null;
    let fID = 'fid';
    let now = null;
    let player = null;
    let game = {};
    const renderState = {};
//    console.log(window.location);
    const qu = window.getQueries(window.location.href);
    const fake = qu.fake === 'true';
//    console.log(fake);
    const updateGame = (ob) => {
        Object.assign(game, ob);
    };
    const registerwithGame = () => {
        let ID = qu.hasOwnProperty(fID) ? qu[fID] : fake ? '': localStorage.getItem(lID);
        const initObj = {game: gID, player: ID, fake: fake, socketID: socket.id};
//        console.log(initObj);
        socket.emit('registerPlayer', initObj, (ob) => {
            if (ob) {
                let res = ob.id;
                if (ob.game) {
                    updateGame(JSON.parse(ob.game));
                    setPlayer(game);
                }
                // amend for fake players
                if (res.indexOf('f', 0) > -1) {
                    lID = lID + res;
                }
                localStorage.setItem(lID, res);
                updateRenderState(ob.renderState);
                render();
            }
        });
    };
    const getPlayerID = () => {
        let id = null;
        if (localStorage.getItem(lID)) {
            id = localStorage.getItem(lID);
        }
        let ID = qu.hasOwnProperty(fID) ? qu[fID] : fake ? '': id;
        return ID;
    };

    const resetPlayer = () => {
//        console.log(`resetFake method (no action)`)
//        return;



//        const url = new URL(window.location.href);
//        console.log(`resetFake:`);
//        url.searchParams.delete(fID);
//        history.pushState(null, '', url);
        localStorage.clear();
        updateRenderState({temp: 'game.intro'});
        render();
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
    const setPlayer = (game) => {
//        console.log(`setPlayer ${getPlayerID()}`);
//        console.log(game)
        const t = getTeam(game);
        player = game.playersFull[getPlayerID()];
//        console.log(player);
    };
    const teamsAssigned = (game) => {
        updateGame(game);
        setPlayer(game);
//        renderState = {temp: 'game.main', ob: player};
        updateRenderState({temp: 'game.main', ob: player});
        render();
    };
    const showOverlay = (id, ob) => {
        if ($('.overlay')) {
            $('.overlay').remove();
        }
        window.getTemplate('overlay', {}, (temp) => {
//            console.log('getTemplate returns:')
//            console.log(temp)
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
//        console.log(`id player ${getPlayerID()}`);
        const idOb = {id: getPlayerID(), sock: socket.id, stored: 'null'};
        if (player) {
            idOb.stored = player.socketID;
        }
        showOverlay('playerID', idOb);
    };

    // interactions
    const thisRoundScored = () => {
        return new Promise((resolve, reject) => {
            socket.emit('getScorePackets', `game-${game.uniqueID}`, (sps) => {
                const scoreSumm = sps.map(s => `${s.round}.${s.src}`);
                const rID = `${game.round}.${player.teamObj.id}`;
                const spi = scoreSumm.indexOf(rID);
                console.log(scoreSumm, rID);
//                console.log(`thisRoundScored: ${isS}`);
                resolve({hasScore: spi > -1, scorePacket: sps[spi]});
            });
        })
    }
    const setupAllocation = async () => {
        const butMinus = $('#vote_btn_minus');
        const butPlus = $('#vote_btn_plus');
        const val = $('.tempV');
        const submit = $(`#buttonAllocate`);
        const action = $(`#action-choice`);
        const desc = $(`#actionDesc`);
        const ints = $('#vote_btn_minus, #vote_btn_plus, #buttonAllocate, #action-choice, #actionDesc');
        const hasS = await thisRoundScored();
        console.log('see if the round has been scored already:');
        console.log(hasS);
        if (hasS.hasScore) {
            const vOb = {gameID: `game-${game.uniqueID}`, team: player.teamObj.id};
            socket.emit('getValues', vOb, (v) => {
                console.log('test the values')
                console.log(v)
                ints.prop('disabled', true);
                ints.addClass('disabled');
                val.html(hasS.scorePacket.val);
                desc.html(v.description);
                action.val(v.action);
            });
        } else {
            ints.off('click');
            butPlus.on('click', () => {
                let v = parseInt(val.html());
                if (v < 10) {
                    v += 1;
                    val.html(v);
                }
            });
            butMinus.on('click', () => {
                let v = parseInt(val.html());
                if (v > 1) {
                    v -= 1;
                    val.html(v);
                }
            });
            submit.on('click', () => {
                let scoreV = parseInt(val.html());
                let actionV = action.val();
                let descV = desc.val();
                if (scoreV === 0 || actionV === '' || descV === '') {
                    alert('Please complete all options and allocate at least 1 resource')
                } else {
                    const tID = player.teamObj.id;
                    let t = player.teamObj.id;
                    const vob = {game: game.uniqueID, values: {team: t, action: actionV, description: descV}};
                    socket.emit('submitValues', vob);
                    const sob = {scoreCode: {src: t, dest: t, val: scoreV}, game: game.uniqueID};
                    socket.emit('submitScore', sob, (scores) => {
                        setupAllocation();
                    });

//                    setupAllocation(false);
                }
            });
        }
    };

    const updateRenderState = (ob) => {
        if (ob) {
            console.log(`updating the renderState`);
            Object.assign(renderState, ob);
            console.log(renderState)
        }
    }
    const render = () => {
        if (typeof(renderState) === 'object') {
            const targ = renderState.hasOwnProperty('targ') ? renderState.targ : 'insertion';
            const rOb = renderState.hasOwnProperty('ob') ? renderState.ob: {};
            renderTemplate(targ, renderState.temp, rOb, () => {
//                console.log(`render callback`);
                if (renderState.hasOwnProperty('sub')) {
//                    console.log(`sub: ${renderState.sub}`)
//                    console.log(rOb)
                    renderTemplate('sub', renderState.sub, rOb, () => {
//                        console.log(`sub callback, ${renderState.sub}`);
                        switch (renderState.sub.replace('game.', '')) {
                            case 'allocation':
                                setupAllocation(true);
                        }
                    });
                }
            });
        } else {
            console.warn('rendering not possible; renderState undefined');
        }
    };
    const onGameEnd = () => {
        console.log(`onGameEnd`);
        localStorage.clear();
//        renderState = {temp: 'game.gameover', ob: {}};
        updateRenderState({temp: 'game.gameover', ob: {}});
        render();
    };
    socket.on('gameUpdate', (rgame) => {
//        console.log(`game updated: ${getPlayerID()}`)
//        console.log(rgame);
        updateGame(rgame);
        setPlayer(game);
//        renderState = {temp: 'game.main', ob: player};
        updateRenderState({temp: 'game.main', ob: player});
        render();
    });
    socket.on('test', () => {
        console.log('testing')
    });
    socket.on('playerConnect', (lid) => {
        playerConnect(lid);
    });
    socket.on('resetPlayer', resetPlayer);
    socket.on('teamsAssigned', (game) => {
//        console.log('the event')
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
//        renderState = {temp: temp, ob: ob};
        updateRenderState({temp: temp, ob: ob});
        if (rOb.hasOwnProperty('targ')) {
            renderState.targ = rOb.targ;
        }
        render();
    });
    socket.on('testRoundGONE', (game) => {
//        console.log('testRound heard');
        if (player.teamObj.hasLead && player.isLead) {
            const rOb = player.teamObj;
            rOb.currentRoundComplete = false;
            updateRenderState({sub: 'game.allocation'})
            renderTemplate(`sub`, 'game.allocation', rOb, () => {
                const butMinus = $('#vote_btn_minus');
                const butPlus = $('#vote_btn_plus');
                const val = $('.tempV');
                const submit = $(`#buttonAllocate`);
                const action = $(`#action-choice`);
                const desc = $(`#actionDesc`);
                console.log(submit)
                console.log(val.html())
                butPlus.off('click');
                butPlus.on('click', () => {
                    let v = parseInt(val.html());
                    if (v < 10) {
                        v += 1;
                        val.html(v)
                    }
                });
                butMinus.off('click');
                butMinus.on('click', () => {
                    let v = parseInt(val.html());
                    if (v > 1) {
                        v -= 1;
                        val.html(v)
                    }
                });
                submit.off('click');

                submit.on('click', () => {
                    let scoreV = parseInt(val.html());
                    let actionV = action.val();
                    let descV = desc.val();
                    const tID = player.teamObj.id;
                    let t = player.teamObj.id;
                    let ob = {scoreCode: {src: t, dest: t, val: scoreV}, game: game.uniqueID};
                    socket.emit('submitScore', ob);
                });
            });
        } else {
            console.log('not a lead')
        }
    });
    renderTemplate = window.renderTemplate;
    /*
    window.addEventListener('beforeunload', function(event) {
        // Cancel the event as stated by the standard.
        event.preventDefault();
        // Chrome requires returnValue to be set.
        event.returnValue = 'Are you sure you want to leave? You may not be able to rejoin the session.';
    });
    */
});
