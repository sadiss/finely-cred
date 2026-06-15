import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Layers, ListTodo, Target } from 'lucide-react';
import type { Project } from '../../../domain/projects';
import type { TaskItem } from '../../../domain/tasks';
import { evaluateProjectTasksSla, type SlaBreach } from '../../../domain/workSla';
import { computeProjectKpis, defaultOutcomesForProject } from '../../../lib/projectKpiEngine';
import { FinelyOsGlassPanel } from '../../os/FinelyOsGlassPanel';
import { FinelyOsOverviewStatTile } from '../../os/FinelyOsOverviewStatTile';
import { FinelyOsPaginatedStack } from '../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../os/finelyOsLightUi';

export function ProjectOverviewPanel({
  project,
  tasks,
  stageLabel,
  onEditDescription,
}: {
  project: Project;
  tasks: TaskItem[];
  stageLabel: string;
  onEditDescription?: (text: string) => void;
}) {
  const open = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const done = tasks.filter((t) => t.status === 'completed').length;
  const overdue = tasks.filter(
    (t) => t.dueAt && t.status !== 'completed' && t.status !== 'cancelled' && Date.parse(t.dueAt) < Date.now(),
  ).length;
  const slaBreaches = React.useMemo(() => evaluateProjectTasksSla(tasks, project), [tasks, project]);
  const responseBreaches = slaBreaches.filter((b) => b.kind === 'response').length;
  const overdueBreaches = slaBreaches.filter((b) => b.kind === 'overdue').length;
  const kpis = useMemo(() => computeProjectKpis(project, tasks), [project, tasks]);
  const outcomes = useMemo(() => defaultOutcomesForProject(project), [project]);

  return (
    <div className="space-y-5">
      {slaBreaches.length > 0 ? (
        <FinelyOsGlassPanel icon={AlertTriangle} title="SLA breaches" accent="rose" iconAccent="rose" variant="inner">
          <div className={FINELY_OS_NOTICE_ERROR}>
            {slaBreaches.length} active breach{slaBreaches.length === 1 ? '' : 'es'}
            {responseBreaches ? ` • ${responseBreaches} awaiting first response` : ''}
            {overdueBreaches ? ` • ${overdueBreaches} past due + grace` : ''}
          </div>
          <ul className="mt-3">
            <FinelyOsPaginatedStack
              items={slaBreaches}
              pageSize={5}
              emptyMessage="No SLA breaches."
              renderItem={(b: SlaBreach) => (
                <li key={b.taskId} className={`text-xs flex justify-between gap-2 px-3 py-2 ${finelyOsInlineListItem(true)} ${finelyOsStatusChip('blocked')}`}>
                  <span className="truncate">{b.taskTitle}</span>
                  <span className="shrink-0 font-mono">{b.kind} +{b.hoursLate}h</span>
                </li>
              )}
            />
          </ul>
        </FinelyOsGlassPanel>
      ) : null}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <FinelyOsOverviewStatTile icon={Layers} label="Phase" value={stageLabel} accent="violet" iconAccent="violet" />
        <FinelyOsOverviewStatTile icon={ListTodo} label="Open tasks" value={open} accent="amber" iconAccent="amber" />
        <FinelyOsOverviewStatTile icon={CheckCircle2} label="Completed" value={done} accent="emerald" iconAccent="emerald" />
        <FinelyOsOverviewStatTile icon={AlertTriangle} label="Overdue" value={overdue} accent="rose" iconAccent="rose" />
      </div>

      {outcomes.length > 0 ? (
        <FinelyOsGlassPanel icon={Target} title="Project outcomes" accent="emerald" iconAccent="emerald" variant="inner">
          <div className={`text-xs ${FINELY_OS_ENTITY_BODY} mb-3`}>
            {kpis.outcomesAchieved}/{kpis.outcomesTotal} achieved
            {kpis.daysRemaining != null ? ` · ${kpis.daysRemaining} days to target close` : ''}
          </div>
          <ul className="space-y-2">
            {outcomes.map((o) => {
              const pct = o.targetValue && o.currentValue != null
                ? Math.min(100, Math.round((o.currentValue / o.targetValue) * 100))
                : o.status === 'achieved' ? 100 : 0;
              return (
                <li key={o.id} className={`px-3 py-2 rounded-xl ${finelyOsInlineListItem(true)}`}>
                  <div className="flex justify-between gap-2 text-xs">
                    <span className={FINELY_OS_ENTITY_VALUE}>{o.label}</span>
                    <span className={finelyOsStatusChip(o.status === 'achieved' ? 'ok' : 'warn')}>{o.status.replace('_', ' ')}</span>
                  </div>
                  {o.targetValue != null ? (
                    <div className={`mt-1 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
                      Target {o.targetValue} · {pct}% progress
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </FinelyOsGlassPanel>
      ) : null}

      <FinelyOsGlassPanel icon={Layers} title="Description" accent="sky" iconAccent="sky" variant="inner">
        {onEditDescription ? (
          <textarea
            defaultValue={project.description ?? ''}
            onBlur={(e) => onEditDescription(e.target.value)}
            rows={4}
            placeholder="Add project description, goals, and context for ops…"
            className={`${FINELY_OS_ENTITY_INPUT} resize-y`}
          />
        ) : (
          <p className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{project.description || 'No description yet.'}</p>
        )}
      </FinelyOsGlassPanel>

      {project.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${finelyOsStatusChip('ok')}`}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
