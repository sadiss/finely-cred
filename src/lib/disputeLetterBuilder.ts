import type { Bureau, DisputeCandidate, ParsedCreditReport } from '../domain/creditReports';
import type { DisputeReasonSuggestion } from '../domain/disputeReasons';
import {
  deriveTradelineContradictions,
  suggestDisputeReasons,
  suggestDisputeReasonsForCandidate,
} from '../creditReports/disputeReasons';
import {
  buildFactualNegativeSummary,
  filterFactualDisputeReasons,
  pickBestDisputeReasons,
} from '../creditReports/disputeFactualReasons';
import { classifyCandidateNegativeType, NEGATIVE_PLAYBOOKS } from '../creditReports/negativePlaybooks';

function norm(s: string) {
  return String(s || '').toLowerCase();
}

function findTradeline(parsed: ParsedCreditReport | undefined, account: string) {
  if (!parsed?.tradelines?.length) return null;
  const needle = norm(account);
  return (
    parsed.tradelines.find(
      (t) => norm(t.creditorName).includes(needle) || needle.includes(norm(t.creditorName)),
    ) ?? null
  );
}

/**
 * Factual dispute findings only — what is reporting on the file and internal contradictions.
 * Excludes statute commands, "please verify/delete", legacy procedural snippets, and playbook demands.
 */
export function buildEnrichedReasonsForCandidate(args: {
  candidate: DisputeCandidate;
  parsed?: ParsedCreditReport | null;
  existing?: string[];
  maxReasons?: number;
}): string[] {
  const max = args.maxReasons ?? 12;
  const existing = filterFactualDisputeReasons((args.existing ?? []).map((x) => x.trim()).filter(Boolean));
  const seen = new Set(existing.map((x) => norm(x)));
  const out = [...existing];

  const push = (text: string) => {
    const t = text.trim();
    if (!t || filterFactualDisputeReasons([t]).length === 0 || seen.has(norm(t))) return;
    seen.add(norm(t));
    out.push(t);
  };

  const tl = args.parsed ? findTradeline(args.parsed, args.candidate.account) : null;

  for (const line of buildFactualNegativeSummary({ candidate: args.candidate, tradeline: tl })) {
    push(line);
  }

  for (const c of deriveTradelineContradictions(tl as any, args.candidate.bureau)) {
    push(toFactualFinding(c.text));
  }

  if (args.parsed) {
    for (const c of suggestDisputeReasons(args.parsed, args.candidate)) {
      if (c.id.startsWith('xb_') || c.id.startsWith('sec_') || c.id.startsWith('contradiction_') || c.id.startsWith('intra_')) {
        push(toFactualFinding(c.text));
      }
    }
  }

  for (const c of suggestDisputeReasonsForCandidate(args.candidate)) {
    if (c.id.startsWith('factual_')) push(c.text);
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
  t = t.replace(/\s*; please verify and correct this, or delete the item if it cannot be verified\.?$/i, '.');
  if (t && !t.endsWith('.')) t += '.';
  return filterFactualDisputeReasons([t])[0] ?? '';
}

export function buildCaseContextBlock(args: {
  candidate: DisputeCandidate;
  parsed?: ParsedCreditReport | null;
  bureau: Bureau;
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
