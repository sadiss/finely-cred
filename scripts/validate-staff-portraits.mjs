#!/usr/bin/env node
/**
 * Part DA — Validate unique staff portrait indices + gender folder alignment.
 * Usage: npm run staff:portraits:check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const catalogSrc = fs.readFileSync(path.join(root, 'src/data/staffPortraitCatalog.ts'), 'utf8');
const rosterSrc = fs.readFileSync(path.join(root, 'src/data/staffRoster.ts'), 'utf8');

const catalogEntries = [...catalogSrc.matchAll(/'(staff-[^']+)':\s*\{\s*portraitIndex:\s*(\d+)/g)];
const genderEntries = [...rosterSrc.matchAll(
  /m\('(staff-[^']+)',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'(feminine|masculine|neutral)'/g,
)];

const genderById = Object.fromEntries(genderEntries.map((m) => [m[1], m[2]]));
const folderFor = (g) => (g === 'masculine' ? 'men' : 'women');

let failed = 0;
const usedKeys = new Set();

console.log('Finely Cred — staff portrait validation\n');

for (const [id, indexStr] of catalogEntries.map((m) => [m[1], m[2]])) {
  const index = Number(indexStr);
  const gender = genderById[id];
  if (!gender) {
    console.log(`✗ ${id}: missing portraitGender in STAFF_ROSTER_SEED`);
    failed += 1;
    continue;
  }
  const folder = folderFor(gender);
  const key = `${folder}:${index}`;
  if (usedKeys.has(key)) {
    console.log(`✗ ${id}: duplicate portrait slot ${key}`);
    failed += 1;
  } else {
    usedKeys.add(key);
  }
  const jpg = path.join(root, 'public/staff-portraits', `${id}.jpg`);
  if (!fs.existsSync(jpg)) {
    console.log(`✗ ${id}: missing public/staff-portraits/${id}.jpg`);
    failed += 1;
  }
}

const catalogIds = new Set(catalogEntries.map((m) => m[1]));
for (const id of Object.keys(genderById)) {
  if (!catalogIds.has(id)) {
    console.log(`✗ ${id}: in roster but missing from STAFF_PORTRAIT_CATALOG`);
    failed += 1;
  }
}

console.log(`\nCatalog entries: ${catalogEntries.length}`);
console.log(`Roster members: ${Object.keys(genderById).length}`);
console.log(`Unique portrait slots: ${usedKeys.size}`);

if (failed) {
  console.error(`\n${failed} staff portrait issue(s).`);
  process.exit(1);
}

console.log('\nAll staff portrait checks passed.');
