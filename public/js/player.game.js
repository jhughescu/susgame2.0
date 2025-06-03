// player.game.js
import { render } from './player.view.js';
import { player, game } from './player.state.js';
import { getSocket } from './player.socket.js';
//
const isObject = (val) => {
    return val !== null && typeof val === 'object';
}
const compareObs = (obj1, obj2, path = '', playerID) => {
    const diffs = [];
    const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of keys) {
        const fullPath = path ? `${path}.${key}` : key;
        const val1 = obj1[key];
        const val2 = obj2[key];

        if (val1 === val2) continue;

        const bothObjects = isObject(val1) && isObject(val2);
        if (bothObjects) {
            diffs.push(...compareObs(val1, val2, fullPath, playerID));
        } else {
            diffs.push(fullPath);
        }
    }

    // Filter and log only diffs relevant to this instance's playerID
    const relevantDiffs = diffs.filter(d => {
        const match = d.match(/playersFull\.(pf?\d+|p\d+)\./);
        return !match || match[1] === playerID;
    });

    relevantDiffs.forEach(d => {
//        console.log(d);
    });

    return relevantDiffs;
};
//
export const updateGame = (g) => {
//    game = g;
    Object.assign(game, g);
//    console.log('game', game);
};
export const onGameUpdate = (rOb) => {
    const updateSource = rOb._updateSource;
    delete rOb._updateSource;
    const gDiff = compareObs(game, rOb);
    const newP = rOb.playersFull[player.id];
    if (!$.isEmptyObject(player)) {
        if (newP) {
            const pDiff = compareObs(player, newP);
            if (pDiff.length > 0) {
                console.log(`will call playerUpdate`, pDiff);
                onPlayerUpdate(newP);
            }
        }
        if (gDiff.length > 0) {
            updateGame(rOb);
            console.log('game update renders', gDiff);
            render(rOb);
        }
    }
};
export const onPlayerUpdate = (rOb) => {
    // Your game update logic here
//    console.log(`player update received:`, window.clone(rOb));
    Object.assign(player, rOb);
    render();
};
export const leaveGame = () => {
    const plOb = {game: game.uniqueID, player: player.id};
    getSocket().emit('removePlayer', plOb, (ob) => {
        if (ob.success) {
            clearStorageCallback();
        }
    });
};
