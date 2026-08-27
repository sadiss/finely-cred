/**
 * Carry Round 1 factual findings onto later rounds.
 * Educational process guidance — not legal advice. Not a second account list.
 */

import { filterFactualDisputeReasons, withBureauScreenshotLead } from '../creditReports/disputeFactualReasons';
import type { DisputeCase } from './cases';
import { DISPUTE_ROUND_ORDER, getRoundRecord, type DisputeRoundLabel } from './disputeWorkflow';

export const PRIOR_ROUND_TRANSFER_PREFIX = 'Carried forward from';

export function buildPriorRoundTransferNote(
  disputeCase: DisputeCase,
  nextRound: DisputeRoundLabel,
): string | null {
  if (nextRound === 'Round 1') return null;
  const idx = DISPUTE_ROUND_ORDER.indexOf(nextRound);
  const priorLabel = idx > 0 ? DISPUTE_ROUND_ORDER[idx - 1] : null;
  if (!priorLabel) return null;

  const prior = getRoundRecord(disputeCase, priorLabel);
  const findings: string[] = [];
  for (const item of disputeCase.items) {
    const factual = filterFactualDisputeReasons(item.reasons).map((reason) =>
      withBureauScreenshotLead(item.bureau, reason),
    );
    for (const finding of factual) {
      findings.push(`${item.account} — ${finding}`);
    }
  }

  const lines = [
    `${PRIOR_ROUND_TRANSFER_PREFIX} ${priorLabel} — factual findings from the bureau screenshot (not a new account list). Results vary · not legal advice.`,
    prior?.responseOutcome ? `Prior outcome logged: ${prior.responseOutcome.replace(/_/g, ' ')}.` : null,
    prior?.notes && !prior.notes.includes(PRIOR_ROUND_TRANSFER_PREFIX)
      ? `Prior round note: ${prior.notes}`
      : null,
    findings.length
      ? findings.slice(0, 8).join('\n')
      : 'No screenshot-backed factual findings were snapshotted on the prior round items — add “As you can see here on [bureau]…” findings before mailing.',
  ].filter(Boolean);

  return lines.join('\n');
}

export function mergeTransferNote(existing: string | undefined, transfer: string | null): string | undefined {
  if (!transfer) return existing;
  if (existing?.includes(PRIOR_ROUND_TRANSFER_PREFIX)) return existing;
  if (!existing?.trim()) return transfer;
  return `${transfer}\n\n${existing.trim()}`;
}
