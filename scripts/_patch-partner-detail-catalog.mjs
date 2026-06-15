#!/usr/bin/env node
/** Patch PartnerDetailPage — entity panels → catalog cards (Part CR). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filePath = path.join(root, 'src/pages/admin/PartnerDetailPage.tsx');
let s = fs.readFileSync(filePath, 'utf8');

if (!s.includes('finelyOsCatalogCard')) {
  s = s.replace(
    '  FINELY_OS_ENTITY_PANEL,\n  FINELY_OS_ENTITY_PANEL_INNER,',
    '  finelyOsCatalogCard,',
  );
} else {
  s = s.replace(/\n\s+FINELY_OS_ENTITY_PANEL,\n\s+FINELY_OS_ENTITY_PANEL_INNER,/g, '\n');
  s = s.replace(/\n\s+FINELY_OS_ENTITY_PANEL,\n/g, '\n');
  s = s.replace(/\n\s+FINELY_OS_ENTITY_PANEL_INNER,\n/g, '\n');
}

s = s.replace(/\$\{FINELY_OS_ENTITY_PANEL\}/g, "${finelyOsCatalogCard('violet')} !p-5");
s = s.replace(/\$\{FINELY_OS_ENTITY_PANEL_INNER\}/g, "${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony");
s = s.replace(/className=\{FINELY_OS_ENTITY_PANEL\}/g, "className={`${finelyOsCatalogCard('violet')} !p-5`}");
s = s.replace(/className=\{FINELY_OS_ENTITY_PANEL_INNER\}/g, "className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}");

fs.writeFileSync(filePath, s);
console.log('Patched PartnerDetailPage catalog cards');
