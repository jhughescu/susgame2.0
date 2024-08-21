document.addEventListener('DOMContentLoaded', function() {
    let session = null;
    const init = (ob) => {
        const reset = $('#adminGameReset');
        const socket = window.getSocket('fdb_socket');
        session = ob;
        reset.off('click').on('click', () => {
            let sure = window.prompt('Enter admin password');
            if (sure) {
                socket.emit('testPassword', {adminOnly: true, session: session.uniqueID, pw: sure}, (boo) => {
                    socket.emit('resetEndedGame', {pw: sure, session: session.uniqueID}, (ob) => {
                        console.log(`resetEndedGame:`);
                        console.log(ob);
                        if (typeof(ob) === 'object') {
//                            window.up
                            window.renderFacilitate();
                        } else {
                            alert(boo ? 'OK to reset, but a session object has not been returned.' : 'Cannot reset, password incorrect.')
                        }
//                        if (boo) {
////                            alert('we can go again');
//                            window.renderFacilitate();
//                        }
                    });
                });
            }
        });
//        reset.off('click').on('click', () => {
//            if (sock) {
//                sock.emit('resetSession', session.uniqueID, () => {
//
//                });
//            } else {
//                alert('no sock')
//            }
//
//        });
    };
    window.facOutroInit = init;
});
