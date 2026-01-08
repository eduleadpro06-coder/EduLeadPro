/**
 * Post-build script to flatten Expo web build assets
 * Fixes the deeply nested font/asset paths that cause 404s on Vercel
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const assetsDir = path.join(distDir, 'assets');
const projectRoot = path.join(__dirname, '..');

// Copy vercel.json to dist
const vercelConfigPath = path.join(projectRoot, 'vercel.json');
const distVercelConfigPath = path.join(distDir, 'vercel.json');
if (fs.existsSync(vercelConfigPath)) {
    fs.copyFileSync(vercelConfigPath, distVercelConfigPath);
    console.log('✅ Copied vercel.json to dist');
} else {
    console.error('❌ vercel.json not found in project root!');
}

// Create flattened directories
const fontsDir = path.join(assetsDir, 'fonts');
const wasmDir = path.join(assetsDir, 'wasm');

if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
}

if (!fs.existsSync(wasmDir)) {
    fs.mkdirSync(wasmDir, { recursive: true });
}

// Find and copy all font files to /assets/fonts/
function findAndCopyFonts(dir, targetDir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir, { withFileTypes: true });

    files.forEach(file => {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            findAndCopyFonts(fullPath, targetDir);
        } else if (file.name.endsWith('.ttf') || file.name.endsWith('.otf') || file.name.endsWith('.woff') || file.name.endsWith('.woff2')) {
            const targetPath = path.join(targetDir, file.name);
            if (!fs.existsSync(targetPath)) {
                fs.copyFileSync(fullPath, targetPath);
                console.log(`✅ Copied font: ${file.name}`);
            }
        }
    });
}

// Find and copy all WASM files to /assets/wasm/
function findAndCopyWasm(dir, targetDir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir, { withFileTypes: true });

    files.forEach(file => {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            findAndCopyWasm(fullPath, targetDir);
        } else if (file.name.endsWith('.wasm')) {
            const targetPath = path.join(targetDir, file.name);
            if (!fs.existsSync(targetPath)) {
                fs.copyFileSync(fullPath, targetPath);
                console.log(`✅ Copied WASM: ${file.name}`);
            }
        }
    });
}

console.log('🚀 Flattening Expo web build assets...\n');

// Copy fonts
console.log('📝 Copying fonts...');
findAndCopyFonts(assetsDir, fontsDir);

// Copy WASM files
console.log('\n🔧 Copying WASM files...');
findAndCopyWasm(assetsDir, wasmDir);

console.log('\n✅ Asset flattening complete!');
console.log(`📁 Fonts location: /assets/fonts/`);
console.log(`📁 WASM location: /assets/wasm/`);
