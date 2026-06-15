#!/usr/bin/env node
/**
 * Run all launch closure wave audits (54–59) in one pass.
 * Usage: npm run launch:waves:audit
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const WAVES = [
  ['Wave 54 — Co-owner ops', 'npm run coowner:audit'],
  ['Wave 55 — Phone hub', 'npm run phone:audit'],
  ['Wave 56 — Validation & dispute', 'npm run validation:audit'],
  ['Wave 57 — Production ops', 'npm run production:audit'],
  ['Wave 58 — Go-live command', 'npm run go-live:audit'],
  ['Wave 59 — Light theme go-live', 'npm run theme:go-live:audit'],
];

console.log('Finely Cred — launch waves rollup (54–59)\n');

let failed = 0;
for (const [label, cmd] of WAVES) {
  console.log(`\n── ${label} ──`);
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: 'inherit' });
  if (r.status !== 0) failed += 1;
}

console.log('\n── Summary ──');
if (failed) {
  console.error(`${failed} wave audit(s) failed.`);
  process.exit(1);
}

console.log('All launch closure waves (54–59) pass.');
console.log('Full sprint: npm run launch:code · Production: npm run launch:go-live');
