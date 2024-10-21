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
            const st = pd.secondaryTeams;
//            const ts = pd.hasOwnProperty('teamSize') ? pd.teamSize : 5;
            const ts = this.mainTeamSize === undefined ? 5 : this.mainTeamSize;
            let pl = this.players.slice();
            let mc = (mt.length * ts) + st.length;
            let sc = pl.length - mc;
//            console.log(`${pl.length} players, team size: ${ts}, required: ${mc}`);
//            console.log(`sc: ${sc}`);
            if (sc < 0 && !force) {
                return `More players required, please try again when more have joined or reduce team size.`;
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
//            console.log(t);
            return assignError ? 'error assigning teams' : t;
        }
    }
    setTeams () {
        // set teams (teamObj) for all players in a game (init method)
        console.log(`setTeams meth`)
        if (this.persistentData) {
            console.log('yep, PD')
            let pt = this.persistentData.teams;
            if (this.teams.length > 0) {
                console.log(`yep, teams: ${this.teams.length}`);
                this.teams.forEach((tl, i) => {
                    const t = pt[`t${i}`];
                    tl.forEach(p => {
                        if (this.playersFull[p]) {
                            this.playersFull[p].teamObj = t;
                            console.log(`team assigned to player ${p}`);
                        } else {
                            console.log(`cannot assign team to ${p}`);
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
//        console.log(`setTeam method`);
        if (this.persistentData) {
//            console.log('yep, data is ready, teams?');
//            console.log(this.teams)
            let pt = this.persistentData.teams;
    //        let id = 'fake';
//            console.log(`set teamObj for player ${player.id}`);
            this.teams.forEach((t, i) => {
                if (t.includes(player.id)) {
//                    console.log(` - allocate team ${pt[`t${i}`].title}`);
//                    console.log(t);
                    player.teamObj = pt[`t${i}`];
//                    console.log(player.teamObj);
                    // Only players of team type 1 have leads
                    player.isLead = t[0] === player.id && player.teamObj.type === 1;
                }
            })
        } else {
            console.log('no pres data');
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
    summValues(a) {
        let sum = a.map(sp => sp.val).reduce(function(accumulator, currentValue) {
            return accumulator + currentValue;
        }, 0);
        return sum;
    }
    getTotals1() {
//        console.log(`start t1`);
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
            if (scO.r1.length > 0 && scO.r2.length > 0) {
                scO.summary2030.self = scO.r1[0].val;
                srcs.forEach(s => {
                    if (!scO.destSets.hasOwnProperty(`set${s}`)) {
                        scO.destSets[`set${s}`] = [];
                    }
                    const ssc = scO.r2.filter(sc => sc.src === s);
                    if (!scO.summary2030.hasOwnProperty(`src${s}`)) {
                        scO.summary2030[`src${s}`] = {total: 0, average: 0, count: ssc.length};
                    }
                    ssc.forEach(sc => {
                        scO.destSets[`set${s}`].push(sc.val);
                        scO.summary2030[`src${s}`].total += sc.val;
                        scO.summary2030[`src${s}`].average = scO.summary2030[`src${s}`].total / ssc.length;
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
                Object.entries(scO.destSets).forEach(e => {
                    outOb[e[0]] = e[1];
                })
                out.push(outOb);
            }
        });
//        console.log(`end t1`);
        return JSON.stringify(out);
    }
    getTotalsSupp() {
//        console.log(`####################################################################  getTotalsSupp`);
//        console.log(`####################################################################  getTotalsSupp`);
//        console.log(`####################################################################  getTotalsSupp`);
//        return JSON.parse(this.getTotals1());
        // collaborative scores submitted: add to allocations
        const gp = this.persistentData;
        const sp = this.getDetailedScorePackets();
        const scores = {};
        const outOb = {};
        gp.rounds.forEach(r => {
            scores[`scoresR${r.n}`] = sp.filter(p => p.round === r.n);
        });
//        outOb.scores = scores;
//        console.log('here?');
//        console.log(scores.scoresR1.filter(sc => sc.dest === t.id));

        gp.mainTeams.forEach(t => {
            let r1Scores = scores.scoresR1.filter(sc => sc.dest === t.id);
            const ob = {
                team: t.title,
                t: t.id,
                self: r1Scores.length > 0 ? r1Scores[0].val : 0,
                collab: 0
            };
            scores.scoresR3.filter(sc => sc.dest === t.id).forEach(sp => {
//                console.log(sp);
                ob.collab += sp.val;
            });
            ob.total = ob.self + ob.collab;
            outOb[`t${t.id}`] = ob;
        });
        return outOb;
    }
    getTotals2() {
        return this.getTotals1();
//        return this.getTotalsSupp();
    }
    getTotals3() {
        // collaborative scores submitted: add to allocations
//        console.log(`getTotals3`)
        const gp = this.persistentData;
        const sp = this.getDetailedScorePackets();
//        console.log(sp);
        const scores = {};
        gp.rounds.forEach(r => {
            scores[`scoresR${r.n}`] = sp.filter(p => p.round === r.n);
        });
        const totals2 = this.getTotalsSupp();
        const outOb = totals2;
        gp.mainTeams.forEach(t => {
            const pv2 = scores.scoresR2.filter(sc => sc.dest === t.id);
            const pv4 = scores.scoresR4.filter(sc => sc.dest === t.id);
            let c3 = scores.scoresR3.slice(0).filter(sc => sc.dest === t.id);
            let ken = [];
            const pv25 = pv2.filter(sc => sc.src === 5);
            const pv26 = pv2.filter(sc => sc.src === 6);
            const pv45 = pv4.filter(sc => sc.src === 5);
            const pv46 = pv4.filter(sc => sc.src === 6);
            const tOb = outOb[`t${t.id}`];
//            console.log('##########################');
//            console.log(`get scores for team ${t.id} from`)
//            console.log(c3)
            gp.mainTeams.forEach(tm => {
//                c3 = scores.scoresR3.filter(sc => sc.dest === t.id);
//                console.log(`match against team ${tm.id}`)
                c3.forEach(sc => {
                    console.log(sc.src, tm.id)
                });
                const sca = c3.filter(sc => sc.src === tm.id);
//                console.log(sca)
                const v = sca.length ? sca[0].val : 0;
//                c3[tm.id] = v;
                ken[tm.id] = v;
//                console.log(`returning ${v}`);
//                console.log(tm.id, sca.length, v);
            });
            c3.forEach((s, i) => {
                if (typeof(s) === 'object') {
                    c3[i] = s.val;
                }
            });
            if (tOb) {
                const sv = this.summValues;
                tOb.summary_r3 = ken;
//                console.log('ReSULT')
//                console.log(tOb.summary_r3)
//                console.log(ken)
                tOb.summary_pv1r2 = {all: pv25.map(sp => sp.val).join(','), count: pv25.length, summ: sv(pv25), av: sv(pv25) / pv25.length};
                tOb.summary_pv2r2 = {all: pv26.map(sp => sp.val).join(','), count: pv26.length, summ: sv(pv26), av: sv(pv26) / pv26.length};
                tOb.summary_pv1r4 = {all: pv45.map(sp => sp.val).join(','), count: pv45.length, summ: sv(pv45), av: sv(pv45) / pv45.length};
                tOb.summary_pv2r4 = {all: pv46.map(sp => sp.val).join(','), count: pv46.length, summ: sv(pv46), av: sv(pv46) / pv46.length};
                tOb.pvR2Total = (sv(pv25) / pv25.length) + (sv(pv26) / pv26.length);
                tOb.pvR4Total = (sv(pv45) / pv45.length) + (sv(pv46) / pv46.length);
                tOb.pvTotal = tOb.pvR2Total + tOb.pvR4Total;
                tOb.gt = tOb.total * tOb.pvTotal;
                tOb.gtRound = tools.roundNumber(tOb.total * tOb.pvTotal, 2);
            }
        });
        const outArr = [];
//        console.log(outOb)
        Object.entries(outOb).forEach(o => {
            outArr.push(o[1]);
        });
        return outArr;
//        return outOb;
    }
    getTotals4() {
//        console.log(`start t4`);
        const outOb = this.getTotals3();
        outOb.note = "this probably not used";
//        console.log(`end t4`);
        return outOb;
    };
}
module.exports = Game;
