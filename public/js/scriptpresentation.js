document.addEventListener('DOMContentLoaded', function() {
    let gameID = null;
    let game = null;
    const getSessionID = () => {
        const ID = window.location.hash.replace('#', '');
        gameID = ID;
        return ID;
    }
    let socket = null;
    const estSocket = () => {
        socket = io('', {
            query: {
                role: 'presentation',
                id: getSessionID()
    //            session: session
            }
        });
        socket.on('setGame', (rgame) => {
            game = rgame;
            console.log(game)
        });
        socket.on('gameUpdate', (game) => {


        })
    };
    const init = () => {
        renderTemplate('insertion', 'slides/slidetest', {msg: 'wow'});
        // Delay required to ensure game is started prior to init; find a better way to do this.
        setTimeout(() => {
            estSocket();
        }, 1000);
    };
    const showScores = () => {
        socket.emit('getScores', `game-${game.uniqueID}`, (s) => {
            console.log(`showScores callback`);
            console.log(s);
            renderTemplate('insertion', 'slides/showscores', s);
        })
    };
    const sortByProperty = (array, property) => {
        return array.sort((a, b) => {
            // Extract the values of the specified property from each object
            const valueA = a[property];
            const valueB = b[property];

            // Compare the values and return the result
            if (valueA < valueB) {
                return -1;
            } else if (valueA > valueB) {
                return 1;
            } else {
                return 0;
            }
        });
    };
    const showValues = () => {
        socket.emit('getAllValues', `game-${game.uniqueID}`, (v) => {
            console.log(`getAllValues callback`);
            const vals = Object.assign({}, v);
            console.log(game)
            for (let i in vals) {
                vals[i].teamTitle = game.persistentData.teamsArray[vals[i].team].title;
            }
            console.log(vals)
            const valsArr = Object.values(vals);
            valsArr = sortByProperty(valsArr, 'team');
            console.log(valsArr);
            renderTemplate('insertion', 'slides/showvalues', v);
        })
    };
    const showRound1 = () => {
        socket.emit('getGame', `${game.uniqueID}`, (rgame) => {
            game = rgame;
            let s = null;
            let v = game.values;
            const t = game.persistentData.teamsArray;
            let rArr = [];
            socket.emit('getScores', `game-${game.uniqueID}`, (rs) => {
                s = rs;
                v = sortByProperty(v, 'team');
                s = sortByProperty(s, 'src');
                v.forEach((vu, i) => {
                    const ob = {
                        team: vu.team,
                        title: t[i].title,
                        action: vu.action,
                        description: vu.description,
                        value: s[i].val,
                        teamObj: t[i]
                    }
                    rArr[i] = ob;
//                    console.log(ob)
                });
                renderTemplate('insertion', 'slides/showround1', rArr);
            });

        });
    }
    init();
    renderTemplate = window.renderTemplate;
    window.showScores = showScores;
    window.showValues = showValues;
    window.showRound1 = showRound1;

});
