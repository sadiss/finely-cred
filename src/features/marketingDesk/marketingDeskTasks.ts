/**
 * Book / Offer / Review / Nurture task helpers → Marketing Pipeline project.
 * All new tasks get projectId, meta.prospectId, and Desk "Work goes to" assignee.
 */
import type { TaskItem, TaskPriority } from '../../domain/tasks';
import { createTask, listTasks, upsertTask } from '../../data/tasksRepo';
import { getLaneCta, type LeadEngineLane } from '../leadIntel/leadEngineAutonomy';
import {
  ensureMarketingPipelineProject,
  MARKETING_DESK_TAG,
  MARKETING_PIPELINE_PARTNER_ID,
} from './marketingDeskProjects';
import { marketingTaskAssigneeFields } from './marketingDeskAssignee';

export type MarketingTaskKind = 'book' | 'offer' | 'review' | 'nurture' | 'handoff' | 'failed_send';

export type CreateMarketingTaskArgs = {
  kind: MarketingTaskKind;
  title: string;
  notes?: string;
  dueAt?: string;
  priority?: TaskPriority;
  prospectId?: string;
  leadId?: string;
  recordId?: string;
  lane?: LeadEngineLane | string;
  href?: string;
  tags?: string[];
  meta?: Record<string, unknown>;
  /** Growth agent that created/owns this task (e.g. social, appointment-setter). */
  growthAgentId?: string;
  /** When true (default), reuse open task with same kind + prospect/record/lead. */
  dedupe?: boolean;
};

function kindTags(kind: MarketingTaskKind): string[] {
  switch (kind) {
    case 'book':
      return ['marketing-book'];
    case 'offer':
      return ['marketing-offer'];
    case 'review':
      return ['marketing-review'];
    case 'nurture':
      return ['lead-engine-nurture', 'marketing-nurture'];
    case 'handoff':
      return ['marketing-handoff'];
    case 'failed_send':
      return ['marketing-failed-send'];
    default:
      return [];
  }
}

function isOpenTask(t: TaskItem): boolean {
  return t.status !== 'completed' && t.status !== 'cancelled';
}

/** Open Marketing Desk task matching kind + prospect/record/lead (dedupe-safe). */
export function findOpenMarketingTask(args: {
  kind: MarketingTaskKind;
  prospectId?: string;
  leadId?: string;
  recordId?: string;
  /** Prefer booked handoff vs convert handoff when kind is handoff. */
  handoffRole?: 'booked' | 'convert';
}): TaskItem | undefined {
  const tagsForKind = kindTags(args.kind);
  return listTasks().find((t) => {
    if (!isOpenTask(t)) return false;
    const tags = t.tags ?? [];
    const meta = (t.meta ?? {}) as {
      marketingKind?: string;
      prospectId?: string;
      leadId?: string;
      recordId?: string;
      source?: string;
      bookedHandoff?: boolean;
      convertHandoff?: boolean;
      findFailed?: boolean;
    };
    const kindMatch =
      meta.marketingKind === args.kind || tagsForKind.some((tag) => tags.includes(tag));
    if (!kindMatch) return false;

    if (args.kind === 'review') {
      return meta.source === 'marketing_desk' || tags.includes('marketing-review');
    }

    if (args.kind === 'handoff' && args.handoffRole === 'booked') {
      const isConvert = tags.includes('marketing-convert') || Boolean(meta.convertHandoff);
      if (isConvert || !meta.bookedHandoff) return false;
    }
    if (args.kind === 'handoff' && args.handoffRole === 'convert') {
      const isConvert = tags.includes('marketing-convert') || Boolean(meta.convertHandoff);
      if (!isConvert) return false;
    }

    if (args.kind === 'failed_send') {
      const isFindFailed = tags.includes('marketing-find-failed') || Boolean(meta.findFailed);
      if (isFindFailed) {
        // Global Fix setup to-do — only match when not scoping to a prospect/record/lead.
        return !args.prospectId && !args.leadId && !args.recordId;
      }
      // Other failed_send rows fall through to prospect/record matching.
    }

    if (args.prospectId && meta.prospectId === args.prospectId) return true;
    if (args.recordId && meta.recordId === args.recordId) return true;
    if (args.leadId && (meta.leadId === args.leadId || meta.prospectId === args.leadId)) return true;
    return false;
  });
}

export function createMarketingTask(args: CreateMarketingTaskArgs): TaskItem {
  if (args.dedupe !== false) {
    const existing = findOpenMarketingTask({
      kind: args.kind,
      prospectId: args.prospectId,
      leadId: args.leadId,
      recordId: args.recordId,
    });
    if (existing) return existing;
  }

  const project = ensureMarketingPipelineProject();
  const assignee = marketingTaskAssigneeFields();
  const tags = Array.from(
    new Set([MARKETING_DESK_TAG, ...kindTags(args.kind), ...(args.tags ?? [])].filter(Boolean)),
  );

  return createTask({
    partnerId: MARKETING_PIPELINE_PARTNER_ID,
    projectId: project.id,
    title: args.title.trim() || `Marketing · ${args.kind}`,
    kind: 'follow_up',
    status: 'pending',
    stage: 'funding',
    priority: args.priority ?? (args.kind === 'handoff' || args.kind === 'book' ? 'high' : 'normal'),
    dueAt: args.dueAt,
    visibility: 'admin',
    assignedTo: assignee.assignedTo,
    assigneeUserIds: assignee.assigneeUserIds,
    tags,
    labels: Array.from(new Set([...(assignee.labels ?? []), `Desk · ${args.kind}`])),
    notes: args.notes,
    meta: {
      source: 'marketing_desk',
      marketingKind: args.kind,
      prospectId: args.prospectId,
      leadId: args.leadId,
      recordId: args.recordId,
      lane: args.lane,
      href: args.href,
      growthAgentId: args.growthAgentId,
      ...(args.meta ?? {}),
    },
  });
}

export function createBookTask(args: {
  name: string;
  prospectId?: string;
  leadId?: string;
  recordId?: string;
  lane?: LeadEngineLane;
}): TaskItem {
  const cta = args.lane ? getLaneCta(args.lane) : { book: '/consultation' };
  return createMarketingTask({
    kind: 'book',
    title: `Book session — ${args.name}`,
    notes: `Open booking: ${cta.book}\nCRM: /admin/crm`,
    href: cta.book,
    prospectId: args.prospectId,
    leadId: args.leadId,
    recordId: args.recordId,
    lane: args.lane,
    dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  });
}

export function createOfferTask(args: {
  name: string;
  prospectId?: string;
  leadId?: string;
  recordId?: string;
  lane?: LeadEngineLane;
}): TaskItem {
  const cta = args.lane ? getLaneCta(args.lane) : { offer: '/pricing/business-credit' };
  return createMarketingTask({
    kind: 'offer',
    title: `Send offer — ${args.name}`,
    notes: `Offer pack: ${cta.offer}\nOne-sheets: /resources/business-credit-one-sheets`,
    href: cta.offer,
    prospectId: args.prospectId,
    leadId: args.leadId,
    recordId: args.recordId,
    lane: args.lane,
    dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  });
}

/** My work summary when Review queue has pending people after hunt / schedule. */
export function createReviewImportsTask(count: number): TaskItem | null {
  if (count <= 0) return null;
  const title = `Review ${count} new people`;
  const notes = 'Open Marketing Desk → Find → Review before save.';
  const open = findOpenMarketingTask({ kind: 'review' });
  if (open) {
    const prevCount = (open.meta as { reviewCount?: number } | undefined)?.reviewCount;
    if (open.title === title && prevCount === count) return open;
    return upsertTask({
      ...open,
      title,
      notes,
      dueAt: open.dueAt || new Date().toISOString(),
      priority: 'high',
      meta: {
        ...(open.meta ?? {}),
        reviewCount: count,
        source: 'marketing_desk',
        marketingKind: 'review',
      },
    });
  }
  return createMarketingTask({
    kind: 'review',
    title,
    notes,
    href: '/admin/marketing-desk?helper=find',
    dueAt: new Date().toISOString(),
    priority: 'high',
    meta: { reviewCount: count },
    dedupe: false,
  });
}

export function marketingTaskDeepLink(
  task: Pick<TaskItem, 'id' | 'projectId' | 'meta' | 'tags'>,
): string {
  // Prefer Desk/CRM deep links stored on create (Review → Find, Convert → CRM, etc.).
  const href = typeof task.meta?.href === 'string' ? task.meta.href.trim() : '';
  if (href.startsWith('/admin/')) return href;

  const tags = task.tags ?? [];
  const meta = (task.meta ?? {}) as {
    findFailed?: boolean;
    convertHandoff?: boolean;
    hotReply?: boolean;
    recordId?: string;
    reviewCount?: number;
  };
  if (meta.findFailed || tags.includes('marketing-find-failed')) {
    return '/admin/marketing-desk?helper=find';
  }
  if (meta.convertHandoff || tags.includes('marketing-convert')) {
    return meta.recordId ? `/admin/crm?record=${meta.recordId}` : '/admin/crm';
  }
  if (meta.hotReply || tags.includes('marketing-hot-reply')) {
    return '/admin/marketing-desk?helper=board';
  }
  if (meta.reviewCount != null || tags.includes('marketing-review')) {
    return '/admin/marketing-desk?helper=find#exceptions';
  }

  if (task.projectId) {
    return `/admin/projects/${task.projectId}?task=${task.id}&view=board`;
  }
  return `/admin/my-tasks?task=${task.id}`;
}
