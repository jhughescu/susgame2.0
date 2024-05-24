let Game = null;
let Player = null;
let Presentation = null;
let Team = null;
let ScorePacket = null;
const sessionController = require('./../controllers/sessionController');
const { getEventEmitter } = require('./../controllers/eventController');
const routeController = require('./../controllers/routeController');
const gfxController = require('./../controllers/gfxController');
const tools = require('./../controllers/tools');

const eventEmitter = getEventEmitter();
let updateDelay = null;
const games = {};
const logging = true;

const log = (msg) => {
    if (process.env.ISDEV && logging) {
        if (typeof(msg) === 'object' && !msg.hasOwnProperty('length')) {
            console.log(Object.assign({loggedBy: `gameController`}, msg));
        } else {
            console.log(`gameController: ${msg}`);
        }
    }
};
const error = (msg) => {
    console.log(`>>>>>>>>>>> gameController error: ${msg}`);
};

async function startGame (o, cb) {
    // startGame will create a new game if one does not exist, and return the Game in either case
    const session = JSON.parse(o);
//    console.log(`gameController startGame, session:`);
//    console.log(session);
    const game = `game-${session.uniqueID}`;
    log(`startGame: ${game}`);
    let rg = null;
    if (!games.hasOwnProperty(game)) {
        Game = require(`./../models/game.${session.type}`);
        Player = require(`./../models/player.${session.type}`);
        Presentation = require(`./../models/presentation.${session.type}`);
        Team = require(`./../models/team.${session.type}`);
        ScorePacket = require(`./../models/scorepacket.${session.type}`);
        const newGame = await new Game(session.uniqueID, session.type);
        const presentation = await new Presentation(session.uniqueID, session.type);
        await presentation.loadPersistentData();
        presentation.currentSlide = session.slide;
        newGame.presentation = presentation;
        games[game] = newGame;
    }
    // Only set state to 'started' if it is currently pending
//    console.log(`session.state: ${session.state}`);
    if (session.state ===  'pending') {

        const rSession = await sessionController.updateSession(session.uniqueID, {state: 'started'});
        if (rSession) {
            session.state = rSession.state;
//            console.log('OK, the return is good');
//            console.log(`session`, session);
//            console.log(`rSession`, rSession);

        }
    }

    rg = games[game];
    Object.assign(rg, session);
    routeController.createRoute(`${session.address}`);
    gfxController.generateSessionQR(session);
    try {
        await rg.loadPersistentData(session.type);
    } catch (error) {
        console.error('Error loading persistent data:', error);
    }

    const smts = session.mainTeamSize;
    const pdts = rg.persistentData.teamSize;
    if (!smts) {
        sessionController.updateSession(session.uniqueID, {mainTeamSize: pdts});
    }
    eventEmitter.emit('gameReady', rg);
    if (cb) {
//        console.log('game to return:', rg);
        cb(rg);
    }
    return rg;
};
async function restoreGame (o, cb) {
    // restoreGame will set up a game that has been started, but due to some sort of failure has been removed from the 'games' object.
    // Restore by creating a new instance of Game and then loading any stored info from the database.
    // NOTE a Game is a far more complex object than a Session, which comprises only the persistent data, hence the need to rebuild.
    let game = await startGame(o);
    const session = await sessionController.getSessionWithID(game.uniqueID);
    if (session) {
        game = Object.assign(game, session._doc);
        // RETAIN LINE BELOW:
        console.log(`gameController.restoreGame has restored the game ${game.uniqueID}`);
        restoreClients(game.address);
    }
    if (cb) {
        cb(game);
    } else {
        console.error('restoreGame requires a callback');
    }
};
async function resetGame(id, cb) {
    const game = getGameWithUniqueID(id);
    const exclusions = ['presentation', 'persistentData', 'players'];
    if (game) {
        // Note: add a condition that only system admin can reset a game with state='ended'
        if (game.state === 'ended') {

        } else {

        }

        // ADD A NEW CONDITION HERE THAT PREVENTS THE ERASURE OF 'PLAYERS'
        // NOTE: TRY JUST NOT RESETTING THE SESSION; IF THE STORED DATA SURVIVES THIS MAY BE ENOUGH



        eventEmitter.emit('resetAll', game.address);
//        Object.entries(game).forEach(([p, v]) => {
//            console.log(p);
//            console.log(v);
//        });
        Object.entries(game).forEach(value => {
            if (typeof(value) === 'object') {
                if (value.hasOwnProperty.length) {
                    value = [];
                } else {
                    value = {};
                }
            }
        });
        for (let i in game) {
            console.log(`reset ${i}? ${exclusions.indexOf(i, 0) === -1}`)
//            if (typeof(game[i]) === 'object' && i !== 'persistentData' && i !== 'presentation') {
            if (typeof(game[i]) === 'object' && exclusions.indexOf(i, 0) === -1) {
                if (game[i].hasOwnProperty('length')) {
                    game[i] = [];
                } else {
                    game[i] = {};
                }
            }
        }
        game.state = 'pending';
        const session = await sessionController.updateSession(id, {state: 'pending', players: game.players, teams: game.teams, scores: [], values: [], slide: 0, round: 0});
        if (session) {
//            log('return updated session here');
//            log(session);
            if (cb) {
                cb(session);
            }
        }
    }
};
async function makeLead (ob) {
    // change the team lead based on the object passed
    const game = games[`game-${ob.game}`];
    if (game) {
        let t = game.teams[ob.team].slice();
        t.splice(t.indexOf(ob.player), 1);
        t.unshift(ob.player);
        game.teams[ob.team] = t;
        const leadNew = game.playersFull[ob.player];
        const leadOld = game.playersFull[t[1]];
        game.setTeam(leadNew);
        //  \/ changes the existing lead (which has now been shunted to index 2)
        game.setTeam(leadOld);
        const session = await sessionController.updateSession(ob.game, {teams: game.teams});
        eventEmitter.emit('gameUpdate', game);
        eventEmitter.emit('singlePlayerGameUpdate', {player: leadNew, game});
        eventEmitter.emit('singlePlayerGameUpdate', {player: leadOld, game});
    } else {
        console.log(`cannot change lead; no game with ID game-${ob.game}`)
    }

};
async function reassignTeam (ob) {
    // assign a player to a different team
    const game = games[`game-${ob.game}`];
    if (game) {
        console.log(ob);
        let oldT = game.teams[ob.team].slice();
        let newT = game.teams[ob.newTeam].slice();
//        console.log(oldT);
//        console.log(newT);
        oldT.splice(oldT.indexOf(ob.player), 1);
        newT.push(ob.player);
        console.log(`new team`, newT);
        console.log(`old team`, oldT);
//        return;
//        t.splice(t.indexOf(ob.player), 1);
//        t.unshift(ob.player);
        game.teams[ob.team] = oldT;
        game.teams[ob.newTeam] = newT;
        const player = game.playersFull[ob.player];
        game.setTeam(player);
        //  \/ changes the existing lead (which has now been shunted to index 2)
//        game.setTeam(leadOld);
        const session = await sessionController.updateSession(ob.game, {teams: game.teams});
        eventEmitter.emit('gameUpdate', game);
        eventEmitter.emit('singlePlayerGameUpdate', {player: player, game});
    } else {
        console.log(`cannot reassign player; no game with ID game-${ob.game}`)
    }

};

const restoreClients = (address) => {
    // refresh connected clients on game restore
    setTimeout(() => {
        eventEmitter.emit('getSockets', address, (socks) => {
            if (socks) {
                if (socks.size > 0) {
//                    console.log(`${address} has ${socks.size} clients connected`);
                    // game has connected clients, wait then refresh them
                    setTimeout(() => {
                        eventEmitter.emit('refreshSockets', address);
                    }, 1000);
                }
            }
        });
    }, 500);
};
const getGameCount = (cb) => {
//    log('getGames');
//    log(cb);
    if (cb) {
        cb(Object.keys(games).length);
    }
    return games;
};
const getGame = (id, cb) => {
    let gg = null;
//    log(`get game with id ${id}`);
//    log(games);
    id = id.toString();
    if (id.indexOf('/', 0) > -1) {
        // presume searching with address
//        log(`presume searching with address`);
        gg = getGameWithAddress(id);
    } else {
        // presume searching with uniqueID
//        log(`presume searching with uniqueID`);
        gg = getGameWithUniqueID(id);
    }
    if (!gg) {
        console.log(`no game with ID ${id}`)
    }
//    log(gg);
    if (cb) {
        cb(gg);
    }
    return gg;
};
const getGameWithUniqueID = (id) => {
    for (let g in games) {
//        console.log(games[g].uniqueID.toString(), id.toString())
//        console.log(games[g].uniqueID.toString() === id.toString())
        if (games[g].uniqueID.toString() === id.toString()) {
//            log(games[g].uniqueID)
            return games[g];
        }
    }
};
const getGameWithAddress = (add) => {
//    console.log(`GETGAMEWITHADDRESS: ${add}`)
    for (let g in games) {
//        console.log(games[g].address, add)
        if (games[g].address === add) {
            return games[g];
        }
    }
    return null;
};
const changeName = async (ob) => {
    const sesh = await sessionController.updateSession(`${ob.gameID}`, {name: ob.name});
    const game = games[`game-${ob.gameID}`];
    if (sesh && game) {
        game.name = sesh.name;
        eventEmitter.emit('gameUpdate', game);
    } else {
        error(`gameController: can't change name, game or session undefined`)
    }
};
const getScores = (gameID, cb) => {
    console.log(`getScores`);
    const game = games[gameID];
    let ss = [];
    if (game) {
        console.log(`game.scores`, game.scores);
        game.scores.forEach(s => {
            ss.push(s)
        });
    } else {
        console.log(`no game with ID ${gameID}`);
    }
    if (cb) {
        console.log(`getScores callback, ss:`, ss);
        cb(ss);
    }
    return ss;
};
const getScorePackets = (gameID, cb) => {
//    console.log(`getScorePackets`);
    if (gameID.toString().indexOf('game', 0) === -1) {
        gameID = `game-${gameID}`
    }
    const game = games[gameID];
    let sps = [];
    if (game) {
//        console.log(`game.scores`, game.scores);
        game.scores.forEach(s => {
            sps.push(new ScorePacket(s))
        });
    } else {
        console.log(`no game with ID ${gameID}`);
    }
    if (cb) {
//        console.log(`getScorePackets callback, sps:`, sps);
        cb(sps);
    }
    return sps;
};
const filterScorePackets = (gameID, prop, val, spIn) => {
    const sp = spIn ? spIn : getScorePackets(gameID);
    const spo = [];
    sp.forEach(s => {
        if (s[prop] === val) {
            spo.push(s);
        }
    });
    return spo;
};
const getRoundNum = (rs) => {
    // since round has become a string, it is useful to be able access just the numeric aspect

    return parseInt(rs.toString().replace(/\D/g, ''));
};
const createAggregate = (ob, cb) => {
    // filter score packets for round and src, then create aggregate/average values for each dest
    const gameID = ob.gameID;
    const round = ob.round;
    const src = ob.src;
    const game = games[gameID];
    let a = [];
    let report = '';
    if (game) {
        let spStatic = game.getScorePackets().slice(0);
        spStatic.forEach((p, i) => {spStatic[i] = new ScorePacket(p)});
        let sp = game.getScorePackets().slice(0);
        report += `number of score packets: ${sp.length}`;
        sp.forEach((s, i) => {
            if (typeof(s) !== 'object') {
                sp[i] = new ScorePacket(s);
            }
        });
        sp = filterScorePackets(gameID, 'round', round, sp);
        report += `, after filtering: ${sp.length}`;
        const dests = Array.from(new Set(sp.map(item => item.dest)));
        dests.forEach(d => {
            const spsd = filterScorePackets(gameID, 'dest', d, sp);
            report += `\n${d} - dest-specific packets: ${spsd.length}`;
            let valTotal = 0;
            const agOb = {dest: d, valTotal: 0, valAverage: 0, valCount: 0}
            spsd.forEach((p, i) => {
                valTotal += p.val;
                agOb.valCount = (i + 1);
                agOb.valTotal = valTotal;
                agOb.valAverage = valTotal / (i + 1);
            });
            a[d] = agOb;
        });

        if (cb) {
            cb(a, spStatic, report);
        } else {
            console.log(`createAggregate error: no callback sent`)
        }
    } else {
        console.log(`createAggregate error; no ame with ID ${gameID}`);
    }
};
const getAllValues = (gameID, cb) => {
    const game = games[gameID];
    let vs = [];
    if (game) {
        game.values.forEach(v => {
            vs.push(v);
        });
    } else {
        console.log(`no game with ID ${gameID}`);
    }
    if (cb) {
        cb(vs);
    }
    return vs;
};
const getValues = (idOb, cb) => {
    const game = games[idOb.gameID];
    if (game) {
        for (let v in game.values) {
//            console.log(v)
//            console.log(v.team, idOb.team, v.team === idOb.team)
            if (game.values[v].team === idOb.team) {
                cb(game.values[v]);
                return game.values[v];
            }
        }
    } else {
        console.log(`no game called ${idOb.gameID}`);
    }
};
const assignTeams = (ob, cb) => {
    const game = getGameWithAddress(ob.address);
    let t = null;
    switch (ob.type) {
        case 'order':
            t = game.assignTeamsOrder(ob);
            break;
        default:
            log('no order type specified');
        }
    if (t) {
        if (typeof(t) === 'object') {
            // successful return of team data
            // Don't run if previewing
            game.teams = t;
            if (!ob.preview) {
                const uo = {teams: t};
                sessionController.updateSession(game.uniqueID, uo);
                game.setTeams();
                eventEmitter.emit('teamsAssigned', game);
            }
            if (cb) {
                cb(game);
            }
        } else {
            // method has returned an error message
            if (cb) {
                cb(t);
            }
        }
    }
};

const resetTeams = (ob, cb) => {
    const game = getGameWithAddress(ob.address);
    let t = [];
    const uo = {teams: t};
//    log('reseeeter');
    sessionController.updateSession(game.uniqueID, uo);
    game.unsetTeams();
    game.teams = t;
//    log(game);
    if (cb) {
        cb(game);
    }
};
const setTeamSize = (ob, cb) => {
    const game = games[ob.gameID];
    if (game) {
        games[ob.gameID].mainTeamSize = ob.n;
//        console.log(games[ob.gameID]);
        sessionController.updateSession(ob.gameID.replace('game-', ''), {mainTeamSize: ob.n});
        cb(games[ob.gameID]);
    } else {
        console.log(`setTeamSize: no game with ID ${ob.gameID} exists`);
        Object.keys(games).forEach(g => console.log(g))
    }
};
const getFullTeam = (id, game) => {
//    log(`getFullTeam for ${id}`);
//    log(game);
    const arr = game.teams;
    let ti = -1;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].includes(id)) {
            ti = i;
            break;
        }
    }
    const t = game.persistentData.teams[`t${ti}`];
//    log(t);
    return t;
};
const showGames = () => {
    console.log(`showGames:`)
    Object.keys(games).forEach(g => console.log(g));
}
const endGame = (game, cb) => {
    console.log(`end game with address ${game.address}`);
    routeController.destroyRoute(game.address);
    game.players = [];
    game.teams = [];
    game.state = 'ended';
    if (cb) {
        cb(game);
    }
    eventEmitter.emit('gameEnded', game);
};
const deleteGame = (gameID) => {
    // Heavyweight deletion method. Called from socketController via sessionController, which have password safeguards etc.
    // Do not implement via other modules without adding significant protection.
    const killID = `game-${gameID}`;
    const game = games[killID];
    if (game) {
//        console.log(`prepare to delete game`);
        // remove any created assets:
        gfxController.deleteQR(gameID);
        // destroy any associated routes:
        routeController.destroyRoute(game.address);
        // finally destroy the entire game object:
        delete games[killID];
//        gamez = Object.assign({}, games);
//        console.log(`at the final reckoning we have ${Object.values(gamez).length} games left in the system`);
//        showGames();
    } else {
        console.log(`Attempt to delete game failed as no game with ID ${killID} has been initialised`);
    }
};
const newGetTheRenderState = (game, id) => {
    let rs = {};
    game = games[`game-${game.uniqueID}`];
    if (game) {
        if (game.persistentData) {
//            if (game.teams.length > 0) {
//            console.log('first hurdle')
                const player = game.playersFull[id];
                rs.ob = player;
                const team = player.teamObj;
                if (team) {
//                    console.log('second hurdle');

                    let roundComplete = false;
                    let roundNum = null;
                    let roundInfo = {}
                    let inThisRound = false;
                    if (game.round) {
                        roundComplete = game.round.toString().indexOf('*', 0) > -1;
                        roundNum = tools.justNumber(game.round);
                        roundInfo = game.persistentData.rounds[roundNum];
                        inThisRound = team.type === roundInfo.type;
                    }
                    const scores = game.scores;
                    const scorePackets = [];
                    scores.forEach(s => {scorePackets.push(new ScorePacket(s))})
                    const playerHasScored = filterScorePackets(game.uniqueID, 'type', tools.justNumber(player.id), scorePackets).length > 0;
                    const canInteract = player.isLead || !team.hasLead;
                    const teamHasScored = filterScorePackets(game.uniqueID, 'src', team.id, scorePackets).length > 0;
                    const scoreCompletionMetric = team.type === 1 ? teamHasScored : playerHasScored;
//                    console.log(`newGetTheRenderState, gameState:`, game.state);
                    const msg = `I am player ${player.id} of team ${team.title} have I already scored? ${scoreCompletionMetric} - can I interact in round ${roundNum}? ${!scoreCompletionMetric && canInteract && inThisRound}`;
//                    console.log(msg);
                    rs.msg = msg;
                    rs.temp = 'game.main';
                    rs.partialName = 'game-links';
                    rs.summary = {
                        canInteract: canInteract,
                        intThisRound: inThisRound,
                        playerHasScored: playerHasScored,
                        teamHasScored: teamHasScored,
                        scoreCompletionMetric: scoreCompletionMetric
                    };
                    if (!scoreCompletionMetric && canInteract && inThisRound) {
                        rs.temp =  `game.${roundInfo.template}`;
                        rs.tempType = 'interaction';
//                        console.log(rs);
                    }
                } else {
                    if (game.state === 'ended') {
                        rs.temp = 'game.gameover';
                    } else if (game.state === 'pending') {
                        rs.temp = 'game.pending';
                    } else {
                        if (game.teams.length > 0) {
                            // only remaining state is 'started'
                            // default state is always main page with links
                            rs.temp = 'game.main';
                            rs.partialName = 'game-links';
                            console.log('the test:');
                            if (!scoreCompletionMetric && canInteract && inThisRound) {
                                rs.temp =  `game.${roundInfo.template}`;
                                rs.tempType = 'interaction';
                                console.log(rs);
                            } else {
                                console.log(`conditions not met`)
                            }
                        } else {
                            rs.temp = 'game.intro';
                        }
                    }
                }
//            }
        }
    }
//    console.log(rs);
    return rs;
}
const getTheRenderState = (game, id) => {
    const newRs = newGetTheRenderState(game, id);
    // returns an object which tells the player which template to render
    let rs = {};
    // Ensure current game data by deriving & fetching from the games object:
    game = games[`game-${game.uniqueID}`];
    if (game) {
        if (game.persistentData) {
            const gameRound = tools.justNumber(game.round);
            let roundComplete = false;
            if (game.round) {
                roundComplete = game.round.toString().indexOf('*', 0) > -1;
            }
//            log(`~~~~~~~~~~~~~~~~~~~~ getTheRenderState: ${id}, game.round: ${gameRound}`);
            const player = game.playersFull[id];
//            console.log(player)
            const round = game.persistentData.rounds[gameRound];
//            console.log(`round`, round);
            let leads = game.teams.map(c => c[0]);
            // trim the 'leads' array so it only uses main teams (sub teams have no lead)
            leads = leads.splice(0, game.persistentData.mainTeams.length);
    //        console.log(`leads: ${leads}`);
            const isLead = leads.includes(id);
            const team = game.teams.findIndex(t => t.includes(id));
            const teamObj = game.persistentData.teams[`t${team}`];
            let hasLead = false;
            if (teamObj) {
                hasLead = teamObj.hasLead;
            }
//            console.log(`trying it out: ${game.round}`);
            const scoreRef = gameRound ? `${getRoundNum(gameRound)}_${team}` : null;
            // check this value \/ , the map array should have only one element
//            console.log(`here is where we check if the round has been scored already; if it has, input forms will not be rendered.`);
            const hasScore = game.scores.map(s => s.substr(0, 3) === scoreRef)[0];
//            console.log(`scoreRef`, scoreRef);
//            console.log(`hasScore`, hasScore);
//            console.log(`roundComplete`, roundComplete);
//            console.log(`what about round?`, round);
//            console.log(`what about game.round?`, gameRound);
            if (game.state === 'ended') {
                rs.temp = 'game.gameover';
            } else if (game.state === 'pending') {
                rs.temp = 'game.pending';
            } else {
                // only remaining state is 'started'
                if (game.teams.length > 0) {
                    rs.temp = 'game.main';
                    rs.partialName = 'game-links';
                    if (game.state === 'started') {
                        if (isLead || !hasLead) {
                            if (hasScore && hasLead) {
                                rs.temp = 'game.main';
                            } else {
                                if (round) {
                                    if (round.n > 0) {
                                        rs.temp =  `game.${round.template}`;
                                        rs.tempType = 'interaction';
                                    }
                                }
                            }
                        }
                    } else {
                        rs.sub = null;
                    }
                    rs.ob = game.playersFull[id];
                } else {
                    rs.temp = 'game.intro';
                }
            }
//            rs.stuff = `id: ${id}, hasLead: '${hasLead}, isLead: '${isLead}, team: ${team}, scoreRef: ${scoreRef}, hasScore: ${hasScore}, gameState: ${game.state}, round: ${round ? round.n : false }`;
//            rs.stuffObj = {id: id, hasLead: hasLead, isLead: isLead, team: team, scoreRef: scoreRef, hasScore: hasScore, gameState: game.state, round: (round ? round.n : false) };
            const rsCopy = Object.assign({}, rs);
//            console.log(rs)
//            delete rsCopy.ob;
        }
    } else {
        console.log(`getTheRenderState cannot complete; game not defined ()`)
    }
//    log('rs:');
//    log(rsCopy);
//    Object.assign(rs, newRs);
//    return {old: rs, new: newRs};
    rs.newRs = newRs;
    rs = newRs;
    return rs;
};
const getRenderState = (ob, cb) => {
//    console.log(`getRenderState:`);
//    console.log(ob);
    cb(getTheRenderState(ob.game, ob.playerID));
}
const registerPlayer = (ob, cb) => {
//    log(`registerPlayer to game ${ob.game}`);
//    log(ob)
    const game = getGameWithAddress(ob.game);
    let ID = null;
    let newP = null;
    let timer = null;
    let player = null;
    if (game) {
//        log(game);
        // store a copy of the list of players for later comparison
        const plOrig = JSON.stringify(game.players);
        // index will be the joining order (i.e first connected player index = 1 etc)
        let index = -1;
        if (ob.player) {
            ID = ob.player;
            const pl = game.players.reduce((acc, plID) => {
                acc[plID] = true;
                return acc;
            }, {});
            newP = !pl.hasOwnProperty(ob.player);
            if (newP) {
                game.players.push(ob.player);
                index = game.players.length;
            }
            if (!game.playersFull.hasOwnProperty(ID)) {
                let plIndex = index > -1 ? index : game.players.indexOf(ID) + 1;
//                log(`create new player with id ${ID} at index ${plIndex}`);
                player = new Player(ID, plIndex, ob.socketID);
                game.playersFull[ID] = player;
                game.setTeam(player);
            } else {
                // update the existing player object with the new socketID
                game.playersFull[ID].socketID = ob.socketID;
            }
        } else {
            ID = `p${ob.fake ? 'f' : ''}${game.players.length + 1}`;
            game.players.push(ID);
            newP = true;
        }
        if (newP && game.teams.length > 0) {
            console.log(`looks like a new player (${ID}) joining after teams are assigned`);
            game.addLatecomer(player);
            console.log(game.teams);
            sessionController.updateSession(game.uniqueID, {teams: game.teams});
//            eventEmitter.emit('gameUpdate', game);
        }

        eventEmitter.emit('gameUpdate', game);
        // Compare the list of players with the stored list & update database if they differ
        if (JSON.stringify(game.players) !== plOrig) {
            clearTimeout(updateDelay);
            updateDelay = setTimeout(() => {
                // save list of players, but do so on a timeout so as not to address the database too frequently
                sessionController.updateSession(game.uniqueID, {players: game.players});
            }, 5000);
        }
        if (cb) {
            cb({id: ID, renderState: getTheRenderState(game, ID), game: JSON.stringify(game)});
        } else {
            log('reg P, no CB');
        }
//        log(`registerPlayer to game ${ob.game} with id: ${ID}`);
        return ID;
    } else {
        // safeguard against registration prior to completion of game setup
        const idStr = ob.player === undefined ? '' : `(${ob.player})`;
        log(`no game exists with address ${ob.game}, try again after delay ${idStr}`);
        setTimeout(() => {
            registerPlayer(ob, cb);
        }, 500);
    }
};
const playerConnectEvent = (gameID, playerID, boo) => {
    const game = getGameWithAddress(`/${gameID}`);
    if (game) {
//        console.log(`playerConnectEvent`);
//        console.log(game.players[0]);
        const playerArray = Object.values(game.playersFull);
//        const playerArray = Object.values(game.players);
        const socketIDs = playerArray.map(player => player.socketID);
        const player = playerArray[socketIDs.indexOf(playerID)];
        if (player) {
//            log(gameID, playerID, boo, (game ? 'yep' : 'nope'));
            player.connected = boo;
            const eGame = Object.assign({'updateSource': 'gameController playerConnectEvent'}, game)
            eventEmitter.emit('gameUpdate', eGame);
//            console.log(eGame.players[0]);
        }
    }
};

const startRound = async (ob) => {
    console.log(`startRound:`);
    console.log(ob);
    const gameID = ob.gameID;
    const round = ob.round;
    const game_id = `game-${gameID}`;
    const game = games[game_id];
    if (game) {
        console.log(`yes, game`);
        const rounds = game.persistentData.rounds;
        const rIndex = ob.round - 1;
        if (ob.round > rounds.length) {
            const warning = `cannot start round ${ob.round}, game only has ${rounds.length} rounds.`;
            eventEmitter.emit('gameWarning', {gameID: game.address, warning: warning});
        } else {
            game.round = ob.round;
            console.log(`change round to ${ob.round}`);
            const session = await sessionController.updateSession(gameID, { round });
            eventEmitter.emit('updatePlayers', {game: game, update: 'startRound', val: round});
            eventEmitter.emit('gameUpdate', game);
        }
    } else {
        log(`game not found: ${game_id}`);
    }
};
const checkRound = (ob, cb) => {
    // Check submitted scores against current round
    const gameID = typeof(ob) === 'string' || typeof(ob) === 'number' ? ob : ob.gameID;
    const game = games[`game-${gameID}`];
    if (game) {
        const round = ob.hasOwnProperty('round') ? ob.round : game.round;
        if (round > 0) {
            const rScores = game.scores.filter(item => item.startsWith(round));
            const gRound = game.persistentData.rounds[round];
            const teams = game.persistentData[gRound.teams];
//            console.log(`rScores`, rScores);
//            console.log(`gRound`, gRound);
//            console.log(`teams`, teams);
            const ta = [];
            teams.forEach(t => {
                ta.push(Boolean(rScores.filter(item => item.charAt(2) === t.id.toString()).length));
            });
//            console.log(`ta`, ta);
            if (cb) {
                cb(ta);
            }
            return ta;
        } else {
            console.log(`checkRound: invalid round (${round})`)
            return [false];
        }
    } else {
        console.log(`game not ready: ${ob.gameID}`);
        return [false];
    }
};
const endRound = async (ob, cb) => {
//    console.log(`endRound:`);
//    console.log(ob);
    const gameID = ob.game;
    const round = ob.round;
    const game_id = `game-${gameID}`;
    const game = games[game_id];
    if (game) {
        const session = await sessionController.updateSession(ob.game, {round: `${game.round}*`});
        if (session) {
            game.round = session.round;
            eventEmitter.emit('gameUpdate', game);
        }
    } else {
        console.log(`endGame cannot complete, no game exists with ID ${game_id}`);
    }
};
const scoreSubmitted = async (ob, cb) => {
//    console.log(`scoreSubmitted`);
    const sc = ob.scoreCode;
    const game = games[`game-${ob.game}`];
    if (game) {
        let sp = new ScorePacket(game.round, sc.src, sc.dest, sc.val, 1);
        let p = sp.getPacket();
        let d = sp.getDetail();
        if (game.scores.indexOf(p) > -1) {
            // Duplicate scores are not allowed (score packets must be unique)
            // In case of a duplicate score submission, callback the scores and end the method.
            console.log(`oh no, a duplicate score`);
            if (cb) {
                cb(game.scores);
            }
            return;
        }
        if (p) {
            const session = await sessionController.updateSession(ob.game, { $push: {scores: p}});
            if (session) {
                const game = games[`game-${ob.game}`];
                if (game) {
                    game.scores = session.scores;
                    const roundComplete = checkRound(ob.game).indexOf(false) === -1;
                    if (cb) {
                        console.log(`scoreSubmitted callback`);
                        cb(game.scores);
                    }
                    eventEmitter.emit('scoresUpdated', game);
                    if (roundComplete) {
                        endRound(ob);
                    }
                } else {
                    console.log(`no game with ID game-${ob.game}`);
                }
            }
            return d;
        } else {
            console.log(`cannot save score, packet improperly defined (see models.scorepacket.<n>.js)`);
            return false;
        }
    } else {
        console.log(`no game with ID game-${ob.game}`);
        return false;
    }
};
const scoreForAverageSubmitted = async (ob, cb) => {
    // A score, or set of scores, submitted which must be averaged out over a team
    const sc = ob.scoreCode;
    const gameID = `game-${ob.game}`;
    const game = games[gameID];
    const scOut = [];
    if (game) {
        sc.forEach(s => {
            let sp = new ScorePacket(game.round, s.src, s.dest, s.val, s.type);
            let p = sp.getPacket();
            let d = sp.getDetail();
            scOut.push(p);
        });
        const session = await sessionController.updateSession(ob.game, { $push: {scores: { $each: scOut}}});
        if (session) {
            game.scores = session.scores;
            const roundComplete = checkRound(ob.game).indexOf(false) === -1;
            eventEmitter.emit('scoresUpdated', game);
            if (roundComplete) {
                endRound(ob);
            }
        }
        let ssp = filterScorePackets(gameID, 'round', 2);
        ssp = filterScorePackets(gameID, 'src', sc[0].src, ssp);

    } else {
        console.log(`scoreForAverageSubmitted: game not found (game-${ob.game})`);
    }
};
const valuesSubmitted = async (ob) => {
    console.log(`#################################### give ####### me ####### a ####### break #####################`);
    if (ob.hasOwnProperty('values')) {
        const session = await sessionController.updateSession(ob.game, { $push: {values: ob.values}});
        if (session) {
            const game = games[`game-${ob.game}`];
            if (game) {
                game.values = session.values;
            } else {
                console.log(`no game with ID game-${ob.game}`);
            }
        }
    } else {
        console.log('no values sent')
    }
};
const presentationAction = (ob) => {
    // An action triggered from a presentation frame
//    console.log(`presentationAction:`);
//    console.log(ob);
    const game = getGameWithAddress(ob.address);
    if (game) {
        game.slide = ob.ref;
    }
    if (ob.hasOwnProperty('action')) {
        if (ob.action.toLowerCase().indexOf('startround', 0) > -1) {
            const rOb = {gameID: getGameWithAddress(ob.address).uniqueID, round: ob.action.replace(/\D/g, '')};
//            console.log(rOb);
            startRound(rOb);
        }
    }
};

const get = (id, prop) => {

    const game = games[`game-${id}`];

    let p = null;
    if (game) {
        let dsp = game.getDetailedScorePackets();
        console.log(dsp);
        if (game.hasOwnProperty(prop)) {
            p = game[prop];
        }
    }
    return p;
}

module.exports = {
    getGame,
    getGameCount,
    getGameWithAddress,
    startGame,
    endGame,
    restoreGame,
    resetGame,
    changeName,
    deleteGame,
    registerPlayer,
    playerConnectEvent,
    assignTeams,
    resetTeams,
    setTeamSize,
    makeLead,
    reassignTeam,
    startRound,
    checkRound,
    scoreSubmitted,
    scoreForAverageSubmitted,
    createAggregate,
    valuesSubmitted,
    presentationAction,
    getScorePackets,
    getRenderState,
    getAllValues,
    getValues,
    get
};
