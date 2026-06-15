#!/usr/bin/env node
/**
 * Tier 2304 — Senior QA human sign-off (wave 64).
 * Usage: npm run senior:qa:signoff:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/seniorQaSignoffOps.ts',
  'src/features/admin/AdminSeniorQaSignoffPanel.tsx',
  'src/features/admin/AdminLaunchPlanClosurePanel.tsx',
  'docs/SENIOR-QA-WALKTHROUGH.md',
  'e2e/senior-qa-walkthrough.spec.ts',
  'e2e/senior-qa-portal.spec.ts',
];

console.log('Finely Cred — senior QA sign-off audit (wave 64)\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const ops = fs.readFileSync(path.join(root, 'src/lib/seniorQaSignoffOps.ts'), 'utf8');
const opsOk =
  ops.includes('SENIOR_QA_SIGNOFF_ITEMS') &&
  ops.includes('getSeniorQaSignoffProgress') &&
  ops.includes('summarizeSeniorQaSignoffForCoOwner');
console.log(`${opsOk ? '✓' : '✗'} seniorQaSignoffOps — paths + progress tracker`);
if (!opsOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/admin/AdminSeniorQaSignoffPanel.tsx'), 'utf8');
const panelOk = panel.includes('AdminSeniorQaSignoffPanel') && panel.includes('senior-qa');
console.log(`${panelOk ? '✓' : '✗'} AdminSeniorQaSignoffPanel — sign-off UI`);
if (!panelOk) failed += 1;

const closure = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchPlanClosurePanel.tsx'), 'utf8');
const closureOk = closure.includes('AdminSeniorQaSignoffPanel');
console.log(`${closureOk ? '✓' : '✗'} AdminLaunchPlanClosurePanel — senior QA embedded`);
if (!closureOk) failed += 1;

const prod = fs.readFileSync(path.join(root, 'src/lib/productionLaunchOps.ts'), 'utf8');
const prodOk = prod.includes('getSeniorQaSignoffProgress') && prod.includes('senior-qa');
console.log(`${prodOk ? '✓' : '✗'} productionLaunchOps — human-qa step wired`);
if (!prodOk) failed += 1;

const registry = fs.readFileSync(path.join(root, 'src/lib/launchWaveRegistry.ts'), 'utf8');
const registryOk = registry.includes('wave: 64') && registry.includes('senior:qa:signoff:audit');
console.log(`${registryOk ? '✓' : '✗'} launchWaveRegistry — wave 64 registered`);
if (!registryOk) failed += 1;

const runner = fs.readFileSync(path.join(root, 'src/lib/coOwnerAutomationRunner.ts'), 'utf8');
const runnerOk = runner.includes('summarizeSeniorQaSignoffForCoOwner');
console.log(`${runnerOk ? '✓' : '✗'} coOwnerAutomationRunner — Sage senior QA summary`);
if (!runnerOk) failed += 1;

if (failed) {
  console.error(`\n${failed} senior QA sign-off violation(s).`);
  process.exit(1);
}

console.log('\nSenior QA sign-off audit pass.');
console.log('Admin: /admin/launch-os#senior-qa · Automated: npm run launch:senior:qa');
