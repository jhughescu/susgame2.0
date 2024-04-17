class ScorePacket {
    constructor(round, src, dest, val, type) {
        if (typeof(round) === 'number') {
            this.round = round;
            this.src = src;
            this.dest = dest;
            this.val = val;
            this.type = type;
        } else {
            // string-type definition; expects the form n_n_n_n_n
            if (round.indexOf('_', 0) > -1) {
                let s = round.split('_');
                if (s.length === 5) {
                    // correct format, can proceed
                    this.round = parseInt(s[0]);
                    this.src = parseInt(s[1]);
                    this.dest = parseInt(s[2]);
                    this.val = parseInt(s[3]);
                    this.type = parseInt(s[4]);
                }
            }
        }
    }
    getPacket() {
        let p = false;
        if (this.round !== undefined && this.src !== undefined && this.dest !== undefined && this.val !== undefined && this.type !== undefined) {
            p = `${this.round}_${this.src}_${this.dest}_${this.val}_${this.type}`;
        }
        return p;
    }
    getDetail() {
        const p = this.getPacket();
        if (p) {
            const d = {
                round: this.round,
                src: this.src,
                dest: this.dest,
                val: this.val,
                type: this.type,
                packet: p
            }
            return d;
        } else {
            return null;
        }
    }
}


module.exports = ScorePacket;
