/**
 * Fix partner profile contact save: surface validation errors, optimistically
 * refresh partner state, and propagate failures to PartnerProfileTab.
 * Patch scripts only — do not StrReplace PartnerDetailPage from the agent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/pages/admin/PartnerDetailPage.tsx');
let src = fs.readFileSync(file, 'utf8');

if (src.includes('setPartner(next);') && src.includes("throw new Error('Full name is required before saving contact details.')") && src.includes('return true;')) {
  console.log('PartnerDetailPage profile save already patched — skipping.');
  process.exit(0);
}

const saveBlockRe =
  /onSaveProfile=\{async \(\) => \{[\s\S]*?setNotesVersion\(\(v\) => v \+ 1\);\s*\}\}/;

const match = src.match(saveBlockRe);
if (!match) {
  console.error('PartnerDetailPage onSaveProfile block not found.');
  process.exit(1);
}

const patched = match[0]
  .replace('if (!name) return;', "if (!name) throw new Error('Full name is required before saving contact details.');")
  .replace(
    /(\}\);\r?\n)(\s*addAuditEvent\(\{\r?\n\s*partnerId: partner\.id,\r?\n\s*actorType: 'admin',\r?\n\s*actorEmail,\r?\n\s*action: 'partner\.profile_updated',)/,
    '$1              setPartner(next);\n$2',
  )
  .replace(
    /setNotesVersion\(\(v\) => v \+ 1\);\s*\}$/,
    'setNotesVersion((v) => v + 1);\n              return true;\n            }',
  );

if (patched === match[0]) {
  console.error('PartnerDetailPage profile save patch made no changes.');
  process.exit(1);
}

src = src.replace(match[0], patched);
fs.writeFileSync(file, src);
console.log('Patched PartnerDetailPage profile save handler');
