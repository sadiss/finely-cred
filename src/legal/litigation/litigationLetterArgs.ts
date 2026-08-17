import { formatLetterSenderBlock } from '../../lib/letterSenderBlock';
import { formatDebtorReLine, resolveLetterMailRecipient } from '../../lib/letterMailingAddress';

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
  return formatLetterSenderBlock({
    name: args.debtorName,
    address1: args.debtorAddress1,
    address2: args.debtorAddress2,
    city: args.debtorCity,
    state: args.debtorState,
    postalCode: args.debtorPostalCode,
  });
}

/** Counsel / firm / creditor TO block — never the partner home address. */
export function litigationRecipientBlock(args: LitigationLetterArgs): string {
  const rec = resolveLetterMailRecipient({
    plaintiffLawFirm: args.plaintiffLawFirm,
    plaintiffLawFirmAddress: args.plaintiffLawFirmAddress,
    recipientName: args.plaintiffName,
    recipientAddress: args.plaintiffAddress,
    debtCollectorName: args.debtCollectorName,
    creditorName: args.plaintiffName,
    plaintiffAttorneyName: args.plaintiffAttorneyName,
    senderName: args.debtorName,
    senderAddress1: args.debtorAddress1,
    senderCity: args.debtorCity,
    senderPostalCode: args.debtorPostalCode,
  });
  return [rec.name, rec.address].filter(Boolean).join('\n');
}

export function fillLitigation(template: string, args: LitigationLetterArgs): string {
  const firmAddr =
    String(args.plaintiffLawFirmAddress || '').trim() ||
    String(args.plaintiffAddress || '').trim() ||
    '[CREDITOR / LAW FIRM MAILING ADDRESS — REQUIRED]';
  const firmName =
    String(args.plaintiffLawFirm || '').trim() ||
    String(args.debtCollectorName || '').trim() ||
    String(args.plaintiffName || '').trim() ||
    '[CREDITOR / LAW FIRM NAME — REQUIRED]';
  const plaintiffAddr =
    String(args.plaintiffAddress || '').trim() ||
    String(args.plaintiffLawFirmAddress || '').trim() ||
    '[CREDITOR / LAW FIRM MAILING ADDRESS — REQUIRED]';

  const map: Record<string, string> = {
    '{{DEBTOR_NAME}}': args.debtorName,
    '{{DATE}}': args.date,
    '{{PLAINTIFF_NAME}}': args.plaintiffName || firmName,
    '{{PLAINTIFF_ADDRESS}}': plaintiffAddr,
    '{{PLAINTIFF_LAW_FIRM}}': firmName,
    '{{PLAINTIFF_LAW_FIRM_ADDRESS}}': firmAddr,
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
    '{{DEBTOR_RE_LINE}}': formatDebtorReLine({
      debtorName: args.debtorName,
      debtorCity: args.debtorCity,
      debtorState: args.debtorState,
    }),
    '{{RECIPIENT_BLOCK}}': litigationRecipientBlock(args),
  };
  let out = template;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(k).join(v);
  }
  return out;
}
