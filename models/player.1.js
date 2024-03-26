class Player {
    constructor(id, socketID) {
        this.id = id;
        this.index = -1;
        this.socketID = socketID;
        this.stakeholder = '';
        this.stakeholderID = -1;
        this.teamObj = null;
        this.isLead;
    }
}


module.exports = Player;
