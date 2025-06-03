// player.storage.js
import { player, game } from './player.state.js';

let clearStorageCallback = () => {};

const APPID = 'cususfut';

export const registerClearStorage = (fn) => {
    clearStorageCallback = fn;
};
export const getAppID = () => {
    return APPID;
};
const getStorageID = () => {
    const p = player.isFake ? `-${player.id}` : ``;
    return `${APPID}-${game.uniqueID}${p}-`;
};
export const addToStorage = () => {
//    console.log(getStorageID());
};
