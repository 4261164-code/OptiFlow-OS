const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            content = content.replace(/font-serif/g, 'font-sans tracking-tight');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Removed serif from ' + fullPath);
            }
        }
    }
}

traverse(srcDir);
