import type { TaskItem } from '../domain/tasks';
import { listTasks, listTasksByPartner, setTaskStatus, upsertTask } from '../data/tasksRepo';
import { getProject } from '../data/projectsRepo';
import { syncProjectKpis } from './projectKpiEngine';
import { listEvidenceByPartner } from '../data/evidenceRepo';
import { listLettersByPartner } from '../data/lettersRepo';
import { checkMailLetterTaskEvidenceGate } from './evidenceGates';
import { emitPlatformEvent } from '../domain/platformEvents';

export function needsResultToComplete(task: TaskItem): boolean {
  return Boolean(task.successCriteria?.trim()) && !task.actualResult?.trim();
}

export type CompleteTaskArgs = {
  taskId: string;
  actualResult: string;
  evidenceNote?: string;
  resultEvidenceIds?: string[];
};

export type CompleteTaskResult =
  | { ok: true; task: TaskItem }
  | { ok: false; error: string };

/** Complete a task with required result evidence (Phase 13). */
export function completeTaskWithResult(args: CompleteTaskArgs): CompleteTaskResult {
  const task = listTasks().find((t) => t.id === args.taskId);
  if (!task) return { ok: false, error: 'Task not found.' };

  const result = args.actualResult.trim();
  if (task.successCriteria?.trim() && !result) {
    return { ok: false, error: 'Describe the actual result before completing this task.' };
  }

  const letter = task.relatedLetterId
    ? listLettersByPartner(task.partnerId).find((l) => l.id === task.relatedLetterId)
    : null;
  const evidenceGate = checkMailLetterTaskEvidenceGate({
    task,
    letter,
    evidence: listEvidenceByPartner(task.partnerId),
  });
  if (!evidenceGate.ok) {
    return { ok: false, error: evidenceGate.message };
  }

  const evidenceNote = args.evidenceNote?.trim();
  const notes = evidenceNote
    ? [task.notes, `Completion evidence: ${evidenceNote}`].filter(Boolean).join('\n\n')
    : task.notes;

  const updated = upsertTask({
    ...task,
    actualResult: result || task.actualResult,
    resultEvidenceIds: args.resultEvidenceIds?.length ? args.resultEvidenceIds : task.resultEvidenceIds,
    notes,
    lastTouchedAt: new Date().toISOString(),
  });

  const completed = setTaskStatus(updated.id, 'completed');
  if (!completed) {
    return { ok: false, error: 'Could not mark task completed — save result and try again.' };
  }

  if (completed.projectId) {
    const project = getProject(completed.projectId);
    if (project) {
      syncProjectKpis(project, listTasksByPartner(completed.partnerId).filter((t) => t.projectId === completed.projectId));
    }
  }

  emitPlatformEvent({
    type: 'task.completed',
    tenantId: 'finely_cred',
    partnerId: completed.partnerId,
    entityType: 'task',
    entityId: completed.id,
    payload: {
      title: completed.title,
      actualResult: completed.actualResult,
      kind: completed.kind,
    },
  });

  return { ok: true, task: completed };
}
