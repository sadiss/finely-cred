#!/usr/bin/env node
/**
 * Tier 1485 — Verify key admin ops pages use FinelyUnifiedHubLayout.
 * Usage: npm run admin:hub:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasApprovedPortalOrAdminShell, loadAppSrc, componentNameFromPageFile } from './lib/approvedProductShell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/pages/admin/AdminDashboardPage.tsx',
  'src/pages/admin/PartnersListPage.tsx',
  'src/pages/admin/AdminWorkflowQueuePage.tsx',
  'src/pages/admin/AdminLeadsOsPage.tsx',
  'src/pages/admin/AdminCrmWorkspacePage.tsx',
  'src/pages/admin/AdminPlaybooksPage.tsx',
  'src/pages/admin/AdminCommsStudioPage.tsx',
  'src/pages/admin/AdminAutomationsPage.tsx',
  'src/pages/admin/AdminPortfolioDashboardPage.tsx',
];

console.log('Finely Cred — admin hub audit\n');

const appSrc = loadAppSrc(root);
let failed = 0;
for (const rel of REQUIRED) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.log(`✗ ${rel} (missing)`);
    failed += 1;
    continue;
  }
  const ok = hasApprovedPortalOrAdminShell(fs.readFileSync(abs, 'utf8'), appSrc, componentNameFromPageFile(rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

console.log(`\nAdmin hub-required: ${REQUIRED.length}`);

if (failed) {
  console.error(`\n${failed} admin page(s) missing FinelyUnifiedHubLayout or ProductRoutedPage shell.`);
  process.exit(1);
}

console.log('\nAll admin hub routes use the approved hub or product shell.');
