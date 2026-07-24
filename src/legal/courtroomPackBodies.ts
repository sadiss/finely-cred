import type { DebtLetterBuildArgs } from './debtLetterBuildArgs';

const INTEGRITY_PREAMBLE = `EDUCATIONAL USE ONLY — NOT LEGAL ADVICE
Delete any statement that is not truthful. Do not deny an account, transaction, signature, payment, or communication you know is genuine. Do not sign anything containing facts you cannot honestly state. Results vary.`;

function addrBlock(args: DebtLetterBuildArgs): string {
  const lines = [
    args.debtorName || '{{defendantName}}',
    args.debtorAddress1 || '{{defendantAddressLine1}}',
    args.debtorAddress2 || '',
    [args.debtorCity, args.debtorState, args.debtorPostalCode].filter(Boolean).join(', ') || '{{defendantCityStateZip}}',
  ].filter(Boolean);
  return lines.join('\n');
}

function courtHeader(args: DebtLetterBuildArgs): string {
  return `${args.summonsContext?.courtName || '{{courtName}}'}
${args.caseNumber ? `Case No. ${args.caseNumber}` : 'Case No. {{caseNumber}}'}
${args.recipientName || args.creditorName || '{{plaintiffName}}'}, Plaintiff,
v.
${args.debtorName || '{{defendantName}}'}, Defendant.`;
}

export function getCourtroomIntegrityPreamble(): string {
  return INTEGRITY_PREAMBLE;
}

/** Pretrial proof / production / preservation notice (educational template). */
export function getCourtroomPretrialProofNoticeBody(args: DebtLetterBuildArgs): string {
  return `${INTEGRITY_PREAMBLE}

${addrBlock(args)}

Date: ${args.date || '{{date}}'}

Via Certified Mail — Return Receipt Requested

${args.plaintiffLawFirm || args.recipientName || '{{opposingCounselName}}'}
${args.plaintiffLawFirmAddress || args.recipientAddress || '{{opposingCounselAddress}}'}

Re: ${courtHeader(args)}
     Pretrial Proof, Production & Preservation Notice

To Counsel:

I am the defendant in the above-captioned matter. This letter is a formal request for proof, production, and litigation-hold notice before trial. I do not waive any rights and I do not admit liability.

1. AGREEMENT & CONSIDERATION
Provide the complete, account-specific agreement bearing my signature (or competent evidence of electronic acceptance), all amendments, and proof of consideration.

2. IDENTITY & ACCOUNT MATCH
Prove the account number, creditor of record, and that the plaintiff is the real party in interest for this specific obligation.

3. BALANCE & LEDGER
Provide a complete itemized ledger from inception: charges, interest, fees, payments, credits, insurance, setoffs, and adjustments.

4. OWNERSHIP & ASSIGNMENTS
Produce the complete chain of title from originator to present claimant, including account-level schedules (not pool summaries only).

5. SECURITIZATION / SERVICING (if applicable)
Identify any trust, SPV, or servicer; state whether the account was pooled; and produce assignments to/from any trust.

6. WITNESSES & BUSINESS RECORDS
Identify trial witnesses and custodians of records; produce foundation for any affidavit of indebtedness or business-records exception.

7. FDCPA / COLLECTION RECORDS (if applicable)
If collection communications occurred, produce validation records, mini-Miranda disclosures, and licensing where applicable.

8. PRESERVATION
Place a litigation hold on all documents, communications, recordings, and metadata relating to this account and case.

9. RESPONSE DEADLINE
Respond in writing within {{responseDays}} days with either production or a specific objection log citing privilege or undue burden.

Respectfully,

${args.debtorName || '{{defendantName}}'}`;
}

/** Written answer + certificate of service (contested-issues style — educational). Longer, stronger body for debt-buyer and bank suits. */
export function getCourtroomWrittenAnswerBody(args: DebtLetterBuildArgs): string {
  const plaintiff = args.recipientName || args.creditorName || '{{plaintiffName}}';
  const amount = args.summonsContext?.amountClaimed || '{{amountClaimed}}';
  const account = args.accountNumber || '{{accountNumberMasked}}';
  const original = args.originalCreditorName || '{{originalCreditorName}}';

  return `${INTEGRITY_PREAMBLE}

${courtHeader(args)}

DEFENDANT'S ANSWER, AFFIRMATIVE DEFENSES, AND DEMAND FOR STRICT PROOF

Comes now Defendant, ${args.debtorName || '{{defendantName}}'}, appearing pro se, and for Answer to Plaintiff's Complaint states as follows. This Answer is educational in form and must be edited to match Defendant's honest knowledge and local rules. Delete any sentence that is not truthful. Defendant does not waive any rights, defenses, or counterclaims.

I. INTRODUCTION AND PRESERVATION

1. Defendant has been named in a collection action by ${plaintiff} concerning an alleged account ending in ${account} and an alleged amount of ${amount}. Defendant disputes that Plaintiff has proven (a) standing / real-party-in-interest status for this specific receivable, (b) a complete and accurate balance, and (c) competent, admissible foundation for any affidavit or business-records summary offered as proof.

2. If an original creditor relationship with ${original} existed, that fact—if true—does not automatically establish that the named Plaintiff owns the receivable today, correctly calculated the balance, or is entitled to judgment. Defendant separates those questions and demands account-level proof.

3. Defendant reserves all rights under applicable state rules of civil procedure, the Rules of Evidence, the Fair Debt Collection Practices Act (15 U.S.C. § 1692 et seq.) where applicable, state consumer-protection and collection-licensing statutes, and any contractual arbitration, notice, or limitation provisions.

II. GENERAL DENIAL

4. Except for those allegations expressly and specifically admitted below, Defendant denies each and every allegation in the Complaint, including any prayer for interest, fees, costs, or attorney fees, and denies that Plaintiff is entitled to any relief.

III. SPECIFIC RESPONSES (EDIT TO MATCH HONEST KNOWLEDGE)

5. As to Plaintiff's identity and capacity: Defendant lacks sufficient information to admit that Plaintiff is the current owner of the specific receivable sued upon and therefore denies standing to the extent not proven with account-level writings.

6. As to any alleged agreement: Defendant denies that Plaintiff has attached or produced a complete, account-specific agreement bearing Defendant's signature or competent electronic-acceptance evidence tied to this account, sufficient to support the claims as pleaded.

7. As to ownership / assignment: Defendant denies that a pool bill of sale, generic purchase agreement, or summary affidavit—without an account-level schedule identifying this account (including identifiers, sale balance, and transfer date)—establishes Plaintiff's ownership or right to sue.

8. As to the alleged balance of ${amount}: Defendant denies the amount claimed unless and until Plaintiff produces a complete itemized ledger from account opening (or charge-off, as applicable) through the present, showing principal, interest, fees, payments, credits, sale proceeds, insurance, setoffs, and adjustments.

9. As to any affidavit of indebtedness or business-records declaration: Defendant denies that such papers establish personal knowledge, trustworthiness, or an adequate foundation under the business-records exception, and objects to hearsay and lack of foundation.

10. As to damages, interest, collection fees, and costs: Defendant denies that Plaintiff has proven contractual or statutory entitlement to each category claimed.

11. As to any allegation Defendant cannot honestly admit or deny after reasonable inquiry: Defendant denies on information and belief and demands strict proof.

IV. AFFIRMATIVE DEFENSES
(Assert only those that apply in your jurisdiction and facts. Strike those that do not.)

FIRST DEFENSE — Failure to state a claim upon which relief can be granted.

SECOND DEFENSE — Lack of standing / failure to prove real party in interest for this specific account.

THIRD DEFENSE — Failure to prove account stated, breach of contract, or other pleaded theory with competent evidence.

FOURTH DEFENSE — Statute of limitations (state the correct SOL and last-activity date you contend applies).

FIFTH DEFENSE — Failure of consideration / failure to prove the terms allegedly owed.

SIXTH DEFENSE — Payment, credit, setoff, settlement, or other reduction not properly applied (if applicable).

SEVENTH DEFENSE — Unclean hands / estoppel / waiver (if supported by facts).

EIGHTH DEFENSE — Hearsay and lack of foundation bar Plaintiff's affidavit-based proof.

NINTH DEFENSE — FDCPA and/or state collection-law violations, including misleading representations or failure to validate where applicable (plead with facts if asserting affirmative claims).

TENTH DEFENSE — Failure to mitigate; improper fees or interest; and any other defense available under law or equity.

Defendant reserves the right to amend this Answer to add defenses as discovery and document production reveal additional facts.

V. DEMAND FOR PROOF AND PRESERVATION

12. Defendant demands production of: (a) the complete account-level chain of title from originator to Plaintiff, including any sale schedule / Exhibit listing THIS account (identifiers, sale balance, transfer date, field codes) — not a pool bill of sale alone; (b) the itemized ledger from inception or charge-off through the present; (c) the agreement and all amendments; (d) licensing/authorization to collect in Defendant's state if required; and (e) identification of trial witnesses and records custodians with personal or business-record knowledge of THIS account.

13. Defendant demands that Plaintiff and its agents place a litigation hold on all account records, sale files, collection notes, recordings, and credit-reporting data related to this matter.

14. Defendant specifically contests any attempt to prove the claim through generic "business records" summaries, robo-signed affidavits, pool bills of sale lacking this account number, or testimony from a witness who did not review the complete transfer file for THIS account.

15. If Plaintiff relies on an alleged securitization, assignment, or placement, Defendant demands the operative transfer instrument, the account-level schedule, and competent evidence of authority of each signing party in the chain.

16. If Plaintiff first produces new exhibits at hearing, Defendant respectfully requests a continuance or adequate time to review before being required to respond on the merits.

17. Defendant does not waive the right to seek dismissal, summary judgment, sanctions for unsupported filings, or leave to amend this Answer after receipt of discovery and court-ordered disclosures.

VI. PRAYER FOR RELIEF

WHEREFORE, Defendant respectfully requests that the Court:

A. Deny Plaintiff's requested judgment and dismiss the Complaint with prejudice, or in the alternative enter judgment for Defendant;
B. Require Plaintiff to prove standing, contract, and amount with competent, account-specific evidence before any judgment;
C. Award Defendant costs and any other relief available to a prevailing party under applicable law; and
D. Grant such other and further relief as the Court deems just and proper.

Respectfully submitted,

_______________________________
${args.debtorName || '{{defendantName}}'}, Defendant pro se
${addrBlock(args)}
Date: ${args.date || '{{date}}'}

CERTIFICATE OF SERVICE

I certify that on ${args.date || '{{date}}'}, a true and correct copy of this Answer was served upon:

${args.plaintiffLawFirm || '{{opposingCounselName}}'}
${args.plaintiffLawFirmAddress || '{{opposingCounselAddress}}'}

By: ☐ Certified Mail, Return Receipt Requested  ☐ Court's e-file / e-service  ☐ Hand delivery  ☐ First-class mail

_______________________________
${args.debtorName || '{{defendantName}}'}`;
}

/** Court-day kit: opening, witness questions, objections, closing, checklist. */
export function getCourtroomDayKitBody(args: DebtLetterBuildArgs): string {
  return `${INTEGRITY_PREAMBLE}

COURT-DAY KIT — ${args.debtorName || '{{defendantName}}'}
Case: ${args.caseNumber || '{{caseNumber}}'} · Court: ${args.summonsContext?.courtName || '{{courtName}}'}
Trial date: {{trialDate}}

── OPENING (30–60 seconds) ──
"Your Honor, I am ${args.debtorName || 'the defendant'}, appearing pro se. I dispute this claim because Plaintiff has not produced account-level proof of ownership, contract, and balance. I ask the Court to require competent evidence before any judgment."

── WITNESS QUESTIONS (ask only what you need; be truthful) ──
A. Standing / ownership
   - "Are you employed by the plaintiff or a servicer?"
   - "Did you review the complete assignment chain for THIS account number?"
   - "Can you identify the exhibit that lists my specific account in the pool sale?"

B. Contract / signature
   - "Do you have the original agreement with the defendant's signature?"
   - "If electronic, what records prove acceptance tied to this account?"

C. Balance / ledger
   - "What is the itemized ledger from inception?"
   - "Show every payment credited and every fee assessed."

D. Affidavit foundation
   - "Did you personally review the business records, or are you a surrogate signer?"
   - "What is your title and daily duties regarding this account?"

E. Securitization (if applicable)
   - "Was this account sold to a trust? Who receives payments today?"

F. FDCPA / collector status (if applicable)
   - "Is Plaintiff a debt collector under 15 U.S.C. § 1692a(6) for this account?"

── OBJECTION PHRASES ──
- "Objection, hearsay — no personal knowledge."
- "Objection, lack of foundation for business records."
- "Objection, calls for speculation."
- "Objection, beyond scope."

── CLOSING (30 seconds) ──
"Plaintiff has not met its burden on standing, contract, and amount. I respectfully ask the Court to deny judgment or dismiss."

── CHECKLIST ──
☐ Photo ID + copy of Answer filed
☐ Copies of discovery requests & responses
☐ Your ledger/records (honest facts only)
☐ Bureau tradeline screenshots (if reporting dispute related)
☐ Calendar with answer & trial dates
☐ Pen + notepad; speak slowly; wait for ruling on objections

── WHAT NOT TO SAY ──
✗ Do not admit you "owe" the amount if you genuinely dispute it
✗ Do not guess dates, balances, or signatures
✗ Do not argue securitization myths — stick to missing account-level proof

── WHAT TO SAY ──
✓ "I dispute the amount and ownership until account-level proof is shown."
✓ "I am not admitting liability; I am challenging foundation and standing."
✓ "May I approach with Exhibit ___?"`;
}
