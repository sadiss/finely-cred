/**
 * Patch PartnerDetailPage tab label Letters → Credit Letters (no StrReplace on that file).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/pages/admin/PartnerDetailPage.tsx');
let src = fs.readFileSync(file, 'utf8');
const before = src;
src = src.replace(
  "{ key: 'letters', label: 'Letters', accent: 'amber' }",
  "{ key: 'letters', label: 'Credit Letters', accent: 'amber' }",
);
if (src === before) {
  console.log('No change (already patched or pattern missing)');
  process.exit(0);
}
fs.writeFileSync(file, src);
console.log('Patched PartnerDetailPage letters tab label → Credit Letters');
