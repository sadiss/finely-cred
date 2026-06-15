#!/usr/bin/env node
/**
 * Finely Intelligence OS audit (Launch Part E9).
 * Verifies the unified intelligence layer is present and wired:
 *  - FinelyKnowledgeIndex (unified RAG) exists
 *  - FinelyBrain orchestrator exists and routes personas
 *  - Contextual help strip mounted on PageShell (Ask Finely / Watch how)
 *  - Proactive strips (Now do this + Finely noticed) exist and are wired
 *  - Intelligence launch gate registered
 * Usage: npm run intel:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  const abs = path.join(root, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
}

/** [label, file, substring-that-must-be-present | null to only assert existence] */
const CHECKS = [
  ['Unified knowledge index', 'src/lib/finelyKnowledgeIndex.ts', 'searchFinelyKnowledge'],
  ['Index aggregates SOPs', 'src/lib/finelyKnowledgeIndex.ts', 'PLATFORM_SOP_LIBRARY'],
  ['Index aggregates tours', 'src/lib/finelyKnowledgeIndex.ts', 'TOUR_MANIFEST'],
  ['Index aggregates KB corpus', 'src/lib/finelyKnowledgeIndex.ts', 'getKnowledgeCorpus'],
  ['Brain orchestrator', 'src/lib/finelyBrain/finelyBrainOrchestrate.ts', 'finelyBrainOrchestrate'],
  ['Brain uses unified index', 'src/lib/finelyBrain/finelyBrainOrchestrate.ts', 'searchFinelyKnowledge'],
  ['Brain persona routing', 'src/lib/finelyBrain/finelyBrainOrchestrate.ts', 'pickPersonaForRoute'],
  ['Help strip (Ask Finely / Watch how)', 'src/components/tours/FinelyLaunchHelpStrip.tsx', 'finelyBrainOrchestrate'],
  ['Help strip mounted on PageShell', 'src/components/layout/PageShell.tsx', 'FinelyLaunchHelpStrip'],
  ['Voice input hook', 'src/hooks/useFinelyVoiceInput.ts', 'useFinelyVoiceInput'],
  ['Ask Finely voice mic', 'src/components/tours/FinelyLaunchHelpStrip.tsx', 'useFinelyVoiceInput'],
  ['AI action audit log', 'src/data/aiActionAuditLog.ts', 'appendAiActionAudit'],
  ['Hands-free audit panel', 'src/pages/admin/AdminHandsFreeOpsPage.tsx', 'listAiActionAudit'],
  ['Knowledge index module playbooks', 'src/lib/finelyKnowledgeIndex.ts', 'MODULE_PLAYBOOKS'],
  ['Resources tour library', 'src/pages/ResourcesPage.tsx', 'TOUR_MANIFEST'],
  ['Now-do-this strip', 'src/components/tours/FinelyNowDoThisStrip.tsx', 'FinelyNowDoThisStrip'],
  ['Finely-noticed strip', 'src/components/tours/FinelyNoticedStrip.tsx', 'FinelyNoticedStrip'],
  ['Proactive signals', 'src/lib/finelyProactiveSignals.ts', 'buildPortalNoticedItems'],
  ['Noticed strip wired to dashboard', 'src/pages/portal/PartnerDashboardPage.tsx', 'FinelyNoticedStrip'],
  ['Now-do-this wired to a task page', 'src/pages/portal/PartnerReportsPage.tsx', 'FinelyNowDoThisStrip'],
  ['Intelligence launch gate', 'src/lib/launchChecklistSnapshot.ts', 'finely_intelligence_wave57'],
  ['Tour player', 'src/components/tours/FinelyTourPlayer.tsx', 'FinelyTourPlayer'],
];

console.log('Finely Cred — intelligence surfaces audit\n');

let failed = 0;
for (const [label, rel, needle] of CHECKS) {
  const src = read(rel);
  if (src == null) {
    console.log(`✗ ${label} — ${rel} (missing)`);
    failed += 1;
    continue;
  }
  const ok = needle == null || src.includes(needle);
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) failed += 1;
}

console.log(`\nIntelligence checks: ${CHECKS.length}`);

if (failed) {
  console.error(`\n${failed} intelligence surface(s) missing or unwired.`);
  process.exit(1);
}

console.log('\nFinely Intelligence OS surfaces present and wired.');
