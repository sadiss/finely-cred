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
    legalBasis: [FDCPA_809, BEST_EVIDENCE],
    contractLawAngle: 'You are not admitting the existence of a valid contract; you are demanding proof of the alleged obligation and chain of assignment before any further collection activity.',
    bankingLawAngle: 'Under banking and UCC principles, the party claiming a right to collect must prove the underlying obligation and valid assignment. Validation shifts the burden to them.',
    keyPrinciple: 'Validation shifts the burden to the collector. If they cannot validate, they must stop collecting.',
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
    recommendedLetterTypes: ['debt_dispute_letter', 'cease_and_desist', 'affidavit_of_dispute'],
  },
  {
    scenario: 'unknown',
    label: 'Not sure which applies',
    description: 'Review the options below and select the scenario that fits. When in doubt, validation and dispute in writing preserve your rights.',
    recommendedLetterTypes: ['validation_request', 'debt_dispute_letter', 'affidavit_of_dispute'],
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

RE: Demand for Validation of Alleged Debt — 15 U.S.C. § 1692g

To Whom It May Concern:

I am writing in response to your communication regarding an alleged debt. Under 15 U.S.C. § 1692g(a), I have the right to request validation of this debt within 30 days of the first communication. I am exercising that right now.

Please provide the following:

1. The name and address of the original creditor.
2. Verification that you are licensed to collect debts in my state, if applicable.
3. A copy of the signed contract or other competent evidence proving I agreed to pay this debt and that you or your principal have the right to collect it.
4. An itemized accounting showing how the amount claimed was calculated, including any interest and fees.
5. Proof of the chain of assignment from the original creditor to the current holder.

Until you provide proper validation, you must cease all collection activity, including reporting to credit bureaus, under 15 U.S.C. § 1692g(b).

This is not a refusal to pay a valid debt. This is a request for validation as provided by federal law. I dispute the debt until such validation is provided.

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

1. I have been asked to respond to an alleged debt or claim concerning ${args.creditorOrPlaintiff}.

2. I dispute the alleged debt. I do not have sufficient knowledge or information to admit the existence of a valid contract or obligation for the amount claimed.

3. I have not been provided with a signed contract, a complete chain of assignment, or other competent evidence establishing that the claimant has the right to collect the amount claimed.

4. Under applicable contract law and burden-of-proof rules, the party asserting the claim bears the burden of proving the existence and terms of a valid obligation. I put the claimant to its proof.

5. The foregoing is true and correct to the best of my knowledge.

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

2. I dispute the claim. I assert the following defenses, among others as may apply: (a) the statute of limitations has run on the alleged cause of action; (b) the plaintiff has not proven the existence of a valid contract or obligation; (c) the plaintiff has not proven chain of title or standing to collect; (d) the plaintiff failed to validate the debt upon my request as required by 15 U.S.C. § 1692g.

3. I do not admit the allegations in the complaint. The plaintiff bears the burden of proof. I put the plaintiff to its proof on all elements of its claim.

4. The foregoing is true and correct to the best of my knowledge.

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

RE: Formal Dispute of Alleged Debt

To Whom It May Concern:

I am writing to formally dispute the alleged debt you have attributed to me concerning ${args.creditorName}. I dispute the amount, the validity of the debt, and/or your right to collect it.

Under the Fair Debt Collection Practices Act and the Fair Credit Reporting Act, I am entitled to verification and accurate reporting. I request that you:

1. Provide verification of the debt and your authority to collect it.
2. Cease reporting this account to credit bureaus until you have verified it.
3. Provide me with the name of the original creditor and an itemized accounting.

Until this dispute is resolved, do not treat this account as valid or reported in compliance with the law without proper verification.

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
