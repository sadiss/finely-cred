import type { LeadEngineLane } from '../leadIntel/leadEngineAutonomy';

export type GrowthAgentAccent = 'emerald' | 'amber' | 'sky' | 'violet' | 'fuchsia' | 'rose';

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

const CONTENT_STUDIO_PROMOTE_BASE = '/admin/content-studio?view=advanced&room=video&step=promote';

/** Deep link — Miriam/Jordan promote step; optional Hannah attribution video id. */
export function buildGrowthContentStudioPromoteUrl(videoId?: string): string {
  const id = videoId?.trim();
  if (!id) return CONTENT_STUDIO_PROMOTE_BASE;
  const params = new URLSearchParams({ view: 'advanced', room: 'video', step: 'promote', videoId: id });
  return `/admin/content-studio?${params.toString()}`;
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
  return `/admin/content-studio?${params.toString()}`;
}

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
};

export const GROWTH_AGENT_WAVE0_LANE: LeadEngineLane = 'credit_restore';

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
    capabilities: [
      { id: 'find', label: 'Find new people', description: 'Live search for your city and restore lane.', tier: 'live', href: '/admin/marketing-desk?helper=find' },
      { id: 'test', label: 'Test search', description: 'One-row proof that search is connected.', tier: 'live', runKey: 'test_search' },
      { id: 'review', label: 'Review people', description: 'Approve or skip mid-score matches.', tier: 'live', href: '/admin/marketing-desk?helper=find#exceptions' },
      { id: 'today10', label: "Today's 10 to contact", description: 'Best prospects to email or message today.', tier: 'live', runKey: 'today_ten' },
      { id: 'desk', label: 'Open my workroom', description: 'Marketing Desk — board, mail, and tasks.', tier: 'live', href: '/admin/marketing-desk' },
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
    capabilities: [
      { id: 'links', label: 'Copy link for this offer', description: 'UTM link + QR for the active campaign.', tier: 'live', href: '/admin/lead-acquisition' },
      { id: 'syndication', label: 'Syndication queue', description: 'Approve before webhooks or RSS fire.', tier: 'live', href: '/admin/lead-acquisition' },
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
    capabilities: [
      { id: 'focus', label: "This week's focus", description: 'Lane, city, and book-session CTA.', tier: 'live', runKey: 'week_focus' },
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
    capabilities: [
      { id: 'catalog', label: 'Check my pages', description: 'SEO health on public routes.', tier: 'preview', href: '/admin/access' },
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
        href: '/admin/content-studio?room=video',
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
        href: '/admin/content-studio?room=video',
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
    capabilities: [
      { id: 'affiliate', label: 'Affiliate toolkit', description: 'Program links and partner kit.', tier: 'live', href: '/admin/lead-acquisition' },
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
    capabilities: [
      { id: 'apply', label: 'Specialist apply funnel', description: 'Tracked apply path.', tier: 'live', href: '/admin/lead-acquisition' },
    ],
  },
];

export function getGrowthAgent(id: string): GrowthAgentDef | undefined {
  const key = id.trim().toLowerCase();
  return GROWTH_AGENTS.find((a) => a.id === key || a.legacyIds?.includes(key));
}

export function listGrowthAgentsByWave(): GrowthAgentDef[] {
  return [...GROWTH_AGENTS].sort((a, b) => a.wave - b.wave || a.name.localeCompare(b.name));
}
