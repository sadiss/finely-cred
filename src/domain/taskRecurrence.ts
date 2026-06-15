import type { TaskItem } from './tasks';

export type RecurrenceRule = {
  intervalDays: number;
  label: string;
};

export function parseRecurrenceFromTags(tags: string[] = []): RecurrenceRule | null {
  for (const tag of tags) {
    if (!tag.startsWith('recurring:')) continue;
    const raw = tag.slice('recurring:'.length).toLowerCase();
    if (raw === 'monthly' || raw === '30d') return { intervalDays: 30, label: 'monthly' };
    if (raw === 'weekly' || raw === '7d') return { intervalDays: 7, label: 'weekly' };
    if (raw === 'biweekly' || raw === '14d') return { intervalDays: 14, label: 'biweekly' };
    const m = raw.match(/^(\d+)d$/);
    if (m) return { intervalDays: Math.max(1, Number(m[1])), label: `${m[1]}d` };
  }
  return null;
}

export function nextDueFromRecurrence(completedAt: string, rule: RecurrenceRule): string {
  const base = Date.parse(completedAt);
  const ms = base + rule.intervalDays * 86400000;
  return new Date(ms).toISOString();
}

export function buildRecurringTaskClone(task: TaskItem, nextDueAt: string): Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    partnerId: task.partnerId,
    scope: task.scope,
    projectId: task.projectId,
    title: task.title,
    kind: task.kind,
    priority: task.priority,
    stage: task.stage,
    status: 'pending',
    dueAt: nextDueAt,
    notes: task.notes,
    assignedTo: task.assignedTo,
    visibility: task.visibility,
    tags: task.tags,
    checklist: task.checklist?.map((c: { text: string }, i: number) => ({ id: `chk_${Date.now()}_${i}`, text: c.text, done: false })),
  };
}
