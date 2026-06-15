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

const files = walk(root);
let changed = 0;
let total = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('border-white/10')) continue;
  const count = (src.match(/border-white\/10/g) ?? []).length;
  const next = src.replaceAll('border-white/10', 'border-white/[0.08]');
  if (next !== src) {
    fs.writeFileSync(file, next, 'utf8');
    changed += 1;
    total += count;
    console.log(`${path.relative(root, file)}: ${count}`);
  }
}

console.log(`\nUpdated ${changed} files (${total} border replacements).`);
