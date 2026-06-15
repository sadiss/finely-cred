import React, { useMemo } from 'react';
import { ArrowRight, Calendar, CheckCircle2, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TaskItem } from '../../../domain/tasks';
import type { Project } from '../../../domain/projects';
import { TaskTimerChip } from '../components/TaskTimerChip';
import { FinelyOsPaginatedStack } from '../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_KPI_ACCENTS,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../os/finelyOsLightUi';

function fmtDue(iso?: string) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return { label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), overdue: d.getTime() < Date.now() };
  } catch {
    return null;
  }
}

function priorityWeight(p?: string) {
  if (p === 'urgent') return 4;
  if (p === 'high') return 3;
  if (p === 'normal') return 2;
  return 1;
}

export function WorkMyTasksPanel({
  tasks,
  projectById,
  workspaceBasePath,
  title = 'My task queue',
  onTasksChanged,
  compact,
}: {
  tasks: TaskItem[];
  projectById: Map<string, Project>;
  workspaceBasePath: string;
  title?: string;
  onTasksChanged?: () => void;
  /** Hide hero banner + KPI row when nested in FinelyUnifiedHubLayout */
  compact?: boolean;
}) {
  const navigate = useNavigate();

  const sorted = useMemo(() => {
    return tasks.slice().sort((a, b) => {
      const aDue = a.dueAt ? Date.parse(a.dueAt) : Infinity;
      const bDue = b.dueAt ? Date.parse(b.dueAt) : Infinity;
      const aOver = a.dueAt && aDue < Date.now() ? 1 : 0;
      const bOver = b.dueAt && bDue < Date.now() ? 1 : 0;
      if (bOver !== aOver) return bOver - aOver;
      const pw = priorityWeight(b.priority) - priorityWeight(a.priority);
      if (pw !== 0) return pw;
      return aDue - bDue;
    });
  }, [tasks]);

  const stats = useMemo(() => ({
    total: sorted.length,
    overdue: sorted.filter((t) => t.dueAt && Date.parse(t.dueAt) < Date.now()).length,
    dueWeek: sorted.filter((t) => {
      if (!t.dueAt) return false;
      const d = Date.parse(t.dueAt);
      return d >= Date.now() && d <= Date.now() + 7 * 86400000;
    }).length,
  }), [sorted]);

  return (
    <div className="space-y-4">
      {!compact ? (
        <>
          <div className={FINELY_OS_BANNER}>
            <ListChecks className="text-violet-300 shrink-0 mt-0.5" size={18} />
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>{title} — open work across all projects, sorted by urgency and due date.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: 'Open', value: stats.total, accent: 0 },
              { label: 'Overdue', value: stats.overdue, accent: 4, tone: 'text-rose-300' },
              { label: 'Due this week', value: stats.dueWeek, accent: 2, tone: 'text-amber-200' },
            ].map((m) => (
              <div key={m.label} className={`rounded-xl border p-4 ${FINELY_OS_KPI_ACCENTS[m.accent % FINELY_OS_KPI_ACCENTS.length]}`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{m.label}</div>
                <div className={`text-2xl font-bold mt-1 ${m.tone ?? FINELY_OS_ENTITY_VALUE}`}>{m.value}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {sorted.length === 0 ? (
        <div className={FINELY_OS_ENTITY_EMPTY}>
          <CheckCircle2 className="mx-auto mb-2 text-emerald-400" size={28} />
          All caught up — no open tasks in queue.
        </div>
      ) : (
        <FinelyOsPaginatedStack
          items={sorted}
          pageSize={15}
          emptyMessage="All caught up — no open tasks in queue."
          renderItem={(t, i) => {
            const proj = t.projectId ? projectById.get(t.projectId) : null;
            const due = fmtDue(t.dueAt);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (t.projectId) navigate(`${workspaceBasePath}/${t.projectId}?task=${t.id}&view=board`);
                  else navigate(workspaceBasePath);
                }}
                className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition-all hover:shadow-md ${finelyOsInlineListItem()} ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}
              >
                <div className="min-w-0">
                  <div className={`truncate ${FINELY_OS_ENTITY_VALUE}`}>{t.title}</div>
                  <div className={`text-xs mt-0.5 truncate ${FINELY_OS_ENTITY_BODY}`}>{proj?.title ?? 'No project'} · {t.kind.replace(/_/g, ' ')}</div>
                  {t.priority && t.priority !== 'normal' ? (
                    <span className={`mt-1 inline-flex ${finelyOsStatusChip('warn')}`}>{t.priority}</span>
                  ) : null}
                  <TaskTimerChip task={t} compact onUpdate={onTasksChanged} />
                </div>
                <div className="shrink-0 text-right">
                  {due ? (
                    <div className={`text-xs font-semibold flex items-center gap-1 justify-end ${due.overdue ? 'text-rose-300' : FINELY_OS_ENTITY_BODY}`}>
                      <Calendar size={12} /> {due.label}
                    </div>
                  ) : (
                    <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>No due date</div>
                  )}
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1 justify-end">
                    Open <ArrowRight size={10} />
                  </div>
                </div>
              </button>
            );
          }}
        />
      )}
    </div>
  );
}
