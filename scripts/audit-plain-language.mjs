#!/usr/bin/env node
/**
 * Launch Part D2 — onboarding and hub copy stays plain-language (no legacy jargon).
 * Usage: npm run launch:plain:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** User-facing phrases that should not appear in live onboarding copy. */
const BANNED_IN_ONBOARDING = [
  'Foundation Fractures',
  'Derogatory Volume',
  'Structural Integrity',
  'Asset Liquidity',
  'Statutory Calibration',
  'Statutory Engine',
  'vacation of liabilities',
  'Wealth Projection',
  'Validate Liquidity Vector',
  'Analyze Structural Depth',
  'Wealth Vector',
  'Authorize Identity',
  'corporate stacking',
  'DFY execution',
  'enlightenment session',
  'enlightenment call',
  'enlightenment sessions',
  'Node ID',
  'Letters Command Center',
  'organized like an operator',
];

const PLAIN_LANGUAGE_SURFACES = [
  {
    file: 'src/components/portal/index.tsx',
    banned: BANNED_IN_ONBOARDING,
    require: ['FinelyNowDoThisStrip', 'FinelyNoticedStrip', 'What holds your', 'Choose your'],
  },
  {
    file: 'src/pages/ResourcesPage.tsx',
    banned: ['Sovereign', 'Statutory Engine', 'enlightenment session', 'enlightenment sessions'],
    require: ['fc-launch-lane-header', 'fc-senior-simple', 'Free guides, credit monitoring', 'strategy call'],
  },
  {
    file: 'src/pages/StartHerePage.tsx',
    banned: ['Foundation Fracture', 'Wealth Vector'],
    require: ['FinelyNowDoThisStrip', 'fc-senior-simple'],
  },
  {
    file: 'src/components/PortalSteps.jsx',
    banned: BANNED_IN_ONBOARDING,
    require: ['FinelyNowDoThisStrip', 'What holds your', 'Building your plan'],
  },
  {
    file: 'src/lib/finelyProactiveSignals.ts',
    banned: ['enlightenment call', 'enlightenment session'],
    require: ['buildCalendarNoticedItems', 'strategy call'],
  },
  {
    file: 'src/pages/portal/PartnerDashboardPage.tsx',
    banned: ['enlightenment session', 'enlightenment call', 'Enlightenment Sessions'],
    require: ['FinelyNowDoThisStrip', 'strategy call', 'fc-launch-lane-header', 'fc-senior-simple'],
  },
  {
    file: 'src/pages/portal/PartnerCalendarPage.tsx',
    banned: ['enlightenment session', 'enlightenment sessions'],
    require: ['Book strategy calls'],
  },
  {
    file: 'src/components/calendar/MeetingBookingPanel.tsx',
    banned: ['Enlightenment session', 'enlightenment session'],
    require: ['Strategy call'],
  },
  {
    file: 'src/components/comms/commsWorkspaceModel.ts',
    banned: ['enlightenment session', 'enlightenment sessions'],
    require: ['strategy call'],
  },
  {
    file: 'src/components/comms/CommsWorkspaceActions.tsx',
    banned: ['enlightenment session', 'enlightenment sessions'],
    require: ['strategy call'],
  },
  {
    file: 'src/domain/platformSops.ts',
    banned: ['Book an enlightenment session', 'enlightenment session'],
    require: ['Book a strategy call'],
  },
  {
    file: 'src/config/tourManifest.ts',
    banned: ['Book an enlightenment session'],
    require: ['Book a strategy call'],
  },
  {
    file: 'src/lib/conversationalAi.ts',
    banned: ['enlightenment session', 'enlightenment call'],
    require: ['strategy call'],
  },
  {
    file: 'src/data/calendarSettingsRepo.ts',
    banned: ['Enlightenment session', 'enlightenment session'],
    require: ['Strategy call'],
  },
  {
    file: 'src/pages/EnlightenmentSessionPage.tsx',
    banned: ['Enlightenment session', 'Enlightenment Session', 'Book an Enlightenment Session', 'enlightenment session'],
    require: ['Strategy call', 'strategy call'],
  },
  {
    file: 'src/knowledge/finelyKnowledgeBase.ts',
    banned: ['Enlightenment session', 'enlightenment session'],
    require: ['strategy call'],
  },
  {
    file: 'src/config/pricingCatalog.ts',
    banned: ['Enlightenment Session', 'enlightenment session', 'Enlightenment sessions'],
    require: ['strategy call'],
  },
  {
    file: 'src/pages/portal/PartnerLettersPage.tsx',
    banned: ['Letters Command Center', 'command center'],
    require: ['Letter Studio'],
  },
  {
    file: 'src/pages/portal/PartnerLettersVaultPage.tsx',
    banned: ['Letters Command Center', 'command center'],
    require: ['Letter Studio'],
  },
  {
    file: 'src/pages/PersonalCreditPage.tsx',
    banned: ['enlightenment session', 'structured evidence system', 'Wealth builder'],
    require: ['FinelyNoticedStrip', 'strategy call', 'fc-senior-simple'],
  },
  {
    file: 'src/pages/FundabilityReadinessPage.tsx',
    banned: ['enlightenment session', 'Wealth builder', 'Wealth Vector'],
    require: ['FinelyNoticedStrip', 'Book strategy call', 'fc-senior-simple'],
  },
  {
    file: 'src/pages/affiliate/AffiliateHubPage.tsx',
    banned: ['enlightenment session', 'Wealth Vector', 'command center'],
    require: ['AffiliatePitchPanel', 'FinelyNowDoThisStrip', 'fc-senior-simple'],
  },
  {
    file: 'src/components/affiliate/AffiliateCommandStrip.tsx',
    banned: ['command center', 'Command center'],
    require: ['affiliate dashboard'],
  },
  {
    file: 'src/components/dashboard/DashboardFundingPanel.tsx',
    banned: ['command center', 'Command center'],
    require: ['overview'],
  },
  {
    file: 'src/features/reasons/ReasonsCommandHub.tsx',
    banned: ['command center', 'Reasons OS'],
    require: ['Dispute reasons', 'Pick dispute reasons'],
  },
  {
    file: 'src/components/promotions/RolePromoLinksPanel.tsx',
    banned: ['Book enlightenment', 'enlightenment session'],
    require: ['Book strategy call'],
  },
];

console.log('Finely Cred — plain-language audit (Part D2)\n');

let failed = 0;

const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
const laneHeaderOk = css.includes('.fc-launch-lane-header');
console.log(`${laneHeaderOk ? '✓' : '✗'} CSS: .fc-launch-lane-header`);
if (!laneHeaderOk) failed += 1;

for (const surface of PLAIN_LANGUAGE_SURFACES) {
  const abs = path.join(root, surface.file);
  if (!fs.existsSync(abs)) {
    console.log(`✗ ${surface.file} (missing)`);
    failed += 1;
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');

  for (const phrase of surface.banned) {
    const hit = src.includes(phrase);
    console.log(`${hit ? '✗' : '✓'} ${surface.file} — no "${phrase}"`);
    if (hit) failed += 1;
  }

  for (const needle of surface.require) {
    const ok = src.includes(needle);
    console.log(`${ok ? '✓' : '✗'} ${surface.file} → ${needle}`);
    if (!ok) failed += 1;
  }
}

if (failed) {
  console.error(`\n${failed} plain-language check(s) failed.`);
  process.exit(1);
}

console.log('\nPlain-language audit pass.');
