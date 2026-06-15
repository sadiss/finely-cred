import type { ParsedCreditReport } from '../domain/creditReports';
import type { LetterRecord } from '../domain/letters';
import type { EvidenceItem } from '../domain/evidence';
import type { CreditScoreSnapshot } from '../domain/creditScoreSnapshots';
import { computeCreditIntelReadiness, rankDisputeCandidates } from '../creditReports/creditIntelInsights';
import { deriveDisputeCandidates } from '../creditReports/disputeCandidates';
import { computeBureauFollowUpAlert } from './bureauFollowUpAlert';
import { createTask } from '../data/tasksRepo';
import { emitPlatformEvent } from '../domain/platformEvents';

export type DisputeNextSuggestion = {
  candidateId: string;
  account: string;
  type: string;
  severity: number;
  reason: string;
};

export type CreditIntelDashboardModel = {
  readiness: ReturnType<typeof computeCreditIntelReadiness>;
  scoreTrend: Array<{ at: string; score: number; bureau?: string }>;
  bureauAlert: ReturnType<typeof computeBureauFollowUpAlert>;
  nextDisputes: DisputeNextSuggestion[];
  headlineScore?: number;
};

export function buildCreditIntelDashboard(args: {
  parsed: ParsedCreditReport | null;
  snapshots: CreditScoreSnapshot[];
  evidence: EvidenceItem[];
  letters: LetterRecord[];
}): CreditIntelDashboardModel | null {
  if (!args.parsed) return null;

  const candidates = deriveDisputeCandidates(args.parsed);
  const ranked = rankDisputeCandidates({ parsed: args.parsed, candidates });

  const evidenceByAccount = new Map<string, number>();
  for (const e of args.evidence) {
    const key = (e.creditorName ?? e.caption ?? '').toLowerCase();
    if (key) evidenceByAccount.set(key, (evidenceByAccount.get(key) ?? 0) + 1);
  }

  let covered = 0;
  for (const c of ranked) {
    const acct = c.account.toLowerCase();
    if ([...evidenceByAccount.keys()].some((k) => acct.includes(k) || k.includes(acct))) covered += 1;
  }

  const readiness = computeCreditIntelReadiness({
    parsed: args.parsed,
    rankedCandidates: ranked,
    evidenceCoverage: { covered, total: ranked.length },
  });

  const nextDisputes: DisputeNextSuggestion[] = ranked
    .filter((c) => {
      const acct = c.account.toLowerCase();
      return ![...evidenceByAccount.keys()].some((k) => acct.includes(k) || k.includes(acct));
    })
    .slice(0, 5)
    .map((c) => ({
      candidateId: c.id,
      account: c.account,
      type: c.type,
      severity: c.severity,
      reason: c.insight.whyTop[0] ?? 'High-impact negative item',
    }));

  const scoreTrend = args.snapshots
    .filter((s) => s.headlineScore != null)
    .slice(0, 12)
    .reverse()
    .map((s) => ({
      at: s.capturedAt,
      score: s.headlineScore!,
      bureau: s.headlineBureau,
    }));

  const latest = args.snapshots[0];

  return {
    readiness,
    scoreTrend,
    bureauAlert: computeBureauFollowUpAlert(args.letters),
    nextDisputes,
    headlineScore: latest?.headlineScore,
  };
}

/** Spawn Work OS task for top suggested dispute (idempotent per candidate). */
export function spawnDisputeTaskFromSuggestion(args: {
  partnerId: string;
  suggestion: DisputeNextSuggestion;
  existingTaskTitles: string[];
}): boolean {
  const title = `Dispute: ${args.suggestion.account} (${args.suggestion.type})`;
  if (args.existingTaskTitles.some((t) => t.includes(args.suggestion.account))) return false;
  createTask({
    partnerId: args.partnerId,
    title,
    kind: 'mail_letter',
    stage: 'disputes',
    status: 'pending',
    priority: args.suggestion.severity >= 80 ? 'high' : 'normal',
    notes: args.suggestion.reason,
    tags: ['ai_suggested', `severity_${args.suggestion.severity}`],
    assignedTo: 'partner',
  });
  emitPlatformEvent({
    type: 'task.created',
    tenantId: 'finely_cred',
    partnerId: args.partnerId,
    payload: { title, kind: 'mail_letter', source: 'credit_intel_suggestion' },
  });
  return true;
}
