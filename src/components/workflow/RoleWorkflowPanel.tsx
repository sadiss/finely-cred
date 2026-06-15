import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RoleWorkflowId } from '../../config/roleWorkflows';
import { ROLE_WORKFLOWS } from '../../config/roleWorkflows';
import { roleWorkflowProgressLabel } from '../../lib/roleWorkflowProgress';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

type Props = {
  roleId: RoleWorkflowId;
  compact?: boolean;
  completedSteps?: Set<number>;
};

export function RoleWorkflowPanel({ roleId, compact = false, completedSteps }: Props) {
  const navigate = useNavigate();
  const workflow = ROLE_WORKFLOWS[roleId];
  const total = workflow.steps.length;
  const completed = completedSteps?.size ?? 0;
  const progressLabel = roleWorkflowProgressLabel(completed, total);

  return (
    <div className={`${finelyOsGlassShell('panel', 'amber')} ${compact ? 'p-4' : 'p-6'} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-700`}>Role OS 2.0 · End-to-end workflow</div>
          <h3 className={`mt-1 text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{workflow.label} journey</h3>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>From onboarding through daily operations — every step linked.</p>
        </div>
        {progressLabel ? (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            {progressLabel}
          </span>
        ) : null}
      </div>
      <ol className="space-y-2">
        {workflow.steps.map((step, i) => {
          const isDone = completedSteps?.has(i);
          return (
            <li key={step.path}>
              <button
                type="button"
                onClick={() => navigate(step.path)}
                className={`w-full text-left ${finelyOsInlineListItem()} p-4 flex items-start gap-3 transition-colors hover:border-amber-500/25 ${
                  isDone ? 'border-emerald-500/25 bg-emerald-500/[0.06]' : ''
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
                    isDone
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700'
                      : 'border-amber-500/35 bg-amber-500/10 text-amber-800'
                  }`}
                >
                  {isDone ? <CheckCircle2 size={14} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`flex items-center gap-2 font-medium text-sm ${FINELY_OS_ENTITY_VALUE}`}>
                    {step.title}
                    <ArrowRight size={12} className="text-slate-400" />
                  </span>
                  <span className={`block mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{step.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <button type="button" onClick={() => navigate(workflow.hubPath)} className={FINELY_OS_SECONDARY_BTN}>
        Open {workflow.label} hub <ArrowRight size={12} />
      </button>
    </div>
  );
}
