document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    const clientData = {role: 'sysadmin'};
    const createSession = () => {
        console.log('create a session');

        socket.emit('createSession', (s) => {
            console.log(`create: ${s}`);
        });
    };
    const getRan = () => {
        return Math.round(Math.random() * 10000);
    };
    const showWarning = () => {

    };

    const buttonCreate = $(`#button_create`);
    buttonCreate.on('click', createSession);

    const onConnect = () => {
        socket.emit('customDataEvent', clientData);
    };
    socket.on('connect', () => {
//        console.log('system admin cnnnect');
        onConnect();
    });
    socket.on('connectedDB', () => {
//        console.log('database ready')
    });
    socket.on('dbReady', (boo) => {
//        console.log(`database ready? ${boo}`)
    });
//    socket.on('adminTimeoutWarn', (t) => {
//        console.log(`beware my bro, timeout in ${t/1000}`);
//        showWarning(`beware, timeout in ${Math.floor(t/1000)}`);
//    });
    socket.on('systemAdminLoggedOut', () => {
        console.log(`out we go`);
        window.location.href = '/admin/loggedout';
    });
});
