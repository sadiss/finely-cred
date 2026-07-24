/**
 * Powerful FCRA / Metro 2 bureau & specialty-CRA letter bodies for foreclosure and
 * repossession credit-hub catalogs. Recipient is the bureau or specialty CRA (or
 * furnisher under § 623) — not a UCC / RESPA institution demand letter.
 */
import type { DebtLetterBuildArgs } from '../debtLetterBuildArgs';

function debtorBlock(args: DebtLetterBuildArgs): string {
  const lines = [
    args.debtorName,
    args.debtorAddress1,
    args.debtorAddress2,
    [args.debtorCity, args.debtorState, args.debtorPostalCode].filter(Boolean).join(', '),
    args.debtorPhone ? `Phone: ${args.debtorPhone}` : '',
    args.debtorEmail ? `Email: ${args.debtorEmail}` : '',
  ].filter(Boolean);
  return lines.join('\n') || '[YOUR FULL NAME AND MAILING ADDRESS]';
}

function bureauRecipient(args: DebtLetterBuildArgs, specialtyFallback: string): string {
  const name = args.recipientName || args.creditorName || specialtyFallback;
  const addr = args.recipientAddress || '[BUREAU / CRA DISPUTE MAILING ADDRESS]';
  return `${name}\n${addr}`;
}

function accountRef(args: DebtLetterBuildArgs): string {
  return args.accountNumber || args.loanId || '[ACCOUNT / LOAN NUMBER AS REPORTED]';
}

function furnisherName(args: DebtLetterBuildArgs): string {
  return args.originalCreditorName || args.creditorName || args.debtCollectorName || '[FURNISHER / SERVICER NAME AS REPORTED]';
}

function collateralLine(args: DebtLetterBuildArgs): string {
  return (
    args.summonsContext?.collateralDescription ||
    args.summonsContext?.propertyAddress ||
    '[PROPERTY ADDRESS OR VEHICLE / VIN AS APPLICABLE]'
  );
}

function closing(args: DebtLetterBuildArgs): string {
  return `This letter is educational consumer advocacy under the Fair Credit Reporting Act. It is not legal advice and does not create an attorney-client relationship. I reserve all rights, remedies, and defenses under federal and state law, including the right to escalate to the CFPB, state attorney general, and civil remedies under 15 U.S.C. § 1681n and § 1681o if inaccurate information continues to be reported after a reasonable opportunity to reinvestigate.

Please confirm receipt and provide written results of your reinvestigation, including method of verification, within the time required by law.

Sincerely,

${args.debtorName}`;
}

function evidenceListRepo(): string {
  return `SUPPORTING EVIDENCE REQUESTED FOR CREDIT-REPORTING ACCURACY (attach what you have; request what is missing from the furnisher via the bureau process)
I am not using this letter as a UCC Article 9 demand to the lender or repo company. The following items are relevant because they bear on whether the reported status, balance, dates, and remarks are accurate and verifiable:

A. Notice of sale / disposition notice and proof of commercially reasonable sale procedures.
B. Sale receipt, bill of sale, or auction confirmation showing sale price and date.
C. Post-sale deficiency or surplus accounting (principal, interest, fees, sale proceeds, storage, reconditioning, credits).
D. Proof of lawful repossession and any reinstatement / redemption notices claimed.
E. Metro 2 / electronic reporting history for Account Status, Payment Rating, Special Comment, Balance, Amount Past Due, Date of First Delinquency, Charge-off Date, and Compliance Condition codes.
F. Government-issued photo ID and proof of current address (for identity matching).
G. Marked copy of the consumer report page(s) showing the disputed tradeline.`;
}

function evidenceListFc(): string {
  return `SUPPORTING EVIDENCE REQUESTED FOR CREDIT-REPORTING ACCURACY (attach what you have)
I am not using this letter as a RESPA QWR or foreclosure defense pleading to the servicer. The following items are relevant because they bear on whether the reported foreclosure status, balance, dates, public-record entries, and remarks are accurate and verifiable:

A. Trustee / sheriff sale confirmation, deed upon sale, or recorded foreclosure disposition.
B. Loan payment history and escrow accounting through the date of foreclosure or reported default.
C. Notice of default, notice of sale, and any loss-mitigation / dual-tracking correspondence that contradicts the reported status.
D. Judgment, dismissal, or other court docket entries if a public-record foreclosure is reported.
E. Metro 2 / electronic reporting history for Account Status, Payment History Profile, Balance, Amount Past Due, Date of First Delinquency, Special Comment / foreclosure codes, and Compliance Condition codes.
F. Government-issued photo ID and proof of current address.
G. Marked copy of the consumer report page(s) showing the disputed mortgage/foreclosure item.`;
}

/** Existing id: repossession_credit_report_repo */
export function getRepoWrongfulReportingBureauBody(args: DebtLetterBuildArgs): string {
  const bureau = bureauRecipient(args, '[EQUIFAX / EXPERIAN / TRANSUNION — CONSUMER DISPUTE DEPARTMENT]');
  const acct = accountRef(args);
  const furnisher = furnisherName(args);
  const collateral = collateralLine(args);

  return `${debtorBlock(args)}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${bureau}

RE: FORMAL DISPUTE AND DEMAND FOR REINVESTIGATION UNDER FCRA § 611
    Inaccurate Repossession / Auto Loan Tradeline Reporting
    Consumer: ${args.debtorName}
    Furnisher as reported: ${furnisher}
    Account / Loan as reported: ${acct}
    Collateral reference: ${collateral}
    Alleged amount as reported: ${args.summonsContext?.amountClaimed || '[BALANCE / PAST DUE AS SHOWN ON REPORT]'}

To Whom It May Concern:

I am a consumer with a file maintained by your company. Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681i(a)(1)(A) (FCRA § 611), I formally dispute the accuracy, completeness, and verifiability of the repossession-related tradeline identified above. Under 15 U.S.C. § 1681e(b), you must follow reasonable procedures to assure maximum possible accuracy. Under § 1681i(a)(5)(A), information that cannot be verified must be deleted.

This is not an admission of liability for any deficiency, not a UCC demand to a secured party, and not a waiver of any rights. It is a credit-reporting accuracy dispute directed to you as a consumer reporting agency.

I. SPECIFIC INACCURACIES DISPUTED (edit to match your report)
1. Account Status / Special Comment inaccurately reflects repossession, charge-off, collection, or deficiency status that is not true, not current, or not verifiable as reported.
2. Current Balance, High Credit, and/or Amount Past Due do not match any verifiable post-repossession accounting after sale proceeds, fees, credits, insurance recoveries, and lawful adjustments.
3. Date of First Delinquency (DOFD), Date of Last Payment, Date Opened, and/or Charge-off Date are incorrect, incomplete, or inconsistently reported across bureaus.
4. Payment History Profile shows late marks, charge-off months, or repossession months that are inaccurate or not supported by account-level records.
5. The tradeline continues to report a collectible balance or misleading collection activity after disposition of collateral without competent verification of the deficiency calculation.
6. Any remark, narrative, or Metro 2 compliance condition code implying wrongful default, voluntary surrender, or repossession is disputed to the extent it is inaccurate or unverifiable.

II. REINVESTIGATION DEMANDS — 15 U.S.C. § 1681i
Within the time required by law (generally 30 days, subject to statutory extensions), you must:
1. Conduct a reasonable reinvestigation of each disputed field with the furnisher.
2. Review all relevant information I submit with this dispute.
3. Delete or modify any information that is inaccurate, incomplete, or cannot be verified.
4. Provide me a written description of the results of the reinvestigation.
5. Provide the method of verification used, including the name, business address, and telephone number of any furnisher contacted, as required by § 1681i(a)(6)(B)(iii).
6. If information is deleted, notify me and, upon request, notify any person designated who received the report within the prior time period required by statute.

III. METHOD OF VERIFICATION — DO NOT RUBBER-STAMP
A mere confirmation from an automated e-OSCAR / Metro 2 response that “data is verified” without account-level review of sale accounting, notices, and status codes is not a reasonable reinvestigation under § 1681i when I have identified specific field-level inaccuracies. Demand that the furnisher produce or confirm:
• Original contract / security agreement identifying this account;
• Lawful repossession and disposition notices;
• Sale receipt / auction proceeds;
• Itemized deficiency ledger;
• Exact Metro 2 codes furnished for status, comments, DOFD, and balance.

IV. REQUESTED CORRECTIVE ACTION
A. Delete the entire tradeline if the repossession status, balance, or ownership of the reported obligation cannot be verified with account-level competence; OR
B. Correct every inaccurate field (status, balance, past due, DOFD, payment history, special comments, charge-off) to match verifiable facts; AND
C. Cease reporting any unverifiable deficiency as an open collectible balance; AND
D. Update all consumer files and provide a corrected consumer report free of charge as required after a successful dispute.

${evidenceListRepo()}

V. PRESERVATION AND ESCALATION
Please preserve all dispute records, furnisher responses, audit trails, and e-OSCAR / Metro 2 communications related to this reinvestigation. If you verify without competent documentation, I will treat the verification as unreasonable and may escalate to the Consumer Financial Protection Bureau and pursue remedies available under the FCRA.

${closing(args)}`;
}

/** repossession_bureau_tradeline_dispute */
export function getRepoBureauTradelineDisputeBody(args: DebtLetterBuildArgs): string {
  const bureau = bureauRecipient(args, '[EQUIFAX / EXPERIAN / TRANSUNION — CONSUMER DISPUTE DEPARTMENT]');
  const acct = accountRef(args);
  const furnisher = furnisherName(args);

  return `${debtorBlock(args)}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${bureau}

RE: FCRA § 611 FIELD-LEVEL DISPUTE — REPOSSESSION TRADELINE
    Metro 2 Accuracy: Account Status, Payment History, Balance, DOFD, Charge-Off
    Consumer: ${args.debtorName}
    Furnisher: ${furnisher}
    Account: ${acct}

To Whom It May Concern:

Under 15 U.S.C. § 1681i(a)(1)(A) and § 1681e(b), I dispute the following fields on the repossession-related tradeline and demand a field-by-field reinvestigation. Maximum possible accuracy requires that each Metro 2-relevant data element be correct and verifiable — not merely that “an account exists.”

DISPUTED FIELDS (mark and attach report pages; edit values to match your report)
1. Account Status Code — reported as [e.g., repossession / charge-off / collection]: I dispute accuracy and verifiability.
2. Payment History Profile / Payment Rating — late marks and repo/charge-off months disputed as inaccurate or unverifiable.
3. Current Balance — disputed as inflated, outdated, or inconsistent with post-sale accounting.
4. Amount Past Due — disputed.
5. Date of First Delinquency — disputed as incorrect; this date controls obsolescence under § 1681c and must be accurate.
6. Charge-off Date / Date Closed — disputed if inconsistent with actual disposition.
7. Special Comment / Compliance Condition / Consumer Information Indicator — any repo-related remark is disputed to the extent inaccurate.
8. High Credit / Credit Limit — disputed if misstated.
9. Original Creditor / Portfolio name — disputed if the reported furnisher/owner does not match the account-level chain.

REINVESTIGATION INSTRUCTIONS
For each disputed field, either:
(a) Correct the field to the accurate value supported by account-level records; or
(b) Delete the field or the entire tradeline if it cannot be verified.

Provide method of verification under § 1681i(a)(6)(B)(iii). Identify the specific records the furnisher used to “verify” each field. If the furnisher relies solely on a recycled electronic status without sale accounting or DOFD support, delete the unverifiable data.

REQUESTED OUTCOME
- Correct Metro 2 status and comments to reflect only verifiable facts; or
- Delete the tradeline in full if repossession status, DOFD, or balance cannot be verified; and
- Issue updated consumer disclosure showing corrections.

${evidenceListRepo()}

${closing(args)}`;
}

/** repossession_deficiency_bureau_dispute */
export function getRepoDeficiencyBureauDisputeBody(args: DebtLetterBuildArgs): string {
  const bureau = bureauRecipient(args, '[EQUIFAX / EXPERIAN / TRANSUNION — CONSUMER DISPUTE DEPARTMENT]');
  const acct = accountRef(args);
  const furnisher = furnisherName(args);
  const amount = args.summonsContext?.amountClaimed || '[DEFICIENCY BALANCE AS REPORTED]';

  return `${debtorBlock(args)}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${bureau}

RE: FCRA § 611 DISPUTE — REPOSSESSION DEFICIENCY BALANCE REPORTING
    Consumer: ${args.debtorName}
    Furnisher: ${furnisher}
    Account: ${acct}
    Reported deficiency / balance: ${amount}

To Whom It May Concern:

I dispute the accuracy and verifiability of the deficiency balance (and related status) reported on my consumer file after repossession and disposition of collateral. This is a reinvestigation request under 15 U.S.C. § 1681i. Under § 1681e(b), you must assure maximum possible accuracy of the amount and status reported.

WHY THE REPORTED DEFICIENCY IS DISPUTED
1. The reported balance does not credit verifiable sale proceeds, insurance recoveries, rebates, or other credits required for an accurate post-disposition balance.
2. Fees, storage, reconditioning, attorney fees, or collection add-ons included in the reported balance are not itemized or not verified as contractually/authorized and actually incurred.
3. The Account Status implies an open, collectible deficiency without competent verification of commercially reasonable disposition accounting.
4. Date of First Delinquency, charge-off date, and payment history tied to the deficiency are inaccurate or inconsistently reported.
5. To the extent the furnisher cannot produce a sale receipt and itemized deficiency ledger matching the reported amount, the balance is unverifiable and must be deleted under § 1681i(a)(5)(A).

DEMANDS
1. Reinvestigate the balance, amount past due, account status, and related Metro 2 codes with the furnisher.
2. Require the furnisher to substantiate the deficiency with sale price, sale date, itemized fees, and credits — not a summary balance alone.
3. Delete or correct the balance and status if the deficiency cannot be verified account-level.
4. Provide written results and method of verification, including furnisher contact information.

NOTE ON EVIDENCE vs. INSTITUTION LETTERS
Sale receipt and accounting demands directed to the finance company or repo company belong in Debt Letters (UCC track). Here, those documents are used only as evidence of credit-reporting inaccuracy. Your duty is to reinvestigate reporting accuracy under the FCRA.

${evidenceListRepo()}

${closing(args)}`;
}

/** repossession_specialty_cra_dispute */
export function getRepoSpecialtyCraDisputeBody(args: DebtLetterBuildArgs): string {
  const cra = bureauRecipient(
    args,
    '[SPECIALTY CONSUMER REPORTING AGENCY — e.g., ChexSystems / LexisNexis / Autocheck-style CRA]',
  );
  const acct = accountRef(args);
  const furnisher = furnisherName(args);

  return `${debtorBlock(args)}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${cra}

RE: FCRA § 611 DISPUTE — SPECIALTY CONSUMER REPORT
    Repossession / Auto-Related Negative Information
    Consumer: ${args.debtorName}
    Furnisher / Source as reported: ${furnisher}
    Reference: ${acct}

To Whom It May Concern:

You are a consumer reporting agency within the meaning of 15 U.S.C. § 1681a. I dispute the accuracy, completeness, and verifiability of repossession- or auto-related information in my specialty consumer file. I demand a reasonable reinvestigation under 15 U.S.C. § 1681i(a)(1)(A) and maximum possible accuracy under § 1681e(b).

DISPUTED INFORMATION
1. Any repossession, involuntary surrender, charge-off, deficiency, or auto-related negative item that is inaccurate, outdated, belonging to another consumer, or unverifiable.
2. Dates, balances, status codes, and narrative remarks that do not match account-level records.
3. Mixed-file / identity mismatch if this item does not belong to me.

DEMANDS
1. Reinvestigate each disputed item with the original source/furnisher.
2. Delete information that cannot be verified.
3. Correct remaining information to match verifiable facts.
4. Provide written results, a description of the procedure used, and method of verification under § 1681i(a)(6).
5. If you maintain a separate file from the nationwide CRAs, update that file and disclose the corrected report to me.

Please treat sale receipts, notices of sale, and deficiency ledgers (if enclosed) as evidence of reporting inaccuracy — not as a substitute for UCC remedies against the secured party.

${closing(args)}`;
}

/** repossession_furnisher_reporting_dispute */
export function getRepoFurnisherReportingDisputeBody(args: DebtLetterBuildArgs): string {
  const furnisher = args.recipientName || furnisherName(args);
  const addr = args.recipientAddress || '[FURNISHER DISPUTE / CREDIT REPORTING DEPARTMENT ADDRESS]';
  const acct = accountRef(args);

  return `${debtorBlock(args)}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${furnisher}
${addr}

RE: FCRA § 623 DIRECT DISPUTE — REPOSSESSION / DEFICIENCY REPORTING ACCURACY
    (Credit-reporting dispute — not a UCC Article 9 demand letter)
    Consumer: ${args.debtorName}
    Account: ${acct}

To Whom It May Concern:

This is a direct dispute under the Fair Credit Reporting Act, 15 U.S.C. § 1681s-2 (FCRA § 623), concerning the accuracy of information you furnished to one or more consumer reporting agencies regarding repossession, charge-off, and/or deficiency on the above account.

I dispute that the information you are furnishing is accurate and complete. Under § 1681s-2(a), you must not furnish information you know or have reasonable cause to believe is inaccurate. Under § 1681s-2(b), upon notice of a dispute from a CRA, you must conduct an investigation, review all relevant information, and report corrections to all CRAs.

SPECIFIC REPORTING INACCURACIES
1. Repossession / account status codes are inaccurate or unverifiable as furnished.
2. Reported balance / deficiency does not reflect verifiable sale proceeds and credits.
3. Date of First Delinquency, charge-off date, and payment history are inaccurate.
4. Special comments or compliance codes implying repo or collectible deficiency are disputed.

DEMANDS
1. Investigate each disputed data element using account-level records (contract, notices, sale receipt, deficiency ledger).
2. Correct or delete inaccurate furnishing to Equifax, Experian, TransUnion, and any specialty CRA to which you report.
3. Cease furnishing unverifiable deficiency balances.
4. Provide me written confirmation of the investigation results and the exact corrected Metro 2 values you will furnish going forward.

This letter does not waive UCC, FDCPA, or state-law claims. Separate Debt Letters address reinstatement, sale notice, and deficiency demands to the institution. This letter’s sole purpose is credit-reporting accuracy under FCRA § 623.

${closing(args)}`;
}

/** Existing id: foreclosure_post_foreclosure_fcr */
export function getForeclosurePostFcraBureauBody(args: DebtLetterBuildArgs): string {
  const bureau = bureauRecipient(args, '[EQUIFAX / EXPERIAN / TRANSUNION — CONSUMER DISPUTE DEPARTMENT]');
  const acct = accountRef(args);
  const furnisher = furnisherName(args);
  const property = collateralLine(args);

  return `${debtorBlock(args)}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${bureau}

RE: FORMAL DISPUTE AND DEMAND FOR REINVESTIGATION UNDER FCRA § 611
    Inaccurate Post-Foreclosure / Mortgage Tradeline & Related Reporting
    Consumer: ${args.debtorName}
    Furnisher / Servicer as reported: ${furnisher}
    Account / Loan as reported: ${acct}
    Property reference: ${property}
    Alleged amount as reported: ${args.summonsContext?.amountClaimed || '[BALANCE / PAST DUE AS SHOWN ON REPORT]'}

To Whom It May Concern:

I am a consumer with a file maintained by your company. Pursuant to 15 U.S.C. § 1681i(a)(1)(A) (FCRA § 611), I formally dispute the accuracy, completeness, and verifiability of the foreclosure-related information identified above. Under 15 U.S.C. § 1681e(b), you must follow reasonable procedures to assure maximum possible accuracy. Under § 1681i(a)(5)(A), information that cannot be verified must be deleted.

This is not an admission of the debt, not a RESPA Qualified Written Request to the servicer, and not a waiver of foreclosure defenses. It is a credit-reporting accuracy dispute directed to you as a consumer reporting agency.

I. SPECIFIC INACCURACIES DISPUTED (edit to match your report)
1. Account Status / Special Comment inaccurately reports foreclosure, foreclosure proceedings, charge-off, or collection status that is not true, not current, or not verifiable.
2. Current Balance and Amount Past Due do not match verifiable loan accounting through sale, deed-in-lieu, short sale, modification, or other disposition.
3. Date of First Delinquency, Date of Last Payment, and related delinquency dates are incorrect — these dates control obsolescence and scoring impact and must be accurate.
4. Payment History Profile shows foreclosure months, 120/180-day lates, or charge-off patterns that are inaccurate or unverifiable.
5. Public-record foreclosure entries, civil remarks, or narratives conflict with official land records or court dockets, or belong to another consumer (mixed file).
6. Post-foreclosure reporting continues to show an open mortgage balance or misleading collection status without competent verification.

II. REINVESTIGATION DEMANDS — 15 U.S.C. § 1681i
Within the statutory period, you must:
1. Conduct a reasonable reinvestigation of each disputed item with the furnisher and, for public records, with the official source.
2. Review all relevant information I submit.
3. Delete or modify information that is inaccurate, incomplete, or unverifiable.
4. Provide written results of the reinvestigation.
5. Provide method of verification, including the name, address, and telephone number of any furnisher contacted (§ 1681i(a)(6)(B)(iii)).
6. If information is deleted, comply with notification duties under § 1681i.

III. METHOD OF VERIFICATION — SUBSTANCE OVER AUTOMATION
Do not treat an automated “verified” response as reasonable when I have identified specific field-level conflicts with payment history, sale documents, or public records. The furnisher must substantiate status codes, DOFD, balance, and foreclosure remarks with account-level and recorded documents.

IV. REQUESTED CORRECTIVE ACTION
A. Delete unverifiable foreclosure tradeline data and/or public-record foreclosure entries; OR
B. Correct status, balance, past due, DOFD, payment history, and remarks to match verifiable facts; AND
C. Ensure post-sale reporting does not misleadingly show an open collectible mortgage balance if that is inaccurate; AND
D. Provide a corrected consumer report as required after dispute resolution.

${evidenceListFc()}

V. PRESERVATION AND ESCALATION
Preserve all dispute audit trails, furnisher responses, and public-record vendor communications. Unreasonable verification may be escalated to the CFPB and addressed under FCRA civil remedies.

${closing(args)}`;
}

/** foreclosure_bureau_tradeline_dispute */
export function getForeclosureBureauTradelineDisputeBody(args: DebtLetterBuildArgs): string {
  const bureau = bureauRecipient(args, '[EQUIFAX / EXPERIAN / TRANSUNION — CONSUMER DISPUTE DEPARTMENT]');
  const acct = accountRef(args);
  const furnisher = furnisherName(args);

  return `${debtorBlock(args)}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${bureau}

RE: FCRA § 611 FIELD-LEVEL DISPUTE — FORECLOSURE / MORTGAGE TRADELINE
    Metro 2 Accuracy: Status, Balance, DOFD, Payment History, Foreclosure Codes
    Consumer: ${args.debtorName}
    Furnisher: ${furnisher}
    Loan / Account: ${acct}

To Whom It May Concern:

Under 15 U.S.C. § 1681i and § 1681e(b), I dispute the following fields on the mortgage/foreclosure tradeline and demand a field-by-field reinvestigation for maximum possible accuracy.

DISPUTED FIELDS
1. Account Status / Foreclosure-related status code — disputed as inaccurate or unverifiable.
2. Payment History Profile — disputed late marks and foreclosure-coded months.
3. Current Balance / Amount Past Due — disputed.
4. Date of First Delinquency — disputed; must be accurate for § 1681c obsolescence analysis.
5. Date Closed / Charge-off / Foreclosure completion date — disputed if inconsistent with recorded disposition.
6. Special Comment / Compliance Condition codes referencing foreclosure — disputed to the extent inaccurate.
7. High Credit / Original Loan Amount — disputed if misstated.
8. Scheduled Monthly Payment — disputed if obsolete or wrong after disposition.

REINVESTIGATION INSTRUCTIONS
Correct each field to verifiable values or delete the field/tradeline if unverifiable. Provide method of verification identifying the specific records reviewed. Automated confirmation without loan-level history and disposition documents is insufficient in light of this field-level dispute.

REQUESTED OUTCOME
- Accurate Metro 2 foreclosure/mortgage fields only; or
- Full deletion if status, DOFD, or balance cannot be verified; and
- Updated consumer disclosure reflecting corrections.

${evidenceListFc()}

${closing(args)}`;
}

/** foreclosure_public_record_remark_dispute */
export function getForeclosurePublicRecordRemarkDisputeBody(args: DebtLetterBuildArgs): string {
  const bureau = bureauRecipient(args, '[EQUIFAX / EXPERIAN / TRANSUNION — CONSUMER DISPUTE DEPARTMENT]');
  const caseNo = args.caseNumber || '[CASE / DOCKET NUMBER AS REPORTED OR N/A]';
  const property = collateralLine(args);

  return `${debtorBlock(args)}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${bureau}

RE: FCRA § 611 DISPUTE — FORECLOSURE PUBLIC RECORD / REMARK
    Consumer: ${args.debtorName}
    Reported case / docket: ${caseNo}
    Property reference: ${property}

To Whom It May Concern:

I dispute the accuracy and verifiability of the foreclosure-related public record and/or consumer-report remark appearing on my file. Under 15 U.S.C. § 1681i(a)(1)(A), reinvestigate. Under § 1681i(a)(5)(A), delete if unverifiable. Under § 1681c, delete obsolete public-record information.

DISPUTED PUBLIC RECORD / REMARK ELEMENTS
1. Existence of a foreclosure public record associated with my identity — disputed if incorrect or mixed-file.
2. Filing date, disposition date, case number, court name, and outcome — disputed to the extent they do not match official records.
3. Narrative remarks or tradeline comments implying foreclosure judgment, sale, or deficiency that are inaccurate or misleading.
4. Any public-record vendor data that is incomplete, duplicated, or belongs to another consumer.

DEMANDS
1. Reinvestigate with the official court / land-records source (not solely a recycled vendor feed).
2. Correct all fields to match certified or official records, or delete the item if it cannot be verified as mine and accurate.
3. Remove obsolete foreclosure public records beyond the reporting period allowed by § 1681c.
4. Provide method of verification and written results.

Enclosures may include docket printouts, recorded deeds, dismissal orders, or marked report pages. This dispute concerns credit-report accuracy only; foreclosure litigation responses belong in Debt Letters.

${closing(args)}`;
}

/** foreclosure_specialty_cra_dispute */
export function getForeclosureSpecialtyCraDisputeBody(args: DebtLetterBuildArgs): string {
  const cra = bureauRecipient(
    args,
    '[SPECIALTY CRA / HOUSING OR PUBLIC-RECORD CONSUMER REPORTING AGENCY — e.g., LexisNexis]',
  );
  const acct = accountRef(args);
  const property = collateralLine(args);

  return `${debtorBlock(args)}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${cra}

RE: FCRA § 611 DISPUTE — SPECIALTY / HOUSING / PUBLIC-RECORD CONSUMER REPORT
    Foreclosure-Related Information
    Consumer: ${args.debtorName}
    Reference: ${acct}
    Property: ${property}

To Whom It May Concern:

You are a consumer reporting agency under 15 U.S.C. § 1681a. I dispute foreclosure-, mortgage-, or housing-related information in my specialty consumer report as inaccurate, incomplete, obsolete, or unverifiable. I demand reinvestigation under § 1681i and maximum possible accuracy under § 1681e(b).

DISPUTED ITEMS
1. Foreclosure filings, sales, judgments, or housing negatives that are wrong, outdated, or not mine.
2. Dates, case numbers, property identifiers, and status narratives that conflict with official records.
3. Mixed-file associations linking another person’s foreclosure to my identity.

DEMANDS
1. Reinvestigate with original sources.
2. Delete unverifiable or obsolete items.
3. Correct remaining data.
4. Provide written results and method of verification.
5. Disclose the corrected specialty report to me.

${evidenceListFc()}

${closing(args)}`;
}

/** foreclosure_furnisher_reporting_dispute */
export function getForeclosureFurnisherReportingDisputeBody(args: DebtLetterBuildArgs): string {
  const furnisher = args.recipientName || furnisherName(args);
  const addr = args.recipientAddress || '[SERVICER / FURNISHER CREDIT REPORTING DISPUTE ADDRESS]';
  const acct = accountRef(args);

  return `${debtorBlock(args)}

Date: ${args.date}

Via Certified Mail — Return Receipt Requested

${furnisher}
${addr}

RE: FCRA § 623 DIRECT DISPUTE — FORECLOSURE / MORTGAGE REPORTING ACCURACY
    (Credit-reporting dispute — not a RESPA QWR or loss-mitigation application)
    Consumer: ${args.debtorName}
    Loan / Account: ${acct}
    Property: ${collateralLine(args)}

To Whom It May Concern:

This is a direct dispute under 15 U.S.C. § 1681s-2 (FCRA § 623) concerning information you furnished to consumer reporting agencies about foreclosure status, delinquency, balance, and related mortgage reporting on the above account.

Under § 1681s-2(a), you must furnish accurate information. Under § 1681s-2(b), after CRA dispute notice you must investigate, review all relevant information, and report corrections to all CRAs that received the data.

SPECIFIC REPORTING INACCURACIES
1. Foreclosure / account status codes are inaccurate or unverifiable.
2. Reported balance and past-due amounts do not match verifiable loan accounting through disposition.
3. Date of First Delinquency and payment history are inaccurate.
4. Special comments or compliance codes referencing foreclosure are disputed.

DEMANDS
1. Investigate using the complete loan history, disposition documents, and Metro 2 mapping for each disputed field.
2. Correct or delete inaccurate furnishing to Equifax, Experian, TransUnion, and any specialty CRA.
3. Confirm in writing the corrected values you will furnish going forward.
4. Do not continue furnishing unverifiable foreclosure status or balances.

This letter does not waive RESPA, TILA, FDCPA, or foreclosure defenses. Servicer QWRs, dual-track demands, and loss mitigation belong in Debt Letters. This letter addresses credit-reporting accuracy only.

${closing(args)}`;
}

/** Dispatch by catalog id for generateCatalogLetter OUTLINE_SECTIONS / full custom bodies. */
export function getCreditCollateralBureauBody(
  catalogId: string,
  args: DebtLetterBuildArgs,
): string | null {
  switch (catalogId) {
    case 'repossession_credit_report_repo':
      return getRepoWrongfulReportingBureauBody(args);
    case 'repossession_bureau_tradeline_dispute':
      return getRepoBureauTradelineDisputeBody(args);
    case 'repossession_deficiency_bureau_dispute':
      return getRepoDeficiencyBureauDisputeBody(args);
    case 'repossession_specialty_cra_dispute':
      return getRepoSpecialtyCraDisputeBody(args);
    case 'repossession_furnisher_reporting_dispute':
      return getRepoFurnisherReportingDisputeBody(args);
    case 'foreclosure_post_foreclosure_fcr':
      return getForeclosurePostFcraBureauBody(args);
    case 'foreclosure_bureau_tradeline_dispute':
      return getForeclosureBureauTradelineDisputeBody(args);
    case 'foreclosure_public_record_remark_dispute':
      return getForeclosurePublicRecordRemarkDisputeBody(args);
    case 'foreclosure_specialty_cra_dispute':
      return getForeclosureSpecialtyCraDisputeBody(args);
    case 'foreclosure_furnisher_reporting_dispute':
      return getForeclosureFurnisherReportingDisputeBody(args);
    default:
      return null;
  }
}
