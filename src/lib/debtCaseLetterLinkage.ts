import { listDebtByPartner } from '../data/debtRepo';
import { listLettersByPartner } from '../data/lettersRepo';
import type { DebtCase } from '../domain/debt';
import type { LetterRecord } from '../domain/letters';
import type { ReportedDebtSignal } from './debtCreditorIntel';

function isDebtStudioLetter(l: LetterRecord): boolean {
  if (l.archivedAt) return false;
  if (l.type !== 'validation' && l.type !== 'court') return false;
  const meta = l.meta as { context?: string; debtId?: string } | undefined;
  return meta?.context === 'debt' && Boolean(meta?.debtId);
}

/** Resolve the debt case id tied to a report tradeline signal. */
export function debtCaseIdForSignal(signal: ReportedDebtSignal, partnerId: string): string | null {
  const linked = listDebtByPartner(partnerId).find(
    (c) => c.reportId === signal.reportId && c.tradelineIndex === signal.tradelineIndex,
  );
  return linked?.id ?? null;
}

/** Active debt studio letters saved for a case (validation + court). */
export function lettersForDebtCase(partnerId: string, debtCaseId: string | null | undefined): LetterRecord[] {
  if (!debtCaseId) return [];
  return listLettersByPartner(partnerId)
    .filter(isDebtStudioLetter)
    .filter((l) => (l.meta as { debtId?: string }).debtId === debtCaseId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function lettersForSignal(
  partnerId: string,
  signal: ReportedDebtSignal,
  activeDebt: DebtCase | null,
): LetterRecord[] {
  const caseId = debtCaseIdForSignal(signal, partnerId);
  if (caseId) return lettersForDebtCase(partnerId, caseId);
  if (
    activeDebt?.reportId === signal.reportId &&
    activeDebt.tradelineIndex === signal.tradelineIndex
  ) {
    return lettersForDebtCase(partnerId, activeDebt.id);
  }
  return [];
}

export function debtCaseHasStudioLetter(partnerId: string, debtCaseId: string | null | undefined): boolean {
  return lettersForDebtCase(partnerId, debtCaseId).length > 0;
}
