#!/usr/bin/env node
/**
 * Tier 2316 — Launch final readiness rollup (wave 66).
 * Usage: npm run launch:final:readiness:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/launchFinalReadinessOps.ts',
  'src/features/admin/AdminLaunchFinalReadinessPanel.tsx',
  'src/features/admin/AdminLaunchPlanClosurePanel.tsx',
  'src/lib/envBootstrapOps.ts',
  'src/lib/productionLaunchOps.ts',
  'src/lib/deployGoLiveOps.ts',
  'src/lib/seniorQaSignoffOps.ts',
  'src/lib/goLiveCommandOps.ts',
];

console.log('Finely Cred — launch final readiness audit (wave 66)\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const ops = fs.readFileSync(path.join(root, 'src/lib/launchFinalReadinessOps.ts'), 'utf8');
const opsOk =
  ops.includes('getLaunchFinalReadiness') &&
  ops.includes('summarizeLaunchFinalReadinessForCoOwner') &&
  ops.includes('getLaunchFinalReadinessZones');
console.log(`${opsOk ? '✓' : '✗'} launchFinalReadinessOps — unified readiness rollup`);
if (!opsOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchFinalReadinessPanel.tsx'), 'utf8');
const panelOk = panel.includes('AdminLaunchFinalReadinessPanel') && panel.includes('launch-readiness');
console.log(`${panelOk ? '✓' : '✗'} AdminLaunchFinalReadinessPanel — readiness UI`);
if (!panelOk) failed += 1;

const closure = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchPlanClosurePanel.tsx'), 'utf8');
const closureOk = closure.includes('AdminLaunchFinalReadinessPanel');
console.log(`${closureOk ? '✓' : '✗'} AdminLaunchPlanClosurePanel — final readiness at top`);
if (!closureOk) failed += 1;

const registry = fs.readFileSync(path.join(root, 'src/lib/launchWaveRegistry.ts'), 'utf8');
const registryOk = registry.includes('wave: 66') && registry.includes('launch:final:readiness:audit');
console.log(`${registryOk ? '✓' : '✗'} launchWaveRegistry — wave 66 registered`);
if (!registryOk) failed += 1;

const runner = fs.readFileSync(path.join(root, 'src/lib/coOwnerAutomationRunner.ts'), 'utf8');
const runnerOk = runner.includes('summarizeLaunchFinalReadinessForCoOwner');
console.log(`${runnerOk ? '✓' : '✗'} coOwnerAutomationRunner — Sage final readiness summary`);
if (!runnerOk) failed += 1;

const plan = fs.readFileSync(path.join(root, 'src/lib/launchPlanClosure.ts'), 'utf8');
const planOk = plan.includes('to: 68');
console.log(`${planOk ? '✓' : '✗'} launchPlanClosure — waves through 68`);
if (!planOk) failed += 1;

if (failed) {
  console.error(`\n${failed} launch final readiness violation(s).`);
  process.exit(1);
}

console.log('\nLaunch final readiness audit pass.');
console.log('Admin: /admin/launch-os#launch-readiness · npm run launch:go-live');
