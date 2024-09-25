class Player {
    constructor(id, index, socketID) {
        this.id = id;
        this.idNum = id;
        this.index = index;
        this.socketID = socketID;
        this.connected = true;
        this.stakeholder = '';
        this.stakeholderID = -1;
        this.teamObj = null;
        this.isLead;
        this.isFake = this.isFake();
    }

    isFake() {
        return this.id.indexOf('pf') > -1;
    }
}

module.exports = Player;
