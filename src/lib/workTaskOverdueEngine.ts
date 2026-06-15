/** Scan Work OS tasks for SLA breaches and emit platform events (Phase 13). */
import { listTasks } from '../data/tasksRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { loadJson, saveJson } from '../data/localJsonStore';

const DEDUP_KEY = 'finely.taskOverdueDedup.v1';

type DedupStore = { emitted: Record<string, string> };

function loadDedup(): DedupStore {
  return loadJson<DedupStore>(DEDUP_KEY, { emitted: {} }, 1);
}

function saveDedup(store: DedupStore) {
  saveJson(DEDUP_KEY, store, 1);
}

export type TaskOverdueTickResult = {
  scanned: number;
  newlyOverdue: number;
  taskIds: string[];
};

export function processTaskOverdueTick(opts?: { dryRun?: boolean }): TaskOverdueTickResult {
  const dryRun = opts?.dryRun ?? false;
  const now = Date.now();
  const dedup = loadDedup();
  const open = listTasks().filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const overdue = open.filter((t) => t.dueAt && Date.parse(t.dueAt) < now);
  const taskIds: string[] = [];

  for (const t of overdue) {
    const last = dedup.emitted[t.id];
    const dueDay = t.dueAt!.slice(0, 10);
    if (last === dueDay) continue;
    taskIds.push(t.id);
    if (!dryRun) {
      emitPlatformEvent({
        type: 'task.overdue',
        tenantId: FINELY_TENANT_ID,
        partnerId: t.partnerId,
        entityType: 'task',
        entityId: t.id,
        payload: {
          title: t.title,
          dueAt: t.dueAt,
          projectId: t.projectId,
          kind: t.kind,
        },
      });
      dedup.emitted[t.id] = dueDay;
    }
  }

  if (!dryRun && taskIds.length) {
    const keys = Object.keys(dedup.emitted);
    if (keys.length > 500) {
      for (const k of keys.slice(0, keys.length - 400)) delete dedup.emitted[k];
    }
    saveDedup(dedup);
  }

  return { scanned: open.length, newlyOverdue: taskIds.length, taskIds };
}
