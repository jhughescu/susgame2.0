const fs = require('fs');
const ScorePacket = require('./scorepacket.1.js');
const tools = require('./../controllers/tools');
class Game {
    constructor(uniqueID, type) {
        this.uniqueID = uniqueID;
        this.type = type;
        this.players = [];
        this.playersFull = {};
        this.scores = [];
        this.scorePackets = [];
        this.detailedScorePackets = [];
        this.teams = [];
        this.teamObjects = {};
        this.persistentData = null;
        this.round;
        this.mainTeamSize;
    }

    async loadPersistentData(type) {
        const filePath = `data/gamedata_${type}.json`;
        try {
            const data = await fs.promises.readFile(filePath, 'utf8');
            this.persistentData = JSON.parse(data);
            const { processData } = require(`./../gamemodules/gameprocess_${type}.js`);
            this.persistentData = processData(this.persistentData);
            if (this.mainTeamSize === undefined) {
//                console.log(`loadPersistentData sets the teamSize property (was ${this.mainTeamSize}, is now ${this.persistentData.teamSize})`);
                this.mainTeamSize = this.persistentData.teamSize;
            }
        } catch (error) {
            console.error('Error reading or parsing JSON file:', error);
            throw error;
        }
    };
    assignTeamsOrder (ob) {
        // assign players to teams in the order they were registered:
//        console.log(`assignTeamsOrder:`);
//        console.log(ob);
        const force = Boolean(ob.force);
        if (this.persistentData) {
            let t = [];
            const pd = this.persistentData;
            const mt = pd.mainTeams;
//            const ts = pd.hasOwnProperty('teamSize') ? pd.teamSize : 5;
            const ts = this.mainTeamSize === undefined ? 5 : this.mainTeamSize;
            let pl = this.players.slice();
            let mc = mt.length * ts;
            let sc = pl.length - mc;
            if (sc < 0 && !force) {
                return `You don't have enough players`;
            }
            let assignError = false;
            mt.forEach((el, id) => {
                t[id] = pl.splice(0, ts);
                t[id].forEach((pr, i) => {
                    // lead for all main teams wil be first in the array:
                    if (this.playersFull.hasOwnProperty(pr)) {
                        const player = this.playersFull[pr];
//                        console.log(player)
                        if (!ob.preview) {
                            player.isLead = i === 0;
                        }
                    } else {
                        console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> playersFull has no player with id ${pr}`);
                        assignError = true;
                    }
                });
            });
            // assume two sub teams - method should be modified if this number is ever in doubt.
            t.push(pl.splice(0, Math.ceil(pl.length / 2)));
            t.push(pl.splice(0));
            console.log(t);
            return assignError ? 'error assigning teams' : t;
        }
    }
    setTeams () {
        // set teams (teamObj) for all players in a game (init method)
        if (this.persistentData) {
            let pt = this.persistentData.teams;
            if (this.teams.length > 0) {
                this.teams.forEach((tl, i) => {
                    const t = pt[`t${i}`];
                    tl.forEach(p => {
                        if (this.playersFull[p]) {
                            this.playersFull[p].teamObj = t;
                        } else {
                            console.log(`cannot assign team to {p}`);
                        }
                    });
                });
            }
        } else {}
    }
    unsetTeams () {
        // set teams (teamObj) for all players in a game (init method)
//        console.log(`unsetTeams`)
        let pf = this.playersFull;
        for (var i in pf) {
            pf[i].teamObj = null;
            pf[i].isLead = null;
        }

//        if (this.teams.length > 0) {
//            this.teams.forEach((tl, i) => {
//                tl.forEach(p => {
//                    this.playersFull[p].teamObj = {};
//                });
//            });
//        }
    }
    setTeam (player) {
        // set the team (teamObj) for a single player (restore method)
        if (this.persistentData) {
            let pt = this.persistentData.teams;
    //        let id = 'fake';
    //        console.log(`set teamObj for player ${player.id}`);
            this.teams.forEach((t, i) => {
                if (t.includes(player.id)) {
                    console.log(`allocate team ${pt[`t${i}`].title}`);
                    console.log(t);
                    player.teamObj = pt[`t${i}`];
                    player.isLead = t[0] === player.id;
                }
            })
        }
    }
    addLatecomer(player) {
        // add a latecomer to a team
        let pd = this.persistentData;
        let mt = pd.mainTeams;
        let st = pd.secondaryTeams;
        let t = this.teams.slice((st[0].id), (st[st.length - 1].id + 1));
        t.forEach((s, i) => t[i] = {id: i, l: s.length});
        t.sort((a, b) => {if (a.l > b.l) {return 1} else if (a.l < b.l) {return -1} else {return 0}});
        // the id value of t[0] is now the index of the secondary team with the smallest number of members
        if (player) {
            player.teamObj = st[t[0].id];
            this.teams[mt.length + t[0].id].push(player.id);
        } else {
            console.log('error adding latecomer - ask client to refresh browser');
        }

    }
    addNewScore(playerID, score) {
        this.scores.push({
            playerID,
            score
        });
    }
    getScores() {
        return this.scores;
    }
    getScorePackets() {
        this.scorePackets = [];
        this.scores.forEach(s => {
            this.scorePackets.push(s);
        });
        return this.scorePackets;
    }
    getDetailedScorePackets() {
        this.detailedScorePackets = [];
        this.scores.forEach(s => {
            this.detailedScorePackets.push(new ScorePacket(s));
        });
        return this.detailedScorePackets;
    }
    getTotals1() {
        const gp = this.persistentData;
        const sp = this.getDetailedScorePackets();
        const scores = {};
        gp.rounds.forEach(r => {
            scores[`scoresR${r.n}`] = sp.filter(p => p.round === r.n);
        });
        const srcs = Array.from(new Set(scores.scoresR2.map(item => item.src)));
        const out = [];
        gp.mainTeams.forEach(t => {
            const scO = {team: t.id, r1: scores.scoresR1.filter(sc => sc.dest === t.id), r2: scores.scoresR2.filter(sc => sc.dest === t.id), summary2030: {self: 0, supportTotal: 0, grandTotal: 0}, destSets: {}};
//            console.log(`t: ${t.id}`);
            if (scO.r1.length > 0 && scO.r2.length > 0) {
                scO.summary2030.self = scO.r1[0].val;
                srcs.forEach(s => {
//                    console.log(s);
                    if (!scO.destSets.hasOwnProperty(`set${s}`)) {
                        scO.destSets[`set${s}`] = [];
//                        console.log(`I need a set for ${s}`)
                    }
                    const ssc = scO.r2.filter(sc => sc.src === s);
//                    console.log(ssc)
                    if (!scO.summary2030.hasOwnProperty(`src${s}`)) {
                        scO.summary2030[`src${s}`] = {total: 0, average: 0, count: ssc.length};
                    }
                    ssc.forEach(sc => {
                        scO.destSets[`set${s}`].push(sc.val)
//                        console.log(s, sc);
//                        if (!scO.destSets.hasOwnProperty(`set${sc.dest}`)) {
//                            scO.destSets[`set${sc.dest}`] = {};
//                            console.log(`I need a set for ${sc.dest}`)
//                        }
//                        if (!scO.destSets[`set${sc.dest}`].hasOwnProperty(`src${sc.src}`)) {
//                            scO.destSets[`set${sc.dest}`][`src${sc.src}`] = [];
//                        }
//                        scO.destSets[`set${sc.dest}`][`src${sc.src}`].push(sc.val);
                        scO.summary2030[`src${s}`].total += sc.val;
                        scO.summary2030[`src${s}`].average = scO.summary2030[`src${s}`].total / ssc.length;
//                        scO.destSets.push(scO[`set${sc.dest}`]);
                    });
                    scO.summary2030.supportTotal += scO.summary2030[`src${s}`].average;
                    scO.summary2030.grandTotal = scO.summary2030.self * scO.summary2030.supportTotal;
                    scO.summary2030.supportTotal = scO.summary2030.supportTotal;
                });
                const av5 = scO.summary2030.hasOwnProperty(`src5`) ? scO.summary2030.src5.average : 0;
                const av6 = scO.summary2030.hasOwnProperty(`src6`) ? scO.summary2030.src6.average : 0;
                const outOb = {
                    t: scO.team,
                    s: scO.summary2030.self,
                    s1: av5,
                    s2: av6,
                    st: av5 + av6,
                    gt: scO.summary2030.self * (av5 + av6)

                };
//                console.log(scO);
                Object.entries(scO.destSets).forEach(e => {
//                    console.log(e);
                    outOb[e[0]] = e[1];
                })
//                outOb.destSets = scO.destSets;
                out.push(outOb);
            }
//            console.log('destSets', scO.destSets)
        });
//        console.log(out);
        return JSON.stringify(out);
//        return `here totals be ${this.players.length} ${this.scores.length} ${this.scorePackets.length} ${this.getDetailedScorePackets().length}`;
    }
}
module.exports = Game;
