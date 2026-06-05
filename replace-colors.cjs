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

            // Replace emerald and old greens
            content = content.replace(/emerald-500/g, '[#d7f941]');
            content = content.replace(/emerald-400/g, '[#bce122]');
            content = content.replace(/emerald-600/g, '[#bce122]');
            
            // Wait, we did not replace all green-500 earlier
            content = content.replace(/green-500/g, '[#d7f941]');
            content = content.replace(/green-400/g, '[#bce122]');
            content = content.replace(/green-600/g, '[#bce122]');

            // Backgrounds
            content = content.replace(/bg-zinc-950/g, 'bg-[#111216]');
            content = content.replace(/bg-zinc-900/g, 'bg-[#1C1D21]');
            content = content.replace(/bg-zinc-800/g, 'bg-[#25262B]');
            content = content.replace(/border-zinc-800/g, 'border-white/5');
            content = content.replace(/border-zinc-700/g, 'border-white/10');
            content = content.replace(/border-zinc-900/g, 'border-white/5');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated ' + fullPath);
            }
        }
    }
}

traverse(srcDir);
