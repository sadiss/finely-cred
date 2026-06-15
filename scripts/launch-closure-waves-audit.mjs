#!/usr/bin/env node
/**
 * Run closure meta wave audits (60–66) — no recursion through launch:waves:audit.
 * Usage: npm run launch:closure:waves:audit
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const WAVES = [
  ['Wave 60 — Rollup', 'npm run launch:waves:rollup:audit'],
  ['Wave 61 — Plan closure', 'npm run launch:plan:closure:audit'],
  ['Wave 62 — Production launch ops', 'npm run production:launch:audit'],
  ['Wave 63 — Env bootstrap', 'npm run env:bootstrap:audit'],
  ['Wave 64 — Senior QA sign-off', 'npm run senior:qa:signoff:audit'],
  ['Wave 65 — Deploy go-live', 'npm run deploy:go-live:audit'],
  ['Wave 66 — Final readiness', 'npm run launch:final:readiness:audit'],
];

console.log('Finely Cred — launch closure meta waves (60–66)\n');

let failed = 0;
for (const [label, cmd] of WAVES) {
  console.log(`\n── ${label} ──`);
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: 'inherit' });
  if (r.status !== 0) failed += 1;
}

console.log('\n── Summary ──');
if (failed) {
  console.error(`${failed} closure meta wave audit(s) failed.`);
  process.exit(1);
}

console.log('All closure meta waves (60–66) pass.');
console.log('Handoff gate: npm run launch:handoff:audit');
