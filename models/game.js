class Game {
    constructor(gameID, type) {
        this.gameID = gameID;
        this.type = type;
        this.scores = [];
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
