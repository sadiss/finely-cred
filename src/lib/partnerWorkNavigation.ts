import type { TaskItem } from '../domain/tasks';

export function pickMostOverdueTask(tasks: TaskItem[]): TaskItem | null {
  const overdue = tasks.filter((t) => t.dueAt && Date.parse(t.dueAt) < Date.now());
  if (!overdue.length) return null;
  return overdue.slice().sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!))[0] ?? null;
}

export function partnerTaskDeepLink(task: TaskItem, workspaceBasePath = '/portal/projects'): string {
  if (task.projectId) return `${workspaceBasePath}/${task.projectId}?task=${task.id}`;
  return '/portal/my-tasks';
}
