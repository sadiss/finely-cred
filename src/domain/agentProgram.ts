/**
 * Agent program — revenue-share model based on training phase, specialty,
 * and which platform capabilities Finely performs vs the agent.
 */

export type AgentSpecialtyId =
  | 'personal_restore'
  | 'personal_build'
  | 'business_credit'
  | 'debt_legal'
  | 'tradelines'
  | 'funding_wealth';

export type AgentTrainingPhaseId = 'apprenticeship' | 'guided' | 'independent' | 'partner';

export type PlatformLeverId =
  | 'software_platform'
  | 'lead_magnets'
  | 'marketing_assets'
  | 'ebooks_free'
  | 'ebooks_paid'
  | 'comms_studio'
  | 'dispute_fulfillment'
  | 'client_onboarding'
  | 'mentoring_calls'
  | 'white_label'
  | 'lead_intelligence'
  | 'media_studio'
  | 'courses_training';

export type LeverPerformer = 'platform' | 'agent' | 'shared';

export type AgentOperatingModel = {
  specialties: AgentSpecialtyId[];
  trainingPhase: AgentTrainingPhaseId;
  /** Capacity tier from pricingCatalog (client/seat limits). */
  capacityTierId: string;
  /** Who performs each value lever — drives the revenue split. */
  levers: Partial<Record<PlatformLeverId, LeverPerformer>>;
  /** Optional sample client fee for calculator preview (cents). */
  sampleClientFeeCents?: number;
};

export type AgentSplitLine = {
  id: string;
  label: string;
  performer: LeverPerformer;
  weight: number;
  platformContribution: number;
  agentContribution: number;
};

export type AgentSplitResult = {
  platformSharePct: number;
  agentSharePct: number;
  trainingPhase: AgentTrainingPhaseId;
  phaseLabel: string;
  lines: AgentSplitLine[];
  infrastructureFeePct: number;
  example?: {
    clientFeeCents: number;
    platformCents: number;
    agentCents: number;
  };
  summary: string;
};

export const AGENT_SPECIALTIES: {
  id: AgentSpecialtyId;
  label: string;
  description: string;
  courseTag?: string;
}[] = [
  {
    id: 'personal_restore',
    label: 'Personal credit restore',
    description: 'Disputes, deletions, re-aging, and bureau workflows.',
    courseTag: 'personal_restore',
  },
  {
    id: 'personal_build',
    label: 'Personal credit building',
    description: 'Primary tradelines, thickness, utilization, and funding readiness.',
    courseTag: 'personal_build',
  },
  {
    id: 'business_credit',
    label: 'Business credit',
    description: 'Entity sequencing, fundability, vendor lines, and corporate stacking.',
    courseTag: 'business_credit',
  },
  {
    id: 'debt_legal',
    label: 'Debt & legal',
    description: 'Validation, challenge packets, and debt-kill workflows.',
    courseTag: 'debt_legal',
  },
  {
    id: 'tradelines',
    label: 'Tradelines & AU',
    description: 'AU marketplace ops, tradeline strategy, and compliance-first education.',
    courseTag: 'tradelines',
  },
  {
    id: 'funding_wealth',
    label: 'Funding & wealth paths',
    description: 'Capital stacking, wealth builder lanes, and high-ticket advisory.',
    courseTag: 'funding',
  },
];

export const AGENT_TRAINING_PHASES: {
  id: AgentTrainingPhaseId;
  label: string;
  description: string;
  platformBasePct: number;
}[] = [
  {
    id: 'apprenticeship',
    label: 'Apprenticeship',
    description: 'We co-run customer files while you learn. You keep at least ~28% while training — split improves as you graduate.',
    platformBasePct: 70,
  },
  {
    id: 'guided',
    label: 'Guided operator',
    description: 'You lead day-to-day; we back fulfillment, QA, and mentoring on complex files.',
    platformBasePct: 58,
  },
  {
    id: 'independent',
    label: 'Independent specialist',
    description: 'You run the file. Platform provides software, assets, comms, and optional overflow support.',
    platformBasePct: 48,
  },
  {
    id: 'partner',
    label: 'Certified partner',
    description: 'Proven operator — strong agent keep, with Finely retaining at least 20% for platform, growth, and support.',
    platformBasePct: 38,
  },
];

/** Lane-specific economics — client fees and platform support load differ by specialty. */
export const SPECIALTY_ECONOMICS: Record<
  AgentSpecialtyId,
  { sampleClientFeeCents: number; platformShareAdjustPct: number; feeLabel: string }
> = {
  personal_restore: {
    sampleClientFeeCents: 150000,
    platformShareAdjustPct: 0,
    feeLabel: 'Personal restore client',
  },
  personal_build: {
    sampleClientFeeCents: 185000,
    platformShareAdjustPct: -2,
    feeLabel: 'Personal build client',
  },
  business_credit: {
    sampleClientFeeCents: 280000,
    platformShareAdjustPct: 4,
    feeLabel: 'Business credit client',
  },
  debt_legal: {
    sampleClientFeeCents: 240000,
    platformShareAdjustPct: 3,
    feeLabel: 'Debt & legal client',
  },
  tradelines: {
    sampleClientFeeCents: 125000,
    platformShareAdjustPct: 1,
    feeLabel: 'Tradeline / AU client',
  },
  funding_wealth: {
    sampleClientFeeCents: 450000,
    platformShareAdjustPct: 5,
    feeLabel: 'Funding & wealth client',
  },
};

const PLATFORM_SHARE_FLOOR_PCT = 20;
const PLATFORM_SHARE_CEILING_PCT = 80;
const APPRENTICESHIP_AGENT_FLOOR_PCT = 28;

export const PLATFORM_VALUE_LEVERS: {
  id: PlatformLeverId;
  label: string;
  description: string;
  weight: number;
  category: 'platform' | 'marketing' | 'fulfillment' | 'training';
  defaultByPhase: Record<AgentTrainingPhaseId, LeverPerformer>;
}[] = [
  {
    id: 'software_platform',
    label: 'Finely software stack',
    description: 'CRM, customer portal, disputes, letters, tasks, documents, billing rails.',
    weight: 10,
    category: 'platform',
    defaultByPhase: { apprenticeship: 'platform', guided: 'shared', independent: 'agent', partner: 'agent' },
  },
  {
    id: 'lead_magnets',
    label: 'Lead magnets & funnels',
    description: 'Opt-in pages, quizzes, and capture flows tied to your pipeline.',
    weight: 6,
    category: 'marketing',
    defaultByPhase: { apprenticeship: 'platform', guided: 'shared', independent: 'agent', partner: 'agent' },
  },
  {
    id: 'marketing_assets',
    label: 'Marketing material',
    description: 'Social kits, ad copy, storyboards, and brand-ready creatives.',
    weight: 5,
    category: 'marketing',
    defaultByPhase: { apprenticeship: 'platform', guided: 'shared', independent: 'shared', partner: 'agent' },
  },
  {
    id: 'ebooks_free',
    label: 'Free ebooks & guides',
    description: 'Educational lead magnets and nurture content for your audience.',
    weight: 3,
    category: 'marketing',
    defaultByPhase: { apprenticeship: 'platform', guided: 'platform', independent: 'shared', partner: 'agent' },
  },
  {
    id: 'ebooks_paid',
    label: 'Paid ebooks & products',
    description: 'Monetized digital products, upsells, and bookstore inventory.',
    weight: 4,
    category: 'marketing',
    defaultByPhase: { apprenticeship: 'shared', guided: 'shared', independent: 'agent', partner: 'agent' },
  },
  {
    id: 'comms_studio',
    label: 'Comms Studio',
    description: 'Email, SMS, portal messages, sequences, and deliverability tooling.',
    weight: 7,
    category: 'platform',
    defaultByPhase: { apprenticeship: 'platform', guided: 'shared', independent: 'shared', partner: 'agent' },
  },
  {
    id: 'dispute_fulfillment',
    label: 'Dispute & letter fulfillment',
    description: 'Hands-on dispute drafting, mailing, and bureau follow-up.',
    weight: 9,
    category: 'fulfillment',
    defaultByPhase: { apprenticeship: 'platform', guided: 'shared', independent: 'agent', partner: 'agent' },
  },
  {
    id: 'client_onboarding',
    label: 'Customer /onboarding',
    description: 'Intake, credit pull coordination, welcome sequences, and kickoff calls.',
    weight: 6,
    category: 'fulfillment',
    defaultByPhase: { apprenticeship: 'platform', guided: 'shared', independent: 'agent', partner: 'agent' },
  },
  {
    id: 'mentoring_calls',
    label: 'Training & mentoring',
    description: 'Live coaching, file review, and certification checkpoints.',
    weight: 8,
    category: 'training',
    defaultByPhase: { apprenticeship: 'platform', guided: 'platform', independent: 'shared', partner: 'agent' },
  },
  {
    id: 'white_label',
    label: 'White-label & branding',
    description: 'Custom portal, domain, and client-facing brand experience.',
    weight: 5,
    category: 'platform',
    defaultByPhase: { apprenticeship: 'shared', guided: 'shared', independent: 'agent', partner: 'agent' },
  },
  {
    id: 'lead_intelligence',
    label: 'Lead intelligence',
    description: 'Prospect discovery, enrichment, and pipeline routing automation.',
    weight: 6,
    category: 'marketing',
    defaultByPhase: { apprenticeship: 'platform', guided: 'platform', independent: 'shared', partner: 'agent' },
  },
  {
    id: 'media_studio',
    label: 'AI Media Studio',
    description: 'Image/video storyboards, campaign exports, and creative generation.',
    weight: 4,
    category: 'marketing',
    defaultByPhase: { apprenticeship: 'platform', guided: 'shared', independent: 'agent', partner: 'agent' },
  },
  {
    id: 'courses_training',
    label: 'Academy & certifications',
    description: 'Structured courses, quizzes, and specialty certification tracks.',
    weight: 5,
    category: 'training',
    defaultByPhase: { apprenticeship: 'platform', guided: 'shared', independent: 'agent', partner: 'agent' },
  },
];

/** Split-only model — no separate platform access charge. */
export const AGENT_INFRASTRUCTURE_FEE_PCT = 0;

const PERFORMER_PLATFORM_POINTS: Record<LeverPerformer, { platform: number; agent: number }> = {
  platform: { platform: 2, agent: 0 },
  shared: { platform: 1, agent: 1 },
  agent: { platform: 0, agent: 2 },
};

export function resolvePrimarySpecialty(specialties: AgentSpecialtyId[]): AgentSpecialtyId {
  return specialties[0] ?? 'personal_restore';
}

export function resolveSampleClientFeeCents(model: Pick<AgentOperatingModel, 'specialties' | 'sampleClientFeeCents'>): number {
  if (model.sampleClientFeeCents != null && model.sampleClientFeeCents > 0) {
    return model.sampleClientFeeCents;
  }
  const primary = resolvePrimarySpecialty(model.specialties);
  return SPECIALTY_ECONOMICS[primary].sampleClientFeeCents;
}

export function resolveSpecialtyPlatformAdjustPct(specialties: AgentSpecialtyId[]): number {
  if (!specialties.length) return 0;
  const total = specialties.reduce((sum, id) => sum + SPECIALTY_ECONOMICS[id].platformShareAdjustPct, 0);
  return Math.round(total / specialties.length);
}

export function defaultAgentOperatingModel(partial?: Partial<AgentOperatingModel>): AgentOperatingModel {
  const phase = partial?.trainingPhase ?? 'apprenticeship';
  const specialties: AgentSpecialtyId[] = partial?.specialties?.length
    ? partial.specialties
    : ['personal_restore'];
  const levers: Partial<Record<PlatformLeverId, LeverPerformer>> = {};
  for (const lever of PLATFORM_VALUE_LEVERS) {
    levers[lever.id] = partial?.levers?.[lever.id] ?? lever.defaultByPhase[phase];
  }
  const primary = resolvePrimarySpecialty(specialties);
  return {
    specialties,
    trainingPhase: phase,
    capacityTierId: partial?.capacityTierId ?? 'agency_solo',
    levers,
    sampleClientFeeCents: partial?.sampleClientFeeCents ?? SPECIALTY_ECONOMICS[primary].sampleClientFeeCents,
  };
}

export function resolveLeverPerformer(
  model: AgentOperatingModel,
  leverId: PlatformLeverId,
): LeverPerformer {
  const lever = PLATFORM_VALUE_LEVERS.find((l) => l.id === leverId);
  if (!lever) return 'shared';
  return model.levers[leverId] ?? lever.defaultByPhase[model.trainingPhase];
}

export function computeAgentRevenueSplit(model: AgentOperatingModel): AgentSplitResult {
  const phase = AGENT_TRAINING_PHASES.find((p) => p.id === model.trainingPhase) ?? AGENT_TRAINING_PHASES[0];
  let platformPoints = phase.platformBasePct;
  let agentPoints = 100 - phase.platformBasePct;
  const lines: AgentSplitLine[] = [];

  for (const lever of PLATFORM_VALUE_LEVERS) {
    const performer = resolveLeverPerformer(model, lever.id);
    const mult = PERFORMER_PLATFORM_POINTS[performer];
    const pAdd = lever.weight * mult.platform;
    const aAdd = lever.weight * mult.agent;
    platformPoints += pAdd;
    agentPoints += aAdd;
    lines.push({
      id: lever.id,
      label: lever.label,
      performer,
      weight: lever.weight,
      platformContribution: pAdd,
      agentContribution: aAdd,
    });
  }

  const total = Math.max(1, platformPoints + agentPoints);
  let platformSharePct = Math.round((platformPoints / total) * 100);
  platformSharePct += resolveSpecialtyPlatformAdjustPct(model.specialties);
  platformSharePct = Math.max(PLATFORM_SHARE_FLOOR_PCT, Math.min(PLATFORM_SHARE_CEILING_PCT, platformSharePct));
  let agentSharePct = 100 - platformSharePct;

  if (model.trainingPhase === 'apprenticeship') {
    agentSharePct = Math.max(APPRENTICESHIP_AGENT_FLOOR_PCT, agentSharePct);
    agentSharePct = Math.min(PLATFORM_SHARE_CEILING_PCT, agentSharePct);
    platformSharePct = 100 - agentSharePct;
  }

  const clientFeeCents = Math.max(0, Math.round(resolveSampleClientFeeCents(model)));
  const platformCents = Math.round((clientFeeCents * platformSharePct) / 100);
  const agentCents = clientFeeCents - platformCents;

  const platformLevers = lines.filter((l) => l.performer === 'platform').length;
  const agentLevers = lines.filter((l) => l.performer === 'agent').length;

  const primary = resolvePrimarySpecialty(model.specialties);
  const laneLabel = SPECIALTY_ECONOMICS[primary].feeLabel;

  return {
    platformSharePct,
    agentSharePct,
    trainingPhase: model.trainingPhase,
    phaseLabel: phase.label,
    lines,
    infrastructureFeePct: AGENT_INFRASTRUCTURE_FEE_PCT,
    example: clientFeeCents
      ? { clientFeeCents, platformCents, agentCents }
      : undefined,
    summary: `${phase.label} · ${laneLabel}: Finely ${platformSharePct}% / You ${agentSharePct}% on client revenue. ${platformLevers} levers we run, ${agentLevers} you run — splits differ by lane and training phase.`,
  };
}

export function formatAgentPct(n: number): string {
  return `${Math.round(n)}%`;
}

export function formatAgentMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

export type AgentTrainingModule = {
  id: string;
  specialtyId: AgentSpecialtyId;
  title: string;
  description: string;
  estimatedHours: number;
  checklist: string[];
  hubPath?: string;
};

export const AGENT_TRAINING_MODULES: AgentTrainingModule[] = [
  {
    id: 'restore_foundation',
    specialtyId: 'personal_restore',
    title: 'Restore foundations',
    description: 'Credit report anatomy, dispute categories, evidence discipline, and client intake.',
    estimatedHours: 6,
    checklist: ['Complete restore intake SOP', 'Parse a sample tri-merge', 'Draft first bureau letter set'],
    hubPath: '/portal/letters',
  },
  {
    id: 'build_foundation',
    specialtyId: 'personal_build',
    title: 'Build & thicken',
    description: 'Utilization strategy, primary tradeline education, and funding readiness sequencing.',
    estimatedHours: 5,
    checklist: ['Build lane checklist', 'Primary tradeline education call script', 'Funding readiness scorecard'],
    hubPath: '/portal/build',
  },
  {
    id: 'business_foundation',
    specialtyId: 'business_credit',
    title: 'Business credit operator',
    description: 'Entity setup, vendor sequencing, D&B fundamentals, and corporate stacking ethics.',
    estimatedHours: 8,
    checklist: ['Entity intake template', 'Vendor tier map', 'Fundability audit workflow'],
    hubPath: '/portal/projects',
  },
  {
    id: 'debt_foundation',
    specialtyId: 'debt_legal',
    title: 'Debt kill workflows',
    description: 'Validation requests, timeline tracking, and jurisdiction-aware challenge packets.',
    estimatedHours: 7,
    checklist: ['Debt intake packet', 'Validation letter templates', 'Escalation triggers'],
    hubPath: '/portal/debt',
  },
  {
    id: 'marketing_ops',
    specialtyId: 'personal_restore',
    title: 'Marketing & lead ops',
    description: 'Lead magnets, Comms sequences, Media Studio assets, and pipeline hygiene.',
    estimatedHours: 4,
    checklist: ['Publish a lead magnet', 'Launch welcome sequence', 'Export 3 social creatives'],
    hubPath: '/credit-specialist/hub',
  },
  {
    id: 'platform_mastery',
    specialtyId: 'personal_build',
    title: 'Platform mastery',
    description: 'CRM, tasks, messages, calendar, documents, and customer portal best practices.',
    estimatedHours: 3,
    checklist: ['Run a file end-to-end in sandbox', 'Set notification preferences', 'Book mentor checkpoint'],
    hubPath: '/portal/dashboard',
  },
];

export function getTrainingModulesForSpecialties(specialties: AgentSpecialtyId[]): AgentTrainingModule[] {
  const set = new Set(specialties);
  const core = AGENT_TRAINING_MODULES.filter((m) => set.has(m.specialtyId));
  const shared = AGENT_TRAINING_MODULES.filter((m) => m.id === 'marketing_ops' || m.id === 'platform_mastery');
  const ids = new Set<string>();
  return [...core, ...shared].filter((m) => {
    if (ids.has(m.id)) return false;
    ids.add(m.id);
    return true;
  });
}
