import type { LeadEngineLane } from '../leadIntel/leadEngineAutonomy';

export type GrowthAgentAccent = 'emerald' | 'amber' | 'sky' | 'violet' | 'fuchsia' | 'rose';

/** Caleb Brooks pipeline subagents — geo scan → qualify → enrich → handoff. */
export type CalebSubagentId = 'geo_scanner' | 'qualifier' | 'enricher' | 'handoff';

export type CalebSubagentWorker = {
  id: CalebSubagentId;
  label: string;
  role: string;
  mission: string;
  accent: GrowthAgentAccent;
  order: number;
  tier: 'live' | 'preview';
  /**
   * True = a genuine AI-gateway reasoning sub-agent (Qualifier, Handoff Router).
   * False = deterministic/mechanical lookup (Geo Scanner, Enricher) — kept as
   * "agent" flavor text intentionally, per Phase 3 decision not to fake
   * reasoning where there is nothing to reason about.
   */
  isReasoning: boolean;
};

export const CALEB_SUBAGENT_WORKERS: CalebSubagentWorker[] = [
  {
    id: 'geo_scanner',
    label: 'Geo Scanner',
    role: 'Metro shard rotation',
    mission: 'Rotate 60+ US metros daily — city-queue hunts instead of one national string.',
    accent: 'sky',
    order: 1,
    tier: 'live',
    isReasoning: false,
  },
  {
    id: 'qualifier',
    label: 'Qualifier',
    role: 'Smart qualify (AI reasoning)',
    mission: 'Real AI-gateway reasoning on every mid-band hit — not optional — grounded in team context, scores lane fit, routes auto-save vs review vs skip.',
    accent: 'emerald',
    order: 2,
    tier: 'live',
    isReasoning: true,
  },
  {
    id: 'enricher',
    label: 'Enricher',
    role: 'Contact enrich',
    mission: 'Pull emails, phones, and intent signals from live Serper hits.',
    accent: 'violet',
    order: 3,
    tier: 'live',
    isReasoning: false,
  },
  {
    id: 'handoff',
    label: 'Handoff Router',
    role: 'Next-step routing (AI reasoning)',
    mission: 'Reads the shared team-context feed to decide the next real step for a qualified lead — stay in review, auto-save, or hand off to Alex for booking outreach — and writes an explicit handoff record instead of a silent CRM write.',
    accent: 'amber',
    order: 4,
    tier: 'live',
    isReasoning: true,
  },
];

export function listCalebSubagentWorkers(): CalebSubagentWorker[] {
  return [...CALEB_SUBAGENT_WORKERS].sort((a, b) => a.order - b.order);
}

export type GrowthAgentCapability = {
  id: string;
  label: string;
  description: string;
  href?: string;
  /** When true, workspace appends pillar `videoId` to Content Studio promote links. */
  promoteVideoId?: boolean;
  runKey?: string;
  tier: 'live' | 'preview' | 'soon';
};

const CONTENT_STUDIO_PROMOTE_BASE = '/admin/marketing?tab=content&view=advanced&room=video&step=promote';

/** Deep link — Miriam/Jordan promote step; optional Hannah attribution video id. */
export function buildGrowthContentStudioPromoteUrl(videoId?: string): string {
  const id = videoId?.trim();
  if (!id) return CONTENT_STUDIO_PROMOTE_BASE;
  const params = new URLSearchParams({ view: 'advanced', room: 'video', step: 'promote', videoId: id });
  return `/admin/marketing?tab=content&${params.toString()}`;
}

/** Phase 8 — open easy-mode video wizard (Jordan pillar / Miriam reel). */
export function buildGrowthContentStudioWizardUrl(opts?: {
  preset?: 'reel_28' | 'ad_60' | 'guide_promo' | 'city_spotlight';
  videoId?: string;
  fromPillar?: boolean;
}): string {
  const params = new URLSearchParams({ wizard: 'open' });
  if (opts?.preset) params.set('preset', opts.preset);
  if (opts?.videoId) params.set('videoId', opts.videoId);
  if (opts?.fromPillar) params.set('from', 'pillar');
  return `/admin/marketing?tab=content&${params.toString()}`;
}

/**
 * Real org position — not title flavor text. `reportsTo` is another GrowthAgentDef
 * id (or 'agent-architect' / 'ruth' for the top of the growth org). `position`
 * distinguishes agents who genuinely coordinate others from individual
 * contributors, so the Growth Command Hub and the team-context brief can render
 * an accurate chain instead of implying everyone is a peer.
 */
export type GrowthAgentPosition = 'chief_of_staff' | 'team_lead' | 'individual_contributor';

export type GrowthAgentDef = {
  id: string;
  legacyIds?: string[];
  name: string;
  roleTitle: string;
  mission: string;
  accent: GrowthAgentAccent;
  wave: number;
  marketingTypes: string[];
  primaryLane?: LeadEngineLane;
  acquisitionLaneIds?: string[];
  setupKeys?: string[];
  capabilities: GrowthAgentCapability[];
  /** Caleb pipeline workers (lead-discovery only). */
  subagents?: CalebSubagentWorker[];
  /** Real reporting relationship — id of another agent, or 'agent-architect' / 'ruth'. */
  reportsTo?: string;
  position?: GrowthAgentPosition;
};

export const GROWTH_AGENT_WAVE0_LANE: LeadEngineLane = 'credit_restore';

/**
 * Agent Architect — Ruth's chief-of-staff over the growth agent team (Phase 3).
 * Repurposes the previously orphaned `professor_apex` concept documented in
 * `organizationHierarchy.ts` ("Chief Agent Architect — orchestrates AI
 * departments; reports to Ruth"), instead of inventing a new persona. Watches the
 * handoff ledger across all growth agents, flags stalls/risks, and briefs Ruth
 * proactively — see `growthAgentArchitectBrief.ts`.
 */
export const AGENT_ARCHITECT: GrowthAgentDef = {
  id: 'agent-architect',
  legacyIds: ['professor_apex', 'professor-apex'],
  name: 'Ezra Hayes',
  roleTitle: "Team Coordinator — Ruth's chief of staff",
  mission: 'Watch every growth agent handoff, flag stalls or risk, and brief Ruth with the one decision that matters — not a raw data dump.',
  accent: 'violet',
  wave: 0,
  marketingTypes: ['orchestration'],
  reportsTo: 'ruth',
  position: 'chief_of_staff',
  capabilities: [
    { id: 'brief', label: "Brief Ruth", description: 'Handoff-ledger health, stalls, and the one decision Ruth should make today.', tier: 'live', runKey: 'agent_architect_brief' },
    { id: 'trail', label: 'Team trail', description: 'Cross-agent handoff feed — who did what, when, and why.', tier: 'live', href: '/admin/growth-agents?view=trail' },
  ],
};

export const GROWTH_AGENTS: GrowthAgentDef[] = [
  {
    id: 'lead-discovery',
    legacyIds: ['pipeline-titan'],
    name: 'Caleb Brooks',
    roleTitle: 'Lead Discovery',
    mission: 'Find people who need credit restore help, score them, and get them into your pipeline.',
    accent: 'emerald',
    wave: 0,
    marketingTypes: ['outbound_discovery'],
    primaryLane: GROWTH_AGENT_WAVE0_LANE,
    setupKeys: ['marketingDesk', 'leadIntel', 'supabase', 'serper'],
    subagents: CALEB_SUBAGENT_WORKERS,
    reportsTo: 'marketing-director',
    position: 'individual_contributor',
    capabilities: [
      { id: 'find', label: 'Find new people', description: 'Live search across rotating US metros and restore lane.', tier: 'live', href: '/admin/marketing?tab=desk&helper=find' },
      { id: 'test', label: 'Test search', description: 'One-row proof that search is connected.', tier: 'live', runKey: 'test_search' },
      { id: 'review', label: 'Review people', description: 'Approve or skip mid-score matches.', tier: 'live', href: '/admin/marketing?tab=desk&helper=find#exceptions' },
      { id: 'today10', label: "Today's 10 to contact", description: 'Best prospects to email or message today.', tier: 'live', runKey: 'today_ten' },
      { id: 'desk', label: 'Open my workroom', description: 'Marketing Desk — board, mail, and tasks.', tier: 'live', href: '/admin/marketing?tab=desk' },
    ],
  },
  {
    id: 'capture-links',
    name: 'Hannah Reed',
    roleTitle: 'Capture & Links',
    mission: 'Tracked guide links, QR codes, and safe syndication — every outreach has the right URL.',
    accent: 'amber',
    wave: 1,
    marketingTypes: ['capture', 'syndication'],
    acquisitionLaneIds: ['credit_restore', 'score_roadmap', 'debt_relief', 'business_credit'],
    reportsTo: 'marketing-director',
    position: 'individual_contributor',
    capabilities: [
      { id: 'links', label: 'Copy link for this offer', description: 'UTM link + QR for the active campaign.', tier: 'live', href: '/admin/lead-acquisition' },
      { id: 'syndication', label: 'Syndication queue', description: 'Approve before webhooks or RSS fire.', tier: 'live', href: '/admin/lead-acquisition' },
      { id: 'channel_performance', label: 'Channel performance watcher', description: 'Scores which syndication channels convert vs which only generate volume, and briefs Esther when one clearly outperforms.', tier: 'live', runKey: 'hannah_syndication_watcher' },
    ],
  },
  {
    id: 'marketing-director',
    legacyIds: ['cmo-prime'],
    name: 'Esther Hayes',
    roleTitle: 'Marketing Director',
    mission: 'One offer, one audience, one city per week — so discovery does not drift.',
    accent: 'violet',
    wave: 1,
    marketingTypes: ['strategy'],
    reportsTo: 'agent-architect',
    position: 'team_lead',
    capabilities: [
      { id: 'focus', label: "This week's focus", description: 'Lane, city, and book-session CTA.', tier: 'live', runKey: 'week_focus' },
      { id: 'strategy_review', label: 'Weekly strategy review (AI)', description: "Reads CRM stage counts and real week-over-week lead volume to decide if the week's focus should shift or Caleb/Hannah need a nudge.", tier: 'live', runKey: 'esther_strategy_review' },
    ],
  },
  {
    id: 'seo-local',
    legacyIds: ['seo-sentinel'],
    name: 'Lydia Chen',
    roleTitle: 'SEO & Local Pages',
    mission: 'Fix public pages and local search so partners find you and sign up themselves.',
    accent: 'sky',
    wave: 2,
    marketingTypes: ['seo_geo'],
    reportsTo: 'marketing-director',
    position: 'individual_contributor',
    capabilities: [
      { id: 'catalog', label: 'Check my pages', description: 'SEO health on public routes.', tier: 'preview', href: '/admin/access' },
      { id: 'seo_health', label: 'SEO health check (AI)', description: 'Real title/description/schema audit across public routes, with agent triage on whether the worst offenders need a fix task.', tier: 'live', runKey: 'lydia_seo_health_check' },
    ],
  },
  {
    id: 'social',
    legacyIds: ['social-commander'],
    name: 'Miriam Cole',
    roleTitle: 'Social & Short Video',
    mission: 'Scripts and captions with tracked links — you post or connect Meta later.',
    accent: 'fuchsia',
    wave: 3,
    marketingTypes: ['social_draft'],
    reportsTo: 'marketing-director',
    position: 'individual_contributor',
    capabilities: [
      {
        id: 'promote',
        label: 'Promote pillar video',
        description: 'Content Studio promote step — shorts hooks and Hannah-ready links.',
        tier: 'live',
        href: CONTENT_STUDIO_PROMOTE_BASE,
        promoteVideoId: true,
      },
      {
        id: 'shorts-pack',
        label: 'Shorts pack',
        description: 'Hooks + caption draft from latest pillar upload.',
        tier: 'live',
        runKey: 'shorts_pack',
      },
      {
        id: 'studio',
        label: 'Content Studio',
        description: 'Full video room — upload, publish, repurpose.',
        tier: 'live',
        href: '/admin/marketing?tab=content&room=video',
      },
      {
        id: 'content_priority',
        label: 'Content priority review (AI)',
        description: 'Reads real waiting social drafts in Content Studio and recommends which one to publish or promote next.',
        tier: 'live',
        runKey: 'miriam_content_priority_review',
      },
    ],
  },
  {
    id: 'media',
    legacyIds: ['media-alchemist'],
    name: 'Jordan Ellis',
    roleTitle: 'Media Producer',
    mission: 'Shot lists and scripts from one pillar video.',
    accent: 'fuchsia',
    wave: 3,
    marketingTypes: ['video'],
    reportsTo: 'marketing-director',
    position: 'individual_contributor',
    capabilities: [
      {
        id: 'promote',
        label: 'Promote & repurpose',
        description: 'Open promote step for the active pillar video.',
        tier: 'live',
        href: CONTENT_STUDIO_PROMOTE_BASE,
        promoteVideoId: true,
      },
      {
        id: 'pillar-script',
        label: 'Pillar script',
        description: 'Narration outline from upload intelligence or studio asset.',
        tier: 'live',
        runKey: 'pillar_script',
      },
      {
        id: 'content',
        label: 'Content Studio',
        description: 'Produce clips, shot lists, and publish paths.',
        tier: 'live',
        href: '/admin/marketing?tab=content&room=video',
      },
      {
        id: 'pipeline_review',
        label: 'Pipeline review (AI)',
        description: 'Checks the real pillar video lifecycle stage and recommends the next pipeline action (promote, repurpose, or hold).',
        tier: 'live',
        runKey: 'jordan_video_pipeline_review',
      },
    ],
  },
  {
    id: 'partnerships',
    name: 'Benjamin Cole',
    roleTitle: 'Partnerships',
    mission: 'Affiliates and agencies — fewer, higher-trust relationships.',
    accent: 'amber',
    wave: 4,
    marketingTypes: ['partnerships'],
    primaryLane: 'agency_affiliates',
    reportsTo: 'marketing-director',
    position: 'individual_contributor',
    capabilities: [
      { id: 'affiliate', label: 'Affiliate toolkit', description: 'Program links and partner kit.', tier: 'live', href: '/admin/lead-acquisition' },
      { id: 'partnership_checkin', label: 'Affiliate check-in (AI)', description: 'Flags stale or high-performing affiliates from real attribution data for a genuine check-in email or task.', tier: 'live', runKey: 'benjamin_partnership_review' },
    ],
  },
  {
    id: 'specialist-recruit',
    name: 'Rebecca Lane',
    roleTitle: 'Specialist Recruitment',
    mission: 'Credit specialist applications and recruiting funnels.',
    accent: 'violet',
    wave: 4,
    marketingTypes: ['recruiting'],
    reportsTo: 'marketing-director',
    position: 'individual_contributor',
    capabilities: [
      { id: 'apply', label: 'Specialist apply funnel', description: 'Tracked apply path.', tier: 'live', href: '/admin/lead-acquisition' },
      { id: 'recruiting_followup', label: 'Applicant follow-up (AI)', description: 'Follows up on real open specialist applications sitting in the CRM pipeline before they go stale.', tier: 'live', runKey: 'rebecca_recruiting_review' },
    ],
  },
  {
    id: 'appointment-setter',
    name: 'Alex Rivera',
    roleTitle: 'Appointment Setter',
    mission: 'Turn warm CRM leads into booked strategy calls — self-book links, reminders, audio-first join.',
    accent: 'sky',
    wave: 1,
    marketingTypes: ['appointments', 'sessions'],
    setupKeys: ['commsDelivery', 'calendar'],
    reportsTo: 'marketing-director',
    position: 'individual_contributor',
    capabilities: [
      { id: 'warm-outreach', label: 'Warm lead outreach', description: 'Create self-book links + email for contacted CRM leads.', tier: 'live', runKey: 'alex_outreach' },
      { id: 'invites', label: 'Invite links', description: 'Admin calendar — copy `/book/i/:token` links.', tier: 'live', href: '/admin/calendar' },
      { id: 'calendar', label: 'Open calendar', description: 'Confirm sessions and send meeting invites.', tier: 'live', href: '/admin/calendar' },
      { id: 'crm', label: 'CRM board', description: 'Move leads to Contacted → Booked.', tier: 'live', href: '/admin/crm' },
      { id: 'no_show_recovery', label: 'No-show recovery sweep', description: 'Detects confirmed sessions that passed without completion, flags no-show, and sends a reschedule invite.', tier: 'live', runKey: 'alex_no_show_recovery' },
    ],
  },
];

export function getGrowthAgent(id: string): GrowthAgentDef | undefined {
  const key = id.trim().toLowerCase();
  if (key === AGENT_ARCHITECT.id || AGENT_ARCHITECT.legacyIds?.includes(key)) return AGENT_ARCHITECT;
  return GROWTH_AGENTS.find((a) => a.id === key || a.legacyIds?.includes(key));
}

export function listGrowthAgentsByWave(): GrowthAgentDef[] {
  return [...GROWTH_AGENTS].sort((a, b) => a.wave - b.wave || a.name.localeCompare(b.name));
}
