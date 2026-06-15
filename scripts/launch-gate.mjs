#!/usr/bin/env node
/**
 * Fast pre-deploy gate (~1 min) — no Playwright, no full launch:check.
 * Usage: npm run launch:gate
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(label, cmd) {
  console.log(`\n── ${label} ──`);
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: 'inherit' });
  return r.status === 0;
}

console.log('Finely Cred — launch gate (fast)\n');

const steps = [
  ['Typecheck', 'npm run typecheck'],
  ['Public SEO', 'npm run seo:check'],
  ['Signup emails', 'npm run signup:email:audit'],
];

let failed = 0;
for (const [label, cmd] of steps) {
  if (!run(label, cmd)) failed += 1;
}

const distReady = fs.existsSync(path.join(root, 'dist', 'index.html'));
if (distReady) {
  if (!run('Production dist', 'node scripts/verify-production-dist.mjs')) failed += 1;
} else {
  console.log('\n── Production dist ──');
  console.log('○ dist/ missing — run npm run launch:refresh before deploy');
}

console.log('\n── Secrets (informational) ──');
spawnSync('npm run secrets:summary', { cwd: root, shell: true, stdio: 'inherit' });

if (failed) {
  console.error(`\n${failed} launch gate step(s) failed.`);
  process.exit(1);
}

console.log('\nLaunch gate pass.');
console.log('Next: npm run launch:refresh · npm run launch:handoff · npm run launch:bundle (full QA)');
