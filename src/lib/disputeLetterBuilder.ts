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
import { MAX_DISPUTE_REASONS, MIN_DISPUTE_REASONS } from '../letters/disputeLetterFormat';
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

function bureauLabel(b: import('../domain/creditReports').Bureau) {
  if (b === 'EXP') return 'Experian';
  if (b === 'EQF') return 'Equifax';
  return 'TransUnion';
}

function valForBureau(tl: NonNullable<ReturnType<typeof findTradeline>>, labelIncludes: string, bureau: import('../domain/creditReports').Bureau): string {
  const needle = norm(labelIncludes).trim();
  const row = (tl.fields ?? []).find((r) => norm(r.label).includes(needle));
  if (!row) return '';
  return (row.byBureau[bureau] || row.byBureau.EXP || row.byBureau.EQF || row.byBureau.TUC || '').trim();
}

function supplementalAccountFindings(args: {
  accountLabel: string;
  candidate: DisputeCandidate;
  tradeline: NonNullable<ReturnType<typeof findTradeline>> | null;
}): string[] {
  const { candidate, tradeline } = args;
  const account = args.accountLabel || candidate.account || 'this account';
  const bureau = bureauLabel(candidate.bureau);
  const out: string[] = [];
  const push = (text: string) => {
    const cleaned = filterFactualDisputeReasons([text])[0];
    if (cleaned && !out.some((x) => norm(x) === norm(cleaned))) out.push(cleaned);
  };

  if (tradeline) {
    const opened = valForBureau(tradeline, 'date opened', candidate.bureau) || tradeline.dateOpened || '';
    const closed = valForBureau(tradeline, 'date closed', candidate.bureau) || tradeline.dateClosed || '';
    const lastActive =
      valForBureau(tradeline, 'last activity', candidate.bureau) ||
      valForBureau(tradeline, 'last active', candidate.bureau) ||
      tradeline.dateLastActive ||
      '';
    const lastReported = valForBureau(tradeline, 'last reported', candidate.bureau) || tradeline.dateLastReported || '';
    const dofd = valForBureau(tradeline, 'first delinquency', candidate.bureau) || tradeline.dofd || '';
    const status = valForBureau(tradeline, 'account status', candidate.bureau) || valForBureau(tradeline, 'payment status', candidate.bureau) || tradeline.accountStatus || '';
    const balance = valForBureau(tradeline, 'balance', candidate.bureau) || (tradeline.balance != null ? `$${tradeline.balance}` : '');
    const pastDue = valForBureau(tradeline, 'past due', candidate.bureau) || (tradeline.pastDue != null ? `$${tradeline.pastDue}` : '');
    const accountNumber = valForBureau(tradeline, 'account number', candidate.bureau) || tradeline.accountNumberMasked || '';

    if (opened && (closed || lastActive || lastReported)) {
      push(`As you can see here on ${bureau}, ${account} reports Date Opened as ${opened}${closed ? ` and Date Closed as ${closed}` : ''}${lastActive ? ` with Date of Last Activity as ${lastActive}` : ''}${lastReported ? ` and Date Last Reported as ${lastReported}` : ''}, making the account timeline a specific disputed reporting issue.`);
    }
    if (dofd && opened) {
      push(`As you can see here on ${bureau}, ${account} reports Date of First Delinquency as ${dofd} while Date Opened is ${opened}, so the delinquency timeline must be evaluated against the account opening date shown on this report.`);
    }
    if (status && (balance || pastDue)) {
      push(`As you can see here on ${bureau}, ${account} reports status as ${status}${balance ? ` with balance ${balance}` : ''}${pastDue ? ` and past-due amount ${pastDue}` : ''}, so the status, balance, and delinquency fields conflict or require account-level correction.`);
    }
    if (lastActive && lastReported) {
      push(`As you can see here on ${bureau}, ${account} reports Date of Last Activity as ${lastActive} and Date Last Reported as ${lastReported}, making these activity/reporting dates specific disputed fields on this account.`);
    }
    if (accountNumber) {
      push(`As you can see here on ${bureau}, ${account} reports account number ending/identifier ${accountNumber}, and this identifier must match the furnisher's records for the disputed account.`);
    }
  }

  if (candidate.status) {
    push(`As you can see here on ${bureau}, ${account} is reporting with status "${candidate.status}", making the account status itself a disputed factual field for this item.`);
  }
  if (candidate.code) {
    push(`As you can see here on ${bureau}, ${account} is tied to reporting code "${candidate.code}", making the code classification a disputed factual field for this account.`);
  }
  if (candidate.type) {
    push(`As you can see here on ${bureau}, ${account} is categorized as ${candidate.type}, and that category must accurately match the account history and documentation for this specific tradeline.`);
  }
  return out;
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

  if (out.length < Math.min(MIN_DISPUTE_REASONS, max)) {
    for (const reason of supplementalAccountFindings({ accountLabel, candidate: args.candidate, tradeline: tl })) {
      push(reason);
      if (out.length >= Math.min(MIN_DISPUTE_REASONS, max)) break;
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
