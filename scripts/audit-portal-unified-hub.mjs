#!/usr/bin/env node
/**
 * Tier 1306 — Verify all substantive portal routes use FinelyUnifiedHubLayout.
 * Usage: npm run hub:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasApprovedPortalOrAdminShell, loadAppSrc, componentNameFromPageFile } from './lib/approvedProductShell.mjs';

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

const appSrc = loadAppSrc(root);

for (const file of files) {
  if (REDIRECT_ONLY.has(file)) {
    console.log(`○ ${file} (redirect — skipped)`);
    continue;
  }
  const content = fs.readFileSync(path.join(portalDir, file), 'utf8');
  const ok = hasApprovedPortalOrAdminShell(content, appSrc, componentNameFromPageFile(file));
  console.log(`${ok ? '✓' : '✗'} ${file}`);
  if (!ok) failed += 1;
}

const covered = files.length - REDIRECT_ONLY.size;
console.log(`\nPortal pages: ${covered} hub-required · ${REDIRECT_ONLY.size} redirect-only`);

if (failed) {
  console.error(`\n${failed} page(s) missing FinelyUnifiedHubLayout or ProductRoutedPage shell.`);
  process.exit(1);
}

console.log('\nAll portal routes use the approved hub or product shell.');
