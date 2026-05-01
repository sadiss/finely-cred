import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, PlayCircle, Plus, RefreshCw, ShieldCheck, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { AutomationRule, AgentMode } from '../../domain/automationStudio';
import { createAutomationRule, deleteAutomationRule, listAutomationRules, listAutomationRuns, setAutomationRuleEnabled, upsertAutomationRule } from '../../data/automationStudioRepo';
import { isAutomationRuleDue, runAutomationRule, runAllEnabledAutomations, runDueAutomations } from '../../automation/agentRunner';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { callAiGateway } from '../../lib/aiClient';
import { extractFirstJsonObject } from '../../utils/jsonExtract';
import { listCommsTemplates } from '../../data/commsRepo';
import { AutomationRuleEditor } from '../../components/automation/AutomationRuleEditor';

type TemplateSpec = {
  id: string;
  title: string;
  description: string;
  makeRule: () => Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>;
};

function fmtIso(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function compactJson(v: any) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export default function AdminAutomationsPage() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [mode, setMode] = useState<AgentMode>('dry_run');
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [autopilot, setAutopilot] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [qbName, setQbName] = useState('Custom task automation');
  const [qbTaskTitle, setQbTaskTitle] = useState('Next step: review your profile and upload missing docs');
  const [qbTaskKind, setQbTaskKind] = useState<'general' | 'follow_up' | 'upload_document' | 'review_results' | 'mail_letter'>('general');
  const [qbDueDays, setQbDueDays] = useState(3);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const rules = useMemo(() => listAutomationRules(), [version]);
  const runs = useMemo(() => listAutomationRuns(60), [version]);
  const commsTemplates = useMemo(() => listCommsTemplates(), [version]);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const templates: TemplateSpec[] = useMemo(
    () => [
      {
        id: 'tpl_followup',
        title: 'Dispute follow‑up scheduler',
        description: 'Creates follow-up tasks before round due dates (cases → tasks).',
        makeRule: () => ({
          name: 'Dispute follow‑up scheduler',
          enabled: true,
          trigger: { type: 'interval', everyHours: 24 },
          conditions: [{ type: 'always' }],
          actions: [{ type: 'run_workflow', workflowId: 'dispute_followup_scheduler' }],
          rollingHorizonDays: 90,
          meta: { templateId: 'tpl_followup' },
        }),
      },
      {
        id: 'tpl_evidence',
        title: 'Evidence request autopilot',
        description: 'Creates “upload evidence” tasks when open cases have missing evidence.',
        makeRule: () => ({
          name: 'Evidence request autopilot',
          enabled: true,
          trigger: { type: 'interval', everyHours: 12 },
          conditions: [{ type: 'always' }],
          actions: [{ type: 'run_workflow', workflowId: 'evidence_request_autopilot' }],
          rollingHorizonDays: 60,
          meta: { templateId: 'tpl_evidence' },
        }),
      },
      {
        id: 'tpl_invite',
        title: 'Invite reminder agent',
        description: 'Reminds unclaimed imported partners (email/SMS) after a delay.',
        makeRule: () => ({
          name: 'Invite reminder agent',
          enabled: true,
          trigger: { type: 'interval', everyHours: 24 },
          conditions: [{ type: 'has_unclaimed_invite', olderThanHours: 24 * 3 }],
          actions: [{ type: 'send_invite_reminder', channel: 'both', maxPerRun: 40, olderThanHours: 24 * 3 }],
          rollingHorizonDays: 14,
          meta: { templateId: 'tpl_invite' },
        }),
      },
      {
        id: 'tpl_bundle_nudge',
        title: 'Bundle nudge agent',
        description: 'Adds nudge signals for partners with blocked tasks or tasks due soon.',
        makeRule: () => ({
          name: 'Bundle nudge agent',
          enabled: true,
          trigger: { type: 'interval', everyHours: 6 },
          conditions: [{ type: 'always' }],
          actions: [{ type: 'bundle_nudge', maxPerRun: 60, dueSoonDays: 3 }],
          rollingHorizonDays: 14,
          meta: { templateId: 'tpl_bundle_nudge' },
        }),
      },
      {
        id: 'tpl_5y_milestones',
        title: '5‑year milestones (run once)',
        description: 'Creates a 2–5 year cadence of “check-in” tasks (manual trigger; run once per cohort).',
        makeRule: () => ({
          name: '5‑year milestones (run once)',
          enabled: true,
          trigger: { type: 'manual' },
          conditions: [{ type: 'always' }],
          actions: [
            { type: 'create_task', title: 'Milestone: 30‑day check-in', kind: 'general', dueInDays: 30, tags: ['milestone', '5y'] },
            { type: 'create_task', title: 'Milestone: 90‑day progress review', kind: 'review_results', dueInDays: 90, tags: ['milestone', '5y'] },
            { type: 'create_task', title: 'Milestone: 6‑month optimization', kind: 'general', dueInDays: 180, tags: ['milestone', '5y'] },
            { type: 'create_task', title: 'Milestone: 1‑year credit + funding review', kind: 'review_results', dueInDays: 365, tags: ['milestone', '5y'] },
            { type: 'create_task', title: 'Milestone: 2‑year expansion review', kind: 'review_results', dueInDays: 730, tags: ['milestone', '5y'] },
            { type: 'create_task', title: 'Milestone: 3‑year strategy refresh', kind: 'general', dueInDays: 1095, tags: ['milestone', '5y'] },
            { type: 'create_task', title: 'Milestone: 4‑year scale plan', kind: 'general', dueInDays: 1460, tags: ['milestone', '5y'] },
            { type: 'create_task', title: 'Milestone: 5‑year wealth checkpoint', kind: 'review_results', dueInDays: 1825, tags: ['milestone', '5y'] },
          ],
          rollingHorizonDays: 3650,
          meta: { templateId: 'tpl_5y_milestones', caution: 'Run once per cohort (creates long-horizon tasks).' },
        }),
      },
    ],
    [],
  );

  const selectedRule = useMemo(() => (selectedRuleId ? rules.find((r) => r.id === selectedRuleId) ?? null : null), [rules, selectedRuleId]);

  useEffect(() => {
    if (!autopilot) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (running) return;
      setRunning(true);
      try {
        const runs = await runDueAutomations(mode);
        if (runs.length) setNotice(`Autopilot: ran ${runs.length} due rule(s).`);
        setVersion((v) => v + 1);
      } catch (e: any) {
        setNotice(`Autopilot: ${e?.message || 'Run failed'}`);
      } finally {
        setRunning(false);
      }
    };
    // Kick once, then run on interval while page is open.
    tick();
    const t = window.setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autopilot, mode]);

  async function runOne(rule: AutomationRule) {
    setRunning(true);
    setNotice(null);
    try {
      const run = await runAutomationRule(rule, mode);
      setNotice(`${rule.name}: ${run.summary}`);
      setSelectedRuleId(rule.id);
      setVersion((v) => v + 1);
    } catch (e: any) {
      setNotice(`${rule.name}: ${e?.message || 'Run failed'}`);
    } finally {
      setRunning(false);
    }
  }

  async function runAll() {
    setRunning(true);
    setNotice(null);
    try {
      const runs = await runDueAutomations(mode);
      setNotice(`Automations: ran ${runs.length} due rule(s).`);
      setVersion((v) => v + 1);
    } catch (e: any) {
      setNotice(e?.message || 'Run failed');
    } finally {
      setRunning(false);
    }
  }

  async function runAllForce() {
    setRunning(true);
    setNotice(null);
    try {
      const runs = await runAllEnabledAutomations(mode);
      setNotice(`Automations: force-ran ${runs.length} enabled rule(s).`);
      setVersion((v) => v + 1);
    } catch (e: any) {
      setNotice(e?.message || 'Run failed');
    } finally {
      setRunning(false);
    }
  }

  const inviteDeliveryOn = isFeatureEnabled('inviteDelivery');
  const aiOn = isFeatureEnabled('aiGateway');

  function normalizeGeneratedRule(raw: any): Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'> {
    const r = raw?.rule ?? raw;
    if (!r || typeof r !== 'object') throw new Error('AI output is not an object.');

    const name = String(r.name || '').trim();
    if (!name) throw new Error('AI rule missing name.');

    const enabled = typeof r.enabled === 'boolean' ? r.enabled : true;
    const trigger = r.trigger;
    if (!trigger || typeof trigger !== 'object') throw new Error('AI rule missing trigger.');
    if (trigger.type !== 'manual' && trigger.type !== 'interval') throw new Error('AI trigger.type must be manual|interval.');
    if (trigger.type === 'interval') {
      const everyHours = Number(trigger.everyHours);
      if (!Number.isFinite(everyHours) || everyHours <= 0) throw new Error('AI trigger.everyHours must be a positive number.');
    }

    const conditions = Array.isArray(r.conditions) ? r.conditions : [{ type: 'always' }];
    const actions = Array.isArray(r.actions) ? r.actions : [];
    if (!actions.length) throw new Error('AI rule missing actions[].');

    return {
      name,
      enabled,
      trigger,
      conditions,
      actions,
      rollingHorizonDays: typeof r.rollingHorizonDays === 'number' ? r.rollingHorizonDays : undefined,
      meta: { ...(r.meta ?? {}), generatedBy: 'ai_copilot' },
    };
  }

  return (
    <PageShell
      badge="Admin"
      title="Automation Studio"
      subtitle="Build long-horizon automations and run “agents” that keep partners moving automatically."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'dry_run' ? 'live' : 'dry_run'))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              title="Toggle dry-run / live"
            >
              {mode === 'dry_run' ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
              {mode === 'dry_run' ? 'Dry‑run' : 'Live'}
            </button>
            <button
              type="button"
              onClick={() => setAutopilot((x) => !x)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              title="Run due interval rules every minute while this page is open"
            >
              {autopilot ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              Autopilot {autopilot ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              onClick={runAll}
              disabled={running}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
            >
              <PlayCircle size={16} /> Run due
            </button>
            <button
              type="button"
              onClick={runAllForce}
              disabled={running}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60"
              title="Run all enabled rules regardless of trigger timing"
            >
              <PlayCircle size={16} /> Force run
            </button>
          </div>
        </div>

        {notice && <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white/75 text-sm whitespace-pre-wrap">{notice}</div>}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Bot size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Templates</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">starter agents</div>
            </div>

            <div className="mt-4 space-y-3">
              {aiOn && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-amber-400">
                      <Sparkles size={16} />
                      <div className="text-[10px] font-black uppercase tracking-widest">AI Copilot</div>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">aiGateway: ON</div>
                  </div>

                  <div className="mt-3 text-white/60 text-sm">
                    Describe the automation in plain English. Copilot generates a real rule you can run (Dry-run/Live).
                  </div>

                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    placeholder="Example: Every 7 days, if partner has open tasks, send a portal message reminding them to complete the next 3 tasks. Dedupe within 48 hours."
                    className="mt-3 w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 resize-y"
                  />

                  {aiPreview && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">preview</div>
                      <pre className="mt-2 text-[11px] text-white/70 whitespace-pre-wrap break-words">{aiPreview}</pre>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={aiBusy || !aiPrompt.trim()}
                      onClick={async () => {
                        setAiBusy(true);
                        setNotice(null);
                        setAiPreview(null);
                        try {
                          const res = await callAiGateway({
                            taskType: 'automation.rule.generate',
                            responseFormat: 'json',
                            messages: [
                              {
                                role: 'system',
                                content:
                                  'You generate Automation Studio rules as strict JSON.\n' +
                                  'Return ONLY a JSON object (no markdown, no commentary).\n' +
                                  'Schema: { name, enabled, trigger:{type:"manual"|"interval", everyHours?}, conditions:[...], actions:[...], rollingHorizonDays?, meta? }.\n' +
                                  'Allowed actions: run_workflow, create_task, send_invite_reminder, bundle_nudge, send_comms_template.\n' +
                                  'If you use send_comms_template, include: {type:"send_comms_template", templateId, channel?, dedupeWithinHours?, maxPerRun?}.\n' +
                                  'Keep it safe: include dedupeWithinHours for comms.',
                              },
                              { role: 'user', content: aiPrompt.trim() },
                            ],
                          });

                          const parsed = (() => {
                            try {
                              return JSON.parse(res.text);
                            } catch {
                              return extractFirstJsonObject(res.text);
                            }
                          })();
                          const rule = normalizeGeneratedRule(parsed);
                          setAiPreview(JSON.stringify(rule, null, 2));
                          const created = createAutomationRule(rule);
                          setSelectedRuleId(created.id);
                          setNotice(`AI Copilot created rule: ${created.name}`);
                          setVersion((v) => v + 1);
                        } catch (e: any) {
                          setNotice(e?.message || 'AI Copilot failed.');
                        } finally {
                          setAiBusy(false);
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
                    >
                      <Sparkles size={16} /> {aiBusy ? 'Generating…' : 'Generate rule'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiPrompt('');
                        setAiPreview(null);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {templates.map((t) => (
                <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white font-semibold">{t.title}</div>
                      <div className="mt-1 text-white/60 text-sm">{t.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const created = createAutomationRule(t.makeRule());
                        setSelectedRuleId(created.id);
                        setNotice(`Created rule: ${created.name}`);
                        setVersion((v) => v + 1);
                      }}
                      className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-[10px] font-black uppercase tracking-widest text-amber-200 transition-all"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-emerald-300">
                  <ShieldCheck size={16} />
                  <div className="text-[10px] font-black uppercase tracking-widest">Delivery checks</div>
                </div>
                <div className="mt-2 text-white/65 text-sm">
                  Invite reminders require <span className="font-semibold text-white">Invite Delivery</span> feature flag.
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  inviteDelivery: {inviteDeliveryOn ? 'ON' : 'OFF'}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-white font-semibold">Quick builder</div>
                <div className="mt-1 text-white/60 text-sm">Create a rule that generates a task for matching partners.</div>

                <div className="mt-4 grid gap-3">
                  <label className="grid gap-1">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Rule name</div>
                    <input
                      value={qbName}
                      onChange={(e) => setQbName(e.target.value)}
                      className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30"
                    />
                  </label>

                  <label className="grid gap-1">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Task title</div>
                    <input
                      value={qbTaskTitle}
                      onChange={(e) => setQbTaskTitle(e.target.value)}
                      className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Task kind</div>
                      <select
                        value={qbTaskKind}
                        onChange={(e) => setQbTaskKind(e.target.value as any)}
                        className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white"
                      >
                        <option value="general">general</option>
                        <option value="upload_document">upload_document</option>
                        <option value="review_results">review_results</option>
                        <option value="follow_up">follow_up</option>
                        <option value="mail_letter">mail_letter</option>
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Due in (days)</div>
                      <input
                        type="number"
                        value={qbDueDays}
                        min={0}
                        onChange={(e) => setQbDueDays(Number(e.target.value))}
                        className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const created = createAutomationRule({
                        name: (qbName || '').trim() || 'Custom task automation',
                        enabled: true,
                        trigger: { type: 'manual' },
                        conditions: [{ type: 'always' }],
                        actions: [
                          {
                            type: 'create_task',
                            title: (qbTaskTitle || '').trim() || 'Next step task',
                            kind: qbTaskKind,
                            dueInDays: Number.isFinite(qbDueDays) ? Math.max(0, qbDueDays) : 0,
                            notes: 'Automation Studio: quick builder rule.',
                            tags: ['automation', 'quick_builder'],
                          },
                        ],
                        rollingHorizonDays: 90,
                        meta: { templateId: 'quick_builder' },
                      });
                      setSelectedRuleId(created.id);
                      setNotice(`Created rule: ${created.name} (manual trigger). Click Run.`);
                      setVersion((v) => v + 1);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                  >
                    <Plus size={16} /> Create rule
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <RefreshCw size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Rules</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{rules.length} configured</div>
            </div>

            <div className="mt-4 space-y-2 max-h-[520px] overflow-y-auto">
              {rules.length === 0 ? (
                <div className="text-white/60 text-sm">No automations yet. Add one from Templates.</div>
              ) : (
                rules.map((r) => {
                  const due = isAutomationRuleDue(r);
                  const last = (r.meta as any)?.lastRunAt as string | undefined;
                  return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRuleId(r.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      selectedRuleId === r.id ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{r.name}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {r.enabled ? 'enabled' : 'disabled'} • trigger {r.trigger.type === 'interval' ? `every ${r.trigger.everyHours}h` : r.trigger.type}
                          {due ? ' • DUE' : ''}
                          {last ? ` • last ${fmtIso(last)}` : ''}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAutomationRuleEnabled(r.id, !r.enabled);
                            setVersion((v) => v + 1);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        >
                          {r.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          {r.enabled ? 'On' : 'Off'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            runOne(r);
                          }}
                          disabled={running}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
                        >
                          <PlayCircle size={16} /> Run
                        </button>
                      </div>
                    </div>
                  </button>
                );
                })
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            {selectedRule ? (
              <AutomationRuleEditor
                rule={selectedRule}
                commsTemplates={commsTemplates}
                onSave={(next) => {
                  upsertAutomationRule(next);
                  setNotice(`Saved: ${next.name}`);
                  setVersion((v) => v + 1);
                }}
                onDelete={(id) => {
                  const ok = deleteAutomationRule(id);
                  setNotice(ok ? 'Rule deleted.' : 'Rule not found.');
                  setSelectedRuleId(null);
                  setVersion((v) => v + 1);
                }}
              />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
                <div className="text-white font-semibold">Rule editor</div>
                <div className="mt-2 text-white/60 text-sm">Select a rule to edit.</div>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
              <div className="text-white font-semibold">Raw JSON</div>
              <div className="mt-2 text-white/60 text-sm">Debug view (read-only).</div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                <pre className="text-[11px] text-white/70 whitespace-pre-wrap break-words">{selectedRule ? compactJson(selectedRule) : 'Select a rule'}</pre>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
            <div className="text-white font-semibold">Run logs</div>
            <div className="mt-2 text-white/60 text-sm">Latest executions (dry-run or live).</div>
            <div className="mt-4 space-y-2 max-h-[360px] overflow-y-auto">
              {runs.length === 0 ? (
                <div className="text-white/60 text-sm">No runs yet.</div>
              ) : (
                runs.map((r) => {
                  const isOpen = expandedRunId === r.id;
                  return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setExpandedRunId((cur) => (cur === r.id ? null : r.id))}
                    className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{rules.find((x) => x.id === r.ruleId)?.name ?? r.ruleId}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {r.mode} • {fmtIso(r.startedAt)}
                        </div>
                        <div className="mt-2 text-white/70 text-sm">{r.summary}</div>
                      </div>
                      <div className="shrink-0 text-[10px] uppercase tracking-widest text-white/40 font-mono">{r.actions.length} actions</div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3 space-y-2">
                        {r.actions.map((a, i) => (
                          <div key={i} className="text-white/70 text-sm">
                            <span className={`font-mono text-[10px] uppercase tracking-widest ${a.type === 'warn' ? 'text-rose-200' : 'text-white/50'}`}>
                              {a.type}
                            </span>{' '}
                            <span className="whitespace-pre-wrap">
                              {(() => {
                                switch (a.type) {
                                  case 'info':
                                  case 'warn':
                                    return a.message;
                                  case 'created_task':
                                    return `${a.partnerId}: ${a.title}`;
                                  case 'sent_invite':
                                    return `${a.partnerId}: invite ${a.channel} → ${a.to}`;
                                  default:
                                    return '';
                                }
                              })()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

