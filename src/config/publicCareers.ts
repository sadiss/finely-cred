/** Public careers navigation — each track has its own page. */
export type PublicCareerTrackId = 'credit_specialists' | 'agency_partners' | 'affiliates' | 'au_sellers';

export type PublicCareerTrack = {
  id: PublicCareerTrackId;
  label: string;
  shortLabel: string;
  path: string;
  hint: string;
  description: string;
};

export const PUBLIC_CAREER_TRACKS: PublicCareerTrack[] = [
  {
    id: 'credit_specialists',
    label: 'Credit specialists',
    shortLabel: 'Specialists',
    path: '/credit-specialists',
    hint: 'Run client files · per-file revenue share',
    description: 'Solo operators and certified partners who run dispute files — apprenticeship through certified partner.',
  },
  {
    id: 'agency_partners',
    label: 'Agency partners',
    shortLabel: 'Agencies',
    path: '/agency-partners',
    hint: 'Own a branded company · team & white-label',
    description: 'Company owners building a credit services agency on Finely OS — tenants, seats, branding, and scale tiers.',
  },
  {
    id: 'affiliates',
    label: 'Affiliates',
    shortLabel: 'Affiliates',
    path: '/affiliate',
    hint: 'Refer customers · commissions',
    description: 'Promote guides and packages — earn referral commissions without running client files.',
  },
  {
    id: 'au_sellers',
    label: 'AU sellers',
    shortLabel: 'AU sellers',
    path: '/au-sellers',
    hint: 'Supply tradelines',
    description: 'List AU tradeline inventory — Finely markets to buyers.',
  },
];

export function getCareerTrack(id: PublicCareerTrackId): PublicCareerTrack {
  return PUBLIC_CAREER_TRACKS.find((t) => t.id === id) ?? PUBLIC_CAREER_TRACKS[0]!;
}

export function matchCareersPath(p: string): boolean {
  if (PUBLIC_CAREER_TRACKS.some((t) => p === t.path || p.startsWith(`${t.path}/`))) return true;
  if (p.startsWith('/agency/signup')) return true;
  if (p === '/agents' || p.startsWith('/agents/')) return true;
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
