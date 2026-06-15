#!/usr/bin/env node
/**
 * CI-safe pre-deploy gate (no local Supabase keys required).
 * Usage: npm run ci:check
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const STEPS = [
  { name: 'sitemap:generate', cmd: 'npm run sitemap:generate' },
  { name: 'typecheck', cmd: 'npm run typecheck' },
  { name: 'e2e:smoke', cmd: 'npm run e2e:smoke' },
  { name: 'launch:senior:qa', cmd: 'npm run launch:senior:qa' },
  { name: 'voice:catalog:check', cmd: 'npm run voice:catalog:check' },
  { name: 'launch:check', cmd: 'npm run launch:check' },
  { name: 'signup:email:audit', cmd: 'npm run signup:email:audit' },
  { name: 'hub:audit', cmd: 'npm run hub:audit' },
  { name: 'public:hub:audit', cmd: 'npm run public:hub:audit' },
  { name: 'business:hub:audit', cmd: 'npm run business:hub:audit' },
  { name: 'catalog:audit', cmd: 'npm run catalog:audit' },
  { name: 'role:hub:audit', cmd: 'npm run role:hub:audit' },
  { name: 'admin:hub:audit', cmd: 'npm run admin:hub:audit' },
  { name: 'theme:audit', cmd: 'npm run theme:audit' },
  { name: 'coowner:audit', cmd: 'npm run coowner:audit' },
  { name: 'phone:audit', cmd: 'npm run phone:audit' },
  { name: 'validation:audit', cmd: 'npm run validation:audit' },
  { name: 'production:audit', cmd: 'npm run production:audit' },
  { name: 'go-live:audit', cmd: 'npm run go-live:audit' },
  { name: 'theme:go-live:audit', cmd: 'npm run theme:go-live:audit' },
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
  { name: 'staff:portraits:check', cmd: 'npm run staff:portraits:check' },
  { name: 'migrations:check', cmd: 'npm run migrations:check' },
  { name: 'rls:check', cmd: 'npm run rls:check' },
  { name: 'env:check', cmd: 'npm run env:check' },
  { name: 'secrets:check', cmd: 'npm run secrets:check', env: { CI: 'true', FINELY_SKIP_SECRETS_CHECK: '1' } },
];

console.log('Finely Cred — CI pre-deploy gate\n');

let failed = 0;
for (const step of STEPS) {
  console.log(`→ ${step.name}`);
  const res = spawnSync(step.cmd, {
    cwd: root,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, ...(step.env ?? {}) },
  });
  if (res.status !== 0) {
    console.error(`✗ ${step.name} failed\n`);
    failed += 1;
  } else {
    console.log(`✓ ${step.name} passed\n`);
  }
}

if (failed) {
  console.error(`${failed} step(s) failed.`);
  process.exit(1);
}

console.log('All CI pre-deploy checks passed.');
