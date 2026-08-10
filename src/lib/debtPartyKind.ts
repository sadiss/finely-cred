/**
 * Party-kind heuristic for FDCPA power chips.
 * Collector / buyer / attorney → cease including suit until properly validated.
 * Original creditor → proof-in-writing copy (different scope).
 * Never guarantee lawsuit outcomes.
 */

import type { DebtCase } from '../domain/debt';

export type DebtPartyKind = 'collector' | 'debt_buyer' | 'attorney' | 'original_creditor' | 'unknown';

const BUYER_RE =
  /\b(midland|portfolio recovery|pra |lvnv|cavalry|jefferson capital|resurgent|absolute resolutions|velocity|uhg|asset acceptance|credit corp|sherwin|gotham)\b/i;
const ATTORNEY_RE =
  /\b(law|llp|llc\s*law|attorney|counsel|p\.?c\.?|esq|legal group|collection counsel)\b/i;
const COLLECTOR_RE =
  /\b(collection|collections|recovery|receivables|debt collector|servicer)\b/i;

export function inferDebtPartyKind(debt: Pick<
  DebtCase,
  'name' | 'collectorName' | 'recipientName' | 'originalCreditor' | 'plaintiffLawFirm' | 'plaintiffAttorneyName' | 'type'
>): DebtPartyKind {
  const firm = `${debt.plaintiffLawFirm || ''} ${debt.plaintiffAttorneyName || ''}`.trim();
  if (firm && ATTORNEY_RE.test(firm)) return 'attorney';

  const primary = `${debt.collectorName || ''} ${debt.recipientName || ''} ${debt.name || ''}`.trim();
  if (BUYER_RE.test(primary)) return 'debt_buyer';
  if (ATTORNEY_RE.test(primary)) return 'attorney';
  if (COLLECTOR_RE.test(primary)) return 'collector';

  const oc = (debt.originalCreditor || '').trim();
  if (oc && !debt.collectorName) {
    const nameLooksLikeOc =
      debt.name && oc && debt.name.toLowerCase().includes(oc.toLowerCase().slice(0, 8));
    if (nameLooksLikeOc || !COLLECTOR_RE.test(debt.name || '')) return 'original_creditor';
  }

  if (debt.type === 'summons' && firm) return 'attorney';
  if (debt.collectorName) return 'collector';
  return 'unknown';
}

export function isFdCPACollectorParty(kind: DebtPartyKind): boolean {
  return kind === 'collector' || kind === 'debt_buyer' || kind === 'attorney';
}

export type FdcpaPowerChip = {
  id: string;
  label: string;
  detail: string;
  tone: 'emerald' | 'amber' | 'sky' | 'rose';
};

/**
 * Partner-facing chips. Word = validation / properly validated (not "verification").
 * Not “they can never sue.” Summons already filed → answer the court.
 */
export function fdcpaPowerChips(args: {
  partyKind: DebtPartyKind;
  validationMailed: boolean;
  summonsOnFile: boolean;
}): FdcpaPowerChip[] {
  const chips: FdcpaPowerChip[] = [];

  if (isFdCPACollectorParty(args.partyKind)) {
    if (args.validationMailed) {
      chips.push({
        id: 'cease_until_validated',
        label: 'Cease until properly validated',
        detail:
          'After your validation letter is sent, collectors must cease collection — including bringing suit on that debt — until they properly validate. This is not a promise they can never sue, and it does not guarantee case outcomes.',
        tone: 'emerald',
      });
    } else {
      chips.push({
        id: 'send_validation',
        label: 'Send validation first',
        detail:
          'Suggested next step: mail a written validation demand. Once sent, collectors must cease collection activity — including suit — until they properly validate. Not a promise they never sue; lawsuit outcomes are never guaranteed.',
        tone: 'amber',
      });
    }
  } else if (args.partyKind === 'original_creditor') {
    chips.push({
      id: 'oc_proof',
      label: 'Proof in writing',
      detail:
        'Original creditors are not always under the same FDCPA collector rules. Demand itemized proof in writing and keep the paper trail — different copy than collector cease language.',
      tone: 'sky',
    });
  } else {
    chips.push({
      id: 'confirm_party',
      label: 'Confirm who you are writing',
      detail:
        'Confirm whether this is a collector, debt buyer, attorney, or original creditor before relying on cease-until-properly-validated language.',
      tone: 'amber',
    });
  }

  if (args.summonsOnFile) {
    chips.push({
      id: 'answer_court',
      label: 'Summons on file — answer the court',
      detail:
        'A lawsuit already filed still needs a timely answer. Validation and cease language do not replace your court deadline. Learn the steps — outcomes are never guaranteed.',
      tone: 'rose',
    });
  }

  return chips;
}
