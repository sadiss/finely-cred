import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Download, PiggyBank, Plus, RefreshCw, Save, Sparkles, Trash2, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { isAdminEmail } from '../../../../auth/admin';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import { getTenant } from '../../../../data/tenantsRepo';
import { canUseFinanceTools, getMembershipByUserAndTenant } from '../../../../data/tenantsRepo';
import { isFeatureEnabled } from '../../../../data/settingsRepo';
import {
  createFinanceTemplate,
  createIncomeEvent,
  deleteFinanceTemplate,
  deleteIncomeEvent,
  listFinanceTemplatesByTenant,
  listIncomeEventsByTenant,
  upsertFinanceTemplate,
} from '../../../../data/financeRepo';
import type { FinanceBucket, FinanceBucketMode, FinanceTemplate } from '../../../../domain/finance';
import { computeAllocations } from '../../../../domain/finance';
import { callAiGateway } from '../../../../lib/aiClient';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import { downloadText } from '../../../../utils/download';
import { extractFirstJsonObject } from '../../../../utils/jsonExtract';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_DANGER_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsListItem,
} from '../../../os/finelyOsLightUi';
import { newId } from '../../../../utils/ids';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type DeckPanel = 'templates' | 'income' | 'exports';

const DECK_TILES: { id: DeckPanel; label: string; hint: string; icon: typeof Wallet; accent: 'emerald' | 'violet' | 'sky' }[] = [
  { id: 'templates', label: 'Templates', hint: 'Allocation buckets and splits', icon: Wallet, accent: 'violet' },
  { id: 'income', label: 'Income', hint: 'Deposits and allocation lines', icon: PiggyBank, accent: 'emerald' },
  { id: 'exports', label: 'Exports', hint: 'CSV for accounting', icon: Download, accent: 'sky' },
];

const RAIL_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

const MODE_LABEL: Record<FinanceBucketMode, string> = {
  pct_gross: '% of gross',
  fixed_cents: 'Fixed (cents)',
  pct_remaining: '% of remaining',
};

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

export default function AdminFinanceProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'emerald';
  const [deckPanel, setDeckPanel] = useState<DeckPanel>('templates');
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
      ['receivedAt', 'source', 'referenceId', 'gross', 'allocated', 'remaining', 'bucket', 'bucketAmount', 'bucketMode', 'bucketValue', 'payee'].join(','),
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
            content: `Tenant: ${tenant?.name ?? tenantId}\nTemplate name: ${draft.name}\nExisting buckets:\n${JSON.stringify(draft.buckets, null, 2)}\n\nGoal: create a clear, sustainable split for a service business with marketing + payroll + ops reserve + taxes + payouts.`,
          },
        ],
      });
      const obj = extractFirstJsonObject(res.text) as { buckets?: unknown[] };
      const buckets = Array.isArray(obj?.buckets) ? obj.buckets : [];
      if (!buckets.length) throw new Error('AI returned no buckets.');
      const next = clone(draft);
      next.buckets = buckets.slice(0, 18).map((raw) => {
        const b = raw as Record<string, unknown>;
        const category = b?.category;
        return {
          id: newId('bucket'),
          name: String(b?.name ?? 'Bucket'),
          category:
            category === 'tax' ||
            category === 'marketing' ||
            category === 'payroll' ||
            category === 'ops' ||
            category === 'affiliate' ||
            category === 'agent' ||
            category === 'reserve' ||
            category === 'other'
              ? category
              : undefined,
          mode: (b?.mode as FinanceBucketMode) || 'pct_gross',
          value: Number(b?.value ?? 0),
          payeeLabel: b?.payeeLabel ? String(b.payeeLabel) : undefined,
          notes: b?.notes ? String(b.notes) : undefined,
        } satisfies FinanceBucket;
      });
      setDraft(next);
      setNotice('AI suggestion applied (review before saving).');
      window.setTimeout(() => setNotice(null), 2500);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'AI suggestion failed.');
    }
  };

  const addIncome = () => {
    if (!activeTemplate) {
      setErr('Create or select a template first.');
      setDeckPanel('templates');
      return;
    }
    const cents = toCents(incomeAmount);
    if (cents <= 0) {
      setErr('Income amount must be greater than zero.');
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
    setNotice('Income recorded.');
    window.setTimeout(() => setNotice(null), 1800);
  };

  const renderCommandDeck = () => (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="command-deck">
      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
      {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}

      {totals ? (
        <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-5 fc-surface-harmony`} data-fc-accent="emerald">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <PiggyBank size={16} />
                <span>Money rail</span>
              </div>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {tenant?.name ?? tenantId} · last 200 income events · template {activeTemplate?.name ?? '—'}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="text-center">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Gross</div>
                <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{fmtMoney(totals.gross)}</div>
              </div>
              <div className="text-center">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Allocated</div>
                <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{fmtMoney(totals.allocated)}</div>
              </div>
              <div className="text-center">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Remaining</div>
                <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{fmtMoney(totals.remaining)}</div>
              </div>
            </div>
          </div>
          {totals.rows.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {totals.rows.map((row, idx) => {
                const railAccent = RAIL_ACCENTS[idx % RAIL_ACCENTS.length];
                const pct = totals.gross > 0 ? Math.round((row.cents / totals.gross) * 100) : 0;
                return (
                  <div
                    key={row.id}
                    className={`shrink-0 min-w-[160px] ${finelyOsCatalogCard(railAccent)} p-4`}
                    data-fc-accent={railAccent}
                  >
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} truncate`}>{row.name}</div>
                    <div className={`mt-1 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{fmtMoney(row.cents)}</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{pct}% of gross</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={FINELY_OS_ENTITY_BODY}>Record income to populate bucket allocation on the rail.</p>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="tablist" aria-label="Finance command deck">
        {DECK_TILES.map((tile) => {
          const Icon = tile.icon;
          const active = deckPanel === tile.id;
          const badge =
            tile.id === 'templates' ? templates.length : tile.id === 'income' ? income.length : activeTemplate ? 1 : 0;
          return (
            <button
              key={tile.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setDeckPanel(tile.id)}
              className={`text-left ${finelyOsCatalogCard(tile.accent)} p-6 lg:p-8 transition-all ${active ? 'ring-2 ring-white/25 scale-[1.01]' : 'opacity-90 hover:opacity-100'}`}
              data-fc-accent={tile.accent}
              data-active={active ? 'true' : undefined}
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 mb-4">
                <Icon size={22} />
              </div>
              <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{badge}</div>
              <div className={`mt-1 text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>{tile.label}</div>
              <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>{tile.hint}</div>
            </button>
          );
        })}
      </div>

      {deckPanel === 'templates' ? (
        <div className="grid lg:grid-cols-12 gap-6">
          <section className={`lg:col-span-4 ${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-3xl font-extrabold">Templates</h2>
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
              <p className={FINELY_OS_ENTITY_BODY}>No templates yet.</p>
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
                      className={finelyOsListItem(active, 'violet')}
                    >
                      <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{t.name}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                        buckets: {t.buckets.length} · {t.enabled ? 'enabled' : 'disabled'}
                      </div>
                    </button>
                  );
                }}
              />
            )}
          </section>

          <section className={`lg:col-span-8 ${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-6`} data-fc-accent="emerald">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl font-extrabold">Template editor</h2>
                <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Define how each deposit splits across buckets.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => selectedTemplate && setDraft(clone(selectedTemplate))} className={FINELY_OS_SECONDARY_BTN}>
                  <RefreshCw size={14} /> Revert
                </button>
                <button type="button" onClick={saveTemplate} disabled={!draft} className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}>
                  <Save size={14} /> Save
                </button>
                <button type="button" onClick={() => void aiSuggest()} disabled={!draft} className={`${FINELY_OS_SUCCESS_BTN} disabled:opacity-60`} title="AI suggestion (requires AI Gateway)">
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
              <p className={FINELY_OS_ENTITY_BODY}>Select or create a template.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block md:col-span-2">
                    <div className={FINELY_OS_ENTITY_LABEL}>Name</div>
                    <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={FINELY_OS_ENTITY_INPUT} />
                  </label>
                  <label className="block md:col-span-2">
                    <div className={FINELY_OS_ENTITY_LABEL}>Description</div>
                    <textarea
                      value={draft.description ?? ''}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      className={`${FINELY_OS_ENTITY_INPUT} min-h-[80px]`}
                      rows={4}
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
          </section>
        </div>
      ) : null}

      {deckPanel === 'income' ? (
        <section className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-6`} data-fc-accent="emerald">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-3xl font-extrabold">Income events</h2>
              <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Record deposits and see how the active template allocates each one.</p>
            </div>
            <button type="button" onClick={addIncome} className={FINELY_OS_PRIMARY_BTN}>
              <Plus size={14} /> Add income
            </button>
          </div>

          <div className="grid md:grid-cols-5 gap-3">
            <input value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Amount (e.g. 1497.00)" />
            <input type="datetime-local" value={incomeReceivedAtLocal} onChange={(e) => setIncomeReceivedAtLocal(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            <input value={incomeSource} onChange={(e) => setIncomeSource(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Source (Stripe/Denefit/Cash)" />
            <input value={incomeRef} onChange={(e) => setIncomeRef(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Reference ID" />
            <input value={incomeNotes} onChange={(e) => setIncomeNotes(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Notes" />
          </div>

          {income.length === 0 ? (
            <p className={FINELY_OS_ENTITY_BODY}>No income events yet.</p>
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
                          {new Date(ev.receivedAt).toLocaleString()} · {ev.source ?? '—'} · {ev.referenceId ?? '—'}
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
                        <div className={`${finelyOsCatalogCard('emerald')} p-3`} data-fc-accent="emerald">
                          <div className={FINELY_OS_ENTITY_SUBLABEL}>Allocated</div>
                          <div className={`${FINELY_OS_ENTITY_VALUE} font-mono text-xl`}>{fmtMoney(r.allocatedCents)}</div>
                        </div>
                        <div className={`${finelyOsCatalogCard('violet')} p-3`} data-fc-accent="violet">
                          <div className={FINELY_OS_ENTITY_SUBLABEL}>Remaining</div>
                          <div className={`${FINELY_OS_ENTITY_VALUE} font-mono text-xl`}>{fmtMoney(r.remainingCents)}</div>
                        </div>
                        <div className={`${finelyOsCatalogCard('sky')} p-3`} data-fc-accent="sky">
                          <div className={FINELY_OS_ENTITY_SUBLABEL}>Lines</div>
                          <div className={`${FINELY_OS_ENTITY_VALUE} font-mono text-xl`}>{r.lines.length}</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              }}
            />
          )}

          <button type="button" onClick={() => navigate('/admin/ops-agent')} className={FINELY_OS_SECONDARY_BTN}>
            Ask Co-owner Ops Agent <ArrowRight size={14} />
          </button>
        </section>
      ) : null}

      {deckPanel === 'exports' ? (
        <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
          <h2 className="text-3xl font-extrabold">Accounting export</h2>
          <p className={FINELY_OS_ENTITY_BODY}>Download allocation lines for up to 1,000 income events as CSV.</p>
          <button type="button" onClick={exportCsv} disabled={!activeTemplate} className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}>
            <Download size={14} /> Export CSV
          </button>
          {!activeTemplate ? (
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>Select a template first.</p>
          ) : (
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
              File: finance_allocations_{tenant?.slug || tenantId}.csv
            </p>
          )}
        </section>
      ) : null}

      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </section>
  );

  if (!auth.user) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Finance"
        title="Finance allocator"
        description="Sign in to track income and split it across buckets."
        accent={accent}
        surfaceMode={navItem?.surfaceMode ?? 'studio'}
        archetype={archetype}
        icon={navItem?.icon}
      >
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 ${FINELY_OS_ENTITY_BODY}`}>Not signed in.</div>
      </ProductHubScaffold>
    );
  }

  if (!allowed) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Finance"
        title="Finance allocator"
        description="Restricted to owners with finance tools enabled."
        accent={accent}
        surfaceMode={navItem?.surfaceMode ?? 'studio'}
        archetype={archetype}
        icon={navItem?.icon}
      >
        <div className={FINELY_OS_NOTICE_WARN}>
          <div className={FINELY_OS_ENTITY_BODY}>
            You do not have permission to use finance tools in this tenant. Ask an owner or admin to enable{' '}
            <span className="font-mono font-semibold">canUseFinanceTools</span>.
          </div>
        </div>
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Finance"
      title="Finance allocator"
      description="Track income and split it across taxes, marketing, payroll, agents, affiliates, and reserves."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="Add income" onClick={() => setDeckPanel('income')} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/ops-agent')}>
          Co-owner ops agent
        </button>
      }
      metrics={[
        { label: 'Gross', value: fmtMoney(totals?.gross ?? 0), hint: 'Last 200 events', accent: 'emerald', onClick: () => setDeckPanel('income') },
        { label: 'Allocated', value: fmtMoney(totals?.allocated ?? 0), hint: 'Across buckets', accent: 'violet', onClick: () => setDeckPanel('income') },
        { label: 'Remaining', value: fmtMoney(totals?.remaining ?? 0), hint: 'Unassigned', accent: 'sky', onClick: () => setDeckPanel('income') },
        { label: 'Templates', value: String(templates.length), hint: tenant?.name ?? tenantId, accent: 'rose', onClick: () => setDeckPanel('templates') },
      ]}
      metricTitle="Tenant money flow"
      metricDescription={`Active tenant: ${tenant?.name ?? tenantId}. Pick a template, record income, then export for accounting.`}
    >
      {renderCommandDeck()}
    </ProductHubScaffold>
  );
}
