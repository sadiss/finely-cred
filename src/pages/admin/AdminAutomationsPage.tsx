import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, FileText, LayoutTemplate, Mail, PlayCircle, Plus, RefreshCw, ScrollText, Server, ShieldAlert, ShieldCheck, Sparkles, ToggleLeft, ToggleRight, Workflow } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { AutomationRule, AgentMode } from '../../domain/automationStudio';
import { createAutomationRule, deleteAutomationRule, listAutomationRules, listAutomationRuns, setAutomationRuleEnabled, upsertAutomationRule } from '../../data/automationStudioRepo';
import { isAutomationRuleDue, runAutomationRule, runAllEnabledAutomations, runDueAutomations } from '../../automation/agentRunner';
import { startPlatformCronAutopilot, stopPlatformCronAutopilot } from '../../lib/platformCron';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { callAiGateway } from '../../lib/aiClient';
import { extractFirstJsonObject } from '../../utils/jsonExtract';
import { listCommsTemplates } from '../../data/commsRepo';
import { AutomationRuleEditor } from '../../components/automation/AutomationRuleEditor';
import { AutomationStudioShell } from '../../features/automation/AutomationStudioShell';
import { AUTOMATION_EVENT_RECIPES, AUTOMATION_OPS_RECIPES } from '../../features/automation/automationRecipeLibrary';
import { FINELY_MAIL_COPY } from '../../lib/mailWhiteLabel';
import { HUMAN_AUTOMATION_RECIPES } from '../../features/automation/humanAutomationCatalog';
import { AUTOMATION_TRIGGER_CATALOG } from '../../features/automation/automationTriggerCatalog';
import { listServerAutomationHooks, runServerAutomationCronSweep } from '../../lib/serverAutomationClient';
import { pingServerPlatformCron, tickServerPlatformCron } from '../../lib/serverPlatformCronClient';
import { getLastPlatformCronResult } from '../../lib/platformCronStore';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { listAutomationEnrollments } from '../../data/automationStudioRepo';
import { autopilotQueueKpis } from '../../data/automationOpsQueue';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_NOTICE,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsInlineListItem,
  finelyOsListItem,
  finelyOsKpiTile,
  FINELY_OS_VIEW_TABS,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

type StudioTab = 'studio' | 'library' | 'logs' | 'autopilot';

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

const RECIPE_TEMPLATES: TemplateSpec[] = [...AUTOMATION_EVENT_RECIPES, ...AUTOMATION_OPS_RECIPES].map((r) => ({
  id: r.id,
  title: r.title,
  description: `[${r.category}] ${r.description}`,
  makeRule: r.makeRule,
}));

const LEGACY_TEMPLATES: TemplateSpec[] = [
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
    id: 'tpl_sla_escalation',
    title: 'Work OS SLA escalation',
    description: 'Creates high-priority follow-up tasks + CRM timeline notes for SLA breaches (cross-OS).',
    makeRule: () => ({
      name: 'Work OS SLA escalation',
      enabled: true,
      trigger: { type: 'interval', everyHours: 6 },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'sla_escalation', maxPerRun: 20, minHoursLate: 4 }],
      rollingHorizonDays: 30,
      meta: { templateId: 'tpl_sla_escalation' },
    }),
  },
  {
    id: 'tpl_crm_sequence_tick',
    title: 'CRM sequence runner',
    description: 'Executes due CRM follow-up steps — email notes, Work tasks, and stage moves with routing.',
    makeRule: () => ({
      name: 'CRM sequence runner',
      enabled: true,
      trigger: { type: 'interval', everyHours: 4 },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'crm_sequence_tick', maxPerRun: 30 }],
      rollingHorizonDays: 30,
      meta: { templateId: 'tpl_crm_sequence_tick' },
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
];

const HUMAN_TEMPLATES: TemplateSpec[] = HUMAN_AUTOMATION_RECIPES.map((r) => ({
  id: r.id,
  title: r.title,
  description: `[Human · ${r.category}] ${r.description}`,
  makeRule: r.makeRule,
}));

const ALL_AUTOMATION_TEMPLATES: TemplateSpec[] = [...RECIPE_TEMPLATES, ...HUMAN_TEMPLATES, ...LEGACY_TEMPLATES];

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
  const [pageTab, setPageTab] = useState<StudioTab>('studio');
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [serverHooks, setServerHooks] = useState<Array<{ eventType: string; ruleId: string; name: string; actions?: string[] }>>([]);
  const [hooksLoading, setHooksLoading] = useState(false);
  const [serverCronSteps, setServerCronSteps] = useState<string[]>([]);
  const [serverCronMsg, setServerCronMsg] = useState<string | null>(null);
  const [serverCronBusy, setServerCronBusy] = useState(false);
  const lastClientCron = useMemo(() => getLastPlatformCronResult(), [version, running]);

  useEffect(() => {
    let cancelled = false;
    setHooksLoading(true);
    void listServerAutomationHooks().then((hooks) => {
      if (!cancelled) {
        setServerHooks(hooks);
        setHooksLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const rules = useMemo(() => listAutomationRules(), [version]);
  const runs = useMemo(() => listAutomationRuns(60), [version]);
  const commsTemplates = useMemo(() => listCommsTemplates(), [version]);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const templates: TemplateSpec[] = ALL_AUTOMATION_TEMPLATES;

  const selectedRule = useMemo(() => (selectedRuleId ? rules.find((r) => r.id === selectedRuleId) ?? null : null), [rules, selectedRuleId]);
  const enrollments = useMemo(() => listAutomationEnrollments(), [version]);

  useEffect(() => {
    if (!selectedRuleId && rules.length) setSelectedRuleId(rules[0].id);
  }, [rules, selectedRuleId]);
  const activeEnrollments = enrollments.filter((e) => e.status === 'active').length;
  const runsToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return runs.filter((r) => Date.parse(r.startedAt) >= start.getTime()).length;
  }, [runs]);

  useEffect(() => {
    if (!autopilot) {
      stopPlatformCronAutopilot();
      return;
    }
    return startPlatformCronAutopilot({
      mode,
      intervalMs: 60_000,
      onTick: (result) => {
        const autoCount = result.automations.length;
        const nurtureCount = result.nurture.length;
        if (autoCount || nurtureCount) {
          setNotice(`Autopilot: ${autoCount} automation(s), ${nurtureCount} nurture step(s).`);
        }
        setVersion((v) => v + 1);
      },
    });
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
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setMode((m) => (m === 'dry_run' ? 'live' : 'dry_run'))} className={FINELY_OS_SECONDARY_BTN} title="Toggle dry-run / live">
              {mode === 'dry_run' ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
              {mode === 'dry_run' ? 'Dry‑run' : 'Live'}
            </button>
            <button type="button" onClick={() => setAutopilot((x) => !x)} className={FINELY_OS_SECONDARY_BTN} title="Run due interval rules every minute while this page is open">
              {autopilot ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              Autopilot {autopilot ? 'On' : 'Off'}
            </button>
            <button type="button" onClick={runAll} disabled={running} className={FINELY_OS_SUCCESS_BTN}>
              <PlayCircle size={16} /> Run due
            </button>
            <button type="button" onClick={runAllForce} disabled={running} className={FINELY_OS_PRIMARY_BTN} title="Run all enabled rules regardless of trigger timing">
              <PlayCircle size={16} /> Force run
            </button>
          </div>
        </div>

        <FinelyUnifiedHubLayout
          eyebrow="Automation OS"
          title="Automation Studio"
          subtitle="Canvas workflows, template library, run logs, and hands-free ops — one tab at a time."
          accent="fuchsia"
          kpis={[
            { label: 'Rules', value: String(rules.length), accent: 'violet' },
            { label: 'Enabled', value: String(rules.filter((r) => r.enabled).length), accent: 'emerald' },
            { label: 'Runs today', value: String(runsToday), accent: 'amber' },
            { label: 'Enrollments', value: String(activeEnrollments), accent: 'fuchsia', hint: 'Active flows' },
          ]}
          tabs={[
            { id: 'studio', label: 'Canvas studio' },
            { id: 'library', label: 'Template library' },
            { id: 'logs', label: 'Run logs' },
            { id: 'autopilot', label: 'Hands-free ops' },
          ]}
          activeTab={pageTab}
          onTabChange={(id) => setPageTab(id as StudioTab)}
          primaryAction={{ label: 'Run due', onClick: () => { void runAll(); } }}
          secondaryAction={{ label: 'Ops command center', onClick: () => navigate('/admin/workflow') }}
          detailSlot={
            <p className={FINELY_OS_ENTITY_BODY}>
              GoHighLevel-class automation canvas — drag triggers, conditions, and actions. Event triggers (CRM, Meta, forms) expand in catalog; runner executes interval + manual today.
            </p>
          }
          detailLabel="How automation works"
        >
          {notice ? <div className={FINELY_OS_NOTICE}>{notice}</div> : null}

        {pageTab === 'studio' ? (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3">
              <FinelyOsGlassPanel icon={Workflow} title="Automations" subtitle={`${rules.length} workflows`} accent="violet" iconAccent="violet" variant="catalog">
                <button
                  type="button"
                  onClick={() => {
                    const created = createAutomationRule({
                      name: 'New workflow',
                      enabled: true,
                      trigger: { type: 'manual' },
                      conditions: [{ type: 'always' }],
                      actions: [{ type: 'create_task', title: 'First step', kind: 'general' }],
                    });
                    setSelectedRuleId(created.id);
                    setPageTab('studio');
                    setVersion((v) => v + 1);
                  }}
                  className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center mb-4`}
                >
                  <Plus size={14} /> New workflow
                </button>
                <FinelyOsPaginatedStack
                  items={rules}
                  pageSize={10}
                  emptyMessage="No workflows yet — add from Template library."
                  renderItem={(r) => {
                    const due = isAutomationRuleDue(r);
                    const last = (r.meta as any)?.lastRunAt as string | undefined;
                    return (
                      <button key={r.id} type="button" onClick={() => setSelectedRuleId(r.id)} className={finelyOsListItem(selectedRuleId === r.id, 'fuchsia')}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold truncate text-sm`}>{r.name}</div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                              {r.enabled ? 'on' : 'off'} • {r.trigger.type === 'interval' ? `${r.trigger.everyHours}h` : r.trigger.type}
                              {due ? ' • due' : ''}
                            </div>
                            {last ? <div className={`mt-1 text-[10px] ${FINELY_OS_ENTITY_SUBLABEL}`}>Last {fmtIso(last)}</div> : null}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAutomationRuleEnabled(r.id, !r.enabled);
                                setVersion((v) => v + 1);
                              }}
                              className={FINELY_OS_SECONDARY_BTN}
                            >
                              {r.enabled ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                            </button>
                            <button type="button" disabled={running} onClick={(e) => { e.stopPropagation(); void runOne(r); }} className={FINELY_OS_SUCCESS_BTN}>
                              <PlayCircle size={12} />
                            </button>
                          </div>
                        </div>
                      </button>
                    );
                  }}
                />
              </FinelyOsGlassPanel>
            </div>
            <div className="lg:col-span-9 space-y-4">
              {selectedRule ? (
                <>
                  <AutomationStudioShell
                    rule={selectedRule}
                    height={720}
                    onRuleChange={(next) => {
                      upsertAutomationRule(next);
                      setVersion((v) => v + 1);
                    }}
                    onDelete={(id) => {
                      const ok = deleteAutomationRule(id);
                      setNotice(ok ? 'Rule deleted.' : 'Rule not found.');
                      setSelectedRuleId(null);
                      setVersion((v) => v + 1);
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setShowAdvancedEditor((x) => !x)} className={FINELY_OS_SECONDARY_BTN}>
                      {showAdvancedEditor ? 'Hide' : 'Show'} advanced form editor
                    </button>
                  </div>
                  {showAdvancedEditor ? (
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
                  ) : null}
                </>
              ) : (
                <FinelyOsGlassPanel icon={Workflow} title="Select a workflow" accent="violet">
                  <p className={FINELY_OS_ENTITY_BODY}>Pick an automation from the left sidebar or create one from the Template library tab.</p>
                </FinelyOsGlassPanel>
              )}
            </div>
          </div>
        ) : null}

        {pageTab === 'library' ? (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <FinelyOsGlassPanel icon={Sparkles} title="Templates & triggers" subtitle="Starter agents + GHL-style trigger catalog." accent="amber" iconAccent="amber" variant="catalog">
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony mb-4 space-y-2`}>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>Server hooks (edge automation-runner)</div>
              {hooksLoading ? (
                <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Loading server hooks…</p>
              ) : serverHooks.length ? (
                <div className="grid sm:grid-cols-2 gap-2">
                  {serverHooks.map((h) => (
                    <div key={h.ruleId} className={`${finelyOsInlineListItem()} px-3 py-2 text-xs`}>
                      <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{h.name}</div>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-0.5 font-mono`}>{h.eventType} · {h.ruleId}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>No server hooks — deploy automation-runner and connect Supabase to list edge hooks.</p>
              )}
            </div>
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony mb-4 space-y-2`}>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono inline-flex items-center gap-2`}>
                <Server size={12} /> Server cron (platform-cron edge)
              </div>
              {lastClientCron ? (
                <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  Last browser tick: {new Date(lastClientCron.at).toLocaleString()} · nurture {lastClientCron.nurture.length} · automations {lastClientCron.automations.length}
                  {lastClientCron.partnerDigest?.sent ? ` · ${lastClientCron.partnerDigest.sent} partner digest(s)` : ''}
                </p>
              ) : (
                <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Enable Autopilot or run a manual tick to execute client-side cron steps.</p>
              )}
              {serverCronSteps.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {serverCronSteps.map((step) => (
                    <span key={step} className={`${finelyOsInlineListItem()} px-2 py-1 text-[10px] font-mono`}>
                      {step}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={serverCronBusy}
                  onClick={() => {
                    setServerCronBusy(true);
                    void pingServerPlatformCron()
                      .then((res) => {
                        if (!res.ok) {
                          setServerCronMsg('Unreachable — deploy platform-cron (see docs/PLATFORM_CRON.md).');
                          setServerCronSteps([]);
                          return;
                        }
                        setServerCronSteps(res.steps ?? []);
                        setServerCronMsg(`${res.steps?.length ?? 0} steps · voice ${res.voicePipelineVersion ?? 'v1'}`);
                      })
                      .finally(() => setServerCronBusy(false));
                  }}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  Ping server
                </button>
                <button
                  type="button"
                  disabled={serverCronBusy}
                  onClick={() => {
                    setServerCronBusy(true);
                    void tickServerPlatformCron({ dryRun: true, source: 'admin_automations', runAutomationSweep: true })
                      .then((res) => {
                        if (!res.ok) {
                          setServerCronMsg('Server tick failed.');
                          return;
                        }
                        if (res.steps?.length) setServerCronSteps(res.steps);
                        const auto = res.automationSweep?.ok
                          ? ` · ${res.automationSweep.hooksMatched ?? 0} hooks · ${res.nurture?.candidates ?? 0} nurture`
                          : '';
                        setServerCronMsg((res.message ?? `Tick ${res.at ? new Date(res.at).toLocaleTimeString() : 'ok'}`) + auto);
                      })
                      .finally(() => setServerCronBusy(false));
                  }}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  Dry-run tick
                </button>
                <button
                  type="button"
                  disabled={serverCronBusy}
                  onClick={() => {
                    setServerCronBusy(true);
                    void runServerAutomationCronSweep({ dryRun: true })
                      .then((res) => {
                        setServerCronMsg(
                          res.ok
                            ? `Automation sweep: ${res.hooksMatched} hooks · ${res.leadsScanned} leads · nurture ${res.nurtureProcess?.emailsSent ?? 0} emails · rules ${res.automationRules?.executed ?? 0}/${res.automationRules?.due ?? 0}`
                            : res.error ?? 'Automation sweep failed',
                        );
                      })
                      .finally(() => setServerCronBusy(false));
                  }}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  Automation sweep
                </button>
              </div>
              {serverCronMsg ? <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>{serverCronMsg}</p> : null}
            </div>
            <div className="mb-4 grid sm:grid-cols-2 gap-2">
              {AUTOMATION_TRIGGER_CATALOG.slice(0, 6).map((t) => (
                <div key={t.id} className={`${finelyOsInlineListItem()} px-3 py-2 text-xs`}>
                  <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{t.label}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-0.5`}>{t.tier === 'live' ? 'Live' : 'Preview'}</div>
                </div>
              ))}
            </div>
              {aiOn && (
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-emerald-300">
                      <Sparkles size={16} />
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>AI Copilot</div>
                    </div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>aiGateway: ON</div>
                  </div>

                  <div className={FINELY_OS_ENTITY_BODY}>
                    Describe the automation in plain English. Copilot generates a real rule you can run (Dry-run/Live).
                  </div>

                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    placeholder="Example: Every 7 days, if partner has open tasks, send a portal message reminding them to complete the next 3 tasks. Dedupe within 48 hours."
                    className={`${FINELY_OS_ENTITY_SELECT} resize-y min-h-[120px]`}
                  />

                  {aiPreview && (
                    <div className={`${finelyOsCatalogCard('sky')} !p-3 fc-surface-harmony`} data-fc-accent="sky">
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>preview</div>
                      <pre className={`mt-2 text-[11px] whitespace-pre-wrap break-words ${FINELY_OS_ENTITY_BODY}`}>{aiPreview}</pre>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
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
                          setPageTab('studio');
                          setNotice(`AI Copilot created rule: ${created.name}`);
                          setVersion((v) => v + 1);
                        } catch (e: any) {
                          setNotice(e?.message || 'AI Copilot failed.');
                        } finally {
                          setAiBusy(false);
                        }
                      }}
                      className={FINELY_OS_PRIMARY_BTN}
                    >
                      <Sparkles size={16} /> {aiBusy ? 'Generating…' : 'Generate rule'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiPrompt('');
                        setAiPreview(null);
                      }}
                      className={FINELY_OS_SECONDARY_BTN}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {templates.map((t) => (
                <div key={t.id} className={`${finelyOsInlineListItem()} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={FINELY_OS_ENTITY_VALUE}>{t.title}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{t.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const created = createAutomationRule(t.makeRule());
                        setSelectedRuleId(created.id);
                        setPageTab('studio');
                        setNotice(`Created rule: ${created.name}`);
                        setVersion((v) => v + 1);
                      }}
                      className={`shrink-0 ${FINELY_OS_PRIMARY_BTN}`}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              ))}

              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                <div className="flex items-center gap-2 text-emerald-300">
                  <ShieldCheck size={16} />
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Delivery checks</div>
                </div>
                <div className={FINELY_OS_ENTITY_BODY}>
                  Invite reminders require <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Invite Delivery</span> feature flag.
                </div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                  inviteDelivery: {inviteDeliveryOn ? 'ON' : 'OFF'}
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
                <div className={FINELY_OS_ENTITY_VALUE}>Quick builder</div>
                <div className={FINELY_OS_ENTITY_BODY}>Create a rule that generates a task for matching partners.</div>

                <div className="grid gap-3">
                  <label className="grid gap-1">
                    <div className={FINELY_OS_ENTITY_LABEL}>Rule name</div>
                    <input
                      value={qbName}
                      onChange={(e) => setQbName(e.target.value)}
                      className={FINELY_OS_ENTITY_INPUT}
                    />
                  </label>

                  <label className="grid gap-1">
                    <div className={FINELY_OS_ENTITY_LABEL}>Task title</div>
                    <input
                      value={qbTaskTitle}
                      onChange={(e) => setQbTaskTitle(e.target.value)}
                      className={FINELY_OS_ENTITY_INPUT}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1">
                      <div className={FINELY_OS_ENTITY_LABEL}>Task kind</div>
                      <select
                        value={qbTaskKind}
                        onChange={(e) => setQbTaskKind(e.target.value as any)}
                        className={FINELY_OS_ENTITY_SELECT}
                      >
                        <option value="general">general</option>
                        <option value="upload_document">upload_document</option>
                        <option value="review_results">review_results</option>
                        <option value="follow_up">follow_up</option>
                        <option value="mail_letter">mail_letter</option>
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <div className={FINELY_OS_ENTITY_LABEL}>Due in (days)</div>
                      <input
                        type="number"
                        value={qbDueDays}
                        min={0}
                        onChange={(e) => setQbDueDays(Number(e.target.value))}
                        className={FINELY_OS_ENTITY_INPUT}
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
                      setPageTab('studio');
                      setNotice(`Created rule: ${created.name} (manual trigger). Click Run.`);
                      setVersion((v) => v + 1);
                    }}
                    className={FINELY_OS_PRIMARY_BTN}
                  >
                    <Plus size={16} /> Create rule
                  </button>
                </div>
              </div>
            </FinelyOsGlassPanel>
          </div>
        </div>
        ) : null}

        {pageTab === 'logs' ? (
          <FinelyOsGlassPanel icon={RefreshCw} title="Run logs" subtitle="Latest executions (dry-run or live)." accent="emerald" iconAccent="emerald">
            <div className="mt-2">
              <FinelyOsPaginatedStack
                items={runs}
                pageSize={8}
                emptyMessage="No runs yet."
                renderItem={(r) => {
                  const isOpen = expandedRunId === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setExpandedRunId((cur) => (cur === r.id ? null : r.id))}
                      className={finelyOsListItem(isOpen, 'emerald')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold truncate`}>{rules.find((x) => x.id === r.ruleId)?.name ?? r.ruleId}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                            {r.mode} • {fmtIso(r.startedAt)}
                          </div>
                          <div className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>{r.summary}</div>
                        </div>
                        <div className={`shrink-0 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{r.actions.length} actions</div>
                      </div>
                      {isOpen ? (
                        <div className={`mt-3 space-y-2 ${finelyOsCatalogCard('emerald')} !p-4 fc-surface-harmony`}>
                          {r.actions.map((a, i) => (
                            <div key={i} className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                              <span className={`font-mono text-[10px] uppercase tracking-widest ${a.type === 'warn' ? 'text-rose-300' : FINELY_OS_ENTITY_SUBLABEL}`}>
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
                      ) : null}
                    </button>
                  );
                }}
              />
            </div>
          </FinelyOsGlassPanel>
        ) : null}

        {pageTab === 'autopilot' ? (
          <FinelyOsGlassPanel icon={Bot} title="Hands-free ops" subtitle="Draft review, mail confirm, staff coverage" accent="amber">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {(() => {
                const k = autopilotQueueKpis();
                return (
                  <>
                    <FinelyOsOverviewStatTile icon={FileText} label="Draft review" value={String(k.draftReview)} accent="amber" iconAccent="amber" />
                    <FinelyOsOverviewStatTile icon={Mail} label="Mail confirm" value={String(k.mailConfirm)} accent="violet" iconAccent="violet" />
                    <FinelyOsOverviewStatTile icon={ShieldAlert} label="Escalations" value={String(k.complaint)} accent="rose" iconAccent="rose" />
                    <FinelyOsOverviewStatTile icon={Bot} label="Queue total" value={String(k.total)} accent="emerald" iconAccent="emerald" />
                  </>
                );
              })()}
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm mb-4`}>
              Enable recipes like <strong className="text-white/80">Report upload → auto-draft</strong> in Template library. {FINELY_MAIL_COPY.humanConfirm}
            </p>
            <button type="button" onClick={() => navigate('/admin/ops-autopilot')} className={FINELY_OS_PRIMARY_BTN}>
              Open Hands-Free Ops command center
            </button>
          </FinelyOsGlassPanel>
        ) : null}

        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}

