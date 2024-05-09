document.addEventListener('DOMContentLoaded', function() {

    const setupAllocationControlNOPE = async () => {
        const butMinus = $('#vote_btn_minus');
        const butPlus = $('#vote_btn_plus');
        const val = $('.tempV');
        const submit = $(`#buttonAllocate`);
        const action = $(`#action-choice`);
        const desc = $(`#actionDesc`);
        const ints = $('#vote_btn_minus, #vote_btn_plus, #buttonAllocate, #action-choice, #actionDesc');
        const hasS = await window.thisRoundScored();
        console.log('see if the round has been scored already:');
        console.log(hasS);
        if (hasS.hasScore) {
            const vOb = {gameID: `game-${game.uniqueID}`, team: player.teamObj.id};
            socket.emit('getValues', vOb, (v) => {
//                console.log('test the values')
//                console.log(v)
                ints.prop('disabled', true);
                ints.addClass('disabled');
                val.html(hasS.scorePacket.val);
                desc.html(v.description);
                action.val(v.action);
            });
        } else {
            ints.off('click');
            butPlus.on('click', () => {
                let v = parseInt(val.html());
                if (v < 10) {
                    v += 1;
                    val.html(v);
                }
            });
            butMinus.on('click', () => {
                let v = parseInt(val.html());
                if (v > 1) {
                    v -= 1;
                    val.html(v);
                }
            });
            submit.on('click', () => {
                let scoreV = parseInt(val.html());
                let actionV = action.val();
                let descV = desc.val();
                if (scoreV === 0 || actionV === '' || descV === '') {
                    alert('Please complete all options and allocate at least 1 resource')
                } else {
                    const tID = player.teamObj.id;
                    let t = player.teamObj.id;
                    const vob = {game: game.uniqueID, values: {team: t, action: actionV, description: descV}};
                    socket.emit('submitValues', vob);
                    const sob = {scoreCode: {src: t, dest: t, val: scoreV}, game: game.uniqueID};
                    socket.emit('submitScore', sob, (scores) => {
                        setupAllocationControl();
                    });

//                    setupAllocation(false);
                }
            });
        }
    };

});
