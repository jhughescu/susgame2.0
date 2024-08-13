document.addEventListener('DOMContentLoaded', function () {
    const gameID = window.location.hash.replace('#', '');
    const socket = io('', {
        query: {
            role: 'updatelog',
            id: gameID
        }
    });
    const logDiv = $('#logs');
    let detail = $('#logDetail');
    let game = null;
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

    const showLogs = (logs) => {
        const ob = {
            logs: processLogs(JSON.parse(logs))
        };
//        console.log(ob.logs);
        const haveLogs = Boolean(Object.keys(ob.logs).length);
        if (!haveLogs) {
            ob.message = game === null ? `game must be specified as URL hash, e.g. ..updatelog#game-6tsu` : `no logs found for game "${game}"`;
        }
        window.renderTemplate('logs', haveLogs ? 'update.log.display' : 'error', ob, setupLogs);
    };
    const loadLogs = () => {
        socket.emit('getUpdateLog', log => {
            showLogs(log);
        });
    };
    const init = () => {
        if (Boolean(window.location.hash)) {
            game = window.location.hash.replace('#', '/');
        }
    };

    $(document).on('mousemove', function(event) {
        const y = event.pageY - detail.height() - 30;
        const ya = y > 0 ? y : 0;
        detail.css({
            'top': `${ya}px`,
            'left': `${event.pageX + 20}px`
        });
    });
    window.addEventListener('hashchange', function() {
        init();
        loadLogs();
    }, false);
    socket.on('logsUpdated', (log) => {
        showLogs(log);
    });
    init();
    loadLogs();

});
