#!/usr/bin/env node
/**
 * Tier 2322 — Launch plan handoff complete (wave 67).
 * Usage: npm run launch:handoff:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/launchHandoffOps.ts',
  'src/features/admin/AdminLaunchHandoffPanel.tsx',
  'src/features/admin/AdminLaunchPlanClosurePanel.tsx',
  'scripts/launch-closure-waves-audit.mjs',
  'scripts/launch-closure-full-audit.mjs',
  'scripts/launch-waves-audit.mjs',
];

console.log('Finely Cred — launch plan handoff audit (wave 67)\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const ops = fs.readFileSync(path.join(root, 'src/lib/launchHandoffOps.ts'), 'utf8');
const opsOk =
  ops.includes('LAUNCH_PLAN_HANDOFF') &&
  ops.includes('summarizeLaunchHandoffForCoOwner') &&
  ops.includes('LAUNCH_CLOSURE_META_AUDITS');
console.log(`${opsOk ? '✓' : '✗'} launchHandoffOps — plan handoff metadata`);
if (!opsOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchHandoffPanel.tsx'), 'utf8');
const panelOk = panel.includes('AdminLaunchHandoffPanel') && panel.includes('plan-handoff');
console.log(`${panelOk ? '✓' : '✗'} AdminLaunchHandoffPanel — handoff UI`);
if (!panelOk) failed += 1;

const closure = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchPlanClosurePanel.tsx'), 'utf8');
const closureOk = closure.includes('AdminLaunchHandoffPanel');
console.log(`${closureOk ? '✓' : '✗'} AdminLaunchPlanClosurePanel — handoff panel embedded`);
if (!closureOk) failed += 1;

const registry = fs.readFileSync(path.join(root, 'src/lib/launchWaveRegistry.ts'), 'utf8');
const registryOk = registry.includes('wave: 67') && registry.includes('launch:handoff:audit');
console.log(`${registryOk ? '✓' : '✗'} launchWaveRegistry — wave 67 registered`);
if (!registryOk) failed += 1;

const runner = fs.readFileSync(path.join(root, 'src/lib/coOwnerAutomationRunner.ts'), 'utf8');
const runnerOk = runner.includes('summarizeLaunchHandoffForCoOwner');
console.log(`${runnerOk ? '✓' : '✗'} coOwnerAutomationRunner — Sage handoff summary`);
if (!runnerOk) failed += 1;

console.log('\n── Closure stack smoke (meta waves 60–66) ──');
const stack = spawnSync('npm run launch:closure:waves:audit', { cwd: root, shell: true, stdio: 'inherit' });
if (stack.status !== 0) {
  console.error('✗ launch:closure:waves:audit failed');
  failed += 1;
} else {
  console.log('✓ launch:closure:waves:audit pass');
}

if (failed) {
  console.error(`\n${failed} launch plan handoff violation(s).`);
  process.exit(1);
}

console.log('\nLaunch plan handoff audit pass.');
console.log('FINELY-OS-400 code track COMPLETE · Production: npm run launch:go-live');
