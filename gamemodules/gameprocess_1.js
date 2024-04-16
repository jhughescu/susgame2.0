// All functionality specific to the Type 1 Game
const processData = (d) => {
//    console.log('pro sess');
//    console.log(d);
    let t = d.teams;
    let f = d.defaults;
    let m = d.map;
    d.mainTeams = [];
    d.secondaryTeams = [];
    for (var i in t) {
        t[i].stub = t[i].title.toLowerCase().replace(/ /gm, '_');
        t[i].abbrCap = t[i].abbr.toUpperCase();
        for (var j in f) {
            if (!t[i].hasOwnProperty(j)) {
                t[i][j] = f[j];
            }
        }
        if (t[i].hasMax) {
            d.mainTeams.push(t[i]);
        } else {
            d.secondaryTeams.push(t[i]);
        }
    }
    for (var i in m) {
        m[m[i]] = i;
    }
    // add a blank round so that any call to the rounds array can use round 1 etc (as apposed to 0)
    d.rounds.unshift({n: 0});
    d.teamsArray = Object.values(t);
    return d;
}
const assignTeams = (players) => {
    return players;
};
module.exports = {
    processData,
    assignTeams
};
