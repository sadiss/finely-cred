export type BusinessBureau = 'dnb' | 'experian_business' | 'equifax_business';

export type BusinessScoreType =
  | 'PAYDEX'
  | 'IntelliscorePlus'
  | 'EquifaxBusinessScore'
  | 'FICO_SBSS'
  | 'Other';

export type BusinessScoreSnapshot = {
  id: string;
  partnerId: string;
  bureau: BusinessBureau;
  scoreType: BusinessScoreType;
  scoreValue: number | null;
  reportedTradelines: number | null;
  reportedPaidPayments: number | null;
  derogFlags: string[];
  notes?: string;
  updatedAt: string;
  createdAt: string;
};

export type BusinessRoadmapStepId =
  | 'foundation_identity'
  | 'address_consistency'
  | 'phone_411'
  | 'domain_email'
  | 'ein_entity'
  | 'duns_setup'
  | 'vendor_tier1'
  | 'vendor_tier2'
  | 'bureau_checks'
  | 'funding_package';

export type BusinessRoadmapStep = {
  id: BusinessRoadmapStepId;
  title: string;
  whyItMatters: string;
  do: string[];
  avoid: string[];
};

export const BUSINESS_ROADMAP_STEPS: BusinessRoadmapStep[] = [
  {
    id: 'foundation_identity',
    title: 'Foundation identity (business “personhood”)',
    whyItMatters: 'Your business must exist as a coherent identity: consistent records, compliant signals, and traceable contact points.',
    do: ['Confirm legal name + suffix everywhere', 'Use one standardized address format', 'Keep consistent phone + email + domain'],
    avoid: ['Multiple mismatched variations across profiles', 'Using personal phone/email for everything', 'Changing details mid-build'],
  },
  {
    id: 'address_consistency',
    title: 'Address consistency (the #1 silent killer)',
    whyItMatters: 'Mismatched addresses create verification failures and underwriting suspicion across bureaus, banks, and vendors.',
    do: ['Pick one mailing address and stick with it', 'Format suite/unit consistently', 'Match state records + filings'],
    avoid: ['Mixing PO box and street randomly', 'Different abbreviations across profiles', 'Inconsistent suite numbers'],
  },
  {
    id: 'phone_411',
    title: 'Phone hygiene + 411 listing',
    whyItMatters: 'Phone credibility supports identity verification, vendor approvals, and relationship-based lending.',
    do: ['Use a dedicated business line', 'Aim for a 411 listing when appropriate', 'Ensure your phone matches web + profiles'],
    avoid: ['Using a disposable VOIP number everywhere', 'Mismatched phone numbers by bureau/vendor'],
  },
  {
    id: 'domain_email',
    title: 'Domain + email consistency',
    whyItMatters: 'A domain email is a trust signal and reduces friction during verification and underwriting.',
    do: ['Use a domain email (name@company.com)', 'Match domain across listings', 'Keep branding consistent'],
    avoid: ['Gmail/Yahoo for funding apps', 'Different domains across assets'],
  },
  {
    id: 'ein_entity',
    title: 'Entity + EIN readiness',
    whyItMatters: 'Clean entity/EIN setup is the basis for bureau identity and vendor accounts.',
    do: ['Keep EIN letter (CP 575) stored', 'Know NAICS/industry code', 'Ensure filings match operating info'],
    avoid: ['Conflicting ownership/entity data', 'Missing docs when asked'],
  },
  {
    id: 'duns_setup',
    title: 'D‑U‑N‑S + bureau profile setup',
    whyItMatters: 'D&B identity and related profiles are commonly referenced and can unlock reporting pathways.',
    do: ['Verify D‑U‑N‑S', 'Align business name/address/phone', 'Track profile completeness'],
    avoid: ['Submitting inconsistent info', 'Ignoring profile errors'],
  },
  {
    id: 'vendor_tier1',
    title: 'Vendor Tier 1 (reporting first)',
    whyItMatters: 'Reported payments can build a business file. The sequence matters more than “random accounts.”',
    do: ['Start with reporting-friendly vendors', 'Pay on time (or early)', 'Track reported payments'],
    avoid: ['Applying for high tiers too early', 'Late payments that poison your file'],
  },
  {
    id: 'vendor_tier2',
    title: 'Vendor Tier 2 (higher limits, after signals)',
    whyItMatters: 'Once signals exist, higher tiers become more plausible without rejections.',
    do: ['Move up only after file shows activity', 'Maintain utilization discipline', 'Keep docs ready'],
    avoid: ['Jumping tiers because “someone said so”', 'Multiple hard pulls without plan'],
  },
  {
    id: 'bureau_checks',
    title: 'Bureau checks + corrections',
    whyItMatters: 'Business files can contain wrong addresses, wrong principals, or outdated trade details—fix them early.',
    do: ['Check D&B/Experian Biz/Equifax Biz regularly', 'Track scores and counts', 'Dispute inaccuracies with evidence'],
    avoid: ['Letting inaccuracies persist for months', 'Disputing without organized evidence'],
  },
  {
    id: 'funding_package',
    title: 'Funding package + lender logic',
    whyItMatters: 'Approval improves when you present a clean profile, coherent story, and an underwriting-ready package.',
    do: ['Prepare docs (bank statements, entity docs)', 'Use relationship strategy where possible', 'Run lender logic and follow next actions'],
    avoid: ['No-doc optimism without relationship building', 'Applying without alignment'],
  },
];

export type BusinessNegativeItem = {
  id: string;
  bureau: BusinessBureau;
  category: string;
  description: string;
  amountCents?: number;
  date?: string;
  status: 'identified' | 'disputing' | 'mailed' | 'resolved';
};

export type BusinessDispute = {
  id: string;
  partnerId: string;
  title: string;
  bureau: BusinessBureau;
  status: 'draft' | 'in_progress' | 'mailed' | 'resolved';
  negativeItems: BusinessNegativeItem[];
  evidenceIds: string[];
  letterIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type BusinessCreditProfile = {
  partnerId: string;
  roadmap: Partial<Record<BusinessRoadmapStepId, { done: boolean; doneAt?: string }>>;
  scores: BusinessScoreSnapshot[];
  disputes: BusinessDispute[];
  updatedAt: string;
};

