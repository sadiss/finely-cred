import type { WorkScope } from '../../../domain/projects';
import type { TaskItem } from '../../../domain/tasks';
import { createTask } from '../../../data/tasksRepo';
import { getPlaybookById } from '../playbooks/servicePlaybookBundles';

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function applyPlaybooksToProject(args: {
  partnerId: string;
  projectId: string;
  scope: WorkScope;
  playbookIds: string[];
}): TaskItem[] {
  const created: TaskItem[] = [];
  for (const playbookId of args.playbookIds) {
    const pb = getPlaybookById(playbookId);
    if (!pb) continue;
    const task = createTask({
      partnerId: args.partnerId,
      scope: args.scope,
      projectId: args.projectId,
      title: pb.title,
      kind: pb.kind,
      stage: pb.stage,
      priority: pb.priority ?? 'normal',
      status: 'pending',
      dueAt: pb.dueDaysOffset != null ? addDaysIso(pb.dueDaysOffset) : undefined,
      notes: pb.partnerInstructions ?? pb.description,
      assignedTo: pb.assignedTo ?? 'partner',
      tags: [...(pb.tags ?? []), `playbook:${pb.id}`],
      visibility: pb.visibility,
      checklist: pb.checklist?.map((text, i) => ({ id: `chk_${i}`, text, done: false })),
    });
    created.push(task);
  }
  return created;
}
