import type { TaskPlaybook } from '../../../domain/taskPlaybooks';
import { listTaskPlaybooks } from '../../../data/taskPlaybooksRepo';
import { applyPlaybooksToProject } from './applyPlaybooksToProject';
import type { TaskItem } from '../../../domain/tasks';
import { listTasks } from '../../../data/tasksRepo';

/** Resolve playbook id from completed task tags. */
export function playbookIdFromTask(task: TaskItem): string | null {
  for (const tag of task.tags ?? []) {
    if (tag.startsWith('playbook:')) return tag.slice('playbook:'.length);
  }
  return null;
}

function existingPlaybookIdsForProject(projectId: string, partnerId: string): Set<string> {
  const ids = new Set<string>();
  for (const t of listTasks()) {
    if (t.projectId !== projectId || t.partnerId !== partnerId) continue;
    const pid = playbookIdFromTask(t);
    if (pid) ids.add(pid);
  }
  return ids;
}

/** When a playbook-backed task completes, spawn dependent playbooks not yet on the project. */
export function spawnChainedPlaybooksOnComplete(completedTask: TaskItem): TaskItem[] {
  if (!completedTask.projectId || completedTask.status !== 'completed') return [];
  const completedPlaybookId = playbookIdFromTask(completedTask);
  if (!completedPlaybookId) return [];

  const dependents = listTaskPlaybooks().filter((pb) => pb.dependsOnPlaybookId === completedPlaybookId);
  if (!dependents.length) return [];

  const have = existingPlaybookIdsForProject(completedTask.projectId, completedTask.partnerId);
  const toSpawn = dependents.filter((pb) => !have.has(pb.id)).slice(0, 6);
  if (!toSpawn.length) return [];

  return applyPlaybooksToProject({
    partnerId: completedTask.partnerId,
    projectId: completedTask.projectId,
    scope: completedTask.scope ?? 'personal',
    playbookIds: toSpawn.map((pb) => pb.id),
  });
}

export function getNextPlaybooksForCompletedTask(completedPlaybookId: string): TaskPlaybook[] {
  return listTaskPlaybooks().filter((pb) => pb.dependsOnPlaybookId === completedPlaybookId);
}
