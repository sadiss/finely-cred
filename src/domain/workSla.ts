import type { PricingCategory } from '../config/pricingCatalog';
import { categoryLabels } from '../config/pricingCatalog';
import type { TaskItem } from './tasks';
import type { Project } from './projects';

export type SlaProfile = {
  id: string;
  label: string;
  /** Hours from task creation until first action expected */
  responseHours: number;
  /** Hours from due date before marked breach */
  overdueGraceHours: number;
};

export const SLA_PROFILES: Record<'DIY' | 'DFY' | 'HYBRID', SlaProfile> = {
  DIY: { id: 'diy', label: 'DIY self-serve', responseHours: 72, overdueGraceHours: 24 },
  DFY: { id: 'dfy', label: 'DFY ops SLA', responseHours: 48, overdueGraceHours: 12 },
  HYBRID: { id: 'hybrid', label: 'Hybrid shared', responseHours: 48, overdueGraceHours: 18 },
};

export type SlaBreach = {
  taskId: string;
  taskTitle: string;
  partnerId: string;
  projectId?: string;
  kind: 'overdue' | 'response';
  hoursLate: number;
  profile: SlaProfile;
};

export function deliveryFromProject(project: Project): keyof typeof SLA_PROFILES {
  const tags = (project.tags ?? []).map((t) => t.toLowerCase());
  if (tags.includes('dfy')) return 'DFY';
  if (tags.includes('hybrid')) return 'HYBRID';
  if (tags.includes('diy')) return 'DIY';
  return 'DFY';
}

export function evaluateTaskSla(task: TaskItem, profile: SlaProfile): SlaBreach | null {
  if (task.status === 'completed' || task.status === 'cancelled') return null;
  const now = Date.now();

  if (task.dueAt) {
    const due = Date.parse(task.dueAt);
    const graceMs = profile.overdueGraceHours * 3600000;
    if (Number.isFinite(due) && now > due + graceMs) {
      return {
        taskId: task.id,
        taskTitle: task.title,
        partnerId: task.partnerId,
        projectId: task.projectId,
        kind: 'overdue',
        hoursLate: Math.round((now - due - graceMs) / 3600000),
        profile,
      };
    }
  }

  const created = Date.parse(task.createdAt);
  const responseMs = profile.responseHours * 3600000;
  if (task.status === 'pending' && Number.isFinite(created) && now - created > responseMs) {
    return {
      taskId: task.id,
      taskTitle: task.title,
      partnerId: task.partnerId,
      projectId: task.projectId,
      kind: 'response',
      hoursLate: Math.round((now - created - responseMs) / 3600000),
      profile,
    };
  }

  return null;
}

export function evaluateProjectTasksSla(tasks: TaskItem[], project: Project): SlaBreach[] {
  const profile = SLA_PROFILES[deliveryFromProject(project)];
  return tasks.map((t) => evaluateTaskSla(t, profile)).filter(Boolean) as SlaBreach[];
}

export function serviceLaneForCategory(category: PricingCategory): { label: string; className: string } {
  switch (category) {
    case 'personal_credit':
      return { label: 'Restore', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
    case 'business_credit':
      return { label: 'Business', className: 'border-violet-200 bg-violet-50 text-violet-800' };
    case 'debt_legal':
      return { label: 'Debt', className: 'border-blue-200 bg-blue-50 text-blue-800' };
    case 'wealth_builder':
      return { label: 'Wealth', className: 'border-amber-200 bg-amber-50 text-amber-800' };
    case 'privacy_id':
      return { label: 'Privacy', className: 'border-cyan-200 bg-cyan-50 text-cyan-800' };
    case 'bundle':
      return { label: 'Bundle', className: 'border-rose-200 bg-rose-50 text-rose-800' };
    case 'tradeline_promo':
      return { label: 'Tradeline', className: 'border-lime-200 bg-lime-50 text-lime-900' };
    default:
      return { label: 'Service', className: 'border-slate-200 bg-slate-50 text-slate-700' };
  }
}

export function serviceLaneFromProjectTags(tags: string[] = []): { label: string; className: string } {
  for (const tag of tags) {
    if (tag in categoryLabels) return serviceLaneForCategory(tag as PricingCategory);
  }
  return inferServiceLaneFromTags(tags) ?? { label: 'Service', className: 'border-slate-200 bg-slate-50 text-slate-700' };
}

export function inferServiceLaneFromTags(tags: string[] = []): { label: string; className: string } | null {
  const t = tags.map((x) => x.toLowerCase());
  if (t.some((x) => x.includes('business') || x.includes('business_credit'))) return serviceLaneForCategory('business_credit');
  if (t.some((x) => x.includes('debt'))) return serviceLaneForCategory('debt_legal');
  if (t.some((x) => x.includes('bundle'))) return serviceLaneForCategory('bundle');
  if (t.some((x) => x.includes('tradeline'))) return serviceLaneForCategory('tradeline_promo');
  if (t.some((x) => x.includes('personal') || x.includes('restore'))) return serviceLaneForCategory('personal_credit');
  return null;
}
