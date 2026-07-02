/**
 * Debt & summons letter templates and legal basis.
 * Deep legal level: FDCPA, FCRA, state SOL, UCC, contract law, banking law.
 * Use for validation requests, affidavits, time-barred responses, summons (e.g. 35-day) answers.
 */

import type { DebtLetterSpec, LegalCitation, ScenarioRecommendation } from '../domain/debtLegal';

const FDCPA_809: LegalCitation = {
  category: 'consumer_protection',
  cite: '15 U.S.C. § 1692g',
  shortName: 'FDCPA § 809',
  description: 'Within 30 days of first communication, consumer may request validation. Collector must cease collection until it provides verification.',
};
const FDCPA_805: LegalCitation = {
  category: 'consumer_protection',
  cite: '15 U.S.C. § 1692c(c)',
  shortName: 'FDCPA § 805(c)',
  description: 'Consumer may demand that collector cease further communication (with limited exceptions).',
};
const FCRA_623: LegalCitation = {
  category: 'consumer_protection',
  cite: '15 U.S.C. § 1681s-2',
  shortName: 'FCRA § 623',
  description: 'Furnishers must report accurately; consumer may dispute with furnisher and with bureaus.',
};
const STATE_SOL: LegalCitation = {
  category: 'civil_procedure',
  cite: 'State statute of limitations (varies by state and claim type)',
  shortName: 'State SOL',
  description: 'Contract and open-account SOL typically 3–6 years. Expired SOL bars suit; asserting it is an affirmative defense.',
};
const UCC_3308: LegalCitation = {
  category: 'banking_law',
  cite: 'UCC § 3-308 (negotiable instruments)',
  shortName: 'UCC § 3-308',
  description: 'Burden of proving signature and status as holder in due course on party claiming right to enforce.',
};
const CONTRACT_CONSIDERATION: LegalCitation = {
  category: 'contract_law',
  cite: 'Consideration and formation (common law / Restatement)',
  shortName: 'Contract formation',
  description: 'Valid contract requires offer, acceptance, consideration. Absent valid assignment and proof of chain of title, no enforceable obligation.',
};
const BEST_EVIDENCE: LegalCitation = {
  category: 'evidence',
  cite: 'Best evidence rule / burden of proof',
  shortName: 'Evidence',
  description: 'Party asserting claim bears burden. Original contract and assignment chain may be required; account statements alone may be insufficient.',
};
const STATE_COLLECTION_LICENSE: LegalCitation = {
  category: 'consumer_protection',
  cite: 'State debt collection licensing / registration requirements (varies by state)',
  shortName: 'State collection license',
  description: 'Many states require debt collectors, collection agencies, and sometimes debt buyers to be licensed or registered before collecting from consumers in that state.',
};
const TILA_ACCOUNTING: LegalCitation = {
  category: 'banking_law',
  cite: 'Truth in Lending Act / Regulation Z accounting principles (as applicable)',
  shortName: 'TILA / Reg Z accounting',
  description: 'Account-level charges, interest, fees, credits, and payments must be accurately calculated and disclosed where applicable.',
};

export const DEBT_LETTER_SPECS: DebtLetterSpec[] = [
  {
    id: 'validation_request',
    title: 'Debt Validation Request',
    shortDescription: 'Demand that the collector validate the debt under FDCPA § 809 before continuing collection.',
    whenToUse: [
      'Within 30 days of the first written communication from the collector',
      'Before paying or acknowledging the debt',
      'When you dispute the amount, the creditor, or whether you owe the debt',
    ],
    legalBasis: [FDCPA_809, STATE_COLLECTION_LICENSE, FCRA_623, TILA_ACCOUNTING, BEST_EVIDENCE],
    contractLawAngle: 'You are not admitting the existence of a valid contract; you are demanding proof of the alleged obligation, the agreement terms, the complete assignment chain, and the collector’s present authority before any further collection activity.',
    bankingLawAngle: 'The request is framed as procedural validation and account-level accounting: identify the owner/servicer, show the ledger, prove authority, and disclose whether any sale, assignment, insurance, credit, setoff, or third-party recovery affects the amount claimed. Do not argue that securitization automatically extinguishes the obligation.',
    keyPrinciple: 'Validation shifts the burden to the collector: prove the debt, prove the amount, prove authority, prove licensing/compliance, and stop collection until adequate validation is supplied.',
  },
  {
    id: 'validation_round2_deficiency',
    title: 'Round 2 Validation Deficiency Notice',
    shortDescription: 'Use when they respond with a statement, bill of sale, or generic packet but fail to fully validate account-level authority, accounting, licensing, or chain of title.',
    whenToUse: [
      'After a collector sends an incomplete validation response',
      'When they provide a balance printout but no itemized ledger or assignment chain',
      'When they continue reporting or collecting without answering your validation questions',
    ],
    legalBasis: [FDCPA_809, STATE_COLLECTION_LICENSE, FCRA_623, TILA_ACCOUNTING, BEST_EVIDENCE],
    contractLawAngle: 'A partial packet does not prove formation, assignment, amount, or present authority. This letter identifies deficiencies and preserves the record.',
    bankingLawAngle: 'Round 2 attacks missing accounting, sale/assignment credits, servicing authority, ledger gaps, and unsupported fees/interest.',
    keyPrinciple: 'A response is not validation just because documents were sent. They must answer the account-level proof demands.',
  },
  {
    id: 'validation_round3_final_demand',
    title: 'Round 3 Final Validation Demand / Reporting Challenge',
    shortDescription: 'Use after continued failure to validate, continued collection, or continued credit reporting despite unresolved deficiencies.',
    whenToUse: [
      'After Round 1 and Round 2 validation requests remain unanswered or incomplete',
      'When they keep collecting, reporting, selling, or threatening action without full validation',
      'Before CFPB/state AG complaint, bureau furnisher dispute, or attorney review',
    ],
    legalBasis: [FDCPA_809, FDCPA_805, STATE_COLLECTION_LICENSE, FCRA_623, TILA_ACCOUNTING, BEST_EVIDENCE],
    contractLawAngle: 'The final notice creates a clean record of unresolved proof deficiencies before escalation.',
    bankingLawAngle: 'The final demand presses accounting, licensing, authority, and ownership deficiencies as grounds to cease collection/reporting.',
    keyPrinciple: 'If they cannot prove it after multiple written opportunities, the account should be closed/returned and any reporting deleted or corrected.',
  },
  {
    id: 'cease_and_desist',
    title: 'Cease & Desist',
    shortDescription: 'Demand that the collector stop all contact with you under FDCPA § 805(c).',
    whenToUse: [
      'After validation, if you dispute the debt and want no further contact',
      'When you want contact to stop (they may still sue or report)',
      'To create a clear record that further contact may violate the FDCPA',
    ],
    legalBasis: [FDCPA_805],
    keyPrinciple: 'They must stop calling and writing (except to confirm no further contact or to notify of specific legal action).',
  },
  {
    id: 'affidavit_of_dispute',
    title: 'Affidavit of Dispute',
    shortDescription: 'Sworn statement that you dispute the debt, lack sufficient knowledge, or deny the alleged contract.',
    whenToUse: [
      'In response to a lawsuit or summons when you dispute the debt',
      'To support a motion or answer asserting lack of valid contract',
      'When the collector has no signed contract or chain of title',
    ],
    legalBasis: [CONTRACT_CONSIDERATION, UCC_3308, BEST_EVIDENCE],
    contractLawAngle: 'Under contract law, a valid obligation requires offer, acceptance, and consideration. An affidavit puts on record that you dispute the existence of an enforceable agreement and that the plaintiff has not met its burden.',
    bankingLawAngle: 'UCC and banking law place burden on the party claiming enforcement. An affidavit supports your position that they have not proven the obligation.',
    keyPrinciple: 'An affidavit is evidence. It supports your defense that the plaintiff has not met its burden of proof.',
  },
  {
    id: 'time_barred_response',
    title: 'Time-Barred Debt Response',
    shortDescription: 'Assert that the debt is beyond the statute of limitations and that no suit may be brought.',
    whenToUse: [
      'When the last payment or last activity was beyond your state’s SOL (often 3–6 years for contract/open account)',
      'When a collector is trying to collect or sue on an old debt',
      'To put them on notice that you are asserting SOL as a defense',
    ],
    legalBasis: [STATE_SOL, CONTRACT_CONSIDERATION],
    contractLawAngle: 'Statute of limitations is a substantive defense in contract and tort. Once the period has run, the right to sue is extinguished in many jurisdictions.',
    keyPrinciple: 'If the SOL has passed, they cannot successfully sue. Assert it in writing and, if sued, raise it as an affirmative defense.',
  },
  {
    id: 'summons_response_affidavit',
    title: 'Summons Response / Answer & Affidavit',
    shortDescription: 'Formal response to a summons or complaint — answer, affirmative defenses (e.g. SOL, no valid contract), and sworn affidavit where applicable.',
    whenToUse: [
      'When you have been served with a summons and complaint',
      'Before the answer deadline (often 20–35 days depending on jurisdiction)',
      'To assert defenses: no valid contract, SOL, lack of standing, failure to validate',
    ],
    legalBasis: [STATE_SOL, CONTRACT_CONSIDERATION, UCC_3308, BEST_EVIDENCE],
    contractLawAngle: 'Your answer and affidavit put on record that the plaintiff has not proven a valid contract, consideration, or chain of assignment. Contract law requires the plaintiff to prove each element.',
    bankingLawAngle: 'UCC and banking rules allocate burden of proof. Your response asserts that the plaintiff has not met that burden.',
    keyPrinciple: 'Answer before the deadline. Assert SOL, lack of valid contract, and failure to validate as affirmative defenses. An affidavit supports your factual positions.',
  },
  {
    id: 'debt_dispute_letter',
    title: 'Debt Dispute Letter (General)',
    shortDescription: 'Formal dispute to the collector disputing the amount, the debt, or the right to collect.',
    whenToUse: [
      'When you dispute the accuracy of the amount or the debt itself',
      'After validation if they responded but you still dispute',
      'To create a paper trail and trigger FCRA dispute rights',
    ],
    legalBasis: [FDCPA_809, FCRA_623, BEST_EVIDENCE],
    keyPrinciple: 'Disputing in writing preserves your rights and may require them to stop reporting until they verify.',
  },
];

export const SCENARIO_RECOMMENDATIONS: ScenarioRecommendation[] = [
  {
    scenario: 'first_contact',
    label: 'First contact from collector',
    description: 'You just received a collection letter or first communication.',
    recommendedLetterTypes: ['validation_request'],
    legalWarning: 'You generally have 30 days from first written communication to request validation. Do not delay.',
  },
  {
    scenario: 'validation_period',
    label: 'Within 30-day validation window',
    description: 'You are still within the 30-day window to demand validation.',
    recommendedLetterTypes: ['validation_request'],
    legalWarning: 'Send your validation request in writing and keep proof of mailing. The collector must cease collection until it provides validation.',
  },
  {
    scenario: 'time_barred',
    label: 'Debt may be time-barred (SOL)',
    description: 'Last payment or last activity was more than your state’s statute of limitations ago.',
    recommendedLetterTypes: ['time_barred_response', 'cease_and_desist'],
    legalWarning: 'SOL varies by state and claim type (contract, open account, written contract). Confirm your state’s period. Do not make a payment — it can reset the SOL in some states.',
  },
  {
    scenario: 'summons_served',
    label: 'Summons / complaint served',
    description: 'You have been served with a lawsuit. You must answer before the deadline (e.g. 20–35 days).',
    recommendedLetterTypes: ['summons_response_affidavit', 'affidavit_of_dispute'],
    legalWarning: 'Answer deadlines are often jurisdictional. Missing the deadline can result in default judgment. File an answer and assert your defenses (SOL, no contract, lack of standing).',
  },
  {
    scenario: 'post_35_days',
    label: 'Past answer deadline (e.g. 35 days)',
    description: 'The deadline to answer has passed. You may need to move to set aside default or reopen.',
    recommendedLetterTypes: ['affidavit_of_dispute', 'summons_response_affidavit'],
    legalWarning: 'You may still be able to beat the debt: file a motion to set aside default or to reopen, with an affidavit explaining why and asserting defenses (SOL, no valid contract). Courts sometimes allow reopening if you act quickly and have a meritorious defense.',
  },
  {
    scenario: 'post_validation',
    label: 'After validation request',
    description: 'You sent validation; they responded or did not. You still dispute or want contact to stop.',
    recommendedLetterTypes: ['validation_round2_deficiency', 'validation_round3_final_demand', 'debt_dispute_letter', 'cease_and_desist', 'affidavit_of_dispute'],
  },
  {
    scenario: 'unknown',
    label: 'Not sure which applies',
    description: 'Review the options below and select the scenario that fits. When in doubt, validation and dispute in writing preserve your rights.',
    recommendedLetterTypes: ['validation_request', 'validation_round2_deficiency', 'validation_round3_final_demand', 'debt_dispute_letter', 'affidavit_of_dispute'],
  },
];

/** Full body templates (placeholders filled at runtime). */
function safeText(v: any) {
  const s = String(v ?? '').trim();
  return s || '';
}

function formatDebtorBlock(args: {
  debtorName: string;
  debtorAddress1?: string;
  debtorAddress2?: string;
  debtorCity?: string;
  debtorState?: string;
  debtorPostalCode?: string;
  debtorPhone?: string;
  debtorEmail?: string;
}) {
  const lines: string[] = [];
  const name = safeText(args.debtorName);
  if (name) lines.push(name);
  const a1 = safeText(args.debtorAddress1);
  const a2 = safeText(args.debtorAddress2);
  if (a1) lines.push(a1);
  if (a2) lines.push(a2);
  const city = safeText(args.debtorCity);
  const state = safeText(args.debtorState);
  const zip = safeText(args.debtorPostalCode);
  const cityStateZip = [city, state].filter(Boolean).join(', ') + (zip ? ` ${zip}` : '');
  if (cityStateZip.trim()) lines.push(cityStateZip.trim());
  const phone = safeText(args.debtorPhone);
  const email = safeText(args.debtorEmail);
  if (phone) lines.push(phone);
  if (email) lines.push(email);
  if (lines.length <= 1) return `[Your Name and Address]`;
  return lines.join('\n');
}

function formatRecipientBlock(args: { recipientName?: string; recipientAddress?: string; fallbackName?: string }) {
  const name = safeText(args.recipientName) || safeText(args.fallbackName);
  const addr = safeText(args.recipientAddress);
  if (!name && !addr) return `[Collector/Attorney Name and Address]`;
  const lines: string[] = [];
  if (name) lines.push(name);
  if (addr) lines.push(addr);
  else lines.push('[Collector/Attorney Name and Address]');
  return lines.join('\n');
}

function formatPreamble(args: {
  debtorName: string;
  date: string;
  creditorName?: string;
  debtorAddress1?: string;
  debtorAddress2?: string;
  debtorCity?: string;
  debtorState?: string;
  debtorPostalCode?: string;
  debtorPhone?: string;
  debtorEmail?: string;
  recipientName?: string;
  recipientAddress?: string;
}) {
  const debtor = formatDebtorBlock(args);
  const recipient = formatRecipientBlock({ recipientName: args.recipientName, recipientAddress: args.recipientAddress, fallbackName: args.creditorName });
  return `${debtor}
[Date: ${args.date}]

${recipient}`;
}

export function getValidationRequestBody(args: {
  creditorName: string;
  debtorName: string;
  date: string;
  debtorAddress1?: string;
  debtorAddress2?: string;
  debtorCity?: string;
  debtorState?: string;
  debtorPostalCode?: string;
  debtorPhone?: string;
  debtorEmail?: string;
  recipientName?: string;
  recipientAddress?: string;
}): string {
  return `${formatPreamble(args)}

RE: Demand for Validation, Proof of Authority, Itemized Accounting, and State Collection Compliance — 15 U.S.C. § 1692g

To Whom It May Concern:

I am writing in response to your communication regarding an alleged debt. I dispute this alleged debt, the amount claimed, and your authority to collect unless and until you provide complete validation. Under 15 U.S.C. § 1692g(a)-(b), I am exercising my right to request validation and I request that you cease collection activity until you mail proper validation.

This request is not a refusal to pay a proven, legally enforceable obligation. It is a demand that you prove the account, the amount, the ownership/servicing authority, and your legal capacity to collect before continuing collection, reporting, selling, assigning, or litigation activity.

Please provide the following validation and answer each numbered request in writing:

1. Identify the original creditor, the current creditor/owner of the alleged account, the current servicer if different, and the entity on whose behalf you are attempting to collect.

2. Provide the complete account number or masked account identifier you claim connects this alleged account to me, along with the date opened, date of last payment, date of last activity, date of charge-off or default, and date your company received or began servicing/collecting the account.

3. Provide a copy of the original signed agreement, application, cardholder agreement, contract, promissory note, or other competent evidence bearing my name and showing the terms you claim bind me to this alleged debt.

4. Provide the full itemized accounting ledger from account opening through the present balance. Include principal, purchases or advances, payments, credits, refunds, interest, fees, collection costs, charge-off entries, adjustments, insurance recoveries, setoffs, sale credits, and any other entries that increase or reduce the amount claimed.

5. Explain how the current amount claimed was calculated. If interest, fees, attorney fees, collection fees, or post-charge-off charges are included, identify the contractual or statutory authority for each category.

6. Provide the complete chain of title and assignment from the original creditor to the current owner. Include bills of sale, assignment schedules, purchase agreements or redacted account-level schedules sufficient to prove that this specific account was transferred.

7. If you are collecting as a servicer, agent, attorney, debt buyer, or third-party collector, provide the written servicing agreement, agency authorization, placement letter, power of attorney, or other document proving your authority to collect this specific account.

8. Identify whether the alleged account was sold, assigned, placed into a trust, pledged, insured, charged off, settled, credited, or otherwise transferred. If any third party, trust, debt buyer, insurer, servicer, or assignee is involved, identify the entity and explain its relationship to the account. I am not asserting that any transfer alone extinguishes an obligation; I am demanding proof of who currently owns or services the account and who has authority to collect.

9. State whether your company, your client, or any predecessor has received payment, credit, insurance proceeds, tax recovery, sale proceeds, setoff, settlement, or other compensation related to this alleged account, and explain how those amounts were applied to the balance now claimed.

10. Provide proof that you are licensed, bonded, registered, or otherwise authorized to collect consumer debts in my state, if required. Include your license/registration number, issuing authority, effective dates, and any trade names used to collect.

11. Identify the state law, contract provision, or other authority you rely on to collect from me in my state, including the applicable statute of limitations date you contend applies and the last payment/activity date used to calculate it.

12. If you have reported or furnished this alleged debt to any consumer reporting agency, identify each bureau, the reporting date, the balance reported, the status reported, and the legal/factual basis for reporting while validation is disputed.

13. Provide the name, title, business address, and telephone number of the person with knowledge who can certify the accuracy of the account records, assignment chain, itemized accounting, and collection authority.

14. Provide copies of all notices you claim were sent to me regarding this alleged debt, including the initial communication, validation notice, itemized statement, charge-off notice, assignment notice, and any notices required under state law.

15. Confirm whether you will cease collection, calls, letters, credit reporting, sale, assignment, litigation threats, and any other collection activity until proper validation has been mailed to me as required by 15 U.S.C. § 1692g(b).

If you cannot provide the requested validation, accounting, licensing proof, chain of title, and authority to collect, then you must cease collection activity and close or return this matter. If you are furnishing this alleged account to any consumer reporting agency without adequate validation, I dispute the accuracy, completeness, ownership, balance, and collectability of that reporting.

Please preserve all records, communications, call notes, collection notes, account-level purchase records, placement records, assignment documents, payment history, ledger entries, and credit reporting records related to this alleged account.

Sincerely,

${args.debtorName}`;
}

export function getValidationRound2DeficiencyBody(args: {
  creditorName: string;
  debtorName: string;
  date: string;
  debtorAddress1?: string;
  debtorAddress2?: string;
  debtorCity?: string;
  debtorState?: string;
  debtorPostalCode?: string;
  debtorPhone?: string;
  debtorEmail?: string;
  recipientName?: string;
  recipientAddress?: string;
}): string {
  return `${formatPreamble(args)}

RE: Second Notice — Deficient Validation Response and Continued Dispute

To Whom It May Concern:

I previously disputed the alleged debt associated with ${args.creditorName} and requested validation. Your response, if any, did not provide complete account-level validation. A generic statement, summary balance, screenshot, form letter, or bill of sale without account-level proof does not establish the amount, ownership, authority, licensing, or enforceability of this alleged debt.

This is my second written notice. I continue to dispute the alleged debt, the balance, your authority to collect, and any credit reporting associated with this account.

Your prior response remains deficient for the following reasons unless you have already provided complete written proof for each item:

1. You have not provided the complete original contract, signed application, cardholder agreement, promissory note, or account-level agreement bearing my name and showing the specific terms allegedly owed.

2. You have not provided a complete itemized ledger from account opening to the present balance, including all charges, payments, credits, reversals, refunds, interest, fees, charge-off entries, assignment credits, sale proceeds, insurance recoveries, setoffs, settlements, and adjustments.

3. You have not provided a complete chain of title showing account-level transfer from the original creditor to the current owner or claimant.

4. You have not provided a written servicing agreement, placement agreement, agency authorization, power of attorney, or other document proving that your company has present authority to collect this specific account.

5. You have not provided proof that you are licensed, bonded, registered, or otherwise authorized to collect consumer debts in my state, if required by state law.

6. You have not identified the current owner, servicer, debt buyer, trustee, insurer, assignee, or other third party with a financial or servicing interest in this alleged account.

7. You have not explained whether any payment, credit, sale proceeds, insurance proceeds, tax recovery, setoff, or other third-party recovery has reduced the amount claimed.

8. You have not identified the date of last payment, date of last activity, date of default, charge-off date, placement date, and statute-of-limitations date you contend applies.

9. You have not identified the person with knowledge who can certify the accuracy of the records, balance, chain of title, and authority to collect.

10. You have not provided the legal and factual basis for any consumer reporting while this debt remains disputed and inadequately validated.

Until you cure these deficiencies with complete validation, cease collection activity, collection calls, letters, sale or assignment activity, litigation threats, and any credit reporting or furnishing related to this disputed alleged debt.

If you cannot provide complete validation within a reasonable time, close or return the account and delete or correct any consumer reporting associated with this matter.

Sincerely,

${args.debtorName}`;
}

export function getValidationRound3FinalDemandBody(args: {
  creditorName: string;
  debtorName: string;
  date: string;
  debtorAddress1?: string;
  debtorAddress2?: string;
  debtorCity?: string;
  debtorState?: string;
  debtorPostalCode?: string;
  debtorPhone?: string;
  debtorEmail?: string;
  recipientName?: string;
  recipientAddress?: string;
}): string {
  return `${formatPreamble(args)}

RE: Final Validation Demand — Continued Failure to Validate, Continued Dispute, and Notice of Escalation

To Whom It May Concern:

This is my final written validation demand regarding the alleged debt associated with ${args.creditorName}. I have disputed this alleged debt and requested validation. To date, you have not provided complete account-level proof of the debt, the amount, the ownership/assignment chain, your authority to collect, your licensing/registration status, or the factual basis for any credit reporting.

I do not consent to unsupported collection activity, continued reporting, sale, assignment, litigation threats, or account placement based on incomplete validation.

For the avoidance of doubt, the following validation items remain required:

1. Original creditor identity, current owner identity, current servicer identity, and the entity authorizing your collection activity.

2. Original contract, application, cardholder agreement, note, or competent account-level agreement showing the terms and obligation alleged.

3. Complete itemized ledger proving the balance from account opening to the present, including every charge, payment, credit, refund, fee, interest entry, charge-off entry, recovery, sale credit, insurance credit, settlement, setoff, and adjustment.

4. Complete chain of title from original creditor to current claimant, including account-level assignment schedule or redacted schedule sufficient to identify this specific account.

5. Written proof of servicing, agency, attorney, or debt-buyer authority to collect this account.

6. State license, bond, registration, or exemption proof authorizing collection activity in my state.

7. Complete explanation of any consumer reporting, including bureau, date reported, status, balance, account type, and basis for reporting despite unresolved validation.

8. Identification of the person with knowledge who can certify the records and testify to the account, ledger, assignments, and collection authority.

9. Explanation of any sale, transfer, trust placement, insurance recovery, tax recovery, setoff, settlement, or other third-party compensation related to the alleged account and how it affects the amount claimed.

10. Copies of all notices allegedly sent to me, including initial communication, validation notice, charge-off/assignment notices, itemized statements, and state-required notices.

Because you have been given multiple opportunities to validate the alleged debt, failure to provide complete validation will be treated as confirmation that the account remains unsupported, disputed, and unsuitable for collection or reporting.

If you cannot fully validate, immediately cease collection, return or close the file, stop furnishing the account to any consumer reporting agency, and delete or correct any reporting connected to this alleged debt. Continued collection or reporting without validation may be documented for CFPB, state attorney general, state licensing authority, bureau/furnisher dispute, and attorney review.

This letter is made without waiver of any rights, remedies, defenses, claims, or objections.

Sincerely,

${args.debtorName}`;
}

export function getTimeBarredResponseBody(args: {
  creditorName: string;
  debtorName: string;
  date: string;
  stateNote?: string;
  debtorAddress1?: string;
  debtorAddress2?: string;
  debtorCity?: string;
  debtorState?: string;
  debtorPostalCode?: string;
  debtorPhone?: string;
  debtorEmail?: string;
  recipientName?: string;
  recipientAddress?: string;
}): string {
  return `${formatPreamble(args)}

RE: Alleged Debt — Statute of Limitations

To Whom It May Concern:

I am responding to your communication regarding an alleged debt. I am putting you on notice that this debt is time-barred under the applicable statute of limitations.${args.stateNote ? ` ${args.stateNote}` : ''}

I do not acknowledge any obligation to pay this alleged debt. Any attempt to sue on this claim would be subject to my affirmative defense that the statute of limitations has run. I reserve all rights under state and federal law.

Cease and desist from further collection efforts on this time-barred debt.

Sincerely,

${args.debtorName}`;
}

export function getAffidavitOfDisputeBody(args: { debtorName: string; date: string; creditorOrPlaintiff: string }): string {
  return `AFFIDAVIT OF DISPUTE

I, ${args.debtorName}, being duly sworn, state under penalty of perjury:

1. I am the consumer/affiant named above. I make this affidavit from personal knowledge, review of my records, and lack of sufficient verified evidence supplied by the claimant or collector regarding the alleged matter concerning ${args.creditorOrPlaintiff}.

2. I dispute the alleged debt, the amount claimed, the account history, the ownership or assignment chain, and the alleged right of the claimant or collector to collect the amount demanded.

3. I have not been provided with a complete original contract, signed application, cardholder agreement, promissory note, or account-level agreement establishing the exact terms claimed against me.

4. I have not been provided with a complete itemized accounting from account opening through the present claimed balance. I have not been shown how the claimed principal, interest, fees, costs, credits, refunds, charge-off entries, sale credits, insurance recoveries, setoffs, settlements, or other adjustments were calculated.

5. I have not been provided with a complete chain of title showing how this specific account allegedly moved from the original creditor to the current claimant, debt buyer, servicer, collection agency, or law firm.

6. I have not been provided with account-level assignment schedules or documents sufficient to identify this specific account as one that was transferred to the current claimant.

7. I have not been provided with a written servicing agreement, agency authorization, placement letter, power of attorney, or other documentation establishing that the party contacting me has present authority to collect this specific account.

8. I have not been provided with proof that the collector or claimant is licensed, bonded, registered, or otherwise authorized to collect consumer debt in my state if such licensing or registration is required.

9. I have not been provided with a sworn statement from a person with first-hand or business-record knowledge who can certify the accuracy of the alleged account records, balance, assignment chain, and authority to collect.

10. I have not been provided with proof that the alleged amount demanded accurately accounts for all payments, credits, adjustments, refunds, charge-offs, sale proceeds, insurance proceeds, settlements, recoveries, or setoffs.

11. I deny that a mere statement, printout, bill of sale without account-level schedule, screenshot, spreadsheet, or summary balance is sufficient to prove the alleged obligation, amount, ownership, or right to collect.

12. I deny that the claimant or collector has met the burden of proof necessary to treat the alleged debt as valid, enforceable, collectible, or reportable.

13. I do not admit liability for the alleged debt. I do not admit the accuracy of the amount claimed. I do not admit that the claimant owns the account. I do not admit that the collector has authority to collect.

14. I reserve all rights, claims, defenses, objections, and remedies available under applicable federal and state law, including but not limited to consumer protection, credit reporting, debt collection, contract, evidence, and civil procedure law.

15. Under applicable contract law, the party asserting a claim must prove contract formation, terms, breach, amount, and damages. I dispute that those elements have been established.

16. Under burden-of-proof and best-evidence principles, the party asserting a claim must produce competent account-level evidence, not unsupported summaries.

17. Where a negotiable instrument or holder/enforcement theory is claimed, I dispute the claimant’s right to enforce unless it proves the signature, holder status, assignment, and authority required under applicable law, including UCC principles where applicable.

18. If the alleged account has been sold, assigned, pooled, transferred, insured, credited, charged off, or otherwise handled by third parties, I demand that those facts be disclosed and accounted for in the claimed balance and authority to collect. I am not stating that transfer alone extinguishes an obligation; I am stating that ownership, servicing authority, and accurate accounting must be proven.

19. If this matter is being reported to any consumer reporting agency, I dispute the reporting as inaccurate, incomplete, unsupported, and not properly validated.

20. This affidavit is intended to preserve my dispute, document lack of validation, and put the claimant or collector to strict proof of every element of the alleged claim.

21. The foregoing is true and correct to the best of my knowledge and belief.

_________________________ (Signature)
${args.debtorName}
Date: ${args.date}`;
}

export function getSummonsResponseAffidavitBody(args: {
  debtorName: string;
  date: string;
  caseNumber?: string;
  plaintiffName: string;
}): string {
  return `AFFIDAVIT IN SUPPORT OF ANSWER / DEFENSES

I, ${args.debtorName}, being duly sworn, state under penalty of perjury:

1. I have been served with a summons and complaint in the matter${args.caseNumber ? ` bearing case number ${args.caseNumber}` : ''}, in which ${args.plaintiffName} is the plaintiff.

2. I dispute the claim in its entirety. I do not admit the existence of a valid contract, the amount claimed, the plaintiff's ownership of the account, the plaintiff's right to collect, or the accuracy of any documents or summaries attached to the complaint.

3. I assert the following defenses, among others as may apply: statute of limitations, lack of contract formation, lack of consideration, lack of standing or authority, failure to prove chain of assignment, failure to validate upon request, inaccurate amount, failure to prove damages, failure to state a claim, and lack of competent business records.

4. I deny that the plaintiff has provided a complete original agreement, complete itemized ledger, complete payment history, complete assignment chain, or sworn testimony from a competent witness with personal or business-record knowledge.

5. I deny that a generic bill of sale, affidavit template, spreadsheet, charge-off statement, or account summary alone proves the alleged account, amount, assignment, or right to sue.

6. I dispute any claimed interest, fees, attorney fees, collection costs, or post-charge-off charges unless the plaintiff proves the contractual or statutory basis for each amount and shows those amounts in a complete ledger.

7. I dispute the plaintiff's standing and demand proof of the current owner, prior owners, assignment dates, purchase/placement dates, servicing authority, and the account-level schedule showing this specific account.

8. I dispute the plaintiff's authority to collect or sue if required debt collection licensing, registration, bonding, or attorney authority is missing, expired, or not proven.

9. I dispute the accuracy of any credit reporting or collection record connected to this matter unless the plaintiff or collector proves the account-level facts and correct reporting basis.

10. I reserve all rights to raise additional defenses, counterclaims, objections to evidence, discovery requests, motions, and challenges to any affidavit, business record, assignment, or witness statement submitted by the plaintiff.

11. I request that the plaintiff be required to prove every element of its claim with admissible evidence, including contract, breach, ownership, amount, authority, standing, and damages.

12. The foregoing is true and correct to the best of my knowledge and belief.

_________________________ (Signature)
${args.debtorName}
Date: ${args.date}`;
}

export function getCeaseAndDesistBody(args: {
  creditorName?: string;
  debtorName: string;
  date: string;
  debtorAddress1?: string;
  debtorAddress2?: string;
  debtorCity?: string;
  debtorState?: string;
  debtorPostalCode?: string;
  debtorPhone?: string;
  debtorEmail?: string;
  recipientName?: string;
  recipientAddress?: string;
}): string {
  return `${formatPreamble(args)}

RE: Cease and Desist — 15 U.S.C. § 1692c(c)

To Whom It May Concern:

I am demanding that you cease and desist from all further communication with me regarding the alleged debt, except as permitted under 15 U.S.C. § 1692c(c)(2) and (3).

You may not contact me by phone, mail, or any other means except to confirm that you will not contact me further or to notify me of a specific legal action.

Failure to comply may result in liability under the Fair Debt Collection Practices Act.

Sincerely,

${args.debtorName}`;
}

export function getDebtDisputeLetterBody(args: {
  debtorName: string;
  date: string;
  creditorName: string;
  debtorAddress1?: string;
  debtorAddress2?: string;
  debtorCity?: string;
  debtorState?: string;
  debtorPostalCode?: string;
  debtorPhone?: string;
  debtorEmail?: string;
  recipientName?: string;
  recipientAddress?: string;
}): string {
  return `${formatPreamble(args)}

RE: Formal Dispute of Alleged Debt, Balance, Reporting, Ownership, and Collection Authority

To Whom It May Concern:

I am writing to formally dispute the alleged debt you have attributed to me concerning ${args.creditorName}. I dispute the alleged balance, the account history, the ownership/assignment chain, the reporting accuracy, and your legal authority to collect or furnish this account.

Under the Fair Debt Collection Practices Act and the Fair Credit Reporting Act, you may not treat disputed, inaccurate, incomplete, or unverifiable information as valid. If you are reporting this matter to any consumer reporting agency, I dispute the reporting and demand correction or deletion of any information you cannot fully substantiate.

Please answer and provide the following in writing:

1. Identify the original creditor, current owner, current servicer, debt buyer if any, and the entity authorizing you to collect.

2. Provide the original contract, application, cardholder agreement, note, or other competent account-level evidence showing that I agreed to the exact obligation and terms you claim.

3. Provide the full itemized account ledger showing charges, payments, credits, refunds, interest, fees, charge-off entries, sale credits, insurance recoveries, setoffs, and all adjustments used to calculate the current balance.

4. Provide the chain of title and assignment documents proving that this specific account was transferred from the original creditor to the current owner or claimant.

5. Provide proof that you are licensed, registered, bonded, or otherwise authorized to collect consumer debt in my state, if required, including license/registration number and effective dates.

6. Identify every consumer reporting agency to which you have furnished this account, the date reported, the balance reported, the status reported, and the basis for reporting while this account is disputed.

7. Identify the date of last payment, date of last activity, date of default, date of charge-off, date placed for collection, and the statute of limitations date you contend applies.

8. Identify the person with knowledge who can certify the accuracy of the records, balance, assignment chain, and collection authority.

Until this dispute is resolved with competent account-level evidence, do not continue credit reporting, collection escalation, sale, assignment, or litigation threats based on unsupported information. If you cannot verify the account, amount, ownership, authority, licensing, and reporting accuracy, delete or correct any reporting and cease collection activity.

Sincerely,

${args.debtorName}`;
}

/** Recommend scenario(s) from debt case dates. */
export function recommendScenarioFromDebt(debt: {
  type: 'debt' | 'summons';
  firstContactDate?: string;
  lastPaymentDate?: string;
  dateServed?: string;
}): import('../domain/debtLegal').DebtScenario {
  const now = new Date();
  const served = debt.dateServed ? new Date(debt.dateServed) : null;
  const firstContact = debt.firstContactDate ? new Date(debt.firstContactDate) : null;

  if (debt.type === 'summons' && served) {
    const daysSinceServed = Math.floor((now.getTime() - served.getTime()) / (24 * 60 * 60 * 1000));
    if (daysSinceServed > 35) return 'post_35_days';
    return 'summons_served';
  }

  if (firstContact) {
    const daysSinceFirst = Math.floor((now.getTime() - firstContact.getTime()) / (24 * 60 * 60 * 1000));
    if (daysSinceFirst <= 30) return 'validation_period';
    return 'post_validation';
  }

  return 'unknown';
}

export function getLetterBody(
  letterType: import('../domain/debtLegal').DebtLetterType,
  args: {
    creditorName: string;
    debtorName: string;
    date: string;
    caseNumber?: string;
    stateNote?: string;
    debtorAddress1?: string;
    debtorAddress2?: string;
    debtorCity?: string;
    debtorState?: string;
    debtorPostalCode?: string;
    debtorPhone?: string;
    debtorEmail?: string;
    recipientName?: string;
    recipientAddress?: string;
  }
): string {
  switch (letterType) {
    case 'validation_request':
      return getValidationRequestBody(args);
    case 'validation_round2_deficiency':
      return getValidationRound2DeficiencyBody(args);
    case 'validation_round3_final_demand':
      return getValidationRound3FinalDemandBody(args);
    case 'time_barred_response':
      return getTimeBarredResponseBody(args);
    case 'affidavit_of_dispute':
      return getAffidavitOfDisputeBody({ debtorName: args.debtorName, date: args.date, creditorOrPlaintiff: args.creditorName });
    case 'summons_response_affidavit':
      return getSummonsResponseAffidavitBody({ debtorName: args.debtorName, date: args.date, caseNumber: args.caseNumber, plaintiffName: args.creditorName });
    case 'cease_and_desist':
      return getCeaseAndDesistBody(args);
    case 'debt_dispute_letter':
      return getDebtDisputeLetterBody(args);
    default:
      return getDebtDisputeLetterBody(args);
  }
}
