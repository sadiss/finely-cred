import { createTask } from '../../../data/tasksRepo';
import type { TaskItem } from '../../../domain/tasks';
import { buildRecurringTaskClone, nextDueFromRecurrence, parseRecurrenceFromTags } from '../../../domain/taskRecurrence';

export function spawnNextRecurringTask(completedTask: TaskItem): TaskItem | null {
  const rule = parseRecurrenceFromTags(completedTask.tags);
  if (!rule) return null;
  const nextDue = nextDueFromRecurrence(completedTask.completedAt ?? new Date().toISOString(), rule);
  return createTask(buildRecurringTaskClone(completedTask, nextDue));
}
