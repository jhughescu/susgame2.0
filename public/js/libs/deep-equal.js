// fast-deep-equal standalone version
window.deepEqual = function equal(a, b) {
    if (a === b) return true;

    if (a && b && typeof a === 'object' && typeof b === 'object') {
        if (a.constructor !== b.constructor) return false;

        if (Array.isArray(a)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!equal(a[i], b[i])) return false;
            }
            return true;
        }

        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

        const keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) return false;

        for (let key of keys) {
            if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
            if (!equal(a[key], b[key])) return false;
        }

        return true;
    }

    // handle NaN === NaN
    return a !== a && b !== b;
};
