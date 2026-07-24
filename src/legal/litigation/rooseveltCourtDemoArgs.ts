/**
 * Demo / merge-field defaults for Roosevelt Corelus Midland–Citi hearing matter.
 * Use when building courtroom pack letters for the court partner — never Yolie.
 */

import type { LitigationLetterArgs } from './litigationLetterArgs';
import {
  ROOSEVELT_DISPLAY_NAME,
  ROOSEVELT_HEARING_ISO,
  isRooseveltCourtPartner,
} from '../../data/rooseveltCourtPartnerSeed';
import type { Partner } from '../../domain/partners';
import type { DebtCase } from '../../domain/debt';

/** Baseline merge fields when the active partner is Roosevelt (or debt is his Midland case). */
export function rooseveltCourtDemoLitigationArgs(partial?: Partial<LitigationLetterArgs>): LitigationLetterArgs {
  return {
    debtorName: ROOSEVELT_DISPLAY_NAME,
    date: new Date().toISOString().slice(0, 10),
    debtorAddress1: '30 Portland St',
    debtorCity: 'Haverhill',
    debtorState: 'MA',
    debtorPostalCode: '01830',
    plaintiffName: 'Midland Funding LLC',
    originalCreditorName: 'Citibank, N.A.',
    debtCollectorName: 'Midland Credit Management',
    accountNumber: '33435****',
    amountClaimed: '$1,094.00',
    affidavitState: 'MA',
    courtName: partial?.courtName || '{{COURT_NAME}}',
    caseNumber: partial?.caseNumber || '{{CASE_NUMBER}}',
    ...partial,
  };
}

export function shouldUseRooseveltCourtDemoMerge(args: {
  partner?: Partner | null;
  debt?: DebtCase | null;
}): boolean {
  if (isRooseveltCourtPartner(args.partner)) return true;
  const d = args.debt;
  if (!d) return false;
  if ((d.notes || '').includes('roosevelt-midland-citi-hearing')) return true;
  if ((d.hearingDate || '').slice(0, 10) === ROOSEVELT_HEARING_ISO && /midland/i.test(d.name || '')) {
    return true;
  }
  return false;
}

/** Apply Roosevelt demo defaults under empty merge fields for courtroom pack builds. */
export function applyRooseveltCourtDemoIfNeeded(args: {
  partner?: Partner | null;
  debt?: DebtCase | null;
  litigation: LitigationLetterArgs;
}): LitigationLetterArgs {
  if (!shouldUseRooseveltCourtDemoMerge(args)) return args.litigation;
  const demo = rooseveltCourtDemoLitigationArgs();
  const cur = args.litigation;
  return {
    ...demo,
    ...cur,
    debtorName: cur.debtorName?.trim() || demo.debtorName,
    plaintiffName: cur.plaintiffName?.trim() || demo.plaintiffName,
    originalCreditorName: cur.originalCreditorName?.trim() || demo.originalCreditorName,
    debtCollectorName: cur.debtCollectorName?.trim() || demo.debtCollectorName,
    accountNumber: cur.accountNumber?.trim() || demo.accountNumber,
    amountClaimed: cur.amountClaimed?.trim() || demo.amountClaimed,
    debtorAddress1: cur.debtorAddress1?.trim() || demo.debtorAddress1,
    debtorCity: cur.debtorCity?.trim() || demo.debtorCity,
    debtorState: cur.debtorState?.trim() || demo.debtorState,
    debtorPostalCode: cur.debtorPostalCode?.trim() || demo.debtorPostalCode,
    affidavitState: cur.affidavitState?.trim() || demo.affidavitState || 'MA',
  };
}
