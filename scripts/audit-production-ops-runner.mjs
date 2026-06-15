#!/usr/bin/env node
/**
 * Tier 2334 — Production ops runner + plan seal (wave 69).
 * Usage: npm run production:ops:runner:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/productionOpsRunnerOps.ts',
  'src/features/admin/AdminProductionOpsRunnerPanel.tsx',
  'src/features/admin/AdminLaunchPlanClosurePanel.tsx',
  'scripts/launch-production-ops.mjs',
];

console.log('Finely Cred — production ops runner audit (wave 69)\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const ops = fs.readFileSync(path.join(root, 'src/lib/productionOpsRunnerOps.ts'), 'utf8');
const opsOk =
  ops.includes('LAUNCH_PLAN_SEAL') &&
  ops.includes('LAUNCH_PRODUCTION_OPS_COMMAND') &&
  ops.includes('summarizeProductionOpsRunnerForCoOwner');
console.log(`${opsOk ? '✓' : '✗'} productionOpsRunnerOps — plan seal + runner metadata`);
if (!opsOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/admin/AdminProductionOpsRunnerPanel.tsx'), 'utf8');
const panelOk = panel.includes('AdminProductionOpsRunnerPanel') && panel.includes('production-ops-runner');
console.log(`${panelOk ? '✓' : '✗'} AdminProductionOpsRunnerPanel — runner UI`);
if (!panelOk) failed += 1;

const pkg = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
const pkgOk = pkg.includes('launch:production:ops') && pkg.includes('production:ops:runner:audit');
console.log(`${pkgOk ? '✓' : '✗'} package.json — launch:production:ops script`);
if (!pkgOk) failed += 1;

const registry = fs.readFileSync(path.join(root, 'src/lib/launchWaveRegistry.ts'), 'utf8');
const registryOk = registry.includes('wave: 69') && registry.includes('production:ops:runner:audit');
console.log(`${registryOk ? '✓' : '✗'} launchWaveRegistry — wave 69 registered`);
if (!registryOk) failed += 1;

const runner = fs.readFileSync(path.join(root, 'src/lib/coOwnerAutomationRunner.ts'), 'utf8');
const runnerOk = runner.includes('summarizeProductionOpsRunnerForCoOwner');
console.log(`${runnerOk ? '✓' : '✗'} coOwnerAutomationRunner — Sage ops runner summary`);
if (!runnerOk) failed += 1;

if (failed) {
  console.error(`\n${failed} production ops runner violation(s).`);
  process.exit(1);
}

console.log('\nProduction ops runner audit pass.');
console.log('Terminal: npm run launch:production:ops · Admin: /admin/launch-os#production-ops-runner');
