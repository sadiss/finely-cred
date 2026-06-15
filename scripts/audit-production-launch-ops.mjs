#!/usr/bin/env node
/**
 * Tier 2292 — Production launch ops (wave 62).
 * Usage: npm run production:launch:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/productionLaunchOps.ts',
  'src/features/admin/AdminProductionLaunchPanel.tsx',
  'src/features/admin/AdminLaunchPlanClosurePanel.tsx',
  'src/lib/launchWaveRegistry.ts',
];

console.log('Finely Cred — production launch ops audit (wave 62)\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const ops = fs.readFileSync(path.join(root, 'src/lib/productionLaunchOps.ts'), 'utf8');
const opsOk =
  ops.includes('getProductionLaunchSteps') &&
  ops.includes('summarizeProductionLaunchForCoOwner') &&
  ops.includes('LAUNCH_OPERATIONAL_STEPS');
console.log(`${opsOk ? '✓' : '✗'} productionLaunchOps — runtime step resolver`);
if (!opsOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/admin/AdminProductionLaunchPanel.tsx'), 'utf8');
const panelOk = panel.includes('AdminProductionLaunchPanel') && panel.includes('production-ops');
console.log(`${panelOk ? '✓' : '✗'} AdminProductionLaunchPanel — executable checklist UI`);
if (!panelOk) failed += 1;

const closure = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchPlanClosurePanel.tsx'), 'utf8');
const closureOk = closure.includes('AdminProductionLaunchPanel');
console.log(`${closureOk ? '✓' : '✗'} AdminLaunchPlanClosurePanel — embeds production ops`);
if (!closureOk) failed += 1;

const registry = fs.readFileSync(path.join(root, 'src/lib/launchWaveRegistry.ts'), 'utf8');
const registryOk = registry.includes('wave: 62') && registry.includes('production:launch:audit');
console.log(`${registryOk ? '✓' : '✗'} launchWaveRegistry — wave 62 registered`);
if (!registryOk) failed += 1;

const runner = fs.readFileSync(path.join(root, 'src/lib/coOwnerAutomationRunner.ts'), 'utf8');
const runnerOk = runner.includes('summarizeProductionLaunchForCoOwner');
console.log(`${runnerOk ? '✓' : '✗'} coOwnerAutomationRunner — Sage production ops summary`);
if (!runnerOk) failed += 1;

if (failed) {
  console.error(`\n${failed} production launch ops violation(s).`);
  process.exit(1);
}

console.log('\nProduction launch ops audit pass.');
console.log('Admin: /admin/launch-os#production-ops · Terminal: npm run launch:go-live');
