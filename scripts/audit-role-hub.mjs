#!/usr/bin/env node
/**
 * Tier 1405 — Verify authenticated role hubs use FinelyUnifiedHubLayout.
 * Usage: npm run role:hub:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/pages/agent/AgentHubPage.tsx',
  'src/pages/affiliate/AffiliateHubPage.tsx',
  'src/pages/seller/AuSellerHubPage.tsx',
];

console.log('Finely Cred — role hub audit\n');

let failed = 0;
for (const rel of REQUIRED) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.log(`✗ ${rel} (missing)`);
    failed += 1;
    continue;
  }
  const ok = fs.readFileSync(abs, 'utf8').includes('FinelyUnifiedHubLayout');
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

console.log(`\nRole hubs checked: ${REQUIRED.length}`);

if (failed) {
  console.error(`\n${failed} role hub(s) missing FinelyUnifiedHubLayout.`);
  process.exit(1);
}

console.log('\nAll role hubs use FinelyUnifiedHubLayout.');
