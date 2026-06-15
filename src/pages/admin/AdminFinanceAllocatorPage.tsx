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
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_DANGER_BTN,
  finelyOsListItem,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';
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
        <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>Not signed in.</div>
      </PageShell>
    );
  }

  if (!allowed) {
    return (
      <PageShell badge="Admin" title="Finance Allocator" subtitle="Restricted.">
        <div className="space-y-4">
          <div className={FINELY_OS_NOTICE_WARN}>
            <div className={FINELY_OS_ENTITY_BODY}>
              You don’t have permission to use finance tools in this tenant. Ask an owner/admin to enable{' '}
              <span className="font-mono font-semibold">canUseFinanceTools</span>.
            </div>
          </div>
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_PRIMARY_BTN}>
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
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Admin Dashboard
        </button>

        <div className={FINELY_OS_BANNER}>
          <PiggyBank size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
            Track income and split it across buckets: taxes, marketing, payroll, agents, affiliates, and reserves.
          </p>
          <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>tenant: {tenant?.name ?? tenantId}</div>
        </div>

        {notice && <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div>}
        {err && <div className={FINELY_OS_NOTICE_ERROR}>{err}</div>}

        <div className="grid sm:grid-cols-3 gap-4">
          <FinelyOsOverviewStatTile icon={PiggyBank} label="Gross (last 200)" value={fmtMoney(totals?.gross ?? 0)} accent="emerald" iconAccent="emerald" />
          <FinelyOsOverviewStatTile icon={Sparkles} label="Allocated" value={fmtMoney(totals?.allocated ?? 0)} accent="violet" iconAccent="violet" />
          <FinelyOsOverviewStatTile icon={PiggyBank} label="Remaining" value={fmtMoney(totals?.remaining ?? 0)} accent="amber" iconAccent="amber" />
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-5 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Allocation templates</div>
              <button
                type="button"
                onClick={() => {
                  const t = createFinanceTemplate({ tenantId, name: 'New template' });
                  window.dispatchEvent(new Event('finely:store'));
                  setSelectedTemplateId(t.id);
                  setDraft(clone(t));
                }}
                className={FINELY_OS_SUCCESS_BTN}
              >
                <Plus size={14} /> New
              </button>
            </div>

            {templates.length === 0 ? (
              <div className={FINELY_OS_ENTITY_BODY}>No templates yet.</div>
            ) : (
              <FinelyOsPaginatedStack
                items={templates}
                pageSize={8}
                emptyMessage="No templates yet."
                renderItem={(t) => {
                  const active = t.id === (selectedTemplate?.id ?? '');
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={finelyOsListItem(active, 'amber')}
                    >
                      <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{t.name}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                        buckets: {t.buckets.length} • {t.enabled ? 'enabled' : 'disabled'}
                      </div>
                    </button>
                  );
                }}
              />
            )}

            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Exports</div>
              <button type="button" onClick={exportCsv} className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`}>
                <Download size={14} /> Export CSV
              </button>
              <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Exports all allocation lines for up to 1,000 income events.</div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className={FINELY_OS_ENTITY_VALUE}>Template editor</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => selectedTemplate && setDraft(clone(selectedTemplate))}
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    <RefreshCw size={14} /> Revert
                  </button>
                  <button
                    type="button"
                    onClick={saveTemplate}
                    disabled={!draft}
                    className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
                  >
                    <Save size={14} /> Save
                  </button>
                  <button
                    type="button"
                    onClick={aiSuggest}
                    disabled={!draft}
                    className={`${FINELY_OS_SUCCESS_BTN} disabled:opacity-60`}
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
                      className={FINELY_OS_DANGER_BTN}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  ) : null}
                </div>
              </div>

              {!draft ? (
                <div className={FINELY_OS_ENTITY_BODY}>Select a template.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="block md:col-span-2">
                      <div className={FINELY_OS_ENTITY_LABEL}>Name</div>
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        className={FINELY_OS_ENTITY_INPUT}
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <div className={FINELY_OS_ENTITY_LABEL}>Description</div>
                      <textarea
                        value={draft.description ?? ''}
                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        className={`${FINELY_OS_ENTITY_INPUT} min-h-[80px]`}
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Buckets</div>
                    <button type="button" onClick={addBucket} className={FINELY_OS_SECONDARY_BTN}>
                      <Plus size={14} /> Add bucket
                    </button>
                  </div>

                  <div className="space-y-3">
                    {draft.buckets.map((b, idx) => (
                      <div key={b.id} className={`${finelyOsInlineListItem()} p-4 space-y-3`}>
                        <div className="grid md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-5">
                            <label className={FINELY_OS_ENTITY_LABEL}>Bucket</label>
                            <input
                              value={b.name}
                              onChange={(e) => {
                                const next = clone(draft);
                                next.buckets[idx] = { ...next.buckets[idx]!, name: e.target.value };
                                setDraft(next);
                              }}
                              className={FINELY_OS_ENTITY_INPUT}
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className={FINELY_OS_ENTITY_LABEL}>Mode</label>
                            <select
                              value={b.mode}
                              onChange={(e) => {
                                const next = clone(draft);
                                next.buckets[idx] = { ...next.buckets[idx]!, mode: e.target.value as FinanceBucketMode };
                                setDraft(next);
                              }}
                              className={FINELY_OS_ENTITY_SELECT}
                            >
                              {Object.entries(MODE_LABEL).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className={FINELY_OS_ENTITY_LABEL}>Value</label>
                            <input
                              value={String(b.value ?? '')}
                              onChange={(e) => {
                                const next = clone(draft);
                                next.buckets[idx] = { ...next.buckets[idx]!, value: Number(e.target.value) };
                                setDraft(next);
                              }}
                              className={FINELY_OS_ENTITY_INPUT}
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
                              className={`${FINELY_OS_DANGER_BTN} !px-3`}
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

            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className={FINELY_OS_ENTITY_VALUE}>Income events</div>
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
                  className={FINELY_OS_SUCCESS_BTN}
                >
                  <Plus size={14} /> Add income
                </button>
              </div>

              <div className="grid md:grid-cols-5 gap-3">
                <input
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className={`${FINELY_OS_ENTITY_SELECT} text-sm`}
                  placeholder="Amount (e.g. 1497.00)"
                />
                <input
                  type="datetime-local"
                  value={incomeReceivedAtLocal}
                  onChange={(e) => setIncomeReceivedAtLocal(e.target.value)}
                  className={`${FINELY_OS_ENTITY_SELECT} text-sm`}
                />
                <input
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  className={`${FINELY_OS_ENTITY_SELECT} text-sm`}
                  placeholder="Source (Stripe/Denefit/Cash)"
                />
                <input
                  value={incomeRef}
                  onChange={(e) => setIncomeRef(e.target.value)}
                  className={`${FINELY_OS_ENTITY_SELECT} text-sm`}
                  placeholder="Reference ID"
                />
                <input
                  value={incomeNotes}
                  onChange={(e) => setIncomeNotes(e.target.value)}
                  className={`${FINELY_OS_ENTITY_SELECT} text-sm`}
                  placeholder="Notes"
                />
              </div>

              {totals ? (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className={`${finelyOsInlineListItem()} p-4`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Gross (last 200)</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{fmtMoney(totals.gross)}</div>
                  </div>
                  <div className={`${finelyOsInlineListItem()} p-4`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Allocated</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{fmtMoney(totals.allocated)}</div>
                  </div>
                  <div className={`${finelyOsInlineListItem()} p-4`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Remaining</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{fmtMoney(totals.remaining)}</div>
                  </div>
                </div>
              ) : null}

              {income.length === 0 ? (
                <div className={FINELY_OS_ENTITY_BODY}>No income events yet.</div>
              ) : (
                <FinelyOsPaginatedStack
                  items={income}
                  pageSize={8}
                  emptyMessage="No income events yet."
                  renderItem={(ev) => {
                    const tpl = activeTemplate;
                    const r = tpl ? computeAllocations({ event: ev, template: tpl }) : null;
                    return (
                      <div key={ev.id} className={`${finelyOsInlineListItem()} p-4 space-y-2`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={FINELY_OS_ENTITY_VALUE}>{fmtMoney(ev.amountCents)}</div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                              {new Date(ev.receivedAt).toLocaleString()} • {ev.source ?? '—'} • {ev.referenceId ?? '—'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              deleteIncomeEvent(ev.id);
                              window.dispatchEvent(new Event('finely:store'));
                            }}
                            className={FINELY_OS_DANGER_BTN}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                        {r ? (
                          <div className="grid md:grid-cols-3 gap-3 text-sm">
                            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                              <div className={FINELY_OS_ENTITY_SUBLABEL}>Allocated</div>
                              <div className={`${FINELY_OS_ENTITY_VALUE} font-mono text-sm`}>{fmtMoney(r.allocatedCents)}</div>
                            </div>
                            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                              <div className={FINELY_OS_ENTITY_SUBLABEL}>Remaining</div>
                              <div className={`${FINELY_OS_ENTITY_VALUE} font-mono text-sm`}>{fmtMoney(r.remainingCents)}</div>
                            </div>
                            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                              <div className={FINELY_OS_ENTITY_SUBLABEL}>Lines</div>
                              <div className={`${FINELY_OS_ENTITY_VALUE} font-mono text-sm`}>{r.lines.length}</div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  }}
                />
              )}

              <div className="pt-2">
                <button type="button" onClick={() => navigate('/admin/ops-agent')} className={FINELY_OS_SECONDARY_BTN}>
                  Ask Co‑Owner Ops Agent <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}

