#!/usr/bin/env node
/**
 * Launch Part D5 — senior-simple UX tokens on key surfaces.
 * Usage: npm run launch:senior:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SENIOR_SURFACES = [
  'src/pages/StartHerePage.tsx',
  'src/pages/PersonalCreditPage.tsx',
  'src/pages/FundabilityReadinessPage.tsx',
  'src/pages/ResourcesPage.tsx',
  'src/pages/affiliate/AffiliateHubPage.tsx',
  'src/pages/portal/PartnerDashboardPage.tsx',
  'src/pages/admin/AdminDashboardPage.tsx',
  'src/pages/LaunchHelpCenterPage.tsx',
  'src/components/tours/FinelyLaunchHelpStrip.tsx',
  'src/components/tours/FinelyNowDoThisStrip.tsx',
  'src/components/tours/FinelyNoticedStrip.tsx',
  'src/components/tours/FinelyTourPlayer.tsx',
];

console.log('Finely Cred — senior-simple UX audit (Part D5)\n');

let failed = 0;

const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
const cssChecks = [
  ['.fc-senior-simple', css.includes('.fc-senior-simple')],
  ['18px body font-size', /font-size:\s*18px/.test(css)],
  ['.fc-senior-tap-target', css.includes('.fc-senior-tap-target')],
  ['48px tap min-height', /min-height:\s*48px/.test(css)],
];

for (const [label, ok] of cssChecks) {
  console.log(`${ok ? '✓' : '✗'} CSS: ${label}`);
  if (!ok) failed += 1;
}

for (const rel of SENIOR_SURFACES) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.log(`✗ ${rel} (missing)`);
    failed += 1;
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');
  const ok = src.includes('fc-senior-simple') || src.includes('fc-senior-tap-target');
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const pageShell = fs.readFileSync(path.join(root, 'src/components/layout/PageShell.tsx'), 'utf8');
const pageShellSeniorOk =
  pageShell.includes('FinelyLaunchHelpStrip') &&
  pageShell.includes('data-fc-route-content') &&
  pageShell.includes('fc-senior-simple');
console.log(`${pageShellSeniorOk ? '✓' : '✗'} PageShell → fc-senior-simple on all route content`);
if (!pageShellSeniorOk) failed += 1;

const onboardingShellOk = (() => {
  const src = fs.readFileSync(path.join(root, 'src/components/portal/index.tsx'), 'utf8');
  const lines = src.split('\n').filter((l) => l.includes('data-fc-onboarding-shell'));
  return lines.length >= 3 && lines.every((l) => l.includes('fc-senior-simple'));
})();
console.log(`${onboardingShellOk ? '✓' : '✗'} Onboarding shell → fc-senior-simple (all entry surfaces)`);
if (!onboardingShellOk) failed += 1;

const dashboardSeniorOk = fs.readFileSync(path.join(root, 'src/components/dashboard/index.tsx'), 'utf8').includes('fc-senior-simple');
console.log(`${dashboardSeniorOk ? '✓' : '✗'} Mastery workspace → fc-senior-simple`);
if (!dashboardSeniorOk) failed += 1;

const helpStripOk = pageShell.includes('FinelyLaunchHelpStrip');
console.log(`${helpStripOk ? '✓' : '✗'} PageShell → FinelyLaunchHelpStrip`);
if (!helpStripOk) failed += 1;

const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const startHereOk = app.includes('/start-here') && app.includes('StartHerePage');
console.log(`${startHereOk ? '✓' : '✗'} App route /start-here`);
if (!startHereOk) failed += 1;

if (failed) {
  console.error(`\n${failed} senior UX check(s) failed.`);
  process.exit(1);
}

console.log('\nSenior-simple UX audit pass.');
