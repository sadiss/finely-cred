/**
 * Admin triage — open dispute cases needing follow-up (Round windows + stale drafts).
 */

import { listCases } from '../data/casesRepo';
import { getReport } from '../data/reportsRepo';
import type { DisputeCase } from '../domain/cases';
import { INTER_ROUND_GUIDANCE, type DisputeRoundLabel } from '../domain/disputeWorkflow';
import type { DisputeRoundStatus } from '../domain/disputeWorkflow';
import type { ResponseOutcome } from '../domain/disputeRoundResponsePlaybook';
import {
  resolveDisputeCaseReportPair,
  suggestDisputeOutcomeFromReports,
  type TradelineDiffEntry,
} from '../domain/tradelineDiff';

export type DisputeOpsAttentionRow = {
  caseId: string;
  partnerId: string;
  title: string;
  bureau: string;
  round: DisputeRoundLabel;
  status: DisputeRoundStatus;
  daysInState: number;
  tone: 'blocking' | 'warning' | 'watch';
  hint: string;
};

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function listDisputeOpsAttentionRows(): DisputeOpsAttentionRow[] {
  const rows: DisputeOpsAttentionRow[] = [];

  for (const c of listCases()) {
    if (c.status !== 'open') continue;
    const latest = c.rounds[c.rounds.length - 1];
    if (!latest) continue;

    const status = latest.status ?? 'draft';
    const windowDays = INTER_ROUND_GUIDANCE[latest.round].typicalWindowDays;

    if ((status === 'mailed' || status === 'awaiting_response') && latest.mailedAt) {
      const days = daysSince(latest.mailedAt);
      const overdue = days > windowDays;
      rows.push({
        caseId: c.id,
        partnerId: c.partnerId,
        title: c.title,
        bureau: c.bureau,
        round: latest.round,
        status,
        daysInState: days,
        tone: overdue ? 'blocking' : days >= windowDays - 7 ? 'warning' : 'watch',
        hint: overdue
          ? `Past ${windowDays}-day bureau window — prep next round or escalation`
          : `${windowDays - days} day(s) left in typical bureau window`,
      });
      continue;
    }

    if (status === 'letter_generated' || status === 'draft') {
      const days = daysSince(latest.createdAt);
      if (days < 3) continue;
      rows.push({
        caseId: c.id,
        partnerId: c.partnerId,
        title: c.title,
        bureau: c.bureau,
        round: latest.round,
        status,
        daysInState: days,
        tone: days >= 14 ? 'blocking' : days >= 7 ? 'warning' : 'watch',
        hint: status === 'draft' ? 'Draft not mailed — nudge partner to send' : 'Letter saved but not marked mailed',
      });
    }
  }

  return rows.sort((a, b) => {
    const toneRank = { blocking: 0, warning: 1, watch: 2 };
    const d = toneRank[a.tone] - toneRank[b.tone];
    if (d !== 0) return d;
    return b.daysInState - a.daysInState;
  });
}

export type DisputeResponseOutcomeSuggestion = {
  outcome: ResponseOutcome;
  hint: string;
  beforeReportId: string;
  afterReportId: string;
  diffs: TradelineDiffEntry[];
};

export function suggestResponseOutcomeForDisputeCase(
  disputeCase: DisputeCase,
): DisputeResponseOutcomeSuggestion | null {
  const reportPair = resolveDisputeCaseReportPair(disputeCase);
  if (!reportPair) return null;

  const beforeReport = getReport(reportPair.beforeReportId);
  const afterReport = getReport(reportPair.afterReportId);
  const beforeTradelines = beforeReport?.parsed?.tradelines;
  const afterTradelines = afterReport?.parsed?.tradelines;
  if (!beforeTradelines?.length || !afterTradelines?.length) return null;

  const suggestion = suggestDisputeOutcomeFromReports({
    before: beforeTradelines,
    after: afterTradelines,
    disputedAccounts: disputeCase.items.map((item) => item.account),
  });
  if (!suggestion) return null;

  return {
    outcome: suggestion.outcome,
    hint: suggestion.hint,
    beforeReportId: reportPair.beforeReportId,
    afterReportId: reportPair.afterReportId,
    diffs: suggestion.diffs,
  };
}

export function summarizeDisputeOpsForCoOwner(): string {
  const rows = listDisputeOpsAttentionRows();
  if (!rows.length) {
    return 'No dispute cases need admin follow-up right now.';
  }
  const lines = rows.slice(0, 12).map((r) => {
    const tag = r.tone === 'blocking' ? 'OVERDUE' : r.tone === 'warning' ? 'URGENT' : 'WATCH';
    return `- [${tag}] ${r.title} (${r.bureau} · ${r.round}) · ${r.hint} · partner ${r.partnerId}`;
  });
  return [`Dispute ops queue (${rows.length}):`, ...lines].join('\n');
}
