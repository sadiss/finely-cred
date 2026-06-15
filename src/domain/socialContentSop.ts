/** Social content SOP templates — pillars, cadence, compliance guardrails. */

export type SocialPlatform = 'facebook' | 'instagram' | 'threads' | 'linkedin';

export type SocialSopTemplate = {
  id: string;
  title: string;
  pillar: 'education' | 'proof' | 'offer' | 'community' | 'compliance';
  platforms: SocialPlatform[];
  cadence: 'daily' | '3x_week' | 'weekly' | 'biweekly';
  assignedRoleId: 'social_creator' | 'affiliate_specialist' | 'nurture_concierge';
  hookFormula: string;
  bodyOutline: string[];
  requiredHashtags: string[];
  forbiddenPhrases: string[];
  cta: string;
  approvalRequired: boolean;
};

export const SOCIAL_SOP_LIBRARY: SocialSopTemplate[] = [
  {
    id: 'sop-edu-score-roadmap',
    title: 'Score roadmap tip (Mon/Wed/Fri)',
    pillar: 'education',
    platforms: ['instagram', 'facebook'],
    cadence: '3x_week',
    assignedRoleId: 'social_creator',
    hookFormula: 'Most people skip this step before disputing…',
    bodyOutline: [
      'One actionable credit hygiene tip (utilization, inquiries, or report pull cadence).',
      'Tie to Finely workflow: upload → analyze → evidence → mail.',
      'Disclaimer: results vary · educational only.',
    ],
    requiredHashtags: ['#CreditEducation', '#FinelyCred'],
    forbiddenPhrases: ['delete everything', 'guaranteed 800', 'illegal to report'],
    cta: 'Free score roadmap → finelycred.com/free-score-roadmap',
    approvalRequired: false,
  },
  {
    id: 'sop-proof-workflow',
    title: 'Illustrative workflow win (Tue)',
    pillar: 'proof',
    platforms: ['facebook', 'instagram'],
    cadence: 'weekly',
    assignedRoleId: 'social_creator',
    hookFormula: 'What a structured dispute workflow looks like (illustrative):',
    bodyOutline: [
      'Screenshot-safe description — no client PII.',
      'Label as illustrative workflow, not live enforcement.',
      'Highlight evidence + factual findings discipline.',
    ],
    requiredHashtags: ['#DisputeWorkflow', '#CreditRestore'],
    forbiddenPhrases: ['we sued', 'guaranteed deletion', 'CRO'],
    cta: 'See partner portal preview → finelycred.com/personal-credit',
    approvalRequired: true,
  },
  {
    id: 'sop-offer-diy-dfy',
    title: 'DIY vs DFY clarity (Thu)',
    pillar: 'offer',
    platforms: ['facebook', 'instagram', 'threads'],
    cadence: 'weekly',
    assignedRoleId: 'social_creator',
    hookFormula: 'DIY or done-for-you — how to choose without hype:',
    bodyOutline: [
      'Match lane to partner goal (restore, build, business, debt).',
      'No pressure — book a strategy call if you want live help.',
      'Link pricing tab anchor.',
    ],
    requiredHashtags: ['#FinelyCred', '#CreditSpecialist'],
    forbiddenPhrases: ['get rich', 'overnight', 'hack the bureaus'],
    cta: 'Compare paths → finelycred.com/pricing',
    approvalRequired: false,
  },
  {
    id: 'sop-affiliate-kit',
    title: 'Affiliate promo kit (Sat)',
    pillar: 'community',
    platforms: ['instagram', 'facebook'],
    cadence: 'weekly',
    assignedRoleId: 'affiliate_specialist',
    hookFormula: 'Affiliate partners: compliant promo copy refresh',
    bodyOutline: [
      'QR + referral link reminder.',
      'Compliance: no outcome guarantees.',
      'Point to affiliate toolkit funnel.',
    ],
    requiredHashtags: ['#AffiliateMarketing', '#FinelyPartner'],
    forbiddenPhrases: ['passive income guaranteed', 'credit repair scam'],
    cta: 'Affiliate toolkit → finelycred.com/affiliate-toolkit',
    approvalRequired: true,
  },
  {
    id: 'sop-compliance-friday',
    title: 'Compliance Friday reminder',
    pillar: 'compliance',
    platforms: ['facebook', 'linkedin'],
    cadence: 'weekly',
    assignedRoleId: 'social_creator',
    hookFormula: 'Educational dispute workflow only — not legal advice.',
    bodyOutline: [
      'Reinforce Finely positioning: structured evidence system.',
      'Never promise specific score outcomes.',
      'Invite questions via AI guide (not legal advice).',
    ],
    requiredHashtags: ['#Compliance', '#FCRA'],
    forbiddenPhrases: ['law firm', 'attorney on staff', 'delete all negatives'],
    cta: 'Questions? Chat on finelycred.com',
    approvalRequired: false,
  },
  {
    id: 'sop-lead-magnet-sunday',
    title: 'Lead magnet Sunday',
    pillar: 'education',
    platforms: ['instagram', 'facebook'],
    cadence: 'weekly',
    assignedRoleId: 'nurture_concierge',
    hookFormula: 'Free guide stack — pick your lane:',
    bodyOutline: [
      'Personal restore · business credit · tradelines · debt.',
      'One bullet per guide with honest scope.',
      'Session booking soft CTA.',
    ],
    requiredHashtags: ['#FreeGuide', '#CreditTips'],
    forbiddenPhrases: ['secret bureau trick', '100% removal'],
    cta: 'Download → finelycred.com/resources',
    approvalRequired: false,
  },
  {
    id: 'sop-business-vendor-ladder',
    title: 'Business vendor ladder (Tue AM)',
    pillar: 'education',
    platforms: ['linkedin', 'facebook'],
    cadence: 'weekly',
    assignedRoleId: 'social_creator',
    hookFormula: 'Business credit is a sequence — not a single tradeline:',
    bodyOutline: [
      'Net-30 vendor → reporting tier → lender logic readiness.',
      'Link business dashboard workflow (no outcome promises).',
      'Educational only — entity + EIN hygiene reminder.',
    ],
    requiredHashtags: ['#BusinessCredit', '#FinelyCred'],
    forbiddenPhrases: ['instant $100k', 'no ein needed', 'guaranteed funding'],
    cta: 'Business path → finelycred.com/business/dashboard',
    approvalRequired: false,
  },
  {
    id: 'sop-tradeline-au-marketplace',
    title: 'Tradeline education (Wed PM)',
    pillar: 'education',
    platforms: ['instagram', 'facebook'],
    cadence: 'weekly',
    assignedRoleId: 'social_creator',
    hookFormula: 'Authorized user tradelines — what partners should know first:',
    bodyOutline: [
      'Scope: education on reporting mechanics, not shortcuts.',
      'AU marketplace is separate lane — match goal before buying.',
      'Compliance: no score guarantee language.',
    ],
    requiredHashtags: ['#Tradelines', '#CreditEducation'],
    forbiddenPhrases: ['boost 100 points', 'guaranteed posting', 'illegal tradeline'],
    cta: 'AU marketplace → finelycred.com/au/marketplace',
    approvalRequired: true,
  },
  {
    id: 'sop-debt-validation',
    title: 'Debt validation awareness (Thu PM)',
    pillar: 'compliance',
    platforms: ['facebook', 'linkedin'],
    cadence: 'weekly',
    assignedRoleId: 'social_creator',
    hookFormula: 'Debt validation vs dispute — know the lane:',
    bodyOutline: [
      'Structured validation requests vs Metro 2 factual disputes.',
      'Partner portal debt workspace — documents + timeline.',
      'Not legal advice — consult counsel for litigation.',
    ],
    requiredHashtags: ['#DebtValidation', '#FCRA'],
    forbiddenPhrases: ['sue collectors for you', 'delete all debt', 'ignore court dates'],
    cta: 'Debt workspace → finelycred.com/portal/debt',
    approvalRequired: true,
  },
  {
    id: 'sop-enlightenment-session',
    title: 'Strategy call invite (Fri AM)',
    pillar: 'offer',
    platforms: ['instagram', 'facebook', 'threads'],
    cadence: 'weekly',
    assignedRoleId: 'nurture_concierge',
    hookFormula: '15-minute clarity session — pick your lane with a coordinator:',
    bodyOutline: [
      'Restore · build · business · debt — honest scope conversation.',
      'Session coordinator assigns next workflow steps.',
      'Optional — no pressure checkout.',
    ],
    requiredHashtags: ['#CreditClarity', '#FinelyCred'],
    forbiddenPhrases: ['free money', 'guaranteed approval', 'secret bureau trick'],
    cta: 'Book a call → finelycred.com/enlightenment-session',
    approvalRequired: false,
  },
  {
    id: 'sop-partner-work-os',
    title: 'Partner Work OS snapshot (Mon PM)',
    pillar: 'proof',
    platforms: ['linkedin', 'facebook'],
    cadence: 'weekly',
    assignedRoleId: 'social_creator',
    hookFormula: 'How partners track disputes + tasks in one OS:',
    bodyOutline: [
      'Illustrative: My Tasks · Letter Studio · dispute rounds.',
      'No client PII — generic workflow screenshot description.',
      'Paginated queues — no infinite scroll traps.',
    ],
    requiredHashtags: ['#WorkOS', '#CreditRestore'],
    forbiddenPhrases: ['we do everything for you illegally', 'delete overnight'],
    cta: 'Partner portal → finelycred.com/onboarding',
    approvalRequired: false,
  },
  {
    id: 'sop-crm-nurture-pulse',
    title: 'CRM nurture pulse (Sat AM)',
    pillar: 'community',
    platforms: ['facebook', 'instagram'],
    cadence: 'weekly',
    assignedRoleId: 'nurture_concierge',
    hookFormula: 'Staying in touch without spam — nurture that respects consent:',
    bodyOutline: [
      'Guide downloads → optional sequences → human handoff.',
      'Unsubscribe honored on every touch.',
      'Affiliate + partner lanes stay separate.',
    ],
    requiredHashtags: ['#EmailConsent', '#FinelyPartner'],
    forbiddenPhrases: ['unlimited blasts', 'cannot unsubscribe', 'guaranteed close'],
    cta: 'Resources hub → finelycred.com/resources',
    approvalRequired: false,
  },
];

export const SOCIAL_WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function listSocialWeeklyWorkflow(): { dayIndex: number; label: string; sops: SocialSopTemplate[] }[] {
  return SOCIAL_WEEKDAY_LABELS.map((label, dayIndex) => ({
    dayIndex,
    label,
    sops: listSocialSopsForDay(dayIndex),
  }));
}

export function getSocialSopById(id: string): SocialSopTemplate | null {
  return SOCIAL_SOP_LIBRARY.find((s) => s.id === id) ?? null;
}

export function listSocialSopsForDay(dayOfWeek: number): SocialSopTemplate[] {
  const map: Record<number, string[]> = {
    0: ['sop-lead-magnet-sunday'],
    1: ['sop-edu-score-roadmap', 'sop-partner-work-os'],
    2: ['sop-proof-workflow', 'sop-business-vendor-ladder'],
    3: ['sop-edu-score-roadmap', 'sop-tradeline-au-marketplace'],
    4: ['sop-offer-diy-dfy', 'sop-debt-validation'],
    5: ['sop-edu-score-roadmap', 'sop-affiliate-kit', 'sop-enlightenment-session'],
    6: ['sop-compliance-friday', 'sop-crm-nurture-pulse'],
  };
  const ids = map[dayOfWeek] ?? [];
  return ids.map((id) => getSocialSopById(id)).filter(Boolean) as SocialSopTemplate[];
}
