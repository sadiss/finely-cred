import React, { useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import type { WorkflowId } from '../../domain/automation';
import type {
  AutomationActionV2,
  AutomationCondition,
  AutomationRule,
  AutomationTrigger,
} from '../../domain/automationStudio';
import type { CommsTemplate } from '../../domain/comms';
import type { PartnerJourneyStage, PartnerLane } from '../../domain/partners';
import type { TaskKind, TaskPriority, TaskStage } from '../../domain/tasks';

const WORKFLOWS: WorkflowId[] = ['dispute_followup_scheduler', 'evidence_request_autopilot'];
const LANES: PartnerLane[] = [
  'funding_readiness',
  'business_credit',
  'debt_kill',
  'au_tradelines',
  'primary_tradeline',
  'affiliate',
  'agent',
  'other',
];
const STAGES: PartnerJourneyStage[] = [
  'intake',
  'report_upload',
  'analysis',
  'evidence',
  'letters',
  'mailing',
  'funding',
  'complete',
];
const TASK_KINDS: TaskKind[] = ['general', 'upload_document', 'review_results', 'follow_up', 'mail_letter'];
const TASK_STAGES: TaskStage[] = ['intake', 'reports', 'evidence', 'disputes', 'debt', 'identity', 'funding', 'complete'];
const TASK_PRIORITIES: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];
const PROJECT_STATUSES: Array<'active' | 'paused' | 'completed'> = ['active', 'paused', 'completed'];

function asNum(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function AutomationRuleEditor({
  rule,
  commsTemplates,
  onSave,
  onDelete,
}: {
  rule: AutomationRule;
  commsTemplates: CommsTemplate[];
  onSave: (next: AutomationRule) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<AutomationRule>(rule);
  const [dirty, setDirty] = useState(false);

  // Reset when switching rules
  React.useEffect(() => {
    setDraft(rule);
    setDirty(false);
  }, [rule.id]);

  const commsIndex = useMemo(() => new Map(commsTemplates.map((t) => [t.id, t])), [commsTemplates]);

  const updateTrigger = (patch: Partial<AutomationTrigger>) => {
    setDraft((d) => ({ ...d, trigger: { ...d.trigger, ...patch } as any }));
    setDirty(true);
  };

  const setTriggerType = (type: AutomationTrigger['type']) => {
    if (type === 'manual') updateTrigger({ type: 'manual' });
    else updateTrigger({ type: 'interval', everyHours: (draft.trigger as any)?.everyHours ?? 24 } as any);
  };

  const updateCondition = (idx: number, next: AutomationCondition) => {
    setDraft((d) => {
      const out = d.conditions.slice();
      out[idx] = next;
      return { ...d, conditions: out };
    });
    setDirty(true);
  };

  const removeCondition = (idx: number) => {
    setDraft((d) => ({ ...d, conditions: d.conditions.filter((_, i) => i !== idx) }));
    setDirty(true);
  };

  const addCondition = (type: AutomationCondition['type']) => {
    const next: AutomationCondition =
      type === 'always'
        ? { type: 'always' }
        : type === 'partner_lane_in'
          ? { type: 'partner_lane_in', lanes: ['other'] }
          : type === 'partner_stage_in'
            ? { type: 'partner_stage_in', stages: ['intake'] }
            : type === 'has_open_tasks'
              ? { type: 'has_open_tasks', minOpenTasks: 1 }
              : type === 'has_unclaimed_invite'
                ? { type: 'has_unclaimed_invite', olderThanHours: 72 }
                : { type: 'has_active_bundle', bundleId: 'business_fundability_sprint_v1' };
    setDraft((d) => ({ ...d, conditions: [...(d.conditions ?? []), next] }));
    setDirty(true);
  };

  const updateAction = (idx: number, next: AutomationActionV2) => {
    setDraft((d) => {
      const out = d.actions.slice();
      out[idx] = next;
      return { ...d, actions: out };
    });
    setDirty(true);
  };

  const removeAction = (idx: number) => {
    setDraft((d) => ({ ...d, actions: d.actions.filter((_, i) => i !== idx) }));
    setDirty(true);
  };

  const addAction = (type: AutomationActionV2['type']) => {
    const next: AutomationActionV2 =
      type === 'run_workflow'
        ? { type: 'run_workflow', workflowId: 'dispute_followup_scheduler' }
        : type === 'create_task'
          ? { type: 'create_task', title: 'Next step task', kind: 'general', dueInDays: 3, tags: ['automation'] }
          : type === 'create_project'
            ? { type: 'create_project', title: 'New project', scope: 'personal', stage: 'intake' as any, status: 'active', tags: ['automation'] }
            : type === 'set_project_stage'
              ? { type: 'set_project_stage', stage: 'intake' as any, scope: 'personal', maxPerPartner: 1 }
              : type === 'set_project_status'
                ? { type: 'set_project_status', status: 'active', scope: 'personal', maxPerPartner: 1 }
                : type === 'add_project_note'
                  ? { type: 'add_project_note', note: 'Automation note', scope: 'personal', maxPerPartner: 1 }
                  : type === 'set_task_stage'
                    ? { type: 'set_task_stage', stage: 'intake', maxPerPartner: 6 }
                    : type === 'set_task_status'
                      ? { type: 'set_task_status', status: 'pending', maxPerPartner: 6 }
                      : type === 'set_task_priority'
                        ? { type: 'set_task_priority', priority: 'normal', maxPerPartner: 6 }
                        : type === 'add_task_comment'
                          ? { type: 'add_task_comment', comment: 'Automation comment', maxPerPartner: 6 }
                          : type === 'add_task_checklist_items'
                            ? { type: 'add_task_checklist_items', items: [''], maxPerPartner: 6 }
                            : type === 'append_task_notes'
                              ? { type: 'append_task_notes', note: 'Automation note', maxPerPartner: 6 }
                              : type === 'add_task_tags'
                                ? { type: 'add_task_tags', tags: ['automation'], maxPerPartner: 6 }
                                : type === 'add_task_labels'
                                  ? { type: 'add_task_labels', labels: ['automation'], maxPerPartner: 6 }
                                  : type === 'assign_task_users'
                                    ? { type: 'assign_task_users', assigneeUserIds: [], maxPerPartner: 6 }
                                    : type === 'create_notification'
                                      ? { type: 'create_notification', audience: 'both', title: 'Automation notice', body: '', href: '/portal/dashboard', maxPerRun: 50 }
                                      : type === 'upsert_partner_signal'
                                        ? { type: 'upsert_partner_signal', key: 'nudge', value: { at: new Date().toISOString() } }
          : type === 'send_invite_reminder'
            ? { type: 'send_invite_reminder', channel: 'both', olderThanHours: 72, maxPerRun: 40 }
            : type === 'bundle_nudge'
              ? { type: 'bundle_nudge', maxPerRun: 60, dueSoonDays: 3 }
              : { type: 'send_comms_template', templateId: commsTemplates[0]?.id ?? '', channel: 'portal', dedupeWithinHours: 24, maxPerRun: 50 };
    setDraft((d) => ({ ...d, actions: [...(d.actions ?? []), next] }));
    setDirty(true);
  };

  const canSave = draft.name.trim().length > 0 && draft.actions.length > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-white font-semibold">Rule editor</div>
          <div className="mt-1 text-white/60 text-sm">Edit trigger, conditions, and actions — then Save.</div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
            id {draft.id} • {dirty ? 'unsaved changes' : 'saved'}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDelete(draft.id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15 text-[10px] font-black uppercase tracking-widest text-rose-200 transition-all"
            title="Delete rule"
          >
            <Trash2 size={14} /> Delete
          </button>
          <button
            type="button"
            disabled={!dirty || !canSave}
            onClick={() => onSave(draft)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
            title="Save rule"
          >
            <Save size={14} /> Save
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="grid gap-1">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Name</div>
          <input
            value={draft.name}
            onChange={(e) => {
              setDraft((d) => ({ ...d, name: e.target.value }));
              setDirty(true);
            }}
            className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30"
          />
        </label>
        <div className="grid gap-1">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Trigger</div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={draft.trigger.type}
              onChange={(e) => setTriggerType(e.target.value as any)}
              className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white"
            >
              <option value="manual">manual</option>
              <option value="interval">interval</option>
            </select>
            {draft.trigger.type === 'interval' ? (
              <input
                type="number"
                min={1}
                value={(draft.trigger as any).everyHours ?? 24}
                onChange={(e) => updateTrigger({ everyHours: asNum(e.target.value, 24) } as any)}
                className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white"
                title="Every N hours"
              />
            ) : (
              <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm">
                Run only when clicked
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-white font-semibold">Conditions</div>
            <div className="flex items-center gap-2">
              <select
                defaultValue="always"
                onChange={(e) => {
                  addCondition(e.target.value as any);
                  (e.target as HTMLSelectElement).value = 'always';
                }}
                className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                title="Add condition"
              >
                <option value="always">+ always</option>
                <option value="partner_lane_in">+ partner lane in</option>
                <option value="partner_stage_in">+ partner stage in</option>
                <option value="has_open_tasks">+ has open tasks</option>
                <option value="has_unclaimed_invite">+ has unclaimed invite</option>
                <option value="has_active_bundle">+ has active bundle</option>
              </select>
            </div>
          </div>

          {draft.conditions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-white/60 text-sm">
              No conditions. Add one (or use “always”).
            </div>
          ) : (
            <div className="space-y-2">
              {draft.conditions.map((c, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <select
                      value={c.type}
                      onChange={(e) => addCondition(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                      disabled
                      title="Condition type"
                    >
                      <option value={c.type}>{c.type}</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeCondition(idx)}
                      className="text-[10px] font-black uppercase tracking-widest text-rose-200 hover:text-rose-100"
                    >
                      Remove
                    </button>
                  </div>

                  {c.type === 'always' && <div className="text-white/60 text-sm">Always true.</div>}

                  {c.type === 'partner_lane_in' && (
                    <div className="grid gap-1">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Lanes</div>
                      <select
                        multiple
                        value={c.lanes}
                        onChange={(e) =>
                          updateCondition(idx, {
                            type: 'partner_lane_in',
                            lanes: Array.from(e.target.selectedOptions).map((o) => o.value as PartnerLane),
                          })
                        }
                        className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px] min-h-[120px]"
                      >
                        {LANES.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {c.type === 'partner_stage_in' && (
                    <div className="grid gap-1">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Stages</div>
                      <select
                        multiple
                        value={c.stages}
                        onChange={(e) =>
                          updateCondition(idx, {
                            type: 'partner_stage_in',
                            stages: Array.from(e.target.selectedOptions).map((o) => o.value as PartnerJourneyStage),
                          })
                        }
                        className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px] min-h-[140px]"
                      >
                        {STAGES.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {c.type === 'has_open_tasks' && (
                    <label className="grid gap-1">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Min open tasks</div>
                      <input
                        type="number"
                        min={1}
                        value={c.minOpenTasks ?? 1}
                        onChange={(e) => updateCondition(idx, { type: 'has_open_tasks', minOpenTasks: asNum(e.target.value, 1) })}
                        className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                      />
                    </label>
                  )}

                  {c.type === 'has_unclaimed_invite' && (
                    <label className="grid gap-1">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Older than (hours)</div>
                      <input
                        type="number"
                        min={0}
                        value={c.olderThanHours ?? 72}
                        onChange={(e) => updateCondition(idx, { type: 'has_unclaimed_invite', olderThanHours: asNum(e.target.value, 72) })}
                        className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                      />
                    </label>
                  )}

                  {c.type === 'has_active_bundle' && (
                    <label className="grid gap-1">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Bundle ID</div>
                      <input
                        value={c.bundleId}
                        onChange={(e) => updateCondition(idx, { type: 'has_active_bundle', bundleId: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-white font-semibold">Actions</div>
            <select
              defaultValue="create_task"
              onChange={(e) => {
                addAction(e.target.value as any);
                (e.target as HTMLSelectElement).value = 'create_task';
              }}
              className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
              title="Add action"
            >
              <option value="create_task">+ create task</option>
              <option value="create_project">+ create project</option>
              <option value="set_project_stage">+ set project stage</option>
              <option value="set_project_status">+ set project status</option>
              <option value="add_project_note">+ add project note</option>
              <option value="set_task_stage">+ set task stage</option>
              <option value="set_task_status">+ set task status</option>
              <option value="set_task_priority">+ set task priority</option>
              <option value="add_task_comment">+ add task comment</option>
              <option value="add_task_checklist_items">+ add task checklist items</option>
              <option value="append_task_notes">+ append task notes</option>
              <option value="add_task_tags">+ add task tags</option>
              <option value="add_task_labels">+ add task labels</option>
              <option value="assign_task_users">+ assign task users</option>
              <option value="create_notification">+ create notification</option>
              <option value="upsert_partner_signal">+ upsert partner signal</option>
              <option value="run_workflow">+ run workflow</option>
              <option value="send_comms_template">+ send comms template</option>
              <option value="send_invite_reminder">+ send invite reminder</option>
              <option value="bundle_nudge">+ bundle nudge</option>
            </select>
          </div>

          {draft.actions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-white/60 text-sm">No actions.</div>
          ) : (
            <div className="space-y-2">
              {draft.actions.map((a, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{a.type}</div>
                    <button
                      type="button"
                      onClick={() => removeAction(idx)}
                      className="text-[10px] font-black uppercase tracking-widest text-rose-200 hover:text-rose-100"
                    >
                      Remove
                    </button>
                  </div>

                  {a.type === 'run_workflow' && (
                    <label className="grid gap-1">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Workflow</div>
                      <select
                        value={a.workflowId}
                        onChange={(e) => updateAction(idx, { type: 'run_workflow', workflowId: e.target.value as WorkflowId })}
                        className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                      >
                        {WORKFLOWS.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {a.type === 'create_task' && (
                    <div className="grid gap-3">
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Title</div>
                        <input
                          value={a.title}
                          onChange={(e) => updateAction(idx, { ...a, title: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Kind</div>
                          <select
                            value={a.kind}
                            onChange={(e) => updateAction(idx, { ...a, kind: e.target.value as TaskKind })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            {TASK_KINDS.map((k) => (
                              <option key={k} value={k}>
                                {k}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Due in days</div>
                          <input
                            type="number"
                            min={0}
                            value={a.dueInDays ?? 0}
                            onChange={(e) => updateAction(idx, { ...a, dueInDays: asNum(e.target.value, 0) })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Stage</div>
                          <select
                            value={a.stage ?? ''}
                            onChange={(e) => updateAction(idx, { ...a, stage: (e.target.value || undefined) as any })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            <option value="">(none)</option>
                            {TASK_STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Priority</div>
                          <select
                            value={a.priority ?? ''}
                            onChange={(e) => updateAction(idx, { ...a, priority: (e.target.value || undefined) as any })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            <option value="">(none)</option>
                            {TASK_PRIORITIES.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Notes</div>
                        <textarea
                          value={a.notes ?? ''}
                          onChange={(e) => updateAction(idx, { ...a, notes: e.target.value })}
                          rows={3}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px] resize-y"
                        />
                      </label>
                    </div>
                  )}

                  {a.type === 'send_comms_template' && (
                    <div className="grid gap-3">
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Template</div>
                        <select
                          value={a.templateId}
                          onChange={(e) => updateAction(idx, { ...a, templateId: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        >
                          <option value="">(select)</option>
                          {commsTemplates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} • {t.channel} • {t.enabled ? 'on' : 'off'}
                            </option>
                          ))}
                        </select>
                        {a.templateId && (
                          <div className="text-white/50 text-xs">
                            Selected: <span className="font-semibold text-white/70">{commsIndex.get(a.templateId)?.name ?? a.templateId}</span>
                          </div>
                        )}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Channel override</div>
                          <select
                            value={a.channel ?? ''}
                            onChange={(e) => updateAction(idx, { ...a, channel: (e.target.value || undefined) as any })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            <option value="">(use template)</option>
                            <option value="portal">portal</option>
                            <option value="email">email</option>
                            <option value="sms">sms</option>
                          </select>
                        </label>
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Dedupe (hours)</div>
                          <input
                            type="number"
                            min={0}
                            value={a.dedupeWithinHours ?? 24}
                            onChange={(e) => updateAction(idx, { ...a, dedupeWithinHours: asNum(e.target.value, 24) })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          />
                        </label>
                      </div>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Max per run</div>
                        <input
                          type="number"
                          min={1}
                          value={a.maxPerRun ?? 50}
                          onChange={(e) => updateAction(idx, { ...a, maxPerRun: asNum(e.target.value, 50) })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                    </div>
                  )}

                  {a.type === 'send_invite_reminder' && (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Channel</div>
                        <select
                          value={a.channel}
                          onChange={(e) => updateAction(idx, { ...a, channel: e.target.value as any })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        >
                          <option value="both">both</option>
                          <option value="email">email</option>
                          <option value="sms">sms</option>
                        </select>
                      </label>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Older than (hours)</div>
                        <input
                          type="number"
                          min={0}
                          value={a.olderThanHours ?? 72}
                          onChange={(e) => updateAction(idx, { ...a, olderThanHours: asNum(e.target.value, 72) })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                      <label className="grid gap-1 col-span-2">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Max per run</div>
                        <input
                          type="number"
                          min={1}
                          value={a.maxPerRun ?? 40}
                          onChange={(e) => updateAction(idx, { ...a, maxPerRun: asNum(e.target.value, 40) })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                    </div>
                  )}

                  {a.type === 'bundle_nudge' && (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Max per run</div>
                        <input
                          type="number"
                          min={1}
                          value={a.maxPerRun ?? 60}
                          onChange={(e) => updateAction(idx, { ...a, maxPerRun: asNum(e.target.value, 60) })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Due soon days</div>
                        <input
                          type="number"
                          min={1}
                          value={a.dueSoonDays ?? 3}
                          onChange={(e) => updateAction(idx, { ...a, dueSoonDays: asNum(e.target.value, 3) })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                    </div>
                  )}

                  {a.type === 'create_project' && (
                    <div className="grid gap-3">
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Title</div>
                        <input
                          value={(a as any).title ?? ''}
                          onChange={(e) => updateAction(idx, { ...(a as any), title: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Scope</div>
                          <select
                            value={(a as any).scope ?? 'personal'}
                            onChange={(e) => updateAction(idx, { ...(a as any), scope: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            <option value="personal">personal</option>
                            <option value="business">business</option>
                          </select>
                        </label>
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Status</div>
                          <select
                            value={(a as any).status ?? 'active'}
                            onChange={(e) => updateAction(idx, { ...(a as any), status: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            {PROJECT_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Stage</div>
                        <select
                          value={(a as any).stage ?? 'intake'}
                          onChange={(e) => updateAction(idx, { ...(a as any), stage: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        >
                          {TASK_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Tags (comma)</div>
                        <input
                          value={Array.isArray((a as any).tags) ? (a as any).tags.join(', ') : ''}
                          onChange={(e) =>
                            updateAction(idx, { ...(a as any), tags: e.target.value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 20) })
                          }
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                    </div>
                  )}

                  {(a.type === 'set_project_stage' || a.type === 'set_project_status' || a.type === 'add_project_note') && (
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Scope</div>
                          <select
                            value={(a as any).scope ?? ''}
                            onChange={(e) => updateAction(idx, { ...(a as any), scope: e.target.value || undefined })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            <option value="">(any)</option>
                            <option value="personal">personal</option>
                            <option value="business">business</option>
                          </select>
                        </label>
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Max per partner</div>
                          <input
                            type="number"
                            min={1}
                            value={(a as any).maxPerPartner ?? 1}
                            onChange={(e) => updateAction(idx, { ...(a as any), maxPerPartner: asNum(e.target.value, 1) })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          />
                        </label>
                      </div>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Match tags (any, comma)</div>
                        <input
                          value={Array.isArray((a as any).matchTagsAny) ? (a as any).matchTagsAny.join(', ') : ''}
                          onChange={(e) =>
                            updateAction(idx, { ...(a as any), matchTagsAny: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })
                          }
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                      {a.type === 'set_project_stage' ? (
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Stage</div>
                          <select
                            value={(a as any).stage ?? 'intake'}
                            onChange={(e) => updateAction(idx, { ...(a as any), stage: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            {TASK_STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      {a.type === 'set_project_status' ? (
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Status</div>
                          <select
                            value={(a as any).status ?? 'active'}
                            onChange={(e) => updateAction(idx, { ...(a as any), status: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            {PROJECT_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      {a.type === 'add_project_note' ? (
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Note</div>
                          <textarea
                            value={(a as any).note ?? ''}
                            onChange={(e) => updateAction(idx, { ...(a as any), note: e.target.value })}
                            rows={3}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px] resize-y"
                          />
                        </label>
                      ) : null}
                    </div>
                  )}

                  {(a.type === 'set_task_stage' || a.type === 'set_task_status' || a.type === 'set_task_priority') && (
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Max per partner</div>
                          <input
                            type="number"
                            min={1}
                            value={(a as any).maxPerPartner ?? 6}
                            onChange={(e) => updateAction(idx, { ...(a as any), maxPerPartner: asNum(e.target.value, 6) })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          />
                        </label>
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Match tags (any, comma)</div>
                          <input
                            value={Array.isArray((a as any).matchTagsAny) ? (a as any).matchTagsAny.join(', ') : ''}
                            onChange={(e) =>
                              updateAction(idx, { ...(a as any), matchTagsAny: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })
                            }
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          />
                        </label>
                      </div>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Match kinds</div>
                        <select
                          multiple
                          value={Array.isArray((a as any).matchKindsAny) ? (a as any).matchKindsAny : []}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions).map((o) => o.value).filter(Boolean);
                            updateAction(idx, { ...(a as any), matchKindsAny: selected.length ? selected : undefined });
                          }}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px] min-h-[90px]"
                        >
                          {TASK_KINDS.map((k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))}
                        </select>
                      </label>
                      {a.type === 'set_task_stage' ? (
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Stage</div>
                          <select
                            value={(a as any).stage ?? 'intake'}
                            onChange={(e) => updateAction(idx, { ...(a as any), stage: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            {TASK_STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      {a.type === 'set_task_status' ? (
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Status</div>
                          <select
                            value={(a as any).status ?? 'pending'}
                            onChange={(e) => updateAction(idx, { ...(a as any), status: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            <option value="pending">pending</option>
                            <option value="in_progress">in_progress</option>
                            <option value="completed">completed</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </label>
                      ) : null}
                      {a.type === 'set_task_priority' ? (
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Priority</div>
                          <select
                            value={(a as any).priority ?? 'normal'}
                            onChange={(e) => updateAction(idx, { ...(a as any), priority: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            {TASK_PRIORITIES.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </div>
                  )}

                  {(a.type === 'add_task_comment' || a.type === 'append_task_notes') && (
                    <div className="grid gap-3">
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {a.type === 'add_task_comment' ? 'Comment' : 'Note'}
                        </div>
                        <textarea
                          value={(a as any)[a.type === 'add_task_comment' ? 'comment' : 'note'] ?? ''}
                          onChange={(e) => updateAction(idx, { ...(a as any), [a.type === 'add_task_comment' ? 'comment' : 'note']: e.target.value } as any)}
                          rows={3}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px] resize-y"
                        />
                      </label>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Match tags (any, comma)</div>
                        <input
                          value={Array.isArray((a as any).matchTagsAny) ? (a as any).matchTagsAny.join(', ') : ''}
                          onChange={(e) =>
                            updateAction(idx, { ...(a as any), matchTagsAny: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })
                          }
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                    </div>
                  )}

                  {a.type === 'add_task_checklist_items' && (
                    <div className="grid gap-3">
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Items (one per line)</div>
                        <textarea
                          value={Array.isArray((a as any).items) ? (a as any).items.join('\n') : ''}
                          onChange={(e) =>
                            updateAction(idx, { ...(a as any), items: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })
                          }
                          rows={4}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px] resize-y"
                        />
                      </label>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Match tags (any, comma)</div>
                        <input
                          value={Array.isArray((a as any).matchTagsAny) ? (a as any).matchTagsAny.join(', ') : ''}
                          onChange={(e) =>
                            updateAction(idx, { ...(a as any), matchTagsAny: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })
                          }
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                    </div>
                  )}

                  {(a.type === 'add_task_tags' || a.type === 'add_task_labels' || a.type === 'assign_task_users') && (
                    <div className="grid gap-3">
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {a.type === 'assign_task_users' ? 'Assignee user ids (comma)' : 'Values (comma)'}
                        </div>
                        <input
                          value={
                            a.type === 'add_task_tags'
                              ? (Array.isArray((a as any).tags) ? (a as any).tags.join(', ') : '')
                              : a.type === 'add_task_labels'
                                ? (Array.isArray((a as any).labels) ? (a as any).labels.join(', ') : '')
                                : (Array.isArray((a as any).assigneeUserIds) ? (a as any).assigneeUserIds.join(', ') : '')
                          }
                          onChange={(e) => {
                            const vals = e.target.value.split(',').map((x) => x.trim()).filter(Boolean);
                            if (a.type === 'add_task_tags') updateAction(idx, { ...(a as any), tags: vals });
                            else if (a.type === 'add_task_labels') updateAction(idx, { ...(a as any), labels: vals });
                            else updateAction(idx, { ...(a as any), assigneeUserIds: vals });
                          }}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Match tags (any, comma)</div>
                        <input
                          value={Array.isArray((a as any).matchTagsAny) ? (a as any).matchTagsAny.join(', ') : ''}
                          onChange={(e) =>
                            updateAction(idx, { ...(a as any), matchTagsAny: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })
                          }
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                    </div>
                  )}

                  {a.type === 'create_notification' && (
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Audience</div>
                          <select
                            value={(a as any).audience ?? 'both'}
                            onChange={(e) => updateAction(idx, { ...(a as any), audience: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            <option value="partner">partner</option>
                            <option value="admin">admin</option>
                            <option value="both">both</option>
                          </select>
                        </label>
                        <label className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Max per run</div>
                          <input
                            type="number"
                            min={1}
                            value={(a as any).maxPerRun ?? 50}
                            onChange={(e) => updateAction(idx, { ...(a as any), maxPerRun: asNum(e.target.value, 50) })}
                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          />
                        </label>
                      </div>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Title</div>
                        <input
                          value={(a as any).title ?? ''}
                          onChange={(e) => updateAction(idx, { ...(a as any), title: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Body</div>
                        <textarea
                          value={(a as any).body ?? ''}
                          onChange={(e) => updateAction(idx, { ...(a as any), body: e.target.value })}
                          rows={3}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px] resize-y"
                        />
                      </label>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Href</div>
                        <input
                          value={(a as any).href ?? ''}
                          onChange={(e) => updateAction(idx, { ...(a as any), href: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                          placeholder="/portal/dashboard"
                        />
                      </label>
                    </div>
                  )}

                  {a.type === 'upsert_partner_signal' && (
                    <div className="grid gap-3">
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Key</div>
                        <input
                          value={(a as any).key ?? ''}
                          onChange={(e) => updateAction(idx, { ...(a as any), key: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-[11px]"
                        />
                      </label>
                      <label className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Value (JSON)</div>
                        <textarea
                          value={JSON.stringify((a as any).value ?? {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value || '{}');
                              updateAction(idx, { ...(a as any), value: parsed });
                            } catch {
                              // ignore while typing
                            }
                          }}
                          rows={6}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white/80 text-xs font-mono resize-y"
                        />
                      </label>
                    </div>
                  )}

                  {!(
                    a.type === 'run_workflow' ||
                    a.type === 'create_task' ||
                    a.type === 'send_comms_template' ||
                    a.type === 'send_invite_reminder' ||
                    a.type === 'bundle_nudge' ||
                    a.type === 'create_project' ||
                    a.type === 'set_project_stage' ||
                    a.type === 'set_project_status' ||
                    a.type === 'add_project_note' ||
                    a.type === 'set_task_stage' ||
                    a.type === 'set_task_status' ||
                    a.type === 'set_task_priority' ||
                    a.type === 'add_task_comment' ||
                    a.type === 'add_task_checklist_items' ||
                    a.type === 'append_task_notes' ||
                    a.type === 'add_task_tags' ||
                    a.type === 'add_task_labels' ||
                    a.type === 'assign_task_users' ||
                    a.type === 'create_notification' ||
                    a.type === 'upsert_partner_signal'
                  ) ? (
                    <div className="grid gap-2">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Advanced (JSON)</div>
                      <textarea
                        value={JSON.stringify(a as any, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value || '{}');
                            updateAction(idx, parsed);
                          } catch {
                            // ignore while typing
                          }
                        }}
                        rows={8}
                        className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white/80 text-xs font-mono resize-y"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {!canSave && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-100 text-sm">
              Rule must have a name and at least 1 action to save.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Quick actions</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft((d) => ({ ...d, enabled: !d.enabled }));
              setDirty(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
          >
            Toggle enabled ({draft.enabled ? 'on' : 'off'})
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft((d) => ({ ...d, meta: { ...(d.meta ?? {}), note: 'edited' } }));
              setDirty(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
          >
            <Plus size={14} /> Touch meta
          </button>
        </div>
      </div>
    </div>
  );
}

