document.addEventListener('DOMContentLoaded', function () {
    const gameID = window.location.hash.replace('#', '');
    const socket = io('', {
        query: {
            role: 'adminsessiondisplay',
            id: gameID
        }
    });
    const logDiv = $('#logs');
    let detail = $('#logDetail');
    let game = null;
    let gameObj = null;
    let logs = null;
    let delay = null;
    const processLogs = (lin) => {
        const l = {};
        Object.entries(lin).forEach(([k, v]) => {
            if (v.game === game) {
                l[k] = v;
            }
        });
        for (var i in l) {
            const log = l[i];
            const ev = log.event.split(' ');
            const ts = log.timestamp.split('-')[1];
            log.eventSrc = ev[0];
            log.eventName = ev[1];
            log.timestampDisplay = `${ts.substr(0, 2)}:${ts.substr(2, 2)}:${ts.substr(4, 2)}`;
            log.id = `${i}`;
            log.player = log.pid ? log.pid : log.playerID;
            delete log.event;
            const sk = Object.keys(log).sort();
            const lo = {};
            sk.forEach(k => {
                lo[k] = log[k];
            });

        }
        logs = l;
        return l;
    };
    const setupLogs = () => {
        const l = $('.showLogDetail');
        detail = $('#logDetail');
        l.on('mouseover', function () {
            const el = $(this);
            clearTimeout(delay);
            delay = setTimeout(() => {
                window.renderTemplate('logDetail', 'object.table', logs[el.attr('id')]);
                detail.fadeIn()
            }, 200);
        });
        l.on('mouseout', function () {
            detail = $('#logDetail');
            detail.hide();
            clearTimeout(delay);
        });
//        window.scrollTo(0, document.body.scrollHeight);
        $('html, body').animate({ scrollTop: $(document).height() }, 1000);
    };

    const showSession = (sesh) => {
        const teams = gameObj.persistentData.teamsArray;
        const players = gameObj.players;
        const values = sesh.values;
        const obj = {session: sesh, game: gameObj};
//        const sp = Object.assign({}, obj.session.scorePackets);
//        obj.session.scorePackets = sesh.scores.slice(0).map(s => window.unpackScore(s));
//        obj.session.scorePackets = obj.session.scorePackets.map(i => ({...i, dest: teams[i.dest].title}));
//        obj.session.scorePackets = obj.session.scorePackets.map(i => ({...i, src: teams[i.src].title}));
//        obj.session.scorePackets = obj.session.scorePackets.map(i => ({...i, client: players[i.client]}));
        let sp = sesh.scores.slice(0).map(s => window.unpackScore(s));
        sp = sp.map(i => ({...i, team: teams[i.dest].title}));
        sp = sp.map(i => ({...i, src: teams[i.src].title}));
        sp = sp.map(i => ({...i, client: players[i.client]}));
        sp = sp.map(i => ({...i, value: teams[i.dest].id}));
        obj.session.scorePackets = sp;
//        console.log(sp);
//        obj.session.scorePackets = obj.session.scorePackets.map(p => teams[p.dest].title);
        console.log(obj);
        console.log(obj.session.scorePackets);
        window.renderTemplate('logs', 'admin.session.display', {session: sesh, game: gameObj});
//        console.log(window.unpackScore(sesh.scores[0]))
    };
    const loadSession = () => {
        if (game) {
//            console.log(game);
            showError('tried and nearly succeeded');
            socket.emit('getSession', game, sesh => {
                showSession(sesh);
            });
        } else {
            showError('tried and failed');
        }
    };
    const establishGame = () => {
        if (Boolean(window.location.hash)) {
            game = window.location.hash.replace('#', '/');
        } else {
            showError();
        }
    };
    const showError = (msg) => {
        window.renderTemplate('logs', 'error', {message: msg ? msg : `game must be specified as URL hash, e.g. ..updatelog#game-6tsu`});
    };
    const findGame = (cb) => {
        socket.emit('getGame', game, (g) => {
//            alert('game found');
            gameObj = g;
            cb();
        });
    };
    const init = () => {
        establishGame();
        if (game !== null) {
            findGame(() => {
                loadSession();
            });
        }
    };
    window.addEventListener('hashchange', function() {
        init();
    }, false);
    socket.on('onSessionUpdated', (sesh) => {
        showSession(sesh);
    });
    init();

});
