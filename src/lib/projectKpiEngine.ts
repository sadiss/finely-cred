import type { Project } from '../domain/projects';
import type { TaskItem } from '../domain/tasks';
import type { ProjectKpi, ProjectOutcome } from '../domain/workResults';
import { evaluateProjectTasksSla } from '../domain/workSla';
import { upsertProject } from '../data/projectsRepo';

export function computeProjectKpis(project: Project, tasks: TaskItem[]): ProjectKpi {
  const open = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const done = tasks.filter((t) => t.status === 'completed');
  const outcomes = project.outcomes ?? [];
  const achieved = outcomes.filter((o) => o.status === 'achieved').length;
  const slaBreaches = evaluateProjectTasksSla(tasks, project).length;
  let daysRemaining: number | undefined;
  if (project.targetCloseAt) {
    daysRemaining = Math.ceil((Date.parse(project.targetCloseAt) - Date.now()) / 86400000);
  }
  return {
    tasksTotal: tasks.length,
    tasksCompleted: done.length,
    outcomesAchieved: achieved,
    outcomesTotal: outcomes.length,
    slaBreaches,
    daysRemaining,
  };
}

export function refreshProjectHealth(project: Project, kpis: ProjectKpi): Project['health'] {
  if (kpis.slaBreaches > 0 || (kpis.daysRemaining != null && kpis.daysRemaining < 0)) return 'red';
  if (kpis.outcomesTotal > 0 && kpis.outcomesAchieved / kpis.outcomesTotal >= 0.5) return 'green';
  if (openRatio(kpis) > 0.7 && kpis.slaBreaches === 0) return 'amber';
  return project.health ?? 'green';
}

function openRatio(kpis: ProjectKpi) {
  if (kpis.tasksTotal === 0) return 0;
  return (kpis.tasksTotal - kpis.tasksCompleted) / kpis.tasksTotal;
}

export function syncProjectKpis(project: Project, tasks: TaskItem[]): Project {
  const kpis = computeProjectKpis(project, tasks);
  const health = refreshProjectHealth(project, kpis);
  const updated = { ...project, kpis, health, updatedAt: new Date().toISOString() };
  upsertProject(updated);
  return updated;
}

export function defaultOutcomesForProject(project: Project): ProjectOutcome[] {
  if (project.outcomes?.length) return project.outcomes;
  const scope = project.scope ?? 'personal';
  if (scope === 'business') {
    return [
      {
        id: 'out_funding',
        label: 'Funding readiness',
        metricType: 'funding_amount',
        targetValue: project.fundingGoal,
        status: 'not_started',
      },
    ];
  }
  return [
    {
      id: 'out_fico',
      label: 'Reach target FICO',
      metricType: 'fico',
      targetValue: 700,
      status: 'not_started',
    },
    {
      id: 'out_deletions',
      label: 'Negative items removed',
      metricType: 'deletions',
      targetValue: 3,
      status: 'not_started',
    },
  ];
}
