document.addEventListener('DOMContentLoaded', function () {
    let socket = null;
    let player = null;
    let game = null;
    // templateStore maintains copies of each fetched template so they can be retrieved without querying the server
    const templateStore = {};
    const scoreMap = {
        0: 'round',
        1: 'src',
        2: 'dest',
        3: 'val',
        4: 'client'
    };

    // Define the setupObserver function to accept an element ID as an argument
    const setupObserver = (elementId, cb) => {
        // Select the target element based on the provided ID
        const targetNode = document.getElementById(elementId);

        // Ensure the targetNode exists before proceeding
        if (!targetNode) {
            console.error(`Element with ID '${elementId}' not found.`);
            return;
        }
        // Options for the observer (which mutations to observe)
        const config = {
            attributes: true,
            childList: true,
            subtree: true
        };
        // Callback function to execute when mutations are observed
        const callback = function (mutationsList, observer) {
            // Iterate over each mutation
            for (const mutation of mutationsList) {
                // Perform actions based on the type of mutation
                if (mutation.type === 'childList') {
                    //                    console.log('A child node has been added or removed');
                    // Perform actions such as updating the UI, etc.
                    if (cb) {
                        cb();
                    }
                } else if (mutation.type === 'attributes') {
                    //                    console.log('Attributes of the target element have changed');
                    // Perform actions such as updating the UI, etc.
                }
            }
        };
        // Create a new observer instance linked to the callback function
        const observer = new MutationObserver(callback);
        // Start observing the target node for configured mutations
        observer.observe(targetNode, config);
        // Later, you can disconnect the observer when it's no longer needed
        // observer.disconnect();
    };
    const checkDevMode = async () => {
//        console.log('checking devMode A');
        return new Promise((resolve, reject) => {
//            console.log('checking devMode B');
            socket.on('returnDevMode', (isDev) => {
//                console.log(`return: ${isDev}`);
                resolve(isDev);
            });
            socket.emit('checkDevMode');


            // Handle errors
            socket.on('error', (error) => {
                // Reject the promise with the error message
                console.warn(`checkDevMode error ${error}`)
                reject(error);
            });
        });
    }
    const procVal = (v) => {
        // process values into numbers, booleans etc
        if (!isNaN(parseInt(v))) {
            v = parseInt(v);
        } else if (v === 'true') {
            v = true;
        } else if (v === 'false') {
            v = false;
        }
        return v;
    }
    const toCamelCase = (str) => {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
            return index !== 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
    };
    const justNumber = (i) => {
        if (i !== undefined && i !== null) {
//            console.log(`converting ${i}`);
            // returns just the numeric character(s) of a string/number
            const out = parseInt(i.toString().replace(/\D/g, ''));
            return out;
        } else {
            console.log(`no value passed to justNumber`)
        }
    };
    const roundNumber = (n) => {
        return Math.round(n * 1000) / 1000;
    };
    const roundAll = (o) => {
        for (let i in o) {
//            console.log(o[i]);
            if (!isNaN(o[i])) {
                o[i] = roundNumber(o[i]);
            }
            if (typeof(o[i]) === 'object') {
                for (let j in o[i]) {
                    if (!isNaN(o[i][j])) {
                        o[i][j] = roundNumber(o[i][j]);
                    }
                }
            }
        }
        return o;
    };
    const emitWithPromise = (theSocket, event, data) => {
        return new Promise((resolve, reject) => {
            theSocket.emit(event, data, (response) => {
                resolve(response);
            });
        });
    };

    const getTemplate = (temp, ob, cb) => {
        // returns a compiled template, but does not render it
        if (templateStore.hasOwnProperty(temp)) {
            // template exists in the store, return that
            const uncompiledTemplate = templateStore[temp];
            if (cb) {
                cb(uncompiledTemplate);
            }
        } else {
            // new template request, fetch from the server
            fetch(`/getTemplate?template=${temp}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ob)
                })
                .then(response => response.text())
                .then(uncompiledTemplate => {
//                    const template = uncompiledTemplate;
                    templateStore[temp] = uncompiledTemplate;
                    if (cb) {
                        cb(uncompiledTemplate);
                    }
                })
                .catch(error => {
                    console.error('Error fetching or rendering template:', error);
                });
        }
    };
    const getPartials = () => {
        // Client-side code
//        console.log(`getPartials`);
        fetch('/partials')
            .then(response => response.json())
            .then(data => {
                const partials = data.partials;
//                console.log('partials');
//                console.log(partials);
                (async () => {
//                    console.log(`the async`)
                    for (const name in partials) {
                        const part = await Handlebars.compile(partials[name]);
                        Handlebars.registerPartial(name, part);
//                        console.log(part);
//                        console.log(`Handlebars.partials:`);
//                        console.log(JSON.parse(JSON.stringify(Handlebars.partials)));
                    }

                })();

                // Now the partials are registered and ready to use
            })
            .catch(error => {
                console.error('Error fetching partials:', error);
            });

    };

    const renderPartial = (targ, temp, ob, cb) => {
        if (ob === undefined) {
            console.error('Error: Data object is undefined');
            return;
        }
        if (targ.indexOf('#', 0) === 0) {
            targ = targ.replace('#', '');
        }
//        console.log(`targ: ${targ}`);
        $(`#${targ}`).css({opacity: 0});
        const part = Handlebars.partials[temp];
//        console.log(part(ob));
        if (document.getElementById(targ)) {
                document.getElementById(targ).innerHTML = part(ob);
            } else {
                console.warn(`target HTML not found: ${targ}`);
            }
            if (cb) {
                cb();
            }
            $(`#${targ}`).css({opacity: 1});
    };
    const removeTemplate = (targ, cb) => {
        $(targ).html('');
        if (cb) {
            cb();
        } else {
            console.warn('no callback provided for removeTemplate method');
        }
    };
    const renderTemplate = (targ, temp, ob, cb) => {
//        console.log(`renderTemplate`, targ, temp);
        if (ob === undefined) {
            console.error('Error: Data object is undefined');
            return;
        }
        if (targ.indexOf('#', 0) === 0) {
            targ = targ.replace('#', '');
        }
//        console.log(`targ: ${targ}`);
        $(`#${targ}`).css({opacity: 0});
        if (templateStore.hasOwnProperty(temp)) {
            // if this template has already been requested we can just serve it from the store
            const compiledTemplate = Handlebars.compile(templateStore[temp]);
            if (document.getElementById(targ)) {
                document.getElementById(targ).innerHTML = compiledTemplate(ob);
            } else {
//                console.warn(`target HTML not found: ${targ}`);
            }
            if (cb) {
                cb();
            }
            $(`#${targ}`).css({opacity: 1});
        } else {
            // If this template is being requested for the first time we will have to fetch it from the server
            fetch(`/getTemplate?template=${temp}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ob)
                })
                .then(response => response.text())
                .then(uncompiledTemplate => {
                    const template = uncompiledTemplate;
                    templateStore[temp] = uncompiledTemplate;
                    const compiledTemplate = Handlebars.compile(template);
                    if (document.getElementById(targ)) {
                        document.getElementById(targ).innerHTML = compiledTemplate(ob);
                    } else {
//                        console.warn(`target HTML not found: ${targ}`);
                    }
                    if (cb) {
                        cb();
                    }

                    $(`#${targ}`).animate({opacity: 1});
                })
                .catch(error => {
                    console.error('Error fetching or rendering template:', error);
                });
        }
    };

//    console.log(`register it now!`);
    const getDyno = (name) => {
//        console.log(`getDyno: ${name}`);
        const partial = Handlebars.partials[name];
        if (typeof partial === 'function') {
            console.log('yep, is a funk');
            const rp = new Handlebars.SafeString(partial(this));
            console.log(rp);
            return rp;
        } else {
            console.log('is not a funk')
        }
        return '';
    }
    Handlebars.registerHelper('dynamicPartialNO', getDyno);
    Handlebars.registerHelper('dynamicPartial', function(partialName, options) {
        // Check if the partialName is defined and is a valid partial
        if (Handlebars.partials[partialName]) {
            // Include the specified partial
            return new Handlebars.SafeString(Handlebars.partials[partialName](this));
        } else {
            // Handle the case where the specified partial is not found
            return new Handlebars.SafeString('Partial not found');
        }
    });
    Handlebars.registerHelper('moreThan', function(a, b, options) {
        if (a > b) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });
    Handlebars.registerHelper('notSameTeam', function(aID, bID, options) {
        if(justNumber(aID) !== justNumber(bID)) {
            return options.fn(this);
        }
    })

    const copyObjectWithExclusions = (obj, exclusions) => {
        const newObj = {};
        // Copy properties from the original object to the new object,
        // excluding properties specified in the exclusions array
        for (const key in obj) {
            if (!exclusions.includes(key)) {
                newObj[key] = obj[key];
            }
        }
        return newObj;
    };
    const createCopyLinks = () => {
        let uc = $('.copylink');
        uc.off('click').on('click', function() {
            copyToClipboard($(this).attr('id'));
        });
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
    };
    const setupPanel = () => {
        console.log('setupPanel')
    };
    const getQueries = (u) => {
        // return an object all query string properties in a given URL
        let qu = {};
        if (u.indexOf('?', 0) > -1) {
            let r = u.split('?')[1];
//            console.log(r);
            // exclude any hash value
            r = r.replace(window.location.hash, '');
            r = r.split('&');
            r.forEach(q => {
                q = q.split('=');
                qu[q[0]] = q[1];
            });
        }
        return qu;
    };
    const filterScorePackets = (sp, prop, val) => {
        const spo = [];
        val = procVal(val);
        sp.forEach(s => {
//            console.log(`${prop} comparison - val: ${val}, s: ${s[prop]}`)
            if (s[prop] === val) {
                spo.push(s);
            }
        });
        return spo;
    };
    const unpackScore = (s) => {
        const sa = s.split('_');
        const o = {};
        sa.forEach((ss, i) => {
            o[scoreMap[i]] = justNumber(ss);
        });
        return o;
    };
    const thisRoundScoredV2 = (pl) => {
        const myPlayer = player === null ? pl : player;
        if (socket && myPlayer) {
            return new Promise((resolve, reject) => {
                socket.emit('getScores', `game-${game.uniqueID}`, (sps) => {
                    console.log(`getScores returns`, sps)
                    const scoreSumm = sps.map(s => `${s.round}.${s.src}`);
                    const rID = `${game.round}.${myPlayer.teamObj.id}`;
                    const spi = scoreSumm.indexOf(rID);
                    console.log(`scoreSumm`, scoreSumm);
                    console.log(`rID`, rID);
                    console.log(`spi`, spi);
                    const resOb = {hasScore: spi > -1, scorePacket: sps[spi], scorePackets: filterScorePackets(sps, 'round', game.round)};
                    console.log(`resOb`, resOb);
                    resolve(resOb);
                });
            })
        } else {
            console.log('no socket shared, cannot emit socket calls');
        }
    };
    const thisRoundScored = (pl) => {




        // NOTE adjust this method to allow for different behaviour between type 1 and 2 teams
        // i.e. type 1 has only 1 active player, so any score counts. With type 2 any player can score so only player-specifc scores should count.





        const myPlayer = player === null ? pl : player;
//        console.log(`judged player`, myPlayer);
        if (socket && myPlayer) {
            return new Promise((resolve, reject) => {
                socket.emit('getScorePackets', `game-${game.uniqueID}`, (sps) => {
                    if (myPlayer.teamObj) {
//                        const specificID = myPlayer.teamObj.type === 1 ? justNumber(myPlayer.id) : myPlayer.teamObj.id;
                        const specificID = myPlayer.teamObj.type === 1 ? myPlayer.teamObj.id : justNumber(myPlayer.id);
                        const specificProp = justNumber(myPlayer.teamObj.type) === 1 ? 'src' : 'client';
//                        console.log(`thisRoundScored ${myPlayer.teamObj.type}, ID: ${specificID}, prop: ${specificProp}`);
    //                    console.log(filterScorePackets(sps, specificProp, specificID));
                        const roundScores = filterScorePackets(sps, 'round', justNumber(game.round))
                        const myScores = filterScorePackets(roundScores, specificProp, specificID);

    //                    console.log(myScores.length);
//                        console.log(roundScores);
//                        console.log(myScores);
    //                    console.log(`new era, thisRoundScored? ${myScores.length > 0}`);
                        const scoreSumm = sps.map(s => `${s.round}.${s.src}`);
                        const rID = `${justNumber(game.round)}.${myPlayer.teamObj.id}`;
                        const spi = scoreSumm.indexOf(rID);

//                        console.log(`scoreSumm`, scoreSumm);
//                        console.log(`rID`, rID);

//                        console.log(`sps`, sps);
//                        console.log(`spi`, spi);
                        const resOb = {hasScore: spi > -1, scorePacket: sps[spi], scorePackets: filterScorePackets(sps, 'round', game.round)};
                        // NEW:
                        resOb.hasScore = myScores.length > 0;
    //                    console.log(resOb);
                        resolve(resOb);
                    }
                });
            })
        } else {
            console.log('no socket shared, cannot emit socket calls');
        }
    };
    const sortNumber = (a, b) => {
        if (a > b) {
            return -1;
        } else if (a < b) {
            return 1;
        } else {
            return 0;
        }
    };
    const sortBy = (array, property, inv) => {
        return array.sort((a, b) => {
            if (a[property] < b[property]) {
                return inv ? 1 : -1;
            }
            if (a[property] > b[property]) {
                return inv ? -1 : 1;
            }
            return 0;
        });
    };
    const containsEmail = (s) => {
        const e = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        return e.test(s);
    };
    // allocation/vote controls can be used in facilitator dashboards, hence are defined in common.
    const setupAllocationControl = async (inOb) => {
//        console.log(`setupAllocationControl`);
//        console.log(player);
        const myPlayer = player === null ? inOb : player;
//        console.log('myPlayer', myPlayer);
        const butMinus = $('#vote_btn_minus');
        const butPlus = $('#vote_btn_plus');
        const val = $('.tempV');
        const submit = $(`#buttonAllocate`);
        const action = $(`#action-choice`);
        const desc = $(`#actionDesc`);
        const ints = $('#vote_btn_minus, #vote_btn_plus, #buttonAllocate, #action-choice, #actionDesc');
        const descMax = 150;
//        console.log()
        const hasS = await thisRoundScored(myPlayer);
//        console.log(`hasS`, hasS);
        if (hasS) {
//            console.log('see if the round has been scored already:');
//            console.log(hasS);
            if (hasS.hasScore) {
//                console.log('has score');
                const vOb = {gameID: `game-${game.uniqueID}`, team: myPlayer.teamObj.id};
                socket.emit('getValues', vOb, (v) => {
//                    console.log('test the values')
//                    console.log(v)
                    ints.prop('disabled', true);
                    ints.addClass('disabled');
                    val.html(hasS.scorePacket.val);
                    desc.html(v.description);
                    action.val(v.action);
                });
            } else {
//                console.log('no score, OK to go')
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
                desc.on('input', function () {
//                    console.log(`${$(this).val().length}/${descMax}`);
                    const t = $(this).val();

                    if (containsEmail(t)) {
                        alert('Please do not include email addresses.')
                    }
                    if (t.length >= descMax) {
                        $(this).val(t.substr(0, descMax - 1));
                    }
                    const summ = `${t.length}/${descMax}`;
                    const label = $(this).parent().find('#moveDescLabel');
                    const base = label.html().replace(/[()/\d-]/g, ' ').replace(/\s+$/, '');
//                    console.log(base)
                    label.html(`${base}   (${summ})`);
                });
                submit.on('click', () => {
                    let scoreV = parseInt(val.html());
                    let actionV = action.val();
                    let descV = desc.val();
                    if (scoreV === 0 || actionV === '' || descV === '') {
                        alert('Please complete all options and allocate at least 1 resource')
                    } else {
                        const tID = myPlayer.teamObj.id;
                        let t = myPlayer.teamObj.id;
                        const vob = {game: game.uniqueID, values: {team: t, action: actionV, description: descV}};
//                        console.log(`the submission:`);
//                        console.log(socket);
                        socket.emit('submitValues', vob);
//                        const sob = {scoreCode: {src: t, dest: t, val: scoreV}, game: game.uniqueID, client: player.index};
                        const sob = {scoreCode: {src: t, dest: t, val: scoreV}, game: game.uniqueID, client: justNumber(myPlayer.id)};
                        socket.emit('submitScore', sob, (scores) => {
                            setupAllocationControl();
//                            window.location.reload();
                        });

    //                    setupAllocation(false);
                    }
                });
            }
        } else {
            console.log(`Whoops, no 'round scored' object found`);
        }
    };
    const setupVoteControl = async (inOb) => {
        console.log(`setupVoteControl:`);
        const myPlayer = player === null ? inOb : player;
        console.log(myPlayer);
        const plIndex = procVal(myPlayer.index) - 1;
        const plID = justNumber(myPlayer.id);
        const hasS = await thisRoundScored(myPlayer);
//        console.log(`hasS`, hasS);
//        console.log(`plIndex: ${plIndex}`);
//        console.log(`plID: ${plID}`);
        const butAdj = $('.resources-btn');
        const butMinus = $('.vote_btn_minus');
        const butPlus = $('.vote_btn_plus');
        const vAvailDisp = $('#vAvail');
        const vTotalDisp = $('#vTotal');
        const val = $('.value');
        const submit = $(`#buttonAllocate`);
        const ints = $('.vote_btn_minus, .vote_btn_plus, #buttonAllocate');
        const vTotal = myPlayer.teamObj.votes;
        const r = parseInt(game.round);
        vAvailDisp.html(0);
        vTotalDisp.html(vTotal);
        const aOb = {gameID: `game-${game.uniqueID}`, round: procVal(game.round), src: myPlayer.teamObj.id};
        console.log('emit it');
        socket.emit('getAggregates', aOb, (a, sp, report) => {
            console.log('back')
            const myScores = filterScorePackets(sp, 'client', plID);
            const playerHasScored = Boolean(myScores.length);
            if (playerHasScored) {
                butMinus.addClass('disabled');
                butPlus.addClass('disabled');
                submit.addClass('disabled');
                let t = 0;
                val.each((i, v) => {
                    $(v).html(myScores[i].val);
                    t += Math.abs(myScores[i].val);
                });
                vAvailDisp.html(t);
                console.log(`already scored, not doing nuffin`);
            } else {
                console.log('player has not scored');
                butAdj.off('click').on('click', function () {
                    let t = 0;
                    val.each((i, v) => {
                        if($(v).closest('tr').attr('id') !== $(this).closest('tr').attr('id')) {
                            t += Math.abs(parseInt($(v).html()));
                        }
                    });
                    // player.teamObj.votes must be the same for each player at setup
                    const avail = vTotal - t;
                    const adj = $(this).attr('id').indexOf('plus', 0) > -1 ? 1 : -1;
                    const h = $(this).parent().parent().parent().find('.value');
                    let v = parseInt(h.html());
                    if (Math.abs(v + adj) <= Math.abs(avail)) {
                        v += adj;
                        h.html(v);
                    }
                    vAvailDisp.html(Math.abs(t) + Math.abs(v));
                });
                submit.off('click').on('click', () => {
                    const sOb = {scoreCode: [], game: game.uniqueID, player: myPlayer.id};
    //                console.log(`submit clicked`);
                    val.each((i, v) => {
    //                    sOb.scoreCode.push({src: player.teamObj.id, dest: i, val: parseInt($(v).html()), client: procVal(player.index)});
    //                    console.log(v);
    //                    console.log($(v));
    //                    console.log($(v).attr('id'));
    //                    console.log(justNumber($(v).attr('id')));
                        sOb.scoreCode.push({src: myPlayer.teamObj.id, dest: justNumber($(v).attr('id')), val: parseInt($(v).html()), client: justNumber(myPlayer.id)});

                    });
    //                console.log(player);
                    console.log('submitScoreForAverage', sOb);
                    socket.emit('submitScoreForAverage', sOb);
                    setupVoteControl(myPlayer);
    //                window.location.reload();
                });
            }
        });

    };
    // the 'share' methods are for sharing objects defined in other code files
    const socketShare = (sock) => {
        socket = sock;
//        console.log('share it out; socket');

    };
    const playerShare = (pl) => {
        player = pl;
//        console.log('share it out; player');

    };
    const gameShare = (g) => {
        game = g;
//        console.log('share it out; game');

    };
    // NOTE: parials are currently set up each time the system admin connects, so the method call below is safe for now.
    // In case of problems getting partials, check the order of system architecture.
    getPartials();
    window.procVal = procVal;
    window.justNumber = justNumber;
    window.roundNumber = roundNumber;
    window.roundAll = roundAll;
    window.emitWithPromise = emitWithPromise;
    window.toCamelCase = toCamelCase;
    window.removeTemplate = removeTemplate;
    window.renderTemplate = renderTemplate;
    window.renderPartial = renderPartial;
    window.getTemplate = getTemplate;
    window.setupPanel = setupPanel;
    window.setupObserver = setupObserver;
    window.copyObjectWithExclusions = copyObjectWithExclusions;
    window.copyToClipboard = copyToClipboard;
    window.createCopyLinks = createCopyLinks;
    window.getQueries = getQueries;
    window.getPartials = getPartials;
    window.socketShare = socketShare;
    window.playerShare = playerShare;
    window.gameShare = gameShare;
    window.thisRoundScored = thisRoundScored;
    window.unpackScore = unpackScore;
    window.setupAllocationControl = setupAllocationControl;
    window.setupVoteControl = setupVoteControl;
    window.checkDevMode = checkDevMode;
    window.sortBy = sortBy;
    window.sortNumber = sortNumber;
    window.filterScorePackets = filterScorePackets;
});
