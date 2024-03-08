const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');


const listFiles = (directoryPath, fileType = null) => {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                reject(err);
                return;
            }
            // Filter files based on file type if provided
            if (fileType) {
                files = files.filter(file => path.extname(file) === `.${fileType}`);
            }
            resolve(files);
        });
    });
};

const setupPartials = () => {
    const dir = __dirname + './../views/partials/';
    listFiles(dir, 'hbs')
    .then(files => {
//        console.log('Files in the directory:');
//        console.log(files);
        files.forEach(file => {
            const id = file.split('.')[0];
//            const pf = fs.readFileSync(__dirname + './../views/partials/' + file, 'utf8');
            const pp = path.join(__dirname, '..', 'views', 'partials', file);
//            console.log(pf, id);
            const template = fs.readFileSync(pp, 'utf8');
            const partial = handlebars.compile(template);
            handlebars.registerPartial(id, partial);
        });
        console.log(`${files.length} partial${files.length > 1 ? 's' : ''} registered`);
    })
    .catch(err => {
        console.error('Error listing files:', err);
    });
};

const setupPartialsV1 = () => {
    const path = __dirname + './../views/partials/';
    listFiles(path, 'hbs')
    .then(files => {
//        console.log('Files in the directory:');
//        console.log(files);
        files.forEach(file => {
            const id = file.split('.')[0];
            const pf = fs.readFileSync(__dirname + './../views/partials/' + file, 'utf8');
//            console.log(pf, id);
            const template = fs.readFileSync(__dirname + './../views/partials/' + file, 'utf8');
            const partial = handlebars.compile(template);
            handlebars.registerPartial(id, partial);
        });
        console.log(`${files.length} partial${files.length > 1 ? 's' : ''} registered`);
    })
    .catch(err => {
        console.error('Error listing files:', err);
    });
};

const getTemplate = (req, res) => {
    const temp = req.query.template;
    const o = JSON.parse(req.query.data);
    const templateContent = fs.readFileSync(`views/${temp}.hbs`, 'utf8');
    const compiledTemplate = handlebars.compile(templateContent);
    const html = compiledTemplate(o);
    res.send(html);
};
setupPartials();
module.exports = { getTemplate, setupPartials };
