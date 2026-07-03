import type { DebtLetterBuildArgs } from '../debtLetterBuildArgs';

export function getForeclosureQualifiedWrittenRequestBody(args: DebtLetterBuildArgs): string {
  const servicer = args.recipientName || args.creditorName || '[MORTGAGE SERVICER]';
  const addr = args.recipientAddress || '[SERVICER QUALIFIED WRITTEN REQUEST ADDRESS]';
  const loan = args.accountNumber || args.loanId || '[LOAN NUMBER]';

  return `${args.debtorName}
${[args.debtorAddress1, args.debtorAddress2, args.debtorCity, args.debtorState, args.debtorPostalCode].filter(Boolean).join('\n') || '[YOUR ADDRESS]'}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${servicer}
${addr}

Re: QUALIFIED WRITTEN REQUEST — Loan No. ${loan}
    Property: ${args.summonsContext?.propertyAddress || '[PROPERTY ADDRESS]'}

NOTICE: THIS IS A QUALIFIED WRITTEN REQUEST UNDER 12 U.S.C. § 2605 (RESPA)

To Whom It May Concern:

I am the borrower on the above-referenced loan. This letter is a Qualified Written Request concerning the servicing of my mortgage.

Within the time required by federal law (and without imposing unreasonable fees), provide:

1. Complete payment history from origination to present, showing every payment, suspense, escrow application, fee, charge, and adjustment.
2. Current escrow analysis and explanation of any shortage or surplus.
3. Identification of the current note holder, trustee, and servicer, with copies of recorded assignments or endorsements sufficient to show standing.
4. Copies of any force-placed insurance policies, premiums, and notices.
5. Status of any loss mitigation, forbearance, or modification application (if any).
6. Name, direct phone, and email of a single point of contact for this loan.

If you are simultaneously pursuing foreclosure, confirm whether you are dual-tracking in violation of federal servicing rules and identify all counsel of record.

I do not waive any defense to foreclosure, any bankruptcy stay, SCRA protections, or any claims for servicing errors.

Sincerely,

${args.debtorName}`;
}
