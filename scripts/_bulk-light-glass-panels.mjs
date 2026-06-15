import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GLASS = 'fc-light-glass-panel fc-light-chrome-panel';

const TARGET_DIRS = ['src/components', 'src/features', 'src/pages'].map((d) => path.join(root, d));

const REPLACEMENTS = [
  [
    /rounded-2xl border border-white\/\[0\.08\] bg-white\/\[0\.0[2-8]\](?: backdrop-blur-(?:md|xl|sm))?/g,
    `${GLASS}`,
  ],
  [
    /rounded-xl border border-white\/\[0\.08\] bg-white\/\[0\.0[2-8]\](?: backdrop-blur-(?:md|xl|sm))?/g,
    `${GLASS} rounded-xl`,
  ],
  [
    /rounded-3xl border border-white\/\[0\.08\] bg-white\/\[0\.0[2-8]\](?: backdrop-blur-(?:md|xl|sm))?/g,
    `${GLASS} rounded-3xl`,
  ],
  [
    /border border-white\/\[0\.08\] bg-white\/\[0\.0[2-8]\](?: backdrop-blur-(?:md|xl|sm))?/g,
    `${GLASS} border`,
  ],
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules') continue;
      walk(p, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) out.push(p);
  }
  return out;
}

let fixed = 0;
let total = 0;

for (const dir of TARGET_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const fp of walk(dir)) {
    if (fp.includes('PartnerDetailPage.tsx')) continue;
    let s = fs.readFileSync(fp, 'utf8');
    const before = s;
    for (const [re, rep] of REPLACEMENTS) {
      s = s.replace(re, rep);
    }
    s = s.replace(new RegExp(`${GLASS} ${GLASS}`, 'g'), GLASS);
    s = s.replace(new RegExp(`${GLASS} border border`, 'g'), `${GLASS} border`);
    if (s !== before) {
      fs.writeFileSync(fp, s);
      fixed += 1;
      total += 1;
    }
  }
}

console.log(`Light glass panel bulk: ${fixed} files updated`);
