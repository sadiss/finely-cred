/**
 * Shared Lead Engine building blocks — lane presets, hunt query building, import
 * scoring, and outreach copy. Consumed by Marketing Desk (Find/Hunt/Mail/Ruth) and
 * the one-button Lead Engine.
 */
import type { ProspectTarget } from '../../domain/crmProspects';
import { listProspects } from '../../data/crmProspectsRepo';
import { loadJson, saveJson } from '../../data/localJsonStore';
import { createTask, listTasks } from '../../data/tasksRepo';
import { ensureMarketingPipelineProject, MARKETING_DESK_TAG, MARKETING_PIPELINE_PARTNER_ID } from '../marketingDesk/marketingDeskProjects';
import { marketingTaskAssigneeFields } from '../marketingDesk/marketingDeskAssignee';

export type LeadEngineLane =
  | 'business_credit'
  | 'credit_restore'
  | 'debt'
  | 'agency_affiliates'
  | 'local_service'
  | 'funded_business';

export type LeadEngineLanePreset = {
  id: LeadEngineLane;
  label: string;
  shortLabel: string;
  target: ProspectTarget;
  tags: string[];
  queryHints: string[];
};

export const HUNT_LANE_PRESETS: LeadEngineLanePreset[] = [
  {
    id: 'business_credit',
    label: 'Business Credit',
    shortLabel: 'Biz Credit',
    target: 'clients',
    tags: ['business-credit'],
    queryHints: [
      'small business owners need business credit funding',
      'LLC owners looking for business credit cards',
      'startup fundability business credit build',
    ],
  },
  {
    id: 'credit_restore',
    label: 'Credit Restore',
    shortLabel: 'Credit Restore',
    target: 'clients',
    tags: ['credit-restore'],
    queryHints: [
      'credit repair help near me',
      'dispute inaccurate credit report',
      'raise credit score for mortgage',
    ],
  },
  {
    id: 'debt',
    label: 'Debt / Litigation',
    shortLabel: 'Debt',
    target: 'clients',
    tags: ['debt'],
    queryHints: [
      'sued by debt collector help',
      'debt validation letter help',
      'collection lawsuit defense',
    ],
  },
  {
    id: 'agency_affiliates',
    label: 'Agency & Affiliates',
    shortLabel: 'Affiliates',
    target: 'affiliates',
    tags: ['agency-affiliates'],
    queryHints: [
      'credit repair affiliate program partners',
      'agency reseller credit repair software',
    ],
  },
  {
    id: 'local_service',
    label: 'Local Service Partners',
    shortLabel: 'Local Service',
    target: 'b2b_partners',
    tags: ['local-service'],
    queryHints: [
      'auto dealer business credit partner program',
      'local business partner referral program',
    ],
  },
  {
    id: 'funded_business',
    label: 'Funded Business',
    shortLabel: 'Funded Biz',
    target: 'clients',
    tags: ['funded-business'],
    queryHints: [
      'business owner needs working capital funding',
      'small business loan alternative funding',
    ],
  },
];

const LANE_CTA: Record<LeadEngineLane, { book: string; offer: string }> = {
  business_credit: { book: '/consultation?lane=Business+Credit', offer: '/pricing/business-credit' },
  credit_restore: { book: '/consultation?lane=Credit+Restore', offer: '/pricing' },
  debt: { book: '/consultation?lane=Debt', offer: '/pricing/debt-legal' },
  agency_affiliates: { book: '/consultation?lane=Affiliates', offer: '/pricing?tab=agency' },
  local_service: { book: '/consultation?lane=Local+Service', offer: '/pricing' },
  funded_business: { book: '/consultation?lane=Funded+Business', offer: '/pricing/business-credit' },
};

/** Booking / offer deep-link CTAs for a lane. */
export function getLaneCta(lane: LeadEngineLane): { book: string; offer: string } {
  return LANE_CTA[lane] ?? LANE_CTA.business_credit;
}

/** Build the search-query set for a lane's hunt run. */
export function buildHuntQueries(args: {
  lane: LeadEngineLane;
  location: string;
  niche?: string;
  intent?: string;
  geo?: string;
}): string[] {
  const preset = HUNT_LANE_PRESETS.find((p) => p.id === args.lane) ?? HUNT_LANE_PRESETS[0];
  return preset.queryHints;
}

export type ImportScoringArgs = {
  lane: LeadEngineLane;
  baseScore: number;
  intentTier?: string;
  hasEmail: boolean;
  hasPhone: boolean;
  snippet?: string;
  industry?: string;
  niche?: string;
  intent?: string;
};

/** Nudge raw hunt scores by contactability + intent tier; returns the score plus a why-note. */
export function applyImportScoring(args: ImportScoringArgs): { score: number; whyNote: string } {
  let score = Math.max(0, Math.min(100, Math.round(args.baseScore || 0)));
  const reasons: string[] = [];

  if (args.hasEmail) {
    score += 8;
    reasons.push('has email');
  }
  if (args.hasPhone) {
    score += 4;
    reasons.push('has phone');
  }
  if (args.intentTier === 'hot') {
    score += 10;
    reasons.push('hot intent');
  } else if (args.intentTier === 'warm') {
    score += 4;
    reasons.push('warm intent');
  }

  score = Math.max(0, Math.min(100, score));
  const preset = HUNT_LANE_PRESETS.find((p) => p.id === args.lane);
  const whyNote = reasons.length
    ? `${preset?.shortLabel ?? args.lane} fit — ${reasons.join(', ')}.`
    : `${preset?.shortLabel ?? args.lane} fit from Find.`;

  return { score, whyNote };
}

/** Next-action suggestion attached to a freshly imported prospect. */
export function nextActionForImport(args: {
  lane: LeadEngineLane;
  score: number;
  intentTier?: string;
  hasEmail: boolean;
}): { label: string; dueAt?: string } {
  const preset = HUNT_LANE_PRESETS.find((p) => p.id === args.lane);
  const laneLabel = preset?.shortLabel ?? args.lane;
  if (args.score >= 70) {
    return { label: `${laneLabel} — reach out today`, dueAt: new Date().toISOString() };
  }
  if (!args.hasEmail) {
    return { label: `${laneLabel} — find a contact email` };
  }
  return { label: `${laneLabel} — review before outreach` };
}

export type OutreachCopyPack = { subject: string; body: string };

/** One-line cold outreach starter copy for a lane. */
export function buildOutreachCopyPack(args: {
  lane: LeadEngineLane;
  companyName?: string;
  website?: string;
}): OutreachCopyPack {
  const preset = HUNT_LANE_PRESETS.find((p) => p.id === args.lane) ?? HUNT_LANE_PRESETS[0];
  const name = args.companyName || 'there';
  return {
    subject: `Quick question about ${name}'s ${preset.shortLabel.toLowerCase()} plans`,
    body: `Hi ${name}, saw ${args.website ?? 'your site'} and thought our ${preset.label.toLowerCase()} program might be a fit. Open to a quick call?`,
  };
}

export type LeadHuntRunRecord = {
  at: string;
  lane: LeadEngineLane;
  location: string;
  imported: number;
  prospectIds: string[];
  error?: string;
  batchId: string;
};

const HUNT_RUN_HISTORY_KEY = 'finely.lead_engine_hunt_runs.v1';
const LEAD_ACTIVITY_KEY = 'finely.lead_engine_activity.v1';

/** Append a hunt run to the rolling history (last 50). */
export function saveLastLeadHuntRun(run: LeadHuntRunRecord) {
  const history = loadJson<LeadHuntRunRecord[]>(HUNT_RUN_HISTORY_KEY, [], 1);
  const next = [run, ...history].slice(0, 50);
  saveJson(HUNT_RUN_HISTORY_KEY, next, 1);
}

export function listLeadHuntRunHistory(limit = 20): LeadHuntRunRecord[] {
  return loadJson<LeadHuntRunRecord[]>(HUNT_RUN_HISTORY_KEY, [], 1).slice(0, limit);
}

export type LeadActivityEntry = {
  id: string;
  at: string;
  kind: string;
  label: string;
  detail?: string;
  count?: number;
  lane?: LeadEngineLane;
};

/** Append an activity-feed entry (last 100 kept). */
export function appendLeadActivity(entry: {
  kind: string;
  label: string;
  detail?: string;
  count?: number;
  lane?: LeadEngineLane;
}) {
  const history = loadJson<LeadActivityEntry[]>(LEAD_ACTIVITY_KEY, [], 1);
  const record: LeadActivityEntry = {
    id: `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...entry,
  };
  const next = [record, ...history].slice(0, 100);
  saveJson(LEAD_ACTIVITY_KEY, next, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function listLeadActivity(limit = 20): LeadActivityEntry[] {
  return loadJson<LeadActivityEntry[]>(LEAD_ACTIVITY_KEY, [], 1).slice(0, limit);
}

const ENGINE_TAGS = ['lead-intel', 'lead-engine', 'marketing-desk', 'lead_engine'];

/** Prospects sourced via Lead Engine / Marketing Desk, most recent first. */
export function listLeadEngineProspects() {
  return listProspects()
    .filter((p) => (p.tags ?? []).some((t) => ENGINE_TAGS.includes(t)))
    .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
}

function isOpenNurtureTaskForProspect(prospectId: string) {
  return listTasks().some((t) => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    const meta = (t.meta ?? {}) as { marketingKind?: string; prospectId?: string };
    return meta.marketingKind === 'nurture' && meta.prospectId === prospectId;
  });
}

/** Queue a follow-up to-do for Lead Engine prospects that don't already have one open. */
export function ensureNurtureSequenceForProspects(): { created: number; skipped: number } {
  const prospects = listLeadEngineProspects().slice(0, 10);
  let created = 0;
  let skipped = 0;
  if (!prospects.length) return { created, skipped };

  const project = ensureMarketingPipelineProject();
  const assignee = marketingTaskAssigneeFields();

  for (const p of prospects) {
    if (isOpenNurtureTaskForProspect(p.id)) {
      skipped += 1;
      continue;
    }
    createTask({
      partnerId: MARKETING_PIPELINE_PARTNER_ID,
      projectId: project.id,
      title: `Follow up — ${p.company?.name || p.contact?.name || 'prospect'}`,
      kind: 'follow_up',
      status: 'pending',
      stage: 'funding',
      priority: 'normal',
      visibility: 'admin',
      assignedTo: assignee.assignedTo,
      assigneeUserIds: assignee.assigneeUserIds,
      tags: [MARKETING_DESK_TAG, 'lead-engine-nurture', 'marketing-nurture'],
      labels: Array.from(new Set([...(assignee.labels ?? []), 'Desk · nurture'])),
      notes: 'Queued from Ruth room.',
      meta: {
        source: 'marketing_desk',
        marketingKind: 'nurture',
        prospectId: p.id,
        href: '/admin/marketing-desk?helper=board',
      },
    });
    created += 1;
  }
  return { created, skipped };
}
