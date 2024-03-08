// partials.js
const fs = require('fs');
const handlebars = require('handlebars');

// Read the partial template file
const sessionDetailTemplate = fs.readFileSync(__dirname + '/partials/sessionDetail.hbs', 'utf8');

// Compile the template
const sessionDetailPartial = handlebars.compile(sessionDetailTemplate);
//console.log(sessionDetailPartial())

// Register the partial
handlebars.registerPartial('sessionDetail', sessionDetailPartial);
