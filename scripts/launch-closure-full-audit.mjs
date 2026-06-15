#!/usr/bin/env node
/**
 * Full launch closure stack — feature waves 54–59 + meta waves 60–66.
 * Usage: npm run launch:closure:full:audit
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(label, cmd) {
  console.log(`\n══ ${label} ══`);
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: 'inherit' });
  return r.status === 0;
}

console.log('Finely Cred — full launch closure audit (waves 54–66)\n');

let failed = 0;
if (!run('Feature waves 54–59', 'npm run launch:waves:audit')) failed += 1;
if (!run('Meta waves 60–66', 'npm run launch:closure:waves:audit')) failed += 1;

if (failed) {
  console.error(`\n${failed} closure stack section(s) failed.`);
  process.exit(1);
}

console.log('\nFull launch closure stack (54–66) pass.');
console.log('Plan handoff: npm run launch:handoff:audit · Go-live: npm run launch:go-live');
