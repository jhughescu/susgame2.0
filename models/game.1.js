const fs = require('fs');
class Game {
    constructor(uniqueID, type) {
        this.uniqueID = uniqueID;
        this.type = type;
        this.players = [];
        this.playersFull = {};
        this.scores = [];
        this.teams = [];
        this.teamObjects = {};
        this.persistentData = null;
    }

    async loadPersistentData(type) {
        const filePath = `data/gamedata_${type}.json`;
        try {
            const data = await fs.promises.readFile(filePath, 'utf8');
            this.persistentData = JSON.parse(data);
            const { processData } = require(`./../gamemodules/gameprocess_${type}.js`);
            this.persistentData = processData(this.persistentData);
        } catch (error) {
            console.error('Error reading or parsing JSON file:', error);
            throw error;
        }
     };
    assignTeamsOrder () {
        // assign players to teams in the order they were registered:
//        console.log(`assignTeams, have data? ${Boolean(this.persistentData)}`);
        if (this.persistentData) {
            let t = [];
            const pd = this.persistentData;
            const mt = pd.mainTeams;
            const ts = pd.hasOwnProperty('teamSize') ? pd.teamSize : 5;
            let pl = this.players.slice();
            let mc = mt.length * ts;
            let sc = pl.length - mc;
            let assignError = false;
            mt.forEach((el, id) => {
                t[id] = pl.splice(0, ts);
                t[id].forEach((pr, i) => {
                    // lead for all main teams wil be first in the array:
                    if (this.playersFull.hasOwnProperty(pr)) {
                        const player = this.playersFull[pr];
                        player.isLead = i === 0;
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
    addNewScore(playerID, score) {
        this.scores.push({
            playerID,
            score
        });
    }

    getScores() {
        return this.scores;
    }
}
module.exports = Game;
