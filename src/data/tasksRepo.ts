import type { TaskItem, TaskStatus, TaskVisibility } from '../domain/tasks';
import type { Project } from '../domain/projects';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { createNotification } from './notificationsRepo';

const KEY = 'finely.tasks.v1';
const PROJECTS_KEY = 'finely.projects.v1';

type Store = { tasks: TaskItem[] };
type ProjectsStore = { projects: Project[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { tasks: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function loadProjectsStore(): ProjectsStore {
  return loadJson<ProjectsStore>(PROJECTS_KEY, { projects: [] }, 1);
}

function saveProjectsStore(store: ProjectsStore) {
  saveJson(PROJECTS_KEY, store, 1);
}

function ensureDefaultProjectIdForPartner(args: { partnerId: string; scope: 'personal' | 'business' }): string {
  const store = loadProjectsStore();
  const scope = args.scope ?? 'personal';
  const projects = store.projects.map((p) => ({ ...p, scope: (p as any).scope ?? 'personal' }));
  const existing =
    projects.find((p) => p.partnerId === args.partnerId && (p.scope ?? 'personal') === scope && p.status === 'active') ??
    null;
  if (existing?.id) return existing.id;

  const now = nowIso();
  const created: Project = {
    id: newId('proj'),
    partnerId: args.partnerId,
    scope,
    title: scope === 'business' ? 'DFY Business Project' : 'DFY Restoration Project',
    status: 'active',
    stage: 'intake',
    tags: ['dfy', 'baseline', scope, 'auto'],
    notes: [],
    createdAt: now,
    updatedAt: now,
  };

  store.projects.push(created);
  saveProjectsStore(store);

  // Best-effort: notify partner/admin that the project exists.
  try {
    createNotification({
      partnerId: created.partnerId,
      audience: 'both',
      kind: 'system',
      title: 'Project created',
      body: created.title,
      href: '/portal/projects',
      meta: { projectId: created.id, stage: created.stage, status: created.status },
    });
  } catch {
    // ignore
  }

  return created.id;
}

function visibilityFromLegacyAssignedTo(v: any): TaskVisibility | undefined {
  if (v === 'partner') return 'partner';
  if (v === 'admin') return 'admin';
  if (v === 'both') return 'hybrid';
  return undefined;
}

function normStrArray(x: any, limit = 200): string[] | undefined {
  if (!Array.isArray(x)) return undefined;
  const next = x.map((s) => String(s ?? '').trim()).filter(Boolean);
  return next.slice(0, limit);
}

function normEntityRefs(x: any) {
  if (!Array.isArray(x)) return undefined;
  const next = x
    .map((e) => {
      if (!e) return null;
      const kind = String((e as any).kind || '').trim();
      const id = String((e as any).id || '').trim();
      if (!kind || !id) return null;
      const label = String((e as any).label || '').trim() || undefined;
      return { kind, id, label };
    })
    .filter(Boolean);
  return (next as any[]).slice(0, 200);
}

function normAttachments(x: any) {
  if (!Array.isArray(x)) return undefined;
  const next = x
    .map((a) => {
      if (!a) return null;
      const evidenceId = String((a as any).evidenceId || '').trim() || undefined;
      const blobRef = String((a as any).blobRef || '').trim() || undefined;
      const filename = String((a as any).filename || '').trim() || undefined;
      const mimeType = String((a as any).mimeType || '').trim() || undefined;
      const note = String((a as any).note || '').trim() || undefined;
      const createdAt = String((a as any).createdAt || '').trim() || undefined;
      if (!evidenceId && !blobRef && !filename) return null;
      return { evidenceId, blobRef, filename, mimeType, note, createdAt };
    })
    .filter(Boolean);
  return (next as any[]).slice(0, 200);
}

export function listTasks(): TaskItem[] {
  const store = loadStore();
  let changed = false;
  const normalized = store.tasks.map((t) => {
    const scope = (t as any).scope ?? 'personal';
    const projectId =
      (t as any).projectId ??
      ensureDefaultProjectIdForPartner({ partnerId: t.partnerId, scope: scope === 'business' ? 'business' : 'personal' });
    const checklist = Array.isArray((t as any).checklist) ? (t as any).checklist : [];
    const statusHistory = Array.isArray((t as any).statusHistory) ? (t as any).statusHistory : [];
    const assigneeUserIds = Array.isArray((t as any).assigneeUserIds) ? ((t as any).assigneeUserIds as any) : undefined;
    const watcherUserIds = normStrArray((t as any).watcherUserIds, 100);
    const blockedByTaskIds = normStrArray((t as any).blockedByTaskIds, 200);
    const blockingTaskIds = normStrArray((t as any).blockingTaskIds, 200);
    const evidenceIds = normStrArray((t as any).evidenceIds, 200);
    const templateBaseIds = normStrArray((t as any).templateBaseIds, 200);
    const tags = normStrArray((t as any).tags, 50);
    const labels = normStrArray((t as any).labels, 50);
    const linkedEntities = normEntityRefs((t as any).linkedEntities);
    const attachments = normAttachments((t as any).attachments);
    const visibility: TaskVisibility | undefined =
      (t as any).visibility ?? visibilityFromLegacyAssignedTo((t as any).assignedTo);

    const next = {
      ...t,
      scope,
      projectId,
      assigneeUserIds,
      watcherUserIds,
      blockedByTaskIds,
      blockingTaskIds,
      evidenceIds,
      templateBaseIds,
      tags,
      labels,
      linkedEntities,
      attachments,
      visibility,
      checklist,
      statusHistory,
    };

    if (
      (t as any).projectId !== projectId ||
      (t as any).scope !== scope ||
      (t as any).assigneeUserIds !== assigneeUserIds ||
      (t as any).watcherUserIds !== watcherUserIds ||
      (t as any).blockedByTaskIds !== blockedByTaskIds ||
      (t as any).blockingTaskIds !== blockingTaskIds ||
      (t as any).evidenceIds !== evidenceIds ||
      (t as any).templateBaseIds !== templateBaseIds ||
      (t as any).tags !== tags ||
      (t as any).labels !== labels ||
      (t as any).linkedEntities !== linkedEntities ||
      (t as any).attachments !== attachments ||
      (t as any).visibility !== visibility ||
      (t as any).checklist !== checklist ||
      (t as any).statusHistory !== statusHistory
    ) {
      changed = true;
    }

    return next;
  });
  if (changed) {
    store.tasks = normalized as any;
    saveStore(store);
  }
  return normalized.sort((a, b) => (a.dueAt || a.createdAt).localeCompare(b.dueAt || b.createdAt));
}

export function listTasksByPartner(partnerId: string): TaskItem[] {
  return listTasks().filter((t) => t.partnerId === partnerId);
}

export function upsertTask(task: TaskItem): TaskItem {
  const store = loadStore();
  const idx = store.tasks.findIndex((x) => x.id === task.id);
  const next = {
    ...task,
    scope: (task as any).scope ?? 'personal',
    assigneeUserIds: Array.isArray((task as any).assigneeUserIds) ? ((task as any).assigneeUserIds as any) : undefined,
    watcherUserIds: normStrArray((task as any).watcherUserIds, 100),
    blockedByTaskIds: normStrArray((task as any).blockedByTaskIds, 200),
    blockingTaskIds: normStrArray((task as any).blockingTaskIds, 200),
    evidenceIds: normStrArray((task as any).evidenceIds, 200),
    templateBaseIds: normStrArray((task as any).templateBaseIds, 200),
    tags: normStrArray((task as any).tags, 50),
    labels: normStrArray((task as any).labels, 50),
    linkedEntities: normEntityRefs((task as any).linkedEntities),
    attachments: normAttachments((task as any).attachments),
    visibility:
      (task as any).visibility ?? visibilityFromLegacyAssignedTo((task as any).assignedTo),
    checklist: Array.isArray((task as any).checklist) ? ((task as any).checklist as any) : [],
    statusHistory: Array.isArray((task as any).statusHistory) ? ((task as any).statusHistory as any) : [],
    updatedAt: nowIso(),
  };
  if (idx >= 0) store.tasks[idx] = next;
  else store.tasks.push(next);
  saveStore(store);
  return next;
}

export function createTask(args: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>): TaskItem {
  const now = nowIso();
  const scope = (args as any).scope ?? 'personal';
  const projectId =
    (args as any).projectId ??
    ensureDefaultProjectIdForPartner({ partnerId: args.partnerId, scope: scope === 'business' ? 'business' : 'personal' });
  const created = upsertTask({
    id: newId('task'),
    createdAt: now,
    updatedAt: now,
    ...args,
    projectId,
    checklist: Array.isArray((args as any).checklist) ? ((args as any).checklist as any) : [],
    statusHistory: [{ at: now, from: (args as any).status ?? 'pending', to: (args as any).status ?? 'pending' }],
  });
  createNotification({
    partnerId: created.partnerId,
    audience: 'both',
    kind: 'task_created',
    title: created.title,
    body: created.notes,
    href: '/portal/tasks',
    meta: { taskId: created.id, kind: created.kind, status: created.status, dueAt: created.dueAt ?? null },
  });
  return created;
}

export function setTaskStatus(id: string, status: TaskStatus): TaskItem | null {
  const store = loadStore();
  const idx = store.tasks.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const prev = store.tasks[idx]!;
  const now = nowIso();
  const history = Array.isArray((prev as any).statusHistory) ? ((prev as any).statusHistory as any[]) : [];
  const next = {
    ...prev,
    status,
    statusHistory: [...history, { at: now, from: prev.status, to: status }],
    updatedAt: now,
  };
  store.tasks[idx] = next;
  saveStore(store);
  createNotification({
    partnerId: next.partnerId,
    audience: 'both',
    kind: 'task_status',
    title: `Task ${status.replace('_', ' ')}`,
    body: next.title,
    href: '/portal/tasks',
    meta: { taskId: next.id, kind: next.kind, status: next.status },
  });
  return next;
}

