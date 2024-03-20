const fs = require('fs');
class Game {
    constructor(uniqueID, type) {
        this.uniqueID = uniqueID;
        this.type = type;
        this.players = [];
        this.scores = [];
        this.teams = [];
        this.persistentData = null;
    }

    async loadPersistentData(type) {
//        console.log(`loadPersis ${type}`)
        // Read the JSON file asynchronously
        const filePath = `data/gamedata_${type}.json`;
        try {
            // Read file asynchronously
            const data = await fs.promises.readFile(filePath, 'utf8');
            // Parse JSON data
            this.persistentData = JSON.parse(data);
            const { processData } = require(`./../gamemodules/gameprocess_${type}.js`);
            this.persistentData = processData(this.persistentData);
//            console.log('Persistent data loaded successfully:');
//            console.log(this.persistentData);
//            this.persistentData = JSON.parse(JSON.stringify(this.persistentData));
        } catch (error) {
            console.error('Error reading or parsing JSON file:', error);
            throw error; // Rethrow error to be caught by the caller
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
//            console.log(`${mc} players to main teams, ${sc} to sub teams`);
            mt.forEach((el, id) => {
                t[id] = pl.splice(0, ts);
            });
            // assume two sub teams - method should be modified if this number is ever in doubt.
            t.push(pl.splice(0, Math.ceil(pl.length / 2)));
            t.push(pl.splice(0));
            return (t);
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
}
module.exports = Game;
