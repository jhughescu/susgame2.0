class Player {
    constructor(id, index, socketID) {
        this.id = id;
        this.index = index;
        this.socketID = socketID;
        this.connected = true;
        this.stakeholder = '';
        this.stakeholderID = -1;
        this.teamObj = null;
        this.isLead;
    }
}


module.exports = Player;
