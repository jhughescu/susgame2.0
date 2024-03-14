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
        // Read the JSON file asynchronously
        const filePath = `data/gamedata_${type}.json`;
        try {
            // Read file asynchronously
            const data = await fs.promises.readFile(filePath, 'utf8');
            // Parse JSON data
            this.persistentData = JSON.parse(data);
//            console.log('Persistent data loaded successfully:', this.persistentData);
//            console.log('Persistent data loaded successfully:');
        } catch (error) {
            console.error('Error reading or parsing JSON file:', error);
            throw error; // Rethrow error to be caught by the caller
        }
    };

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
