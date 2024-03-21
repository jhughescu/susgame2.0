document.addEventListener('DOMContentLoaded', function() {
    const socket = io('/admin/systemdashboard');
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
                        console.log(data)
    //                    console.log(data.uniqueID)
                        alert(`Created session with uniqueID: ${data.uniqueID}`);
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
//        console.log(document.cookie);
//        document.cookie = `sessionID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        try {
            const session = $('#val_uniqueID').html();
            const password = $('#val_password').html();
//            console.log(session, password);
//            debugger;
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
//            console.log(ret)
//            const data = await response.json();
            // Redirect to facilitator dashboard with the token
            document.cookie = `sessionID=${session}`;
//            console.log(document.cookie);
//            debugger;
            window.open(`/facilitatordashboard`, 'facdash');
        } catch (err) {
            console.log('error');
            console.log(err);
        }
    }

    const panel = (id, data) => {
        window.renderTemplate('panel', 'panel', {id: id, content: 'sessionPanel'}, () => {
            const p = $(`#panel_${id}`);
            p.show();
            p.draggable();
            p.find('.close').off('click');
            p.find('.close').on('click', function () {
                p.find('#sessionList').html('');
                p.find('#sessionDetail').html('');
                p.hide();
            });

            window.renderTemplate('sessionList', 'sessionList', {sessions: data}, readySessionLinks);
        });
//

        return;

    };
    const copyToClipboard = (elementId) => {
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
    }

    const getSession = (sessionID) => {
        // Prompt the user to enter a password
        let password = prompt('Session password will be omitted from return unless admin password is provided here:', 'canary');
        if (!password) {
            password = '';
        }
        // Perform a fetch call to the server with the session ID as a parameter
//        console.log('we go anyway')
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
                $('#sessionDetail').fadeOut(300, function () {
                    window.renderTemplate('sessionDetail', 'sessionCardSystem', data, readyLaunch);
                    $('#sessionDetail').fadeIn(300, () => {
                        const vp = $('#val_password');
                        vp.addClass('link');
                        vp.off('click');
                        vp.on('click', function() {
                            copyToClipboard($(this).attr('id'));
                        });
                    });
//                    readyLaunch();
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };
    const readySessionLinks = () => {
        const gs = $('.getSession');
        gs.off('click');
        gs.on('click', function() {
            gs.removeClass('highlight');
            var sessionId = $(this).data('session-id');
            $(this).addClass('highlight');
            getSession(sessionId);
        });
    };
    window.readyL = readySessionLinks;
    const readyDevLinks = () => {
        let us = $('#updateSession');
        us.off('click');
        us.on('click', () => {
            socket.emit('updateSession', $('#sessionID').val(), {teams: getTeams(), scores: getScores()})
        });
        us = $('#resetSession');
        us.off('click');
        us.on('click', () => {
            resetTimeout();
        });
    };
    const readyLaunch = () => {
        const l = $('#launch');
        l.off('click');
        l.on('click', () => {
            facilitate();
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
    })
    $(document).ready(function() {
        readySessionLinks();
        readyDevLinks();
    });
});
