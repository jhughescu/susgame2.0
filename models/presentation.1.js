const fs = require('fs');
class Presentation {
    constructor(uniqueID, type) {
        this.uniqueID = uniqueID;
        this.type = type;
        this.slideData;
        this.currentSlide = 1;
        this.autoplay = true;
    }
    processData(d) {
        const sl = d.slideList;
        sl.forEach((sli, i) => {
            sli.ref = i;
            if (sli.hasOwnProperty('type')) {
                if (sli.type === 'video') {
                    sli.src = `${d.videoEnv}${d.videoLinks[sli.srcRef]}${d.videoSettings}`
                    sli.srcRef = d.videoLinks[sli.srcRef];
                }
            }
        });
        return d;
    };
    async loadPersistentData() {
        const type = this.type;
        const filePath = `data/presentation_${type}.json`;
        try {
            const data = await fs.promises.readFile(filePath, 'utf8');
            this.slideData = this.processData(JSON.parse(data));
//            console.log(this.slideData)
            console.log('slideData ready');
        } catch (error) {
            console.error('Error reading or parsing JSON file:', error);
            throw error;
        }
    };

    gotoSlide(sl, cb) {
        const s = this.slideData.slideList;
        this.currentSlide = sl;
        const rOb = {currentSlide: this.currentSlide, hasPrevious: this.currentSlide > 0, hasNext: this.currentSlide < (s.length - 1)};
//        console.log(`reloadSlide`, rOb)
        cb(rOb);
        return rOb;
    };
    nextSlide(cb) {
//        console.log(`next`);
        const s = this.slideData.slideList;
        if (this.currentSlide < (s.length - 1)) {
            this.currentSlide += 1;
        }
        const rOb = {currentSlide: this.currentSlide, hasPrevious: true, hasNext: this.currentSlide < (s.length - 1)};
        cb(rOb);
        return rOb;
    };
    previousSlide(cb) {
//        console.log(`previous`);
        if (this.currentSlide > 0) {
            this.currentSlide -= 1;
        }
        cb({currentSlide: this.currentSlide, hasPrevious: this.currentSlide > 0, hasNext: true});
    };
    reloadSlide(cb) {
        const s = this.slideData.slideList;
        const rOb = {currentSlide: this.currentSlide, hasPrevious: this.currentSlide > 0, hasNext: this.currentSlide < (s.length - 1)};
//        console.log(`reloadSlide`, rOb)
        cb(rOb);
        return rOb;
    };
    play(cb) {
        console.log(`play`);
    };
    pause(cb) {
        console.log(`pause`);
    };
    toggleAutoPlay(cb) {
//        console.log(`toggle auto`);
        this.autoplay = !this.autoplay;
        cb({autoplay: this.autoplay});
        return this.autoplay;
    };
}
module.exports = Presentation;
