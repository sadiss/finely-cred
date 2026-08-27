import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Check,
  ClipboardCheck,
  Crown,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isFeatureEnabled } from '../../../../data/settingsRepo';
import { callAiGateway } from '../../../../lib/aiClient';
import { listPartnersByTenant } from '../../../../data/partnersRepo';
import { listLeadCaptures } from '../../../../data/leadsRepo';
import { listCases } from '../../../../data/casesRepo';
import { listTasks } from '../../../../data/tasksRepo';
import { listAgreementsByTenant, listEntitlementsByTenant } from '../../../../data/billingRepo';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import { FinelyOsIconBadge, FinelyOsSectionTitle } from '../../../os/FinelyOsIconBadge';
import { FinelyOsAIChatPanel } from '../../../os/FinelyOsAIChatPanel';
import {
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsKpiTile,
  finelyOsListItem,
} from '../../../os/finelyOsLightUi';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import { CoOwnerCommandCenter, CoOwnerArchivesPanel, CoOwnerRoleMasterySummary } from '../../../../components/coOwner/CoOwnerCommandCenter';
import { CoOwnerIdentityBanner } from '../../../../components/coOwner/CoOwnerCatalogPanel';
import { buildCoOwnerSystemPrompt } from '../../../../domain/coOwnerSystemPrompt';
import { CO_OWNER_AI_TIER, CO_OWNER_IDENTITY, getCoOwnerCatalogStats } from '../../../../domain/coOwnerPersona';
import { isCoOwnerTestingMode } from '../../../../lib/coOwnerEnvironment';
import {
  buildCoOwnerIntelligenceBrief,
  getCoOwnerEnvironmentMode,
  getCoOwnerRuntimeContext,
  setCoOwnerEnvironmentMode,
  type CoOwnerEnvironmentMode,
} from '../../../../lib/coOwnerRuntimeContext';
import { getAgentPersona } from '../../../../domain/agentPersonas';
import {
  CO_OWNER_ACTION_PROMPT_APPEND,
  executeCoOwnerStaffAction,
  parseCoOwnerActionsFromAssistant,
  getCoOwnerStaffSnapshot,
} from '../../../../lib/coOwnerStaffActions';
import {
  CO_OWNER_DEV_PROMPT_APPEND,
  executeCoOwnerDevAction,
  parseCoOwnerDevActionsFromAssistant,
} from '../../../../lib/coOwnerDevActions';
import { CoOwnerDevStudioPanel } from '../../../../components/coOwner/CoOwnerDevStudioPanel';
import { CoOwnerStaffOperationsPanel } from '../../../../components/coOwner/CoOwnerStaffOperationsPanel';
import { RuthLeadEngineBrief } from '../../../../components/coOwner/RuthLeadEngineBrief';
import { getExecutiveOrgStats } from '../../../../domain/coOwnerExecutiveStructure';
import { getLaunchFinalReadiness } from '../../../../lib/launchFinalReadinessOps';
import { listOpenValidationClocks } from '../../../../lib/validationLetterEngine';
import {
  buildCoOwnerAgentTools,
  describePendingToolAction,
  isHighRiskCoOwnerTool,
  runCoOwnerToolCall,
  CO_OWNER_TOOL_PROMPT_APPEND,
  type CoOwnerToolCall,
} from '../../../../lib/coOwnerAgentTools';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type AgentMessage = { role: 'user' | 'assistant'; content: string; createdAt: string };
type LaneTab = 'command' | 'staff' | 'archives' | 'dev';

const STORAGE_KEY = 'finely.ops_agent.v1';

const LANES: { id: LaneTab; label: string; icon: typeof Crown }[] = [
  { id: 'command', label: 'Command', icon: Crown },
  { id: 'archives', label: 'Knowledge archives', icon: Sparkles },
  { id: 'dev', label: 'Dev Studio', icon: Bot },
  { id: 'staff', label: 'Hire & promote', icon: Bot },
];

function nowIso() {
  return new Date().toISOString();
}

function loadHistory(): AgentMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({ role: x.role, content: x.content, createdAt: x.createdAt }))
      .filter((x) => (x.role === 'user' || x.role === 'assistant') && typeof x.content === 'string') as AgentMessage[];
  } catch {
    return [];
  }
}

function saveHistory(items: AgentMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-60)));
  } catch {
    /* ignore */
  }
}

export default function AdminOpsAgentProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const persona = getAgentPersona('finely_coowner');
  const stats = getCoOwnerCatalogStats();

  const [history, setHistory] = useState<AgentMessage[]>(() => loadHistory());
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [laneTab, setLaneTab] = useState<LaneTab>('command');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [pendingToolCalls, setPendingToolCalls] = useState<CoOwnerToolCall[]>([]);
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);

  useEffect(() => saveHistory(history), [history]);

  useEffect(() => {
    const tenantId = getActiveTenantId();
    listPartnersByTenant(tenantId).then((partners) => {
      const partnerIds = new Set(partners.map((p) => p.id));
      const leads = listLeadCaptures();
      const tasks = listTasks();
      const cases = listCases();
      const tenantTasks = tasks.filter((t) => partnerIds.has(String((t as { partnerId?: string }).partnerId || '')));
      const tenantCases = cases.filter((c) => partnerIds.has(c.partnerId));
      const agreements = listAgreementsByTenant(tenantId || FINELY_TENANT_ID);
      const entitlements = listEntitlementsByTenant(tenantId || FINELY_TENANT_ID);
      const openCases = tenantCases.filter((c) => c.status === 'open').length;
      const openTasks = tenantTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
      const recentLeads = leads
        .slice()
        .sort((a, b) => `${b.createdAt}`.localeCompare(`${a.createdAt}`))
        .slice(0, 10);
      const tenantCounts = {
        partners: partners.length,
        leads: leads.length,
        openCases,
        openTasks,
        agreements: agreements.length,
        entitlements: entitlements.length,
      };
      const baseSnapshot = {
        generatedAt: nowIso(),
        tenantId,
        coOwner: CO_OWNER_IDENTITY.name,
        catalogStats: stats,
        counts: tenantCounts,
        recentLeads: recentLeads.map((l) => ({
          id: l.id,
          createdAt: l.createdAt,
          fullName: l.fullName,
          email: l.email,
          phone: l.phone,
          offer: l.offer,
          interest: l.interest,
          source: l.source,
        })),
      };
      setSnapshot({
        ...baseSnapshot,
        runtime: getCoOwnerRuntimeContext(baseSnapshot),
      });
    });
  }, [stats.operatingBrainSize]);

  const send = async (prompt: string) => {
    const p = prompt.trim();
    if (!p) return;
    setError(null);
    setBusy(true);
    const nextHistory: AgentMessage[] = [...history, { role: 'user' as const, content: p, createdAt: nowIso() }];
    setHistory(nextHistory);
    setDraft('');
    try {
      if (!isFeatureEnabled('aiGateway')) {
        throw new Error('AI Gateway is disabled. Enable it in Admin Settings → Features.');
      }

      const intelligenceBrief = buildCoOwnerIntelligenceBrief(snapshot ?? undefined, {
        query: p,
        route: location.pathname,
        recentMessages: history.slice(-6).map((m) => m.content),
      });

      const res = await callAiGateway({
        taskType: CO_OWNER_AI_TIER.taskType,
        providerHint: CO_OWNER_AI_TIER.primaryProvider,
        responseFormat: 'text',
        tools: buildCoOwnerAgentTools(),
        context: {
          snapshot,
          intelligenceBrief,
          environmentMode: getCoOwnerEnvironmentMode(),
          testingMode: isCoOwnerTestingMode(),
          intelligenceMultiplier: CO_OWNER_AI_TIER.intelligenceMultiplier,
          coOwnerId: CO_OWNER_IDENTITY.id,
          personaId: 'finely_coowner',
        },
        messages: [
          {
            role: 'system',
            content:
              buildCoOwnerSystemPrompt({
                snapshot,
                route: '/admin/ops-agent',
                intelligenceBrief,
                query: p,
              }) +
              CO_OWNER_TOOL_PROMPT_APPEND +
              '\n\n' +
              CO_OWNER_ACTION_PROMPT_APPEND +
              '\n\n' +
              CO_OWNER_DEV_PROMPT_APPEND,
          },
          ...(nextHistory.map((m) => ({ role: m.role, content: m.content })) as { role: 'user' | 'assistant'; content: string }[]),
        ],
      });

      const text = String(res.text ?? '').trim() || '(no response)';
      const actionResults: string[] = [];
      const toolUses = Array.isArray(res.toolUses) ? res.toolUses : [];
      const toConfirm: CoOwnerToolCall[] = [];
      for (const call of toolUses) {
        if (isHighRiskCoOwnerTool(call)) {
          toConfirm.push(call);
          continue;
        }
        const r = runCoOwnerToolCall(call);
        actionResults.push(r.message);
        if (r.navigateTo) navigate(r.navigateTo);
      }
      if (toConfirm.length) setPendingToolCalls((prev) => [...prev, ...toConfirm]);

      if (!toolUses.length) {
        const actions = parseCoOwnerActionsFromAssistant(text);
        const devActions = parseCoOwnerDevActionsFromAssistant(text);
        for (const action of actions) {
          const r = executeCoOwnerStaffAction(action);
          actionResults.push(r.message);
        }
        for (const action of devActions) {
          const r = executeCoOwnerDevAction(action);
          actionResults.push(r.message);
        }
      }

      const pendingNote = toConfirm.length ? ` · ${toConfirm.length} action(s) awaiting your confirmation below.` : '';
      const display =
        actionResults.length > 0 || toConfirm.length
          ? `${text}\n\n— Executed: ${actionResults.length ? actionResults.join(' · ') : 'none yet'}${pendingNote}`
          : text;
      setHistory((h) => [...h, { role: 'assistant', content: display, createdAt: nowIso() }]);
      if (actionResults.length) setActionLog((log) => [...actionResults, ...log].slice(0, 12));
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Agent failed.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const prompt =
      (location.state as { coOwnerPrompt?: string; sagePrompt?: string } | null)?.coOwnerPrompt ??
      (location.state as { sagePrompt?: string } | null)?.sagePrompt;
    if (prompt?.trim()) {
      void send(prompt);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmPendingTool = (call: CoOwnerToolCall) => {
    const r = runCoOwnerToolCall(call);
    setActionLog((log) => [r.message, ...log].slice(0, 12));
    setHistory((h) => [...h, { role: 'assistant', content: `Confirmed — ${r.message}`, createdAt: nowIso() }]);
    if (r.navigateTo) navigate(r.navigateTo);
    setPendingToolCalls((prev) => prev.filter((c) => c.id !== call.id));
  };

  const cancelPendingTool = (call: CoOwnerToolCall) => {
    setHistory((h) => [...h, { role: 'assistant', content: `Cancelled — "${call.name}" was not executed.`, createdAt: nowIso() }]);
    setPendingToolCalls((prev) => prev.filter((c) => c.id !== call.id));
  };

  const dynamicQuickPrompts = useMemo(() => {
    const chips: { id: string; label: string; prompt: string }[] = [];
    const leadCount = (snapshot?.recentLeads as unknown[] | undefined)?.length ?? 0;
    if (leadCount > 0) {
      chips.push({
        id: 'leads',
        label: `${leadCount} lead${leadCount === 1 ? '' : 's'} need a decision`,
        prompt: `Review the ${leadCount} most recent lead(s) in the snapshot and tell me exactly what to do with each — route, call, nurture, or disqualify.`,
      });
    }
    try {
      const staffSnap = getCoOwnerStaffSnapshot();
      if (staffSnap.coverageGaps.length > 0) {
        chips.push({
          id: 'coverage',
          label: `Fill ${staffSnap.coverageGaps.length} coverage gap${staffSnap.coverageGaps.length === 1 ? '' : 's'}`,
          prompt: 'Fill our open role coverage gaps now — hire directly with executable action blocks or native tools.',
        });
      }
    } catch {
      /* ignore */
    }
    try {
      const exec = getExecutiveOrgStats();
      if (exec.vacant > 0) {
        chips.push({
          id: 'exec',
          label: `${exec.vacant} executive hat${exec.vacant === 1 ? '' : 's'} vacant`,
          prompt: 'Map vacant executive hats and hire the highest-priority C-suite or director role right now.',
        });
      }
    } catch {
      /* ignore */
    }
    try {
      const clocks = listOpenValidationClocks();
      if (clocks.length > 0) {
        chips.push({
          id: 'validation',
          label: `${clocks.length} validation deadline${clocks.length === 1 ? '' : 's'} due`,
          prompt: 'List every open validation clock and FDCPA deadline requiring action in the next 7 days.',
        });
      }
    } catch {
      /* ignore */
    }
    try {
      const readiness = getLaunchFinalReadiness();
      if (readiness.blockedCount > 0) {
        chips.push({
          id: 'launch',
          label: `${readiness.blockedCount} launch blocker${readiness.blockedCount === 1 ? '' : 's'}`,
          prompt: 'Run a strict launch-readiness audit focused only on the currently blocked zones — give a punchlist ordered by impact.',
        });
      }
    } catch {
      /* ignore */
    }

    const fixedTail = [
      { id: 'daily', label: 'Daily ops', prompt: 'Run a 5× deep daily ops review. TESTING MODE — low counts expected. Nine-lens synthesis: headline verdict, deep read, top 5 priorities with verify steps, people/automations, stewardship close.' },
      { id: 'launch-audit', label: 'Launch audit', prompt: 'Run a strict launch-readiness audit: identify what is missing, broken, inconsistent, or confusing. Give a punchlist ordered by impact.' },
      { id: 'validation-doc', label: 'Validation doctrine', prompt: 'Summarize our validation-first debt strategy for partners — challenge before pay, affidavits for summons, law per negative.' },
      { id: 'dev', label: 'Dev Studio', prompt: 'Dev Studio session: write a complete, purposeful site feature for Finely Cred and save it via coowner-dev block. Include full code.' },
      { id: 'sweep', label: 'Automation sweep', prompt: 'Run superhuman automation sweep — validation clocks, phone SLA, social, hiring, ops health. Nine-lens synthesis with execute moves.' },
      { id: 'sitemap', label: 'Site map', prompt: 'Scan the full site map — every admin, portal, and public surface. Report knowledge gaps and top 5 wiring fixes.' },
      { id: 'coach', label: 'Get coaching', prompt: 'I feel overwhelmed running this business. Coach me with one human/psychology frame and three practical ops priorities.' },
    ];
    for (const chip of fixedTail) {
      if (chips.length >= 7) break;
      chips.push(chip);
    }
    return chips.slice(0, 7);
  }, [snapshot]);

  const jobNavigator = useMemo(() => {
    const jobs: { id: string; label: string; kind: 'prompt' | 'pending' | 'log' }[] = dynamicQuickPrompts.map((c) => ({
      id: c.id,
      label: c.label,
      kind: 'prompt' as const,
    }));
    pendingToolCalls.forEach((call) => {
      jobs.unshift({ id: `pending-${call.id}`, label: describePendingToolAction(call).slice(0, 60), kind: 'pending' });
    });
    actionLog.slice(0, 4).forEach((line, i) => {
      jobs.push({ id: `log-${i}`, label: line.slice(0, 60), kind: 'log' });
    });
    return jobs;
  }, [dynamicQuickPrompts, pendingToolCalls, actionLog]);

  const runDailyOpsReview = () =>
    send(
      'Run a 5× deep daily ops review. TESTING MODE — low partner and lead counts are expected. Nine-lens synthesis: headline verdict, deep read, top 5 priorities with verify steps, people/automations, stewardship close.',
    );

  const runLaunchAudit = () =>
    send('Run a strict launch-readiness audit: identify what is missing, broken, inconsistent, or confusing. Give a punchlist ordered by impact.');

  const clear = () => {
    setHistory([]);
    setDraft('');
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const counts = (snapshot?.counts ?? null) as Record<string, number> | null;
  const recentLeads = (snapshot?.recentLeads ?? []) as Array<{
    id: string;
    fullName?: string;
    email?: string;
    source?: string;
    offer?: string;
    interest?: string;
  }>;

  const renderInspector = () => {
    if (laneTab === 'archives') {
      return (
        <div className="space-y-6">
          <CoOwnerArchivesPanel />
          <CoOwnerRoleMasterySummary onRunPrompt={(prompt) => void send(prompt)} />
        </div>
      );
    }
    if (laneTab === 'dev') {
      return (
        <CoOwnerDevStudioPanel
          onRunPrompt={(prompt) => void send(prompt)}
          onActionExecuted={(msg) => setActionLog((l) => [msg, ...l].slice(0, 12))}
        />
      );
    }
    if (laneTab === 'staff') {
      return (
        <div className="grid lg:grid-cols-2 gap-6">
          <CoOwnerStaffOperationsPanel onActionExecuted={(msg) => setActionLog((l) => [msg, ...l].slice(0, 12))} />
          <div className={`${finelyOsCatalogCard('sky')} p-6 space-y-3`} data-fc-accent="sky">
            <div className={FINELY_OS_ENTITY_VALUE}>Recent {CO_OWNER_IDENTITY.name} actions</div>
            {actionLog.length ? (
              actionLog.map((line, i) => (
                <div key={i} className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                  {line}
                </div>
              ))
            ) : (
              <div className={FINELY_OS_ENTITY_BODY}>
                Ask {CO_OWNER_IDENTITY.name} to hire executives or promote agents — actions execute here.
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className={FINELY_OS_BANNER}>
          <FinelyOsIconBadge icon={Bot} accent="violet" size={18} className="p-2.5 mt-0.5" />
          <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed text-base font-bold`}>
            {CO_OWNER_IDENTITY.name} is your AI co-owner — credit, debt validation, funding, ops, and launch readiness.
          </p>
        </div>

        <CoOwnerCommandCenter
          onRunPrompt={(prompt) => void send(prompt)}
          onActionExecuted={(msg) => setActionLog((l) => [msg, ...l].slice(0, 12))}
          onNavigate={(path) => navigate(path)}
        />

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-5 ${finelyOsCatalogCard('violet')} p-6 space-y-4`} data-fc-accent="violet">
            <FinelyOsSectionTitle icon={Bot} label="Live snapshot" accent="violet" />
            {counts ? (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(counts).map(([k, v], i) => (
                  <div key={k} className={finelyOsKpiTile(i)}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>{k}</div>
                    <div className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{String(v)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={FINELY_OS_ENTITY_BODY}>Loading tenant snapshot…</div>
            )}
            <div className={`${finelyOsCatalogCard('emerald')} fc-surface-harmony p-4`} data-fc-accent="emerald">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent leads</div>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {!recentLeads.length ? (
                  <div className={FINELY_OS_ENTITY_BODY}>No leads captured yet.</div>
                ) : (
                  recentLeads.map((l) => (
                    <div key={l.id} className={`${finelyOsCatalogCard('sky')} fc-surface-harmony shadow-sm p-3`} data-fc-accent="sky">
                      <div className={`${FINELY_OS_ENTITY_VALUE} text-sm truncate`}>{l.fullName || l.email || l.id}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} truncate`}>
                        {l.source} • {l.offer} • {l.interest || '—'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <FinelyOsAIChatPanel
              icon={Crown}
              title={CO_OWNER_IDENTITY.name}
              subtitle={`Ask ${CO_OWNER_IDENTITY.name} about business, credit doctrine, automations, or coaching.`}
              messages={history}
              draft={draft}
              onDraftChange={setDraft}
              onSend={() => void send(draft)}
              busy={busy}
              error={error}
              placeholder={`Ask ${CO_OWNER_IDENTITY.name}…`}
              emptyMessage='Start with "Daily ops" or ask what to prioritize for launch.'
              quickPrompts={dynamicQuickPrompts}
              onQuickPrompt={(prompt) => void send(prompt)}
              footerHint={`${CO_OWNER_IDENTITY.name} · ${CO_OWNER_AI_TIER.intelligenceMultiplier}× tier · ${isCoOwnerTestingMode() ? 'testing mode' : getCoOwnerEnvironmentMode()}`}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Command"
      title={`${CO_OWNER_IDENTITY.name} — Co-Owner`}
      description={`${persona?.displayTitle ?? CO_OWNER_IDENTITY.title} · ${CO_OWNER_AI_TIER.intelligenceMultiplier}× intelligence · ${stats.operatingBrainSize.toLocaleString()}+ capabilities`}
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon ?? Crown}
      primaryAction={<ProductPagePrimaryAction label="Daily ops" onClick={() => void runDailyOpsReview()} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => void runLaunchAudit()}>
          <Sparkles size={14} /> Launch audit
        </button>
      }
      metrics={[
        { label: 'Partners', value: String(counts?.partners ?? '—'), hint: 'In tenant', accent: 'emerald' },
        { label: 'Open cases', value: String(counts?.openCases ?? '—'), hint: 'Needs attention', accent: 'rose' },
        { label: 'Open tasks', value: String(counts?.openTasks ?? '—'), hint: 'In flight', accent: 'sky' },
        { label: 'Pending tools', value: String(pendingToolCalls.length), hint: 'Awaiting confirm', accent: 'violet' },
      ]}
      metricTitle="Ops agent pulse"
      metricDescription="Pick a lane and job at left — run inspector opens at right."
      metricsVariant="instrument"
    >
      <CoOwnerIdentityBanner />
      <div className="mt-4">
        <RuthLeadEngineBrief />
      </div>

      {pendingToolCalls.length ? (
        <div className={`${finelyOsCatalogCard('rose')} p-6 space-y-3`} data-fc-accent="rose">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-rose-700">
            <AlertTriangle size={14} /> Confirm before {CO_OWNER_IDENTITY.name} executes
          </div>
          {pendingToolCalls.map((call) => (
            <div key={call.id} className="rounded-xl border border-fuchsia-500/25 bg-black/10 p-4 flex flex-wrap items-center justify-between gap-3">
              <p className={`${FINELY_OS_ENTITY_BODY} text-sm font-bold`}>{describePendingToolAction(call)}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => confirmPendingTool(call)} className={FINELY_OS_SUCCESS_BTN}>
                  <Check size={14} /> Confirm
                </button>
                <button type="button" onClick={() => cancelPendingTool(call)} className={FINELY_OS_SECONDARY_BTN}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isCoOwnerTestingMode() ? (
        <div className={`${FINELY_OS_BANNER} border-emerald-500/30 bg-emerald-500/10`}>
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm font-bold`}>
            <strong>Testing mode</strong> — {CO_OWNER_IDENTITY.name} runs deep synthesis before she speaks. Sparse partners/leads is expected QA data.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {(['testing', 'staging', 'production'] as CoOwnerEnvironmentMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={getCoOwnerEnvironmentMode() === mode ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN}
                onClick={() => {
                  setCoOwnerEnvironmentMode(mode);
                  window.location.reload();
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 justify-end">
        <button type="button" onClick={runDailyOpsReview} disabled={busy} className={FINELY_OS_SUCCESS_BTN}>
          <ClipboardCheck size={14} /> Daily ops
        </button>
        <button type="button" onClick={runLaunchAudit} disabled={busy} className={FINELY_OS_PRIMARY_BTN}>
          <Sparkles size={14} /> Launch audit
        </button>
        <button type="button" onClick={clear} className={FINELY_OS_SECONDARY_BTN}>
          <RefreshCw size={14} /> Clear
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <aside className={`lg:col-span-4 ${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-5`} data-fc-accent="emerald">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-emerald-700">Agent navigator</div>
            <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Lanes and jobs — pick what to run next.</p>
          </div>

          <div className="space-y-2">
            {LANES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setLaneTab(id);
                  setSelectedJobId(null);
                }}
                className={finelyOsListItem(laneTab === id, 'violet')}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} />
                  <span className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{label}</span>
                </div>
              </button>
            ))}
          </div>

          <div>
            <div className={`text-xs font-black uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>Job queue</div>
            <div className="mt-3 space-y-2 max-h-[36vh] overflow-y-auto">
              {jobNavigator.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => {
                    setSelectedJobId(job.id);
                    if (job.kind === 'prompt') {
                      const chip = dynamicQuickPrompts.find((c) => c.id === job.id);
                      if (chip) void send(chip.prompt);
                    }
                  }}
                  className={finelyOsListItem(selectedJobId === job.id, job.kind === 'pending' ? 'fuchsia' : 'emerald')}
                >
                  <div className={`text-sm font-bold truncate ${FINELY_OS_ENTITY_VALUE}`}>{job.label}</div>
                  <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                    {job.kind === 'pending' ? 'Needs confirm' : job.kind === 'log' ? 'Recent action' : 'Quick prompt'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className={`lg:col-span-8 ${finelyOsCatalogCard('violet')} p-6 lg:p-10`} data-fc-accent="violet">
          <div className="text-xs font-black uppercase tracking-widest text-violet-700">Run inspector</div>
          <div className="mt-6">{renderInspector()}</div>
        </main>
      </div>
    </ProductHubScaffold>
  );
}
