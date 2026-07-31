const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'apps/web/src');

function getAllTsxFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) results = results.concat(getAllTsxFiles(full));
    else if (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) results.push(full);
  }
  return results;
}

const files = getAllTsxFiles(srcDir);

// ── Mapping: old → new ────────────────────────────────────────────────────
// Background / panel surfaces: teal → slate/indigo
// Borders: teal → violet/slate
// Text: teal/cyan → violet/indigo
// Accents kept per-role (cyan=student, emerald=staff stay) — only ambient UI changes

const replacements = [
  // --- Panel / card backgrounds ---
  [/bg-teal-950\/80/g,  'bg-slate-900/80'],
  [/bg-teal-950\/70/g,  'bg-slate-900/70'],
  [/bg-teal-950\/60/g,  'bg-slate-900/60'],
  [/bg-teal-950\/50/g,  'bg-slate-900/50'],
  [/bg-teal-950\/40/g,  'bg-slate-900/40'],
  [/bg-teal-950\/85/g,  'bg-slate-900/90'],
  [/\bbg-teal-950\b/g,  'bg-slate-950'],
  [/\bbg-teal-900\/80\b/g, 'bg-slate-800/80'],
  [/\bbg-teal-900\/60\b/g, 'bg-slate-800/60'],
  [/\bbg-teal-900\/40\b/g, 'bg-slate-800/40'],
  [/\bbg-teal-900\b/g,  'bg-slate-800'],

  // --- Borders ---
  [/border-teal-800\/80/g, 'border-slate-700/70'],
  [/border-teal-800\/60/g, 'border-slate-700/60'],
  [/border-teal-800\/30/g, 'border-slate-700/30'],
  [/\bborder-teal-800\b/g,  'border-slate-700'],
  [/border-teal-700/g,     'border-slate-600'],
  [/border-teal-600/g,     'border-violet-500/40'],
  [/\bborder-teal-200\b/g, 'border-violet-200'],

  // --- Text colors (ambient) ---
  [/\btext-teal-400\b/g,   'text-violet-400'],
  [/\btext-teal-300\b/g,   'text-slate-300'],
  [/\btext-teal-200\b/g,   'text-slate-200'],
  [/\btext-teal-100\b/g,   'text-slate-100'],
  [/\btext-teal-500\b/g,   'text-violet-500'],
  [/\btext-emerald-400\b/g, 'text-emerald-400'], // keep — staff accent
  [/\btext-emerald-300\b/g, 'text-emerald-300'], // keep

  // --- Hover backgrounds ---
  [/hover:bg-teal-900\/60/g, 'hover:bg-slate-800/60'],
  [/hover:bg-teal-900/g,     'hover:bg-slate-800'],
  [/hover:bg-teal-800/g,     'hover:bg-slate-700'],

  // --- Ring ---
  [/ring-teal-500\/30/g,    'ring-violet-500/30'],
  [/ring-teal-500\/40/g,    'ring-violet-500/40'],
  [/ring-teal-400\/70/g,    'ring-violet-400/70'],

  // --- Shadow (teal glow) ---
  [/shadow-teal-900\/50/g,  'shadow-slate-900/60'],
  [/shadow-teal-900\/40/g,  'shadow-slate-900/50'],
  [/shadow-teal-800/g,      'shadow-slate-800'],

  // --- Specific bg light mode ---
  [/bg-teal-50\b/g,         'bg-violet-50'],
  [/from-teal-50\b/g,       'from-violet-50'],
  [/to-emerald-100\/50/g,   'to-indigo-100/40'],
  [/border-teal-200/g,      'border-violet-200'],
  [/hover:bg-teal-100/g,    'hover:bg-violet-100'],
  [/hover:bg-teal-50/g,     'hover:bg-violet-50'],
  [/bg-teal-100/g,          'bg-violet-50'],
];

let totalChanges = 0;
for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    const newContent = content.replace(from, to);
    if (newContent !== content) { changed = true; content = newContent; }
  }
  if (changed) {
    fs.writeFileSync(filePath, content);
    totalChanges++;
    console.log('Updated:', path.relative(srcDir, filePath));
  }
}
console.log(`\nDone — ${totalChanges} files updated.`);
