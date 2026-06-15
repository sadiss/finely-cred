/**
 * Admin triage — open dispute cases needing follow-up (Round windows + stale drafts).
 */

import { listCases } from '../data/casesRepo';
import { INTER_ROUND_GUIDANCE, type DisputeRoundLabel } from '../domain/disputeWorkflow';
import type { DisputeRoundStatus } from '../domain/disputeWorkflow';

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

    if (status === 'awaiting_response' && latest.mailedAt) {
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
