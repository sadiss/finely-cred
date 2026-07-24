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

/** Short badge shown above Generate (UI only). */
export function letterProductBadge(kind: LetterProductKind): string {
  switch (kind) {
    case 'validation_letter':
      return 'Validation letter';
    case 'court_filing':
      return 'Court answer letter';
    case 'affidavit':
      return 'Affidavit';
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
