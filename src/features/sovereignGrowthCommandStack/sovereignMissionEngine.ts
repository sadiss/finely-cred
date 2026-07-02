import type { SovereignMission, SovereignMissionType, SovereignMissionPriority } from './types';
import { recommendSovereignAgentsForMission } from './sovereignAgentDirectory';
import { defaultLeadCaptureRoutes, defaultGeoCells, channelCapabilities } from './marketingIntelligenceVault';
import { upsertSovereignMission } from './sovereignGrowthRepo';
import { createMissionThread, sendInterAgentNotifications } from './sovereignConversationEngine';

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const missionBlueprints: Array<{
  type: SovereignMissionType;
  label: string;
  description: string;
  defaultPriority: SovereignMissionPriority;
  outputs: string[];
  intelligenceQuestions: string[];
}> = [
  {
    type: 'layout_intelligence',
    label: 'Layout and Hierarchy Intelligence',
    description: 'Make the app easier to understand by turning scattered tools into a visible command hierarchy.',
    defaultPriority: 'critical',
    outputs: ['navigation recommendation', 'staff department map', 'mission command layout', 'admin next-step labels'],
    intelligenceQuestions: ['What should live under Staff?', 'What should stay under Leads/CRM?', 'Which buttons need ownership labels?'],
  },
  {
    type: 'deep_swarm',
    label: 'Deep Lead Intel Swarm',
    description: 'Start or improve continuous discovery, scoring, and lead routing.',
    defaultPriority: 'critical',
    outputs: ['source plan', 'city queue plan', 'hot lead action center', 'CRM/nurture handoff'],
    intelligenceQuestions: ['Which cities are active?', 'Which source types are stale?', 'Which leads deserve action first?'],
  },
  {
    type: 'lead_capture_upgrade',
    label: 'Lead Capture Route Upgrade',
    description: 'Make pages, forms, short links, and conversation prompts convert better.',
    defaultPriority: 'high',
    outputs: ['tracked short link map', 'lead magnet route', 'form fields', 'follow-up sequence'],
    intelligenceQuestions: ['What offer is this lead seeing?', 'What is the shortest next step?', 'Is the route tracked?'],
  },
  {
    type: 'meta_social_push',
    label: 'Meta and Social Push',
    description: 'Turn one offer into platform-native social, ad, reel, and story assets.',
    defaultPriority: 'high',
    outputs: ['platform hooks', 'caption bank', 'creative matrix', 'tracked CTA'],
    intelligenceQuestions: ['Which platform gets which angle?', 'What is the first-frame promise?', 'What CTA is trackable?'],
  },
  {
    type: 'video_factory',
    label: 'Video Factory',
    description: 'Create scripts, shot lists, B-roll prompts, thumbnails, and production briefs.',
    defaultPriority: 'high',
    outputs: ['short video scripts', 'shot list', 'thumbnail prompts', 'editor notes'],
    intelligenceQuestions: ['What should the viewer feel in second one?', 'What proof can be shown safely?', 'Where does the CTA appear?'],
  },
  {
    type: 'voice_factory',
    label: 'Voice Factory',
    description: 'Create voiceover direction, scripts, pacing, tone, and audio call-to-action paths.',
    defaultPriority: 'normal',
    outputs: ['voiceover script', 'tone direction', 'pacing map', 'CTA read'],
    intelligenceQuestions: ['Should this sound calm, urgent, warm, or authoritative?', 'What words must be avoided?'],
  },
  {
    type: 'geo_domination',
    label: 'Geo Domination',
    description: 'Make city-specific funnels, content, and staff ownership real.',
    defaultPriority: 'high',
    outputs: ['city cell plan', 'local offer', 'source mix', 'geo page needs'],
    intelligenceQuestions: ['Which city has the highest readiness?', 'What local angle is credible?', 'What source mix fits?'],
  },
  {
    type: 'appointment_blitz',
    label: 'Appointment Blitz',
    description: 'Turn hot leads into booked and prepared consultations.',
    defaultPriority: 'high',
    outputs: ['booking message', 'show-up path', 'owner assignment', 'follow-up reminders'],
    intelligenceQuestions: ['Does this lead need education or a calendar?', 'What pre-call prep improves show-up?'],
  },
  {
    type: 'analytics_diagnosis',
    label: 'Analytics Diagnosis',
    description: 'Find bottlenecks across source, route, CTA, nurture, and booking.',
    defaultPriority: 'normal',
    outputs: ['bottleneck map', 'scorecard', 'recommended fix', 'owner assignment'],
    intelligenceQuestions: ['Where are leads dropping?', 'Which source is overvalued?', 'What fix has highest leverage?'],
  },
];

export function createSovereignMission(args: { type: SovereignMissionType; city?: string; channel?: any; customObjective?: string; ownerIds?: string[] }): SovereignMission {
  const blueprint = missionBlueprints.find((b) => b.type === args.type) ?? missionBlueprints[0];
  const recommendedOwners = recommendSovereignAgentsForMission(args.type).map((agent) => agent.id);
  const ownerIds = args.ownerIds?.length ? args.ownerIds.slice(0, 3) : recommendedOwners;
  const cityCell = args.city ? defaultGeoCells.find((cell) => cell.city.toLowerCase() === args.city?.toLowerCase()) : undefined;
  const channel = args.channel ? channelCapabilities.find((c) => c.id === args.channel) : undefined;
  const strongestRoute = defaultLeadCaptureRoutes[0];
  const now = nowIso();
  const mission: SovereignMission = {
    id: id('mission'),
    type: args.type,
    title: `${blueprint.label}${args.city ? ` - ${args.city}` : ''}`,
    priority: blueprint.defaultPriority,
    status: 'ready',
    ownerIds,
    city: args.city,
    channel: args.channel,
    createdAt: now,
    updatedAt: now,
    objective: args.customObjective ?? blueprint.description,
    inputs: [
      `Blueprint: ${blueprint.label}`,
      cityCell ? `City readiness: ${cityCell.readinessScore}` : 'City readiness: not selected',
      channel ? `Channel: ${channel.name}` : 'Channel: selected by owner',
      `Strongest available route example: ${strongestRoute.name}`,
    ],
    outputs: blueprint.outputs,
    nextActions: [
      `Assign owners: ${ownerIds.join(', ')}`,
      'Create or verify tracked CTA path.',
      'Generate channel-specific assets or queue item.',
      'Notify affected staff and compliance reviewer.',
      'Update dashboard with status, blocker, and next move.',
    ],
    blockers: cityCell?.blockers ?? [],
    notifications: [],
    intelligenceNotes: blueprint.intelligenceQuestions,
  };
  const saved = upsertSovereignMission(mission);
  sendInterAgentNotifications(saved);
  createMissionThread(saved);
  return saved;
}

export function buildMissionBoardSummary(missions: SovereignMission[]): string[] {
  const active = missions.filter((m) => m.status !== 'complete');
  const critical = active.filter((m) => m.priority === 'critical');
  const blocked = active.filter((m) => m.status === 'blocked' || m.blockers.length);
  return [
    `${active.length} active missions`,
    `${critical.length} critical command lanes`,
    `${blocked.length} missions with blockers`,
    active[0] ? `Top mission: ${active[0].title}` : 'No mission created yet',
  ];
}

export function explainDeepFormOwnership(): string {
  return [
    'Deep Swarm is not one agent and not a random button.',
    'Pipeline Titan owns the pipeline outcome.',
    'Scout Supreme owns discovery quality.',
    'Night Owl Intel owns overnight scanning continuity.',
    'Geo Commander owns city focus.',
    'Switchboard owns queue and worker behavior.',
    'Velvet Hammer owns compliance gates.',
    'The admin should see all six lanes instead of wondering what the button did.',
  ].join(' ');
}
