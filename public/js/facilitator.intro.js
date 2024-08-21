document.addEventListener('DOMContentLoaded', function() {
    let session = null;
    const init = (ob) => {
        const detail = $('#theDetail');
        const detailButton = $('#showDetail');
        const reset = $('#sessionReset');
        const start = $('#starter');
        const sock = window.getSocket('fdb_socket');
        session = ob;
        detailButton.off('click').on('click', () => {
            if (detail.is(':visible')) {
                detail.hide();
            } else {
                detail.show();
            }
        });
        reset.off('click').on('click', () => {
            if (sock) {
                sock.emit('resetSession', session.uniqueID, () => {

                });
            } else {
                alert('no sock')
            }

        });
        start.off('click').on('click', () => {
            window.startGame();
        });
    };
    window.facIntroInit = init;
});
