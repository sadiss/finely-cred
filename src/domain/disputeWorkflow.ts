import type { DisputeCase, DisputeCaseRound } from './cases';

export type DisputeRoundLabel = 'Round 1' | 'Round 2' | 'Round 3';

export type DisputeRoundStatus =
  | 'draft'
  | 'letter_generated'
  | 'mailed'
  | 'awaiting_response'
  | 'response_received'
  | 'escalated'
  | 'ready_for_next_round';

export type InterRoundActionType =
  | 'bureau_letter'
  | 'furnisher_direct'
  | 'cfpb'
  | 'ag'
  | 'ftc'
  | 'bbb'
  | 'internal_escalation'
  | 'support_thread'
  | 'bureau_response'
  | 'note';

export type DisputeCaseAction = {
  id: string;
  caseId: string;
  partnerId: string;
  round?: DisputeRoundLabel;
  type: InterRoundActionType;
  title: string;
  body?: string;
  href?: string;
  createdAt: string;
  createdBy: 'partner' | 'admin' | 'system';
  meta?: Record<string, unknown>;
};

export const DISPUTE_ROUND_ORDER: DisputeRoundLabel[] = ['Round 1', 'Round 2', 'Round 3'];

export const ROUND_STATUS_LABELS: Record<DisputeRoundStatus, string> = {
  draft: 'Draft',
  letter_generated: 'Letter saved',
  mailed: 'Mailed / sent',
  awaiting_response: 'Awaiting bureau response',
  response_received: 'Response received',
  escalated: 'Escalated',
  ready_for_next_round: 'Ready for next round',
};

export const INTER_ROUND_GUIDANCE: Record<
  DisputeRoundLabel,
  { title: string; betweenRounds: string[]; typicalWindowDays: number }
> = {
  'Round 1': {
    title: 'Initial bureau dispute',
    typicalWindowDays: 30,
    betweenRounds: [
      'Mail or upload proof of sending',
      'Wait for bureau investigation (typically ~30 days)',
      'If verified unchanged → prepare Round 2 with new angle or evidence',
      'If deleted or updated → close item or monitor re-insertion',
    ],
  },
  'Round 2': {
    title: 'Follow-up dispute',
    typicalWindowDays: 30,
    betweenRounds: [
      'Reference Round 1 dates and prior letter ID',
      'Add furnisher-direct letter if bureau stalls',
      'Consider CFPB/AG complaint if pattern of non-compliance',
      'Upload bureau response screenshots to evidence vault',
    ],
  },
  'Round 3': {
    title: 'Final bureau push + escalation path',
    typicalWindowDays: 30,
    betweenRounds: [
      'Strongest evidence + procedural violations if applicable',
      'Regulatory complaint (CFPB/AG) often filed between Round 2–3',
      'Document all contacts in this case timeline',
      'Specialist/admin review before closing case',
    ],
  },
};

export function getLatestCaseRound(c: DisputeCase): DisputeCaseRound | null {
  if (!c.rounds?.length) return null;
  return c.rounds.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export function getRoundRecord(c: DisputeCase, label: DisputeRoundLabel): DisputeCaseRound | null {
  const matches = c.rounds.filter((r) => r.round === label);
  if (!matches.length) return null;
  return matches.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export function inferRoundStatus(r: DisputeCaseRound): DisputeRoundStatus {
  if (r.status) return r.status;
  if (r.responseReceivedAt) return 'response_received';
  if (r.mailedAt) return 'awaiting_response';
  if (r.letterId) return 'letter_generated';
  return 'draft';
}

export function suggestNextRound(c: DisputeCase): DisputeRoundLabel {
  const latest = getLatestCaseRound(c);
  if (!latest) return 'Round 1';
  const status = inferRoundStatus(latest);
  const idx = DISPUTE_ROUND_ORDER.indexOf(latest.round);
  const duePassed = latest.dueAt ? new Date(latest.dueAt).getTime() < Date.now() : false;

  if (status === 'response_received' || status === 'ready_for_next_round') {
    return DISPUTE_ROUND_ORDER[Math.min(idx + 1, DISPUTE_ROUND_ORDER.length - 1)]!;
  }
  if ((status === 'mailed' || status === 'awaiting_response') && duePassed && idx < DISPUTE_ROUND_ORDER.length - 1) {
    return DISPUTE_ROUND_ORDER[idx + 1]!;
  }
  return latest.round;
}

export function roundPipelineState(c: DisputeCase): Array<{
  round: DisputeRoundLabel;
  record: DisputeCaseRound | null;
  status: DisputeRoundStatus;
  isCurrent: boolean;
  isSuggestedNext: boolean;
}> {
  const suggested = suggestNextRound(c);
  const latest = getLatestCaseRound(c);
  return DISPUTE_ROUND_ORDER.map((round) => {
    const record = getRoundRecord(c, round);
    const status = record ? inferRoundStatus(record) : 'draft';
    return {
      round,
      record,
      status,
      isCurrent: latest?.round === round,
      isSuggestedNext: suggested === round && (!record || status === 'response_received' || status === 'ready_for_next_round'),
    };
  });
}

export function isRoundDueSoon(r: DisputeCaseRound | null, withinDays = 7): boolean {
  if (!r?.dueAt) return false;
  const due = new Date(r.dueAt).getTime();
  const now = Date.now();
  const windowMs = withinDays * 86400000;
  return due >= now && due - now <= windowMs;
}

export function isRoundOverdue(r: DisputeCaseRound | null): boolean {
  if (!r?.dueAt) return false;
  return new Date(r.dueAt).getTime() < Date.now();
}
