const fs = require('fs');
class Presentation {
    constructor(uniqueID, type) {
        this.uniqueID = uniqueID;
        this.type = type;
        this.slideData;
        this.currentSlide = 1;
    }
    processData(d) {
        const sl = d.slideList;
        sl.forEach(sli => {
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
        } catch (error) {
            console.error('Error reading or parsing JSON file:', error);
            throw error;
        }
    };

    nextSlide(cb) {
        console.log(`next`);
        const s = this.slideData.slideList;
        if (this.currentSlide < (s.length - 1)) {
            this.currentSlide += 1;
        }
        cb({currentSlide: this.currentSlide, hasPrevious: true, hasNext: this.currentSlide < (s.length - 1)});
    };
    previousSlide(cb) {
        console.log(`previous`);
        if (this.currentSlide > 0) {
            this.currentSlide -= 1;
        }
        cb({currentSlide: this.currentSlide, hasPrevious: this.currentSlide > 0, hasNext: true});
    };
    reloadSlide(cb) {
        console.log(`reload`);
    };
    play(cb) {
        console.log(`play`);
    };
    pause(cb) {
        console.log(`pause`);
    };
    toggleAutoPlay(cb) {
        console.log(`toggle auto`);
    };

}
module.exports = Presentation;
