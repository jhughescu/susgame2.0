const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    uniqueID: Number,
    dateID: Number,
    type: Number,
    password: String,
    address: String,
    teams: Array,
    state: {cl: Number, cr: Number},
    scores: Array
});

module.exports = mongoose.model('Session', sessionSchema);
