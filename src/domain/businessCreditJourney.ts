/** Public 6-step business credit journey (aligned with portal roadmap — honest, no score guarantees). */

export type BusinessJourneyStepId =
  | 'foundation'
  | 'profile'
  | 'bureau_file'
  | 'tradelines_vendors'
  | 'personal_link'
  | 'monitoring';

export type BusinessJourneyStep = {
  id: BusinessJourneyStepId;
  step: number;
  title: string;
  subtitle: string;
  why: string;
  checklist: string[];
  primaryCta: { label: string; path: string };
  secondaryCta?: { label: string; path: string };
};

export const BUSINESS_CREDIT_JOURNEY_STEPS: BusinessJourneyStep[] = [
  {
    id: 'foundation',
    step: 1,
    title: 'Foundation',
    subtitle: 'Entity, EIN, and address discipline',
    why:
      'Lenders and vendors verify that your business exists as one consistent identity. Mismatched addresses or entity names are the silent #1 rejection trigger.',
    checklist: [
      'Legal name + suffix match on SOS filing and bank docs',
      'One standardized business address (format suite/unit the same everywhere)',
      'EIN confirmation letter (CP 575) saved in your vault',
      'Dedicated business phone listed consistently',
    ],
    primaryCta: { label: 'Open business profile (portal)', path: '/business/profile' },
    secondaryCta: { label: 'Save & continue to step 2', path: '?step=2' },
  },
  {
    id: 'profile',
    step: 2,
    title: 'Business profile & industry',
    subtitle: 'NAICS, structure, and operating story',
    why:
      'Industry codes and entity type shape which vendors report and which underwriting paths are realistic. Honest classification beats hype.',
    checklist: [
      'NAICS / industry code documented',
      'Ownership structure recorded (single-member LLC, corp, etc.)',
      'Website or domain email matches public listings',
      'Business description ready for vendor applications',
    ],
    primaryCta: { label: 'Business dashboard', path: '/business/dashboard' },
    secondaryCta: { label: 'Save & continue to step 3', path: '?step=3' },
  },
  {
    id: 'bureau_file',
    step: 3,
    title: 'Business credit file setup',
    subtitle: 'D&B, Experian Business, Equifax Business — education only',
    why:
      'Commercial bureaus are not consumer FICO. PAYDEX, Intelliscore, and SBSS serve different purposes — we teach what each measures without promising scores.',
    checklist: [
      'Understand DUNS / D&B registration basics',
      'Know difference between consumer vs business pulls',
      'List which bureaus your target vendors report to',
      'No fake “instant 80 PAYDEX” claims — document real steps',
    ],
    primaryCta: { label: 'Business bureaus desk', path: '/business/bureaus' },
    secondaryCta: { label: 'Save & continue to step 4', path: '?step=4' },
  },
  {
    id: 'tradelines_vendors',
    step: 4,
    title: 'Tradelines & net-30 vendors',
    subtitle: 'Sequenced vendor path — not random accounts',
    why:
      'Fundability grows from reporting tradelines and disciplined net-30/vendor relationships. Sequence matters more than volume.',
    checklist: [
      'Tier-1 starter vendors identified (reporting, realistic for your file)',
      'Payment cadence calendar (pay before due, keep utilization sane)',
      'Separate business accounts from personal mixing',
      'Authorized user / personal tradelines only when strategy allows',
    ],
    primaryCta: { label: 'Vendor workspace', path: '/business/vendors' },
    secondaryCta: { label: 'View AU tradelines (education)', path: '/tradelines' },
  },
  {
    id: 'personal_link',
    step: 5,
    title: 'Personal guarantee & personal file',
    subtitle: 'Link to Finely personal restore when PG risk is high',
    why:
      'Many business products still touch personal credit. Stabilize personal reports before aggressive business applications when PG is likely.',
    checklist: [
      'Know which apps require personal guarantee',
      'Personal utilization and collections triaged first if risky',
      'Start Restore $147 roadmap if personal file blocks business path',
      'Document consent and expectations — no approval guarantees',
    ],
    primaryCta: { label: 'Start Restore — $147', path: '/start' },
    secondaryCta: { label: 'Personal credit services', path: '/services/personal-credit-restore' },
  },
  {
    id: 'monitoring',
    step: 6,
    title: 'Monitoring & next actions',
    subtitle: 'Funding readiness without hype',
    why:
      'Underwriters review trends, banking behavior, and file consistency over time. Monitoring keeps you ready — it does not guarantee capital.',
    checklist: [
      'Quarterly bureau/vendor review scheduled',
      'Banking behavior narrative documented',
      'Funding readiness checklist (wealth builder path) reviewed',
      'Specialist huddle if file is complex',
    ],
    primaryCta: { label: 'Funding readiness path', path: '/funding-readiness' },
    secondaryCta: { label: 'Book enlightenment session', path: '/enlightenment-session' },
  },
];

export const JOURNEY_STEP_COUNT = BUSINESS_CREDIT_JOURNEY_STEPS.length;

export function journeyStepFromParam(raw: string | null | undefined): BusinessJourneyStepId {
  const n = Number(raw);
  if (n >= 1 && n <= JOURNEY_STEP_COUNT) {
    return BUSINESS_CREDIT_JOURNEY_STEPS[n - 1].id;
  }
  const byId = BUSINESS_CREDIT_JOURNEY_STEPS.find((s) => s.id === raw);
  return byId?.id ?? 'foundation';
}
