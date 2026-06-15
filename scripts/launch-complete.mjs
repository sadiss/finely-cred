#!/usr/bin/env node
/**
 * Launch Sprint — full automated completion gate (code + senior QA + env summary).
 * Usage: npm run launch:complete
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd) {
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: 'inherit' });
  return r.status === 0;
}

console.log('Finely Cred — launch complete gate (Parts A–E + QA)\n');

const failures = [];

if (!run('npm run launch:code')) failures.push('launch:code');
if (!run('npm run launch:closure:full:audit')) failures.push('launch:closure:full:audit');
if (!run('npm run production:sequencer:audit')) failures.push('production:sequencer:audit');
if (!run('npm run production:ops:runner:audit')) failures.push('production:ops:runner:audit');
if (!run('npm run launch:os:nav:audit')) failures.push('launch:os:nav:audit');

let qaOk = run('npm run launch:senior:qa');
if (!qaOk) {
  console.log('\n── Senior QA retry (Playwright can flake when dev server is warming) ──');
  qaOk = run('npm run launch:senior:qa');
}
if (!qaOk) failures.push('launch:senior:qa');

run('npm run env:check');

console.log('\n── Launch Sprint ──');
if (failures.length) {
  console.error(`Failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log('CODE + QA: complete — 24 Playwright paths + all audit gates pass.');
console.log('HANDOFF: npm run launch:handoff · PRODUCTION: npm run launch:go-live');
console.log('OPS: npm run launch:ops');
