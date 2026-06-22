import type { DisputeCandidate, ParsedCreditReport } from '../domain/creditReports';
import type { DisputeReasonSuggestion } from '../domain/disputeReasons';
import type { EvidenceItem } from '../domain/evidence';
import {
  deriveTradelineContradictions,
  suggestDisputeReasons,
} from '../creditReports/disputeReasons';
import {
  filterFactualDisputeReasons,
  pickBestDisputeReasons,
  resolveDisputeAccountLabel,
} from '../creditReports/disputeFactualReasons';
import { evidenceMatchesAccount } from '../utils/evidenceMatch';
import { MAX_DISPUTE_REASONS } from '../letters/disputeLetterFormat';
import { classifyCandidateNegativeType, NEGATIVE_PLAYBOOKS } from '../creditReports/negativePlaybooks';

function norm(s: string) {
  return String(s || '').toLowerCase();
}

function findTradeline(parsed: ParsedCreditReport | undefined, account: string) {
  if (!parsed?.tradelines?.length) return null;
  const needle = norm(account);
  return (
    parsed.tradelines.find(
      (t) => norm(t.creditorName) === needle || norm(t.creditorName).includes(needle) || needle.includes(norm(t.creditorName)),
    ) ?? null
  );
}

/**
 * Factual dispute findings only — one clear fact per reason, tied to the account screenshot when present.
 */
export function buildEnrichedReasonsForCandidate(args: {
  candidate: DisputeCandidate;
  parsed?: ParsedCreditReport | null;
  existing?: string[];
  evidence?: EvidenceItem | null;
  maxReasons?: number;
}): string[] {
  const max = args.maxReasons ?? MAX_DISPUTE_REASONS;
  const existing = filterFactualDisputeReasons((args.existing ?? []).map((x) => x.trim()).filter(Boolean));
  const seen = new Set(existing.map((x) => norm(x)));
  const out = [...existing];

  const push = (text: string) => {
    const t = text.trim();
    if (!t || filterFactualDisputeReasons([t]).length === 0 || seen.has(norm(t))) return;
    seen.add(norm(t));
    out.push(t);
  };

  const accountLabel = resolveDisputeAccountLabel({
    candidate: args.candidate,
    evidenceCreditorName: args.evidence?.creditorName,
  });
  const tl = args.parsed ? findTradeline(args.parsed, args.candidate.account) : null;

  if (args.evidence && !evidenceMatchesAccount({
    accountName: args.candidate.account,
    candidateType: args.candidate.type,
    evidence: args.evidence,
  })) {
    return pickBestDisputeReasons(existing, max);
  }

  for (const c of (tl ? deriveTradelineContradictions(tl as any, args.candidate.bureau) : [])) {
    push(c.text.replace(new RegExp(args.candidate.account.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), accountLabel));
  }

  if (args.parsed) {
    for (const c of suggestDisputeReasons(args.parsed, args.candidate)) {
      if (c.id.startsWith('xb_') || c.id.startsWith('sec_') || c.id.startsWith('contradiction_') || c.id.startsWith('intra_')) {
        push(c.text.replace(new RegExp(args.candidate.account.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), accountLabel));
      }
    }
  }

  return pickBestDisputeReasons(out, max);
}

function factualSuggestionId(text: string, index: number): string {
  const slug = norm(text).replace(/[^a-z0-9]+/g, '_').slice(0, 36);
  return `factual_${index}_${slug || 'line'}`;
}

/** Factual suggestions for persistence/UI — no procedural library leakage. */
export function buildFactualDisputeSuggestions(args: {
  candidate: DisputeCandidate;
  parsed?: ParsedCreditReport | null;
  existing?: string[];
  evidence?: EvidenceItem | null;
  maxReasons?: number;
}): DisputeReasonSuggestion[] {
  return buildEnrichedReasonsForCandidate(args).map((text, i) => ({
    id: factualSuggestionId(text, i),
    text,
  }));
}

function toFactualFinding(text: string): string {
  let t = text.trim();
  t = t.replace(/\s*;?\s*please (verify|correct|delete)[^.]*\.?$/i, '.');
  t = t.replace(/\s*please correct the reporting or delete if unverifiable\.?$/i, '.');
  t = t.replace(/\s*or delete the item if it cannot be verified\.?$/i, '.');
  if (t && !t.endsWith('.')) t += '.';
  return filterFactualDisputeReasons([t])[0] ?? '';
}

export function buildCaseContextBlock(args: {
  candidate: DisputeCandidate;
  parsed?: ParsedCreditReport | null;
  bureau: import('../domain/creditReports').Bureau;
  round: string;
  reasons: string[];
}): string {
  const negativeType = classifyCandidateNegativeType(args.candidate);
  const playbook = NEGATIVE_PLAYBOOKS[negativeType] ?? NEGATIVE_PLAYBOOKS.unknown;
  const tl = args.parsed ? findTradeline(args.parsed, args.candidate.account) : null;
  const contradictions = tl ? deriveTradelineContradictions(tl as any, args.candidate.bureau).map((r) => r.text) : [];
  const factual = filterFactualDisputeReasons(args.reasons);
  return [
    `BUREAU: ${args.bureau}`,
    `ROUND: ${args.round}`,
    `ACCOUNT: ${args.candidate.account}`,
    `NEGATIVE_TYPE: ${negativeType}`,
    `PLAYBOOK: ${playbook.aiHint}`,
    `CONTRADICTIONS: ${contradictions.length ? contradictions.join(' | ') : 'none detected'}`,
    `FACTUAL_FINDINGS (${factual.length}): ${factual.join(' // ')}`,
  ].join('\n');
}
