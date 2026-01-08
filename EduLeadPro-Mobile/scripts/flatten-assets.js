const fs = require('fs');
const path = require('path');

console.log('📦 Flattening critical assets for Vercel deployment...');

// Vercel ignores node_modules in deployments, so we need to move critical assets out
const distPath = path.join(__dirname, '../dist');
const assetsPath = path.join(distPath, 'assets');

// Create flat asset directories
const flatWasmDir = path.join(assetsPath, 'wasm');
const flatFontsDir = path.join(assetsPath, 'fonts');

if (!fs.existsSync(flatWasmDir)) fs.mkdirSync(flatWasmDir, { recursive: true });
if (!fs.existsSync(flatFontsDir)) fs.mkdirSync(flatFontsDir, { recursive: true });

// Copy WASM file
const wasmSource = path.join(assetsPath, 'node_modules/expo-sqlite/web/wa-sqlite');
if (fs.existsSync(wasmSource)) {
    const wasmFiles = fs.readdirSync(wasmSource).filter(f => f.endsWith('.wasm'));
    wasmFiles.forEach(file => {
        fs.copyFileSync(path.join(wasmSource, file), path.join(flatWasmDir, file));
        console.log(`✓ Copied ${file} to /assets/wasm/`);
    });
}

// Copy font files
const fontsSource = path.join(assetsPath, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts');
if (fs.existsSync(fontsSource)) {
    const fontFiles = fs.readdirSync(fontsSource).filter(f => f.endsWith('.ttf'));
    fontFiles.forEach(file => {
        fs.copyFileSync(path.join(fontsSource, file), path.join(flatFontsDir, file));
        console.log(`✓ Copied ${file} to /assets/fonts/`);
    });
}

console.log('✅ Asset flattening complete!');
