#!/usr/bin/env node
/**
 * Tier 2226 — Go-live command center + voice concierge wave 58 audit.
 * Usage: npm run go-live:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/goLiveCommandOps.ts',
  'src/features/admin/AdminGoLiveCommandPanel.tsx',
  'src/pages/LaunchHelpCenterPage.tsx',
  'src/pages/admin/AdminMonitoringPage.tsx',
  'src/components/chat/HubAiCoachPanel.tsx',
  'src/components/tours/FinelyTourPlayer.tsx',
];

console.log('Finely Cred — go-live command center audit\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const ops = fs.readFileSync(path.join(root, 'src/lib/goLiveCommandOps.ts'), 'utf8');
const opsOk = ops.includes('getGoLivePillars') && ops.includes('summarizeGoLiveForCoOwner');
console.log(`${opsOk ? '✓' : '✗'} goLiveCommandOps — pillars + Sage summary`);
if (!opsOk) failed += 1;

const panel = fs.readFileSync(path.join(root, 'src/features/admin/AdminGoLiveCommandPanel.tsx'), 'utf8');
const panelOk = panel.includes('AdminGoLiveCommandPanel') && panel.includes('launch:ops');
console.log(`${panelOk ? '✓' : '✗'} AdminGoLiveCommandPanel — command center UI`);
if (!panelOk) failed += 1;

const launch = fs.readFileSync(path.join(root, 'src/pages/LaunchHelpCenterPage.tsx'), 'utf8');
const launchOk = launch.includes('AdminGoLiveCommandPanel');
console.log(`${launchOk ? '✓' : '✗'} LaunchHelpCenterPage — admin go-live panel`);
if (!launchOk) failed += 1;

const coach = fs.readFileSync(path.join(root, 'src/components/chat/HubAiCoachPanel.tsx'), 'utf8');
const coachOk = coach.includes('useFinelyVoiceInput') && coach.includes('speakFinelyText');
console.log(`${coachOk ? '✓' : '✗'} HubAiCoachPanel — mic + read aloud`);
if (!coachOk) failed += 1;

const tour = fs.readFileSync(path.join(root, 'src/components/tours/FinelyTourPlayer.tsx'), 'utf8');
const tourOk = tour.includes('speakFinelyText') && tour.includes('Read aloud');
console.log(`${tourOk ? '✓' : '✗'} FinelyTourPlayer — browser read-aloud fallback`);
if (!tourOk) failed += 1;

if (failed) {
  console.error(`\n${failed} go-live command violation(s).`);
  process.exit(1);
}

console.log('\nGo-live command center audit pass.');
