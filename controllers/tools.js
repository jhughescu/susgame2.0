const procVal = (v) => {
    // process values into numbers, booleans etc
    if (!isNaN(parseInt(v))) {
        v = parseInt(v);
    } else if (v === 'true') {
        v = true;
    } else if (v === 'false') {
        v = false;
    }
    return v;
}
const toCamelCase = (str) => {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
        return index !== 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
};
const justNumber = (i) => {
    // returns just the numeric character(s) of a string/number
    let out = null;
    if (i) {
        out = parseInt(i.toString().replace(/\D/g, ''));
    }
    return out;
};
module.exports = {
    procVal,
    toCamelCase,
    justNumber
}
