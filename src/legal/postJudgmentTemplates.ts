/**
 * Post-judgment letter template stubs — process guidance only, not legal advice.
 * Reg E / Reg Z / 31 CFR 212 / non-party account / records requests.
 */

import type { LegalCitation } from '../domain/debtLegal';
import type { DebtLetterBuildArgs } from './debtLetterBuildArgs';
import { formatLetterSenderBlock } from '../lib/letterSenderBlock';
import { stripLetterVendorBranding } from '../lib/letterBodySafety';
import { formatLetterRecipientBlock } from '../lib/letterMailingAddress';

export type PostJudgmentLetterType =
  | 'reg_e_unauthorized_transfer_stop'
  | 'reg_z_card_offset_demand'
  | 'cfr_212_protected_benefits_notice'
  | 'non_party_minor_account_demand'
  | 'records_signature_card_request';

export type PostJudgmentLetterSpec = {
  id: PostJudgmentLetterType;
  title: string;
  shortDescription: string;
  whenToUse: string[];
  legalBasis: LegalCitation[];
  keyPrinciple: string;
};

export type PostJudgmentLetterBuildArgs = DebtLetterBuildArgs & {
  accountBank?: string;
  mechanism?: 'levy' | 'setoff' | 'ach';
  judgmentState?: string;
  accountState?: string;
  nonPartyInvolved?: boolean;
  transferDate?: string;
  transferAmount?: string;
};

const NOT_LEGAL_ADVICE_DISCLAIMER =
  'IMPORTANT: This draft is educational process guidance only. It is not legal advice. Have a licensed attorney review and customize before sending.';

const REG_E_1005: LegalCitation = {
  category: 'banking_law',
  cite: '12 C.F.R. § 1005.6 / 12 C.F.R. § 1005.11',
  shortName: 'Reg E — unauthorized EFT',
  description:
    'Electronic Fund Transfer Act / Regulation E — partners may assert unauthorized electronic transfers and request investigation, correction, and stop-payment where applicable.',
};

const REG_Z_OFFSET: LegalCitation = {
  category: 'banking_law',
  cite: '12 C.F.R. § 1026.12(d) / 15 U.S.C. § 1666i',
  shortName: 'Reg Z — card issuer offset',
  description:
    'Truth in Lending Act / Regulation Z limits when a card issuer may apply funds in a deposit account to offset a credit card balance.',
};

const CFR_212: LegalCitation = {
  category: 'banking_law',
  cite: '31 C.F.R. Part 212',
  shortName: '31 CFR 212 — benefit garnishment',
  description:
    'Federal rule protecting certain benefit payments in accounts from garnishment — banks must follow lookup and notice procedures.',
};

const UCC_RECORDS: LegalCitation = {
  category: 'evidence',
  cite: 'Account records / signature card / deposit agreement',
  shortName: 'Account records',
  description:
    'Signature cards, account agreements, and ownership records establish who authorized the account and what offset / levy rights the institution claims.',
};

function safeText(v: unknown) {
  return String(v ?? '').trim();
}

function partnerBlock(args: PostJudgmentLetterBuildArgs) {
  return formatLetterSenderBlock({
    name: args.debtorName,
    address1: args.debtorAddress1,
    address2: args.debtorAddress2,
    city: args.debtorCity,
    state: args.debtorState,
    postalCode: args.debtorPostalCode,
  });
}

function bankBlock(args: PostJudgmentLetterBuildArgs) {
  const bank = safeText(args.accountBank) || safeText(args.recipientName) || 'Financial Institution';
  return formatLetterRecipientBlock({
    name: bank,
    address: args.recipientAddress ?? '',
    missing: !args.recipientAddress,
  });
}

function letterHeader(args: PostJudgmentLetterBuildArgs) {
  return `${partnerBlock(args)}

${args.date}

${bankBlock(args)}`;
}

function letterFooter(args: PostJudgmentLetterBuildArgs) {
  return `Sincerely,

${args.debtorName}

---
${NOT_LEGAL_ADVICE_DISCLAIMER}`;
}

export const POST_JUDGMENT_LETTER_SPECS: PostJudgmentLetterSpec[] = [
  {
    id: 'reg_e_unauthorized_transfer_stop',
    title: 'Reg E — Unauthorized Transfer & Stop Payment',
    shortDescription:
      'Demand investigation of an unauthorized electronic transfer (ACH / EFT) and request stop-payment / reversal where Reg E applies.',
    whenToUse: [
      'After an unexpected ACH debit or electronic withdrawal tied to a judgment or collector',
      'When the partner did not authorize the specific transfer amount or payee',
      'When you need the bank to investigate under Regulation E timelines',
    ],
    legalBasis: [REG_E_1005],
    keyPrinciple:
      'Put the unauthorized transfer in writing promptly; Reg E investigation clocks start when the institution receives notice.',
  },
  {
    id: 'reg_z_card_offset_demand',
    title: 'Reg Z — Card-Issuer Offset Demand',
    shortDescription:
      'Challenge a deposit-account offset applied by a card issuer to a credit card balance without proper notice and consent.',
    whenToUse: [
      'When the same bank seized deposit funds to offset a credit card judgment or balance',
      'When offset occurred without clear advance agreement or required notice',
      'When mechanism is setoff at a card-issuing institution',
    ],
    legalBasis: [REG_Z_OFFSET],
    keyPrinciple:
      'Card-issuer offset rights are limited — demand proof of agreement, notice, and calculation of the offset amount.',
  },
  {
    id: 'cfr_212_protected_benefits_notice',
    title: '31 CFR 212 — Protected Benefits Notice to Bank',
    shortDescription:
      'Notify the bank that levied or restrained funds include federally protected benefit payments subject to 31 CFR Part 212.',
    whenToUse: [
      'Social Security, SSI, VA, or other protected benefits were deposited into the levied account',
      'After a levy or restraining notice on a checking account',
      'When traceable benefit deposits may be exempt from ordinary judgment collection',
    ],
    legalBasis: [CFR_212],
    keyPrinciple:
      'Identify protected benefit deposits and ask the institution to follow federal benefit-garnishment lookup and notice rules.',
  },
  {
    id: 'non_party_minor_account_demand',
    title: 'Non-Party / Minor Account Demand',
    shortDescription:
      'Demand release of funds when the levied account is owned by or primarily for a non-party (minor, spouse, business entity).',
    whenToUse: [
      'Account is in a minor’s name or holds funds belonging to someone other than the judgment debtor',
      'Joint account where the partner is not the judgment debtor',
      'Business account not subject to the personal judgment',
    ],
    legalBasis: [UCC_RECORDS, CFR_212],
    keyPrinciple:
      'Levy reaches only the judgment debtor’s interest — demand proof of ownership and release wrongly restrained funds.',
  },
  {
    id: 'records_signature_card_request',
    title: 'Records Request — Signature Card & Account Agreement',
    shortDescription:
      'Request signature card, account agreement, and levy / offset authorization records from the financial institution.',
    whenToUse: [
      'Before filing an exemption claim or Reg E dispute',
      'When ownership, authorization, or offset authority is unclear',
      'To document who signed for the account and what rights the bank claims',
    ],
    legalBasis: [UCC_RECORDS, REG_E_1005, REG_Z_OFFSET],
    keyPrinciple:
      'Obtain account-level records before arguing exemption, unauthorized transfer, or wrongful levy.',
  },
];

export function getRegEUnauthorizedTransferBody(args: PostJudgmentLetterBuildArgs): string {
  const transferDate = safeText(args.transferDate) || 'the date shown on my account statement';
  const transferAmount = safeText(args.transferAmount) || 'the amount debited';
  const account = safeText(args.accountNumber) || '[account number]';
  return stripLetterVendorBranding(
    `${letterHeader(args)}

RE: Unauthorized electronic transfer — Reg E investigation and stop payment
Account: ${account}
Transfer date: ${transferDate}
Amount: ${transferAmount}

To Whom It May Concern:

I am writing to report an electronic fund transfer from my account that I did not authorize. Under the Electronic Fund Transfer Act and Regulation E (12 C.F.R. Part 1005), I request that you investigate this transfer, treat it as unauthorized unless you provide proof of my authorization, and take appropriate corrective action including reversal or recredit if required.

Please confirm in writing:
1. The payee, originator, and trace number for the transfer on ${transferDate} for ${transferAmount}.
2. Whether you have an ACH authorization, signature, or other record showing I authorized this specific debit.
3. That you have placed a stop on further unauthorized debits from the same originator while this dispute is open.
4. The investigation deadline you are applying under Reg E and when I will receive results.

This notice is process guidance I am sending to preserve my rights. It is not legal advice.

${letterFooter(args)}`,
  );
}

export function getRegZCardOffsetDemandBody(args: PostJudgmentLetterBuildArgs): string {
  const account = safeText(args.accountNumber) || '[deposit account number]';
  const creditor = safeText(args.creditorName) || safeText(args.recipientName) || 'your institution';
  return stripLetterVendorBranding(
    `${letterHeader(args)}

RE: Demand regarding deposit-account offset — Regulation Z
Deposit account: ${account}
Card issuer / creditor: ${creditor}

To Whom It May Concern:

I dispute the offset of funds from my deposit account applied toward a credit card balance or judgment claimed by ${creditor}. Under the Truth in Lending Act and Regulation Z (12 C.F.R. § 1026.12(d)), a card issuer’s right to offset deposit funds is limited and generally requires a clear agreement and proper notice.

Please provide in writing within 15 business days:
1. The deposit account agreement and cardholder agreement provisions you rely on for offset or setoff.
2. Proof that I expressly agreed that ${creditor} may seize deposit funds for this debt, including the date and form of consent.
3. Notice you claim to have sent before the offset, with mailing proof.
4. An itemized calculation of the offset amount and the remaining deposit balance.
5. Immediate restoration of any amount offset without valid authority, or confirmation that no offset has occurred.

I reserve all rights under federal and state law. This letter is educational process guidance — not legal advice.

${letterFooter(args)}`,
  );
}

export function getCfr212ProtectedBenefitsBody(args: PostJudgmentLetterBuildArgs): string {
  const account = safeText(args.accountNumber) || '[account number]';
  const stateNote = safeText(args.accountState) || safeText(args.judgmentState) || safeText(args.debtorState);
  return stripLetterVendorBranding(
    `${letterHeader(args)}

RE: Protected benefit funds — 31 C.F.R. Part 212
Account: ${account}
State: ${stateNote || '[state]'}

To Whom It May Concern:

I notify you that funds in the above account include or may include benefit payments protected from garnishment by federal law, including rules under 31 C.F.R. Part 212 and related benefit-garnishment protections.

Please:
1. Identify whether you received a levy, restraining notice, or turnover demand and provide a copy with the date served.
2. Conduct the benefit-payment lookup and notice process required under 31 C.F.R. Part 212 if applicable.
3. Identify any Social Security, SSI, VA, or other protected benefit deposits in the account for the past 60 days and segregate protected amounts from leviable funds.
4. Confirm in writing that protected benefit funds will not be turned over until any required notice period expires and any valid exemption claim is resolved.

This notice is process guidance to help you apply federal protected-benefit rules. It is not legal advice.

${letterFooter(args)}`,
  );
}

export function getNonPartyMinorAccountBody(args: PostJudgmentLetterBuildArgs): string {
  const account = safeText(args.accountNumber) || '[account number]';
  const nonPartyNote = args.nonPartyInvolved
    ? 'This account involves a non-party owner or minor — funds do not belong solely to the judgment debtor.'
    : 'Funds in this account may not belong to the judgment debtor named on the writ.';
  return stripLetterVendorBranding(
    `${letterHeader(args)}

RE: Wrongful levy — non-party / minor account owner
Account: ${account}

To Whom It May Concern:

${nonPartyNote}

I demand that you immediately review ownership of the restrained account and release any funds that do not belong to the judgment debtor. A levy or restraining notice generally reaches only the debtor’s interest in an account, not the full balance when a non-party owner, minor, or business entity holds ownership.

Please provide within 10 business days:
1. Signature card, account opening records, and titling documents for this account.
2. The name of each account owner and the percentage or nature of each owner’s interest.
3. Confirmation that funds belonging to non-parties or minors will not be turned over.
4. Restoration of any funds already taken that were not the judgment debtor’s property.

This demand is educational process guidance — not legal advice. Have counsel review before filing any court motion.

${letterFooter(args)}`,
  );
}

export function getRecordsSignatureCardBody(args: PostJudgmentLetterBuildArgs): string {
  const account = safeText(args.accountNumber) || '[account number]';
  return stripLetterVendorBranding(
    `${letterHeader(args)}

RE: Records request — signature card, account agreement, levy authorization
Account: ${account}

To Whom It May Concern:

I request copies of the following records for the account listed above:
1. Signature card and account ownership records for all parties on the account.
2. Deposit account agreement and any amendment governing setoff, offset, or levy rights.
3. Cardholder agreement if this institution is also the card issuer for a related credit account.
4. Copy of any levy, restraining notice, writ, or turnover demand you received, with date of service.
5. Internal notes or worksheets used to calculate the restrained or offset amount.

Please mail or provide secure electronic copies within 15 business days. These records are needed to evaluate exemption claims, Reg E unauthorized-transfer rights, and whether any levy reached non-party funds.

This records request is process guidance — not legal advice. I may also pursue records through court discovery if required.

${letterFooter(args)}`,
  );
}

export function getPostJudgmentLetterBody(
  letterType: PostJudgmentLetterType,
  args: PostJudgmentLetterBuildArgs,
): string {
  switch (letterType) {
    case 'reg_e_unauthorized_transfer_stop':
      return getRegEUnauthorizedTransferBody(args);
    case 'reg_z_card_offset_demand':
      return getRegZCardOffsetDemandBody(args);
    case 'cfr_212_protected_benefits_notice':
      return getCfr212ProtectedBenefitsBody(args);
    case 'non_party_minor_account_demand':
      return getNonPartyMinorAccountBody(args);
    case 'records_signature_card_request':
      return getRecordsSignatureCardBody(args);
    default:
      return getRecordsSignatureCardBody(args);
  }
}
