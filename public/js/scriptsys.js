document.addEventListener('DOMContentLoaded', function() {
//    const socket = io('/admin/systemdashboard');
    const socket = io('', {
        query: {
            role: 'systemadmin'
        }
    });
    const getScores = () => {
        const total = 15;
        const map = `a_b_c_d_0`;
        const scores = [];
        for (var i = 0; i < total; i++) {
            scores.push(map.replace('a', i%2).replace('b', i%5).replace('c', Math.round(Math.random() * i%5)).replace('d', Math.round(Math.random() * 3)));
        }
        scores.sort();
    //            console.log(scores);
        return scores;
    };
    getScores();
    const getTeams = () => {
        const allTeams = [];
        for (var i = 0; i < 30; i++) {
            allTeams.push(`p${i}`);
        }
        const rSort = () => {return Math.floor(Math.random() * 3) - 1};
        const teams = [[], [], [], [], [], [], []];
        allTeams.reverse().sort(rSort);
    //            console.log(allTeams);
        for (var i = 0; i < allTeams.length; i++) {
            teams[i%teams.length].push(allTeams[i]);
        }
    //            console.log(teams);
        return teams;
    };
    const rangeTop = 1; /* rangeTop will later be replaced by an app variable */
    const checkInputType = () => {
        let el = document.getElementById('type');
        if (el.value < 1) {
            el.value = 1;
        } else if (el.value > rangeTop)  {
            el.value = 1;
       }
    };


    document.getElementById('showSessionsForm').addEventListener('submit', function(event) {
        event.preventDefault();
        fetch('/admin/getSessions', {
                method: 'POST',
                body: new FormData(this)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to generate unique ID');
                }
                return response.json(); // Parse the response body as JSON
            })
            .then(data => {
                panel('sessions', data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });
    document.getElementById('createSessionForm').addEventListener('submit', function(event) {
        const inputType = document.getElementById('type');
        const valType = parseInt(inputType.value);

        if (valType < 1 || valType > rangeTop) {
            alert(`type must be a number between 1 and ${rangeTop}`);
            event.preventDefault();
        } else {
            const ok = confirm('are you sure you want to create a new session?');
            if (ok) {
                event.preventDefault();
                // Use fetch to submit the form data to the server asynchronously
                fetch('/admin/createSession', {
                        method: 'POST',
                        body: JSON.stringify({ valType }),
                        headers: {
                            'Content-Type': 'application/JSON'
                        }
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to generate unique ID');
                        }
                        return response.json(); // Parse the response body as JSON
                    })
                    .then(data => {
//                        console.log(data);
    //                    console.log(data.uniqueID)
                        alert(`Created session with uniqueID: ${data.uniqueID}`);
                        updateView();
                    }).then(() => {
                        resetTimeout();
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            } else {
                event.preventDefault();
            }
        }
    });

    async function facilitate () {
        console.log('facilitate - cookie?');
        try {
            const session = $('#val_uniqueID').html();
            const password = $('#val_password').html();
            const response = await fetch('/facilitatorlogin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session, password })
            });
            if (!response.ok) {
                throw new Error('Failed to login');
            }
            const ret = response.url;
            // Redirect to facilitator dashboard with the token
            document.cookie = `sessionID=${session}`;
            window.open(`/facilitatordashboard`, 'facdash');
        } catch (err) {
            console.log('error');
            console.log(err);
        }
    };
    async function deleteSession () {
        const sID = $('#val_uniqueID').html();
        const conf = confirm(`Request to delete session ${sID}.\nWARNING: this process deletes the named session from the database. This action cannot be undone.`);
        if (conf) {
            const pw = prompt('Enter the system password to continue with deletion.');
            if (pw) {
                const final = confirm(`Are you absolutely sure you want to delete session ${sID}? This is your last chance to back out...`);
                if (final) {
                    socket.emit('requestSessionDelete', { sID, pw }, (ob) => {
                        updateView();
                        alert(ob.msg);
                    });
                }
            }
        }

    };
    async function rename () {
        const sID = justNumber($('#val_uniqueID').html());
        const namer = prompt(`Enter the new name for ${sID}.`);
        const nOb = {gameID: sID, name: namer};
        if (namer) {
//            console.log(nOb)
            socket.emit('sessionNameChange', nOb, (gID) => {
                updateView(gID);
//                console.log(`rename callback ${gID}`)
            });
        } else {
            alert(`No name entered.`);
        }
    };

    const updateView = (gID) => {
        if ($('#panel_sessions').length > 0) {
            socket.emit('getSessionsSock', (s) => {
                panel('sessions', s, () => {
                    if (gID) {
                        getSession(gID);
                        highlightSessionLink(gID);
                    }
                });
            });
        }
    };
    const panel = (id, data, cb) => {
        window.renderTemplate('panel', 'panel', {id: id, content: 'sessionPanel'}, () => {
            const p = $(`#panel_${id}`);
            p.show();
            if (localStorage.getItem('sessionCardPos')) {
                const pos = JSON.parse(localStorage.getItem('sessionCardPos'));
                const left = pos.left > 20 ? pos.left : 20;
                const top = pos.top > 20 ? pos.top : 20;
                p.css({left: `${left}px`, top: `${top}px`})
            }
            p.draggable({
                stop: function(event, ui) {
                  const position = ui.position;
                  localStorage.setItem('sessionCardPos', JSON.stringify(position));
                }
            });
            p.find('.close').off('click');
            p.find('.close').on('click', function () {
                p.find('#sessionList').html('');
                p.find('#sessionDetail').html('');
                p.hide();
            });
            data.forEach(s => {
                s.hasName = s.hasOwnProperty('name');
            });
            window.renderTemplate('sessionList', 'sessionList', {sessions: data}, () => {
                readySessionLinks();
                if (cb) {
                    cb();
                }
            });
        });
//

        return;

    };
    const copyToClipboardMOVED = (elementId) => {
        // Select the text inside the element
        const element = document.getElementById(elementId);
        const range = document.createRange();
        range.selectNode(element);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        // Copy the selected text to the clipboard
        document.execCommand('copy');

        // Deselect the text
        window.getSelection().removeAllRanges();
    };
    const getSession = async (sessionID) => {
        /*
        // Prompt the user to enter a password
        let password = prompt('Session password will be omitted from return unless admin password is provided here:');
        if (!password) {
            password = '';
        }
        */
        const password = $('#verifyPassword').val();
        // Perform a fetch call to the server with the session ID as a parameter

//        console.log(sessionID, password);
        fetch('/admin/getSession?sessionID=' + sessionID, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionID, password})
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to get session data');
                }
                return response.json();
            })
            .then(data => {
                // Process the data received from the server
//            console.log(data);
                $('#sessionDetail').fadeOut(300, function () {
                    const rOb = data;
                    if (rOb.players.length > 10) {
                        rOb.players = `${rOb.players.join(',').substr(0, 20)}..`;
                    }
                    if (rOb.teams.length > 0) {
                        rOb.teams = rOb.teams.map(t => `(${t.length})`);
                    }
                    if (rOb.scores.length > 0) {
                        rOb.scores = `(${rOb.scores.length} scores recorded)`
                    }
                    if (rOb.values.length > 0) {
                        rOb.values = `(${rOb.values.length} values recorded)`
                    }
                    if (rOb.password) {
                        rOb.fdbLink = `${window.location.origin}/facilitatorlogin?s=${rOb.uniqueID}&p=${rOb.password}`;
                    }
                    window.renderTemplate('sessionDetail', 'system.card.session', rOb, readySessionSpecificLinks);
                    $('#sessionDetail').fadeIn(300, () => {
                        let vp = $('#val_password').add($(`#val_uniqueID`)).add($(`#val_fdbLink`));
                        vp.addClass('link');
                        vp.off('click').on('click', function() {
                            const msg = $(this).attr('id');
                            copyToClipboard(msg);
                        });

                    });
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };
    const highlightSessionLink = (id) => {
        const gs = $('.getSession');
        const hgs = $(`#s-link${id}`);
        gs.removeClass('highlight');
        hgs.addClass('highlight');
    };
    const readySessionLinks = () => {
        const gs = $('.getSession');
        gs.off('click');
        gs.on('click', function() {
            var sessionId = $(this).data('session-id');
            highlightSessionLink(sessionId);
            getSession(sessionId);
        });
    };
    const readyDevLinks = () => {
        let us = $('#updateSession');
        us.off('click').on('click', () => {
            socket.emit('updateSession', $('#sessionID').val(), {teams: getTeams(), scores: getScores()})
        });
        us = $('#resetSession');
        us.off('click').on('click', () => {
            resetTimeout();
        });
    };
    const readySessionSpecificLinks = () => {
        const r = $('#rename');
        const l = $('#launch');
        const d = $('#delete');
        r.off('click').on('click', () => {
            rename();
        });
        l.off('click').on('click', () => {
            facilitate();
        });
        d.off('click').on('click', () => {
            deleteSession();
        });
    };
    const resetTimeout = () => {
        $.ajax({
            method: 'GET',
            url: '/admin/reset-timeout',
            success: function(response) {
                console.log('Session reset successfully');
            },
            error: function(xhr, status, error) {
                console.error('Error resetting session:', error);
            }
        });
    };
    socket.on('databaseChange', (ch) => {
        console.log('times they are a changing');
        console.log(ch);
    });
    socket.on('gameChange', g => {
        console.log(`gameChange`);
        console.log(g);
    });
    $(document).ready(function() {
        readySessionLinks();
        readyDevLinks();
    });
    window.readyL = readySessionLinks;
});
