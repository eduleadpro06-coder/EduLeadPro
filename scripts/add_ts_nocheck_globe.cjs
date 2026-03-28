const fs = require('fs');
const path = require('path');

const file = 'client/src/components/ui/globe.tsx';
const fullPath = path.join(__dirname, '..', file);

if (fs.existsSync(fullPath)) {
  let content = fs.readFileSync(fullPath, 'utf8');
  if (!content.startsWith('// @ts-nocheck')) {
    fs.writeFileSync(fullPath, '// @ts-nocheck\n' + content, 'utf8');
    console.log(`Added // @ts-nocheck to ${file}`);
  }
} else {
  console.warn(`File not found: ${file}`);
}
