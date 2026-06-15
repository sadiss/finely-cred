#!/usr/bin/env node
/**
 * Part B h6 — Resources page exposes factory tour MP4s.
 * Usage: npm run launch:tour-resources:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const resources = fs.readFileSync(path.join(root, 'src/pages/ResourcesPage.tsx'), 'utf8');
const index = fs.readFileSync(path.join(root, 'src/lib/finelyKnowledgeIndex.ts'), 'utf8');

const checks = [
  ['Resources imports TOUR_MANIFEST', resources.includes('TOUR_MANIFEST')],
  ['Resources FinelyTourPlayer', resources.includes('FinelyTourPlayer')],
  ['Resources #videos section', resources.includes('id="videos"')],
  ['Knowledge index module playbooks', index.includes('MODULE_PLAYBOOKS')],
  ['Tour recording playbook doc', fs.existsSync(path.join(root, 'docs/TOUR-RECORDING-PLAYBOOK.md'))],
];

console.log('Finely Cred — tour resources audit (Part B h6)\n');

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) failed += 1;
}

const manifestSrc = fs.readFileSync(path.join(root, 'src/config/tourManifest.ts'), 'utf8');
const tourIds = [...manifestSrc.matchAll(/id: '(tour-[^']+)'/g)].map((m) => m[1]);
let mp4Ok = 0;
for (const id of tourIds) {
  if (fs.existsSync(path.join(root, 'public/tours', `${id}.mp4`))) mp4Ok += 1;
}
console.log(`${mp4Ok === tourIds.length ? '✓' : '○'} Factory MP4s on disk: ${mp4Ok}/${tourIds.length}`);

if (failed) {
  console.error(`\n${failed} tour resources check(s) failed.`);
  process.exit(1);
}

console.log('\nTour resources audit pass.');
