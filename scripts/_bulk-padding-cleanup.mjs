import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

const dirs = ['src/components', 'src/features', 'src/pages'].map((d) => path.join(root, d));
let fixed = 0;

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const fp of walk(dir)) {
    let s = fs.readFileSync(fp, 'utf8');
    const before = s;
    s = s.replace(/\$\{finelyOsCatalogCard\(([^)]+)\)\} !p-4 fc-surface-harmony p-4/g, '${finelyOsCatalogCard($1)} !p-4 fc-surface-harmony');
    s = s.replace(/\$\{finelyOsCatalogCard\(([^)]+)\)\} !p-4 fc-surface-harmony p-[0-9]+/g, '${finelyOsCatalogCard($1)} !p-4 fc-surface-harmony');
    s = s.replace(/\$\{finelyOsCatalogCard\(([^)]+)\)\} !p-5 p-5/g, '${finelyOsCatalogCard($1)} !p-5');
    s = s.replace(/\$\{finelyOsCatalogCard\(([^)]+)\)\} !p-5 p-6/g, '${finelyOsCatalogCard($1)} !p-6');
    s = s.replace(/\$\{finelyOsCatalogCard\(([^)]+)\)\} !p-5 !p-6/g, '${finelyOsCatalogCard($1)} !p-6');
    s = s.replace(/\$\{finelyOsCatalogCard\(([^)]+)\)\} !p-6 p-6/g, '${finelyOsCatalogCard($1)} !p-6');
    s = s.replace(/!p-4 fc-surface-harmony !p-4/g, '!p-4 fc-surface-harmony');
    s = s.replace(/!p-4 fc-surface-harmony !p-5/g, '!p-4 fc-surface-harmony');
    s = s.replace(/!p-5 !p-6/g, '!p-6');
    s = s.replace(/!p-5 !p-0/g, '!p-0');
    if (s !== before) {
      fs.writeFileSync(fp, s);
      fixed += 1;
    }
  }
}

console.log(`Padding cleanup: ${fixed} files updated`);
