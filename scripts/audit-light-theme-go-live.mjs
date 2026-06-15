#!/usr/bin/env node
/**
 * Tier 2246 — Light theme go-live readiness (wave 59).
 * Usage: npm run theme:go-live:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/lightThemeGoLiveOps.ts',
  'src/features/os/LightThemeGoLivePanel.tsx',
  'src/features/os/FinelyAdminAppearancePanel.tsx',
  'src/lib/finelyThemeAccess.ts',
  'src/domain/settings.ts',
];

console.log('Finely Cred — light theme go-live audit\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const ops = fs.readFileSync(path.join(root, 'src/lib/lightThemeGoLiveOps.ts'), 'utf8');
const opsOk =
  ops.includes('LIGHT_THEME_PRIORITY_ROUTES') && ops.includes('summarizeLightThemeGoLiveForCoOwner');
console.log(`${opsOk ? '✓' : '✗'} lightThemeGoLiveOps — priority routes + Sage summary`);
if (!opsOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/os/LightThemeGoLivePanel.tsx'), 'utf8');
const panelOk = panel.includes('LightThemeGoLivePanel') && panel.includes('theme:audit');
console.log(`${panelOk ? '✓' : '✗'} LightThemeGoLivePanel — spot-check UI`);
if (!panelOk) failed += 1;

const appearance = fs.readFileSync(path.join(root, 'src/features/os/FinelyAdminAppearancePanel.tsx'), 'utf8');
const appearanceOk = appearance.includes('LightThemeGoLivePanel');
console.log(`${appearanceOk ? '✓' : '✗'} FinelyAdminAppearancePanel — go-live checklist embedded`);
if (!appearanceOk) failed += 1;

const settings = fs.readFileSync(path.join(root, 'src/domain/settings.ts'), 'utf8');
const settingsOk = settings.includes('lightThemePublic: false');
console.log(`${settingsOk ? '✓' : '✗'} settings — lightThemePublic defaults OFF`);
if (!settingsOk) failed += 1;

const access = fs.readFileSync(path.join(root, 'src/pages/admin/AdminAccessCenterPage.tsx'), 'utf8');
const accessOk = access.includes('/admin/launch-os#go-live');
console.log(`${accessOk ? '✓' : '✗'} AdminAccessCenterPage — go-live center shortcut`);
if (!accessOk) failed += 1;

const dash = fs.readFileSync(path.join(root, 'src/pages/admin/AdminDashboardPage.tsx'), 'utf8');
const dashOk = dash.includes('goLiveBlocked') && dash.includes('/admin/launch-os#go-live');
console.log(`${dashOk ? '✓' : '✗'} AdminDashboardPage — go-live noticed + hub action`);
if (!dashOk) failed += 1;

if (failed) {
  console.error(`\n${failed} light theme go-live violation(s).`);
  process.exit(1);
}

console.log('\nLight theme go-live audit pass.');
