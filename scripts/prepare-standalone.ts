import fs from 'fs';
import path from 'path';

const projectRoot = path.join(__dirname, '..');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');
const staticDir = path.join(projectRoot, '.next', 'static');
const publicDir = path.join(projectRoot, 'public');

const destStaticDir = path.join(standaloneDir, '.next', 'static');
const destPublicDir = path.join(standaloneDir, 'public');

function copyDir(src: string, dest: string) {
    if (!fs.existsSync(src)) {
        console.warn(`Source directory ${src} does not exist, skipping.`);
        return;
    }

    fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log('Preparing standalone build...');

console.log(`Copying static assets from ${staticDir} to ${destStaticDir}...`);
copyDir(staticDir, destStaticDir);

console.log(`Copying public assets from ${publicDir} to ${destPublicDir}...`);
copyDir(publicDir, destPublicDir);

console.log('Standalone build preparation complete.');
