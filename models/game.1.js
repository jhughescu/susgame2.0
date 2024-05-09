const fs = require('fs');
class Game {
    constructor(uniqueID, type) {
        this.uniqueID = uniqueID;
        this.type = type;
        this.players = [];
        this.playersFull = {};
        this.scores = [];
        this.scorePackets = [];
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
            return assignError ? 'error assigning teams' : t;
        }
    }
    setTeams () {
        // set teams (teamObj) for all players in a game (init method)
        let pt = this.persistentData.teams;
        if (this.teams.length > 0) {
            this.teams.forEach((tl, i) => {
                const t = pt[`t${i}`];
                tl.forEach(p => {
                    this.playersFull[p].teamObj = t;
                });
            });
        }
    }
    unsetTeams () {
        // set teams (teamObj) for all players in a game (init method)
        console.log(`unsetTeams`)
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
        let pt = this.persistentData.teams;
//        let id = 'fake';
//        console.log(`set teamObj for player ${player.id}`);
        this.teams.forEach((t, i) => {
            if (t.includes(player.id)) {
//                console.log(`allocate team ${pt[`t${i}`].title}`);
                player.teamObj = pt[`t${i}`];
                player.isLead = t[0] === player.id;
            }
        })
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
        player.teamObj = st[t[0].id];
        this.teams[mt.length + t[0].id].push(player.id);


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
        this.scores.forEach(s => {
            this.scorePackets.push(s);
        });
        return this.scorePackets;
    }
}
module.exports = Game;
