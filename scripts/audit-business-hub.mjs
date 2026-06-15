#!/usr/bin/env node
/**
 * Tier 1348 / 1425 — Verify business lane sub-pages use FinelyUnifiedHubLayout.
 * Usage: npm run business:hub:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/pages/business/BusinessDashboardPage.tsx',
  'src/pages/business/BusinessFundingPage.tsx',
  'src/pages/business/BusinessVendorsPage.tsx',
  'src/pages/business/BusinessDisputesPage.tsx',
  'src/pages/business/BusinessDocumentsPage.tsx',
  'src/pages/business/BusinessBureausPage.tsx',
  'src/pages/business/BusinessProfilePage.tsx',
  'src/pages/business/BusinessBillionPathPage.tsx',
  'src/pages/business/BusinessDisputeDetailPage.tsx',
];

console.log('Finely Cred — business hub audit\n');

let failed = 0;
for (const rel of REQUIRED) {
  const content = fs.readFileSync(path.join(root, rel), 'utf8');
  const ok = content.includes('FinelyUnifiedHubLayout');
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

console.log(`\nBusiness hub-required: ${REQUIRED.length}`);

if (failed) {
  console.error(`\n${failed} page(s) missing FinelyUnifiedHubLayout.`);
  process.exit(1);
}

console.log('\nAll business hub routes use FinelyUnifiedHubLayout.');
