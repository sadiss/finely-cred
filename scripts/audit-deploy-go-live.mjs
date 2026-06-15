#!/usr/bin/env node
/**
 * Tier 2310 — Deploy & host go-live (wave 65).
 * Usage: npm run deploy:go-live:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/deployGoLiveOps.ts',
  'src/features/admin/AdminDeployGoLivePanel.tsx',
  'src/features/admin/AdminLaunchPlanClosurePanel.tsx',
  'docs/PRODUCTION_DEPLOY.md',
  'scripts/deploy-supabase-functions.mjs',
  'scripts/productionLaunchOrchestrator.mjs',
  'scripts/post-deploy-verify.mjs',
  'vercel.json',
  'netlify.toml',
  'public/_redirects',
  'public/_headers',
];

console.log('Finely Cred — deploy go-live audit (wave 65)\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const ops = fs.readFileSync(path.join(root, 'src/lib/deployGoLiveOps.ts'), 'utf8');
const opsOk =
  ops.includes('getDeployGoLiveSteps') &&
  ops.includes('summarizeDeployGoLiveForCoOwner') &&
  ops.includes('DEPLOY_GO_LIVE_COMMANDS') &&
  ops.includes('postDeployVerify');
console.log(`${opsOk ? '✓' : '✗'} deployGoLiveOps — deploy pipeline steps`);
if (!opsOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/admin/AdminDeployGoLivePanel.tsx'), 'utf8');
const panelOk = panel.includes('AdminDeployGoLivePanel') && panel.includes('deploy-go-live');
console.log(`${panelOk ? '✓' : '✗'} AdminDeployGoLivePanel — deploy UI`);
if (!panelOk) failed += 1;

const closure = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchPlanClosurePanel.tsx'), 'utf8');
const closureOk = closure.includes('AdminDeployGoLivePanel');
console.log(`${closureOk ? '✓' : '✗'} AdminLaunchPlanClosurePanel — deploy panel embedded`);
if (!closureOk) failed += 1;

const registry = fs.readFileSync(path.join(root, 'src/lib/launchWaveRegistry.ts'), 'utf8');
const registryOk = registry.includes('wave: 65') && registry.includes('deploy:go-live:audit');
console.log(`${registryOk ? '✓' : '✗'} launchWaveRegistry — wave 65 registered`);
if (!registryOk) failed += 1;

const runner = fs.readFileSync(path.join(root, 'src/lib/coOwnerAutomationRunner.ts'), 'utf8');
const runnerOk = runner.includes('summarizeDeployGoLiveForCoOwner');
console.log(`${runnerOk ? '✓' : '✗'} coOwnerAutomationRunner — Sage deploy summary`);
if (!runnerOk) failed += 1;

if (failed) {
  console.error(`\n${failed} deploy go-live violation(s).`);
  process.exit(1);
}

console.log('\nDeploy go-live audit pass.');
console.log('Admin: /admin/launch-os#deploy-go-live · npm run deploy:functions');
