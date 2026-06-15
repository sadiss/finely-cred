import type { LetterRecord, DisputeLetterMeta } from '../domain/letters';
import type { DisputeRoundLabel } from '../domain/disputeWorkflow';
import { addDaysIso, nowIso } from '../domain/cases';
import { listCasesByPartner, markCaseRoundMailed } from '../data/casesRepo';
import { createTask, listTasksByPartner } from '../data/tasksRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { INTER_ROUND_GUIDANCE } from '../domain/disputeWorkflow';

const BUREAU_RESPONSE_DAYS = 35;

function roundFromLetter(meta?: DisputeLetterMeta): DisputeRoundLabel {
  const r = String(meta?.round ?? 'Round 1');
  if (r === 'Round 2' || r === 'Round 3') return r;
  return 'Round 1';
}

function findCaseForLetter(partnerId: string, letterId: string) {
  return (
    listCasesByPartner(partnerId).find((c) => c.rounds?.some((r) => r.letterId === letterId)) ?? null
  );
}

/** Central hook when a dispute letter is mailed — tasks, case round, platform events. */
export function onDisputeLetterMailed(args: {
  letter: LetterRecord;
  actor?: 'partner' | 'admin';
}): { taskCreated: boolean; caseUpdated: boolean } {
  const { letter } = args;
  const mailedAt = letter.mailing?.createdAt ?? nowIso();
  const meta = letter.meta as DisputeLetterMeta | undefined;
  const round = roundFromLetter(meta);
  const windowDays = INTER_ROUND_GUIDANCE[round]?.typicalWindowDays ?? 30;

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    partnerId: letter.partnerId,
    entityType: 'letter',
    entityId: letter.id,
    payload: {
      kind: 'dispute_letter_mailed',
      round,
      bureau: meta?.bureau,
      title: letter.title,
      mailedAt,
    },
  });

  let caseUpdated = false;
  const linkedCase = findCaseForLetter(letter.partnerId, letter.id);
  if (linkedCase) {
    markCaseRoundMailed({
      caseId: linkedCase.id,
      round,
      mailedAt,
      createdBy: args.actor ?? 'partner',
    });
    caseUpdated = true;
  }

  const existingTask = listTasksByPartner(letter.partnerId).find(
    (t) => t.relatedLetterId === letter.id && t.status !== 'completed' && t.status !== 'cancelled',
  );

  if (!existingTask) {
    createTask({
      partnerId: letter.partnerId,
      title: `Bureau response follow-up: "${letter.title}" (${round})`,
      kind: 'follow_up',
      status: 'pending',
      stage: 'disputes',
      dueAt: addDaysIso(mailedAt, BUREAU_RESPONSE_DAYS),
      relatedLetterId: letter.id,
      notes: `Letter mailed ${new Date(mailedAt).toLocaleDateString()}. Typical bureau window ~${windowDays} days (track through day ${BUREAU_RESPONSE_DAYS}). Upload bureau reply to Documents Vault when received.`,
      assignedTo: 'partner',
      tags: ['bureau_timer', round.toLowerCase().replace(/\s+/g, '_')],
    });
    return { taskCreated: true, caseUpdated };
  }

  return { taskCreated: false, caseUpdated };
}
