import type { Project, ProjectStage, ProjectStatus, WorkScope } from '../domain/projects';
import { nowIso } from '../domain/projects';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';
import { createTask, listTasksByPartner } from './tasksRepo';
import type { TaskStage } from '../domain/tasks';
import { createNotification } from './notificationsRepo';
import { applyPlaybooksToProject } from '../features/work/playbooks/applyPlaybooksToProject';
import { getCoreRestorationPlaybookIds } from '../features/work/playbooks/playbookSeed';

const KEY = 'finely.projects.v1';

type Store = {
  projects: Project[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { projects: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listProjects(): Project[] {
  return loadStore()
    .projects
    .map((p) => {
      const scope = (p as any).scope ?? 'personal';
      const tags = Array.isArray((p as any).tags) ? (p as any).tags : [];
      const labels = Array.isArray((p as any).labels) ? (p as any).labels : undefined;
      const notes = Array.isArray((p as any).notes) ? (p as any).notes : [];
      const riskFlags = Array.isArray((p as any).riskFlags) ? (p as any).riskFlags : undefined;
      const assigneeUserIds = Array.isArray((p as any).assigneeUserIds) ? (p as any).assigneeUserIds : undefined;
      const watcherUserIds = Array.isArray((p as any).watcherUserIds) ? (p as any).watcherUserIds : undefined;
      const linkedEntities = Array.isArray((p as any).linkedEntities) ? (p as any).linkedEntities : undefined;
      const visibility = (p as any).visibility as Project['visibility'] | undefined;
      return {
        ...p,
        scope,
        tags,
        labels,
        notes,
        riskFlags,
        assigneeUserIds,
        watcherUserIds,
        linkedEntities,
        visibility,
      };
    })
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listProjectsByPartner(partnerId: string): Project[] {
  return listProjects().filter((p) => p.partnerId === partnerId);
}

export function getProject(id: string): Project | null {
  return loadStore().projects.find((p) => p.id === id) ?? null;
}

export function upsertProject(project: Project): Project {
  const store = loadStore();
  const idx = store.projects.findIndex((p) => p.id === project.id);
  const next = {
    ...project,
    scope: (project as any).scope ?? 'personal',
    tags: Array.isArray((project as any).tags) ? (project as any).tags : [],
    labels: Array.isArray((project as any).labels) ? (project as any).labels : undefined,
    notes: Array.isArray((project as any).notes) ? (project as any).notes : [],
    riskFlags: Array.isArray((project as any).riskFlags) ? (project as any).riskFlags : undefined,
    assigneeUserIds: Array.isArray((project as any).assigneeUserIds) ? (project as any).assigneeUserIds : undefined,
    watcherUserIds: Array.isArray((project as any).watcherUserIds) ? (project as any).watcherUserIds : undefined,
    linkedEntities: Array.isArray((project as any).linkedEntities) ? (project as any).linkedEntities : undefined,
    updatedAt: nowIso(),
  };
  if (idx >= 0) store.projects[idx] = next;
  else store.projects.push(next);
  saveStore(store);
  return next;
}

export function createProject(args: {
  partnerId: string;
  title: string;
  scope?: WorkScope;
  status?: ProjectStatus;
  stage?: ProjectStage;
  tags?: string[];
  fundingGoal?: number;
  visibility?: 'partner' | 'admin' | 'hybrid';
  description?: string;
  priority?: Project['priority'];
  health?: Project['health'];
  targetCloseAt?: string;
}): Project {
  const now = nowIso();
  const visibility = args.visibility ?? 'hybrid';
  const p: Project = {
    id: newId('proj'),
    partnerId: args.partnerId,
    scope: args.scope ?? 'personal',
    title: args.title.trim() || 'Project',
    description: args.description?.trim() || undefined,
    status: args.status ?? 'active',
    stage: args.stage ?? 'intake',
    priority: args.priority,
    health: args.health,
    targetCloseAt: args.targetCloseAt,
    tags: (args.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 20),
    fundingGoal: args.fundingGoal,
    visibility,
    notes: [],
    createdAt: now,
    updatedAt: now,
  };
  const created = upsertProject(p);
  createNotification({
    partnerId: created.partnerId,
    audience: visibility === 'admin' ? 'admin' : 'both',
    kind: 'system',
    title: 'Project created',
    body: created.title,
    href: visibility === 'admin' ? '/admin/projects' : '/portal/projects',
    meta: { projectId: created.id, stage: created.stage, status: created.status, visibility },
  });
  return created;
}

export function setProjectStage(id: string, stage: ProjectStage): Project | null {
  const cur = getProject(id);
  if (!cur) return null;
  return upsertProject({ ...cur, stage });
}

export function setProjectStatus(id: string, status: ProjectStatus): Project | null {
  const cur = getProject(id);
  if (!cur) return null;
  return upsertProject({ ...cur, status });
}

export function addProjectNote(id: string, text: string): Project | null {
  const cur = getProject(id);
  if (!cur) return null;
  const noteText = (text || '').trim();
  if (!noteText) return cur;
  const note = { id: newId('pnote'), createdAt: nowIso(), text: noteText };
  return upsertProject({ ...cur, notes: [note, ...cur.notes].slice(0, 200) });
}

const DEFAULT_TASKS: Array<{
  title: string;
  kind: 'upload_document' | 'follow_up' | 'mail_letter' | 'review_results' | 'general';
  stage: TaskStage;
  notes?: string;
  dueDaysFromNow?: number;
}> = [
  {
    title: 'Upload credit report (HTML/PDF)',
    kind: 'upload_document',
    stage: 'reports',
    notes: 'Upload your latest reports so we can detect tradelines and dispute candidates.',
    dueDaysFromNow: 0,
  },
  {
    title: 'Upload ID + proof of address',
    kind: 'upload_document',
    stage: 'evidence',
    notes: 'Documents Vault: ID, utility bill/lease. Needed for many disputes.',
    dueDaysFromNow: 1,
  },
  {
    title: 'Collect bureau mail responses (when they arrive)',
    kind: 'upload_document',
    stage: 'evidence',
    notes: 'Upload responses the same day and attach to the relevant dispute/case.',
    dueDaysFromNow: 7,
  },
  {
    title: 'Review dispute candidates + open Insights',
    kind: 'review_results',
    stage: 'disputes',
    notes: 'Use Insights to identify contradictions and evidence checklist.',
    dueDaysFromNow: 1,
  },
  {
    title: 'Generate letters + mail certified (if applicable)',
    kind: 'mail_letter',
    stage: 'disputes',
    notes: 'Ensure exhibits are attached and addresses are correct.',
    dueDaysFromNow: 2,
  },
  {
    title: 'Follow up on bureau reinvestigation window (30–45 days)',
    kind: 'follow_up',
    stage: 'disputes',
    notes: 'Check results and escalate if unresolved.',
    dueDaysFromNow: 35,
  },
];

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function ensureDefaultProjectForPartner(args: { partnerId: string; fundingGoal?: number; scope?: WorkScope }): Project {
  const scope: WorkScope = args.scope ?? 'personal';
  const existing =
    listProjectsByPartner(args.partnerId).find((p) => (p.scope ?? 'personal') === scope && p.status === 'active') ?? null;
  const project =
    existing ??
    createProject({
      partnerId: args.partnerId,
      scope,
      title: scope === 'business' ? 'DFY Business Project' : 'DFY Restoration Project',
      stage: 'intake',
      tags: ['dfy', 'baseline', scope],
      fundingGoal: args.fundingGoal,
    });

  const tasks = listTasksByPartner(args.partnerId);
  const hasProjectTasks = tasks.some((t) => t.projectId === project.id);
  if (!hasProjectTasks) {
    const playbookIds = getCoreRestorationPlaybookIds(scope);
    if (playbookIds.length) {
      applyPlaybooksToProject({
        partnerId: args.partnerId,
        projectId: project.id,
        scope,
        playbookIds,
      });
    } else {
      for (const spec of DEFAULT_TASKS) {
        createTask({
          partnerId: args.partnerId,
          scope,
          projectId: project.id,
          title: spec.title,
          kind: spec.kind,
          stage: spec.stage,
          priority: spec.kind === 'mail_letter' ? 'high' : 'normal',
          status: 'pending',
          dueAt: spec.dueDaysFromNow != null ? addDaysIso(spec.dueDaysFromNow) : undefined,
          notes: spec.notes,
          assignedTo: 'partner',
        });
      }
    }
  }
  return project;
}

