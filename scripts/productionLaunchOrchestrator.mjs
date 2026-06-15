#!/usr/bin/env node
/**
 * Phase 4 / 45 — Run all pre-deploy checks in sequence.
 * Usage: npm run predeploy:check
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const STEPS = [
  { name: 'sitemap:generate', cmd: 'npm run sitemap:generate' },
  { name: 'seo:check', cmd: 'npm run seo:check' },
  { name: 'typecheck', cmd: 'npm run typecheck' },
  { name: 'e2e:smoke', cmd: 'npm run e2e:smoke' },
  { name: 'launch:senior:qa', cmd: 'npm run launch:senior:qa' },
  { name: 'voice:catalog:check', cmd: 'npm run voice:catalog:check' },
  { name: 'launch:check', cmd: 'npm run launch:check' },
  { name: 'verify-dist', cmd: 'node scripts/verify-production-dist.mjs' },
  { name: 'launch:waves:audit', cmd: 'npm run launch:waves:audit' },
  { name: 'launch:waves:rollup:audit', cmd: 'npm run launch:waves:rollup:audit' },
  { name: 'launch:plan:closure:audit', cmd: 'npm run launch:plan:closure:audit' },
  { name: 'production:launch:audit', cmd: 'npm run production:launch:audit' },
  { name: 'env:bootstrap:audit', cmd: 'npm run env:bootstrap:audit' },
  { name: 'senior:qa:signoff:audit', cmd: 'npm run senior:qa:signoff:audit' },
  { name: 'deploy:go-live:audit', cmd: 'npm run deploy:go-live:audit' },
  { name: 'launch:final:readiness:audit', cmd: 'npm run launch:final:readiness:audit' },
  { name: 'launch:handoff:audit', cmd: 'npm run launch:handoff:audit' },
  { name: 'production:sequencer:audit', cmd: 'npm run production:sequencer:audit' },
  { name: 'production:ops:runner:audit', cmd: 'npm run production:ops:runner:audit' },
  { name: 'launch:os:nav:audit', cmd: 'npm run launch:os:nav:audit' },
  { name: 'hub:audit', cmd: 'npm run hub:audit' },
  { name: 'migrations:check', cmd: 'npm run migrations:check' },
  { name: 'rls:check', cmd: 'npm run rls:check' },
  { name: 'secrets:check', cmd: 'npm run secrets:check' },
];

console.log('Finely Cred — pre-deploy orchestrator\n');

const codeOnly = process.argv.includes('--code-only');
if (codeOnly) {
  console.log('Mode: code-only (skips live Supabase secrets + RLS)\n');
}

let failed = 0;
for (const step of STEPS) {
  if (codeOnly && (step.name === 'secrets:check' || step.name === 'rls:check')) {
    console.log(`→ ${step.name} (skipped — code-only)`);
    continue;
  }
  if (step.name === 'verify-dist' && !fs.existsSync(path.join(root, 'dist', 'index.html'))) {
    console.log('→ verify-dist (skipped — run npm run build first)');
    continue;
  }
  console.log(`→ ${step.name}`);
  const res = spawnSync(step.cmd, { cwd: root, shell: true, stdio: 'inherit', env: process.env });
  if (res.status !== 0) {
    console.error(`✗ ${step.name} failed\n`);
    failed += 1;
  } else {
    console.log(`✓ ${step.name} passed\n`);
  }
}

if (failed) {
  console.error(`${failed} step(s) failed — fix before production deploy.`);
  process.exit(1);
}

console.log('All pre-deploy checks passed. Next: npm run launch:refresh · npm run launch:handoff · supabase db push · deploy:functions');
