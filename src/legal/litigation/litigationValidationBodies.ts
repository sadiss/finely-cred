import type { LitigationLetterArgs } from './litigationLetterArgs';
import { fillLitigation } from './litigationLetterArgs';

/** Post-suit validation + cease & desist (mini-Miranda / collection lawsuit). */
export function getLitigationValidationCeaseDesistBody(args: LitigationLetterArgs): string {
  const template = `{{PLAINTIFF_NAME}}
{{PLAINTIFF_ADDRESS}}

{{PLAINTIFF_LAW_FIRM}}
{{PLAINTIFF_LAW_FIRM_ADDRESS}}

VALIDATION AND CEASE AND DESIST

		Re:	Name: {{DEBTOR_NAME}}
			Address: {{DEBTOR_ADDRESS_BLOCK}}
			Account #: {{ACCOUNT_NUMBER}}

		Dear {{PLAINTIFF_LAW_FIRM}}:

		I received a debt collection letter lawsuit from you where you used the Mini Miranda Warning telling me you are a debt collector and collecting upon a debt. Can you supply me with a contract or agreement signed with your company.

		PURSUANT TO THE FDCPA, I WOULD LIKE THE FOLLOWING PROVIDED:

		THE NAME AND ADDRESS OF THE ORIGINAL AND CURRENT CREDITOR
		VERIFICATION OF THE DEBT AMOUNT THAT YOU ARE SEEKING TO COLLECT SHOWING THAT A CONTRACT EXISTS CREATE THE AMOUNT THAT YOU CLAIM IS OWED.
		ALL THE ASSIGNMENTS SHOWING THE DEBT TRANSFER FROM THE ORIGINAL CREDITOR TO THE CURRENT CREDITOR
		PLEASE PROVIDE ME WITH PROOF THE DEBT WAS SECURITIZED BY THE ORIGINAL CREDITOR
		PLEASE SHOW THE ASSIGNMENTS OF THE DEBT FROM THE ORIGINAL CREDITOR TO THE SECURED TRUST AND THEN BACK TO THE ORIGINAL CREDITOR

		PLEASE CEASE AND DESIST FROM COLLECTING ON THIS DEBT UNTIL YOU HAVE VALIDATED THE DEBT.

		Please do not look at my credit report or report anything to my credit I dispute I owe this debt amount to you and that dispute should be stated on my credit report if you have reported this debt.

		PERMISSABLE PURPOSE

		Please State why you have a permissible purpose to contact my credit.  I dispute this.

		IF YOU PASS THIS ON TO ANOTHER COLLECTOR

		I dispute I owe this debt to you. If you pass this on to another debt collector, please provide them notice of my dispute to owing this debt.  Thank you for your immediate cooperation.

______________________________
{{DEBTOR_NAME}}`;

  return fillLitigation(template, args);
}

/** Assignment registry demand to originator/servicer. */
export function getLitigationAssignmentRegistryBody(args: LitigationLetterArgs): string {
  const template = `{{DATE}}

{{ORIGINAL_CREDITOR}}
{{PLAINTIFF_ADDRESS}}

{{ORIGINAL_CREDITOR}}
Loan Operations,
P.O. Box [SERVICER PO BOX],
[SERVICER CITY STATE ZIP]

VALIDATION AND CEASE AND DESIST

		Re:	Name: {{DEBTOR_NAME}}
			Address: {{DEBTOR_ADDRESS_BLOCK}}
			Email Address: {{DEBTOR_EMAIL}}
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

		Please provide me with a file or proper format of a complete history and proof of the assignments of the debt or note with reference to {{PLAINTIFF_NAME}} listed in the Registry that you are required to keep. You may send electronically to my email address above or mail the information to me at my home address also listed above.

		Thank you for your immediate cooperation.

______________________________
{{DEBTOR_NAME}}`;

  return fillLitigation(template, args);
}
