const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../node_modules/expo-sqlite/web/wa-sqlite/wa-sqlite.wasm');
const dest = path.join(__dirname, '../dist/assets/wa-sqlite.wasm');

// Ensure assets directory exists in dist
const distAssets = path.join(__dirname, '../dist/assets');
if (!fs.existsSync(distAssets)) {
    fs.mkdirSync(distAssets, { recursive: true });
}

console.log(`Copying WASM from ${source} to ${dest}`);

try {
    fs.copyFileSync(source, dest);
    console.log('✅ Wasm file copied successfully!');
} catch (error) {
    console.error('❌ Error copying Wasm file:', error);
    process.exit(1);
}
