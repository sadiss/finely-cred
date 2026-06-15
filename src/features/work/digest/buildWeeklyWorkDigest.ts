import type { Project } from '../../../domain/projects';
import type { TaskItem } from '../../../domain/tasks';

export type WeeklyDigestItem = {
  id: string;
  title: string;
  subtitle: string;
  href?: string;
  kind: 'overdue' | 'due_soon' | 'sla' | 'milestone' | 'idle';
};

export type WeeklyWorkDigest = {
  weekLabel: string;
  summary: string;
  items: WeeklyDigestItem[];
  stats: { openTasks: number; overdue: number; dueThisWeek: number; activeProjects: number };
};

const MS_WEEK = 7 * 86400000;

function weekBounds(now = Date.now()) {
  const d = new Date(now);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start: start.getTime(), end: end.getTime(), label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
}

export function buildWeeklyWorkDigest(args: {
  projects: Project[];
  tasks: TaskItem[];
  slaBreaches?: Array<{ projectId?: string; taskTitle?: string }>;
}): WeeklyWorkDigest {
  const { start, end, label } = weekBounds();
  const weekLabel = `Week of ${label}`;

  const scopedTasks = args.tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const overdue = scopedTasks.filter((t) => t.dueAt && Date.parse(t.dueAt) < Date.now());
  const dueThisWeek = scopedTasks.filter((t) => {
    if (!t.dueAt) return false;
    const ts = Date.parse(t.dueAt);
    return ts >= start && ts < end;
  });
  const activeProjects = args.projects.filter((p) => p.status === 'active');

  const items: WeeklyDigestItem[] = [];

  for (const t of overdue.slice(0, 8)) {
    items.push({
      id: `od_${t.id}`,
      kind: 'overdue',
      title: t.title,
      subtitle: t.dueAt ? `Due ${new Date(t.dueAt).toLocaleDateString()}` : 'Overdue',
      href: t.projectId ? `/admin/projects/${t.projectId}` : undefined,
    });
  }

  for (const t of dueThisWeek.slice(0, 8)) {
    if (items.some((i) => i.id === `od_${t.id}`)) continue;
    items.push({
      id: `due_${t.id}`,
      kind: 'due_soon',
      title: t.title,
      subtitle: t.dueAt ? `Due ${new Date(t.dueAt).toLocaleDateString()}` : 'This week',
      href: t.projectId ? `/admin/projects/${t.projectId}` : undefined,
    });
  }

  for (const b of args.slaBreaches ?? []) {
    items.push({
      id: `sla_${b.projectId}_${b.taskTitle}`,
      kind: 'sla',
      title: b.taskTitle ?? 'SLA breach',
      subtitle: 'Response window exceeded',
      href: b.projectId ? `/admin/projects/${b.projectId}` : '/admin/workflow',
    });
  }

  for (const p of activeProjects.filter((pr) => (pr.health === 'red' || pr.health === 'amber')).slice(0, 5)) {
    items.push({
      id: `idle_${p.id}`,
      kind: 'idle',
      title: p.title,
      subtitle: `Project health: ${p.health ?? 'amber'}`,
      href: `/admin/projects/${p.id}`,
    });
  }

  const summary =
    overdue.length === 0 && dueThisWeek.length === 0
      ? `${activeProjects.length} active projects — on track this week.`
      : `${overdue.length} overdue · ${dueThisWeek.length} due this week · ${activeProjects.length} active projects`;

  return {
    weekLabel,
    summary,
    items: items.slice(0, 12),
    stats: {
      openTasks: scopedTasks.length,
      overdue: overdue.length,
      dueThisWeek: dueThisWeek.length,
      activeProjects: activeProjects.length,
    },
  };
}
