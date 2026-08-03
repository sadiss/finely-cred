/**
 * Clear product labels so partners never confuse validation letters vs court filings vs affidavits.
 * Used on Generate CTAs BEFORE generation — not inside mailed letter bodies.
 */

import type { DebtLetterType } from '../domain/debtLegal';
import { isCourtDayKitId } from './letterBodySafety';

export type LetterProductKind =
  | 'validation_letter'
  | 'court_filing'
  | 'affidavit'
  | 'discovery'
  | 'hearing_kit_ui'
  | 'bureau_dispute'
  | 'other_letter';

export function classifyLetterProduct(args: {
  letterType?: DebtLetterType | string | null;
  catalogId?: string | null;
  track?: string | null;
}): LetterProductKind {
  const id = String(args.catalogId || args.letterType || '').toLowerCase();
  const track = String(args.track || '').toLowerCase();

  if (isCourtDayKitId(id) || id.includes('day_kit') || id.includes('hearing_kit')) {
    return 'hearing_kit_ui';
  }
  if (id.includes('affidavit') || id.includes('counter_affidavit')) return 'affidavit';
  if (id.includes('discovery') || id.includes('compel') || id.includes('interrogator') || id.includes('rfa')) {
    return 'discovery';
  }
  if (
    id.includes('written_answer') ||
    id.includes('summons_response') ||
    id.includes('motion_') ||
    id.includes('counterclaim') ||
    id.includes('pretrial_proof') ||
    id.includes('courtroom_') ||
    (track === 'litigation' && id.includes('answer'))
  ) {
    return 'court_filing';
  }
  if (
    id.includes('validation') ||
    id.includes('cease') ||
    id.includes('assignment_chain') ||
    id.includes('chain_of_title') ||
    track === 'validation'
  ) {
    return 'validation_letter';
  }
  if (id.includes('bureau') || id.includes('furnisher') || id.includes('reporting') || track === 'credit') {
    return 'bureau_dispute';
  }
  return 'other_letter';
}

/** Which workspace lane a letter belongs to. Court products must never surface on Validation. */
export type LetterTrackFamily = 'validation' | 'court' | 'credit' | 'collateral' | 'other';

/** Product kinds that are court work — blocked on the Validation lane. */
export const COURT_PRODUCT_KINDS: LetterProductKind[] = ['court_filing', 'affidavit', 'discovery', 'hearing_kit_ui'];

/**
 * ID fragments that mean "this is court work" even when the catalog category is friendlier.
 * Deliberately conservative: only pleading / sworn / discovery / hearing language.
 */
const COURT_ID_MARKERS = [
  'affidavit',
  'written_answer',
  'summons_response',
  'answer_general',
  'motion_',
  'counterclaim',
  'pretrial_proof',
  'courtroom_',
  'day_kit',
  'hearing_kit',
  'discovery',
  'compel',
  'interrogator',
  'affirmative_defenses',
  'subpoena',
  'deposition',
  'sanctions',
  'appeal_',
  'request_jury',
  'request_bench_trial',
  'stipulated_dismissal',
  'vexatious',
];

const CREDIT_ID_MARKERS = ['bureau', 'furnisher', 'reporting', 'metro2', 'specialty_cra', '_fcr'];

/**
 * Post-suit validation demands are real § 1692g letters, but they only make sense while a
 * lawsuit is live — Validation gates them behind an actual litigation case.
 */
const POST_SUIT_VALIDATION_IDS = ['post_suit_validation_demand', 'mini_miranda_suit'];

export function isPostSuitValidationLetter(args: {
  letterType?: DebtLetterType | string | null;
  catalogId?: string | null;
}): boolean {
  const id = `${String(args.catalogId || '')} ${String(args.letterType || '')}`.toLowerCase();
  return POST_SUIT_VALIDATION_IDS.some((m) => id.includes(m));
}

/**
 * Resolve the lane for a letter. Catalog `category` wins when supplied (it is authoritative);
 * otherwise we infer from the id / letter type shape.
 */
export function letterTrackFamily(args: {
  letterType?: DebtLetterType | string | null;
  catalogId?: string | null;
  category?: string | null;
}): LetterTrackFamily {
  const id = `${String(args.catalogId || '')} ${String(args.letterType || '')}`.toLowerCase();
  const category = String(args.category || '').toLowerCase();
  const looksCourt = COURT_ID_MARKERS.some((m) => id.includes(m));
  const looksCredit = CREDIT_ID_MARKERS.some((m) => id.includes(m));

  if (category === 'court' || category === 'securitization') return 'court';
  if (category === 'validation' || category === 'negotiation') return looksCourt ? 'court' : 'validation';
  if (category === 'reporting' || category === 'bureau') return 'credit';
  if (category === 'foreclosure' || category === 'repossession') {
    if (looksCredit) return 'credit';
    return looksCourt ? 'court' : 'collateral';
  }

  if (looksCourt) return 'court';
  if (looksCredit) return 'credit';
  // Validation wins before collateral so ids like `validation_round2_deficiency` stay on Validation.
  if (/validation|cease|chain_of_title|assignment_chain|time_barred|dispute|settlement|negotiat|licensing|accounting/.test(id)) {
    return 'validation';
  }
  if (/foreclosure|repossession|repo_|redemption|reinstatement|escrow|note_possession|deficiency_balance/.test(id)) {
    return 'collateral';
  }
  return 'other';
}

/**
 * True when a letter may appear on the Validation lane.
 * Root-cause guard: court filings, affidavits, discovery, and hearing kits are always excluded,
 * and post-suit validation demands require an actual live lawsuit.
 */
export function isValidationTrackLetter(args: {
  letterType?: DebtLetterType | string | null;
  catalogId?: string | null;
  category?: string | null;
  /** Pass true when the selected case is an active lawsuit (summons served / pre-answer). */
  caseIsLitigation?: boolean;
}): boolean {
  const kind = classifyLetterProduct({ letterType: args.letterType, catalogId: args.catalogId });
  if (COURT_PRODUCT_KINDS.includes(kind)) return false;
  const family = letterTrackFamily(args);
  if (family !== 'validation' && family !== 'credit') return false;
  if (isPostSuitValidationLetter(args) && !args.caseIsLitigation) return false;
  return true;
}

/** True when a letter belongs to the Court / Affidavit lane. */
export function isCourtTrackLetter(args: {
  letterType?: DebtLetterType | string | null;
  catalogId?: string | null;
  category?: string | null;
}): boolean {
  const kind = classifyLetterProduct({ letterType: args.letterType, catalogId: args.catalogId });
  if (COURT_PRODUCT_KINDS.includes(kind)) return true;
  return letterTrackFamily(args) === 'court';
}

/** Short badge shown above Generate (UI only). */
export function letterProductBadge(kind: LetterProductKind): string {
  switch (kind) {
    case 'validation_letter':
      return 'Validation letter';
    case 'court_filing':
      return 'Court answer letter';
    case 'affidavit':
      return 'Response Affidavit';
    case 'discovery':
      return 'Discovery set';
    case 'hearing_kit_ui':
      return 'Court-day kit · UI only';
    case 'bureau_dispute':
      return 'Bureau dispute letter';
    default:
      return 'Mailed letter';
  }
}

/** Primary Generate button label — unmistakable before click. */
export function letterGenerateCtaLabel(kind: LetterProductKind, title?: string): string {
  const short = (title || '').trim();
  switch (kind) {
    case 'validation_letter':
      return short ? `Generate validation letter` : 'Generate validation letter';
    case 'court_filing':
      if (/answer|written answer|court answer/i.test(short)) return 'Generate court answer letter';
      return short ? `Generate court letter` : 'Generate court answer letter';
    case 'affidavit':
      return 'Generate affidavit';
    case 'discovery':
      return short ? `Generate discovery` : 'Generate discovery requests';
    case 'hearing_kit_ui':
      return 'Open court-day kit';
    case 'bureau_dispute':
      return short ? `Generate bureau letter` : 'Generate bureau dispute letter';
    default:
      return short ? `Generate letter` : 'Generate letter';
  }
}

/** One-line what-you-get under the Generate button (UI only). */
export function letterGenerateHint(kind: LetterProductKind): string {
  switch (kind) {
    case 'validation_letter':
      return 'Creates a complete FDCPA validation letter to mail — pure letter body, no how-to steps inside.';
    case 'court_filing':
      return 'Creates a complete court filing draft (answer / notice) — pure pleading language for paper preview.';
    case 'affidavit':
      return 'Creates a complete sworn affidavit draft — formal affidavit text only.';
    case 'discovery':
      return 'Creates defendant discovery requests — formal discovery text for service.';
    case 'hearing_kit_ui':
      return 'Opens the hearing card in Litigation Command. Checklist stays on-screen — never becomes a mailed PDF.';
    case 'bureau_dispute':
      return 'Creates a complete bureau/furnisher dispute letter — mailed letter prose only.';
    default:
      return 'Creates a complete mailed letter with paper preview — guidance stays in the UI, not on the paper.';
  }
}
