import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import { BASE_LENDER_PRESETS, stackingSortScore } from '../../data/localLenders';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsGlassShell,
  finelyOsInlineListItem,
  finelyOsListItem,
  finelyOsStatusChip,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

export interface LenderLogicEngineProps {
  userScore?: number;
  utilizationPct?: number;
  revenueMonthly?: number;
  timeInBusinessMonths?: number;
  zip?: string;
  radiusMiles?: number;
  hasRelationship?: boolean;
  willingToOpenDeposits?: boolean;
  noDocPreference?: boolean;
  prioritizeStacking?: boolean;
  onSelectTargetLender?: (lenderName: string, type: 'bank' | 'credit_union') => void;
  layout?: 'full' | 'compact';
}

function categoryIconClass(category: string) {
  if (category === 'credit_union') return 'text-emerald-700';
  if (category === 'local') return 'text-violet-700';
  return 'text-sky-700';
}

function matchPercentClass(match: number) {
  if (match >= 82) return 'text-emerald-700';
  if (match >= 62) return 'text-sky-300';
  return 'text-rose-700';
}

export function LenderLogicEngine({
  userScore,
  utilizationPct,
  revenueMonthly,
  timeInBusinessMonths,
  zip,
  radiusMiles = 50,
  hasRelationship = false,
  willingToOpenDeposits = true,
  noDocPreference = true,
  prioritizeStacking = false,
  onSelectTargetLender,
  layout = 'full',
}: LenderLogicEngineProps) {
  type Inputs = {
    score: number;
    utilizationPct?: number;
    revenueMonthly?: number;
    timeInBusinessMonths?: number;
    zip?: string;
    radiusMiles: number;
    hasRelationship: boolean;
    willingToOpenDeposits: boolean;
    noDocPreference: boolean;
  };
  type Requirement = {
    label: string;
    weight: number;
    pass: (i: Inputs) => boolean;
    tip: string;
  };
  type Lender = {
    id: string;
    bank: string;
    product: string;
    projectedLimit: string;
    category: 'national' | 'credit_union' | 'local';
    relationshipFriendly?: boolean;
    noDocFriendly?: boolean;
    color: string;
    accent: string;
    requirements: Requirement[];
  };

  const inputs: Inputs = useMemo(
    () => ({
      score: userScore ?? 640,
      utilizationPct,
      revenueMonthly,
      timeInBusinessMonths,
      zip: (zip || '').trim() || undefined,
      radiusMiles,
      hasRelationship,
      willingToOpenDeposits,
      noDocPreference,
    }),
    [userScore, utilizationPct, revenueMonthly, timeInBusinessMonths, zip, radiusMiles, hasRelationship, willingToOpenDeposits, noDocPreference],
  );

  const lenders = useMemo(() => {
    const relationshipOk = (i: Inputs) => Boolean(i.hasRelationship || i.willingToOpenDeposits);
    const zipOk = (i: Inputs) => Boolean((i.zip || '').trim().length >= 5);

    const base: Lender[] = BASE_LENDER_PRESETS.map((p) => {
      const req: Requirement[] = [];
      req.push({ label: 'Score 680+', weight: 26, pass: (i) => i.score >= 680, tip: 'Bring score to 680+ (utilization 1–9%, remove derogatories, add positive history).' });
      req.push({ label: 'Utilization ≤ 12%', weight: 18, pass: (i) => (i.utilizationPct ?? 99) <= 12, tip: 'Lower utilization into the 1–9% band right before applying.' });
      req.push({ label: 'Time in business ≥ 12 mo', weight: 16, pass: (i) => (i.timeInBusinessMonths ?? 0) >= 12, tip: 'If <12 months, build seasoning and stable deposits before higher-tier underwriting.' });
      req.push({ label: 'Revenue ≥ $7k/mo', weight: 14, pass: (i) => (i.revenueMonthly ?? 0) >= 7_000, tip: 'Increase consistency of deposits and revenue month-over-month.' });

      if (p.relationshipFriendly) {
        req.push({ label: 'Relationship lane (deposits / history)', weight: 16, pass: relationshipOk, tip: 'Relationship-based approvals improve when you open deposits and keep activity clean for 30–90 days.' });
      }
      if (p.category === 'local') {
        req.push({ label: `ZIP for local search (radius ${inputs.radiusMiles} mi)`, weight: 10, pass: zipOk, tip: 'Enter your ZIP so we can prioritize local banks/credit unions within 50 miles.' });
      }
      if (inputs.noDocPreference && p.noDocFriendly) {
        req.push({ label: 'No‑doc leaning (relationship-based)', weight: 10, pass: relationshipOk, tip: 'No‑doc lanes usually still require deposits/relationship signals. Open deposits and show activity.' });
      }

      return { ...p, requirements: req };
    });

    const zipStr = (inputs.zip || '').trim();
    const locals: Lender[] =
      zipStr.length >= 5
        ? [
            {
              id: `zip_local_cu_${zipStr}`,
              bank: `LOCAL CREDIT UNION (${zipStr})`,
              product: `Relationship LOC / card (≤${inputs.radiusMiles} miles)`,
              projectedLimit: '$10k - $100k',
              category: 'local',
              relationshipFriendly: true,
              noDocFriendly: true,
              color: '',
              accent: '',
              requirements: [
                { label: 'Relationship lane (deposits / history)', weight: 55, pass: relationshipOk, tip: 'Open business deposits + keep activity clean for 30–90 days before asking for limits.' },
                { label: 'Basic credit optics (score 660+)', weight: 25, pass: (i) => i.score >= 660, tip: 'Push to 660+ and keep utilization low.' },
                { label: 'Business story + docs ready', weight: 20, pass: (i) => (i.revenueMonthly ?? 0) >= 3_000, tip: 'Even “no-doc” lanes improve with deposits and a clean story.' },
              ],
            },
            {
              id: `zip_local_bank_${zipStr}`,
              bank: `LOCAL BANK (${zipStr})`,
              product: `Relationship line (≤${inputs.radiusMiles} miles)`,
              projectedLimit: '$25k - $250k',
              category: 'local',
              relationshipFriendly: true,
              noDocFriendly: true,
              color: '',
              accent: '',
              requirements: [
                { label: 'Relationship lane (deposits)', weight: 50, pass: relationshipOk, tip: 'Open deposits and build relationship before asking.' },
                { label: 'Time in business ≥ 6 mo', weight: 25, pass: (i) => (i.timeInBusinessMonths ?? 0) >= 6, tip: 'Seasoning improves local approvals.' },
                { label: 'Revenue ≥ $5k/mo', weight: 25, pass: (i) => (i.revenueMonthly ?? 0) >= 5_000, tip: 'Stable deposits can substitute for “docs-heavy” underwriting.' },
              ],
            },
            {
              id: `zip_regional_cu_${zipStr}`,
              bank: `REGIONAL CREDIT UNION (${zipStr})`,
              product: `Card + deposits lane (≤${inputs.radiusMiles} miles)`,
              projectedLimit: '$10k - $75k',
              category: 'credit_union',
              relationshipFriendly: true,
              noDocFriendly: true,
              color: '',
              accent: '',
              requirements: [
                { label: 'Relationship lane (deposits)', weight: 50, pass: relationshipOk, tip: 'Deposits + activity increases internal limits.' },
                { label: 'Utilization ≤ 15%', weight: 25, pass: (i) => (i.utilizationPct ?? 99) <= 15, tip: 'Drop utilization before applying.' },
                { label: 'Score 660+', weight: 25, pass: (i) => i.score >= 660, tip: 'Bring score up and remove negatives.' },
              ],
            },
          ]
        : [];

    return [...locals, ...base]
      .map((l) => {
        const total = l.requirements.reduce((a, r) => a + r.weight, 0) || 1;
        const earned = l.requirements.reduce((a, r) => a + (r.pass(inputs) ? r.weight : 0), 0);
        const match = Math.max(5, Math.min(99, Math.round((earned / total) * 100)));
        const status = match >= 82 ? 'High probability' : match >= 62 ? 'Moderate match' : 'Needs prep';
        const nextActions = l.requirements.filter((r) => !r.pass(inputs)).slice(0, 3).map((r) => r.tip);
        const preset = BASE_LENDER_PRESETS.find((p) => p.id === l.id);
        const stackingBoost = prioritizeStacking && preset ? stackingSortScore(preset) / 1000 : 0;
        return { ...l, match, status, nextActions, stackingBoost, limitBias: preset?.limitBias, stackingTier: preset?.stackingTier };
      })
      .sort((a, b) => {
        if (prioritizeStacking) {
          const stackDiff = (b.stackingBoost ?? 0) - (a.stackingBoost ?? 0);
          if (Math.abs(stackDiff) > 0.5) return stackDiff > 0 ? 1 : -1;
        }
        return b.match - a.match;
      });
  }, [inputs, prioritizeStacking]);

  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<'all' | 'high' | 'mid' | 'prep'>('all');
  const [category, setCategory] = useState<'all' | 'local' | 'credit_union' | 'national'>(prioritizeStacking ? 'credit_union' : 'all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lenders.filter((l) => {
      const statusTier = l.match >= 82 ? 'high' : l.match >= 62 ? 'mid' : 'prep';
      if (tier !== 'all' && statusTier !== tier) return false;
      if (category !== 'all' && l.category !== category) return false;
      if (!q) return true;
      return `${l.bank} ${l.product}`.toLowerCase().includes(q);
    });
  }, [lenders, query, tier, category]);

  const [selectedId, setSelectedId] = useState<string>(() => lenders[0]?.id ?? '');
  useEffect(() => {
    const next = (filtered[0]?.id ?? lenders[0]?.id) || '';
    if (!next) return;
    if (!filtered.some((x) => x.id === selectedId)) setSelectedId(next);
  }, [filtered, lenders, selectedId]);

  const selected = useMemo(() => filtered.find((x) => x.id === selectedId) ?? lenders.find((x) => x.id === selectedId) ?? null, [filtered, lenders, selectedId]);

  const compactTop = filtered.slice(0, 6);

  const renderLenderRow = (l: (typeof filtered)[number]) => {
    const active = l.id === selectedId;
    return (
      <button
        key={l.id}
        type="button"
        onClick={() => setSelectedId(l.id)}
        className={`w-full text-left px-4 py-4 transition-all rounded-xl border ${active ? 'border-fuchsia-500/40 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/25' : 'border-transparent hover:bg-white/[0.04]'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-white/[0.08] flex items-center justify-center bg-white/[0.04] shadow-sm">
                <Building2 size={18} className={categoryIconClass(l.category)} />
              </div>
              <div className="min-w-0">
                <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{l.bank}</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} truncate`}>{l.product}</div>
                {prioritizeStacking && l.limitBias === 'high' ? (
                  <div className="mt-1 text-[9px] uppercase tracking-widest text-emerald-700">High-limit stack</div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className={finelyOsStatusChip(l.match >= 82 ? 'ok' : l.match >= 62 ? 'warn' : 'blocked')}>{l.match}%</span>
            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>{l.status}</div>
          </div>
        </div>
      </button>
    );
  };

  const inputsChip = (
    <div className={FINELY_OS_ENTITY_CHIP}>
      score: <span className={FINELY_OS_ENTITY_VALUE}>{inputs.score}</span>
      {typeof inputs.utilizationPct === 'number' ? <> • util: <span className={FINELY_OS_ENTITY_VALUE}>{inputs.utilizationPct}%</span></> : null}
      {typeof inputs.revenueMonthly === 'number' ? <> • rev: <span className={FINELY_OS_ENTITY_VALUE}>${inputs.revenueMonthly.toLocaleString()}</span>/mo</> : null}
      {inputs.zip ? <> • zip: <span className={FINELY_OS_ENTITY_VALUE}>{inputs.zip}</span></> : null}
    </div>
  );

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-6 ${layout === 'compact' ? 'p-4' : ''}`}>
      {layout === 'full' ? (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-2 text-left min-w-0">
            <h3 className={FINELY_OS_ENTITY_TITLE}>
              Lender <span className="text-sky-300">Logic</span>
            </h3>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Algorithmic underwriting fit • Live inputs</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {inputsChip}
            <div className={FINELY_OS_NOTICE_WARN}>AI confidence: <span className="font-black">98%</span></div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Top stacking matches — tap to preview requirements</p>
          <div className={`${FINELY_OS_ENTITY_CHIP} font-mono`}>score {inputs.score}{inputs.zip ? ` • ${inputs.zip}` : ''}</div>
        </div>
      )}

      <div className={`grid gap-6 ${layout === 'compact' ? 'grid-cols-1 xl:grid-cols-12' : 'lg:grid-cols-12'}`}>
        <div className={`space-y-4 min-w-0 ${layout === 'compact' ? 'xl:col-span-5' : 'lg:col-span-5'}`}>
          {layout === 'full' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block sm:col-span-2">
                <div className={FINELY_OS_ENTITY_LABEL}>Search lender</div>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Navy Federal, PenFed, local CU, community bank…" className={FINELY_OS_ENTITY_INPUT} />
              </label>
              <div className={`sm:col-span-2 ${FINELY_OS_VIEW_TABS} flex-wrap`}>
                {(['all', 'high', 'mid', 'prep'] as const).map((t) => (
                  <button key={t} type="button" className={finelyOsViewTab(tier === t, 'emerald')} onClick={() => setTier(t)}>
                    {t === 'all' ? 'All' : t === 'high' ? 'High' : t === 'mid' ? 'Moderate' : 'Needs prep'}
                  </button>
                ))}
              </div>
              <div className={`sm:col-span-2 ${FINELY_OS_VIEW_TABS} flex-wrap`}>
                {(['all', 'local', 'credit_union', 'national'] as const).map((c) => (
                  <button key={c} type="button" className={finelyOsViewTab(category === c, 'violet')} onClick={() => setCategory(c)}>
                    {c === 'all' ? 'All categories' : c === 'credit_union' ? 'Credit unions' : c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {compactTop.map((l) => {
                const active = l.id === selectedId;
                return (
                  <button key={l.id} type="button" onClick={() => setSelectedId(l.id)} className={finelyOsListItem(active, 'fuchsia')}>
                    <p className={`${FINELY_OS_ENTITY_SUBLABEL} truncate`}>{l.category.replace('_', ' ')}</p>
                    <p className={`text-sm ${FINELY_OS_ENTITY_VALUE} truncate mt-1`}>{l.bank}</p>
                    <p className={`text-lg font-bold mt-2 ${matchPercentClass(l.match)}`}>{l.match}%</p>
                  </button>
                );
              })}
            </div>
          )}

          {layout === 'compact' && filtered.length > 6 ? (
            <FinelyOsPaginatedStack
              items={filtered.slice(6)}
              pageSize={6}
              emptyMessage="No additional matches."
              itemSpacingClassName="grid grid-cols-2 sm:grid-cols-3 gap-2"
              renderItem={(l) => (
                <button key={l.id} type="button" onClick={() => setSelectedId(l.id)} className={`text-left rounded-lg border px-2 py-2 text-xs truncate ${finelyOsListItem(l.id === selectedId, 'fuchsia')}`}>
                  {l.bank} · {l.match}%
                </button>
              )}
            />
          ) : null}

          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony overflow-hidden`}>
            <div className={`px-4 py-3 border-b border-white/[0.08] ${FINELY_OS_ENTITY_SUBLABEL} flex items-center justify-between`}>
              <span>{layout === 'compact' ? 'Selected match' : 'Lenders'}</span>
              <span className="font-mono">{layout === 'compact' ? 1 : filtered.length}</span>
            </div>
            {layout === 'full' ? (
              <div className="p-3">
                <FinelyOsPaginatedStack
                  items={filtered}
                  pageSize={8}
                  emptyMessage="No lenders match this filter/search."
                  itemSpacingClassName="space-y-2"
                  renderItem={renderLenderRow}
                />
              </div>
            ) : selected ? (
              <div className="p-4 space-y-2">
                <p className={`text-sm ${FINELY_OS_ENTITY_VALUE}`}>{selected.bank}</p>
                <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{selected.product}</p>
                <p className={`text-2xl font-bold ${matchPercentClass(selected.match)}`}>{selected.match}% fit</p>
              </div>
            ) : (
              <div className={`p-4 text-sm ${FINELY_OS_ENTITY_BODY}`}>Select a match above.</div>
            )}
          </div>
        </div>

        <div className={`min-w-0 ${layout === 'compact' ? 'xl:col-span-7' : 'lg:col-span-7'}`}>
          {selected ? (
            <div className={`${finelyOsGlassShell('panel', 'sky')} space-y-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Recommended lender</div>
                  <div className={`mt-1 text-2xl font-light ${FINELY_OS_ENTITY_VALUE} truncate`}>{selected.bank}</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} truncate`}>{selected.product}</div>
                </div>
                <div className="shrink-0 flex flex-wrap items-center gap-2">
                  <div className={FINELY_OS_ENTITY_CHIP}>
                    projected: <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>{selected.projectedLimit}</span>
                  </div>
                  <div className={finelyOsStatusChip(selected.match >= 82 ? 'ok' : selected.match >= 62 ? 'warn' : 'blocked')}>fit: {selected.match}%</div>
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                <div className="flex items-center justify-between gap-3">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Key criteria</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>pass/fail</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {selected.requirements.map((r) => {
                    const ok = r.pass(inputs);
                    return (
                      <div key={r.label} className={finelyOsInlineListItem()}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`text-sm ${FINELY_OS_ENTITY_VALUE}`}>{r.label}</div>
                            <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{ok ? 'Meets requirement.' : r.tip}</div>
                          </div>
                          <div className={`w-3 h-3 rounded-full shrink-0 ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} title={ok ? 'Pass' : 'Fail'} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                <div className="flex items-center justify-between gap-3">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Next best actions</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>top 3</div>
                </div>
                {selected.nextActions.length ? (
                  <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
                    {selected.nextActions.map((t, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <span className="min-w-0">{t}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={FINELY_OS_ENTITY_BODY}>You’re in a strong lane for this lender. Keep documentation tight and apply strategically.</div>
                )}
                {onSelectTargetLender ? (
                  <button
                    type="button"
                    onClick={() => onSelectTargetLender(selected.bank, selected.category === 'credit_union' ? 'credit_union' : 'bank')}
                    className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center`}
                  >
                    Set as target bank <ArrowRight size={12} />
                  </button>
                ) : null}
                <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`}>
                  Initiate application <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY}`}>Select a lender to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
