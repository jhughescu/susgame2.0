const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    uniqueID: Number,
    dateID: Number,
    type: Number,
    password: String,
    address: String,
    players: Array,
    teams: Array,
    state: String,
    round: Number,
    scores: Array,
    values: Array
});

module.exports = mongoose.model('Session', sessionSchema);
