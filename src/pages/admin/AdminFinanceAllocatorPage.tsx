import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, PiggyBank, Plus, RefreshCw, Save, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { getTenant } from '../../data/tenantsRepo';
import { canUseFinanceTools, getMembershipByUserAndTenant } from '../../data/tenantsRepo';
import { isFeatureEnabled } from '../../data/settingsRepo';
import {
  createFinanceTemplate,
  createIncomeEvent,
  deleteFinanceTemplate,
  deleteIncomeEvent,
  listFinanceTemplatesByTenant,
  listIncomeEventsByTenant,
  upsertFinanceTemplate,
} from '../../data/financeRepo';
import type { FinanceBucket, FinanceBucketMode, FinanceTemplate } from '../../domain/finance';
import { computeAllocations } from '../../domain/finance';
import { callAiGateway } from '../../lib/aiClient';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { downloadText } from '../../utils/download';
import { extractFirstJsonObject } from '../../utils/jsonExtract';
import { newId } from '../../utils/ids';

function fmtMoney(cents: number) {
  const v = Math.round(cents || 0);
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  return `${sign}$${(abs / 100).toFixed(2)}`;
}

function toCents(v: string): number {
  const n = Number(String(v || '').replace(/[^0-9.\-]/g, ''));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function toIsoFromLocal(local: string): string {
  const raw = (local || '').trim();
  if (!raw) return new Date().toISOString();
  try {
    const d = new Date(raw);
    if (!Number.isFinite(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

const MODE_LABEL: Record<FinanceBucketMode, string> = {
  pct_gross: '% of gross',
  fixed_cents: 'Fixed (cents)',
  pct_remaining: '% of remaining',
};

export default function AdminFinanceAllocatorPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const tenantId = useMemo(() => getActiveTenantId(), [version]);
  const tenant = useMemo(() => getTenant(tenantId), [tenantId, version]);
  const membership = useMemo(() => {
    const u = auth.user;
    if (!u) return null;
    return getMembershipByUserAndTenant(u.id, tenantId) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
  }, [auth.user, tenantId, version]);
  const allowed = useMemo(() => isAdminEmail(auth.user?.email) || canUseFinanceTools(membership), [auth.user?.email, membership]);

  const templates = useMemo(() => listFinanceTemplatesByTenant(tenantId), [tenantId, version]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const selectedTemplate = useMemo(
    () => (selectedTemplateId ? templates.find((t) => t.id === selectedTemplateId) ?? null : templates[0] ?? null),
    [selectedTemplateId, templates],
  );

  const [draft, setDraft] = useState<FinanceTemplate | null>(selectedTemplate ? clone(selectedTemplate) : null);
  useEffect(() => {
    if (!selectedTemplate) return;
    setDraft(clone(selectedTemplate));
  }, [selectedTemplate?.id]);

  const income = useMemo(() => listIncomeEventsByTenant(tenantId), [tenantId, version]);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeReceivedAtLocal, setIncomeReceivedAtLocal] = useState('');
  const [incomeSource, setIncomeSource] = useState('');
  const [incomeRef, setIncomeRef] = useState('');
  const [incomeNotes, setIncomeNotes] = useState('');

  const activeTemplate = draft ?? selectedTemplate;

  const totals = useMemo(() => {
    if (!activeTemplate) return null;
    const byBucket = new Map<string, { name: string; cents: number }>();
    let gross = 0;
    let allocated = 0;
    let remaining = 0;
    for (const ev of income.slice(0, 200)) {
      const r = computeAllocations({ event: ev, template: activeTemplate });
      gross += Math.max(0, ev.amountCents);
      allocated += r.allocatedCents;
      remaining += r.remainingCents;
      for (const line of r.lines) {
        const cur = byBucket.get(line.bucketId) ?? { name: line.bucketName, cents: 0 };
        cur.cents += line.amountCents;
        byBucket.set(line.bucketId, cur);
      }
    }
    const rows = Array.from(byBucket.entries()).map(([id, v]) => ({ id, name: v.name, cents: v.cents }));
    rows.sort((a, b) => b.cents - a.cents);
    return { gross, allocated, remaining, rows };
  }, [activeTemplate, income]);

  const saveTemplate = () => {
    if (!draft) return;
    setErr(null);
    const cleaned: FinanceTemplate = {
      ...draft,
      name: (draft.name || '').trim() || 'Template',
      description: (draft.description || '').trim() || undefined,
      buckets: (draft.buckets ?? [])
        .map((b) => ({
          ...b,
          name: (b.name || '').trim() || 'Bucket',
          value: Number.isFinite(Number(b.value)) ? Number(b.value) : 0,
        }))
        .filter((b) => b.name),
    };
    upsertFinanceTemplate(cleaned);
    window.dispatchEvent(new Event('finely:store'));
    setNotice('Template saved.');
    window.setTimeout(() => setNotice(null), 1800);
    setVersion((v) => v + 1);
  };

  const exportCsv = () => {
    if (!activeTemplate) return;
    const lines: string[] = [];
    lines.push(
      [
        'receivedAt',
        'source',
        'referenceId',
        'gross',
        'allocated',
        'remaining',
        'bucket',
        'bucketAmount',
        'bucketMode',
        'bucketValue',
        'payee',
      ].join(','),
    );
    for (const ev of income.slice(0, 1000)) {
      const r = computeAllocations({ event: ev, template: activeTemplate });
      for (const l of r.lines) {
        lines.push(
          [
            ev.receivedAt,
            ev.source ?? '',
            ev.referenceId ?? '',
            (ev.amountCents / 100).toFixed(2),
            (r.allocatedCents / 100).toFixed(2),
            (r.remainingCents / 100).toFixed(2),
            `"${String(l.bucketName).replaceAll('"', '""')}"`,
            (l.amountCents / 100).toFixed(2),
            l.mode,
            String(l.value),
            `"${String(l.payeeLabel ?? '').replaceAll('"', '""')}"`,
          ].join(','),
        );
      }
    }
    downloadText({
      text: lines.join('\n'),
      filename: `finance_allocations_${tenant?.slug || tenantId}.csv`,
      mimeType: 'text/csv',
    });
  };

  const addBucket = () => {
    if (!draft) return;
    const b: FinanceBucket = { id: newId('bucket'), name: 'New bucket', mode: 'pct_gross', value: 5, category: 'other' };
    setDraft({ ...draft, buckets: [...draft.buckets, b] });
  };

  const aiSuggest = async () => {
    if (!draft) return;
    setErr(null);
    try {
      if (!isFeatureEnabled('aiGateway')) throw new Error('AI Gateway is disabled. Enable it in Admin Settings → Features.');
      const res = await callAiGateway({
        taskType: 'finance.allocator_suggestion',
        responseFormat: 'json',
        messages: [
          {
            role: 'system',
            content:
              'You are a finance planning assistant (not a CPA). Output ONLY JSON: { buckets: [{ name, category, mode: "pct_gross"|"fixed_cents"|"pct_remaining", value, payeeLabel?, notes? }], rationale: string }. Keep it conservative and avoid tax/legal advice.',
          },
          {
            role: 'user',
            content:
              `Tenant: ${tenant?.name ?? tenantId}\nTemplate name: ${draft.name}\nExisting buckets:\n${JSON.stringify(draft.buckets, null, 2)}\n\nGoal: create a clear, sustainable split for a service business with marketing + payroll + ops reserve + taxes + payouts.`,
          },
        ],
      });
      const obj = extractFirstJsonObject(res.text) as any;
      const buckets = Array.isArray(obj?.buckets) ? obj.buckets : [];
      if (!buckets.length) throw new Error('AI returned no buckets.');
      const next = clone(draft);
      next.buckets = buckets.slice(0, 18).map((b: any) => ({
        id: newId('bucket'),
        name: String(b?.name ?? 'Bucket'),
        category: b?.category,
        mode: (b?.mode as FinanceBucketMode) || 'pct_gross',
        value: Number(b?.value ?? 0),
        payeeLabel: b?.payeeLabel ? String(b.payeeLabel) : undefined,
        notes: b?.notes ? String(b.notes) : undefined,
      }));
      setDraft(next);
      setNotice('AI suggestion applied (review before saving).');
      window.setTimeout(() => setNotice(null), 2500);
    } catch (e: any) {
      setErr(e?.message || 'AI suggestion failed.');
    }
  };

  if (!auth.user) {
    return (
      <PageShell badge="Admin" title="Finance Allocator" subtitle="Sign in to continue.">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">Not signed in.</div>
      </PageShell>
    );
  }

  if (!allowed) {
    return (
      <PageShell badge="Admin" title="Finance Allocator" subtitle="Restricted.">
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-6 text-white/70 text-sm">
            You don’t have permission to use finance tools in this tenant. Ask an owner/admin to enable{' '}
            <span className="font-mono text-white/80">canUseFinanceTools</span>.
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={16} /> Back to Admin
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge="Admin"
      title="Finance Allocator"
      subtitle="Track income and split it across buckets: taxes, marketing, payroll, agents, affiliates, and reserves."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">tenant: {tenant?.name ?? tenantId}</div>
        </div>

        {notice && <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100 text-sm">{notice}</div>}
        {err && <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-rose-100 text-sm">{err}</div>}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <PiggyBank size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Allocation templates</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const t = createFinanceTemplate({ tenantId, name: 'New template' });
                  window.dispatchEvent(new Event('finely:store'));
                  setSelectedTemplateId(t.id);
                  setDraft(clone(t));
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                <Plus size={14} /> New
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="text-white/60 text-sm">No templates yet.</div>
            ) : (
              <div className="space-y-2">
                {templates.slice(0, 20).map((t) => {
                  const active = t.id === (selectedTemplate?.id ?? '');
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        active ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="text-white font-semibold truncate">{t.name}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                        buckets: {t.buckets.length} • {t.enabled ? 'enabled' : 'disabled'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Exports</div>
              <button
                type="button"
                onClick={exportCsv}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-white/70 font-black uppercase tracking-widest text-[10px] transition-all"
              >
                <Download size={14} /> Export CSV
              </button>
              <div className="text-white/40 text-xs">Exports all allocation lines for up to 1,000 income events.</div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white font-semibold">Template editor</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => selectedTemplate && setDraft(clone(selectedTemplate))}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  >
                    <RefreshCw size={14} /> Revert
                  </button>
                  <button
                    type="button"
                    onClick={saveTemplate}
                    disabled={!draft}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
                  >
                    <Save size={14} /> Save
                  </button>
                  <button
                    type="button"
                    onClick={aiSuggest}
                    disabled={!draft}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/15 transition-all disabled:opacity-60"
                    title="AI suggestion (requires AI Gateway)"
                  >
                    <Sparkles size={14} /> AI suggest
                  </button>
                  {selectedTemplate ? (
                    <button
                      type="button"
                      onClick={() => {
                        deleteFinanceTemplate(selectedTemplate.id);
                        window.dispatchEvent(new Event('finely:store'));
                        setSelectedTemplateId(null);
                        setDraft(null);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/15 transition-all"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  ) : null}
                </div>
              </div>

              {!draft ? (
                <div className="text-white/60 text-sm">Select a template.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="block md:col-span-2">
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Name</div>
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Description</div>
                      <textarea
                        value={draft.description ?? ''}
                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        className="mt-2 w-full min-h-[80px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Buckets</div>
                    <button
                      type="button"
                      onClick={addBucket}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    >
                      <Plus size={14} /> Add bucket
                    </button>
                  </div>

                  <div className="space-y-3">
                    {draft.buckets.map((b, idx) => (
                      <div key={b.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                        <div className="grid md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-5">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bucket</label>
                            <input
                              value={b.name}
                              onChange={(e) => {
                                const next = clone(draft);
                                next.buckets[idx] = { ...next.buckets[idx]!, name: e.target.value };
                                setDraft(next);
                              }}
                              className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Mode</label>
                            <select
                              value={b.mode}
                              onChange={(e) => {
                                const next = clone(draft);
                                next.buckets[idx] = { ...next.buckets[idx]!, mode: e.target.value as FinanceBucketMode };
                                setDraft(next);
                              }}
                              className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80"
                            >
                              {Object.entries(MODE_LABEL).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Value</label>
                            <input
                              value={String(b.value ?? '')}
                              onChange={(e) => {
                                const next = clone(draft);
                                next.buckets[idx] = { ...next.buckets[idx]!, value: Number(e.target.value) };
                                setDraft(next);
                              }}
                              className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80"
                              placeholder={b.mode === 'fixed_cents' ? '50000' : '10'}
                            />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const next = clone(draft);
                                next.buckets.splice(idx, 1);
                                setDraft(next);
                              }}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 transition-all"
                              title="Remove bucket"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white font-semibold">Income events</div>
                <button
                  type="button"
                  onClick={() => {
                    if (!activeTemplate) {
                      setErr('Create/select a template first.');
                      return;
                    }
                    const cents = toCents(incomeAmount);
                    if (cents <= 0) {
                      setErr('Income amount must be > 0.');
                      return;
                    }
                    setErr(null);
                    createIncomeEvent({
                      tenantId,
                      amountCents: cents,
                      receivedAt: toIsoFromLocal(incomeReceivedAtLocal),
                      source: incomeSource.trim() || undefined,
                      referenceId: incomeRef.trim() || undefined,
                      notes: incomeNotes.trim() || undefined,
                      templateId: activeTemplate.id,
                    });
                    setIncomeAmount('');
                    setIncomeReceivedAtLocal('');
                    setIncomeSource('');
                    setIncomeRef('');
                    setIncomeNotes('');
                    window.dispatchEvent(new Event('finely:store'));
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  <Plus size={14} /> Add income
                </button>
              </div>

              <div className="grid md:grid-cols-5 gap-3">
                <input
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-sm"
                  placeholder="Amount (e.g. 1497.00)"
                />
                <input
                  type="datetime-local"
                  value={incomeReceivedAtLocal}
                  onChange={(e) => setIncomeReceivedAtLocal(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-sm"
                />
                <input
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-sm"
                  placeholder="Source (Stripe/Denefits/Cash)"
                />
                <input
                  value={incomeRef}
                  onChange={(e) => setIncomeRef(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-sm"
                  placeholder="Reference ID"
                />
                <input
                  value={incomeNotes}
                  onChange={(e) => setIncomeNotes(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-sm"
                  placeholder="Notes"
                />
              </div>

              {totals ? (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Gross (last 200)</div>
                    <div className="mt-1 text-white font-semibold">{fmtMoney(totals.gross)}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Allocated</div>
                    <div className="mt-1 text-white font-semibold">{fmtMoney(totals.allocated)}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Remaining</div>
                    <div className="mt-1 text-white font-semibold">{fmtMoney(totals.remaining)}</div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                {income.length === 0 ? (
                  <div className="text-white/60 text-sm">No income events yet.</div>
                ) : (
                  income.slice(0, 30).map((ev) => {
                    const tpl = activeTemplate;
                    const r = tpl ? computeAllocations({ event: ev, template: tpl }) : null;
                    return (
                      <div key={ev.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-white font-semibold">{fmtMoney(ev.amountCents)}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                              {new Date(ev.receivedAt).toLocaleString()} • {ev.source ?? '—'} • {ev.referenceId ?? '—'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              deleteIncomeEvent(ev.id);
                              window.dispatchEvent(new Event('finely:store'));
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/15 transition-all"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                        {r ? (
                          <div className="grid md:grid-cols-3 gap-3 text-sm">
                            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                              <div className="text-[10px] uppercase tracking-widest text-white/40">Allocated</div>
                              <div className="text-white/80 font-mono">{fmtMoney(r.allocatedCents)}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                              <div className="text-[10px] uppercase tracking-widest text-white/40">Remaining</div>
                              <div className="text-white/80 font-mono">{fmtMoney(r.remainingCents)}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                              <div className="text-[10px] uppercase tracking-widest text-white/40">Lines</div>
                              <div className="text-white/80 font-mono">{r.lines.length}</div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/ops-agent')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Ask Co‑Owner Ops Agent <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

