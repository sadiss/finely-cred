#!/usr/bin/env node
/**
 * Tier 2340 — Launch OS navigation hub (wave 70).
 * Usage: npm run launch:os:nav:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/launchOsNavOps.ts',
  'src/features/admin/AdminLaunchOsNavPanel.tsx',
  'src/features/admin/AdminLaunchPlanClosurePanel.tsx',
  'src/pages/LaunchHelpCenterPage.tsx',
];

console.log('Finely Cred — Launch OS nav hub audit (wave 70)\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const ops = fs.readFileSync(path.join(root, 'src/lib/launchOsNavOps.ts'), 'utf8');
const opsOk =
  ops.includes('LAUNCH_OS_NAV_SECTIONS') &&
  ops.includes('summarizeLaunchOsNavForCoOwner') &&
  ops.includes('production-sequencer');
console.log(`${opsOk ? '✓' : '✗'} launchOsNavOps — section registry`);
if (!opsOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchOsNavPanel.tsx'), 'utf8');
const panelOk = panel.includes('AdminLaunchOsNavPanel') && panel.includes('launch-os-nav');
console.log(`${panelOk ? '✓' : '✗'} AdminLaunchOsNavPanel — nav UI`);
if (!panelOk) failed += 1;

const closure = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchPlanClosurePanel.tsx'), 'utf8');
const closureOk = closure.includes('AdminLaunchOsNavPanel');
console.log(`${closureOk ? '✓' : '✗'} AdminLaunchPlanClosurePanel — nav embedded`);
if (!closureOk) failed += 1;

const registry = fs.readFileSync(path.join(root, 'src/lib/launchWaveRegistry.ts'), 'utf8');
const registryOk = registry.includes('wave: 70') && registry.includes('launch:os:nav:audit');
console.log(`${registryOk ? '✓' : '✗'} launchWaveRegistry — wave 70 registered`);
if (!registryOk) failed += 1;

const runner = fs.readFileSync(path.join(root, 'src/lib/coOwnerAutomationRunner.ts'), 'utf8');
const runnerOk = runner.includes('summarizeLaunchOsNavForCoOwner');
console.log(`${runnerOk ? '✓' : '✗'} coOwnerAutomationRunner — Sage nav summary`);
if (!runnerOk) failed += 1;

if (failed) {
  console.error(`\n${failed} Launch OS nav violation(s).`);
  process.exit(1);
}

console.log('\nLaunch OS nav hub audit pass.');
console.log('Admin: /admin/launch-os#launch-os-nav');
