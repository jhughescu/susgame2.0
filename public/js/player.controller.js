// player.controller.js
import { player, game } from './player.state.js';
import { leaveGame } from './player.game.js';

const resignButton = $(`#resign`);
resignButton.off('click').on('click', () => {
    leaveGame();
})
