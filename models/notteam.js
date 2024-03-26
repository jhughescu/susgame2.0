const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new Schema({
    id: String,
    title: String,
    team: Array,
    time: String,
    state: Object
});

module.exports = mongoose.model('Team', teamSchema);
