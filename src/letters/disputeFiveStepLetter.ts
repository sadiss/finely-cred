/**
 * Bureau dispute letter helpers (letter body only).
 * Free Dispute Letter Guide Step 1–5 teaching content lives in consumerDisputeVoice /
 * buildFiveStepGuidePages for the lead-magnet PDF — never inject those headings into mailed letters.
 */
import type { DisputeCandidate } from '../domain/creditReports';
import {
  classifyCandidateNegativeType,
  NEGATIVE_PLAYBOOKS,
  type NegativeType,
} from '../creditReports/negativePlaybooks';
import { filterFactualDisputeReasons } from '../creditReports/disputeFactualReasons';
import { consumerDisputeOpeningForTone } from './consumerDisputeVoice';

const LANE_BY_NEGATIVE: Partial<Record<NegativeType, string>> = {
  foreclosure: 'inaccurate foreclosure timeline, status, or balance fields versus servicer records',
  repossession: 'inaccurate repossession disposition, sale accounting, or deficiency balance',
  bankruptcy: 'bankruptcy public-record details that do not match court docket records',
  collection: 'inaccurate, incomplete, or unverifiable collection reporting on this bureau file',
  charge_off: 'charge-off status, balance, or payment-history contradictions',
  student_loan: 'student-loan servicer, status, or balance inconsistencies',
  inquiry: 'inquiry records without permissible purpose or wrong dates',
  identity_theft: 'accounts that are not mine — identity theft block',
};

export function disputeLaneForNegative(negativeType: NegativeType): string {
  return LANE_BY_NEGATIVE[negativeType] ?? 'inaccurate, incomplete, or unverifiable reporting on this tradeline';
}

/** Default letter opening — consumer voice only; no free-guide Step 1–5 framework. */
export function buildFiveStepDisputeIntro(args: {
  tone: 'formal' | 'neutral' | 'conversational';
  negativeType: NegativeType;
  round: string;
  accountLabel?: string;
  transferNote?: string;
}): string {
  const playbook = NEGATIVE_PLAYBOOKS[args.negativeType] ?? NEGATIVE_PLAYBOOKS.unknown;
  const account = args.accountLabel?.trim();
  const base = consumerDisputeOpeningForTone(
    args.tone === 'conversational' ? 'conversational' : args.tone === 'formal' ? 'formal' : 'neutral',
  );

  const parts: string[] = [base];

  if (args.transferNote?.trim()) {
    parts.push('', `Prior dispute history: ${args.transferNote.trim()}`);
  }

  if (account) {
    parts.push('', `This letter disputes only: ${account} (${playbook.label}).`);
  }

  if (args.round !== 'Round 1') {
    parts.push(
      '',
      `${args.round}: I am following up on my prior dispute with new factual findings from your response and updated exhibits.`,
    );
  }

  parts.push(
    '',
    'Each numbered reason below states one factual problem visible on my report and attached exhibits.',
  );

  return parts.join('\n');
}

export function buildFiveStepItemPreamble(args: {
  candidate: DisputeCandidate;
  round: string;
  exhibitLabel?: string;
}): string {
  const negativeType = classifyCandidateNegativeType(args.candidate);
  const playbook = NEGATIVE_PLAYBOOKS[negativeType] ?? NEGATIVE_PLAYBOOKS.unknown;
  const exhibit = args.exhibitLabel || 'Exhibit A';
  return [
    `This item concerns ${playbook.label.toLowerCase()} reporting: ${disputeLaneForNegative(negativeType)}.`,
    `See ${exhibit} — screenshot of the account panel on my ${args.candidate.bureau === 'EQF' ? 'Equifax' : args.candidate.bureau === 'TUC' ? 'TransUnion' : 'Experian'} report.`,
    args.round !== 'Round 1' ? `Follow-up (${args.round}): new factual reasons based on your prior response.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function seedPlaybookReasonsForCandidate(args: {
  candidate: DisputeCandidate;
  existing?: string[];
  max?: number;
}): string[] {
  const negativeType = classifyCandidateNegativeType(args.candidate);
  const playbook = NEGATIVE_PLAYBOOKS[negativeType] ?? NEGATIVE_PLAYBOOKS.unknown;
  const clauses = playbook.clauses ?? [];
  const out = [...(args.existing ?? [])];
  const seen = new Set(out.map((x) => x.toLowerCase()));
  for (const clause of clauses) {
    if (out.length >= (args.max ?? 5)) break;
    if (!seen.has(clause.toLowerCase())) {
      out.push(clause);
      seen.add(clause.toLowerCase());
    }
  }
  return filterFactualDisputeReasons(out);
}

export function dominantNegativeTypeFromCandidates(candidates: DisputeCandidate[]): NegativeType {
  const counts = new Map<NegativeType, number>();
  for (const c of candidates) {
    const t = classifyCandidateNegativeType(c);
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  let best: NegativeType = 'unknown';
  let max = 0;
  for (const [t, n] of counts) {
    if (n > max) {
      max = n;
      best = t;
    }
  }
  return best;
}
