#!/usr/bin/env node
/**
 * Tier 2328 — Production go-live sequencer (wave 68).
 * Usage: npm run production:sequencer:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/productionGoLiveSequencer.ts',
  'src/features/admin/AdminProductionGoLiveSequencerPanel.tsx',
  'src/features/admin/AdminLaunchPlanClosurePanel.tsx',
  'src/lib/envBootstrapOps.ts',
  'src/lib/productionLaunchOps.ts',
  'src/lib/deployGoLiveOps.ts',
];

console.log('Finely Cred — production go-live sequencer audit (wave 68)\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const seq = fs.readFileSync(path.join(root, 'src/lib/productionGoLiveSequencer.ts'), 'utf8');
const seqOk =
  seq.includes('getProductionGoLiveSequence') &&
  seq.includes('summarizeProductionGoLiveSequencerForCoOwner') &&
  seq.includes('GoLivePhase');
console.log(`${seqOk ? '✓' : '✗'} productionGoLiveSequencer — phased playbook`);
if (!seqOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/admin/AdminProductionGoLiveSequencerPanel.tsx'), 'utf8');
const panelOk = panel.includes('AdminProductionGoLiveSequencerPanel') && panel.includes('production-sequencer');
console.log(`${panelOk ? '✓' : '✗'} AdminProductionGoLiveSequencerPanel — sequencer UI`);
if (!panelOk) failed += 1;

const closure = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchPlanClosurePanel.tsx'), 'utf8');
const closureOk = closure.includes('AdminProductionGoLiveSequencerPanel');
console.log(`${closureOk ? '✓' : '✗'} AdminLaunchPlanClosurePanel — sequencer embedded`);
if (!closureOk) failed += 1;

const registry = fs.readFileSync(path.join(root, 'src/lib/launchWaveRegistry.ts'), 'utf8');
const registryOk = registry.includes('wave: 68') && registry.includes('production:sequencer:audit');
console.log(`${registryOk ? '✓' : '✗'} launchWaveRegistry — wave 68 registered`);
if (!registryOk) failed += 1;

const runner = fs.readFileSync(path.join(root, 'src/lib/coOwnerAutomationRunner.ts'), 'utf8');
const runnerOk = runner.includes('summarizeProductionGoLiveSequencerForCoOwner');
console.log(`${runnerOk ? '✓' : '✗'} coOwnerAutomationRunner — Sage sequencer summary`);
if (!runnerOk) failed += 1;

if (failed) {
  console.error(`\n${failed} production sequencer violation(s).`);
  process.exit(1);
}

console.log('\nProduction go-live sequencer audit pass.');
console.log('Admin: /admin/launch-os#production-sequencer');
