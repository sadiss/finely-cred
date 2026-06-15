#!/usr/bin/env node
/**
 * Tier 2298 — Env bootstrap command center (wave 63).
 * Usage: npm run env:bootstrap:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/envBootstrapOps.ts',
  'src/features/admin/AdminEnvBootstrapPanel.tsx',
  'src/features/admin/AdminLaunchPlanClosurePanel.tsx',
  'scripts/setup-local-env.mjs',
  'scripts/dev-supabase-setup-guide.mjs',
  'scripts/validate-local-env.mjs',
  '.env.example',
];

console.log('Finely Cred — env bootstrap audit (wave 63)\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const ops = fs.readFileSync(path.join(root, 'src/lib/envBootstrapOps.ts'), 'utf8');
const opsOk =
  ops.includes('getEnvBootstrapSteps') &&
  ops.includes('summarizeEnvBootstrapForCoOwner') &&
  ops.includes('ENV_LOCAL_TEMPLATE');
console.log(`${opsOk ? '✓' : '✗'} envBootstrapOps — bootstrap steps + Sage summary`);
if (!opsOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/admin/AdminEnvBootstrapPanel.tsx'), 'utf8');
const panelOk = panel.includes('AdminEnvBootstrapPanel') && panel.includes('env-bootstrap');
console.log(`${panelOk ? '✓' : '✗'} AdminEnvBootstrapPanel — bootstrap UI`);
if (!panelOk) failed += 1;

const closure = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchPlanClosurePanel.tsx'), 'utf8');
const closureOk = closure.includes('AdminEnvBootstrapPanel');
console.log(`${closureOk ? '✓' : '✗'} AdminLaunchPlanClosurePanel — shows bootstrap when keys pending`);
if (!closureOk) failed += 1;

const goLive = fs.readFileSync(path.join(root, 'src/lib/goLiveCommandOps.ts'), 'utf8');
const goLiveOk = goLive.includes('env-bootstrap');
console.log(`${goLiveOk ? '✓' : '✗'} goLiveCommandOps — pillar links to env bootstrap`);
if (!goLiveOk) failed += 1;

const registry = fs.readFileSync(path.join(root, 'src/lib/launchWaveRegistry.ts'), 'utf8');
const registryOk = registry.includes('wave: 63') && registry.includes('env:bootstrap:audit');
console.log(`${registryOk ? '✓' : '✗'} launchWaveRegistry — wave 63 registered`);
if (!registryOk) failed += 1;

const runner = fs.readFileSync(path.join(root, 'src/lib/coOwnerAutomationRunner.ts'), 'utf8');
const runnerOk = runner.includes('summarizeEnvBootstrapForCoOwner');
console.log(`${runnerOk ? '✓' : '✗'} coOwnerAutomationRunner — Sage env bootstrap summary`);
if (!runnerOk) failed += 1;

if (failed) {
  console.error(`\n${failed} env bootstrap violation(s).`);
  process.exit(1);
}

console.log('\nEnv bootstrap audit pass.');
console.log('Admin: /admin/launch-os#env-bootstrap · Terminal: npm run env:dev-supabase');
