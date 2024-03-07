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
    }
    document.getElementById('showSessionsForm').addEventListener('submit', function(event) {
        event.preventDefault();
        // Use fetch to submit the form data to the server asynchronously
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
                $('.panel_sessions').show();
                $('.panel_sessions').draggable();
                window.renderTemplate('sessionList', 'sessions', {sessions: data});
                readySessionLinks();
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
//        console.log('facilitate - cookie?');
//        console.log(document.cookie);
//        document.cookie = `sessionID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        try {
            const session = $('#val_uniqueID').html();
            const password = $('#val_password').html();
//            console.log(session, password);
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
            window.open(`/facilitatordashboard`, 'facdash');
        } catch (err) {
            console.log('error');
            console.log(err);
        }
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
                    window.renderTemplate('sessionDetail', 'session', data);
                    $('#sessionDetail').fadeIn();
                    readyLaunch();
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };
    const readySessionLinks = () => {
        // Attach click event handler to elements with class 'getSession'
        $('.getSession').off('click');
        $('.getSession').on('click', function() {
            // Get the session ID from the 'data-session-id' attribute
            var sessionId = $(this).data('session-id');
            getSession(sessionId);

        });
    };
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
    $(document).ready(function() {
        readySessionLinks();
        readyDevLinks();
    });
});
