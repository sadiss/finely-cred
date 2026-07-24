import type { LitigationLetterArgs } from './litigationLetterArgs';
import { fillLitigation } from './litigationLetterArgs';

/**
 * Litigation affidavit format:
 * STATE/COUNTY caption, 28 U.S.C. § 1746, plaintiff, law firm, collector, case #, narrative, signature.
 */
export function getLitigationBankAffidavitBody(args: LitigationLetterArgs): string {
  const template = `AFFIDAVIT OF {{DEBTOR_NAME}}

STATE OF {{AFFIDAVIT_STATE}}                    )
COUNTY OF {{AFFIDAVIT_COUNTY}}                  ) ss.

Pursuant to 28 U.S.C. § 1746, {{DEBTOR_NAME}}, having been duly sworn and upon oath, verifies, certifies under penalty of perjury, and declares as follows:

1. I was sued in {{COURT_NAME}} by {{PLAINTIFF_NAME}} and by the law firm and debt collector, {{PLAINTIFF_LAW_FIRM}}, with case number {{CASE_NUMBER}}. There is no information or contract attached to the lawsuit showing the debt amount owed or why I owe it.

2. I dispute I owe this debt and the amount as stated. There is no proof attached in and to the lawsuit establishing the alleged obligation, the amount, or {{PLAINTIFF_NAME}}'s ownership or right to collect.

3. There is no affidavit attached to the lawsuit yet the complaint states it is an "account stated" complaint with no proof of agreement or payment to the plaintiff.

4. The court can see from the lawsuit that there is no paperwork or any documents or cardholder agreement showing they have a right to sue me on the debt amount claimed.

5. Further, the lawsuit and summons contain the words "This is a communication from a debt collector. We are attempting to collect a debt and any information obtained will be used for that purpose" written on the pages, while only {{PLAINTIFF_NAME}} is named as plaintiff.

6. As this is a collection communication and only {{PLAINTIFF_NAME}} is the party in the lawsuit, I demand that the plaintiff validate and verify the debt under 15 U.S.C. § 1692g and provide proof the plaintiff owns the right to sue me on this debt. I believe the debt may have been securitized or assigned. Why else are they stating they are debt collectors?

7. {{PLAINTIFF_NAME}} appears to be trying to avoid FDCPA regulations by stating they are a "creditor" while simultaneously stating they are collecting upon a debt.

8. The word "debt" may not appear in the complaint — only the word "account" — yet the pleadings use debt-collector disclosure language.

9. I have not been provided with a complete original signed agreement, complete itemized ledger, complete payment history, complete assignment chain, or sworn testimony from a competent witness with personal or business-record knowledge for this specific account.

10. I deny that a generic bill of sale, affidavit template, spreadsheet, charge-off statement, or account summary alone proves the alleged account, amount, assignment, or right to sue.

11. I dispute the plaintiff's standing and demand proof of the current owner, prior owners, assignment dates, purchase/placement dates, servicing authority, and the account-level schedule showing this specific account.

12. I do not admit liability for the alleged debt. I do not admit the accuracy of the amount claimed. I do not admit that the plaintiff owns the account. I do not admit that the collector has authority to collect.

13. I reserve all rights, claims, defenses, counterclaims, objections, discovery requests, motions, and remedies available under applicable federal and state law, including the FDCPA, FCRA, state collection practices acts, contract law, evidence rules, and civil procedure.

14. I specifically dispute any attempt to prove the claim with a generic bill of sale, data spreadsheet, charge-off summary, or affidavit from a person who lacks personal or business-record knowledge of THIS account's transfer history and balance math.

15. I demand that any hearing or judgment wait until Plaintiff produces competent, account-level proof of standing, contract, and amount — and I will ask the Court for time to review any papers first produced at the courthouse.

16. The foregoing is true and correct to the best of my knowledge and belief.


_________________________
{{DEBTOR_NAME}}

DATED: {{DATE}}`;

  return fillLitigation(template, args);
}

/** Debt-buyer / velocity chain-of-title affidavit — standing, amount, foundation. */
export function getLitigationDebtBuyerAffidavitBody(args: LitigationLetterArgs): string {
  const template = `AFFIDAVIT OF {{DEBTOR_NAME}}

STATE OF {{AFFIDAVIT_STATE}}                    )
COUNTY OF {{AFFIDAVIT_COUNTY}}                  ) ss.

Pursuant to 28 U.S.C. § 1746, {{DEBTOR_NAME}}, having been duly sworn and upon oath, verifies, certifies under penalty of perjury, and declares as follows:

1. {{PLAINTIFF_NAME}} ("Plaintiff") and their law firm / collector, {{PLAINTIFF_LAW_FIRM}}, filed a lawsuit against me in {{COURT_NAME}}, Case No. {{CASE_NUMBER}}. I dispute that Plaintiff has proven it owns the specific receivable sued upon, that the amount claimed is accurate, or that the attached papers are competent proof for judgment.

2. I reviewed the complaint and exhibits. There is no complete, account-level chain of title showing: (a) the original creditor for THIS account (including {{ORIGINAL_CREDITOR}} if that is the alleged origin); (b) each assignment or sale of THIS account; (c) the sale balance and transfer date for THIS account; and (d) that the named Plaintiff is the current owner or real party in interest.

3. Any Bill of Sale, purchase agreement, or "all rights, title, and interest in charged-off loans" language appears to describe a pool or portfolio. A pool summary without an account-level schedule (account identifiers / last four, sale balance, field codes, and transfer date for THIS account) does not prove Plaintiff owns my specific obligation.

4. Loan / reference identifiers on papers (Loan ID {{LOAN_ID}}, Borrower ID {{BORROWER_ID}}, Account {{ACCOUNT_NUMBER}}) have not been tied by Plaintiff to a complete loan file, payment history, charge-off accounting, and sale-file row that matches those identifiers.

5. I dispute the amount claimed of {{AMOUNT_CLAIMED}}. Plaintiff has not produced a complete itemized ledger from account opening (or charge-off, as applicable) through the present showing principal, interest, fees, payments, credits, sale proceeds, insurance, setoffs, and adjustments.

6. I dispute any affidavit of indebtedness or business-records declaration offered by Plaintiff to the extent the affiant lacks personal knowledge of THIS account's creation, sale, and balance math, and to the extent the records are hearsay without a proper foundation.

7. I do not admit that Plaintiff is the real party in interest. I do not admit the accuracy of the balance. I do not admit that a generic bill of sale, spreadsheet excerpt, charge-off statement, or account summary alone proves ownership or amount.

8. I dispute that a pool transfer, data tape, or affidavit template alone proves this specific account was included, correctly valued, or lawfully assigned to Plaintiff.

9. I demand production of: (a) the account-level sale schedule / Exhibit listing THIS account; (b) the complete chain of title; (c) the complete itemized ledger; (d) the agreement and amendments allegedly owed; and (e) identification of trial witnesses and records custodians.

10. I reserve all rights, defenses, counterclaims, discovery requests, motions, and remedies under applicable law. I will ask the Court for time to review papers first produced at hearing. The foregoing is true and correct to the best of my knowledge and belief.


_________________________
{{DEBTOR_NAME}}

DATED: {{DATE}}`;

  return fillLitigation(template, args);
}
