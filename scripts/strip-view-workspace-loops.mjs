import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const partnerDir = path.join(root, 'src/features/workspaceLightPreview/product/partner');

const skip = new Set(['PartnerCalendarProductSurface.tsx']);

const secondaryBlock =
  /\s*secondaryAction=\{\s*<button type="button" className="fc-wlp-btn-secondary" onClick=\{\(\) => navigate\([^)]+\)\}>\s*View workspace\s*<\/button>\s*\}\s*/g;

let removed = 0;
let filesTouched = 0;

for (const name of fs.readdirSync(partnerDir)) {
  if (!name.endsWith('.tsx') || skip.has(name)) continue;
  const file = path.join(partnerDir, name);
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(secondaryBlock, '\n');
  const hits = (before.match(secondaryBlock) ?? []).length;
  if (hits > 0) {
    fs.writeFileSync(file, after);
    removed += hits;
    filesTouched += 1;
  }
}

console.log(`Removed ${removed} "View workspace" secondary actions from ${filesTouched} partner surfaces.`);
