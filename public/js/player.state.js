//export let player = {};
export let game = {};
let _player = {};
const playerListeners = [];

export const player = new Proxy(_player, {
    set(target, prop, value) {
        target[prop] = value;
        // Notify all listeners
        playerListeners.forEach(fn => fn(prop, value));
        return true;
    }
});

export const onPlayerUpdate = (callback) => {
    playerListeners.push(callback);
};
