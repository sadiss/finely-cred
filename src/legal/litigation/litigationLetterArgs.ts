/** Shared placeholder args for litigation letters (validation, discovery, affidavits). */
export type LitigationLetterArgs = {
  debtorName: string;
  date: string;
  debtorAddress1?: string;
  debtorAddress2?: string;
  debtorCity?: string;
  debtorState?: string;
  debtorPostalCode?: string;
  debtorPhone?: string;
  debtorEmail?: string;
  /** Plaintiff / creditor on the lawsuit */
  plaintiffName: string;
  plaintiffAddress?: string;
  /** Plaintiff's collection law firm */
  plaintiffLawFirm?: string;
  plaintiffLawFirmAddress?: string;
  plaintiffAttorneyName?: string;
  plaintiffAttorneyBarNumber?: string;
  /** Original creditor if different from plaintiff */
  originalCreditorName?: string;
  /** Debt collector entity if distinct */
  debtCollectorName?: string;
  caseNumber?: string;
  courtName?: string;
  judgeName?: string;
  accountNumber?: string;
  loanId?: string;
  borrowerId?: string;
  /** Affidavit jurisdiction */
  affidavitState?: string;
  affidavitCounty?: string;
  amountClaimed?: string;
  /** Velocity / debt-buyer specific */
  billOfSaleSeller?: string;
  originatorNames?: string;
};

export function litigationAddrBlock(args: LitigationLetterArgs): string {
  const lines = [
    args.debtorName,
    args.debtorAddress1,
    args.debtorAddress2,
    [args.debtorCity, args.debtorState, args.debtorPostalCode].filter(Boolean).join(', '),
    args.debtorPhone,
    args.debtorEmail,
  ].filter(Boolean);
  return lines.join('\n');
}

export function fillLitigation(template: string, args: LitigationLetterArgs): string {
  const map: Record<string, string> = {
    '{{DEBTOR_NAME}}': args.debtorName,
    '{{DATE}}': args.date,
    '{{PLAINTIFF_NAME}}': args.plaintiffName,
    '{{PLAINTIFF_ADDRESS}}': args.plaintiffAddress || '[PLAINTIFF ADDRESS]',
    '{{PLAINTIFF_LAW_FIRM}}': args.plaintiffLawFirm || '[PLAINTIFF LAW FIRM]',
    '{{PLAINTIFF_LAW_FIRM_ADDRESS}}': args.plaintiffLawFirmAddress || '[PLAINTIFF LAW FIRM ADDRESS]',
    '{{PLAINTIFF_ATTORNEY}}': args.plaintiffAttorneyName || '[PLAINTIFF ATTORNEY]',
    '{{PLAINTIFF_ATTORNEY_BAR}}': args.plaintiffAttorneyBarNumber || '[BAR #]',
    '{{ORIGINAL_CREDITOR}}': args.originalCreditorName || args.plaintiffName,
    '{{DEBT_COLLECTOR}}': args.debtCollectorName || args.plaintiffLawFirm || args.plaintiffName,
    '{{CASE_NUMBER}}': args.caseNumber || '[CASE NUMBER]',
    '{{COURT_NAME}}': args.courtName || '[COURT NAME]',
    '{{JUDGE_NAME}}': args.judgeName || '[JUDGE]',
    '{{ACCOUNT_NUMBER}}': args.accountNumber || '[ACCOUNT #]',
    '{{LOAN_ID}}': args.loanId || '[LOAN ID]',
    '{{BORROWER_ID}}': args.borrowerId || '[BORROWER ID]',
    '{{AFFIDAVIT_STATE}}': args.affidavitState || args.debtorState || '[STATE]',
    '{{AFFIDAVIT_COUNTY}}': args.affidavitCounty || '[COUNTY]',
    '{{AMOUNT_CLAIMED}}': args.amountClaimed || '[AMOUNT CLAIMED]',
    '{{DEBTOR_ADDRESS_BLOCK}}': litigationAddrBlock(args),
  };
  let out = template;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(k).join(v);
  }
  return out;
}
