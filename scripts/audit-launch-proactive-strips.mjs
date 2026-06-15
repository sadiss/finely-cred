#!/usr/bin/env node
/**
 * Launch OS — verify key routes expose FinelyNowDoThisStrip (Part D3).
 * Usage: npm run launch:strips:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/pages/StartHerePage.tsx',
  'src/pages/ResourcesPage.tsx',
  'src/pages/FundabilityReadinessPage.tsx',
  'src/pages/PersonalCreditPage.tsx',
  'src/pages/LaunchHelpCenterPage.tsx',
  'src/pages/portal/PartnerDashboardPage.tsx',
  'src/pages/portal/PartnerReportsPage.tsx',
  'src/pages/portal/PartnerDisputesPage.tsx',
  'src/pages/portal/PartnerLettersPage.tsx',
  'src/pages/portal/PartnerDocumentsPage.tsx',
  'src/pages/portal/PartnerBillingPage.tsx',
  'src/pages/portal/PartnerTemplateLibraryPage.tsx',
  'src/pages/portal/PartnerMyTasksPage.tsx',
  'src/pages/portal/PartnerCalendarPage.tsx',
  'src/pages/portal/PartnerEducationPage.tsx',
  'src/pages/portal/PartnerMessagesPage.tsx',
  'src/pages/business/BusinessDashboardPage.tsx',
  'src/pages/admin/AdminCrmWorkspacePage.tsx',
  'src/pages/agent/AgentHubPage.tsx',
  'src/pages/portal/PartnerProjectsPage.tsx',
  'src/pages/admin/AdminDashboardPage.tsx',
  'src/pages/admin/AdminWorkflowQueuePage.tsx',
  'src/pages/admin/PartnersListPage.tsx',
  'src/pages/affiliate/AffiliateHubPage.tsx',
  'src/components/portal/index.tsx',
  'src/components/PortalSteps.jsx',
];

console.log('Finely Cred — launch proactive strips audit\n');

let failed = 0;

for (const rel of REQUIRED) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.log(`✗ ${rel} (missing)`);
    failed += 1;
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');
  const ok = src.includes('FinelyNowDoThisStrip');
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

if (failed) {
  console.error(`\n${failed} route(s) missing FinelyNowDoThisStrip.`);
  process.exit(1);
}

console.log('\nAll launch proactive strip routes pass.');
