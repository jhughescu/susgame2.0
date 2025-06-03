document.addEventListener('DOMContentLoaded', function () {
    const gameID = window.location.hash.replace('#', '');
    let players = {};
    let updateInt;
    const socket = io('', {
        query: {
            role: 'playerList',
            id: gameID
        }
    });
    const pSort = (p1, p2) => {
        const c = 'index';
        let r = 0;
        if (p1[c] < p2[c]) {
            r = -1;
        } else if (p1[c] > p2[c]) {
            r = 1;
        }
        return r;
    }
    const render = () => {
        if ($.isEmptyObject(players)) {
            noRender();
        } else {
            let str = '<table id="players">';
            const P = Object.values(players);
            P.sort(pSort);
            //        console.log(P);
            P.forEach(p => {
                str += `<tr>`;
                str += `<td>${p.index}</td>`;
                str += `<td>${p.id}</td>`;
                str += `<td>${p.connected}</td>`;
                str += `<td>${p.teamObj.title}</td>`;
                str += `<td>${p.isLead}</td>`;
                str += `<td>${p.isFake}</td>`;
                str += `</tr>`;
            });
            str += '</table>';
            $('#insertion').html(str);
        }
    };
    const noRender = () => {
        $('#insertion').html('no players to render');
    };
    //
    const hasDuplicateProperty = (obj, prop) => {
        const seen = new Set();
        for (const key in obj) {
            const value = obj[key][prop];
            if (seen.has(value)) return true;
            seen.add(value);
        }
        return false;
    };
    const multipleTeamLeads = (obj) => {
        const teamLeads = {};
        for (const key in obj) {
            const member = obj[key];
            if (member.isLead) {
                //                console.log(member);
                const team = member.teamObj.abbr;
                if (teamLeads[team]) {
                    // Already has a lead in this team
                    //                    console.log(teamLeads);
                    //                    console.log(team);
                    return true;
                }
                teamLeads[team] = true;
            }
        }

        return false;
    };
    const pvHasLeads = (o) => {
        let pvLead = false;
        let pvLeads = [];
        for (const k in o) {
            //            console.log(o[k].teamObj.type === 2 && o[k].isLead);
            if (o[k].teamObj.type === 2 && o[k].isLead) {
                pvLead = true;
                pvLeads.push(k);
            }
        }
        return {
            hasLeads: pvLead,
            pvLeads: pvLeads
        }
    };

    const checkPlayers = () => {

        let OK = true;
        let msg = '';
        const multipleLeads = multipleTeamLeads(players);
        const duplicateIDs = hasDuplicateProperty(players, 'id');
        const pvLeads = pvHasLeads(players);
        if (multipleLeads) {
            OK = false;
            msg += 'duplicate team leads! ';
        }
        if (duplicateIDs) {
            OK = false;
            msg += 'duplicate IDs! ';
        }
        if (pvLeads.pvLead) {
            OK = false;
            msg += 'PV team lead(s) exist! '
        }
        if (OK) {
            const d = new Date().toUTCString();
            //                console.log(`${Object.values(players).length} players checked, all OK`);
            msg = `<p>${Object.values(players).length} players checked, all OK (${d})</p>`;
        }
        $('#insertion').append(msg);
    };
    //
    const onPlayers = (p) => {
        if ($.isEmptyObject(p)) {
            noRender();
        } else {
            console.log(p);
            console.log(players);
            if (JSON.stringify(p) !== JSON.stringify(players)) {
                console.log('mismatch')
                clearTimeout(updateInt);
                updateInt = setTimeout(() => {
                    players = p;
                    render();
                    checkPlayers();
                }, 1000);
            } else {
                console.log('match')
            }
        }
    };
    socket.emit('getGame', gameID, (g) => {
                console.log('got', g.playersFull);
        onPlayers(g.playersFull);
    });
    socket.on('gameUpdate', (g) => {
                console.log('heard', g.playersFull);
        onPlayers(g.playersFull);
    })
});
