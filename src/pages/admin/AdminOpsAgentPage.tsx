import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, ClipboardCheck, RefreshCw, Sparkles, Crown, AlertTriangle, Check, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';
import { useMappedAdminNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { callAiGateway } from '../../lib/aiClient';
import { listPartnersByTenant } from '../../data/partnersRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listCases } from '../../data/casesRepo';
import { listTasks } from '../../data/tasksRepo';
import { listAgreementsByTenant, listEntitlementsByTenant } from '../../data/billingRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { FinelyOsIconBadge, FinelyOsSectionTitle } from '../../features/os/FinelyOsIconBadge';
import { FinelyOsAIChatPanel } from '../../features/os/FinelyOsAIChatPanel';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BANNER,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsKpiTile,
} from '../../features/os/finelyOsLightUi';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { CoOwnerCommandCenter, CoOwnerArchivesPanel, CoOwnerRoleMasterySummary } from '../../components/coOwner/CoOwnerCommandCenter';
import { CoOwnerIdentityBanner } from '../../components/coOwner/CoOwnerCatalogPanel';
import { buildCoOwnerSystemPrompt } from '../../domain/coOwnerSystemPrompt';
import { CO_OWNER_AI_TIER, CO_OWNER_IDENTITY, getCoOwnerCatalogStats } from '../../domain/coOwnerPersona';
import { isCoOwnerTestingMode } from '../../lib/coOwnerEnvironment';
import {
  buildCoOwnerIntelligenceBrief,
  getCoOwnerEnvironmentMode,
  getCoOwnerRuntimeContext,
  setCoOwnerEnvironmentMode,
  type CoOwnerEnvironmentMode,
} from '../../lib/coOwnerRuntimeContext';
import { getAgentPersona } from '../../domain/agentPersonas';
import {
  CO_OWNER_ACTION_PROMPT_APPEND,
  executeCoOwnerStaffAction,
  parseCoOwnerActionsFromAssistant,
  getCoOwnerStaffSnapshot,
} from '../../lib/coOwnerStaffActions';
import {
  CO_OWNER_DEV_PROMPT_APPEND,
  executeCoOwnerDevAction,
  parseCoOwnerDevActionsFromAssistant,
} from '../../lib/coOwnerDevActions';
import { CoOwnerDevStudioPanel } from '../../components/coOwner/CoOwnerDevStudioPanel';
import { CoOwnerStaffOperationsPanel } from '../../components/coOwner/CoOwnerStaffOperationsPanel';
import { RuthLeadEngineBrief } from '../../components/coOwner/RuthLeadEngineBrief';
import { getExecutiveOrgStats } from '../../domain/coOwnerExecutiveStructure';
import { getLaunchFinalReadiness } from '../../lib/launchFinalReadinessOps';
import { listOpenValidationClocks } from '../../lib/validationLetterEngine';
import {
  buildCoOwnerAgentTools,
  describePendingToolAction,
  isHighRiskCoOwnerTool,
  runCoOwnerToolCall,
  CO_OWNER_TOOL_PROMPT_APPEND,
  type CoOwnerToolCall,
} from '../../lib/coOwnerAgentTools';

type AgentMessage = { role: 'user' | 'assistant'; content: string; createdAt: string };

const STORAGE_KEY = 'finely.ops_agent.v1';

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

export default function AdminOpsAgentPage({ embedded = false }: AdminEmbeddablePageProps = {}) {
  const navigate = useMappedAdminNavigate();
  const location = useLocation();
  const [history, setHistory] = useState<AgentMessage[]>(() => loadHistory());
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [laneTab, setLaneTab] = useState<'command' | 'staff' | 'archives' | 'dev'>('command');
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [pendingToolCalls, setPendingToolCalls] = useState<CoOwnerToolCall[]>([]);
  const stats = getCoOwnerCatalogStats();
  const persona = getAgentPersona('finely_coowner');

  useEffect(() => saveHistory(history), [history]);

  const [snapshot, setSnapshot] = useState<any>(null);
  useEffect(() => {
    const tenantId = getActiveTenantId();
    listPartnersByTenant(tenantId).then((partners) => {
      const partnerIds = new Set(partners.map((p) => p.id));
      const leads = listLeadCaptures();
      const tasks = listTasks();
      const cases = listCases();
      const tenantTasks = tasks.filter((t: any) => partnerIds.has(String((t as any).partnerId || '')));
      const tenantCases = cases.filter((c) => partnerIds.has(c.partnerId));
      const agreements = listAgreementsByTenant(tenantId || FINELY_TENANT_ID);
      const entitlements = listEntitlementsByTenant(tenantId || FINELY_TENANT_ID);
      const openCases = tenantCases.filter((c) => c.status === 'open').length;
      const openTasks = tenantTasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length;
      const recentLeads = leads.slice().sort((a: any, b: any) => `${b.createdAt}`.localeCompare(`${a.createdAt}`)).slice(0, 10);
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
        recentLeads: recentLeads.map((l: any) => ({
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
              }) + CO_OWNER_TOOL_PROMPT_APPEND + '\n\n' + CO_OWNER_ACTION_PROMPT_APPEND + '\n\n' + CO_OWNER_DEV_PROMPT_APPEND,
          },
          ...nextHistory.map((m) => ({ role: m.role, content: m.content })) as any,
        ],
      });

      const text = String(res.text ?? '').trim() || '(no response)';
      const actionResults: string[] = [];

      // Primary path (Phase 5): native Anthropic tool-calling. High-risk tools
      // (billing automations, staff deactivation, broadcast/mass-send) are queued
      // for an explicit human confirmation click instead of executing immediately.
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

      // Fallback path: fenced coowner-action / coowner-dev markdown blocks — kept for
      // providers/model turns that don't emit native tool_use.
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

      const pendingNote = toConfirm.length
        ? ` · ${toConfirm.length} action(s) awaiting your confirmation below.`
        : '';
      const display =
        actionResults.length > 0 || toConfirm.length
          ? `${text}\n\n— Executed: ${actionResults.length ? actionResults.join(' · ') : 'none yet'}${pendingNote}`
          : text;
      setHistory((h) => [...h, { role: 'assistant', content: display, createdAt: nowIso() }]);
      if (actionResults.length) setActionLog((log) => [...actionResults, ...log].slice(0, 12));
    } catch (e: any) {
      setError(e?.message || 'Agent failed.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const prompt = (location.state as { coOwnerPrompt?: string; sagePrompt?: string } | null)?.coOwnerPrompt
      ?? (location.state as { sagePrompt?: string } | null)?.sagePrompt;
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

  // Quick prompts: a few high-signal chips vary with live state (leads, coverage
  // gaps, executive vacancies, validation clocks, launch blockers) instead of
  // rendering the same 7 chips every visit; a fixed tail fills remaining slots.
  const dynamicQuickPrompts = useMemo(() => {
    const chips: { label: string; prompt: string }[] = [];
    const leadCount = snapshot?.recentLeads?.length ?? 0;
    if (leadCount > 0) {
      chips.push({
        label: `${leadCount} lead${leadCount === 1 ? '' : 's'} need a decision`,
        prompt: `Review the ${leadCount} most recent lead(s) in the snapshot and tell me exactly what to do with each — route, call, nurture, or disqualify.`,
      });
    }
    try {
      const staffSnap = getCoOwnerStaffSnapshot();
      if (staffSnap.coverageGaps.length > 0) {
        chips.push({
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
          label: `${readiness.blockedCount} launch blocker${readiness.blockedCount === 1 ? '' : 's'}`,
          prompt: 'Run a strict launch-readiness audit focused only on the currently blocked zones — give a punchlist ordered by impact.',
        });
      }
    } catch {
      /* ignore */
    }

    const fixedTail = [
      {
        label: 'Deep daily ops',
        prompt:
          'Run a 5× deep daily ops review. TESTING MODE — low counts expected. Nine-lens synthesis: headline verdict, deep read, top 5 priorities with verify steps, people/automations, stewardship close.',
      },
      {
        label: 'Launch audit',
        prompt:
          'Run a strict launch-readiness audit: identify what is missing, broken, inconsistent, or confusing. Give a punchlist ordered by impact.',
      },
      {
        label: 'Validation doctrine',
        prompt:
          'Summarize our validation-first debt strategy for partners — challenge before pay, affidavits for summons, law per negative.',
      },
      {
        label: 'Dev Studio',
        prompt:
          'Dev Studio session: write a complete, purposeful site feature for Finely Cred and save it via coowner-dev block. Include full code.',
      },
      {
        label: 'Superhuman sweep',
        prompt:
          'Run superhuman automation sweep — validation clocks, phone SLA, social, hiring, ops health. Nine-lens synthesis with execute moves.',
      },
      {
        label: 'Site map',
        prompt:
          'Scan the full site map — every admin, portal, and public surface. Report knowledge gaps and top 5 wiring fixes.',
      },
      {
        label: 'Psychology check',
        prompt:
          'I feel overwhelmed running this business. Coach me with one human/psychology frame and three practical ops priorities.',
      },
    ];
    for (const chip of fixedTail) {
      if (chips.length >= 7) break;
      chips.push(chip);
    }
    return chips.slice(0, 7);
  }, [snapshot]);

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

  return (
    <AdminWorkstationFrame embedded={embedded} kind="ops-agent-workstation"
      badge="Co-Owner"
      title={`${CO_OWNER_IDENTITY.name} — Command Center`}
      subtitle={`${persona?.displayTitle ?? CO_OWNER_IDENTITY.title} · ${CO_OWNER_AI_TIER.intelligenceMultiplier}× intelligence · ${stats.operatingBrainSize.toLocaleString()}+ effective capabilities`}
    >
      <div className={FINELY_OS_PAGE}>
        <CoOwnerIdentityBanner />
        <div className="mt-4">
          <RuthLeadEngineBrief />
        </div>

        {pendingToolCalls.length ? (
          <div className={`${finelyOsCatalogCard('rose')} mt-4 space-y-3`} data-fc-accent="rose">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-300">
              <AlertTriangle size={14} /> Confirm before {CO_OWNER_IDENTITY.name} executes
            </div>
            {pendingToolCalls.map((call) => (
              <div key={call.id} className="rounded-xl border border-fuchsia-500/25 bg-black/25 p-3 flex flex-wrap items-center justify-between gap-3">
                <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>{describePendingToolAction(call)}</p>
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
          <div className={`${FINELY_OS_BANNER} mt-4 border-emerald-500/30 bg-emerald-500/10`}>
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
              <strong>Testing mode · 5× deep intelligence</strong> — {CO_OWNER_IDENTITY.name} runs nine-lens synthesis before she speaks.
              Sparse partners/leads/revenue is expected QA data, not business failure. Launch gates are the scorecard until go-live.
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

        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLaneTab('command')}
              className={laneTab === 'command' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            >
              <Crown size={14} /> Command
            </button>
            <button
              type="button"
              onClick={() => setLaneTab('archives')}
              className={laneTab === 'archives' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            >
              <Sparkles size={14} /> Knowledge archives
            </button>
            <button
              type="button"
              onClick={() => setLaneTab('dev')}
              className={laneTab === 'dev' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            >
              Dev Studio
            </button>
            <button
              type="button"
              onClick={() => setLaneTab('staff')}
              className={laneTab === 'staff' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            >
              Hire & promote
            </button>
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
        </div>

        {laneTab === 'archives' ? (
          <div className="mt-6 space-y-6">
            <CoOwnerArchivesPanel />
            <CoOwnerRoleMasterySummary onRunPrompt={(prompt) => void send(prompt)} />
          </div>
        ) : laneTab === 'dev' ? (
          <div className="mt-6">
            <CoOwnerDevStudioPanel
              onRunPrompt={(prompt) => void send(prompt)}
              onActionExecuted={(msg) => setActionLog((l) => [msg, ...l].slice(0, 12))}
            />
          </div>
        ) : laneTab === 'staff' ? (
          <div className="mt-6 grid lg:grid-cols-2 gap-6">
            <CoOwnerStaffOperationsPanel onActionExecuted={(msg) => setActionLog((l) => [msg, ...l].slice(0, 12))} />
            <div className={`${finelyOsCatalogCard('sky')} space-y-3`} data-fc-accent="sky">
              <div className={FINELY_OS_ENTITY_VALUE}>Recent {CO_OWNER_IDENTITY.name} actions</div>
              {actionLog.length ? (
                actionLog.map((line, i) => (
                  <div key={i} className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                    {line}
                  </div>
                ))
              ) : (
                <div className={FINELY_OS_ENTITY_BODY}>Ask {CO_OWNER_IDENTITY.name} to hire executives or promote agents — actions execute here.</div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className={`${FINELY_OS_BANNER} mt-6`}>
              <FinelyOsIconBadge icon={Bot} accent="violet" size={18} className="p-2.5 mt-0.5" />
              <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
                {CO_OWNER_IDENTITY.name} is your AI co-owner — credit, debt validation, funding, ops, psychology, and launch
                readiness. She routes intelligence across {stats.superpowers.toLocaleString()} superpowers and never defaults to
                settle-first debt strategy.
              </p>
            </div>

            <CoOwnerCommandCenter
              onRunPrompt={(prompt) => void send(prompt)}
              onActionExecuted={(msg) => setActionLog((l) => [msg, ...l].slice(0, 12))}
              onNavigate={(path) => navigate(path)}
            />

            <div className="grid lg:grid-cols-12 gap-6 mt-6">
              <div className={`lg:col-span-5 ${finelyOsCatalogCard('violet')} space-y-4`} data-fc-accent="violet">
                <FinelyOsSectionTitle icon={Bot} label="Live snapshot" accent="violet" />
                {snapshot?.counts ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(snapshot.counts).map(([k, v], i) => (
                      <div key={k} className={finelyOsKpiTile(i)}>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>{k}</div>
                        <div className={`mt-1 text-2xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>{String(v as any)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={FINELY_OS_ENTITY_BODY}>Loading tenant snapshot…</div>
                )}
                <div className={`${finelyOsCatalogCard('emerald')} fc-surface-harmony`} data-fc-accent="emerald">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent leads</div>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {!snapshot?.recentLeads?.length ? (
                      <div className={FINELY_OS_ENTITY_BODY}>No leads captured yet.</div>
                    ) : (
                      snapshot.recentLeads.map((l: any) => (
                        <div key={l.id} className={`${finelyOsCatalogCard('sky')} fc-surface-harmony shadow-sm`} data-fc-accent="sky">
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
                  subtitle={`Ask ${CO_OWNER_IDENTITY.name} anything — business, credit doctrine, automations, or human/psychology coaching.`}
                  messages={history}
                  draft={draft}
                  onDraftChange={setDraft}
                  onSend={() => void send(draft)}
                  busy={busy}
                  error={error}
                  placeholder={`Ask ${CO_OWNER_IDENTITY.name}…`}
                  emptyMessage={`Start with "Daily ops" or ask: "What should I prioritize for launch and validation-first partner outcomes?"`}
                  quickPrompts={dynamicQuickPrompts}
                  onQuickPrompt={(prompt) => void send(prompt)}
                  footerHint={`${CO_OWNER_IDENTITY.name} · ${CO_OWNER_AI_TIER.intelligenceMultiplier}× tier · ${CO_OWNER_AI_TIER.maxOutputTokens.toLocaleString()} tokens · ${isCoOwnerTestingMode() ? 'testing mode' : getCoOwnerEnvironmentMode()}`}
                />
              </div>
            </div>
          </>
        )}

        {!embedded ? <FinelyOsPageFooter /> : null}
      </div>
    </AdminWorkstationFrame>
  );
}
