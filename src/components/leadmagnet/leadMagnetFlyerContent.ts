import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';

export type FlyerProcessStep = { label: string; title: string };
export type FlyerMetric = { value: string; label: string };
export type FlyerAccessItem = { title: string; desc: string };
export type FlyerFoundation = { title: string; desc: string };

export type LeadMagnetFlyerContent = {
  powerLine: string;
  categoryLabel: string;
  benefitsTitle: string;
  processTitle: string;
  resultsTitle: string;
  accessTitle: string;
  foundationTitle: string;
  ctaBannerLine: string;
  ctaBannerSub: string;
  process: FlyerProcessStep[];
  metrics: FlyerMetric[];
  access: FlyerAccessItem[];
  foundation: FlyerFoundation[];
};

const FLYER: Record<string, LeadMagnetFlyerContent> = {
  debt: {
    powerLine: 'VALIDATE. DOCUMENT. TAKE CONTROL.',
    categoryLabel: 'DEBT VALIDATION KIT',
    benefitsTitle: 'With this kit you can:',
    processTitle: 'Our proven validation process',
    resultsTitle: 'Powerful results',
    accessTitle: 'What you unlock',
    foundationTitle: 'The foundation',
    ctaBannerLine: 'YOUR FILE. YOUR TIMELINE. YOUR POWER.',
    ctaBannerSub: 'Get the playbook collectors do not want you to have.',
    process: [
      { label: '01', title: 'Download kit' },
      { label: '02', title: 'Send validation' },
      { label: '03', title: 'Log responses' },
      { label: '04', title: 'Escalate facts' },
      { label: '05', title: 'Stabilize file' },
    ],
    metrics: [
      { value: '72hr', label: 'Summons checklist' },
      { value: 'FDCPA', label: 'Workflow guardrails' },
      { value: '$0', label: 'No card required' },
    ],
    access: [
      { title: 'Validation letters', desc: 'Written workflows that force proof.' },
      { title: 'Call scripts', desc: 'Stay in control on live collector calls.' },
      { title: 'Portal preview', desc: 'Track debt tasks like a pro file.' },
      { title: 'Strategist lane', desc: 'Specialist follow-up when you need it.' },
    ],
    foundation: [
      { title: 'Paper trail discipline', desc: 'Every contact logged and dated.' },
      { title: 'Educational only', desc: 'Compliance-aware — not legal advice.' },
      { title: 'Instant PDF', desc: 'Download in seconds after unlock.' },
    ],
  },
  business: {
    powerLine: 'BUILD. STACK. FUND. SCALE.',
    categoryLabel: 'BUSINESS CREDIT JUMPSTART',
    benefitsTitle: 'With strong business credit you can:',
    processTitle: 'Our proven business credit process',
    resultsTitle: 'Powerful results',
    accessTitle: 'What you can access',
    foundationTitle: 'The installment advantage',
    ctaBannerLine: 'YOUR ENTITY. YOUR LIMITS. YOUR FUNDING.',
    ctaBannerSub: 'Start building the credibility funders actually respect.',
    process: [
      { label: '01', title: 'Entity hygiene' },
      { label: '02', title: 'Bureau setup' },
      { label: '03', title: 'Vendor ladder' },
      { label: '04', title: 'Depth + limits' },
      { label: '05', title: 'Funding ready' },
    ],
    metrics: [
      { value: '45 days', label: 'Vendor sequence' },
      { value: 'Net-30', label: 'Reporting path' },
      { value: 'Advisor', label: 'Session included' },
    ],
    access: [
      { title: 'Vendor accounts', desc: 'Net-30 sequence that reports.' },
      { title: 'LOC readiness', desc: 'File optics funders scrutinize.' },
      { title: 'Entity checklist', desc: 'SOS, EIN, address alignment.' },
      { title: 'Portal lane', desc: 'Business credit workspace preview.' },
    ],
    foundation: [
      { title: 'Predictable sequencing', desc: 'Apply in order — not random spree.' },
      { title: 'Bureau reporting', desc: 'Depth before big-bank apps.' },
      { title: 'Inquiry discipline', desc: 'Protect personal and business files.' },
    ],
  },
  tradeline: {
    powerLine: 'LEARN. TIME. BOOST. WIN.',
    categoryLabel: 'TRADELINE INSIDER KIT',
    benefitsTitle: 'With this education you can:',
    processTitle: 'Smart tradeline process',
    resultsTitle: 'What changes',
    accessTitle: 'Inside the insider kit',
    foundationTitle: 'Before you spend a dollar',
    ctaBannerLine: 'KNOW THE TOOL. OWN THE PLAN.',
    ctaBannerSub: 'Tradelines are leverage — not magic beans.',
    process: [
      { label: '01', title: 'AU vs primary' },
      { label: '02', title: 'Match file gaps' },
      { label: '03', title: 'Time the post' },
      { label: '04', title: 'Control inquiries' },
      { label: '05', title: 'Review results' },
    ],
    metrics: [
      { value: 'Timing', label: 'Statement windows' },
      { value: 'Risk', label: 'Plain-language' },
      { value: 'Advisor', label: 'Fit check call' },
    ],
    access: [
      { title: 'AU education', desc: 'What underwriters actually see.' },
      { title: 'Inquiry budget', desc: 'Stop sabotaging gains with pulls.' },
      { title: 'Fit matrix', desc: 'Match accounts to weaknesses.' },
      { title: 'Portal track', desc: 'Execute in Finely Cred preview.' },
    ],
    foundation: [
      { title: 'No hype', desc: 'Education-first — no outcome guarantees.' },
      { title: 'Compliance copy', desc: 'Safe language for clients.' },
      { title: 'Full restore context', desc: 'Tradelines as one lever only.' },
    ],
  },
  score_roadmap: {
    powerLine: 'SEQUENCE. LIFT. FUND. LIVE FREE.',
    categoryLabel: '700+ SCORE ROADMAP',
    benefitsTitle: 'With a sequenced plan you can:',
    processTitle: 'Our proven score process',
    resultsTitle: 'Powerful results',
    accessTitle: 'What you can access',
    foundationTitle: 'The sequencing advantage',
    ctaBannerLine: 'YOUR SCORE. YOUR SEQUENCE. YOUR FREEDOM.',
    ctaBannerSub: 'Stop random disputing — start intentional lifts.',
    process: [
      { label: '01', title: 'Utilization' },
      { label: '02', title: 'Priority disputes' },
      { label: '03', title: 'Mix + age' },
      { label: '04', title: 'Monthly rhythm' },
      { label: '05', title: 'Funding ready' },
    ],
    metrics: [
      { value: '700+', label: 'Roadmap template' },
      { value: 'AZEO', label: 'Utilization map' },
      { value: '12 wk', label: 'Milestone track' },
    ],
    access: [
      { title: 'Score roadmap PDF', desc: 'Week-by-week sequencing.' },
      { title: 'Dispute priorities', desc: 'Impact vs effort worksheet.' },
      { title: 'Portal preview', desc: 'Track progress in real tools.' },
      { title: 'Specialist review', desc: 'Personalize your lane.' },
    ],
    foundation: [
      { title: 'Utilization first', desc: 'Fastest lever for many profiles.' },
      { title: 'Evidence disputes', desc: 'Hit items that actually move.' },
      { title: 'No card required', desc: 'Free kit + portal preview.' },
    ],
  },
  agency: {
    powerLine: 'SYSTEMIZE. SCALE. COMPLY. WIN.',
    categoryLabel: 'AGENCY GROWTH KIT',
    benefitsTitle: 'With partner-grade OS you can:',
    processTitle: 'Agency scale process',
    resultsTitle: 'Operator results',
    accessTitle: 'What agencies unlock',
    foundationTitle: 'Scale without burnout',
    ctaBannerLine: 'YOUR BRAND. YOUR SYSTEM. YOUR SCALE.',
    ctaBannerSub: 'Stop heroic burnout — install partner-grade ops.',
    process: [
      { label: '01', title: 'Audit journey' },
      { label: '02', title: 'Onboarding SOP' },
      { label: '03', title: 'Compliance copy' },
      { label: '04', title: 'Portal OS' },
      { label: '05', title: 'Capacity tiers' },
    ],
    metrics: [
      { value: '30 day', label: 'Onboarding map' },
      { value: 'WL', label: 'OS overview' },
      { value: '50+', label: 'Client capacity' },
    ],
    access: [
      { title: 'Partner OS', desc: 'Restore + funding in one hub.' },
      { title: 'Promo swipe file', desc: 'Sell aggressively — safely.' },
      { title: 'Client portals', desc: 'White-label preview.' },
      { title: 'Revenue lanes', desc: 'DIY, DFY, referrals.' },
    ],
    foundation: [
      { title: 'Compliance-first', desc: 'No repair-org hype positioning.' },
      { title: 'Handoff discipline', desc: 'Sales → fulfillment SOP.' },
      { title: 'Advisor activation', desc: 'Solutions call included.' },
    ],
  },
  specialist_apply: {
    powerLine: 'TRAIN. ACTIVATE. EXECUTE. EARN.',
    categoryLabel: 'SPECIALIST NETWORK',
    benefitsTitle: 'As a Finely specialist you can:',
    processTitle: 'Activation process',
    resultsTitle: 'What you get',
    accessTitle: 'Toolkit preview',
    foundationTitle: 'Built for operators',
    ctaBannerLine: 'YOUR SKILLS. OUR OS. REAL PARTNERS.',
    ctaBannerSub: 'Apply to the specialist network — tools, training, activation.',
    process: [
      { label: '01', title: 'Apply' },
      { label: '02', title: 'Review' },
      { label: '03', title: 'Train' },
      { label: '04', title: 'Activate' },
      { label: '05', title: 'First partner' },
    ],
    metrics: [
      { value: '14 day', label: 'Training ladder' },
      { value: 'AI', label: 'Workflow primer' },
      { value: 'OS', label: 'Portal preview' },
    ],
    access: [
      { title: 'Letter ops', desc: 'Dispute workflow boards.' },
      { title: 'Evidence vault', desc: 'Client-proof folder system.' },
      { title: 'AI assist', desc: 'Draft review guardrails.' },
      { title: 'Activation call', desc: 'Partner specialist support.' },
    ],
    foundation: [
      { title: 'Not a job offer', desc: 'Independent partner path.' },
      { title: 'Compliance training', desc: 'Educational positioning built-in.' },
      { title: 'Free toolkit', desc: 'Preview before you commit time.' },
    ],
  },
  affiliate: {
    powerLine: 'LINK. SHARE. TRACK. COMPOUND.',
    categoryLabel: 'AFFILIATE TOOLKIT',
    benefitsTitle: 'With clean attribution you can:',
    processTitle: 'Referral growth process',
    resultsTitle: 'Partner metrics',
    accessTitle: 'Toolkit includes',
    foundationTitle: 'Referral infrastructure',
    ctaBannerLine: 'YOUR LINK. YOUR AUDIENCE. YOUR PAYOUTS.',
    ctaBannerSub: 'Compliant copy + QR + dashboard preview.',
    process: [
      { label: '01', title: 'Get link + QR' },
      { label: '02', title: 'Post compliant' },
      { label: '03', title: 'Route funnels' },
      { label: '04', title: 'Track clicks' },
      { label: '05', title: 'Scale winners' },
    ],
    metrics: [
      { value: 'UTM', label: 'Clean attribution' },
      { value: 'QR', label: 'Print-ready kit' },
      { value: 'Dashboard', label: 'Payout preview' },
    ],
    access: [
      { title: 'Referral links', desc: 'Attribution that actually parses.' },
      { title: 'Social swipe file', desc: 'Compliant hooks + disclosures.' },
      { title: 'Funnel picker', desc: 'Debt vs restore vs funding.' },
      { title: 'Geo angles', desc: 'City-specific landing links.' },
    ],
    foundation: [
      { title: 'No income hype', desc: 'Payouts depend on referred activity.' },
      { title: 'Compliant copy', desc: 'Platform-safe language.' },
      { title: 'Success specialist', desc: 'Jamie helps wire campaigns.' },
    ],
  },
};

export function getLeadMagnetFlyerContent(config: LeadMagnetFunnelConfig): LeadMagnetFlyerContent {
  return FLYER[config.id] ?? FLYER.debt!;
}
