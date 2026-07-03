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

14. The foregoing is true and correct to the best of my knowledge and belief.


_________________________
{{DEBTOR_NAME}}

DATED: {{DATE}}`;

  return fillLitigation(template, args);
}

/** Debt-buyer / velocity chain-of-title affidavit. */
export function getLitigationDebtBuyerAffidavitBody(args: LitigationLetterArgs): string {
  const template = `AFFIDAVIT OF {{DEBTOR_NAME}}

STATE OF {{AFFIDAVIT_STATE}}                    )
COUNTY OF {{AFFIDAVIT_COUNTY}}                  ) ss.

Pursuant to 28 U.S.C. § 1746, {{DEBTOR_NAME}}, having been duly sworn and upon oath, verifies, certifies under penalty of perjury, and declares as follows:

1. {{PLAINTIFF_NAME}} ("Plaintiff") and their law firm, {{PLAINTIFF_LAW_FIRM}}, have filed a lawsuit in {{COURT_NAME}} against me with Case No. {{CASE_NUMBER}} that I dispute I owe to Plaintiff based on the false or unsupported statements in the exhibits to the complaint.

2. I looked over the lawsuit paperwork and I don't know why Plaintiff owns the debt or why I owe them money as there is nothing attached to the lawsuit saying they bought or own the debt they claim I owe.

3. The Bill of Sale attached to the lawsuit shows some company transferring or assigning "all rights, title, and interest in charged off loans." I have no idea who this company or entity or trust is or why or how they have rights to transfer to Plaintiff when there is no proof of any rights being assigned to that initial seller.

4. There is nothing attached to the lawsuit showing any transfer or assignment of this loan or debt to Plaintiff as stated in the complaint.

5. I don't know how or why Plaintiff obtained the debt in this case from the originator or servicer or how they are receiving ownership of the debt to pass it along. There are no assignments of any debt being transferred anywhere that identify this specific account.

6. Loan ID {{LOAN_ID}} and Borrower ID {{BORROWER_ID}} appear on documents but Plaintiff has not produced a complete loan file, complete assignment chain, or account-level schedule tying this account to Plaintiff.

7. I dispute the amount claimed of {{AMOUNT_CLAIMED}} and deny liability until Plaintiff proves standing, ownership, and the alleged balance with competent evidence.

8. I reserve all rights, defenses, counterclaims, and discovery requests under applicable law.


_________________________
{{DEBTOR_NAME}}

DATED: {{DATE}}`;

  return fillLitigation(template, args);
}
