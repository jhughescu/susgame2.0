import { onGameUpdate, onPlayerUpdate, updateGame } from './player.game.js';
import { render, identifyPlayer, updateRenderState, renderTemplateMain } from './player.view.js';
import { player, onPlayerUpdate as onPlayerStateUpdate, game } from './player.state.js';
import { initSocket, getSocket } from './player.socket.js';
import { getAppID, registerClearStorage } from './player.storage.js';
import {} from './player.controller.js';










export function initPlayerApp(sock) {
    const APPID = getAppID();
    let gId, pId, lId, lIdStub;
    let qu = window.getQueries();
    const socket = sock;
    console.log(`initPlayerApp`, socket);
//    console.log(sock);
//    console.log(socket);
    const fake = qu.fake === 'true';
    const setupSocket = () => {
//        console.log(socket);
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
        socket.on('gameOver', () => {
            console.log(`game over man`);
            onGameOver();
        });
    };
    const estSocket = () => {
        console.log('############################### est socket');
//        socket = io();
//        socket = initSocket();
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
        console.log(`clearStorage`, getStoreString());
        localStorage.removeItem(getStoreString());
    };
    const storeID = (id) => {
        if (!getStoredID().hasID) {
            // must only ever happen once
            console.log('STORING ID');
            localStorage.setItem(getStoreString(), id);
        }
    };
    const registerWithGame = () => {
        console.log(`registerWithGame`);
//        const socket = getSocket();
        console.log(socket);
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
                console.warn(`I will call setPlayer, ob:`, ob);
                if (ob.id) {
                    pId = ob.id;
                }
                setPlayer(ob.game);
//                console.log(`call render`, ob.renderState)
                render(ob.renderState);
            }
        });
    };
    const onPlayerStateUpdateNO = ((key, value) => {
//        console.log(`player.${key} changed to:`, value);
        showPlayerInfo();
    });
    const setPlayer = (fgame) => {
        console.warn(`setPlayer will create the player object:`);
        const index = game.teams.findIndex(inner => inner.includes(pId));
        const t = game.persistentData.teamsArray[index];
        const newPlayer = fgame.playersFull[pId];
//        console.log('newPlayer exists', newPlayer);
        console.log('pId: ', pId, 'fgame:', fgame);
        if (player.hasOwnProperty('id')) {
            console.log('player exists', player);
            Object.entries(player).forEach(([k, v]) => {
                console.log(k, v);
            });
            if (Boolean(player.teamObj) && Boolean(newPlayer.teamObj)) {
                if (player.teamObj.id !== newPlayer.teamObj.id || player.isLead !== newPlayer.isLead) {
//                    window.location.reload();
                }
            }
        } else {
            console.log('player does not exist');
        }
        console.log('player', window.clone(player));
        console.log('newPlayer', window.clone(newPlayer));
        console.warn('here player is defined');
        Object.assign(player, newPlayer);
//        console.log(`player`, player);
    };
    const onRemoval = (ob) => {
        // This is serious, better do some serious checking:
        const isGame = ob.game === game.address;
        const isSocket = ob.sock === player.socketID;
        const isPlayer = ob.player === player.id;
        const isDef = isGame && isSocket && isPlayer;
        console.log(isGame, isSocket, isPlayer, isDef);
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
    const onGameOver = () => {
        clearStorage();
        renderTemplateMain('game.gameover');
    };
    const init = () => {
        gId = window.location.pathname;
        console.log('INIT', gId);
        const sid = getStoredID();
        console.log('sid', sid)
        console.log(`init: ${gId}`, qu);
        if (gId.includes('game-')) {
            // fake player condition
            if (qu.hasOwnProperty('fid')) {
                pId = window.getQueries().fid;
            }
            // returning player condition
            if (sid.hasID) {
                pId = sid.value;
            }
            estSocket();
            registerWithGame();
        } else {
            // wrong URL condition

        }
    };
    init();
    registerClearStorage(clearStorage);
}
