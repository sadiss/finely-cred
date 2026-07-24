import type { BankruptcyLetterType, BankruptcyLetterSpec } from '../domain/bankruptcyLegal';

export type BankruptcyLetterArgs = {
  debtorName: string;
  date: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  bureauName?: string;
  courtName?: string;
  courtDistrict?: string;
  caseNumber?: string;
  chapter?: string;
  filingDate?: string;
  dischargeDate?: string;
  dismissalDate?: string;
  disposition?: string;
  creditorName?: string;
  accountRef?: string;
  foreclosureSaleDate?: string;
  mortgageCompany?: string;
  businessName?: string;
  removalGroundIds?: string[];
  clerkResponseSummary?: string;
};

function addr(a: BankruptcyLetterArgs) {
  // Name + mailing address (+ optional phone). Never auto-print email on letter paper.
  return [a.debtorName, a.address1, a.address2, [a.city, a.state, a.postalCode].filter(Boolean).join(', '), a.phone]
    .filter(Boolean)
    .join('\n');
}

export const BANKRUPTCY_LETTER_SPECS: BankruptcyLetterSpec[] = [
  {
    id: 'court_furnishing_inquiry',
    title: 'Bankruptcy Court — CRA Furnishing Inquiry',
    shortDescription: 'Ask clerk whether bankruptcy public record data is furnished to credit bureaus and how to obtain certified records.',
    whenToUse: ['Before bureau dispute', 'To document diligence', 'To obtain certified docket copies'],
    statutes: ['FCRA § 611 (consumer dispute context)', 'Bankruptcy court records procedures'],
    keyPrinciple: 'Clerk response supports your dispute file — pair with FCRA accuracy arguments, not deletion alone.',
  },
  {
    id: 'bureau_public_record_dispute',
    title: 'Bureau Dispute — Bankruptcy Public Record',
    shortDescription: 'Dispute inaccurate chapter, dates, case number, or disposition on public record section.',
    whenToUse: ['Public record does not match certified docket', 'Wrong chapter or filing year'],
    statutes: ['15 U.S.C. § 1681i', '15 U.S.C. § 1681e(b)'],
    keyPrinciple: 'Field-level accuracy dispute with certified court documents attached.',
  },
  {
    id: 'bureau_tradeline_discharge_dispute',
    title: 'Bureau Dispute — Post-Discharge Tradelines',
    shortDescription: 'Demand correction of included/discharged accounts still reporting balance or collection status.',
    whenToUse: ['After Chapter 7 or 13 discharge', 'Tradelines show balance on discharged debt'],
    statutes: ['11 U.S.C. § 524', '15 U.S.C. § 1681s-2', '15 U.S.C. § 1681i'],
    keyPrinciple: 'Discharged debts must report accurately — zero balance and proper bankruptcy remarks.',
  },
  {
    id: 'bureau_removal_grounds_dispute',
    title: 'Bureau Dispute — Full FCRA Removal Grounds (Bankruptcy)',
    shortDescription: 'Comprehensive § 611 letter citing statutory grounds to delete or correct bankruptcy reporting.',
    whenToUse: ['After court inquiry', 'Multiple inaccuracies', 'Unverifiable public record'],
    statutes: ['15 U.S.C. § 1681i(a)(1)(A)', '15 U.S.C. § 1681i(a)(5)(A)', '15 U.S.C. § 1681c(a)(1)', '11 U.S.C. § 524'],
    keyPrinciple: 'Statutory accuracy + verification failure — not “I don’t want it on my report.”',
  },
  {
    id: 'foreclosure_stay_notice',
    title: 'Foreclosure Counsel — Automatic Stay Notice',
    shortDescription: 'Notify mortgage holder/foreclosure attorney that bankruptcy was filed and automatic stay applies.',
    whenToUse: ['Petition filed before sale date', 'Chapter 7 or 13 stay protection'],
    statutes: ['11 U.S.C. § 362', 'Local bankruptcy rules'],
    keyPrinciple: 'Educational notice draft — confirm filing with licensed bankruptcy attorney immediately.',
  },
  {
    id: 'business_debt_worksheet_cover',
    title: 'Business Bankruptcy — Document Cover Letter',
    shortDescription: 'Cover letter for business debt schedule, creditor matrix, and Chapter 11 intake documents.',
    whenToUse: ['Business reorganization evaluation', 'Sending schedules to counsel'],
    statutes: ['11 U.S.C. Ch. 11', 'Bankruptcy Rules 1007, 2015'],
    keyPrinciple: 'Organize business liabilities — counsel determines entity vs personal liability.',
  },
];

export function getBankruptcyLetterBody(type: BankruptcyLetterType, a: BankruptcyLetterArgs): string {
  switch (type) {
    case 'court_furnishing_inquiry':
      return `${a.date}

Clerk of Court
${a.courtName || '[UNITED STATES BANKRUPTCY COURT — DISTRICT]'}
${a.courtDistrict || '[ADDRESS]'}

RE: Public Record / Bankruptcy Reporting Inquiry — ${a.debtorName}

To the Clerk:

I am writing to request written clarification regarding public record data related to bankruptcy filings and whether any information from this court is furnished or provided directly or indirectly to consumer reporting agencies (Equifax, Experian, TransUnion) or their vendors.

Please advise:

1. Whether this court directly furnishes bankruptcy or public record data to any consumer reporting agency, and if so, which agencies or vendors.

2. The procedure for obtaining certified copies of the petition, docket sheet, discharge order, dismissal order, or other disposition documents for consumer report accuracy disputes under the Fair Credit Reporting Act, 15 U.S.C. § 1681 et seq.

3. The appropriate department, contact person, and fees for certified copies.

4. Whether a case search under my name (${a.debtorName})${a.caseNumber ? ` and case number ${a.caseNumber}` : ''} shows any filing associated with my identity.

This request is for record-keeping and consumer-report accuracy purposes. Please respond in writing.

Thank you.

${addr(a)}`;

    case 'bureau_public_record_dispute':
      return `${a.date}

${a.bureauName || '[CREDIT BUREAU]'}
Consumer Dispute Department

RE: FCRA § 611 Dispute — Bankruptcy Public Record Inaccuracy

To Whom It May Concern:

I am disputing the accuracy of the bankruptcy public record reported on my consumer file.

Reported (inaccurate) information:
- Case number: ${a.caseNumber || '[AS REPORTED]'}
- Chapter: ${a.chapter || '[AS REPORTED]'}
- Filing date: ${a.filingDate || '[AS REPORTED]'}
- Disposition: ${a.disposition || '[AS REPORTED]'}

Correct information per court records (attached):
- Case number: ${a.caseNumber || '[CORRECT]'}
- Chapter: ${a.chapter || '[CORRECT]'}
- Filing date: ${a.filingDate || '[CORRECT]'}
- Discharge/Dismissal date: ${a.dischargeDate || a.dismissalDate || '[CORRECT]'}

Under 15 U.S.C. § 1681i(a)(1)(A), I request reinvestigation. Under § 1681i(a)(5)(A), if you cannot verify accuracy, the item must be deleted.

I have attached certified court documents. Please correct or delete within 30 days and provide method of verification.

${addr(a)}`;

    case 'bureau_tradeline_discharge_dispute':
      return `${a.date}

${a.bureauName || '[CREDIT BUREAU]'}

RE: FCRA Dispute — Post-Discharge Tradeline Reporting (11 U.S.C. § 524)

I dispute inaccurate reporting of the following account after bankruptcy discharge:

Creditor/Furnisher: ${a.creditorName || '[CREDITOR]'}
Account: ${a.accountRef || '[ACCOUNT REF]'}
Bankruptcy case: ${a.caseNumber || '[CASE #]'} — Chapter ${a.chapter || '[7/13]'}
Discharge date: ${a.dischargeDate || '[DISCHARGE DATE]'}

The tradeline reports a balance, past-due status, or collection activity inconsistent with discharge. Under 11 U.S.C. § 524, the discharged debt is not legally collectible. Under 15 U.S.C. § 1681s-2 and § 1681i, furnishers and bureaus must report accurately.

Requested action: Correct to zero balance with appropriate bankruptcy compliance/status codes reflecting discharge, or delete if unverifiable.

Enclosed: discharge order and relevant schedule.

${addr(a)}`;

    case 'bureau_removal_grounds_dispute':
      return getFullRemovalDisputeBody(a);

    case 'foreclosure_stay_notice':
      return `${a.date}

${a.mortgageCompany || '[MORTGAGE SERVICER / FORECLOSURE COUNSEL]'}
${a.creditorName || '[ADDRESS]'}

RE: Notice of Bankruptcy Filing and Automatic Stay — ${a.debtorName}

Please be advised that I filed a bankruptcy petition on ${a.filingDate || '[FILING DATE]'} in ${a.courtName || '[BANKRUPTCY COURT]'}, Case No. ${a.caseNumber || '[CASE NUMBER]'}.

Under 11 U.S.C. § 362, the automatic stay prohibits collection actions, including foreclosure sale scheduled for ${a.foreclosureSaleDate || '[SALE DATE]'}, absent further order of the court.

Please confirm in writing that the sale is cancelled or postponed pending bankruptcy court relief.

This notice is without admission of debt amount or waiver of rights.

${addr(a)}`;

    case 'business_debt_worksheet_cover':
      return `${a.date}

${a.courtName || '[BANKRUPTCY ATTORNEY / COUNSEL]'}

RE: Business Debt Documentation — ${a.businessName || a.debtorName}

Enclosed please find business debt schedules, creditor matrix, and supporting documents for evaluation of Chapter 11 reorganization (or alternative relief).

Business entity: ${a.businessName || '[BUSINESS NAME]'}
Contact: ${a.debtorName}
Phone: ${a.phone || '[PHONE]'}

Request: review liabilities, secured vs unsecured classification, and recommend filing strategy for business and personal guaranties.

${addr(a)}`;

    default:
      return getFullRemovalDisputeBody(a);
  }
}

function getFullRemovalDisputeBody(a: BankruptcyLetterArgs): string {
  return `${a.date}

${a.bureauName || '[EQUIFAX / EXPERIAN / TRANSUNION]'}
Consumer Dispute Department

RE: Fair Credit Reporting Act Dispute — Bankruptcy Public Record and Related Tradelines
     15 U.S.C. § 1681i(a)(1)(A), § 1681i(a)(5)(A), § 1681c(a)(1), § 1681e(b); 11 U.S.C. § 524

To Whom It May Concern:

I dispute the accuracy and verifiability of bankruptcy-related information on my consumer report. This is a reinvestigation request under FCRA § 611.

IDENTIFYING INFORMATION
Consumer: ${a.debtorName}
Case (if any): ${a.caseNumber || '[CASE NUMBER OR N/A]'}
Bureau file: [FILE NUMBER IF KNOWN]

GROUNDS FOR DELETION OR CORRECTION

1. MAXIMUM POSSIBLE ACCURACY (15 U.S.C. § 1681e(b))
   The reported bankruptcy public record and/or tradeline bankruptcy remarks are inaccurate, incomplete, or misleading compared to official court records enclosed.

2. REINVESTIGATION AND VERIFICATION (15 U.S.C. § 1681i(a)(1)(A))
   Reinvestigate with the court record source. Provide method of verification as required by § 611(a)(6)(B)(iii).

3. DELETE IF UNVERIFIABLE (15 U.S.C. § 1681i(a)(5)(A))
   If the bankruptcy public record cannot be verified as belonging to me, with correct chapter, filing date, and disposition, it must be deleted.

4. OBSOLESCENCE (15 U.S.C. § 1681c(a)(1))
   If the reporting period for this public record has expired, delete immediately.

5. DISCHARGED DEBT REPORTING (11 U.S.C. § 524; 15 U.S.C. § 1681s-2)
   Any tradeline for debt discharged in bankruptcy must not report an outstanding collectible balance or misleading collection status. Correct Metro 2 compliance/status fields or delete.

6. IDENTITY / MIXED FILE
   If this bankruptcy belongs to another consumer, delete and segregate my file.

${a.clerkResponseSummary ? `COURT CLERK INQUIRY (EXHIBIT)\n${a.clerkResponseSummary}\n\nNote: Clerk confirmation regarding furnishing procedures supports my dispute diligence; deletion still requires failure to verify accuracy or statutory obsolescence.\n` : ''}

REQUESTED ACTION
- Delete unverifiable or obsolete bankruptcy public record entries.
- Correct chapter, filing date, disposition, and case number to match certified docket.
- Correct or delete post-discharge tradelines reporting balances on discharged accounts.
- Provide written results and method of verification within 30 days.

Enclosures: [Certified docket / discharge order / clerk letter / ID / bureau report marked exhibits]

${addr(a)}`;
}
