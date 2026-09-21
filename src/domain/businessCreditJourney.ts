/** Canonical 7-step business credit journey (public + portal + ladder + roadmap). */

export type BusinessJourneyStepId =
  | 'foundation'
  | 'profile_industry'
  | 'bureau_files'
  | 'tier1_vendors'
  | 'revolving_fleet'
  | 'docs_funding'
  | 'personal_link';

export type BusinessJourneyStep = {
  id: BusinessJourneyStepId;
  step: number;
  title: string;
  subtitle: string;
  why: string;
  do: string[];
  avoid: string[];
  checklist: string[];
  portalPath: string;
  publicCta?: { label: string; path: string };
};

export const BUSINESS_CREDIT_JOURNEY_STEPS: BusinessJourneyStep[] = [
  {
    id: 'foundation',
    step: 1,
    title: 'Foundation',
    subtitle: 'Entity, EIN, and address discipline',
    why:
      'Your business must exist as one verifiable identity. Mismatched addresses, phones, or entity names are the #1 silent fundability killer.',
    do: [
      'Match legal name + suffix on SOS, bank, and vendor apps',
      'Pick one address format and use it everywhere',
      'Store EIN letter (CP 575) in Documents',
    ],
    avoid: ['Mixing personal and business addresses randomly', 'Changing entity details mid-sequence', 'Using unlisted VOIP as sole phone'],
    checklist: ['SOS filing current', 'EIN on file', 'Address standardized', 'Business phone listed'],
    portalPath: '/business/profile',
    publicCta: { label: 'Start in portal', path: '/business/profile' },
  },
  {
    id: 'profile_industry',
    step: 2,
    title: 'Profile & industry',
    subtitle: 'NAICS, structure, operating story',
    why: 'Industry and entity type determine which vendors report and which underwriting paths are realistic.',
    do: ['Document NAICS', 'Record ownership structure', 'Use domain email on applications'],
    avoid: ['Misclassified NAICS to “game” vendors', 'Inconsistent owner names across bureaus'],
    checklist: ['NAICS recorded', 'Ownership documented', 'Domain email live', 'Elevator pitch for lenders'],
    portalPath: '/business/profile',
  },
  {
    id: 'bureau_files',
    step: 3,
    title: 'Bureau files',
    subtitle: 'D&B, Experian Business, Equifax / SBFE — education only',
    why:
      'Commercial bureaus are not consumer FICO. PAYDEX, Intelliscore, and SBSS measure different things — we document; we do not promise scores.',
    do: ['Register/maintain DUNS where appropriate', 'Pull baseline business files', 'Log scores as snapshots (no hype)'],
    avoid: ['Fake instant PAYDEX claims', 'Ignoring mismatched principals on file'],
    checklist: ['D&B profile reviewed', 'Experian Biz checked', 'Equifax Biz checked', 'Snapshots saved'],
    portalPath: '/business/bureaus',
    publicCta: { label: 'Book session', path: '/enlightenment-session' },
  },
  {
    id: 'tier1_vendors',
    step: 4,
    title: 'Tier-1 vendors / net-30',
    subtitle: 'Reporting-first vendor sequence',
    why: 'Reported payment history builds the file. Sequence beats volume — Tier-1 before prestige accounts.',
    do: ['Open starter vendors that report', 'Pay early or on time', 'Keep invoices in Documents'],
    avoid: ['Applying for Tier-3 before file exists', 'Late payments on net terms'],
    checklist: ['Tier-1 list approved', 'First orders placed', 'Payment calendar set'],
    portalPath: '/business/vendors',
  },
  {
    id: 'revolving_fleet',
    step: 5,
    title: 'Revolving & fleet',
    subtitle: 'Only when signals are clean',
    why: 'Revolving, fleet, and cash products come after reporting history and banking behavior support them.',
    do: ['Run lender logic before applying', 'Match product to file age', 'Keep utilization disciplined'],
    avoid: ['Hard-pull spree', 'Applying while personal file is unstable'],
    checklist: ['Lender logic run', 'Bank statements organized', 'Product fit documented'],
    portalPath: '/business/funding',
  },
  {
    id: 'docs_funding',
    step: 6,
    title: 'Docs & funding package',
    subtitle: 'Underwriting-ready vault',
    why: 'Approvals improve with coherent docs, banking narrative, and dispute hygiene on the business file.',
    do: ['Upload entity docs + statements', 'Track disputes on business negatives', 'Prepare funding package folder'],
    avoid: ['No-doc optimism', 'Missing tax/entity alignment'],
    checklist: ['Entity docs uploaded', 'Bank statements current', 'Disputes triaged', 'Package checklist complete'],
    portalPath: '/business/documents',
    publicCta: { label: 'Funding readiness', path: '/funding-readiness' },
  },
  {
    id: 'personal_link',
    step: 7,
    title: 'Personal credit link',
    subtitle: 'PG / personal file — Finely restore handoff',
    why:
      'Many business products still require personal guarantee. Stabilize personal credit before aggressive business apps when PG risk is high.',
    do: ['Identify PG-required products', 'Triage personal collections/utilization', 'Use Start Restore for roadmap'],
    avoid: ['Promising business approval via personal deletes alone'],
    checklist: ['PG exposure mapped', 'Personal restore path chosen', 'Consent documented'],
    portalPath: '/start',
    publicCta: { label: 'Start Restore $147', path: '/start' },
  },
];

export const JOURNEY_STEP_COUNT = BUSINESS_CREDIT_JOURNEY_STEPS.length;

/** Legacy roadmap step ids completed when a journey step is marked done. */
export const JOURNEY_TO_ROADMAP: Record<BusinessJourneyStepId, string[]> = {
  foundation: ['foundation_identity', 'address_consistency', 'phone_411', 'ein_entity'],
  profile_industry: ['domain_email'],
  bureau_files: ['duns_setup', 'bureau_checks'],
  tier1_vendors: ['vendor_tier1'],
  revolving_fleet: ['vendor_tier2', 'funding_package'],
  docs_funding: ['funding_package'],
  personal_link: [],
};

export function journeyStepFromParam(raw: string | null | undefined): BusinessJourneyStepId {
  const n = Number(raw);
  if (n >= 1 && n <= JOURNEY_STEP_COUNT) {
    return BUSINESS_CREDIT_JOURNEY_STEPS[n - 1].id;
  }
  const byId = BUSINESS_CREDIT_JOURNEY_STEPS.find((s) => s.id === raw);
  return byId?.id ?? 'foundation';
}

export function journeyPortalHref(step: BusinessJourneyStep): string {
  if (step.portalPath === '/business/profile') {
    return `/business/profile?journey=${step.id}`;
  }
  if (step.portalPath.startsWith('/business')) return step.portalPath;
  return '/business/dashboard';
}

export function journeyStepForPath(pathname: string, journeyQuery?: string | null): BusinessJourneyStepId | null {
  if (journeyQuery && BUSINESS_CREDIT_JOURNEY_STEPS.some((s) => s.id === journeyQuery)) {
    return journeyQuery as BusinessJourneyStepId;
  }
  const p = pathname.split('?')[0];
  if (p.startsWith('/business/profile')) return 'foundation';
  if (p.startsWith('/business/bureaus')) return 'bureau_files';
  if (p.startsWith('/business/vendors')) return 'tier1_vendors';
  if (p.startsWith('/business/funding') || p.startsWith('/business/lender-logic')) return 'revolving_fleet';
  if (p.startsWith('/business/documents') || p.startsWith('/business/disputes')) return 'docs_funding';
  if (p.startsWith('/business/billion-path')) return 'docs_funding';
  if (p.startsWith('/business/dashboard')) return null;
  if (p.startsWith('/business/')) return 'foundation';
  return null;
}
