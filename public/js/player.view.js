// player.view.js
import { player, game } from './player.state.js';
import { addToStorage } from './player.storage.js';
//
let renderState = {};
let renderStateLocal = {};
//

const setRenderStateLocal = (ob) => {
    renderStateLocal = typeof(ob) === 'string' ? JSON.parse(ob) : Object.assign({}, ob);
    // 'ob' is player info, no need to store that - unless preserveOb = true
    if (ob) {
        if (!ob.preserveOb) {
            delete renderStateLocal.ob;
        }
    }
    // Only allow storage of correctly defined state data
    if (renderStateLocal.hasOwnProperty('temp')) {
        addToStorage('renderState', window.clone(renderStateLocal));
    } else {
        console.warn(`renderState not stored as no 'temp' property found`);
    }
};
const showOverlay = (id, ob) => {
    if ($('.overlay')) {
        $('.overlay').remove();
    }
    window.getTemplate('overlay', {}, (temp) => {
        $('body').append(temp);
        window.renderTemplate('overlay', id, ob, () => {
            $('.overlay').fadeIn(300);
        });
    });
};
const getSelect = (ob, arr) => {
//    console.log(`getSelect`, ob, arr);
    let filtered = null;
    if (ob) {
//        console.log('attempts')
        filtered = Object.fromEntries(
            Object.entries(ob).filter(([key]) => arr.includes(key))
        );
    }
    return filtered;
};
const getRenderDetailV1 = () => {
    let d = {};
    Object.assign(d, getSelect(player, ['id', 'index', 'connected', 'socketID', 'isFake', 'isLead']));
    Object.assign(d, getSelect(player.teamObj, ['title']));
    Object.assign(d, getSelect(game, ['uniqueID', 'address']));
    return d;
};
const getRenderDetail = (ob, arr) => {
    let d = '';
//    console.log(`getRenderDetail`, ob, arr);
    if (ob) {
        Object.entries(getSelect(ob, arr)).forEach(e => {
            d += `<tr><td>${e[0]}: </td><td>${e[1]}</td></tr>`;
        });
    } else {
        console.warn('cannot render; no arg received');
    }
    return d;
};
//
export const render = () => {
    console.log(`render`, player);
    let c = 0;
    Object.entries(player).forEach(([k, v]) => {
//        console.log(' * ', k, v);
        c++;
    });
    console.log(`player detail levels: ${c}`);
    const rDest = $(`#insertion`);
    let s = '<table>';
    s += `<tr><td colspan="2">PLAYER</td></tr>`;
//    console.log('try to send player');
    s += getRenderDetail(player, ['id', 'index', 'connected', 'socketID', 'isFake', 'isLead']);
    s += `<tr><td colspan="2">TEAM</td></tr>`;
//    console.log('try to send player.teamObj', player);
    s += getRenderDetail(player.teamObj, ['title', 'type']);
    s += `<tr><td colspan="2">GAME</td></tr>`;
    s += getRenderDetail(game, ['uniqueID', 'address', 'round']);
    s += '</table>';
    rDest.html(s);
    updateRenderState({test: true, temp: 'test'})
};
export const renderV2 = () => {
    const rDest = $(`#insertion`);
    let s = '<table>';
    const renderDetail = getRenderDetail();
    console.log(renderDetail);
    Object.entries(player).forEach(e => {
        if (e[0] === 'teamObj') {
            if (e[1]) {
                if (e[1].hasOwnProperty('title')) {
                    s += `<tr><td>team</td><td>${e[1].title}</td></tr>`;
                }
            }
        } else {
            s += `<tr><td>${e[0]}: </td><td>${e[1]}</td></tr>`;
        }
    });
    s += `<tr><td>GAME</td><td></td></tr>`;
    Object.entries(game).forEach(e => {
        s += `<tr><td>${e[0]}: </td><td>${e[1]}</td></tr>`;
    });
    s += '</table>';
    rDest.html(s);
//    console.log(s);
    updateRenderState({test: true, temp: 'test'})
};
export const renderV1 = (ob) => {
    console.log('render stuff');
    console.log(ob);
    console.log(player.connected);
    return;
    const rDest = $(`#insertion`);
    rDest.html(ob.msg);
    rDest.append(`<p>${ob.temp}</p>`);
    rDest.append(`<table>`);
    if (ob.ob) {
        console.log(ob.ob);
        Object.entries(ob.ob).forEach(e => {
            if (e[0] === 'teamObj') {
                if (e[1]) {
                    if (e[1].hasOwnProperty('title')) {
                        rDest.append(`<tr><td>team</td><td>${e[1].title}</td></tr>`);
                    }
                }
    //            Object.entries(e[1]).forEach(se => {
    //                rDest.append(`<tr><td>${se[0]}</td><td>${se[1]}</td></tr>`);
    //            });
            } else {
                rDest.append(`<tr><td>${e[0]}</td><td>${e[1]}</td></tr>`);
            }
        });
        rDest.append(`</table>`);
    }
};
export const updateRenderState = (ob) => {
    if (ob) {
        const deletions = [];
        Object.assign(renderState, ob);
        for (let i in renderState) {
            if (renderState[i] === null) {
                deletions.push(i);
                delete renderState[i]
            }
        }
        delete renderState.note;
        setRenderStateLocal(renderState);
    }
};
export const identifyPlayer = (pId, gId) => {
//    console.log(`identifyPlayer`, pId, gId)
    const idOb = {
        id: player.id,
        connected: player.connected,
        sock: player.socketID,
        stored: 'null',
        team: player.teamObj.title
    };
    showOverlay('playerID', idOb);
};
//
