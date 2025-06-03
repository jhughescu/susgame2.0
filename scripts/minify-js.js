const fs = require('fs');
const path = require('path');
const {
    minify
} = require('terser');

const sourceDir = path.join(__dirname, '../public/js');
const outputDir = path.join(__dirname, '../public/jsmin');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {
        recursive: true
    });
}
fs.readdirSync(outputDir).forEach(file => {
    fs.unlinkSync(path.join(outputDir, file));
});
fs.readdirSync(sourceDir).forEach(async (file) => {
    if (file.endsWith('.js') && !file.endsWith('.min.js')) {
        const inputPath = path.join(sourceDir, file);
        const outputFile = file.replace(/\.js$/, '.min.js');
        const outputPath = path.join(outputDir, outputFile);

        const code = fs.readFileSync(inputPath, 'utf-8');
        try {
            const result = await minify(code);
            fs.writeFileSync(outputPath, result.code, 'utf-8');
//            console.log(`Minified: ${file} → jsmin/${outputFile}`);
        } catch (err) {
            console.error(`❌ Error minifying ${file}:`, err);
        }
    }
});
