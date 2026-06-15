#!/usr/bin/env node
/**
 * Tier 2186 — Validation clocks UI + dispute ops triage + tour MP3 playback audit.
 * Usage: npm run validation:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'src/lib/validationLetterEngine.ts',
  'src/lib/disputeOpsSummary.ts',
  'src/lib/disputeLetterBuilder.ts',
  'src/features/debt/AdminValidationClocksPanel.tsx',
  'src/features/debt/AdminDisputeOpsPanel.tsx',
  'src/components/debt/DebtWorkflowPanel.tsx',
  'src/pages/admin/AdminWorkflowQueuePage.tsx',
  'src/pages/portal/PartnerDebtDetailPage.tsx',
  'src/components/tours/FinelyTourPlayer.tsx',
  'src/domain/tourPlayback.ts',
];

console.log('Finely Cred — validation & dispute ops audit\n');

let failed = 0;
for (const rel of REQUIRED) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const engine = fs.readFileSync(path.join(root, 'src/lib/validationLetterEngine.ts'), 'utf8');
const engineOk =
  engine.includes('listOpenValidationClocks') && engine.includes('buildValidationLetterDraft');
console.log(`${engineOk ? '✓' : '✗'} validationLetterEngine — clocks + letter drafts`);
if (!engineOk) failed += 1;

const disputeOps = fs.readFileSync(path.join(root, 'src/lib/disputeOpsSummary.ts'), 'utf8');
const disputeOpsOk =
  disputeOps.includes('listDisputeOpsAttentionRows') && disputeOps.includes('summarizeDisputeOpsForCoOwner');
console.log(`${disputeOpsOk ? '✓' : '✗'} disputeOpsSummary — admin triage rows`);
if (!disputeOpsOk) failed += 1;

const workflow = fs.readFileSync(path.join(root, 'src/pages/admin/AdminWorkflowQueuePage.tsx'), 'utf8');
const workflowOk =
  workflow.includes('AdminValidationClocksPanel') && workflow.includes('AdminDisputeOpsPanel');
console.log(`${workflowOk ? '✓' : '✗'} AdminWorkflowQueuePage — validation + dispute triage panels`);
if (!workflowOk) failed += 1;

const debtPanel = fs.readFileSync(path.join(root, 'src/components/debt/DebtWorkflowPanel.tsx'), 'utf8');
const debtPanelOk = debtPanel.includes('onOpenValidationDraft') && debtPanel.includes('Draft validation letter');
console.log(`${debtPanelOk ? '✓' : '✗'} DebtWorkflowPanel — one-click validation draft`);
if (!debtPanelOk) failed += 1;

const partnerDebt = fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDebtDetailPage.tsx'), 'utf8');
const partnerDebtOk =
  partnerDebt.includes('buildValidationLetterDraft') && partnerDebt.includes('openValidationDraftFromClock');
console.log(`${partnerDebtOk ? '✓' : '✗'} PartnerDebtDetailPage — validation draft wired`);
if (!partnerDebtOk) failed += 1;

const builder = fs.readFileSync(path.join(root, 'src/lib/disputeLetterBuilder.ts'), 'utf8');
const builderOk =
  builder.includes('buildEnrichedReasonsForCandidate') && builder.includes('filterFactualDisputeReasons');
console.log(`${builderOk ? '✓' : '✗'} disputeLetterBuilder — factual reasons only`);
if (!builderOk) failed += 1;

const tourPlayer = fs.readFileSync(path.join(root, 'src/components/tours/FinelyTourPlayer.tsx'), 'utf8');
const tourOk =
  tourPlayer.includes('getTourStepNarrationMp3Url') &&
  (tourPlayer.includes('Play MP3') || tourPlayer.includes('Read aloud'));
console.log(`${tourOk ? '✓' : '✗'} FinelyTourPlayer — step MP3 + read-aloud playback`);
if (!tourOk) failed += 1;

const playback = fs.readFileSync(path.join(root, 'src/domain/tourPlayback.ts'), 'utf8');
const playbackOk = playback.includes('getTourStepNarrationMp3Url');
console.log(`${playbackOk ? '✓' : '✗'} tourPlayback — step MP3 URL helper`);
if (!playbackOk) failed += 1;

if (failed) {
  console.error(`\n${failed} validation/dispute violation(s).`);
  process.exit(1);
}

console.log('\nValidation & dispute ops audit pass.');
