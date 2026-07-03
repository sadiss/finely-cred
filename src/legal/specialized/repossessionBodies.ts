import type { DebtLetterBuildArgs } from '../debtLetterBuildArgs';

/** Repossession / claim-and-delivery answer outline — sanitized pro se defendant (no third-party counsel branding). */
export function getRepossessionAnswerBody(args: DebtLetterBuildArgs): string {
  const plaintiff = args.recipientName || args.creditorName || '[PLAINTIFF / LESSOR / SECURED PARTY]';
  const caseNo = args.caseNumber || '[CASE NUMBER]';
  const court = args.summonsContext?.courtName || '[COURT NAME]';
  const state = args.summonsContext?.jurisdictionState || args.debtorState || '[STATE]';
  const vehicle = args.summonsContext?.collateralDescription || '[VEHICLE DESCRIPTION / VIN]';

  return `STATE OF ${state.toUpperCase()}
IN THE ${court.toUpperCase()}

${plaintiff},
    Plaintiff,                              Case No. ${caseNo}
-vs-
${args.debtorName},
    Defendant, Pro Se
_____________________________________________________________________________/

DEFENDANT ANSWER, AFFIRMATIVE DEFENSES, AND DEMAND FOR PROOF
(Repossession / Claim & Delivery / Lease — Educational Draft)

PRELIMINARY STATEMENT
Plaintiff seeks possession or money damages relating to ${vehicle}. Defendant denies that Plaintiff has proven standing, ownership of the specific contract, or lawful right to repossess or replevy the collateral. Defendant further disputes any deficiency calculation absent proof of a commercially reasonable disposition under UCC Article 9.

FACTS (EDIT TO YOUR SITUATION)
[Describe: payments made, turn-in attempts, storage, insurance, mileage, communications with dealer/lessor, and any refusal to accept return.]

LEGAL GROUNDS (verify in your state)
• UCC § 9-203 — attachment and enforceability of security interest require an authenticated security agreement and value given.
• UCC § 9-609 — repossession after default must not breach the peace; self-help rules vary by state.
• UCC § 9-610 / § 9-615 — disposition must be commercially reasonable; surplus/deficiency accounting required.
• UCC § 9-623 — redemption right before disposition upon tender of full obligation plus reasonable expenses.
• FDCPA 15 U.S.C. § 1692g — if a collector is involved, validation rights may apply to the deficiency portion.
• State replevin / claim-and-delivery statutes — Plaintiff must prove right to immediate possession.

ANSWER
Defendant answers Plaintiff's Complaint as follows:
1. Deny — Plaintiff has not attached account-specific assignment or lease ownership proof identifying Defendant's obligation.
2. Deny — Default as alleged; [or Admit payments through DATE; Deny default thereafter].
3. Deny — Lawful repossession or lawful detention of collateral.
4. Deny — Amount claimed without itemized ledger, sale proceeds, credits, and fees.

AFFIRMATIVE DEFENSES
1. Failure to state a claim / lack of standing and real party in interest.
2. Failure to prove security agreement authenticated by Defendant.
3. Breach of peace / wrongful repossession (if applicable).
4. Failure to provide commercially reasonable disposition notice and accounting.
5. Statute of limitations / accord and satisfaction (if applicable).
6. FDCPA and state collection practices violations for mislabeled collector status (if applicable).
7. Reservation to amend.

WHEREFORE Defendant requests dismissal with prejudice, return of collateral or credit for value, statutory damages where applicable, costs, and other just relief.

Respectfully submitted,

/s/ ${args.debtorName}
${args.debtorName}, Pro Se
Date: ${args.date}

[MAIL CERTIFIED COPY TO PLAINTIFF COUNSEL AND FILE WITH COURT — VERIFY LOCAL RULES]`;
}
