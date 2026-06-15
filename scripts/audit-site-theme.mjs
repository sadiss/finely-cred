#!/usr/bin/env node
/**
 * Tier 1426 / 1465 — Site-wide theme toggle + simplified wayfinding + portal simple nav audit.
 * Usage: npm run theme:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/finelySiteTheme.ts',
  'src/features/os/FinelySiteThemeProvider.tsx',
  'src/features/os/FinelyThemeToggle.tsx',
  'src/features/os/FinelySiteWayfinder.tsx',
  'src/config/siteWayfinderLanes.ts',
  'src/config/portalNavLanes.ts',
  'src/lib/finelyPortalNavMode.ts',
  'src/features/os/FinelyPortalSimpleNav.tsx',
  'src/config/adminNavLanes.ts',
  'src/lib/finelyAdminNavMode.ts',
  'src/features/os/FinelyAdminSimpleNav.tsx',
  'src/features/os/FinelyAdminAppearancePanel.tsx',
  'src/lib/finelyThemeAccess.ts',
  'src/config/partnerDetailTabLanes.ts',
  'src/features/os/FinelyEntityTabLaneNav.tsx',
];

console.log('Finely Cred — site theme + wayfinder + portal nav audit\n');

let failed = 0;

for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
const cssOk =
  css.includes('html[data-fc-theme="light"]') &&
  css.includes('fc-theme-toggle') &&
  css.includes('fc-band-emerald') &&
  css.includes('data-fc-app-surface') &&
  css.includes('data-fc-onboarding-shell') &&
  css.includes('fc-entity-sticky-bar') &&
  css.includes('data-fc-entity-tab-nav') &&
  css.includes('Light theme vivid accent pop') &&
  css.includes('Light theme frosted glass system') &&
  css.includes('Light theme premium UX layer') &&
  css.includes('fc-accent-card') &&
  css.includes('fc-metal-black-icon-box') &&
  css.includes('fc-light-contrast-band') &&
  css.includes('--fc-shell-gradient') &&
  css.includes('Part CB') &&
  css.includes('Part CC') &&
  css.includes('Part CD') &&
  css.includes('Part CE') &&
  css.includes('Part CF') &&
  css.includes('Part CG') &&
  css.includes('Part CH') &&
  css.includes('Part CI') &&
  css.includes('Part CJ') &&
  css.includes('Part CK') &&
  css.includes('Part CL') &&
  css.includes('Part CM') &&
  css.includes('Part CN') &&
  css.includes('Part CO') &&
  css.includes('Part CP') &&
  css.includes('Part CQ') &&
  css.includes('Part CR') &&
  css.includes('Part CS') &&
  css.includes('Part CT') &&
  css.includes('Part CU') &&
  css.includes('Part CV') &&
  css.includes('Part CW') &&
  css.includes('Part CX') &&
  css.includes('Part CY') &&
  css.includes('fc-light-tooltip-shell') &&
  css.includes('fc-light-glass-panel') &&
  css.includes('data-fc-comms-shell') &&
  css.includes('data-fc-letter-studio') &&
  css.includes('data-fc-credit-intel') &&
  css.includes('fc-pop-surface') &&
  css.includes('fc-light-readable') &&
  css.includes('fc-affiliate-band') &&
  css.includes('fc-testimonial-dossier') &&
  css.includes('--fc-light-pop-shadow-xl') &&
  css.includes('fc-hub-kpi') &&
  css.includes('--fc-light-black-card-bg') &&
  css.includes('--fc-light-chrome-bg') &&
  css.includes('--fc-light-luxury-mesh') &&
  css.includes('fc-luxury-glass') &&
  css.includes('fc-pageshell-aurora-glow-violet');
console.log(`${cssOk ? '✓' : '✗'} src/index.css — light theme tokens + frosted glass + premium UX + luxury mesh`);
if (!cssOk) failed += 1;

const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const appOk = app.includes('FinelySiteThemeProvider') && app.includes('PUBLIC_PRIMARY_NAV') && app.includes('FinelyThemeToggle');
console.log(`${appOk ? '✓' : '✗'} App.tsx — theme provider + simplified nav`);
if (!appOk) failed += 1;

const shell = fs.readFileSync(path.join(root, 'src/components/layout/PageShell.tsx'), 'utf8');
const shellOk =
  shell.includes('FinelySiteWayfinder') &&
  shell.includes('FinelyThemeToggle') &&
  shell.includes('data-fc-app-surface') &&
  shell.includes('fc-light-black-scope') &&
  shell.includes('fc-pageshell-aurora-glow-violet');
console.log(`${shellOk ? '✓' : '✗'} PageShell.tsx — wayfinder + theme toggle + light aurora orbs + black-card scope`);
if (!shellOk) failed += 1;

const portalNav = fs.readFileSync(path.join(root, 'src/components/portal/PartnerPortalNav.tsx'), 'utf8');
const portalNavOk =
  portalNav.includes('FinelyPortalSimpleNav') &&
  portalNav.includes('readPortalNavMode') &&
  portalNav.includes('portalNavLanes');
console.log(`${portalNavOk ? '✓' : '✗'} PartnerPortalNav.tsx — simple nav default + full nav toggle`);
if (!portalNavOk) failed += 1;

const adminNav = fs.readFileSync(path.join(root, 'src/components/admin/AdminNav.tsx'), 'utf8');
const adminNavOk =
  adminNav.includes('FinelyAdminSimpleNav') &&
  adminNav.includes('readAdminNavMode') &&
  adminNav.includes('adminNavLanes');
console.log(`${adminNavOk ? '✓' : '✗'} AdminNav.tsx — simple nav default + full nav toggle`);
if (!adminNavOk) failed += 1;

const adminSimpleNav = fs.readFileSync(path.join(root, 'src/features/os/FinelyAdminSimpleNav.tsx'), 'utf8');
const adminSimpleNavOk = adminSimpleNav.includes('FinelyOsPaginatedStack') && adminSimpleNav.includes('ADMIN_NAV_LANES');
console.log(`${adminSimpleNavOk ? '✓' : '✗'} FinelyAdminSimpleNav — lane picker + paginated modules`);
if (!adminSimpleNavOk) failed += 1;

const onboarding = fs.readFileSync(path.join(root, 'src/components/portal/index.tsx'), 'utf8');
const onboardingOk = onboarding.includes('data-fc-onboarding-shell="1"');
console.log(`${onboardingOk ? '✓' : '✗'} SovereignPortal — onboarding shell theme scope`);
if (!onboardingOk) failed += 1;

const entityShell = fs.readFileSync(path.join(root, 'src/components/layout/EntityDetailShell.tsx'), 'utf8');
const entityShellOk =
  entityShell.includes('FinelyEntityTabLaneNav') &&
  entityShell.includes('fc-entity-sticky-bar') &&
  entityShell.includes('useTabLanes');
console.log(`${entityShellOk ? '✓' : '✗'} EntityDetailShell — lane tab nav + theme-aware sticky bar`);
if (!entityShellOk) failed += 1;

const partnerDetail = fs.readFileSync(path.join(root, 'src/pages/admin/PartnerDetailPage.tsx'), 'utf8');
const partnerDetailOk =
  partnerDetail.includes('useTabLanes') &&
  partnerDetail.includes('FinelyOsPaginatedStack') &&
  !partnerDetail.includes('showAllSystemNotes');
console.log(`${partnerDetailOk ? '✓' : '✗'} PartnerDetailPage — tab lanes + paginated stacks (no show-all traps)`);
if (!partnerDetailOk) failed += 1;

const simpleNav = fs.readFileSync(path.join(root, 'src/features/os/FinelyPortalSimpleNav.tsx'), 'utf8');
const simpleNavOk = simpleNav.includes('FinelyOsPaginatedStack') && simpleNav.includes('PORTAL_NAV_LANES');
console.log(`${simpleNavOk ? '✓' : '✗'} FinelyPortalSimpleNav — lane picker + paginated destinations`);
if (!simpleNavOk) failed += 1;

const strip = fs.readFileSync(path.join(root, 'src/features/os/FinelyOsPublicCommandStrip.tsx'), 'utf8');
const stripOk = strip.includes('FinelyOsPaginatedStack') && strip.includes('showMore');
console.log(`${stripOk ? '✓' : '✗'} FinelyOsPublicCommandStrip — collapsible paginated guides`);
if (!stripOk) failed += 1;

const lightUi = fs.readFileSync(path.join(root, 'src/features/os/finelyOsLightUi.ts'), 'utf8');
const lightUiOk =
  lightUi.includes('fc-pop-surface') &&
  lightUi.includes('fc-accent-card') &&
  lightUi.includes('fc-light-chrome-strip') &&
  lightUi.includes('finelyOsLightGlassPanel') &&
  lightUi.includes('FINELY_OS_LIGHT_TOOLTIP') &&
  lightUi.includes('finelyOsLightMeshSection') &&
  lightUi.includes('fc-light-readable') &&
  lightUi.includes('finelyOsLandingContrastSection') &&
  lightUi.includes('finelyOsLandingPlatinumSection') &&
  lightUi.includes('finelyOsLeadMagnetPanel');
console.log(`${lightUiOk ? '✓' : '✗'} finelyOsLightUi — pop surfaces + mesh/contrast section helpers`);
if (!lightUiOk) failed += 1;

const glassPanel = fs.readFileSync(path.join(root, 'src/features/os/FinelyOsGlassPanel.tsx'), 'utf8');
const glassPanelOk = glassPanel.includes('finelyOsCatalogCard') && glassPanel.includes('data-fc-accent');
console.log(`${glassPanelOk ? '✓' : '✗'} FinelyOsGlassPanel — catalog card shell + accent attr`);
if (!glassPanelOk) failed += 1;

const commsHub = fs.readFileSync(path.join(root, 'src/components/chat/FinelyCommunicationHub.tsx'), 'utf8');
const commsHubOk = commsHub.includes('data-fc-comms-shell="1"');
console.log(`${commsHubOk ? '✓' : '✗'} FinelyCommunicationHub — light studio comms shell scope`);
if (!commsHubOk) failed += 1;

const letterStudio = fs.readFileSync(path.join(root, 'src/components/letters/LettersCommandCenter.tsx'), 'utf8');
const letterStudioOk = letterStudio.includes('data-fc-letter-studio="1"');
console.log(`${letterStudioOk ? '✓' : '✗'} LettersCommandCenter — light studio letter scope`);
if (!letterStudioOk) failed += 1;

const creditIntel = fs.readFileSync(path.join(root, 'src/components/creditIntel/CreditIntelTabs.tsx'), 'utf8');
const creditIntelOk = creditIntel.includes('data-fc-credit-intel="1"');
console.log(`${creditIntelOk ? '✓' : '✗'} CreditIntelTabs — light studio credit intel scope`);
if (!creditIntelOk) failed += 1;

const portalOnboarding = fs.readFileSync(path.join(root, 'src/components/portal/index.tsx'), 'utf8');
const portalHarmonyOk =
  portalOnboarding.includes('data-fc-onboarding-shell="1"') &&
  portalOnboarding.includes('fc-light-tooltip-shell') &&
  !portalOnboarding.includes('hover:-translate-y');
console.log(`${portalHarmonyOk ? '✓' : '✗'} SovereignPortal onboarding — CK harmony + light tooltips`);
if (!portalHarmonyOk) failed += 1;

const lenderLogic = fs.readFileSync(path.join(root, 'src/components/dashboard/LenderLogicEngine.tsx'), 'utf8');
const lenderLogicOk = lenderLogic.includes('finelyOsCatalogCard');
console.log(`${lenderLogicOk ? '✓' : '✗'} LenderLogicEngine — catalog card panels`);
if (!lenderLogicOk) failed += 1;

const crmForecast = fs.readFileSync(path.join(root, 'src/features/crm/components/CrmForecastPanel.tsx'), 'utf8');
const crmForecastOk = crmForecast.includes('finelyOsCatalogCard') && !crmForecast.includes('fc-panel p-4');
console.log(`${crmForecastOk ? '✓' : '✗'} CrmForecastPanel — catalog card (no fc-panel shell)`);
if (!crmForecastOk) failed += 1;

const landing = fs.readFileSync(path.join(root, 'src/components/landing/index.tsx'), 'utf8');
const landingHarmonyOk = landing.includes('hover:brightness') && !landing.includes('hover:-translate-y-2');
console.log(`${landingHarmonyOk ? '✓' : '✗'} Landing index — CK harmony hovers (no Y-lift stacks)`);
if (!landingHarmonyOk) failed += 1;

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const htmlOk = html.includes('finely.siteTheme.v1') && html.includes('data-fc-theme');
console.log(`${htmlOk ? '✓' : '✗'} index.html — theme flash guard`);
if (!htmlOk) failed += 1;

const themeAccess = fs.readFileSync(path.join(root, 'src/lib/finelyThemeAccess.ts'), 'utf8');
const themeAccessOk =
  themeAccess.includes('lightThemePublic') &&
  themeAccess.includes('canUseLightTheme') &&
  themeAccess.includes("return ['dark', 'system']");
console.log(`${themeAccessOk ? '✓' : '✗'} finelyThemeAccess — light gated until public flag or admin`);
if (!themeAccessOk) failed += 1;

const themeToggle = fs.readFileSync(path.join(root, 'src/features/os/FinelyThemeToggle.tsx'), 'utf8');
const themeToggleOk = themeToggle.includes('themeToggleOptions') && themeToggle.includes('adminPreview');
console.log(`${themeToggleOk ? '✓' : '✗'} FinelyThemeToggle — admin preview + gated options`);
if (!themeToggleOk) failed += 1;

const settings = fs.readFileSync(path.join(root, 'src/domain/settings.ts'), 'utf8');
const settingsOk = settings.includes('lightThemePublic: false');
console.log(`${settingsOk ? '✓' : '✗'} settings.ts — lightThemePublic defaults OFF`);
if (!settingsOk) failed += 1;

const adminNavLanes = fs.readFileSync(path.join(root, 'src/config/adminNavLanes.ts'), 'utf8');
const adminNavLanesOk = adminNavLanes.includes('tab=appearance');
console.log(`${adminNavLanesOk ? '✓' : '✗'} adminNavLanes — Appearance admin shortcut`);
if (!adminNavLanesOk) failed += 1;

const hero = fs.readFileSync(path.join(root, 'src/components/landing/LandingHeroOsRefreshSection.tsx'), 'utf8');
const heroOk = hero.includes('fc-band-violet') && !hero.includes('#0a0612');
console.log(`${heroOk ? '✓' : '✗'} LandingHeroOsRefreshSection — theme-aware landing band`);
if (!heroOk) failed += 1;

console.log(`\nTheme + wayfinder + portal/admin nav + entity tab checks: ${REQUIRED.length + 16}`);

if (failed) {
  console.error(`\n${failed} theme/wayfinder/portal-nav violation(s).`);
  process.exit(1);
}

console.log('\nSite theme toggle + simplified wayfinding + portal/admin simple nav wired.');
