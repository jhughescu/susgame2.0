const os = require('os');
const procVal = (v) => {
//    console.log(`procVal ${v}`);
    const ipMatch = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // process values into numbers, booleans etc
    if (ipMatch.test(v)) {
        // do nothing if IP addresses
//        console.log('we have matched an IP');
    } else if (!isNaN(parseInt(v))) {
//        console.log('is a number')
        v = parseInt(v);
    } else if (v === 'true') {
        v = true;
    } else if (v === 'false') {
        v = false;
    }
    return v;
}
const toCamelCase = (str) => {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
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
const roundNumber = (n) => {
    return Math.round(n * 1000) / 1000;
};
const isValidJSON = (j) => {
//    console.log(j);
    try {
        JSON.parse(j);
        return true;
    } catch (e) {
        return false;
    }
};
const getIPv4Address = () => {
    const networkInterfaces = os.networkInterfaces();
    let ipv4Address;
    for (const interfaceName in networkInterfaces) {
        const networkInterface = networkInterfaces[interfaceName];
        for (const alias of networkInterface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                ipv4Address = alias.address;
                break;
            }
        }
        if (ipv4Address) break;
    }
//    console.log(`ipv4Address: ${ipv4Address}`)
    return ipv4Address || false;
};
module.exports = {
    procVal,
    toCamelCase,
    justNumber,
    roundNumber,
    isValidJSON,
    getIPv4Address
}
