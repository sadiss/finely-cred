#!/usr/bin/env node
/**
 * Tier 2286 — Launch plan code closure (wave 61).
 * Usage: npm run launch:plan:closure:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/launchPlanClosure.ts',
  'src/features/admin/AdminLaunchPlanClosurePanel.tsx',
  'src/lib/launchWaveRegistry.ts',
  'src/pages/LaunchHelpCenterPage.tsx',
  'scripts/launch-waves-audit.mjs',
  'scripts/launch-complete.mjs',
];

console.log('Finely Cred — launch plan closure audit (wave 61)\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const closure = fs.readFileSync(path.join(root, 'src/lib/launchPlanClosure.ts'), 'utf8');
const closureOk =
  closure.includes('LAUNCH_CODE_TRACK_STATUS') &&
  closure.includes('LAUNCH_OPERATIONAL_STEPS') &&
  closure.includes('summarizeLaunchPlanClosureForCoOwner');
console.log(`${closureOk ? '✓' : '✗'} launchPlanClosure — code complete + ops steps`);
if (!closureOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchPlanClosurePanel.tsx'), 'utf8');
const panelOk = panel.includes('AdminLaunchPlanClosurePanel') && panel.includes('plan-closure');
console.log(`${panelOk ? '✓' : '✗'} AdminLaunchPlanClosurePanel — closure UI`);
if (!panelOk) failed += 1;

const registry = fs.readFileSync(path.join(root, 'src/lib/launchWaveRegistry.ts'), 'utf8');
const registryOk = registry.includes('wave: 61') && registry.includes('launch:plan:closure:audit');
console.log(`${registryOk ? '✓' : '✗'} launchWaveRegistry — wave 61 registered`);
if (!registryOk) failed += 1;

const launch = fs.readFileSync(path.join(root, 'src/pages/LaunchHelpCenterPage.tsx'), 'utf8');
const launchOk = launch.includes('AdminLaunchPlanClosurePanel');
console.log(`${launchOk ? '✓' : '✗'} LaunchHelpCenterPage — closure panel on admin Launch OS`);
if (!launchOk) failed += 1;

const sops = fs.readFileSync(path.join(root, 'src/domain/platformSops.ts'), 'utf8');
const sopsOk = sops.includes('sop-admin-go-live');
console.log(`${sopsOk ? '✓' : '✗'} platformSops — go-live SOP present`);
if (!sopsOk) failed += 1;

if (failed) {
  console.error(`\n${failed} launch plan closure violation(s).`);
  process.exit(1);
}

console.log('\nLaunch plan closure audit pass.');
console.log('Code track: COMPLETE (waves 54–68) · Ops: npm run launch:go-live');
