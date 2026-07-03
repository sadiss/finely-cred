/**
 * Legal-first validation / summons clock engine — FDCPA §809 windows + letter drafts.
 */

import type { DebtCase } from '../domain/debt';
import { listAllDebtCases } from '../data/debtRepo';
import { FDCPA_VALIDATION_DAYS, listDebtWorkflowTimers, type DebtWorkflowTimer } from './debtWorkflowEngine';
import { getLetterBody } from '../legal/debtLetterTemplates';
import type { DebtLetterType } from '../domain/debtLegal';

export type ValidationClockRow = {
  debtCaseId: string;
  partnerId: string;
  debtName: string;
  debtType: DebtCase['type'];
  timer: DebtWorkflowTimer;
};

export function listOpenValidationClocks(): ValidationClockRow[] {
  const rows: ValidationClockRow[] = [];
  for (const debt of listAllDebtCases()) {
    if (debt.status === 'resolved') continue;
    for (const timer of listDebtWorkflowTimers(debt)) {
      if (timer.tone === 'ok') continue;
      rows.push({
        debtCaseId: debt.id,
        partnerId: debt.partnerId,
        debtName: debt.name,
        debtType: debt.type,
        timer,
      });
    }
  }
  return rows.sort((a, b) => a.timer.daysRemaining - b.timer.daysRemaining);
}

export function buildValidationLetterDraft(args: {
  debt: DebtCase;
  debtorName: string;
  debtorAddress1?: string;
  debtorCity?: string;
  debtorState?: string;
  debtorPostalCode?: string;
  creditorName?: string;
  letterType?: DebtLetterType;
}): string {
  const date = new Date().toISOString().slice(0, 10);
  const type = args.letterType ?? (args.debt.type === 'summons' ? 'summons_response_affidavit' : 'validation_request');
  return getLetterBody(type, {
    creditorName: args.creditorName ?? args.debt.recipientName ?? args.debt.name,
    debtorName: args.debtorName,
    date,
    caseNumber: args.debt.courtCaseNumber,
    stateNote: args.debt.stateJurisdiction,
    debtorAddress1: args.debtorAddress1,
    debtorCity: args.debtorCity,
    debtorState: args.debtorState,
    debtorPostalCode: args.debtorPostalCode,
    recipientName: args.debt.recipientName ?? args.debt.collectorName ?? args.debt.name,
    recipientAddress: args.debt.recipientAddress,
  });
}

export function summarizeValidationClocksForCoOwner(): string {
  const open = listOpenValidationClocks();
  if (!open.length) {
    return `No urgent validation or summons clocks. FDCPA validation window is ${FDCPA_VALIDATION_DAYS} days from first written contact.`;
  }
  const lines = open.slice(0, 12).map((row) => {
    const d = row.timer.daysRemaining;
    const status = d <= 0 ? 'OVERDUE' : d <= 7 ? 'URGENT' : 'WATCH';
    return `- [${status}] ${row.debtName} (${row.debtType}) · ${row.timer.label} · ${d} day(s) left · partner ${row.partnerId}`;
  });
  return [`Open validation/summons clocks (${open.length}):`, ...lines].join('\n');
}
