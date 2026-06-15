#!/usr/bin/env node
/**
 * Tier 2266 — Launch waves rollup closure (wave 60).
 * Usage: npm run launch:waves:rollup:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/launchWaveRegistry.ts',
  'src/features/admin/LaunchWaveRollupPanel.tsx',
  'scripts/launch-waves-audit.mjs',
  'src/features/admin/AdminGoLiveCommandPanel.tsx',
];

console.log('Finely Cred — launch waves rollup audit (wave 60)\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const registry = fs.readFileSync(path.join(root, 'src/lib/launchWaveRegistry.ts'), 'utf8');
const registryOk =
  registry.includes('LAUNCH_WAVE_REGISTRY') &&
  registry.includes('wave: 60') &&
  registry.includes('wave: 61') &&
  registry.includes('wave: 62') &&
  registry.includes('wave: 63') &&
  registry.includes('wave: 64') &&
  registry.includes('wave: 65') &&
  registry.includes('wave: 66') &&
  registry.includes('wave: 67') &&
  registry.includes('wave: 68') &&
  registry.includes('wave: 69') &&
  registry.includes('wave: 70') &&
  registry.includes('wave: 71') &&
  registry.includes('launch:waves:audit');
console.log(`${registryOk ? '✓' : '✗'} launchWaveRegistry — waves 54–71`);
if (!registryOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/admin/LaunchWaveRollupPanel.tsx'), 'utf8');
const panelOk = panel.includes('LaunchWaveRollupPanel') && panel.includes('LAUNCH_WAVE_REGISTRY');
console.log(`${panelOk ? '✓' : '✗'} LaunchWaveRollupPanel — rollup UI`);
if (!panelOk) failed += 1;

const goLive = fs.readFileSync(path.join(root, 'src/features/admin/AdminGoLiveCommandPanel.tsx'), 'utf8');
const goLiveOk = goLive.includes('LaunchWaveRollupPanel');
console.log(`${goLiveOk ? '✓' : '✗'} AdminGoLiveCommandPanel — wave rollup embedded`);
if (!goLiveOk) failed += 1;

const sops = fs.readFileSync(path.join(root, 'src/domain/platformSops.ts'), 'utf8');
const sopsOk = sops.includes('sop-admin-go-live');
console.log(`${sopsOk ? '✓' : '✗'} platformSops — admin go-live SOP`);
if (!sopsOk) failed += 1;

const wavesScript = fs.readFileSync(path.join(root, 'scripts/launch-waves-audit.mjs'), 'utf8');
const wavesScriptOk = wavesScript.includes('coowner:audit') && wavesScript.includes('theme:go-live:audit');
console.log(`${wavesScriptOk ? '✓' : '✗'} launch-waves-audit — runs waves 54–59`);
if (!wavesScriptOk) failed += 1;

if (failed) {
  console.error(`\n${failed} launch waves rollup violation(s).`);
  process.exit(1);
}

console.log('\nLaunch waves rollup audit pass.');
