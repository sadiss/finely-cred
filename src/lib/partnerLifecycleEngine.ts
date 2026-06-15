import type { PartnerJourneyStage } from '../domain/partners';
import { listEvidenceByPartner } from '../data/evidenceRepo';
import { listTasksByPartner } from '../data/tasksRepo';
import { listCasesByPartner } from '../data/casesRepo';
import { getPartner, upsertPartner } from '../data/partnersRepo';
import { onPlatformEvent } from '../domain/platformEvents';
import { emitPartnerStageChanged } from './crmLifecycleBridge';

const STAGE_ORDER: PartnerJourneyStage[] = [
  'intake',
  'report_upload',
  'analysis',
  'evidence',
  'letters',
  'mailing',
  'funding',
  'complete',
];

function stageRank(s: PartnerJourneyStage | undefined): number {
  const idx = STAGE_ORDER.indexOf(s ?? 'intake');
  return idx >= 0 ? idx : 0;
}

/** Infer journey stage from vault, tasks, and dispute cases (Phase 14). */
export function inferPartnerJourneyStage(partnerId: string, current?: PartnerJourneyStage): PartnerJourneyStage {
  const tasks = listTasksByPartner(partnerId);
  const evidence = listEvidenceByPartner(partnerId);
  const cases = listCasesByPartner(partnerId);

  const hasReport = evidence.some((e) => /report|experian|equifax|transunion|credit/i.test(`${e.filename} ${e.caption ?? ''}`));
  const hasLetter = evidence.some((e) => /letter|dispute|bureau/i.test(`${e.filename} ${e.caption ?? ''}`));
  const mailedTask = tasks.some((t) => (t.tags ?? []).some((tag) => tag.startsWith('bureau_timer')));
  const disputeActive = tasks.some((t) => t.stage === 'disputes' && t.status !== 'completed');
  const fundingTask = tasks.some((t) => t.stage === 'funding' || (t.tags ?? []).includes('funding'));
  const allCoreDone = tasks.filter((t) => t.visibility !== 'admin').every((t) => t.status === 'completed' || t.status === 'cancelled');

  let inferred: PartnerJourneyStage = 'intake';
  if (allCoreDone && tasks.length >= 3) inferred = 'complete';
  else if (fundingTask || tasks.some((t) => t.stage === 'funding')) inferred = 'funding';
  else if (mailedTask || cases.some((c) => c.rounds?.some((r) => r.mailedAt))) inferred = 'mailing';
  else if (disputeActive || tasks.some((t) => t.kind === 'mail_letter')) inferred = 'letters';
  else if (hasLetter || tasks.some((t) => t.stage === 'evidence')) inferred = 'evidence';
  else if (hasReport && tasks.some((t) => t.kind === 'review_results' && t.status === 'completed')) inferred = 'analysis';
  else if (hasReport) inferred = 'report_upload';

  if (stageRank(inferred) < stageRank(current)) return current ?? inferred;
  return inferred;
}

/** Persist partner journey stage when signals advance (never regress). */
export async function syncPartnerJourneyStage(partnerId: string, reason?: string): Promise<PartnerJourneyStage | null> {
  const partner = await getPartner(partnerId);
  if (!partner) return null;

  const next = inferPartnerJourneyStage(partnerId, partner.journeyStage);
  if (next === partner.journeyStage) return next;

  const updated = { ...partner, journeyStage: next, updatedAt: new Date().toISOString() };
  await upsertPartner(updated);
  emitPartnerStageChanged({
    partnerId,
    previousStage: partner.journeyStage,
    stage: next,
    reason: reason ?? 'lifecycle_sync',
  });
  return next;
}

let wired = false;

export function wirePartnerLifecycleEngine() {
  if (wired) return;
  wired = true;

  onPlatformEvent((event) => {
    if (!event.partnerId) return;
    if (
      event.type === 'task.completed' ||
      event.type === 'task.result_recorded' ||
      event.type === 'library.opened' ||
      (event.type === 'automation.triggered' && event.payload?.kind === 'dispute_letter_mailed')
    ) {
      void syncPartnerJourneyStage(event.partnerId, event.type);
    }
  });
}

wirePartnerLifecycleEngine();
