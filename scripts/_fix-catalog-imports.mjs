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
    } else if (/\.tsx$/.test(ent.name)) out.push(p);
  }
  return out;
}

function addCatalogImport(s) {
  if (!s.includes('finelyOsCatalogCard(')) return s;
  if (/import[\s\S]*finelyOsCatalogCard/.test(s)) return s;

  const fromMatch = s.match(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]*finelyOsLightUi)['"]/);
  if (fromMatch) {
    const names = fromMatch[1].trim();
    if (names.includes('finelyOsCatalogCard')) return s;
    const newNames = `${names},\n  finelyOsCatalogCard,`;
    return s.replace(fromMatch[0], `import {${newNames}} from '${fromMatch[2]}'`);
  }

  const relPaths = [
    '../../features/os/finelyOsLightUi',
    '../../../features/os/finelyOsLightUi',
    '../../../../features/os/finelyOsLightUi',
    '../../os/finelyOsLightUi',
    '../os/finelyOsLightUi',
    './finelyOsLightUi',
  ];
  for (const rel of relPaths) {
    const abs = path.normalize(path.join(root, 'src', rel.replace(/^(\.\.\/)+/, '')));
    // skip — compute per file below
  }

  return null;
}

function relImportPath(fromFile) {
  const fromDir = path.dirname(fromFile);
  const target = path.join(root, 'src/features/os/finelyOsLightUi.ts');
  let rel = path.relative(fromDir, target).replace(/\\/g, '/').replace(/\.ts$/, '');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

let fixed = 0;
for (const dir of ['src/components', 'src/features', 'src/pages'].map((d) => path.join(root, d))) {
  if (!fs.existsSync(dir)) continue;
  for (const fp of walk(dir)) {
    let s = fs.readFileSync(fp, 'utf8');
    if (!s.includes('finelyOsCatalogCard(')) continue;
    const hasImport = /import\s*\{[^}]*\bfinelyOsCatalogCard\b[^}]*\}\s*from/.test(s);
    if (hasImport) continue;

    const fromMatch = s.match(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]*finelyOsLightUi)['"]/);
    if (fromMatch) {
      const names = fromMatch[1].trim();
      const newNames = names.endsWith(',') ? `${names}\n  finelyOsCatalogCard,` : `${names},\n  finelyOsCatalogCard,`;
      s = s.replace(fromMatch[0], `import {${newNames}} from '${fromMatch[2]}'`);
    } else {
      const rel = relImportPath(fp);
      const importLine = `import { finelyOsCatalogCard } from '${rel}';\n`;
      const lastImport = [...s.matchAll(/^import .+$/gm)].pop();
      if (lastImport) {
        const idx = lastImport.index + lastImport[0].length;
        s = s.slice(0, idx) + '\n' + importLine + s.slice(idx + 1);
      } else {
        s = importLine + s;
      }
    }

    fs.writeFileSync(fp, s);
    fixed += 1;
    console.log('import fixed', path.relative(root, fp));
  }
}

console.log(`Import fixes: ${fixed} files`);
