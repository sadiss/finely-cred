#!/usr/bin/env node
/**
 * Launch Sprint (Parts A–E) — one-page status from existing audit gates.
 * Usage: npm run launch:sprint:status
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

console.log('Finely Cred — Launch Sprint status (Parts A–E)\n');

const gates = [
  ['SOP ↔ tour links', 'npm run launch:sops:audit'],
  ['Proactive strips', 'npm run launch:strips:audit'],
  ['Finely-noticed', 'npm run launch:noticed:audit'],
  ['Scroll sections', 'npm run launch:scroll:audit'],
  ['Senior-simple UX', 'npm run launch:senior:audit'],
  ['Admin hub tabs', 'npm run launch:admin-tabs:audit'],
  ['Intelligence OS', 'npm run intel:audit'],
  ['Tour resources (Resources page)', 'npm run launch:tour-resources:audit'],
  ['Plain-language onboarding', 'npm run launch:plain:audit'],
  ['Tour capture + MP4', 'npm run tour:capture:audit'],
  ['Tour voice MP3 (info)', 'npm run tour:voice:audit'],
  ['Validation & dispute ops', 'npm run validation:audit'],
  ['Production ops (Twilio)', 'npm run production:audit'],
  ['Go-live command center', 'npm run go-live:audit'],
  ['Light theme go-live', 'npm run theme:go-live:audit'],
  ['Launch waves rollup', 'npm run launch:waves:rollup:audit'],
  ['Launch plan closure', 'npm run launch:plan:closure:audit'],
  ['Production launch ops', 'npm run production:launch:audit'],
  ['Env bootstrap', 'npm run env:bootstrap:audit'],
  ['Senior QA sign-off', 'npm run senior:qa:signoff:audit'],
  ['Deploy go-live', 'npm run deploy:go-live:audit'],
  ['Launch final readiness', 'npm run launch:final:readiness:audit'],
  ['Launch plan handoff', 'npm run launch:handoff:audit'],
  ['Production sequencer', 'npm run production:sequencer:audit'],
  ['Production ops runner', 'npm run production:ops:runner:audit'],
  ['Launch OS nav hub', 'npm run launch:os:nav:audit'],
  ['Ruth superhuman (wave 71)', 'npm run coowner:superhuman:audit'],
  ['Staff portraits (unique + gender)', 'npm run staff:portraits:check'],
];

let failed = 0;
for (const [label, cmd] of gates) {
  if (!run(label, cmd)) failed += 1;
}

const sopsSrc = fs.readFileSync(path.join(root, 'src/domain/platformSops.ts'), 'utf8');
const tourSrc = fs.readFileSync(path.join(root, 'src/config/tourManifest.ts'), 'utf8');
const sopCount = (sopsSrc.match(/id: 'sop-/g) ?? []).length;
const tourCount = (tourSrc.match(/^\s+id: 'tour-/gm) ?? []).length;

console.log('\n── Summary ──');
console.log(`SOPs: ${sopCount} · Tours: ${tourCount}`);
console.log('Voice MP3s: run npm run tour:voice:prerender -- --all after Supabase + Cartesia');
console.log('Env: npm run env:check');

if (failed) {
  console.error(`\n${failed} gate(s) failed.`);
  process.exit(1);
}

console.log('\nLaunch Sprint CODE (Parts A–E): complete — all automated gates pass.');
console.log('Senior QA: npm run launch:senior:qa (23 paths) · rollup: npm run launch:complete');
console.log('Production go-live still needs: Supabase keys, voice mic spot-check, optional voiced tours.');
console.log('Run: npm run launch:preflight · npm run launch:ops');
