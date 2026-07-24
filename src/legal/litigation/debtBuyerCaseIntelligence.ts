/**
 * Case-study intelligence for Midland / PRA / Velocity (+ original-creditor) suits.
 * Pattern-driven for ALL similar partners — not Roosevelt-only UI chrome.
 */

import type { DebtCase } from '../../domain/debt';
import type { Partner } from '../../domain/partners';

export type DebtBuyerPatternId =
  | 'midland_citi'
  | 'midland_generic'
  | 'pra_generic'
  | 'velocity_generic'
  | 'debt_buyer_generic'
  | 'bank_plaintiff'
  | 'unknown';

export type DebtBuyerCaseIntel = {
  patternId: DebtBuyerPatternId;
  label: string;
  /** Short “what matters now” line for Litigation Command */
  whatMatters: string;
  /** One sticky sentence: what a first-timer does right now */
  doNowOneLiner: string;
  nextSteps: string[];
  courtSafePhrases: string[];
  doNotSay: string[];
  letterPriorities: Array<'courtroom_written_answer' | 'validation_request' | 'post_suit_validation_demand' | 'assignment_chain_demand' | 'affidavit_litigation_debt_buyer' | 'defendant_discovery_requests'>;
  links: Array<{ label: string; href: string; external?: boolean }>;
};

const BUYER_RE = /\b(midland|portfolio recovery|pra\b|cavalry|lvnv|resurgent|velocity|absolut[e]? resolut|jefferson capital|credit corp|encore capital)\b/i;
const CITI_RE = /\b(citi|citibank|citicorp|citigroup)\b/i;
const BANK_RE = /\b(bank of america|chase|wells fargo|capital one|discover|american express|us bank|synchrony|ally)\b/i;

function haystack(args: { partner?: Partner | null; debt?: DebtCase | null; plaintiff?: string; originalCreditor?: string }): string {
  const d = args.debt;
  return [
    args.plaintiff,
    args.originalCreditor,
    d?.name,
    d?.notes,
    d?.recipientName,
    args.partner?.profile?.fullName,
  ]
    .filter(Boolean)
    .join(' ');
}

export function detectDebtBuyerPattern(args: {
  partner?: Partner | null;
  debt?: DebtCase | null;
  plaintiff?: string;
  originalCreditor?: string;
}): DebtBuyerPatternId {
  const h = haystack(args);
  const plaintiff = String(args.plaintiff || args.debt?.name || '');
  const orig = String(args.originalCreditor || '');
  if (/midland/i.test(plaintiff) && (CITI_RE.test(h) || CITI_RE.test(orig))) return 'midland_citi';
  if (/midland/i.test(plaintiff) || /midland/i.test(h)) return 'midland_generic';
  if (/portfolio recovery|\bpra\b/i.test(plaintiff) || /portfolio recovery|\bpra\b/i.test(h)) return 'pra_generic';
  if (/velocity/i.test(plaintiff) || /velocity/i.test(h)) return 'velocity_generic';
  if (BUYER_RE.test(plaintiff) || BUYER_RE.test(h)) return 'debt_buyer_generic';
  if (BANK_RE.test(plaintiff) && !BUYER_RE.test(plaintiff)) return 'bank_plaintiff';
  return 'unknown';
}

export function getDebtBuyerCaseIntel(args: {
  partner?: Partner | null;
  debt?: DebtCase | null;
  plaintiff?: string;
  originalCreditor?: string;
}): DebtBuyerCaseIntel {
  const patternId = detectDebtBuyerPattern(args);
  const baseLinks = [
    { label: 'Litigation Command', href: '/portal/debt?tab=litigation' },
    { label: 'Validation track', href: '/portal/debt?tab=validation' },
    { label: 'CFPB card agreements', href: 'https://www.consumerfinance.gov/credit-cards/agreements/', external: true },
  ];

  if (patternId === 'midland_citi') {
    return {
      patternId,
      label: 'Debt-buyer pattern · Midland + Citi-style origin',
      whatMatters:
        'Separate (1) whether a Citi account existed from (2) whether this Midland plaintiff proved ownership, sale-file identity, and amount today.',
      doNowOneLiner:
        'Drop the summons → Apply fills empty fields → confirm counsel mailing → Build written answer (admit only honest Citi facts; never “I owe Midland” without proof).',
      nextSteps: [
        'Upload / scrape the summons or docket so case #, firm, and mailing address fill automatically.',
        'File / serve a written answer that admits only honest facts — never “I owe Midland” if ownership is unproven.',
        'Demand account-level sale schedule (last four, sale balance, field codes) — not a pool bill of sale alone.',
        'Walk dollars: original statement → charge-off → sale → Midland balance → lawsuit amount + costs.',
        'Build debt-buyer affidavit + discovery on standing and chain of title.',
        'Bureau disputes for inaccurate Midland/Citi furnishing belong in Credit Letters after court papers are stable.',
      ],
      courtSafePhrases: [
        'I may recognize an original Citibank relationship if that is true. I do not admit that this named Midland plaintiff owns the receivable or has proven the balance for judgment today.',
        'Where is the sale-file row that identifies this exact account, balance at transfer, and field definitions?',
      ],
      doNotSay: [
        'Do not deny the original Citi account if it was honestly yours.',
        'Do not claim securitization paid the debt.',
        'Do not call the plaintiff “fraud” without proof.',
      ],
      letterPriorities: [
        'courtroom_written_answer',
        'post_suit_validation_demand',
        'assignment_chain_demand',
        'affidavit_litigation_debt_buyer',
        'defendant_discovery_requests',
      ],
      links: baseLinks,
    };
  }

  if (patternId === 'midland_generic' || patternId === 'pra_generic' || patternId === 'velocity_generic' || patternId === 'debt_buyer_generic') {
    const buyer =
      patternId === 'pra_generic'
        ? 'Portfolio Recovery / PRA'
        : patternId === 'velocity_generic'
          ? 'Velocity-style buyer'
          : patternId === 'midland_generic'
            ? 'Midland'
            : 'debt buyer';
    return {
      patternId,
      label: `Debt-buyer pattern · ${buyer}`,
      whatMatters: `Force ${buyer} to prove standing with account-level assignment, ledger, and witness foundation — not portfolio summaries.`,
      doNowOneLiner: `Drop court papers → confirm ${buyer} / counsel address → Build written answer → then affidavit + discovery on THIS account.`,
      nextSteps: [
        'Upload / scrape so plaintiff, firm mailing address, case #, and amount fill empty fields.',
        'Answer the complaint with honest admissions/denials; put standing and amount at issue.',
        'Send validation / assignment-chain demands for this specific account.',
        'Build debt-buyer affidavit attacking missing Exhibit A / sale schedules.',
        'Serve discovery (RFAs, interrogatories, RFPs) on ownership and amount.',
        'At hearing: ask for the exhibit that lists THIS account in any sale.',
      ],
      courtSafePhrases: [
        'I dispute that plaintiff has proven it is the real party in interest for this specific account.',
        'I dispute the amount until a complete itemized ledger and account-level chain of title are produced.',
      ],
      doNotSay: [
        'Do not invent denials that contradict records you know are genuine.',
        'Do not argue mythical securitization wipeouts — stick to missing proof.',
      ],
      letterPriorities: [
        'courtroom_written_answer',
        'validation_request',
        'assignment_chain_demand',
        'affidavit_litigation_debt_buyer',
        'defendant_discovery_requests',
      ],
      links: baseLinks,
    };
  }

  if (patternId === 'bank_plaintiff') {
    return {
      patternId,
      label: 'Bank / original-creditor plaintiff pattern',
      whatMatters: 'Challenge contract, ledger, fees, and foundation even when the named plaintiff looks like the bank of origin.',
      doNowOneLiner: 'Drop the summons → confirm bank / counsel mailing → Build written answer denying unproven balance and fees → demand ledger + agreement.',
      nextSteps: [
        'Upload / scrape so court, case #, counsel address, and amount fill empty fields.',
        'Answer with specific denials on balance and unauthorized fees.',
        'Demand the signed agreement and complete ledger.',
        'Use bank-plaintiff affidavit pack if debt-collector language appears on pleadings.',
        'Preserve SOL and licensing defenses where applicable.',
      ],
      courtSafePhrases: [
        'I deny the balance unless and until plaintiff produces a complete itemized ledger from inception.',
        'I request competent evidence of the agreement terms allegedly owed.',
      ],
      doNotSay: ['Do not admit the full prayer for relief if fees/interest are unproven.'],
      letterPriorities: ['courtroom_written_answer', 'validation_request', 'defendant_discovery_requests'],
      links: baseLinks,
    };
  }

  return {
    patternId: 'unknown',
    label: 'Court defense pattern · general collection suit',
    whatMatters: 'Protect deadlines first: scrape papers → answer → proof demands → affidavit → discovery → hearing kit.',
    doNowOneLiner:
      'Start at step 1: drop summons / docket / affidavit → Apply fills empty fields → confirm parties → Build written answer.',
    nextSteps: [
      'Upload the summons, complaint, or docket into the scrape unit (step 1).',
      'Confirm plaintiff, counsel, and mailing address (step 2) — never leave an accessible address blank.',
      'Build a written answer that preserves standing, amount, and foundation defenses.',
      'Demand validation and account-level proof from plaintiff or counsel.',
      'Set the hearing date so the countdown stays honest.',
    ],
    courtSafePhrases: [
      'I dispute liability until plaintiff proves standing, contract, and amount with competent evidence.',
    ],
    doNotSay: ['Do not miss the answer deadline while gathering documents.'],
    letterPriorities: ['courtroom_written_answer', 'validation_request', 'defendant_discovery_requests'],
    links: baseLinks,
  };
}

export function isDebtBuyerStyleCase(args: {
  partner?: Partner | null;
  debt?: DebtCase | null;
  plaintiff?: string;
  originalCreditor?: string;
}): boolean {
  const id = detectDebtBuyerPattern(args);
  return id !== 'unknown' && id !== 'bank_plaintiff';
}
