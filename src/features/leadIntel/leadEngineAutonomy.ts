/**
 * Marketing lead autonomy 3× — capability score, hunt persistence, activity log,
 * outreach packs, multi-touch nurture, next-best-action. Live path = lead-intel (Serper) → CRM.
 * Deep swarm ticks are simulation unless labeled otherwise.
 */

import { createTask, listTasks } from '../../data/tasksRepo';
import { addProspectNote, listProspects, patchProspect, setProspectStage } from '../../data/crmProspectsRepo';
import type { Prospect } from '../../domain/crmProspects';
import { getFeatureFlags } from '../../data/settingsRepo';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { loadJson, saveJson } from '../../data/localJsonStore';
import { getMarketingPipelineProjectId } from '../marketingDesk/marketingDeskProjects';
import { marketingTaskAssigneeFields } from '../marketingDesk/marketingDeskAssignee';
import {
  buildNurtureSequence,
  buildOutreachVariants,
  channelPlanForLane,
  getHuntLane,
  nextBestActionsForLead,
  objectionsForLane,
  offerPackForLane,
  scoreLeadReasons,
  talkTracksForLane,
  type IntentModifier,
  type LeadEngineLane,
  type NicheModifier,
  type WhyLeadReason,
} from './leadEnginePlaybooks';

export type { LeadEngineLane, IntentModifier, NicheModifier, GeoModifier } from './leadEnginePlaybooks';
export {
  HUNT_LANE_PRESETS,
  DAILY_HUNT_PACK,
  GEO_MODIFIERS,
  NICHE_MODIFIERS,
  INTENT_MODIFIERS,
  OBJECTION_LIBRARY,
  OFFER_PACK,
  buildHuntQueries,
  buildNurtureSequence,
  buildOutreachVariants,
  objectionsForLane,
  offerPackForLane,
  nextBestActionsForLead,
  scoreLeadReasons,
  channelPlanForLane,
  talkTracksForLane,
  getHuntLane,
} from './leadEnginePlaybooks';

export type LeadCapabilityId =
  | 'leadIntelFlag'
  | 'supabase'
  | 'serperHint'
  | 'crmWrite'
  | 'bookingLink'
  | 'outboundEmail'
  | 'aiGateway'
  | 'multiLane'
  | 'nurtureSequence';

export type LeadCapability = {
  id: LeadCapabilityId;
  label: string;
  status: 'live' | 'ready' | 'needs_key' | 'manual' | 'partial';
  detail: string;
  fixHref?: string;
  points: number;
};

export type LeadHuntRunRecord = {
  at: string;
  lane: LeadEngineLane;
  location: string;
  imported: number;
  prospectIds: string[];
  error?: string;
  niche?: NicheModifier;
  intent?: IntentModifier;
  batchId?: string;
  whySample?: WhyLeadReason[];
};

export type LeadActivityEntry = {
  id: string;
  at: string;
  kind: 'hunt' | 'daily_pack' | 'nurture_tasks' | 'outreach_draft' | 'sequence' | 'error';
  label: string;
  detail?: string;
  lane?: LeadEngineLane;
  count?: number;
};

export type LeadAutonomySnapshot = {
  whereAmI: string;
  whatMatters: string;
  whatNext: string;
  todaysMission: string;
  readiness: 'Ready' | 'Partial' | 'Blocked';
  capabilityScore: number;
  capabilityMax: number;
  capabilities: LeadCapability[];
  engineTotal: number;
  engineToday: number;
  hotCount: number;
  pendingNurture: number;
  lastRun: LeadHuntRunRecord | null;
  recentActivity: LeadActivityEntry[];
  deepSwarmNote: string;
};

const LAST_RUN_KEY = 'finely.lead_engine.last_run.v1';
const ACTIVITY_KEY = 'finely.lead_engine.activity.v1';
const CAPABILITY_MAX = 100;

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function getLaneCta(lane: LeadEngineLane) {
  const p = getHuntLane(lane);
  return { label: p.label, book: p.book, offer: p.offer, nurture: p.nurture, freeGuide: p.freeGuide };
}

export function loadLastLeadHuntRun(): LeadHuntRunRecord | null {
  return loadJson<LeadHuntRunRecord | null>(LAST_RUN_KEY, null, 1);
}

export function saveLastLeadHuntRun(run: LeadHuntRunRecord) {
  saveJson(LAST_RUN_KEY, run, 1);
  appendLeadActivity({
    kind: run.error ? 'error' : 'hunt',
    label: run.error ? `Hunt failed · ${run.lane}` : `Hunt · ${run.lane} · ${run.imported} imported`,
    detail: run.error || `${run.location}${run.batchId ? ` · pack ${run.batchId}` : ''}`,
    lane: run.lane,
    count: run.imported,
  });
}

export function loadLeadActivity(): LeadActivityEntry[] {
  return loadJson<LeadActivityEntry[]>(ACTIVITY_KEY, [], 1).slice(0, 40);
}

export function appendLeadActivity(
  entry: Omit<LeadActivityEntry, 'id' | 'at'> & { id?: string; at?: string },
): LeadActivityEntry {
  const row: LeadActivityEntry = {
    id: entry.id || `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: entry.at || new Date().toISOString(),
    kind: entry.kind,
    label: entry.label,
    detail: entry.detail,
    lane: entry.lane,
    count: entry.count,
  };
  const prev = loadLeadActivity();
  saveJson(ACTIVITY_KEY, [row, ...prev].slice(0, 40), 1);
  return row;
}

export function assessLeadCapabilities(): LeadCapability[] {
  const flags = getFeatureFlags();
  const leadIntelOn = Boolean(flags.leadIntel);
  const aiOn = Boolean((flags as { aiGateway?: boolean }).aiGateway);
  return [
    {
      id: 'leadIntelFlag',
      label: 'Feature flag: leadIntel',
      status: leadIntelOn ? 'live' : 'needs_key',
      detail: leadIntelOn ? 'Enabled in Admin Settings → Features' : 'Turn on leadIntel before hunting',
      fixHref: '/admin/settings',
      points: leadIntelOn ? 20 : 0,
    },
    {
      id: 'supabase',
      label: 'Supabase configured',
      status: isSupabaseConfigured ? 'ready' : 'needs_key',
      detail: isSupabaseConfigured ? 'Client ready to invoke lead-intel' : 'Supabase env missing — edge invoke will fail',
      fixHref: '/admin/settings',
      points: isSupabaseConfigured ? 20 : 0,
    },
    {
      id: 'serperHint',
      label: 'SERPER_API_KEY (edge)',
      status: 'needs_key',
      detail: 'Required on lead-intel edge. Hunt fails clearly if missing — not fakeable from the browser.',
      fixHref: '/admin/lead-intel#lead-hunt',
      points: 5,
    },
    {
      id: 'crmWrite',
      label: 'CRM prospect write',
      status: 'live',
      detail: 'Imports tag lead-intel + lead-engine, why-reasons, and next actions',
      points: 15,
    },
    {
      id: 'bookingLink',
      label: 'Consultation booking',
      status: 'live',
      detail: '/consultation + lane CTAs wired for handoff',
      fixHref: '/consultation',
      points: 10,
    },
    {
      id: 'multiLane',
      label: 'Multi-lane hunt pack',
      status: 'live',
      detail: '6 hunt lanes + geo/niche/intent modifiers + daily pack (3–5 hunts)',
      fixHref: '/admin/lead-intel#lead-hunt',
      points: 10,
    },
    {
      id: 'nurtureSequence',
      label: 'Day 0/2/5/7 nurture tasks',
      status: 'live',
      detail: 'CRM admin tasks + copy packs (manual send)',
      points: 10,
    },
    {
      id: 'aiGateway',
      label: 'AI Gateway (Ruth briefs)',
      status: aiOn ? 'ready' : 'partial',
      detail: aiOn ? 'aiGateway flag on — Ruth briefs can call the model' : 'Enable aiGateway + provider keys for full Ruth briefs',
      fixHref: '/admin/settings',
      points: aiOn ? 5 : 2,
    },
    {
      id: 'outboundEmail',
      label: 'Cold outbound email blast',
      status: 'manual',
      detail: 'No blast infra — drafts + CRM/admin follow-up tasks only (Wave 2)',
      points: 0,
    },
  ];
}

export function capabilityScoreOf(caps: LeadCapability[] = assessLeadCapabilities()): {
  score: number;
  max: number;
} {
  const score = Math.min(
    CAPABILITY_MAX,
    caps.reduce((sum, c) => sum + (c.points || 0), 0),
  );
  return { score, max: CAPABILITY_MAX };
}

export function listLeadEngineProspects(): Prospect[] {
  return listProspects({ q: '', target: 'all' }).filter((p) => (p.tags ?? []).includes('lead-engine'));
}

function readinessFromCaps(caps: LeadCapability[], all: Prospect[], lastRun: LeadHuntRunRecord | null): LeadAutonomySnapshot['readiness'] {
  const flagOk = caps.find((c) => c.id === 'leadIntelFlag')?.status === 'live';
  const supabaseOk = caps.find((c) => c.id === 'supabase')?.status === 'ready';
  if (!flagOk || !supabaseOk) return 'Blocked';
  if (all.length > 0 || (lastRun && lastRun.imported > 0 && !lastRun.error)) return 'Ready';
  return 'Partial';
}

export function buildLeadAutonomySnapshot(): LeadAutonomySnapshot {
  const capabilities = assessLeadCapabilities();
  const { score: capabilityScore, max: capabilityMax } = capabilityScoreOf(capabilities);
  const all = listLeadEngineProspects();
  const today = all.filter((p) => isToday(p.createdAt) || isToday(p.updatedAt));
  const hotCount = all.filter((p) => (p.score ?? 0) >= 60 || p.intel?.intentTier === 'hot').length;
  const pendingNurture = all.filter((p) => {
    const stage = p.stage;
    return stage === 'new' || stage === 'researching' || stage === 'contact_ready';
  }).length;
  const lastRun = loadLastLeadHuntRun();
  const readiness = readinessFromCaps(capabilities, all, lastRun);
  const blockers = capabilities.filter((c) => c.status === 'needs_key' && c.id !== 'serperHint');

  const whereAmI = 'Marketing agents · Lead autonomy 3× (multi-lane Lead Intel + Ruth)';
  let whatMatters =
    pendingNurture > 0
      ? `${pendingNurture} Lead Engine prospect(s) still need outreach / book / nurture.`
      : hotCount > 0
        ? `${hotCount} hot prospect(s) ready for booking or offer send.`
        : 'No fresh Lead Engine pipeline — run a live hunt or daily pack (not deep-swarm simulation).';
  if (blockers.length) {
    whatMatters = `Blocked: ${blockers.map((b) => b.label).join(', ')}. ${whatMatters}`;
  }

  const flagOk = capabilities.find((c) => c.id === 'leadIntelFlag')?.status === 'live';
  const supabaseOk = capabilities.find((c) => c.id === 'supabase')?.status === 'ready';
  const whatNext = !flagOk
    ? 'Enable Feature Flag leadIntel → then Run daily pack.'
    : !supabaseOk
      ? 'Configure Supabase → then Run lead hunt on /admin/lead-intel.'
      : pendingNurture > 0
        ? 'Open CRM Lead Engine list → Book session / paste 3 outreach variants / complete Day 0–7 tasks.'
        : 'Run daily pack (3–5 lanes) → review imports + why-reasons → queue nurture sequences.';

  const todaysMission =
    readiness === 'Blocked'
      ? whatNext
      : pendingNurture > 0
        ? `Work ${Math.min(pendingNurture, 5)} nurture / book actions in CRM Lead Engine imports.`
        : hotCount > 0
          ? `Book or send offer packs to ${Math.min(hotCount, 3)} hot prospect(s).`
          : 'Run Daily pack on Lead Intel (live Serper) — 3–5 lanes.';

  return {
    whereAmI,
    whatMatters,
    whatNext,
    todaysMission,
    readiness,
    capabilityScore,
    capabilityMax,
    capabilities,
    engineTotal: all.length,
    engineToday: today.length,
    hotCount,
    pendingNurture,
    lastRun,
    recentActivity: loadLeadActivity().slice(0, 8),
    deepSwarmNote:
      'SIMULATION ONLY: Deep Swarm / Overnight50 counters are ops cadence — NOT live Serper imports. Live path = Run lead hunt / Daily pack.',
  };
}

export function buildOutreachCopyPack(args: {
  lane: LeadEngineLane;
  companyName?: string;
  website?: string;
}): { subject: string; body: string; nextActionLabel: string; variants: ReturnType<typeof buildOutreachVariants> } {
  const variants = buildOutreachVariants(args);
  const primary = variants[1] ?? variants[0]!;
  const cta = getLaneCta(args.lane);
  return {
    subject: primary.subject,
    body: primary.body,
    nextActionLabel:
      args.lane === 'business_credit' || args.lane === 'funded_business' || args.lane === 'local_service'
        ? 'Send BC outreach pack + book session CTA'
        : args.lane === 'debt'
          ? 'Send debt educational pack + book session'
          : args.lane === 'agency_affiliates'
            ? 'Send affiliate/agency pack + hub CTA'
            : 'Send restore pack + book session',
    variants,
  };
}

export function nextActionForImport(args: {
  lane: LeadEngineLane;
  score: number;
  intentTier?: string;
  hasEmail: boolean;
}): { label: string; dueAt: string } {
  const due = new Date(Date.now() + (args.score >= 60 || args.intentTier === 'hot' ? 4 : 24) * 3600 * 1000);
  const nba = nextBestActionsForLead(args)[0];
  const cta = getLaneCta(args.lane);
  const label =
    nba?.id === 'book' ? `Book session → ${cta.book}`
    : nba?.id === 'offer' ? `Send offer / outreach pack → ${cta.offer}`
    : nba?.href ? `${nba.label} → ${nba.href}`
    : nba?.label || `Add to nurture → ${cta.nurture}`;
  return { label, dueAt: due.toISOString() };
}

function laneFromTags(tags: string[] | undefined): LeadEngineLane {
  const order: LeadEngineLane[] = [
    'funded_business',
    'agency_affiliates',
    'local_service',
    'debt',
    'credit_restore',
    'business_credit',
  ];
  for (const id of order) {
    if (tags?.includes(id)) return id;
  }
  return 'business_credit';
}

/** Create Day 0/2/5/7 CRM tasks + notes (idempotent per prospect + day). */
export function ensureNurtureSequenceForProspects(prospectIds?: string[]): {
  created: number;
  skipped: number;
  touches: number;
} {
  const targets = (prospectIds?.length
    ? listLeadEngineProspects().filter((p) => prospectIds.includes(p.id))
    : listLeadEngineProspects()
  ).filter((p) => p.stage === 'new' || p.stage === 'researching' || p.stage === 'contact_ready');

  const existing = listTasks().filter((t) => (t.tags ?? []).includes('lead-engine-nurture'));
  const already = new Set(
    existing.flatMap((t) => {
      const meta = (t as { meta?: { prospectId?: string; nurtureDay?: number } }).meta;
      if (!meta?.prospectId) return [] as string[];
      return [`${meta.prospectId}:d${meta.nurtureDay ?? 'x'}`];
    }),
  );

  let created = 0;
  let skipped = 0;
  let touches = 0;

  for (const p of targets.slice(0, 40)) {
    const lane = laneFromTags(p.tags);
    const seq = buildNurtureSequence({
      lane,
      companyName: p.company?.name,
      website: p.company?.website,
    });
    let createdForP = 0;
    for (const touch of seq) {
      const key = `${p.id}:d${touch.day}`;
      if (already.has(key)) {
        skipped += 1;
        continue;
      }
      const due = new Date(Date.now() + touch.day * 24 * 3600 * 1000).toISOString();
      const assignee = marketingTaskAssigneeFields();
      createTask({
        partnerId: 'admin_growth',
        projectId: getMarketingPipelineProjectId(),
        title: `Lead Engine D${touch.day}: ${p.company?.name || p.contact?.name || 'Prospect'}`,
        kind: 'follow_up',
        priority: touch.day === 0 && (p.score ?? 0) >= 60 ? 'high' : 'normal',
        status: 'pending',
        stage: 'funding',
        dueAt: due,
        visibility: 'admin',
        assignedTo: assignee.assignedTo,
        assigneeUserIds: assignee.assigneeUserIds,
        tags: ['lead-engine', 'lead-engine-nurture', 'marketing-desk', `nurture-d${touch.day}`, lane],
        labels: Array.from(
          new Set(['Lead Engine', `Day ${touch.day}`, 'Marketing Pipeline', ...(assignee.labels ?? [])]),
        ),
        notes: `${touch.title}\n${touch.subject}\n\n${touch.body}\n\nChannel: ${touch.channel} (manual when mail Needs setup)\nCRM: /admin/crm?smartList=lead_engine_imports\nDesk: /admin/marketing-desk`,
        meta: {
          prospectId: p.id,
          source: 'lead_engine_autonomy_3x',
          lane,
          nurtureDay: touch.day,
          channel: touch.channel,
        },
      });
      already.add(key);
      created += 1;
      createdForP += 1;
      touches += 1;
    }

    if (createdForP > 0) {
      const pack = buildOutreachCopyPack({
        lane,
        companyName: p.company?.name,
        website: p.company?.website,
      });
      addProspectNote(
        p.id,
        `[Lead Engine 3×] Nurture sequence queued (Day 0/2/5/7). Manual send only.\nVariants:\n${pack.variants.map((v) => `• ${v.angle}: ${v.subject}`).join('\n')}`,
      );
      if (p.stage === 'new') setProspectStage(p.id, 'contact_ready');
      patchProspect(p.id, {
        nextAction: nextActionForImport({
          lane,
          score: p.score ?? 0,
          intentTier: p.intel?.intentTier,
          hasEmail: (p.contact?.emails?.length ?? 0) > 0,
        }),
        tags: Array.from(new Set([...(p.tags ?? []), 'lead-engine', 'nurture-queued', 'nurture-d0-7'])),
      });
    }
  }

  if (created > 0) {
    appendLeadActivity({
      kind: 'sequence',
      label: `Nurture sequences · ${created} tasks`,
      detail: `${touches} touches across prospects (manual send)`,
      count: created,
    });
  }

  return { created, skipped, touches };
}

/** Back-compat: single follow-up task path now expands to Day 0/2/5/7 sequence. */
export function ensureNurtureTasksForLeadEngine(prospectIds?: string[]): { created: number; skipped: number } {
  const r = ensureNurtureSequenceForProspects(prospectIds);
  return { created: r.created, skipped: r.skipped };
}

export function formatWhyLeadNote(reasons: WhyLeadReason[]): string {
  if (!reasons.length) return 'Why: lane match from Lead Engine hunt.';
  return `Why this lead:\n${reasons.map((r, i) => `${i + 1}. ${r.label}`).join('\n')}`;
}

export function applyImportScoring(args: {
  lane: LeadEngineLane;
  baseScore: number;
  intentTier?: string;
  hasEmail: boolean;
  hasPhone: boolean;
  snippet?: string;
  industry?: string;
  niche?: NicheModifier;
  intent?: IntentModifier;
}): { score: number; reasons: WhyLeadReason[]; whyNote: string } {
  const scored = scoreLeadReasons({
    lane: args.lane,
    score: args.baseScore,
    intentTier: args.intentTier,
    hasEmail: args.hasEmail,
    hasPhone: args.hasPhone,
    snippet: args.snippet,
    industry: args.industry,
    niche: args.niche,
    intent: args.intent,
  });
  return { ...scored, whyNote: formatWhyLeadNote(scored.reasons) };
}

export function buildRuthPlaybookBrief(): string {
  const snap = buildLeadAutonomySnapshot();
  const lane: LeadEngineLane = snap.lastRun?.lane || 'business_credit';
  const channels = channelPlanForLane(lane);
  const talks = talkTracksForLane(lane);
  const objections = objectionsForLane(lane).slice(0, 3);
  const offers = offerPackForLane(lane);
  return [
    'RUTH · LEAD ENGINE 3× PLAYBOOK',
    `Capability score: ${snap.capabilityScore}/${snap.capabilityMax} · Readiness: ${snap.readiness}`,
    `Today's mission: ${snap.todaysMission}`,
    `Pipeline: total ${snap.engineTotal} · today ${snap.engineToday} · hot ${snap.hotCount} · pending nurture ${snap.pendingNurture}`,
    '',
    'Playbook: hunt → qualify (why-reasons) → outreach pack (3 variants) → Day 0/2/5/7 nurture tasks → book session.',
    'Channel plan:',
    ...channels.map((c) => `- ${c}`),
    'Talk tracks:',
    ...talks.map((t) => `- ${t}`),
    'Objection handlers:',
    ...objections.map((o) => `- "${o.objection}" → ${o.reply.slice(0, 140)}… CTA ${o.ctaHref}`),
    'Offer pack links:',
    ...offers.map((o) => `- ${o.label}: ${o.href}`),
    '',
    snap.deepSwarmNote,
  ].join('\n');
}

export function summarizeLeadEngineForCoOwner(): string {
  const snap = buildLeadAutonomySnapshot();
  const caps = snap.capabilities
    .map((c) => `- ${c.label}: ${c.status.toUpperCase()} — ${c.detail}${c.fixHref ? ` [${c.fixHref}]` : ''}`)
    .join('\n');
  const activity = snap.recentActivity
    .map((a) => `- ${a.at}: ${a.label}${a.detail ? ` (${a.detail})` : ''}`)
    .join('\n');
  return [
    'LEAD ENGINE AUTONOMY 3× SNAPSHOT',
    `Readiness: ${snap.readiness} · Capability score: ${snap.capabilityScore}/${snap.capabilityMax}`,
    `Where: ${snap.whereAmI}`,
    `Matters: ${snap.whatMatters}`,
    `Next: ${snap.whatNext}`,
    `Today's mission: ${snap.todaysMission}`,
    `Engine total: ${snap.engineTotal} · today: ${snap.engineToday} · hot: ${snap.hotCount} · pending nurture: ${snap.pendingNurture}`,
    snap.lastRun
      ? `Last hunt: ${snap.lastRun.at} · ${snap.lastRun.lane} · ${snap.lastRun.location} · imported ${snap.lastRun.imported}${snap.lastRun.error ? ` · error: ${snap.lastRun.error}` : ''}`
      : 'Last hunt: none yet',
    'Capabilities:',
    caps,
    'Recent activity:',
    activity || '- none yet',
    '',
    buildRuthPlaybookBrief(),
    'Live path: /admin/lead-intel → Run lead hunt / Daily pack (Serper) → CRM lead-engine tags.',
    'Public CTAs: /consultation · /pricing/business-credit · /resources · /resources/business-credit-one-sheets · free guides.',
  ].join('\n');
}

export const RUTH_LEAD_HUNT_BRIEF_PROMPT = [
  'Run the daily Lead Engine 3× growth brief (live path only — not deep-swarm simulation).',
  '1) Report Lead Engine CRM counts (lead-engine tags), hot prospects, pending nurture, and capability score.',
  '2) Tell the owner whether leadIntel flag + Supabase are ready; remind SERPER_API_KEY must be on the lead-intel edge (fail loudly if missing).',
  '3) Prescribe multi-lane next actions: Run daily pack (BC buyers, restore, local ops, agency, funded intent) on /admin/lead-intel → review CRM why-reasons → Book session / Send 3 outreach variants / Day 0-7 nurture tasks.',
  '4) Include channel plan, talk tracks, 2 objection handlers, and CTA links: /consultation, /pricing/business-credit, /resources/business-credit-one-sheets, free guides.',
  '5) Draft 3 compliant outreach variants using partner terminology (never client/customer).',
  '6) List admin follow-up tasks; if nurture sequences are missing, tell owner to click Generate nurture sequence.',
  'Output: headline verdict → deep read → top 5 priorities → stewardship close. Results vary · not legal advice · funding subject to underwriting.',
].join(' ');
