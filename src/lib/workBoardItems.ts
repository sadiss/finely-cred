import type { TaskItem } from '../domain/tasks';
import type { WorkBoardItem } from '../components/workboard/types';

/** Map TaskItem rows to WorkBoardItem for kanban / list / calendar boards. */
export function tasksToBoardItems(
  tasks: TaskItem[],
  opts?: {
    projectTitleById?: Map<string, string>;
    stageLabelById?: Map<string, string>;
    categoryFilter?: string | 'all';
  },
): WorkBoardItem[] {
  const { projectTitleById, stageLabelById, categoryFilter = 'all' } = opts ?? {};
  return tasks
    .filter((t) => (categoryFilter === 'all' ? true : String(t.stage ?? 'intake') === categoryFilter))
    .map((t) => {
      const proj = t.projectId ? projectTitleById?.get(t.projectId) : null;
      const cat = String(t.stage ?? 'intake');
      const workflowLabel = stageLabelById?.get(cat) ?? cat;
      return {
        id: t.id,
        title: t.title,
        subtitle: [proj ? `Project: ${proj}` : null, workflowLabel, t.kind.replace(/_/g, ' ')].filter(Boolean).join(' • '),
        stage: String(t.status ?? 'pending'),
        status: t.status,
        dueAt: t.dueAt,
        updatedAt: t.updatedAt,
        tags: t.tags,
        priority: t.priority,
        kind: t.kind,
        workflowStageLabel: workflowLabel,
        projectTitle: proj ?? undefined,
      };
    });
}
