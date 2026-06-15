#!/usr/bin/env node
/**
 * Tier 1385 — Block long-list / comparison-table UX on pricing and package surfaces.
 * Usage: npm run catalog:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Package/pricing routes must use grouped paginated catalog — not tables or unbounded card grids. */
const REQUIRED_CATALOG = [
  'src/pages/PersonalCreditPage.tsx',
  'src/pages/PricingPage.tsx',
  'src/pages/PricingServicePage.tsx',
  'src/pages/portal/PartnerCheckoutPage.tsx',
  'src/pages/portal/PartnerTradelineMarketplacePage.tsx',
];

/** Public content catalogs must paginate — no unbounded .map grids on high-traffic lanes. */
const REQUIRED_PUBLIC_CATALOG = [
  'src/pages/BookstorePage.tsx',
  'src/pages/EventsPage.tsx',
  'src/pages/TestimonialsPage.tsx',
  'src/pages/ResourcesPage.tsx',
  'src/pages/AffiliatePage.tsx',
  'src/pages/agent/AgentHubPage.tsx',
  'src/pages/affiliate/AffiliateHubPage.tsx',
  'src/pages/seller/AuSellerHubPage.tsx',
  'src/pages/FaqPage.tsx',
  'src/pages/CheckoutPage.tsx',
  'src/pages/BookstoreProductPage.tsx',
  'src/pages/business/BusinessBillionPathPage.tsx',
  'src/pages/business/BusinessDisputeDetailPage.tsx',
  'src/components/leadmagnet/LeadMagnetFunnelShell.tsx',
];

/** Portal billing/library/task lanes must paginate list grids. */
const REQUIRED_PORTAL_CATALOG = [
  'src/pages/portal/PartnerBillingPage.tsx',
  'src/pages/portal/PartnerLibraryPage.tsx',
  'src/pages/portal/PartnerMyTasksPage.tsx',
  'src/pages/portal/PartnerChecklistPage.tsx',
];

/** Entity list surfaces must paginate — no show-all / max-h scroll traps. */
const REQUIRED_ENTITY_LISTS = [
  'src/components/dashboard/LenderLogicEngine.tsx',
  'src/components/workboard/WorkListView.tsx',
  'src/pages/portal/PartnerBarterPage.tsx',
  'src/pages/portal/PartnerDashboardPage.tsx',
  'src/features/leadIntel/LeadIntelHub.tsx',
  'src/pages/portal/PortalPartnerSelectPage.tsx',
  'src/components/workboard/WorkKanbanBoard.tsx',
  'src/features/admin/AdminPlatformEventsFeed.tsx',
];

const PAGINATION_MARKERS = ['FinelyOsPaginatedStack', 'FinelyOsCatalogBrowser', 'PricingPackageCatalog'];

const FORBIDDEN_SNIPPETS = [
  { label: 'Compare Packages table heading', pattern: />Compare Packages</ },
  { label: 'PackageCard unbounded grid', pattern: /PackageCard[\s\S]{0,120}\.map\(/ },
];

console.log('Finely Cred — catalog UX audit (no long lists)\n');

let failed = 0;

for (const rel of REQUIRED_CATALOG) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.log(`✗ ${rel} (missing)`);
    failed += 1;
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');
  const ok = src.includes('PricingPackageCatalog');
  console.log(`${ok ? '✓' : '✗'} ${rel} — PricingPackageCatalog`);
  if (!ok) failed += 1;
}

for (const rel of REQUIRED_PUBLIC_CATALOG) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.log(`✗ ${rel} (missing)`);
    failed += 1;
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');
  const ok = PAGINATION_MARKERS.some((m) => src.includes(m));
  console.log(`${ok ? '✓' : '✗'} ${rel} — paginated catalog UX`);
  if (!ok) failed += 1;
}

for (const rel of REQUIRED_PORTAL_CATALOG) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.log(`✗ ${rel} (missing)`);
    failed += 1;
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');
  const ok = PAGINATION_MARKERS.some((m) => src.includes(m));
  console.log(`${ok ? '✓' : '✗'} ${rel} — portal paginated catalog UX`);
  if (!ok) failed += 1;
}

for (const rel of REQUIRED_ENTITY_LISTS) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.log(`✗ ${rel} (missing)`);
    failed += 1;
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');
  const ok =
    PAGINATION_MARKERS.some((m) => src.includes(m)) &&
    !src.includes('showAllLenders') &&
    !src.includes('showAllNotes') &&
    !src.includes('showAllModules') &&
    !src.includes('showAllNextSteps') &&
    !/\.slice\(0,\s*40\)\.map/.test(src) &&
    !/\.slice\(0,\s*80\)\.map/.test(src) &&
    !/\.slice\(0,\s*200\)\.map/.test(src) &&
    !/\.slice\(0,\s*500\)\.map/.test(src) &&
    !/max-h-56 overflow-y-auto/.test(src);
  console.log(`${ok ? '✓' : '✗'} ${rel} — paginated entity list (no show-all)`);
  if (!ok) failed += 1;
}

/** Marketing + portal pages must not render comparison tables. */
const NO_TABLE_DIRS = ['src/pages', 'src/pages/portal', 'src/pages/business', 'src/pages/au'];

for (const rel of REQUIRED_CATALOG) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) continue;
  const src = fs.readFileSync(abs, 'utf8');
  for (const { label, pattern } of FORBIDDEN_SNIPPETS) {
    if (pattern.test(src)) {
      console.log(`✗ ${rel} — forbidden: ${label}`);
      failed += 1;
    }
  }
}

function walkTsx(dirRel) {
  const abs = path.join(root, dirRel);
  if (!fs.existsSync(abs)) return;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const child = path.join(dirRel, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'admin') continue;
      walkTsx(child);
    } else if (ent.name.endsWith('.tsx')) {
      const src = fs.readFileSync(path.join(root, child), 'utf8');
      if (/<table[\s>]/.test(src)) {
        console.log(`✗ ${child} — HTML table in marketing/portal surface`);
        failed += 1;
      }
    }
  }
}

for (const dir of NO_TABLE_DIRS) {
  walkTsx(dir);
}

console.log(`\nCatalog routes checked: ${REQUIRED_CATALOG.length + REQUIRED_PUBLIC_CATALOG.length + REQUIRED_PORTAL_CATALOG.length + REQUIRED_ENTITY_LISTS.length}`);

if (failed) {
  console.error(`\n${failed} catalog UX violation(s). Use PricingPackageCatalog / FinelyOsCatalogBrowser — no long tables or unbounded grids.`);
  process.exit(1);
}

console.log('\nAll pricing/package surfaces use paginated grouped catalog UX.');
