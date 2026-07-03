import type { DebtLetterBuildArgs } from './debtLetterBuildArgs';
import { getLitigationBankAffidavitBody, toLitigationLetterArgs } from './litigation';

export function getAffidavitOfDisputeBody(
  args: DebtLetterBuildArgs | { debtorName: string; date: string; creditorOrPlaintiff: string },
): string {
  const full: DebtLetterBuildArgs =
    'creditorOrPlaintiff' in args
      ? { creditorName: args.creditorOrPlaintiff, debtorName: args.debtorName, date: args.date }
      : args;
  return getLitigationBankAffidavitBody(toLitigationLetterArgs(full));
}

export function getSummonsResponseAffidavitBody(args: {
  debtorName: string;
  date: string;
  caseNumber?: string;
  plaintiffName: string;
  courtName?: string;
  amountClaimed?: string;
  dateServed?: string;
  jurisdictionState?: string;
  collectorName?: string;
  documentFacts?: string[];
  plaintiffLawFirm?: string;
  plaintiffLawFirmAddress?: string;
  debtorState?: string;
  affidavitCounty?: string;
}): string {
  const body = getLitigationBankAffidavitBody(
    toLitigationLetterArgs({
      creditorName: args.plaintiffName,
      debtorName: args.debtorName,
      date: args.date,
      caseNumber: args.caseNumber,
      recipientName: args.plaintiffName,
      plaintiffLawFirm: args.plaintiffLawFirm || args.collectorName,
      plaintiffLawFirmAddress: args.plaintiffLawFirmAddress,
      debtCollectorName: args.collectorName,
      debtorState: args.jurisdictionState || args.debtorState,
      affidavitCounty: args.affidavitCounty,
      summonsContext: {
        courtName: args.courtName,
        amountClaimed: args.amountClaimed,
        collectorName: args.collectorName,
      },
    }),
  );
  const factsBlock =
    args.documentFacts?.length
      ? `\n\nADDITIONAL FACTS FROM UPLOADED SUMMONS/COMPLAINT:\n${args.documentFacts.map((f) => `- ${f}`).join('\n')}`
      : '';
  const servedLine = args.dateServed ? `\n\nI was served on or about ${args.dateServed}.` : '';
  return `${body}${servedLine}${factsBlock}`;
}
