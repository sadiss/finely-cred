import type { LitigationLetterArgs } from './litigationLetterArgs';
import { getLitigationBankAffidavitBody, getLitigationDebtBuyerAffidavitBody } from './litigationAffidavitBodies';
import { getLitigationValidationCeaseDesistBody, getLitigationAssignmentRegistryBody } from './litigationValidationBodies';
import { getLitigationDiscoveryRequestsBody, getLitigationMotionToCompelBody } from './litigationCourtFilings';

export type { LitigationLetterArgs } from './litigationLetterArgs';

/** Map debt letter builder args → litigation placeholder args. */
export function toLitigationLetterArgs(args: {
  creditorName: string;
  debtorName: string;
  date: string;
  caseNumber?: string;
  debtorAddress1?: string;
  debtorAddress2?: string;
  debtorCity?: string;
  debtorState?: string;
  debtorPostalCode?: string;
  debtorPhone?: string;
  debtorEmail?: string;
  recipientName?: string;
  recipientAddress?: string;
  originalCreditorName?: string;
  plaintiffLawFirm?: string;
  plaintiffLawFirmAddress?: string;
  plaintiffAttorneyName?: string;
  plaintiffAttorneyBarNumber?: string;
  debtCollectorName?: string;
  accountNumber?: string;
  loanId?: string;
  borrowerId?: string;
  affidavitState?: string;
  affidavitCounty?: string;
  summonsContext?: {
    courtName?: string;
    amountClaimed?: string;
    collectorName?: string;
  };
}): LitigationLetterArgs {
  return {
    debtorName: args.debtorName,
    date: args.date,
    debtorAddress1: args.debtorAddress1,
    debtorAddress2: args.debtorAddress2,
    debtorCity: args.debtorCity,
    debtorState: args.debtorState,
    debtorPostalCode: args.debtorPostalCode,
    debtorPhone: args.debtorPhone,
    debtorEmail: args.debtorEmail,
    plaintiffName: args.recipientName || args.creditorName,
    plaintiffAddress: args.recipientAddress,
    plaintiffLawFirm: args.plaintiffLawFirm || args.summonsContext?.collectorName || args.debtCollectorName,
    plaintiffLawFirmAddress: args.plaintiffLawFirmAddress,
    plaintiffAttorneyName: args.plaintiffAttorneyName,
    plaintiffAttorneyBarNumber: args.plaintiffAttorneyBarNumber,
    originalCreditorName: args.originalCreditorName || args.creditorName,
    debtCollectorName: args.debtCollectorName || args.summonsContext?.collectorName,
    caseNumber: args.caseNumber,
    courtName: args.summonsContext?.courtName,
    accountNumber: args.accountNumber,
    loanId: args.loanId,
    borrowerId: args.borrowerId,
    affidavitState: args.affidavitState || args.debtorState,
    affidavitCounty: args.affidavitCounty,
    amountClaimed: args.summonsContext?.amountClaimed,
  };
}

export {
  getLitigationBankAffidavitBody,
  getLitigationDebtBuyerAffidavitBody,
  getLitigationValidationCeaseDesistBody,
  getLitigationAssignmentRegistryBody,
  getLitigationDiscoveryRequestsBody,
  getLitigationMotionToCompelBody,
};

/** @deprecated Use toLitigationLetterArgs */
export const toParkerArgs = toLitigationLetterArgs;

export function normalizeDebtLetterType(id: string): import('../../domain/debtLegal').DebtLetterType {
  if (id === 'affidavit_parker_litigation') return 'affidavit_litigation_bank';
  if (id === 'affidavit_parker_velocity') return 'affidavit_litigation_debt_buyer';
  return id as import('../../domain/debtLegal').DebtLetterType;
}
