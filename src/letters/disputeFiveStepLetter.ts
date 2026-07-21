/**
 * 5-step dispute letter framing — aligns generated bureau letters with the free guide.
 * Step 1: one target · Step 2: lane · Step 3: story + FCRA · Step 4: exhibits · Step 5: round follow-up
 */
import type { DisputeCandidate } from '../domain/creditReports';
import {
  classifyCandidateNegativeType,
  NEGATIVE_PLAYBOOKS,
  type NegativeType,
} from '../creditReports/negativePlaybooks';
import { consumerDisputeOpeningForTone, DISPUTE_GUIDE_FIVE_STEPS } from './consumerDisputeVoice';

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

export function buildFiveStepDisputeIntro(args: {
  tone: 'formal' | 'neutral' | 'conversational';
  negativeType: NegativeType;
  round: string;
  accountLabel?: string;
  transferNote?: string;
}): string {
  const playbook = NEGATIVE_PLAYBOOKS[args.negativeType] ?? NEGATIVE_PLAYBOOKS.unknown;
  const lane = disputeLaneForNegative(args.negativeType);
  const account = args.accountLabel?.trim() || 'the account listed below';
  const roundNote =
    args.round === 'Round 1'
      ? 'This is my first dispute on this specific tradeline.'
      : `${args.round}: I am following up on my prior dispute with new factual findings from your response and updated exhibits.`;

  const specialty =
    playbook.clauses?.[0]?.replace(/^As you can see here on the bureau report, /i, '') ??
    playbook.aiHint.split('.')[0] + '.';

  const base = consumerDisputeOpeningForTone(args.tone === 'conversational' ? 'conversational' : args.tone === 'formal' ? 'formal' : 'neutral');
  const [s1, s2, s3, s4, s5] = DISPUTE_GUIDE_FIVE_STEPS;

  const transferBlock = args.transferNote?.trim()
    ? ['', `Prior dispute history: ${args.transferNote.trim()}`, '']
    : [];

  return [
    base,
    ...transferBlock,
    '',
    s1.heading,
    `• ${s1.lead}`,
    `• Target for this letter: ${account} only.`,
    '',
    s2.heading,
    `• Dispute lane (${playbook.label}): ${lane}.`,
    '',
    s3.heading,
    `• Factual focus: ${specialty}`,
    '',
    s4.heading,
    `• Attach identity proof plus report screenshot(s) cited below as exhibits.`,
    '',
    s5.heading,
    `• ${roundNote}`,
    '',
    'Each numbered reason below states one factual problem visible on my report and attached exhibits.',
  ].join('\n');
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
    `Dispute lane (${playbook.label}): ${disputeLaneForNegative(negativeType)}.`,
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
  return out;
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
