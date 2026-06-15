import { listTasks } from '../../../data/tasksRepo';
import { listProjects } from '../../../data/projectsRepo';
import { evaluateTaskSla, SLA_PROFILES, deliveryFromProject, type SlaBreach } from '../../../domain/workSla';

export function listAllSlaBreaches(filterPartnerIds?: Set<string>): SlaBreach[] {
  const projects = listProjects();
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const breaches: SlaBreach[] = [];

  for (const task of listTasks()) {
    if (filterPartnerIds && !filterPartnerIds.has(task.partnerId)) continue;
    if (task.status === 'completed' || task.status === 'cancelled') continue;
    const project = task.projectId ? projectById.get(task.projectId) : null;
    const profile = project ? SLA_PROFILES[deliveryFromProject(project)] : SLA_PROFILES.DFY;
    const breach = evaluateTaskSla(task, profile);
    if (breach) breaches.push(breach);
  }

  return breaches.sort((a, b) => b.hoursLate - a.hoursLate);
}

export function countSlaBreaches(filterPartnerIds?: Set<string>): number {
  return listAllSlaBreaches(filterPartnerIds).length;
}
