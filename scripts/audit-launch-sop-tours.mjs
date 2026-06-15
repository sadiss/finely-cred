#!/usr/bin/env node
/**
 * Launch OS — every platform SOP must link to a manifest tour (Part A + C).
 * Usage: npm run launch:sops:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sopsSrc = fs.readFileSync(path.join(root, 'src/domain/platformSops.ts'), 'utf8');
const tourSrc = fs.readFileSync(path.join(root, 'src/config/tourManifest.ts'), 'utf8');

const tourIds = new Set([...tourSrc.matchAll(/^\s+id:\s*'(tour-[^']+)'/gm)].map((m) => m[1]));

const blocks = sopsSrc.split(/\n  \{\n    id: 'sop-/);
const sops = blocks.slice(1).map((block) => {
  const idMatch = block.match(/^([^']+)'/);
  const id = idMatch ? `sop-${idMatch[1]}` : 'sop-unknown';
  const tourMatch = block.match(/relatedTourId:\s*'(tour-[^']+)'/);
  return { id, tourId: tourMatch?.[1] ?? null };
});

console.log('Finely Cred — launch SOP ↔ tour audit\n');

let failed = 0;

for (const sop of sops) {
  const tourOk = sop.tourId && tourIds.has(sop.tourId);
  console.log(`${tourOk ? '✓' : '✗'} ${sop.id} → ${sop.tourId ?? '(missing)'}`);
  if (!tourOk) failed += 1;
}

console.log(`\nSOPs: ${sops.length} · tours in manifest: ${tourIds.size}`);

if (failed) {
  console.error(`\n${failed} SOP(s) missing or pointing at unknown tours.`);
  process.exit(1);
}

console.log('\nAll platform SOPs link to manifest tours.');
