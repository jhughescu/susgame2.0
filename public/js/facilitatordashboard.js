document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    const clientData = {role: 'facilitator'};
    const onConnect = () => {

    };
    socket.on('connect', () => {
//        console.log('admin cnnnect');
        onConnect();

    });
    socket.on('connectedDB', () => {
//        console.log('database ready')
    });
    socket.on('dbReady', (boo) => {
//        console.log(`database ready? ${boo}`)
    });
});
