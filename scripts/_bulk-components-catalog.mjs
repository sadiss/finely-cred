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

const dirs = ['src/components', 'src/features'].map((d) => path.join(root, d));
let updated = 0;

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const fp of walk(dir)) {
    if (fp.includes('finelyOsLightUi.ts')) continue;
    let s = fs.readFileSync(fp, 'utf8');
    if (!s.includes('FINELY_OS_ENTITY_PANEL') && !s.includes('FINELY_OS_GLASS_INNER') && !s.includes('FINELY_OS_GLASS_PANEL')) continue;
    const before = s;

    if (!s.includes('finelyOsCatalogCard')) {
      s = s.replace(
        /(\s+)(FINELY_OS_[A-Z_]+,\n(?:\s+FINELY_OS_[A-Z_]+,\n)*\s+)FINELY_OS_ENTITY_PANEL,\n\s+FINELY_OS_ENTITY_PANEL_INNER,/,
        '$1$2finelyOsCatalogCard,',
      );
      s = s.replace(/(\s+)FINELY_OS_ENTITY_PANEL,\n\s+FINELY_OS_ENTITY_PANEL_INNER,/g, '$1finelyOsCatalogCard,');
      s = s.replace(/(\s+)FINELY_OS_ENTITY_PANEL,\n/g, (m, indent) =>
        s.includes('finelyOsCatalogCard') ? '' : `${indent}finelyOsCatalogCard,\n`,
      );
      s = s.replace(/(\s+)FINELY_OS_ENTITY_PANEL_INNER,\n/g, (m, indent) =>
        s.includes('finelyOsCatalogCard') ? '' : `${indent}finelyOsCatalogCard,\n`,
      );
      s = s.replace(/(\s+)FINELY_OS_GLASS_INNER,\n/g, (m, indent) =>
        s.includes('finelyOsCatalogCard') ? '' : `${indent}finelyOsCatalogCard,\n`,
      );
      s = s.replace(/(\s+)FINELY_OS_GLASS_PANEL,\n/g, (m, indent) =>
        s.includes('finelyOsCatalogCard') ? '' : `${indent}finelyOsCatalogCard,\n`,
      );
    }

    s = s.replace(/\$\{FINELY_OS_ENTITY_PANEL\}/g, "${finelyOsCatalogCard('violet')} !p-5");
    s = s.replace(/\$\{FINELY_OS_ENTITY_PANEL_INNER\}/g, "${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony");
    s = s.replace(/\$\{FINELY_OS_GLASS_PANEL\}/g, "${finelyOsCatalogCard('violet')} !p-5");
    s = s.replace(/\$\{FINELY_OS_GLASS_INNER\}/g, "${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony");
    s = s.replace(/className=\{FINELY_OS_ENTITY_PANEL\}/g, "className={`${finelyOsCatalogCard('violet')} !p-5`}");
    s = s.replace(/className=\{FINELY_OS_ENTITY_PANEL_INNER\}/g, "className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}");
    s = s.replace(/className=\{FINELY_OS_GLASS_INNER\}/g, "className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}");

    s = s.replace(/\n\s+FINELY_OS_ENTITY_PANEL,\n/g, '\n');
    s = s.replace(/\n\s+FINELY_OS_ENTITY_PANEL_INNER,\n/g, '\n');
    s = s.replace(/\n\s+FINELY_OS_GLASS_INNER,\n/g, '\n');
    s = s.replace(/\n\s+FINELY_OS_GLASS_PANEL,\n/g, '\n');

    const lines = s.split('\n');
    let seenCatalog = false;
    s = lines
      .filter((line) => {
        if (!/^\s+finelyOsCatalogCard,\s*$/.test(line)) return true;
        if (seenCatalog) return false;
        seenCatalog = true;
        return true;
      })
      .join('\n');

    if (s !== before) {
      fs.writeFileSync(fp, s);
      updated += 1;
      console.log('updated', path.relative(root, fp));
    }
  }
}

console.log(`Component catalog pass: ${updated} files`);
