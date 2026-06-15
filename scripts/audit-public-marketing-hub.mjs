#!/usr/bin/env node
/**
 * Tier 1328 / 1425 — Verify key public marketing routes use FinelyUnifiedHubLayout.
 * Usage: npm run public:hub:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** High-traffic public lanes that must use the unified hub shell. */
const REQUIRED = [
  'src/pages/PersonalCreditPage.tsx',
  'src/pages/PricingPage.tsx',
  'src/pages/PricingServicePage.tsx',
  'src/pages/ResourcesPage.tsx',
  'src/pages/FundabilityReadinessPage.tsx',
  'src/pages/BookstorePage.tsx',
  'src/pages/au/AuMarketplacePage.tsx',
  'src/pages/au/AuOrdersPage.tsx',
  'src/pages/au/AuRequestPage.tsx',
  'src/pages/business/BusinessDashboardPage.tsx',
  'src/pages/EnlightenmentSessionPage.tsx',
  'src/pages/AgentsPage.tsx',
  'src/pages/AffiliatePage.tsx',
  'src/pages/ContactPage.tsx',
  'src/pages/EventsPage.tsx',
  'src/pages/TestimonialsPage.tsx',
  // Wave 15
  'src/pages/FaqPage.tsx',
  'src/pages/CheckoutPage.tsx',
  'src/pages/BookstoreProductPage.tsx',
  'src/pages/agency/AgencySignupPage.tsx',
  'src/pages/legal/TermsPage.tsx',
  'src/pages/legal/PrivacyPage.tsx',
  'src/pages/legal/DisclaimerPage.tsx',
];

const FUNNEL_SHELL = 'src/components/leadmagnet/LeadMagnetFunnelShell.tsx';

console.log('Finely Cred — public marketing hub audit\n');

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

const funnelAbs = path.join(root, FUNNEL_SHELL);
const funnelOk =
  fs.existsSync(funnelAbs) &&
  fs.readFileSync(funnelAbs, 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(funnelAbs, 'utf8').includes('FinelyOsPaginatedStack');
console.log(`${funnelOk ? '✓' : '✗'} ${FUNNEL_SHELL} — hub + paginated funnel catalog`);
if (!funnelOk) failed += 1;

console.log(`\nPublic lanes checked: ${REQUIRED.length + 1}`);

if (failed) {
  console.error(`\n${failed} route(s) missing FinelyUnifiedHubLayout.`);
  process.exit(1);
}

console.log('\nAll public marketing lanes use FinelyUnifiedHubLayout.');
