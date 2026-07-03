import type { DocumentType } from '../domain/documents';
import type { DocScanProfile } from '../utils/imageScan';

/** User-facing vault folder — where the file lives in Evidence. */
export type EvidenceVaultFolder =
  | 'bureau_response'
  | 'affidavit'
  | 'summons_court'
  | 'debt_collector'
  | 'creditor_response'
  | 'court_filing'
  | 'bankruptcy_court'
  | 'identity'
  | 'proof_of_address'
  | 'credit_report'
  | 'contracts'
  | 'dispute_proof'
  | 'other';

export type EvidenceDocProfile = {
  docType: DocumentType;
  folder: EvidenceVaultFolder;
  label: string;
  /** Plain-language explanation shown after upload */
  userExplanation: string;
  icon: 'mail' | 'gavel' | 'scale' | 'shield' | 'file' | 'landmark' | 'id';
  primaryRoute: string;
  primaryRouteLabel: string;
};

const PROFILES: Record<DocumentType, EvidenceDocProfile> = {
  bureau_response: {
    docType: 'bureau_response',
    folder: 'bureau_response',
    label: 'Bureau response',
    userExplanation:
      'This looks like mail from Experian, Equifax, or TransUnion — investigation results, e-OSCAR outcome, or dispute letter reply.',
    icon: 'mail',
    primaryRoute: '/portal/disputes',
    primaryRouteLabel: 'Dispute Center',
  },
  affidavit: {
    docType: 'affidavit',
    folder: 'affidavit',
    label: 'Affidavit / sworn statement',
    userExplanation:
      'This appears to be a sworn affidavit, notarized statement, or declaration under penalty of perjury.',
    icon: 'gavel',
    primaryRoute: '/portal/debt',
    primaryRouteLabel: 'Debt & Court Center',
  },
  summons: {
    docType: 'summons',
    folder: 'summons_court',
    label: 'Summons / court complaint',
    userExplanation:
      'This looks like a civil summons, complaint, or court papers — answer deadline may apply.',
    icon: 'scale',
    primaryRoute: '/portal/debt',
    primaryRouteLabel: 'Debt & Court Center',
  },
  court_filing: {
    docType: 'court_filing',
    folder: 'court_filing',
    label: 'Court filing / motion',
    userExplanation:
      'This appears to be a court filing — motion, answer, discovery, or order (not the original summons).',
    icon: 'gavel',
    primaryRoute: '/portal/debt',
    primaryRouteLabel: 'Debt & Court Center',
  },
  collection_notice: {
    docType: 'collection_notice',
    folder: 'debt_collector',
    label: 'Debt collector letter',
    userExplanation:
      'This looks like a collection agency validation notice, demand letter, or collector communication.',
    icon: 'mail',
    primaryRoute: '/portal/debt',
    primaryRouteLabel: 'Validation Center',
  },
  creditor_response: {
    docType: 'creditor_response',
    folder: 'creditor_response',
    label: 'Original creditor response',
    userExplanation:
      'This appears to be a response from the original creditor or servicer (not a third-party collector).',
    icon: 'mail',
    primaryRoute: '/portal/debt',
    primaryRouteLabel: 'Debt Center',
  },
  bankruptcy_order: {
    docType: 'bankruptcy_order',
    folder: 'bankruptcy_court',
    label: 'Bankruptcy court document',
    userExplanation:
      'This looks like a bankruptcy petition, discharge order, dismissal, or court docket related to bankruptcy.',
    icon: 'landmark',
    primaryRoute: '/portal/bankruptcy',
    primaryRouteLabel: 'Bankruptcy Center',
  },
  id_document: {
    docType: 'id_document',
    folder: 'identity',
    label: 'Government ID',
    userExplanation: 'Driver license, passport, or state ID — used for identity verification on disputes.',
    icon: 'id',
    primaryRoute: '/portal/identity-theft',
    primaryRouteLabel: 'Identity Center',
  },
  ssn_card: {
    docType: 'ssn_card',
    folder: 'identity',
    label: 'Social Security card',
    userExplanation: 'SSN card image — store securely; attach only when a dispute requires it.',
    icon: 'id',
    primaryRoute: '/portal/documents',
    primaryRouteLabel: 'Documents Vault',
  },
  utility_bill: {
    docType: 'utility_bill',
    folder: 'proof_of_address',
    label: 'Proof of address',
    userExplanation: 'Utility bill, lease, or similar — proof of residence for bureau disputes.',
    icon: 'file',
    primaryRoute: '/portal/disputes',
    primaryRouteLabel: 'Dispute Center',
  },
  bank_statement: {
    docType: 'bank_statement',
    folder: 'dispute_proof',
    label: 'Bank statement / payment proof',
    userExplanation: 'Bank statement or payment record — useful for disputes and debt validation packets.',
    icon: 'file',
    primaryRoute: '/portal/documents',
    primaryRouteLabel: 'Documents Vault',
  },
  credit_report: {
    docType: 'credit_report',
    folder: 'credit_report',
    label: 'Credit report',
    userExplanation: 'Credit report PDF or export — upload to Reports for full parsing when possible.',
    icon: 'file',
    primaryRoute: '/portal/reports',
    primaryRouteLabel: 'Reports',
  },
  contract: {
    docType: 'contract',
    folder: 'contracts',
    label: 'Contract / agreement',
    userExplanation: 'Signed agreement, cardholder terms, or loan contract.',
    icon: 'file',
    primaryRoute: '/portal/debt',
    primaryRouteLabel: 'Debt Center',
  },
  ein_letter: {
    docType: 'ein_letter',
    folder: 'other',
    label: 'EIN letter',
    userExplanation: 'IRS EIN confirmation — business profile.',
    icon: 'file',
    primaryRoute: '/business/profile',
    primaryRouteLabel: 'Business Profile',
  },
  articles_of_incorporation: {
    docType: 'articles_of_incorporation',
    folder: 'other',
    label: 'Formation document',
    userExplanation: 'Articles of incorporation or formation certificate.',
    icon: 'file',
    primaryRoute: '/business/profile',
    primaryRouteLabel: 'Business Profile',
  },
  other: {
    docType: 'other',
    folder: 'other',
    label: 'Document',
    userExplanation: 'Saved to your evidence vault. Review the suggested folder below.',
    icon: 'file',
    primaryRoute: '/portal/documents',
    primaryRouteLabel: 'Documents Vault',
  },
  unknown: {
    docType: 'unknown',
    folder: 'other',
    label: 'Unclassified document',
    userExplanation: 'We saved your file. Pick a category below if our guess is wrong.',
    icon: 'file',
    primaryRoute: '/portal/documents',
    primaryRouteLabel: 'Documents Vault',
  },
};

export function profileForDocType(docType: DocumentType): EvidenceDocProfile {
  return PROFILES[docType] ?? PROFILES.unknown;
}

export function sectionKeyForFolder(folder: EvidenceVaultFolder): string {
  return folder;
}

/** Quick-pick upload intents — all are document types, grouped in the UI. */
export type UploadIntentId =
  | 'id_document'
  | 'ssn_card'
  | 'utility_bill'
  | 'bureau_response'
  | 'affidavit'
  | 'summons'
  | 'collection_notice'
  | 'creditor_response'
  | 'court_filing'
  | 'bankruptcy_order'
  | 'credit_report'
  | 'dispute_proof';

export type UploadPresetChip = {
  id: UploadIntentId;
  label: string;
  caption: string;
  scanner: DocScanProfile;
};

export type DocumentTypeGroup = {
  id: string;
  label: string;
  hint?: string;
  presets: UploadPresetChip[];
};

export const UPLOAD_IDENTITY_PRESETS = [
  { id: 'id_document' as const, label: 'Driver license / ID', caption: 'Driver license state ID passport identification card', scanner: 'id_card' as const },
  { id: 'ssn_card' as const, label: 'SSN card', caption: 'Social Security card SSN', scanner: 'ssn_card' as const },
] as const satisfies readonly UploadPresetChip[];

export const UPLOAD_ADDRESS_PRESETS = [
  { id: 'utility_bill' as const, label: 'Proof of address', caption: 'Utility bill electric gas lease proof of address', scanner: 'general' as const },
] as const satisfies readonly UploadPresetChip[];

export const UPLOAD_INTENT_PRESETS = [
  { id: 'bureau_response' as const, label: 'Bureau response', caption: 'Experian Equifax TransUnion investigation results dispute response', scanner: 'bureau_mail' as const },
  { id: 'affidavit' as const, label: 'Affidavit', caption: 'Affidavit sworn statement notarized declaration perjury', scanner: 'creditor_letter' as const },
  { id: 'summons' as const, label: 'Summons / complaint', caption: 'Civil summons complaint court lawsuit', scanner: 'creditor_letter' as const },
  { id: 'collection_notice' as const, label: 'Collector letter', caption: 'Debt collector validation notice collection letter FDCPA', scanner: 'creditor_letter' as const },
  { id: 'creditor_response' as const, label: 'Creditor / servicer letter', caption: 'Original creditor bank loan servicer mortgage auto lender letter', scanner: 'creditor_letter' as const },
  { id: 'court_filing' as const, label: 'Court filing', caption: 'Court motion answer discovery order filing', scanner: 'creditor_letter' as const },
  { id: 'bankruptcy_order' as const, label: 'Bankruptcy court', caption: 'Bankruptcy petition discharge order chapter 7 13 docket', scanner: 'creditor_letter' as const },
  { id: 'credit_report' as const, label: 'Credit report PDF', caption: 'Credit report tri-merge myfico export PDF', scanner: 'general' as const },
  { id: 'dispute_proof' as const, label: 'Payment / dispute proof', caption: 'Payment proof screenshot creditor mail dispute evidence', scanner: 'general' as const },
] as const satisfies readonly UploadPresetChip[];

export const UPLOAD_FORECLOSURE_PRESETS = [
  { id: 'creditor_response' as const, label: 'Servicer letter', caption: 'Mortgage loan servicer loss mitigation foreclosure notice', scanner: 'creditor_letter' as const },
  { id: 'court_filing' as const, label: 'Foreclosure filing', caption: 'Foreclosure complaint lis pendens court filing mortgage', scanner: 'creditor_letter' as const },
  { id: 'affidavit' as const, label: 'Affidavit / notice', caption: 'Acceleration notice default notice mortgage affidavit', scanner: 'creditor_letter' as const },
] as const satisfies readonly UploadPresetChip[];

export const UPLOAD_REPO_PRESETS = [
  { id: 'creditor_response' as const, label: 'Lender / repo letter', caption: 'Auto lender repossession notice deficiency letter lease', scanner: 'creditor_letter' as const },
  { id: 'court_filing' as const, label: 'Claim & delivery', caption: 'Claim and delivery replevin vehicle lawsuit court', scanner: 'creditor_letter' as const },
  { id: 'collection_notice' as const, label: 'Deficiency collector', caption: 'Deficiency balance collection after repossession', scanner: 'creditor_letter' as const },
] as const satisfies readonly UploadPresetChip[];

/** Unified document-type groups — single picker UX across vault + workstations. */
export function documentTypeGroupsForContext(
  ctx: 'general' | 'bureau' | 'debt' | 'foreclosure' | 'repossession' | 'bankruptcy' = 'general',
): DocumentTypeGroup[] {
  const identification: DocumentTypeGroup = {
    id: 'identification',
    label: 'Identification',
    hint: 'Government ID and SSN card — camera opens card-scan mode with edge crop.',
    presets: [...UPLOAD_IDENTITY_PRESETS],
  };
  const proofOfAddress: DocumentTypeGroup = {
    id: 'proof_of_address',
    label: 'Proof of address',
    hint: 'Utility bill, lease, or bank statement for bureau identity packets.',
    presets: [...UPLOAD_ADDRESS_PRESETS],
  };
  const bureau: DocumentTypeGroup = {
    id: 'bureau',
    label: 'Bureau correspondence',
    presets: UPLOAD_INTENT_PRESETS.filter((p) => ['bureau_response', 'credit_report'].includes(p.id)) as UploadPresetChip[],
  };
  const court: DocumentTypeGroup = {
    id: 'court',
    label: 'Court & legal filings',
    presets: UPLOAD_INTENT_PRESETS.filter((p) =>
      ['affidavit', 'summons', 'court_filing', 'bankruptcy_order'].includes(p.id),
    ) as UploadPresetChip[],
  };
  const debt: DocumentTypeGroup = {
    id: 'debt_correspondence',
    label: 'Debt & collector mail',
    presets: UPLOAD_INTENT_PRESETS.filter((p) => ['collection_notice', 'creditor_response'].includes(p.id)) as UploadPresetChip[],
  };
  const disputeProof: DocumentTypeGroup = {
    id: 'dispute_proof',
    label: 'Dispute & payment proof',
    presets: UPLOAD_INTENT_PRESETS.filter((p) => p.id === 'dispute_proof') as UploadPresetChip[],
  };

  if (ctx === 'foreclosure') {
    return [
      identification,
      proofOfAddress,
      {
        id: 'foreclosure',
        label: 'Foreclosure / mortgage',
        presets: [...UPLOAD_FORECLOSURE_PRESETS],
      },
      bureau,
      court,
      debt,
      disputeProof,
    ].filter((g) => g.presets.length > 0);
  }
  if (ctx === 'repossession') {
    return [
      identification,
      proofOfAddress,
      {
        id: 'repossession',
        label: 'Repossession / auto',
        presets: [...UPLOAD_REPO_PRESETS],
      },
      bureau,
      court,
      debt,
      disputeProof,
    ].filter((g) => g.presets.length > 0);
  }
  if (ctx === 'bureau') {
    return [identification, proofOfAddress, bureau, disputeProof].filter((g) => g.presets.length > 0);
  }
  if (ctx === 'bankruptcy') {
    return [
      identification,
      proofOfAddress,
      {
        id: 'bankruptcy',
        label: 'Bankruptcy court',
        presets: UPLOAD_INTENT_PRESETS.filter((p) => p.id === 'bankruptcy_order') as UploadPresetChip[],
      },
      court,
      bureau,
      disputeProof,
    ].filter((g) => g.presets.length > 0);
  }
  if (ctx === 'debt') {
    return [identification, proofOfAddress, debt, court, disputeProof, bureau].filter((g) => g.presets.length > 0);
  }
  return [identification, proofOfAddress, bureau, court, debt, disputeProof].filter((g) => g.presets.length > 0);
}

export function allPresetsFromGroups(groups: DocumentTypeGroup[]): UploadPresetChip[] {
  const out: UploadPresetChip[] = [];
  const seen = new Set<string>();
  for (const g of groups) {
    for (const p of g.presets) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

export function docTypeFromIntent(intent: UploadIntentId): DocumentType {
  if (intent === 'dispute_proof') return 'bank_statement';
  if (intent === 'id_document') return 'id_document';
  if (intent === 'ssn_card') return 'ssn_card';
  if (intent === 'utility_bill') return 'utility_bill';
  if (intent === 'credit_report') return 'credit_report';
  return intent;
}

export function guessDocTypeFromCaptionFilename(caption?: string, filename?: string): DocumentType {
  const s = `${caption || ''} ${filename || ''}`.toLowerCase();
  if (/bureau|experian|equifax|transunion|investigation|e-oscar|dispute results/.test(s)) return 'bureau_response';
  if (/affidavit|sworn|notary|perjury|declaration under/.test(s)) return 'affidavit';
  if (/summons|complaint/.test(s) && !/answer/.test(s)) return 'summons';
  if (/motion|discovery|interrogator|request for production|court order|judgment|subpoena/.test(s)) return 'court_filing';
  if (/bankruptcy|chapter\s*7|chapter\s*13|discharge order|petition.*bankrupt|341 meeting/.test(s)) return 'bankruptcy_order';
  if (/collection|collector|debt validation|validation notice|mini.?miranda/.test(s)) return 'collection_notice';
  if (/creditor response|original creditor|cardholder agreement|loan servicer/.test(s)) return 'creditor_response';
  if (/driver|passport|id card|identification|state id/.test(s)) return 'id_document';
  if (/ssn|social security/.test(s)) return 'ssn_card';
  if (/utility|electric|gas bill|proof of address|lease/.test(s)) return 'utility_bill';
  if (/bank statement|checking|savings/.test(s)) return 'bank_statement';
  if (/credit report|tri-merge|myfico/.test(s)) return 'credit_report';
  if (/ein|irs/.test(s)) return 'ein_letter';
  if (/articles|incorporation/.test(s)) return 'articles_of_incorporation';
  if (/contract|agreement|signed/.test(s)) return 'contract';
  return 'unknown';
}
