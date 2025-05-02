document.addEventListener('DOMContentLoaded', function() {
    const socket = io('', {
        query: {
            role: 'helppage'
        }
    });
    let storageID = null;
    const clearAll = $('#clearAll');
    const runReset = () => {
//        console.log('resetter', storageID);
        const w = Object.keys({ ...localStorage }).filter(i => i.includes(storageID));
//        console.log(w)
        const ok = confirm('This is the nuclear option. Continuing will erase all contact you have with the game and you will start from scratch. Are you sure you want to do this?');
        if (ok) {
            w.forEach(l => localStorage.removeItem(l));
        }
        $('#innercontent').html('You have successfully disconnected from the game, please close this browser tab before reconnecting via the QR code.')
    };
    clearAll.off('click').on('click', runReset);
    socket.on('helpSetup', (o) => {
        storageID = o.storageID;
    });
});
