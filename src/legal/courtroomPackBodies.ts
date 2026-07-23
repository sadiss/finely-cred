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

/** Written answer + certificate of service (contested-issues style — educational). */
export function getCourtroomWrittenAnswerBody(args: DebtLetterBuildArgs): string {
  return `${INTEGRITY_PREAMBLE}

${courtHeader(args)}

DEFENDANT'S ANSWER

Comes now Defendant, ${args.debtorName || '{{defendantName}}'}, and for Answer to Plaintiff's Complaint states:

GENERAL DENIAL
Defendant denies each and every allegation in the Complaint except those expressly admitted below.

SPECIFIC RESPONSES (edit to match your honest knowledge)
1. Defendant lacks sufficient knowledge to admit or deny Plaintiff's identity and standing and therefore denies.
2. Defendant denies that Plaintiff is the holder in due course or owner of the alleged account.
3. Defendant denies the alleged balance unless and until Plaintiff produces a complete itemized ledger and account-level assignment chain.
4. Defendant denies that any affidavit of indebtedness establishes personal knowledge or admissible business records.

AFFIRMATIVE DEFENSES (verify in your jurisdiction)
- Failure to state a claim / lack of standing
- Statute of limitations
- Failure to prove account stated
- Hearsay / lack of foundation for affidavits
- FDCPA / state collection violations (if applicable)

PRAYER
Defendant requests dismissal with prejudice, or in the alternative judgment for Defendant, plus costs as allowed by law.

Respectfully submitted,

_______________________________
${args.debtorName || '{{defendantName}}'}, Defendant pro se
${addrBlock(args)}

CERTIFICATE OF SERVICE

I certify that on ${args.date || '{{date}}'}, a true copy of this Answer was served on:

${args.plaintiffLawFirm || '{{opposingCounselName}}'}
${args.plaintiffLawFirmAddress || '{{opposingCounselAddress}}'}

By: ☐ Certified Mail  ☐ E-file  ☐ Hand delivery

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
