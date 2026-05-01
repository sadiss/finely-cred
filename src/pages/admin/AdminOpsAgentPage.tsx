import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, Sparkles, Send, ClipboardCheck, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { callAiGateway } from '../../lib/aiClient';
import { listPartnersByTenant } from '../../data/partnersRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listCases } from '../../data/casesRepo';
import { listTasks } from '../../data/tasksRepo';
import { listAgreementsByTenant, listEntitlementsByTenant } from '../../data/billingRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { getActiveTenantId } from '../../tenancy/activeTenant';

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
    // ignore
  }
}

export default function AdminOpsAgentPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<AgentMessage[]>(() => loadHistory());
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => saveHistory(history), [history]);

  const snapshot = useMemo(() => {
    const tenantId = getActiveTenantId();
    const partners = listPartnersByTenant(tenantId);
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

    return {
      generatedAt: nowIso(),
      tenantId,
      counts: {
        partners: partners.length,
        leads: leads.length,
        openCases,
        openTasks,
        agreements: agreements.length,
        entitlements: entitlements.length,
      },
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
  }, []);

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

      const res = await callAiGateway({
        taskType: 'ops.coowner_agent',
        providerHint: 'openai',
        responseFormat: 'text',
        context: { snapshot },
        messages: [
          {
            role: 'system',
            content:
              'You are Finely Cred’s co-owner operator. Your job is to help run the business and the app. Be decisive, prioritize, and be extremely practical. Output should be structured with headings and bullet points. Include: (1) Today’s priorities (max 7), (2) Risks/blocks, (3) Revenue pipeline actions, (4) Product/app launch readiness checks, (5) Suggested automations/comms. Avoid legal advice.',
          },
          ...nextHistory.map((m) => ({ role: m.role, content: m.content })) as any,
        ],
      });

      const text = String(res.text ?? '').trim() || '(no response)';
      setHistory((h) => [...h, { role: 'assistant', content: text, createdAt: nowIso() }]);
    } catch (e: any) {
      setError(e?.message || 'Agent failed.');
    } finally {
      setBusy(false);
    }
  };

  const runDailyOpsReview = () =>
    send('Run a daily ops review. Assume we are preparing for launch this week. Give me the most important actions to take today.');

  const runLaunchAudit = () =>
    send(
      'Run a strict launch-readiness audit: identify what is missing, broken, inconsistent, or confusing. Give a punchlist ordered by impact.',
    );

  const clear = () => {
    setHistory([]);
    setDraft('');
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <PageShell
      badge="Admin"
      title="Co‑Owner Ops Agent"
      subtitle="Your operator copilot: daily priorities, launch readiness, and business execution — grounded in live app data."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runDailyOpsReview}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
            >
              <ClipboardCheck size={14} /> Daily ops
            </button>
            <button
              type="button"
              onClick={runLaunchAudit}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 font-black uppercase tracking-widest text-[10px] hover:bg-amber-500/15 transition-all disabled:opacity-60"
            >
              <Sparkles size={14} /> Launch audit
            </button>
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-white/70 font-black uppercase tracking-widest text-[10px] hover:bg-white/[0.06] transition-all"
            >
              <RefreshCw size={14} /> Clear
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Bot size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Live snapshot</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(snapshot.counts).map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">{k}</div>
                  <div className="mt-1 text-2xl font-light text-white">{v}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/40">recent leads</div>
              <div className="mt-2 space-y-2">
                {snapshot.recentLeads.length === 0 ? (
                  <div className="text-white/50 text-sm">No leads captured yet.</div>
                ) : (
                  snapshot.recentLeads.map((l) => (
                    <div key={l.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <div className="text-white/80 text-sm font-semibold truncate">{l.fullName || l.email || l.id}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                        {l.source} • {l.offer} • {l.interest || '—'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
            <div className="text-white/70 text-sm">
              Ask anything about operating the business, improving the product, launch readiness, automation ideas, support workflows, and sales
              pipeline actions.
            </div>
            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>}

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3 max-h-[520px] overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-white/50 text-sm">
                  Start with “Daily ops” or ask: “What should I do today to get more sales and ship launch-ready?”
                </div>
              ) : (
                history.map((m, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 ${
                      m.role === 'assistant' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-widest text-white/40">
                      {m.role === 'assistant' ? 'Co‑Owner Agent' : 'You'} • {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-2 text-white/85 text-sm whitespace-pre-wrap">{m.content}</div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask the co-owner agent…"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                disabled={busy || !draft.trim()}
                onClick={() => send(draft)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
              >
                <Send size={14} /> Send
              </button>
            </div>

            <div className="text-[11px] text-white/40">
              Tip: Enable AI Gateway in <span className="text-white/60">Admin Settings → Features</span> to use this agent.
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

