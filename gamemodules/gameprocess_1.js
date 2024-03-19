// All functionality specific to the Type 1 Game
const processData = (d) => {
//    console.log('pro sess');
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
    return d;
}
const assignTeams = (players) => {
    return players;
};
module.exports = {
    processData,
    assignTeams
};
