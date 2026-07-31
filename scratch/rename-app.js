const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'apps/web/src');
const publicDir = path.join(process.cwd(), 'apps/web');

const filesToUpdate = [
  path.join(srcDir, 'components/Navbar.tsx'),
  path.join(srcDir, 'components/LoginPage.tsx'),
  path.join(srcDir, 'App.tsx'),
  path.join(publicDir, 'index.html'),
];

const replacements = [
  ['BhojanBox', 'Scan2eat'],
  ['Hostel Meal Manager', 'Hostel Meal Scanner'],
  ['Hostel Meal Portal', 'Hostel Meal Portal'],   // keep
  ['HostelOS', 'Scan2eat'],
  ['Loading BhojanBox...', 'Loading Scan2eat...'],
];

for (const filePath of filesToUpdate) {
  if (!fs.existsSync(filePath)) { console.log('SKIP (not found):', filePath); continue; }
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(filePath, content);
  console.log('Updated:', path.basename(filePath));
}
console.log('Done!');
