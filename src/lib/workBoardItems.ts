import type { Project } from '../domain/projects';
import type { TaskItem } from '../domain/tasks';
import type { WorkBoardItem } from '../components/workboard/types';

/** Map TaskItem rows to WorkBoardItem for kanban / list / calendar boards. */
export function tasksToBoardItems(
  tasks: TaskItem[],
  opts?: {
    projectTitleById?: Map<string, string>;
    partnerLabelById?: Map<string, string>;
    stageLabelById?: Map<string, string>;
    categoryFilter?: string | 'all';
  },
): WorkBoardItem[] {
  const { projectTitleById, partnerLabelById, stageLabelById, categoryFilter = 'all' } = opts ?? {};
  return tasks
    .filter((t) => (categoryFilter === 'all' ? true : String(t.stage ?? 'intake') === categoryFilter))
    .map((t) => {
      const proj = t.projectId ? projectTitleById?.get(t.projectId) : null;
      const partner = partnerLabelById?.get(t.partnerId);
      const cat = String(t.stage ?? 'intake');
      const workflowLabel = stageLabelById?.get(cat) ?? cat;
      const subtitleParts = [
        partner ? `Partner: ${partner}` : null,
        proj ? `Project: ${proj}` : null,
        workflowLabel,
        t.kind.replace(/_/g, ' '),
      ].filter(Boolean);
      return {
        id: t.id,
        title: t.title,
        subtitle: subtitleParts.join(' • '),
        stage: String(t.status ?? 'pending'),
        status: t.status,
        dueAt: t.dueAt,
        updatedAt: t.updatedAt,
        tags: t.tags,
        priority: t.priority,
        kind: t.kind,
        workflowStageLabel: workflowLabel,
        projectTitle: proj ?? undefined,
        assigneeLabel: partner,
      };
    });
}

/** Map Project rows to WorkBoardItem for list / calendar boards. */
export function projectsToBoardItems(
  projects: Project[],
  opts?: {
    partnerLabelById?: Map<string, string>;
    stageLabelById?: Map<string, string>;
    statusFilter?: string | 'all';
  },
): WorkBoardItem[] {
  const { partnerLabelById, stageLabelById, statusFilter = 'all' } = opts ?? {};
  return projects
    .filter((p) => (statusFilter === 'all' ? true : p.status === statusFilter))
    .map((p) => {
      const partner = partnerLabelById?.get(p.partnerId);
      const stageLabel = stageLabelById?.get(String(p.stage ?? 'intake')) ?? String(p.stage ?? 'intake');
      const subtitleParts = [
        partner ? `Partner: ${partner}` : null,
        `Phase: ${stageLabel}`,
        p.scope ? `${p.scope} credit` : null,
        p.priority ? `${p.priority} priority` : null,
      ].filter(Boolean);
      return {
        id: p.id,
        title: p.title,
        subtitle: subtitleParts.join(' • '),
        stage: p.status,
        status: p.status,
        dueAt: p.targetCloseAt,
        updatedAt: p.updatedAt,
        tags: p.tags,
        priority: p.priority,
        health: p.health,
        workflowStageLabel: stageLabel,
        assigneeLabel: partner,
      };
    });
}
