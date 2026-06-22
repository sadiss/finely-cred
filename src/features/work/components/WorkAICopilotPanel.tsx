import React, { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Copy, Sparkles } from 'lucide-react';
import type { Project } from '../../../domain/projects';
import type { TaskItem } from '../../../domain/tasks';
import { runWorkCopilot } from '../../ai/workCopilot/runWorkCopilot';
import type { WorkCopilotPlaybookSuggestion } from '../../ai/schemas/workCopilot';
import { applyPlaybooksToProject } from '../playbooks/applyPlaybooksToProject';
import { applyRescheduleSuggestions } from '../copilot/applyRescheduleSuggestions';
import { FinelyOsAIPanelShell } from '../../os/FinelyOsAIPanelShell';
import { FinelyOsAiGatewayBanner } from '../../os/FinelyOsAiGatewayBanner';
import { FinelyOsCatalogBrowser, type FinelyOsCatalogItem } from '../../os/FinelyOsCatalogBrowser';
import {FINELY_OS_CATALOG_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_INNER,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_SUCCESS_BTN,
  finelyOsInlineListItem,
  finelyOsStatusChip,
  finelyOsCatalogCard,} from '../../os/finelyOsLightUi';

function riskChip(score: 'green' | 'amber' | 'red') {
  const tone = score === 'green' ? 'ok' : score === 'amber' ? 'warn' : 'blocked';
  return finelyOsStatusChip(tone);
}

export function WorkAICopilotPanel({
  project,
  tasks,
  partnerLane,
  onApplied,
}: {
  project: Project;
  tasks: TaskItem[];
  partnerLane?: string;
  onApplied?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runWorkCopilot>> | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedReschedule, setSelectedReschedule] = useState<Set<string>>(new Set());

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await runWorkCopilot({ project, tasks, partnerLane });
      setResult(res);
      setSelected(new Set(res.playbookSuggestions.slice(0, 3).map((s) => s.playbookId)));
      setSelectedReschedule(new Set(res.rescheduleSuggestions.map((s) => s.taskId)));
    } catch (e: any) {
      setErr(e?.message || 'Copilot failed');
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const apply = () => {
    if (!selected.size) return;
    applyPlaybooksToProject({
      partnerId: project.partnerId,
      projectId: project.id,
      scope: project.scope ?? 'personal',
      playbookIds: Array.from(selected),
    });
    onApplied?.();
    setResult(null);
    setSelected(new Set());
    setSelectedReschedule(new Set());
  };

  const applyReschedule = () => {
    if (!result) return;
    const picks = result.rescheduleSuggestions.filter((s) => selectedReschedule.has(s.taskId));
    if (!picks.length) return;
    applyRescheduleSuggestions(picks);
    onApplied?.();
    setResult(null);
    setSelectedReschedule(new Set());
  };

  const playbookCatalogItems = useMemo((): FinelyOsCatalogItem[] => {
    if (!result) return [];
    return result.playbookSuggestions.map((s: WorkCopilotPlaybookSuggestion, i) => ({
      id: s.playbookId,
      title: s.title,
      subtitle: s.stage.replace(/_/g, ' '),
      description: s.reason,
      groupKey: s.stage,
      accentIndex: i,
      badges: [{ label: 'Suggested', className: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200' }],
    }));
  }, [result]);

  return (
    <FinelyOsAIPanelShell icon={Sparkles} accent="violet" title="Work AI Copilot Pro" actionLabel={busy ? 'Analyzing…' : 'Analyze'} onAction={() => void run()} busy={busy}>
      <FinelyOsAiGatewayBanner compact className="!p-3" />
      {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}

      {result ? (
        <div className="space-y-3">
          <p className={FINELY_OS_ENTITY_BODY}>{result.summary}</p>
          <div className={`inline-flex items-center gap-2 ${riskChip(result.riskScore)}`}>
            Customer /risk: {result.riskScore}
          </div>
          {result.completionPrediction ? (
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY} text-xs`}>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-1`}>Completion forecast</div>
              <p>
                ~{result.completionPrediction.estimatedDays} days ({result.completionPrediction.confidence} confidence) — est.{' '}
                {new Date(result.completionPrediction.estimatedCompleteAt).toLocaleDateString()}
              </p>
              <p className="mt-1 opacity-80">
                {result.completionPrediction.openTasks} open · {result.completionPrediction.velocityPerWeek} tasks/week velocity
              </p>
            </div>
          ) : null}
          {result.clientSummaryDraft ? (
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Customer /summary draft</span>
                <button type="button" onClick={() => void navigator.clipboard.writeText(result.clientSummaryDraft)} className="text-white/45 hover:text-white/80" title="Copy">
                  <Copy size={14} />
                </button>
              </div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{result.clientSummaryDraft}</p>
            </div>
          ) : null}
          {result.rescheduleSuggestions.length ? (
            <div className="space-y-2">
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-300 flex items-center gap-1`}>
                <CalendarClock size={12} /> Auto-reschedule
              </div>
              {result.rescheduleSuggestions.map((s) => (
                <label key={s.taskId} className={`flex items-start gap-2 p-2 text-xs cursor-pointer ${finelyOsInlineListItem(selectedReschedule.has(s.taskId))}`}>
                  <input
                    type="checkbox"
                    checked={selectedReschedule.has(s.taskId)}
                    onChange={() => {
                      setSelectedReschedule((prev) => {
                        const next = new Set(prev);
                        if (next.has(s.taskId)) next.delete(s.taskId);
                        else next.add(s.taskId);
                        return next;
                      });
                    }}
                    className="mt-0.5 accent-amber-500"
                  />
                  <span>
                    <span className={FINELY_OS_ENTITY_VALUE}>{s.taskTitle}</span>
                    <span className={`block ${FINELY_OS_ENTITY_BODY} text-xs`}>
                      {s.reason} → {new Date(s.suggestedDueAt).toLocaleDateString()}
                    </span>
                  </span>
                </label>
              ))}
              <button type="button" disabled={!selectedReschedule.size} onClick={applyReschedule} className={FINELY_OS_SUCCESS_BTN}>
                Apply {selectedReschedule.size} reschedule(s)
              </button>
            </div>
          ) : null}
          {result.blockers.length ? (
            <ul className={`text-xs text-amber-300 space-y-1 ${FINELY_OS_ENTITY_BODY}`}>
              {result.blockers.map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
          ) : null}
          {result.timingHints.length ? (
            <ul className={`text-xs ${FINELY_OS_ENTITY_BODY} space-y-1`}>
              {result.timingHints.map((h) => (
                <li key={h}>⏱ {h}</li>
              ))}
            </ul>
          ) : null}
          <div className={FINELY_OS_CATALOG_SHELL}>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300 mb-2`}>Recommended playbooks</div>
            <FinelyOsCatalogBrowser
              items={playbookCatalogItems}
              pageSize={6}
              selectable
              selectedIds={selected}
              onToggleSelect={toggle}
              searchPlaceholder="Filter suggestions…"
              emptyMessage="No playbook suggestions."
              showViewToggle={false}
              initialView="grid"
            />
          </div>
          <button type="button" disabled={!selected.size} onClick={apply} className={FINELY_OS_SUCCESS_BTN}>
            <CheckCircle2 size={12} /> Apply {selected.size} playbook(s)
          </button>
        </div>
      ) : (
        <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Catalog-constrained suggestions — analyze to recommend playbooks for this phase.</p>
      )}
    </FinelyOsAIPanelShell>
  );
}
