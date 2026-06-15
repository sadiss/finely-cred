import type { Project } from '../domain/projects';
import type { TaskItem, TaskVisibility } from '../domain/tasks';

const INTERNAL_TAGS = new Set(['ops-only', 'internal', 'admin-only', 'staff']);

export function resolveTaskVisibility(task: TaskItem): TaskVisibility {
  if (task.visibility) return task.visibility;
  if (task.assignedTo === 'admin') return 'admin';
  if (task.assignedTo === 'partner') return 'partner';
  return 'hybrid';
}

export function taskHasInternalTag(task: TaskItem): boolean {
  return (task.tags ?? []).some((t) => INTERNAL_TAGS.has(String(t).toLowerCase()));
}

/** Partner portal: action items they should execute — not internal ops work. */
export function isTaskVisibleToPartner(task: TaskItem): boolean {
  const v = resolveTaskVisibility(task);
  if (v === 'admin') return false;
  if (taskHasInternalTag(task)) return false;
  return true;
}

/** Admin ops board: all tasks for scoped partners, including internal prep/QA. */
export function isTaskVisibleToAdmin(_task: TaskItem): boolean {
  return true;
}

export function isInternalOpsTask(task: TaskItem): boolean {
  return resolveTaskVisibility(task) === 'admin' || taskHasInternalTag(task);
}

export function isPartnerSharedTask(task: TaskItem): boolean {
  const v = resolveTaskVisibility(task);
  return v === 'hybrid' || v === 'partner';
}

export type ProjectVisibility = 'partner' | 'admin' | 'hybrid';

export function resolveProjectVisibility(project: Project): ProjectVisibility {
  const raw = (project as Project & { visibility?: ProjectVisibility }).visibility;
  if (raw) return raw;
  if ((project.tags ?? []).some((t) => INTERNAL_TAGS.has(String(t).toLowerCase()))) return 'admin';
  return 'hybrid';
}

export function isProjectVisibleToPartner(project: Project): boolean {
  const v = resolveProjectVisibility(project);
  return v !== 'admin';
}

export function isInternalOpsProject(project: Project): boolean {
  return resolveProjectVisibility(project) === 'admin';
}

export function listPartnerPortalTasks(tasks: TaskItem[]): TaskItem[] {
  return tasks.filter(isTaskVisibleToPartner);
}

export function listPartnerPortalProjects(projects: Project[]): Project[] {
  return projects.filter(isProjectVisibleToPartner);
}

export type AdminVisibilityFilter = 'all' | 'shared' | 'internal';

export function filterTasksForAdminView(tasks: TaskItem[], filter: AdminVisibilityFilter): TaskItem[] {
  if (filter === 'all') return tasks;
  if (filter === 'internal') return tasks.filter(isInternalOpsTask);
  return tasks.filter(isPartnerSharedTask);
}

export function filterProjectsForAdminView(projects: Project[], filter: AdminVisibilityFilter): Project[] {
  if (filter === 'all') return projects;
  if (filter === 'internal') return projects.filter(isInternalOpsProject);
  return projects.filter((p) => !isInternalOpsProject(p));
}

export const VISIBILITY_LABELS = {
  partner: 'Partner only',
  hybrid: 'Shared (partner + ops)',
  admin: 'Internal ops only',
} as const;
