import type { LitigationLetterArgs } from './litigationLetterArgs';
import { fillLitigation } from './litigationLetterArgs';

/** Post-suit validation + cease & desist (mini-Miranda / collection lawsuit) — stronger account-level demands. */
export function getLitigationValidationCeaseDesistBody(args: LitigationLetterArgs): string {
  const template = `{{DEBTOR_ADDRESS_BLOCK}}

Date: {{DATE}}

{{RECIPIENT_BLOCK}}

VALIDATION, VERIFICATION, AND CEASE & DESIST DEMAND

Re:	{{DEBTOR_RE_LINE}}
	Account / reference: {{ACCOUNT_NUMBER}}
	Case / claim: {{CASE_NUMBER}}
	Amount claimed: {{AMOUNT_CLAIMED}}
	Original creditor (if alleged): {{ORIGINAL_CREDITOR}}

Dear {{PLAINTIFF_LAW_FIRM}}:

I write regarding the above-referenced matter pending in {{COURT_NAME}}, Case No. {{CASE_NUMBER}}, and/or your collection communications concerning Account {{ACCOUNT_NUMBER}} in the claimed amount of {{AMOUNT_CLAIMED}}. Your papers include debt-collector disclosure language (including Mini-Miranda style language). I dispute that I owe the claimed amount to the named plaintiff / collector until you provide complete validation for THIS specific account.

Pursuant to the Fair Debt Collection Practices Act, 15 U.S.C. § 1692g (and any applicable state collection statutes), and without waiving any defenses in litigation, please provide in writing:

1. The name and mailing address of the original creditor and the current creditor / owner of THIS account, including {{ORIGINAL_CREDITOR}} if that is the alleged origin.
2. Verification of the amount you claim is owed ({{AMOUNT_CLAIMED}}), including a complete itemized ledger showing principal, interest, fees, payments, credits, sale proceeds, and adjustments from inception (or charge-off) to the present.
3. A copy of the agreement or contract you contend creates the obligation, including any amendments and proof of my assent.
4. The complete chain of title / all assignments or bills of sale transferring THIS account from the original creditor to the current claimant — including any account-level sale schedule identifying THIS account (last four / account id, sale balance, transfer date, field codes). A pool bill of sale alone is not sufficient.
5. If the account was placed in a trust, SPV, or securitization structure: identify the trust/SPV and produce assignments to and from that entity for THIS account (or state in writing that no such transfer occurred).
6. Licensing / authorization to collect in my state, if required for your entity type, and the name and bar number of counsel of record ({{PLAINTIFF_ATTORNEY}} / {{PLAINTIFF_ATTORNEY_BAR}}) if different from the firm above.
7. The name of any prior collectors and dates of placement.

PLEASE CEASE COLLECTION COMMUNICATIONS AND COLLECTION ACTIVITY ON THIS ACCOUNT UNTIL YOU HAVE PROVIDED THE VALIDATION ABOVE (except as permitted by law for pending litigation filings / court process).

CREDIT REPORTING / PERMISSIBLE PURPOSE
I dispute the debt amount and ownership as claimed. If you have reported or will report this account, report it as disputed. Please state in writing the permissible purpose for any credit pull related to this matter.

IF YOU TRANSFER OR PLACE THIS ACCOUNT
I dispute that I owe this debt as claimed to you. If you pass this matter to another collector, buyer, or attorney, provide them written notice of my dispute and a copy of this letter.

Provide your written response to the address above. Thank you for your prompt cooperation.

______________________________
{{DEBTOR_NAME}}`;

  return fillLitigation(template, args);
}

/** Assignment registry demand to originator/servicer. */
export function getLitigationAssignmentRegistryBody(args: LitigationLetterArgs): string {
  const template = `{{DEBTOR_ADDRESS_BLOCK}}

Date: {{DATE}}

{{RECIPIENT_BLOCK}}

VALIDATION AND CEASE AND DESIST

		Re:	{{DEBTOR_RE_LINE}}
			LOAN ID: {{LOAN_ID}}
			Borrower ID: {{BORROWER_ID}}

		Dear {{ORIGINAL_CREDITOR}}:

		I am being sued on a debt from {{PLAINTIFF_NAME}} with a contract whose terms and conditions state that your company will keep and compile a list or "Registry" of all the companies or entities or assignees or assignors of the note that is claimed to be mine in the lawsuit against me.

		Here is the ID of the Note:
		Promissory Note
		Loan ID: {{LOAN_ID}}
		Borrower ID: {{BORROWER_ID}}
		Lender: {{ORIGINAL_CREDITOR}}

		The terms and conditions attached to the lawsuit referencing you as a Register of the notes and assignments are attached.

		See Attached for all sections of terms and conditions.

		Please provide me with a file or proper format of a complete history and proof of the assignments of the debt or note with reference to {{PLAINTIFF_NAME}} listed in the Registry that you are required to keep. Please mail the information to me at my home address listed above.

		Thank you for your immediate cooperation.

______________________________
{{DEBTOR_NAME}}`;

  return fillLitigation(template, args);
}
