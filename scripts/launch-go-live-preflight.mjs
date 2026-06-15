#!/usr/bin/env node
/**
 * Launch Sprint — go-live preflight (env + code gates + manual QA reminder).
 * Usage: npm run launch:preflight
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(label, cmd) {
  console.log(`\n── ${label} ──`);
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: 'inherit' });
  return r.status === 0;
}

console.log('Finely Cred — launch go-live preflight\n');

let failed = 0;

if (!run('Local env', 'npm run env:check')) failed += 1;
if (!run('Launch Sprint code gates', 'npm run launch:sprint:status')) failed += 1;
if (!run('Wave audits (54–59)', 'npm run launch:waves:audit')) failed += 1;
if (!run('Wave 60 rollup gate', 'npm run launch:waves:rollup:audit')) failed += 1;
if (!run('Wave 61 plan closure', 'npm run launch:plan:closure:audit')) failed += 1;
if (!run('Wave 62 production launch ops', 'npm run production:launch:audit')) failed += 1;
if (!run('Wave 63 env bootstrap', 'npm run env:bootstrap:audit')) failed += 1;
if (!run('Wave 64 senior QA sign-off', 'npm run senior:qa:signoff:audit')) failed += 1;
if (!run('Wave 65 deploy go-live', 'npm run deploy:go-live:audit')) failed += 1;
if (!run('Wave 66 final readiness', 'npm run launch:final:readiness:audit')) failed += 1;
if (!run('Wave 67 plan handoff', 'npm run launch:handoff:audit')) failed += 1;
if (!run('Wave 68 production sequencer', 'npm run production:sequencer:audit')) failed += 1;
if (!run('Wave 69 production ops runner', 'npm run production:ops:runner:audit')) failed += 1;
if (!run('Wave 70 Launch OS nav', 'npm run launch:os:nav:audit')) failed += 1;
if (!run('Staff portraits (48 unique)', 'npm run staff:portraits:check')) failed += 1;
if (!run('Critical path smoke', 'npm run e2e:smoke')) failed += 1;
if (!run('Senior QA (24 paths)', 'npm run launch:senior:qa')) failed += 1;

const qaDoc = path.join(root, 'docs/SENIOR-QA-WALKTHROUGH.md');
console.log('\n── Manual sign-off (before production) ──');
if (fs.existsSync(qaDoc)) {
  console.log('Automated: 24 Playwright paths (public + portal dev auth + Ask Finely + Watch how).');
  console.log('Manual: voice mic in Chrome/Edge + non-tech spot-check — docs/SENIOR-QA-WALKTHROUGH.md');
} else {
  console.log('○ docs/SENIOR-QA-WALKTHROUGH.md not found');
}

console.log('\n── Operational (when secrets are ready) ──');
console.log('1. Supabase: run supabase/LIVE_SETUP_run_all.sql + npm run deploy:functions');
console.log('2. Twilio: set TWILIO_AUTH_TOKEN secret + paste webhook URL in Twilio Console (see /admin/phone-hub)');
console.log('3. Voiced tours: npm run tour:voice:prerender -- --all && npm run tour:assemble -- --all');
console.log('4. SmartCredit: set VITE_SMARTCREDIT_PID in .env.local for live affiliate links');
console.log('5. Production deploy: see docs/PRODUCTION_DEPLOY.md');

if (failed) {
  console.error(`\n${failed} automated preflight check(s) failed.`);
  process.exit(1);
}

console.log('\n── Launch Sprint ──');
console.log('CODE (Parts A–E): complete — all automated gates passed.');
console.log('PRODUCTION: run npm run env:check — Supabase keys required for portal auth + cloud sync.');
console.log('\nAutomated preflight pass. Complete manual QA before go-live.');
console.log('Summary: npm run launch:summary · npm run launch:ops');
