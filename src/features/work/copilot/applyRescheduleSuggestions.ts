import { listTasks, upsertTask } from '../../../data/tasksRepo';
import type { WorkRescheduleSuggestion } from '../../ai/schemas/workCopilot';

export function applyRescheduleSuggestions(suggestions: WorkRescheduleSuggestion[]): number {
  const byId = new Map(listTasks().map((t) => [t.id, t]));
  let applied = 0;
  for (const s of suggestions) {
    const task = byId.get(s.taskId);
    if (!task) continue;
    upsertTask({ ...task, dueAt: s.suggestedDueAt });
    applied++;
  }
  return applied;
}
