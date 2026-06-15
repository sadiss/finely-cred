#!/usr/bin/env node
/**
 * Part A4 — admin hub pages should expose tab UI + URL sync patterns.
 * Usage: npm run launch:admin-tabs:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const HUB_PAGES = [
  'src/pages/admin/AdminLeadsOsPage.tsx',
  'src/pages/admin/AdminSocialHubPage.tsx',
  'src/pages/admin/AdminHandsFreeOpsPage.tsx',
  'src/pages/admin/AdminCrmWorkspacePage.tsx',
  'src/pages/admin/AdminPlaybooksPage.tsx',
  'src/pages/affiliate/AffiliateHubPage.tsx',
  'src/pages/agent/AgentHubPage.tsx',
  'src/pages/business/BusinessDashboardPage.tsx',
];

console.log('Finely Cred — admin / role hub tab audit (Part A4)\n');

let failed = 0;

for (const rel of HUB_PAGES) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.log(`✗ ${rel} (missing)`);
    failed += 1;
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');
  const hasTabs =
    src.includes('FinelyUnifiedHubLayout') ||
    src.includes('activeTab') ||
    src.includes('finelyOsViewTab(tab ===');
  const hasUrlSync = src.includes('useSearchParams') || src.includes('searchParams.get');
  const ok = hasTabs && hasUrlSync;
  console.log(`${ok ? '✓' : '✗'} ${rel}${ok ? '' : ` (tabs:${hasTabs} url:${hasUrlSync})`}`);
  if (!ok) failed += 1;
}

const modulePlaybooks = path.join(root, 'src/config/modulePlaybooks.ts');
const mpOk = fs.existsSync(modulePlaybooks) && fs.readFileSync(modulePlaybooks, 'utf8').includes('MODULE_PLAYBOOKS');
console.log(`${mpOk ? '✓' : '✗'} src/config/modulePlaybooks.ts`);
if (!mpOk) failed += 1;

if (failed) {
  console.error(`\n${failed} admin tab / module playbook check(s) failed.`);
  process.exit(1);
}

console.log('\nAdmin hub tab audit pass.');
