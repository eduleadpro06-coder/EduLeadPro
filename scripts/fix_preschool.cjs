const fs = require('fs');

function replaceInFile(filePath, searchRegex, replaceWith) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(searchRegex, replaceWith);
  fs.writeFileSync(filePath, content, 'utf8');
}

replaceInFile('server/preschoolRoutes.ts', /await db\.query\(/g, "await (db.query as any)(");
replaceInFile('server/preschoolRoutes.ts', /\(eq as any\)\(/g, "eq("); // Rollback eq(

console.log('preschoolRoutes query replaced');
