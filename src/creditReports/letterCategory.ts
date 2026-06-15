import type { DisputeCandidate } from '../domain/creditReports';
import { classifyCandidateNegativeType, type NegativeType } from './negativePlaybooks';

export type LetterNegativeCategoryKey =
  | 'collections'
  | 'inquiries'
  | 'public_records'
  | 'late_payments'
  | 'repossession'
  | 'foreclosure'
  | 'student_loans'
  | 'other';

export function letterCategoryForCandidate(c: DisputeCandidate): { key: LetterNegativeCategoryKey; label: string } {
  const typeText = String((c as any)?.type || '').toLowerCase();
  const nt = classifyCandidateNegativeType(c as any) as NegativeType;

  if (nt === 'collection' || nt === 'charge_off') return { key: 'collections', label: 'Collections & charge-offs' };
  if (nt === 'inquiry') return { key: 'inquiries', label: 'Inquiries' };
  if (typeText.includes('late payment') || (typeText.includes('late') && !typeText.includes('template'))) {
    return { key: 'late_payments', label: 'Late payments' };
  }

  // Bankruptcy was normalized under Public Records; keep it in that same category.
  if (nt === 'bankruptcy') return { key: 'public_records', label: 'Public records' };
  if (nt === 'public_record') return { key: 'public_records', label: 'Public records' };

  if (nt === 'repossession') return { key: 'repossession', label: 'Repossessions' };
  if (nt === 'foreclosure') return { key: 'foreclosure', label: 'Foreclosures' };
  if (nt === 'student_loan') return { key: 'student_loans', label: 'Student loans' };

  return { key: 'other', label: 'Other negatives' };
}

