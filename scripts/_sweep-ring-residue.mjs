import fs from 'fs';
import path from 'path';

const root = path.join('e:/Finely-Cred/Tishobe/finely-cred-main/src');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|css)$/.test(name)) out.push(p);
  }
  return out;
}

const replacements = [
  ['ring-white/10', 'ring-white/[0.08]'],
  ['hover:border-white/16', 'hover:border-white/20'],
];

let changed = 0;
let total = 0;

for (const file of walk(root)) {
  let src = fs.readFileSync(file, 'utf8');
  let next = src;
  let fileCount = 0;
  for (const [from, to] of replacements) {
    const n = (next.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
    if (n) {
      next = next.replaceAll(from, to);
      fileCount += n;
    }
  }
  if (next !== src) {
    fs.writeFileSync(file, next, 'utf8');
    changed += 1;
    total += fileCount;
    console.log(`${path.relative(root, file)}: ${fileCount}`);
  }
}

console.log(`\nUpdated ${changed} files (${total} ring/hover replacements).`);
