/** Public careers navigation — each track has its own page. */
export type PublicCareerTrackId =
  | 'credit_specialists'
  | 'agency_partners'
  | 'affiliates'
  | 'au_sellers'
  | 'case_help'
  | 'real_estate';

export type PublicCareerTrack = {
  id: PublicCareerTrackId;
  label: string;
  shortLabel: string;
  path: string;
  /** Who does the work, in one line — keep this honest on every surface that renders it. */
  hint: string;
  description: string;
  /** Free guide for this track. Mirrors `ROLE_GUIDE_CTAS` in `rolePartnerPrograms.ts` — update both. */
  guidePath?: string;
  guideLabel?: string;
};

export const PUBLIC_CAREER_TRACKS: PublicCareerTrack[] = [
  {
    id: 'credit_specialists',
    label: 'Credit specialists',
    shortLabel: 'Specialists',
    path: '/credit-specialist',
    hint: 'You run partner files · Finely supplies the method',
    description:
      'Solo operators and certified partners who run dispute files end to end — Finely supplies the method, the OS, and the back office.',
    guidePath: '/credit-specialist-guide',
    guideLabel: 'Open Specialist Guide',
  },
  {
    id: 'agency_partners',
    label: 'Agency partners',
    shortLabel: 'Agencies',
    path: '/agency-partners',
    hint: 'Your brand and team · Finely runs the platform',
    description:
      'Company owners building a branded credit services agency on Finely OS — tenant, seats, white-label depth, buy-in, and capacity payout tiers.',
    guidePath: '/free-agency-guide',
    guideLabel: 'Open Agency Guide',
  },
  {
    id: 'affiliates',
    label: 'Affiliates',
    shortLabel: 'Affiliates',
    path: '/affiliate',
    hint: 'You refer · Finely delivers · payouts on engagement',
    description: 'Promote guides and packages — earn referral payouts without running partner files.',
    guidePath: '/affiliate-toolkit',
    guideLabel: 'Open Affiliate Toolkit',
  },
  {
    id: 'au_sellers',
    label: 'AU sellers',
    shortLabel: 'AU sellers',
    path: '/au-sellers',
    hint: 'You supply cards · Finely brings the buyers',
    description:
      'List authorized-user tradeline inventory and fulfill placements — Finely runs buyer marketing, intake, and order routing.',
    guidePath: '/free-tradeline-guide',
    guideLabel: 'Open AU Seller Guide',
  },
  {
    id: 'case_help',
    label: 'Paralegal · Attorney · Consultant',
    shortLabel: 'Case help',
    path: '/careers/case-help',
    hint: 'You work assigned matters · scoped, audited access',
    description:
      'Paralegals, attorneys/counsel, and consultants who work assigned partner debt and litigation matters (packets, dockets, sessions) with scoped access.',
    guidePath: '/case-desk-guide',
    guideLabel: 'Open Case Desk Guide',
  },
  {
    id: 'real_estate',
    label: 'Real estate partners',
    shortLabel: 'Real estate',
    path: '/careers/real-estate',
    hint: 'You refer · Finely runs the credit work',
    description:
      'Agents and brokers who refer buyers and sellers into Finely-run restore, dispute, and AU prep work — you never process disputes yourself, and no approval is guaranteed.',
    guidePath: '/real-estate-guide',
    guideLabel: 'Open Real Estate Operator Guide',
  },
];

export function getCareerTrack(id: PublicCareerTrackId): PublicCareerTrack {
  return PUBLIC_CAREER_TRACKS.find((t) => t.id === id) ?? PUBLIC_CAREER_TRACKS[0]!;
}

export function matchCareersPath(p: string): boolean {
  if (PUBLIC_CAREER_TRACKS.some((t) => p === t.path || p.startsWith(`${t.path}/`))) return true;
  if (p === '/credit-specialists' || p.startsWith('/credit-specialists/')) return true;
  if (p.startsWith('/agency/signup')) return true;
  if (p === '/agents' || p.startsWith('/agents/')) return true;
  if (p.startsWith('/careers/')) return true;
  if (
    p.startsWith('/onboarding') &&
    (p.includes('lane=au_seller') || p.includes('lane=au_tradelines') || p.includes('lane=au'))
  ) {
    return true;
  }
  return false;
}

/** Legacy shape for header dropdown */
export const PUBLIC_CAREER_PATHS = PUBLIC_CAREER_TRACKS.map((t) => ({
  id: t.id,
  label: t.label,
  path: t.path,
  hint: t.hint,
}));
