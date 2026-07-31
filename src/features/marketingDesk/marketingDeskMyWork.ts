/**
 * Today's to-dos for Marketing Desk — Marketing Pipeline + marketing tags.
 * Filtered to Desk "Work goes to" assignee when set (label / userId).
 */
import type { TaskItem } from '../../domain/tasks';
import { listTasks } from '../../data/tasksRepo';
import { marketingDeskAssigneePool } from './marketingDeskAssignee';
import { ensureMarketingPipelineProject, MARKETING_DESK_TAG, MARKETING_PIPELINE_PARTNER_ID } from './marketingDeskProjects';
import { marketingTaskDeepLink } from './marketingDeskTasks';

export function isMarketingDeskTask(t: TaskItem): boolean {
  if (t.status === 'completed' || t.status === 'cancelled') return false;
  const tags = t.tags ?? [];
  const projectId = ensureMarketingPipelineProject().id;
  return (
    t.projectId === projectId ||
    t.partnerId === MARKETING_PIPELINE_PARTNER_ID ||
    tags.includes(MARKETING_DESK_TAG) ||
    tags.includes('lead-engine-nurture') ||
    tags.includes('lead-engine') ||
    tags.includes('marketing-handoff')
  );
}

/** Prefer tasks labeled for Desk seat pool (Work goes to + alternate); fall back to all marketing tasks. */
export function matchesMarketingAssignee(t: TaskItem): boolean {
  const seats = marketingDeskAssigneePool();
  const labels = (t.labels ?? []).map((x) => x.toLowerCase());
  const userIds = t.assigneeUserIds ?? [];

  const genericOnly =
    seats.length === 1 &&
    (!seats[0].label || seats[0].label.toLowerCase() === 'marketing') &&
    !seats[0].userId;
  if (genericOnly) return true;

  for (const seat of seats) {
    const label = (seat.label || '').trim().toLowerCase();
    if (seat.userId && userIds.includes(seat.userId)) return true;
    if (label && labels.some((l) => l.includes(`assignee: ${label}`) || l.includes(label))) return true;
  }

  // Unassigned marketing tasks still surface so nothing is lost
  const hasAssigneeLabel = labels.some((l) => l.startsWith('assignee:'));
  const hasUserIds = userIds.length > 0;
  return !hasAssigneeLabel && !hasUserIds;
}

/** Lower = surfaces first in Desk My work (≤5). */
function marketingTaskUrgency(t: TaskItem): number {
  const tags = t.tags ?? [];
  const meta = (t.meta ?? {}) as {
    findFailed?: boolean;
    hotReply?: boolean;
    convertHandoff?: boolean;
    bookedHandoff?: boolean;
  };
  if (meta.findFailed || tags.includes('marketing-find-failed')) return 0;
  if (meta.hotReply || tags.includes('marketing-hot-reply')) return 1;
  if (meta.convertHandoff || tags.includes('marketing-convert')) return 2;
  if (meta.bookedHandoff || tags.includes('marketing-handoff')) return 3;
  if (t.priority === 'urgent') return 4;
  if (t.priority === 'high') return 5;
  return 6;
}

export function listMarketingDeskOpenTasks(limit = 5): TaskItem[] {
  const all = listTasks()
    .filter(isMarketingDeskTask)
    .sort((a, b) => {
      const u = marketingTaskUrgency(a) - marketingTaskUrgency(b);
      if (u !== 0) return u;
      return (a.dueAt || a.createdAt).localeCompare(b.dueAt || b.createdAt);
    });

  const forAssignee = all.filter(matchesMarketingAssignee);
  const pool = forAssignee.length > 0 ? forAssignee : all;
  return pool.slice(0, Math.min(5, limit));
}

export function countMarketingDeskOpenTasks(): number {
  return listTasks().filter((t) => isMarketingDeskTask(t) && matchesMarketingAssignee(t)).length;
}

export function deepLinkForMarketingTask(t: TaskItem): string {
  return marketingTaskDeepLink(t);
}

export const MARKETING_MY_TASKS_HREF = '/admin/my-tasks';
export const MARKETING_WORKLOAD_HREF = '/admin/workload';
