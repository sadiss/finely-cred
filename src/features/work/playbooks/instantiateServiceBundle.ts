import { getPackageById } from '../../../config/pricingCatalog';
import type { Project } from '../../../domain/projects';
import type { TaskItem } from '../../../domain/tasks';
import { createProject, getProject } from '../../../data/projectsRepo';
import { createTask } from '../../../data/tasksRepo';
import { getServiceBundleByPackageId, getPlaybookById } from './servicePlaybookBundles';

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function instantiateServiceBundle(args: {
  partnerId: string;
  packageId: string;
  projectId?: string;
  startAt?: string;
}): { project: Project; tasks: TaskItem[]; bundleId: string } | null {
  const pkg = getPackageById(args.packageId);
  const bundle = getServiceBundleByPackageId(args.packageId);
  if (!pkg || !bundle) return null;

  const existingProject = args.projectId ? getProject(args.projectId) : null;

  const createdProject =
    existingProject ??
    createProject({
      partnerId: args.partnerId,
      scope: bundle.scope,
      title: bundle.projectTitleTemplate,
      stage: bundle.projectStage ?? 'intake',
      tags: bundle.projectTags,
      visibility: bundle.delivery === 'DFY' ? 'hybrid' : 'partner',
      description: pkg.description,
    });

  if (!createdProject) return null;

  const tasks: TaskItem[] = [];
  for (const playbookId of bundle.playbookIds) {
    const pb = getPlaybookById(playbookId);
    if (!pb) continue;
    const task = createTask({
      partnerId: args.partnerId,
      scope: bundle.scope,
      projectId: createdProject.id,
      title: pb.title,
      kind: pb.kind,
      stage: pb.stage,
      priority: pb.priority ?? 'normal',
      status: 'pending',
      dueAt: pb.dueDaysOffset != null ? addDaysIso(pb.dueDaysOffset) : undefined,
      notes: pb.partnerInstructions ?? pb.description,
      assignedTo: pb.assignedTo ?? 'partner',
      tags: [...(pb.tags ?? []), `playbook:${pb.id}`, `package:${pkg.id}`],
      visibility: pb.visibility,
      checklist: pb.checklist?.map((text, i) => ({ id: `chk_${i}`, text, done: false })),
    });
    tasks.push(task);
  }

  return { project: createdProject, tasks, bundleId: bundle.id };
}
