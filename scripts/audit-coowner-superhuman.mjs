#!/usr/bin/env node
/**
 * Wave 71 — Ruth superhuman + Dev Studio audit.
 * Usage: npm run coowner:superhuman:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('Finely Cred — Ruth superhuman audit (wave 71)\n');

let failed = 0;

const REQUIRED = [
  'src/lib/coOwnerSuperhumanOps.ts',
  'src/lib/coOwnerSiteKnowledgeMap.ts',
  'src/lib/coOwnerExecutionRegistry.ts',
  'src/lib/coOwnerDevStudio.ts',
  'src/lib/coOwnerDevActions.ts',
  'src/components/coOwner/CoOwnerDevStudioPanel.tsx',
  'src/lib/platformCron.ts',
];

for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const superhuman = fs.readFileSync(path.join(root, 'src/lib/coOwnerSuperhumanOps.ts'), 'utf8');
const superOk =
  superhuman.includes('buildCoOwnerSuperhumanCronSnapshot') &&
  superhuman.includes('summarizeCoOwnerSuperhumanForCoOwner');
console.log(`${superOk ? '✓' : '✗'} coOwnerSuperhumanOps — cron snapshot`);
if (!superOk) failed += 1;

const cron = fs.readFileSync(path.join(root, 'src/lib/platformCron.ts'), 'utf8');
const cronOk = cron.includes('coOwnerSuperhuman');
console.log(`${cronOk ? '✓' : '✗'} platformCron — superhuman telemetry on tick`);
if (!cronOk) failed += 1;

const registry = fs.readFileSync(path.join(root, 'src/lib/launchWaveRegistry.ts'), 'utf8');
const registryOk = registry.includes('wave: 71') && registry.includes('coowner_superhuman_wave71');
console.log(`${registryOk ? '✓' : '✗'} launchWaveRegistry — wave 71 registered`);
if (!registryOk) failed += 1;

console.log('\n── Base co-owner ops ──');
const base = spawnSync('npm run coowner:audit', { cwd: root, shell: true, stdio: 'inherit' });
if (base.status !== 0) failed += 1;

if (failed) {
  console.error(`\n${failed} Ruth superhuman violation(s).`);
  process.exit(1);
}

console.log('\nRuth superhuman audit pass.');
console.log('Hub: /admin/ops-agent · Dev Studio: /admin/ops-agent#dev-studio');
