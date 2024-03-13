document.addEventListener('DOMContentLoaded', function() {
//    console.log('a player');
    const socket = io('/player');
    socket.on('playerConnect', (id) => {
//        console.log(`ccncncnnc: ${id}`)
        socket.emit('regPlayer', localStorage.getItem(id));
    })
});
