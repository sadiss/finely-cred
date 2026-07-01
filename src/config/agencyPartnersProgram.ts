import type { AgencyTier } from './pricingCatalog';
import { agencyTiers } from './pricingCatalog';

export function getPublicAgencyTiers(): AgencyTier[] {
  return agencyTiers.filter((t) => t.isPublic !== false).sort((a, b) => a.sortOrder - b.sortOrder);
}

export const AGENCY = {
  programName: 'Agency Partner Program',
  signupPath: '/agency/signup',
  publicPath: '/agency-partners',
} as const;

/** Agency track only — not shown on credit specialist pages. */
export const AGENCY_ROLE_MODEL = {
  headline: 'Agency owners vs credit specialists',
  rows: [
    {
      term: 'Agency partner (you)',
      meaning:
        'You own a branded credit services company on Finely OS — tenant, team seats, client routing, and white-label portal. You may earn on company volume and team production, not just one file at a time.',
    },
    {
      term: 'Credit specialist',
      meaning:
        'An individual (or seat on your team) who runs client files and earns a % of each service sale. Many agency owners also operate as certified specialists — but the career pages are separate.',
    },
    {
      term: 'White-label tier',
      meaning:
        'How much of the customer experience is your brand vs Finely — from co-branded portal to full custom domain and enterprise API.',
    },
    {
      term: 'Finely platform',
      meaning:
        'The software engine both tracks use: CRM, disputes, letters, vault, comms. Specialists get access through the program; agencies get tenant-level branding and seat controls.',
    },
  ],
  percentOf:
    'Agency tiers show revenue share while training vs when certified on your tenant’s client volume. Per-file splits for individual specialists are on the Credit specialists page.',
} as const;

export const AGENCY_OFFERINGS = [
  {
    title: 'White-label tenant',
    description: 'Your agency name, logo, and client-facing portal — not Finely-branded at higher tiers.',
    included: ['Custom brand + support email', 'Team seat management', 'Client routing rules'],
  },
  {
    title: 'Compliance & workflows',
    description: 'Operator-grade dispute OS with audit trails built for agencies, not hobbyists.',
    included: ['Multi-client CRM', 'Letter studio + evidence vault', 'Admin oversight tools'],
  },
  {
    title: 'Scale tiers',
    description: 'Grow from solo operator capacity to enterprise white-label with more files and seats.',
    included: ['Defined client file limits', 'Seat limits per tier', 'Revenue share while training → certified'],
  },
  {
    title: 'Dedicated agency support',
    description: 'Onboarding for tenant setup, branding, and team provisioning.',
    included: ['Agency signup workspace', 'Admin console access', 'Pricing & tier upgrades'],
  },
] as const;
