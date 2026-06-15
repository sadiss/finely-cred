#!/usr/bin/env node
/**
 * Tier 1306 — Verify all substantive portal routes use FinelyUnifiedHubLayout.
 * Usage: npm run hub:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const portalDir = path.join(root, 'src/pages/portal');

/** Legacy redirect-only routes — no hub shell required. */
const REDIRECT_ONLY = new Set(['PartnerTasksPage.tsx', 'PartnerWorkPage.tsx']);

console.log('Finely Cred — portal unified hub audit\n');

let failed = 0;
const files = fs
  .readdirSync(portalDir)
  .filter((f) => f.startsWith('Partner') && f.endsWith('.tsx'))
  .sort();

for (const file of files) {
  if (REDIRECT_ONLY.has(file)) {
    console.log(`○ ${file} (redirect — skipped)`);
    continue;
  }
  const content = fs.readFileSync(path.join(portalDir, file), 'utf8');
  const ok = content.includes('FinelyUnifiedHubLayout');
  console.log(`${ok ? '✓' : '✗'} ${file}`);
  if (!ok) failed += 1;
}

const covered = files.length - REDIRECT_ONLY.size;
console.log(`\nPortal pages: ${covered} hub-required · ${REDIRECT_ONLY.size} redirect-only`);

if (failed) {
  console.error(`\n${failed} page(s) missing FinelyUnifiedHubLayout.`);
  process.exit(1);
}

console.log('\nAll portal routes use FinelyUnifiedHubLayout.');
