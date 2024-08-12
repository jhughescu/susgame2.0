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
    console.log(detail)
    let logs = null;
    let delay = null;
    const processLogs = (l) => {
        for (var i in l) {
            const log = l[i];
            const ev = log.event.split(' ');
            const ts = log.timestamp.split('-')[1];
            log.eventSrc = ev[0];
            log.eventName = ev[1];
            log.timestampDisplay = `${ts.substr(0, 2)}:${ts.substr(2, 2)}:${ts.substr(4, 2)}`;
            log.id = `${i}`;
            delete log.event;
            const sk = Object.keys(log).sort();
            const lo = {};
            sk.forEach(k => {
                lo[k] = log[k];
            });

        }
        logs = l;
//        console.log(logs);
        return l;
    };
    const setupLogs = () => {
        const l = $('.showLogDetail');
        detail = $('#logDetail');
        l.on('mouseover', function () {
            const el = $(this);
            clearTimeout(delay);
            delay = setTimeout(() => {
//                detail.show();
                window.renderTemplate('logDetail', 'object.table', logs[el.attr('id')]);
                detail.fadeIn()
            }, 200);
        });
        l.on('mouseout', function () {
            detail = $('#logDetail');
            detail.hide();
            clearTimeout(delay);
        });
    };

    const showLogs = (logs) => {
        const ob = {
            logs: processLogs(JSON.parse(logs))
        };
        //        console.log(logs);
        window.renderTemplate('logs', 'update.log.display', ob, setupLogs)
    };
    const loadLogs = () => {
        socket.emit('getUpdateLog', log => {
            showLogs(log);
        });
    };
    $(document).on('mousemove', function(event) {
        const y = event.clientY - detail.height() - 30;
        const ya = y > 0 ? y : 0;
        detail.css({
            'top': `${ya}px`,
            'left': `${event.clientX + 20}px`
        });
    });
    socket.on('logsUpdated', (log) => {
        showLogs(log);
    });
    loadLogs();

});
