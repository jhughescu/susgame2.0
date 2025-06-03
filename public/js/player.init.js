import { onGameUpdate, onPlayerUpdate, updateGame } from './player.game.js';
import { render, identifyPlayer, updateRenderState } from './player.view.js';
import { player, onPlayerUpdate as onPlayerStateUpdate, game } from './player.state.js';
import { initSocket, getSocket } from './player.socket.js';
import { getAppID, registerClearStorage } from './player.storage.js';
import {} from './player.controller.js';


document.addEventListener('DOMContentLoaded', function() {
    const APPID = getAppID();
    let socket, gId, pId, lId, lIdStub;
    let qu = window.getQueries();
    const fake = qu.fake === 'true';
    const setupSocket = () => {
        socket.on('gameUpdate', onGameUpdate);
        socket.on('playerUpdate', onPlayerUpdate);
        socket.on('playerConnect', () => registerWithGame());
        socket.on('identifyPlayer', () => identifyPlayer(pId, gId));
        socket.on('identifySinglePlayer', (pl) => {
            if (pl === player.id) identifyPlayer();
        });
        socket.on('forceRefresh', () => window.location.reload());
        socket.on('forceClose', () => window.close());
        socket.on('renew', (G) => {
            console.log('request to renew playerdata (requires identification)', G);
            onGameUpdate(G);
        });
        socket.on('playerRemoved', onRemoval);
        socket.on('onGameRestored', () => {
//            console.log('game has been restored', player.teamObj === null);
//            console.log(player);
//            console.log(game);
            if (player.teamObj === null) {
                registerWithGame();
            }
        });
        socket.on('waitForGame', () => {
    //        console.log('waitForGame - connected but no game, try again in a minute');
//            console.log(`I connected before the game was ready, what to do?`);
            setTimeout(() => {
//                console.log('I will register again');
//                window.location.reload();
                registerWithGame();
            }, 1000);
        });
    };
    const setupSocketV1 = () => {
//        console.log('############################### setup socket events');
        socket.on('gameUpdate', (rOb) => {
            onGameUpdate(rOb);
        });
        socket.on('playerUpdate', (rOb) => {
            onPlayerUpdate(rOb);
        });
        socket.on('playerConnect', (id) => {
            console.log(`playerConnect event`);
            registerWithGame();
        });

        socket.on('identifyPlayer', () => {
            identifyPlayer(pId, gId);
        });
        socket.on('identifySinglePlayer', (pl) => {
    //        console.log(`id me: ${pl}, ${player.id}`);
            if (pl === player.id) {
                identifyPlayer();
            }
        });
        socket.on('forceRefresh', () => {
    //        console.log('make me refresh');
            window.location.reload();
    //        console.log(`I feel refreshed`)
        });
        socket.on('playerRemoved', (ob) => {
//            console.log('remooov');
//            console.log(ob);
            onRemoval(ob);
        });
    };
    const estSocket = () => {
//        console.log('############################### est socket');
//        socket = io();
        socket = initSocket();
        setupSocket();
    };
    const getStoreString = () => {
//        console.log(qu);
//        return `${APPID}-${gId}`;
        return `${APPID}-${gId}${fake ? '-' + qu.fid : ''}`;
    };
    const getStoredID = () => {
        const o = {hasID: false};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const vals = [APPID, gId, ...(fake ? [pId] : [])];

            if (key && vals.every(v => key.includes(v))) {
                o.hasID = true;
                o.key = key;
                o.value = localStorage.getItem(key);
            }
        }
//        console.log(o);
        return o;
    };
    const clearStorage = () => {
        localStorage.removeItem(getStoreString());
    };
    const storeID = (id) => {
        if (!getStoredID().hasID) {
            // must only ever happen once
            localStorage.setItem(getStoreString(), id);
        }
    };
    const registerWithGame = () => {
//        console.log(`registerWithGame`);
        const socket = getSocket();
        const initObj = {game: gId, player: pId, fake: fake, socketID: socket.id};
        socket.emit('registerPlayer', initObj, (ob) => {
            storeID(ob.id);
            const nogame = window.clone(ob);
            delete nogame.game;
            if (ob.game) {
                ob.game = JSON.parse(ob.game);
                if (ob.game.round) {
                    ob.game.round = justNumber(ob.game.round);
                }
                updateGame(ob.game);
                setPlayer(ob.game);
                render(ob.renderState);
            }
        });
    };
    const onPlayerStateUpdate = ((key, value) => {
        console.log(`player.${key} changed to:`, value);
        showPlayerInfo();
    });
    const setPlayer = (fgame) => {
//        console.log(`setPlayer will create the player object:`);
        const index = game.teams.findIndex(inner => inner.includes(pId));
        const t = game.persistentData.teamsArray[index];
        const newPlayer = fgame.playersFull[pId];
        if (player) {
//            console.log('player exists');
            if (Boolean(player.teamObj) && Boolean(newPlayer.teamObj)) {
                if (player.teamObj.id !== newPlayer.teamObj.id || player.isLead !== newPlayer.isLead) {
//                    window.location.reload();
                }
            }
        } else {
            console.log('player does not exist');
        }

        Object.assign(player, newPlayer);
//        console.log(player);
    };
    const onRemoval = (ob) => {
        // This is serious, better do some serious checking:
        const isGame = ob.game === game.address;
        const isSocket = ob.sock === player.socketID;
        const isPlayer = ob.player === player.id;
        const isDef = isGame && isSocket && isPlayer;
//        console.log(isGame, isSocket, isPlayer, isDef);
        if (isDef) {
            clearStorage();
            $('body').html('I have been removed');
//            console.log(ob);
            if (ob.alsoClose) {
                window.close();
            } else {
                toRemovedAddress();
            }
        }
    };
    const toRemovedAddress = () => {
        // on removal player should be sent to non-game url
        window.location.replace(`${window.location.origin}/removed`);
    };
    const init = () => {
        gId = window.location.pathname;
        if (gId.includes('game-')) {
            if (qu.hasOwnProperty('fid')) {
                pId = window.getQueries().fid;
            }
            estSocket();
        } else {
            // wrong URL condition
        }
    };
    init();
    registerClearStorage(clearStorage);
});
