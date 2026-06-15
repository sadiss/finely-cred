import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { TaskItem, TaskKind, TaskPriority, TaskStage, TaskVisibility } from '../../../domain/tasks';
import type { TaskResultType } from '../../../domain/workResults';
import { TASK_RESULT_LABELS } from '../../../domain/workResults';
import { buildTaskFromPrompt, listPlaybookOptionsForStage } from '../../../lib/workAiTaskBuilder';
import { createTask } from '../../../data/tasksRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsViewTab,
} from '../../os/finelyOsLightUi';

type Tab = 'what' | 'who' | 'when' | 'result' | 'playbook' | 'review';

const TABS: Tab[] = ['what', 'who', 'when', 'result', 'playbook', 'review'];

const TAB_LABELS: Record<Tab, string> = {
  what: 'What',
  who: 'Who',
  when: 'When',
  result: 'Result',
  playbook: 'Playbook',
  review: 'Review',
};

export function TaskCreateWizard({
  open,
  partnerId,
  projectId,
  defaultStage,
  onClose,
  onCreated,
}: {
  open: boolean;
  partnerId: string;
  projectId?: string;
  defaultStage?: TaskStage;
  onClose: () => void;
  onCreated: (task: TaskItem) => void;
}) {
  const [tab, setTab] = useState<Tab>('what');
  const [prompt, setPrompt] = useState('');
  const [playbookId, setPlaybookId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<TaskItem> | null>(null);
  const [checklistRaw, setChecklistRaw] = useState('');

  if (!open) return null;

  const playbooks = listPlaybookOptionsForStage(defaultStage);

  const runAi = async () => {
    setBusy(true);
    setErr(null);
    try {
      const built = await buildTaskFromPrompt({
        prompt,
        partnerId,
        projectId,
        playbookId: playbookId || undefined,
        context: { stage: defaultStage },
      });
      setDraft({
        ...built,
        assignedTo: built.assignedTo ?? 'both',
        visibility: built.visibility ?? 'hybrid',
        stage: built.stage ?? defaultStage ?? 'intake',
        priority: built.priority ?? 'normal',
      });
      if (built.checklist?.length) {
        setChecklistRaw(built.checklist.map((c) => c.text).join('\n'));
      }
      setTab('who');
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'AI task generation failed');
    } finally {
      setBusy(false);
    }
  };

  const syncChecklist = (raw: string) => {
    setChecklistRaw(raw);
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    setDraft((d) =>
      d
        ? {
            ...d,
            checklist: lines.map((text, i) => ({
              id: `chk_${i}`,
              text,
              done: false,
            })),
          }
        : d,
    );
  };

  const create = () => {
    if (!draft?.title) return;
    const task = createTask({
      partnerId,
      projectId,
      title: draft.title,
      kind: (draft.kind ?? 'general') as TaskKind,
      stage: (draft.stage ?? defaultStage ?? 'intake') as TaskStage,
      priority: (draft.priority ?? 'normal') as TaskPriority,
      status: 'pending',
      dueAt: draft.dueAt,
      startAt: draft.startAt,
      estimateMinutes: draft.estimateMinutes,
      notes: draft.notes,
      tags: draft.tags,
      checklist: draft.checklist,
      successCriteria: draft.successCriteria,
      resultType: draft.resultType,
      targetMetric: draft.targetMetric,
      partnerInstructions: draft.partnerInstructions,
      adminInstructions: draft.adminInstructions,
      aiGenerated: draft.aiGenerated,
      aiSuggestedNextSteps: draft.aiSuggestedNextSteps,
      assignedTo: draft.assignedTo ?? 'both',
      visibility: (draft.visibility ?? 'hybrid') as TaskVisibility,
    });
    onCreated(task);
    onClose();
    setPrompt('');
    setDraft(null);
    setChecklistRaw('');
    setTab('what');
  };

  const goNext = () => {
    const idx = TABS.indexOf(tab);
    if (idx < TABS.length - 1) setTab(TABS[idx + 1]!);
  };

  const goPrev = () => {
    const idx = TABS.indexOf(tab);
    if (idx > 0) setTab(TABS[idx - 1]!);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`${FINELY_OS_GLASS_CATALOG} w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
              <Sparkles size={16} /> Work OS · AI Create
            </div>
            <h3 className={FINELY_OS_ENTITY_VALUE}>New results-driven task</h3>
          </div>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className={`${FINELY_OS_VIEW_TABS} flex-wrap`}>
          {TABS.map((t) => (
            <button key={t} type="button" className={finelyOsViewTab(tab === t)} onClick={() => setTab(t)}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}

        {tab === 'what' ? (
          <div className="space-y-3">
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Describe what needs to happen</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className={FINELY_OS_ENTITY_INPUT}
                placeholder="Follow up Equifax on round 2 dispute for Capital One tradeline…"
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Playbook template (optional)</label>
              <select value={playbookId} onChange={(e) => setPlaybookId(e.target.value)} className={FINELY_OS_ENTITY_INPUT}>
                <option value="">None — AI only</option>
                {playbooks.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <button type="button" disabled={!prompt.trim() || busy} onClick={() => void runAi()} className={FINELY_OS_PRIMARY_BTN}>
              {busy ? 'Generating…' : 'AI fill all fields'}
            </button>
          </div>
        ) : null}

        {tab === 'who' && draft ? (
          <div className="space-y-3">
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Assigned to</label>
              <select
                value={draft.assignedTo ?? 'both'}
                onChange={(e) => setDraft({ ...draft, assignedTo: e.target.value as TaskItem['assignedTo'] })}
                className={FINELY_OS_ENTITY_INPUT}
              >
                <option value="partner">Partner</option>
                <option value="admin">Admin team</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Visibility</label>
              <select
                value={draft.visibility ?? 'hybrid'}
                onChange={(e) => setDraft({ ...draft, visibility: e.target.value as TaskVisibility })}
                className={FINELY_OS_ENTITY_INPUT}
              >
                <option value="partner">Partner only</option>
                <option value="admin">Admin only</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        ) : null}

        {tab === 'when' && draft ? (
          <div className="space-y-3">
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Due date</label>
              <input
                type="datetime-local"
                value={draft.dueAt?.slice(0, 16) ?? ''}
                onChange={(e) => setDraft({ ...draft, dueAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className={FINELY_OS_ENTITY_INPUT}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Priority</label>
                <select
                  value={draft.priority ?? 'normal'}
                  onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })}
                  className={FINELY_OS_ENTITY_INPUT}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Stage</label>
                <select
                  value={draft.stage ?? defaultStage ?? 'intake'}
                  onChange={(e) => setDraft({ ...draft, stage: e.target.value as TaskStage })}
                  className={FINELY_OS_ENTITY_INPUT}
                >
                  {(['intake', 'reports', 'evidence', 'disputes', 'debt', 'identity', 'funding', 'complete'] as TaskStage[]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Estimate (minutes)</label>
              <input
                type="number"
                min={5}
                value={draft.estimateMinutes ?? ''}
                onChange={(e) => setDraft({ ...draft, estimateMinutes: parseInt(e.target.value, 10) || undefined })}
                className={FINELY_OS_ENTITY_INPUT}
              />
            </div>
          </div>
        ) : null}

        {tab === 'result' && draft ? (
          <div className="space-y-3">
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Success criteria</label>
              <textarea
                value={draft.successCriteria ?? ''}
                onChange={(e) => setDraft({ ...draft, successCriteria: e.target.value })}
                rows={3}
                className={FINELY_OS_ENTITY_INPUT}
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Result type</label>
              <select
                value={draft.resultType ?? 'custom'}
                onChange={(e) => setDraft({ ...draft, resultType: e.target.value as TaskResultType })}
                className={FINELY_OS_ENTITY_INPUT}
              >
                {Object.entries(TASK_RESULT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Target metric</label>
              <input
                value={draft.targetMetric ?? ''}
                onChange={(e) => setDraft({ ...draft, targetMetric: e.target.value })}
                className={FINELY_OS_ENTITY_INPUT}
                placeholder="+40 FICO, 3 deletions, etc."
              />
            </div>
          </div>
        ) : null}

        {tab === 'playbook' && draft ? (
          <div className="space-y-3">
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Checklist (one item per line)</label>
              <textarea
                value={checklistRaw}
                onChange={(e) => syncChecklist(e.target.value)}
                rows={5}
                className={FINELY_OS_ENTITY_INPUT}
                placeholder="Pull updated bureau report&#10;Draft round 2 letter&#10;Mail certified"
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Partner instructions</label>
              <textarea
                value={draft.partnerInstructions ?? ''}
                onChange={(e) => setDraft({ ...draft, partnerInstructions: e.target.value })}
                rows={2}
                className={FINELY_OS_ENTITY_INPUT}
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Admin instructions</label>
              <textarea
                value={draft.adminInstructions ?? ''}
                onChange={(e) => setDraft({ ...draft, adminInstructions: e.target.value })}
                rows={2}
                className={FINELY_OS_ENTITY_INPUT}
              />
            </div>
          </div>
        ) : null}

        {tab === 'review' && draft ? (
          <div className={`space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            <p><span className="text-white/50">Title:</span> {draft.title}</p>
            <p><span className="text-white/50">Kind:</span> {draft.kind}</p>
            <p><span className="text-white/50">Assigned:</span> {draft.assignedTo} · {draft.visibility}</p>
            <p><span className="text-white/50">Priority:</span> {draft.priority} · stage {draft.stage}</p>
            {draft.dueAt ? <p><span className="text-white/50">Due:</span> {new Date(draft.dueAt).toLocaleString()}</p> : null}
            <p><span className="text-white/50">Success:</span> {draft.successCriteria}</p>
            {(draft.checklist?.length ?? 0) > 0 ? (
              <ul className="list-disc pl-4">
                {draft.checklist!.map((c) => (
                  <li key={c.id}>{c.text}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-between gap-2 pt-2">
          <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN}>Cancel</button>
          <div className="flex gap-2">
            {tab !== 'what' ? (
              <button type="button" onClick={goPrev} className={FINELY_OS_SECONDARY_BTN}>Back</button>
            ) : null}
            {tab !== 'review' && draft ? (
              <button type="button" onClick={goNext} className={FINELY_OS_PRIMARY_BTN}>Next</button>
            ) : null}
            {tab === 'review' && draft ? (
              <button type="button" onClick={create} className={FINELY_OS_SUCCESS_BTN}>Create task</button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
