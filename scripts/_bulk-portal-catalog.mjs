import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const files = [
  'src/pages/portal/PartnerWealthPathsPage.tsx',
  'src/pages/portal/PartnerDocumentsPage.tsx',
  'src/pages/portal/PartnerDisputeDetailPage.tsx',
  'src/pages/portal/PartnerCheckoutPage.tsx',
  'src/pages/portal/PartnerCalendarPage.tsx',
  'src/pages/portal/PartnerDebtDetailPage.tsx',
  'src/pages/portal/PartnerBuildPage.tsx',
  'src/pages/portal/PartnerDebtPage.tsx',
  'src/pages/portal/PartnerCoursePage.tsx',
  'src/pages/portal/PartnerLettersVaultPage.tsx',
  'src/pages/portal/PartnerDisputesPage.tsx',
  'src/pages/portal/PartnerIdentityTheftPage.tsx',
  'src/pages/portal/PartnerCoursesPage.tsx',
  'src/pages/portal/PartnerAnalysisVaultPage.tsx',
  'src/pages/portal/PartnerMyTasksPage.tsx',
  'src/pages/portal/PartnerTradelineMarketplacePage.tsx',
  'src/pages/portal/PortalPartnerSelectPage.tsx',
  'src/pages/ContactPage.tsx',
  'src/pages/CheckoutPage.tsx',
  'src/pages/account/AccountSettingsPage.tsx',
  'src/pages/ClaimPartnerProfilePage.tsx',
  'src/pages/seller/SellerListingsPage.tsx',
  'src/pages/seller/SellerPayoutsPage.tsx',
  'src/pages/seller/SellerContractsPage.tsx',
  'src/pages/seller/AuSellerHubPage.tsx',
  'src/pages/au/AuOrdersPage.tsx',
  'src/pages/business/BusinessDisputeDetailPage.tsx',
  'src/pages/business/BusinessBillionPathPage.tsx',
  'src/pages/business/BusinessDocumentsPage.tsx',
  'src/pages/business/BusinessVendorsPage.tsx',
  'src/pages/business/BusinessProfilePage.tsx',
  'src/pages/business/BusinessBureausPage.tsx',
  'src/pages/business/BusinessFundingPage.tsx',
  'src/pages/AffiliatePage.tsx',
  'src/pages/EventsPage.tsx',
  'src/pages/EnlightenmentSessionPage.tsx',
  'src/pages/PricingPage.tsx',
  'src/pages/AgentsPage.tsx',
  'src/pages/ResourcesPage.tsx',
  'src/pages/agency/AgencySignupPage.tsx',
  'src/pages/au/AuRequestPage.tsx',
  'src/pages/PricingServicePage.tsx',
  'src/pages/UnsubscribePage.tsx',
  'src/pages/NotFoundPage.tsx',
  'src/pages/FaqPage.tsx',
  'src/pages/legal/TermsPage.tsx',
  'src/pages/legal/PrivacyPage.tsx',
  'src/pages/BookstoreProductPage.tsx',
];

for (const rel of files) {
  const fp = path.join(root, rel);
  if (!fs.existsSync(fp)) {
    console.warn('skip missing', rel);
    continue;
  }
  let s = fs.readFileSync(fp, 'utf8');
  const before = s;

  if (!s.includes('finelyOsCatalogCard')) {
    s = s.replace(
      /(\s+)(FINELY_OS_[A-Z_]+,\n(?:\s+FINELY_OS_[A-Z_]+,\n)*\s+)FINELY_OS_ENTITY_PANEL,\n\s+FINELY_OS_ENTITY_PANEL_INNER,/,
      '$1$2finelyOsCatalogCard,',
    );
    s = s.replace(
      /(\s+)FINELY_OS_ENTITY_PANEL,\n\s+FINELY_OS_ENTITY_PANEL_INNER,/,
      '$1finelyOsCatalogCard,',
    );
    s = s.replace(
      /(\s+)FINELY_OS_ENTITY_PANEL,\n/,
      (m, indent) => (s.includes('finelyOsCatalogCard') ? '' : `${indent}finelyOsCatalogCard,\n`),
    );
    s = s.replace(
      /(\s+)FINELY_OS_ENTITY_PANEL_INNER,\n/,
      (m, indent) => (s.includes('finelyOsCatalogCard') ? '' : `${indent}finelyOsCatalogCard,\n`),
    );
    s = s.replace(
      /(\s+)FINELY_OS_GLASS_INNER,\n/,
      (m, indent) => (s.includes('finelyOsCatalogCard') ? '' : `${indent}finelyOsCatalogCard,\n`),
    );
    s = s.replace(
      /(\s+)FINELY_OS_GLASS_PANEL,\n/,
      (m, indent) => (s.includes('finelyOsCatalogCard') ? '' : `${indent}finelyOsCatalogCard,\n`),
    );
  }

  s = s.replace(/\$\{FINELY_OS_ENTITY_PANEL\}/g, "${finelyOsCatalogCard('violet')} !p-5");
  s = s.replace(/\$\{FINELY_OS_ENTITY_PANEL_INNER\}/g, "${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony");
  s = s.replace(/\$\{FINELY_OS_GLASS_PANEL\}/g, "${finelyOsCatalogCard('violet')} !p-5");
  s = s.replace(/\$\{FINELY_OS_GLASS_INNER\}/g, "${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony");
  s = s.replace(/className=\{FINELY_OS_ENTITY_PANEL\}/g, "className={`${finelyOsCatalogCard('violet')} !p-5`}");
  s = s.replace(/className=\{FINELY_OS_ENTITY_PANEL_INNER\}/g, "className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}");

  // Remove orphaned imports if catalog already imported elsewhere
  s = s.replace(/\n\s+FINELY_OS_ENTITY_PANEL,\n\s+FINELY_OS_ENTITY_PANEL_INNER,/g, '\n');
  s = s.replace(/\n\s+FINELY_OS_ENTITY_PANEL,\n(?!\s+FINELY_OS_ENTITY_PANEL_INNER)/g, '\n');
  s = s.replace(/\n\s+FINELY_OS_ENTITY_PANEL_INNER,/g, '\n');
  s = s.replace(/\n\s+FINELY_OS_GLASS_INNER,/g, '\n');
  s = s.replace(/\n\s+FINELY_OS_GLASS_PANEL,/g, '\n');

  if (!s.includes('finelyOsCatalogCard')) {
    s = s.replace(
      /from '\.\.\/\.\.\/features\/os\/finelyOsLightUi';/,
      "finelyOsCatalogCard,\n} from '../../features/os/finelyOsLightUi';",
    );
    s = s.replace(
      /(\s+)(FINELY_OS_[A-Z0-9_]+,\n)(\} from '\.\.\/\.\.\/features\/os\/finelyOsLightUi';)/,
      '$1$2  finelyOsCatalogCard,\n$3',
    );
  }

  // Dedupe finelyOsCatalogCard import lines
  const lines = s.split('\n');
  let seenCatalog = false;
  s = lines
    .filter((line) => {
      if (!/^\s+finelyOsCatalogCard,\s*$/.test(line)) return true;
      if (seenCatalog) return false;
      seenCatalog = true;
      return true;
    })
    .join('\n');

  if (s !== before) {
    fs.writeFileSync(fp, s);
    console.log('updated', rel);
  }
}
