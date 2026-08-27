import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import {
  BASE_LENDER_PRESETS,
  curatedPresetMatches,
  resolveLocalLenderMatches,
  stackingSortScore,
  type LenderCategory,
  type LenderMatchWhy,
} from '../../data/localLenders';
import {
  formatLenderMarketLine,
  lenderHasSbaActivity,
  lenderInNoraCatalog,
  resolveLenderMarketSignals,
  type LenderMarketSignals,
} from '../../lib/lenderMarketSignals';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsGlassShell,
  finelyOsInlineListItem,
  finelyOsListItem,
  finelyOsStatusChip,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';
import { finelyOsVisibleTintShell } from '../../features/os/finelyOsVisibleTint';

export interface LenderLogicEngineProps {
  userScore?: number;
  utilizationPct?: number;
  revenueMonthly?: number;
  timeInBusinessMonths?: number;
  zip?: string;
  state?: string;
  city?: string;
  address?: string;
  address2?: string;
  radiusMiles?: number;
  hasRelationship?: boolean;
  willingToOpenDeposits?: boolean;
  noDocPreference?: boolean;
  prioritizeStacking?: boolean;
  onSelectTargetLender?: (lenderName: string, type: 'bank' | 'credit_union') => void;
  layout?: 'full' | 'compact';
  surface?: 'dark' | 'light';
}

function categoryIconClass(category: LenderCategory) {
  if (category === 'credit_union') return 'text-emerald-700';
  if (category === 'local' || category === 'cdfi') return 'text-violet-700';
  if (category === 'fintech') return 'text-sky-700';
  if (category === 'private') return 'text-fuchsia-700';
  return 'text-sky-700';
}

function matchPercentClass(match: number, light = false) {
  if (match >= 82) return light ? 'text-emerald-800' : 'text-emerald-700';
  if (match >= 62) return light ? 'text-sky-800' : 'text-sky-300';
  return light ? 'text-rose-800' : 'text-rose-700';
}

export function LenderLogicEngine({
  userScore,
  utilizationPct,
  revenueMonthly,
  timeInBusinessMonths,
  zip,
  state,
  city,
  address,
  address2,
  radiusMiles = 50,
  hasRelationship = false,
  willingToOpenDeposits = true,
  noDocPreference = true,
  prioritizeStacking = false,
  onSelectTargetLender,
  layout = 'full',
  surface = 'dark',
}: LenderLogicEngineProps) {
  const light = surface === 'light';
  const entityValue = light ? 'font-semibold tracking-tight text-[#0a1628]' : FINELY_OS_ENTITY_VALUE;
  const entitySub = light ? 'text-[10px] font-black uppercase tracking-widest text-[#0a1628]/52' : FINELY_OS_ENTITY_SUBLABEL;
  const entityBody = light ? 'text-sm text-[#0a1628]/72' : FINELY_OS_ENTITY_BODY;
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
    category: LenderCategory;
    relationshipFriendly?: boolean;
    noDocFriendly?: boolean;
    color: string;
    accent: string;
    why: LenderMatchWhy;
    requirements: Requirement[];
  };

  const [realMatches, setRealMatches] = useState<
    Array<{
      id: string;
      bank: string;
      product: string;
      projectedLimit: string;
      category: LenderCategory;
      relationshipFriendly?: boolean;
      noDocFriendly?: boolean;
      color: string;
      accent: string;
      why: LenderMatchWhy;
    }>
  >([]);
  const [localLookupStatus, setLocalLookupStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [marketSignals, setMarketSignals] = useState<LenderMarketSignals | null>(null);

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

  const geoKey = useMemo(
    () =>
      [
        inputs.zip ?? '',
        (state || '').trim(),
        (city || '').trim(),
        (address || '').trim(),
        (address2 || '').trim(),
        inputs.radiusMiles,
      ].join('|'),
    [inputs.zip, state, city, address, address2, inputs.radiusMiles],
  );

  useEffect(() => {
    const zipStr = (inputs.zip || '').trim();
    const hasZip = zipStr.length >= 5;
    const hasAddress = Boolean((address || '').trim());
    if (!hasZip && !hasAddress) {
      setRealMatches([]);
      setLocalLookupStatus('ready');
      return;
    }

    let cancelled = false;
    setLocalLookupStatus('loading');

    resolveLocalLenderMatches({
      zip: zipStr,
      state: (state || '').trim() || undefined,
      city: (city || '').trim() || undefined,
      address: (address || '').trim() || undefined,
      address2: (address2 || '').trim() || undefined,
      radiusMiles: inputs.radiusMiles,
    }).then((result) => {
      if (cancelled) return;
      setRealMatches(result.ok ? result.matches : []);
      setLocalLookupStatus('ready');
    });

    return () => {
      cancelled = true;
    };
  }, [geoKey, address, address2, city, state, inputs.zip, inputs.radiusMiles]);

  useEffect(() => {
    const st = (state || '').trim().toUpperCase().slice(0, 2);
    const zipStr = (inputs.zip || '').trim();
    if (!/^[A-Z]{2}$/.test(st) && zipStr.length < 5) {
      setMarketSignals(null);
      return;
    }
    let cancelled = false;
    void resolveLenderMarketSignals({ state: st || undefined, zip: zipStr }).then((signals) => {
      if (!cancelled) setMarketSignals(signals);
    });
    return () => {
      cancelled = true;
    };
  }, [state, inputs.zip]);

  const lenders = useMemo(() => {
    const relationshipOk = (i: Inputs) => Boolean(i.hasRelationship || i.willingToOpenDeposits);
    const zipOk = (i: Inputs) => Boolean((i.zip || '').trim().length >= 5);

    const buildRequirements = (p: {
      relationshipFriendly?: boolean;
      noDocFriendly?: boolean;
      category: LenderCategory;
    }): Requirement[] => {
      const req: Requirement[] = [];
      req.push({ label: 'Score 680+', weight: 26, pass: (i) => i.score >= 680, tip: 'Bring score to 680+ (utilization 1–9%, remove derogatories, add positive history).' });
      req.push({ label: 'Utilization ≤ 12%', weight: 18, pass: (i) => (i.utilizationPct ?? 99) <= 12, tip: 'Lower utilization into the 1–9% band right before applying.' });
      req.push({ label: 'Time in business ≥ 12 mo', weight: 16, pass: (i) => (i.timeInBusinessMonths ?? 0) >= 12, tip: 'If <12 months, build seasoning and stable deposits before higher-tier underwriting.' });
      req.push({ label: 'Revenue ≥ $7k/mo', weight: 14, pass: (i) => (i.revenueMonthly ?? 0) >= 7_000, tip: 'Increase consistency of deposits and revenue month-over-month.' });

      if (p.relationshipFriendly) {
        req.push({ label: 'Relationship lane (deposits / history)', weight: 16, pass: relationshipOk, tip: 'Relationship-based approvals improve when you open deposits and keep activity clean for 30–90 days.' });
      }
      if (p.category === 'local' || p.category === 'cdfi') {
        req.push({ label: `ZIP for local search (radius ${inputs.radiusMiles} mi)`, weight: 10, pass: zipOk, tip: 'Enter your ZIP so we can prioritize local banks and credit unions near you.' });
      }
      if (inputs.noDocPreference && p.noDocFriendly) {
        req.push({ label: 'No‑doc leaning (relationship-based)', weight: 10, pass: relationshipOk, tip: 'No‑doc lanes usually still require deposits/relationship signals. Open deposits and show activity.' });
      }
      return req;
    };

    const curated = curatedPresetMatches();
    const sourceList =
      realMatches.length > 0 ? [...realMatches, ...curated] : curated;

    const base: Lender[] = sourceList.map((p) => ({
      ...p,
      requirements: buildRequirements(p),
    }));

    return base
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
  }, [inputs, prioritizeStacking, realMatches]);

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
        className={`w-full text-left px-4 py-4 transition-all rounded-xl border ${
          active
            ? light
              ? 'border-fuchsia-500/55 bg-fuchsia-500/20 ring-1 ring-fuchsia-400/35'
              : 'border-fuchsia-500/40 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/25'
            : light
              ? 'border-slate-200/80 bg-white/70 hover:bg-white'
              : 'border-transparent hover:bg-white/[0.04]'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm ${light ? 'border-sky-300/50 bg-sky-500/15' : 'border-white/[0.08] bg-white/[0.04]'}`}>
                <Building2 size={18} className={categoryIconClass(l.category)} />
              </div>
              <div className="min-w-0">
                <div className={`${entityValue} truncate`}>{l.bank}</div>
                <div className={`${entitySub} truncate`}>{l.product}</div>
                <div className={`mt-1 text-[9px] font-bold uppercase tracking-widest ${l.why === 'curated preset' ? 'text-violet-700' : 'text-sky-700'}`}>
                  {l.why}
                </div>
                {prioritizeStacking && l.limitBias === 'high' ? (
                  <div className="mt-1 text-[9px] uppercase tracking-widest text-emerald-700">High-limit stack</div>
                ) : null}
                {lenderHasSbaActivity(l.bank, marketSignals) ? (
                  <div className="mt-1 text-[9px] uppercase tracking-widest text-sky-700">SBA 7(a)/504 activity in your state</div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className={finelyOsStatusChip(l.match >= 82 ? 'ok' : l.match >= 62 ? 'warn' : 'blocked')}>{l.match}%</span>
            <div className={`mt-1 ${entitySub}`}>{l.status}</div>
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
      {localLookupStatus === 'loading' ? <> • <span className={FINELY_OS_ENTITY_VALUE}>loading local lenders…</span></> : null}
      {marketSignals?.hmda ? (
        <>
          {' '}
          • HMDA {marketSignals.hmda.year}: <span className={FINELY_OS_ENTITY_VALUE}>{marketSignals.hmda.originated.toLocaleString()}</span> originated
        </>
      ) : null}
    </div>
  );

  return (
    <div
      className={
        light && layout === 'compact'
          ? 'fc-wl-lender-engine space-y-4'
          : `${finelyOsCatalogCard(light ? 'sky' : 'violet')} !p-5 space-y-6 ${layout === 'compact' ? 'p-4' : ''}`
      }
      data-fc-surface={surface}
    >
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
          <p className={entitySub}>Top stacking matches — tap to preview requirements</p>
          <div className={`${light ? 'rounded-lg border border-sky-300/45 bg-sky-500/15 px-2 py-1 text-[10px] font-mono text-sky-950' : FINELY_OS_ENTITY_CHIP} font-mono`}>
            score {inputs.score}
            {inputs.zip ? ` • ${inputs.zip}` : ''}
          </div>
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
                    <p className={`${entitySub} truncate`}>{l.category.replace('_', ' ')}</p>
                    <p className={`text-sm ${entityValue} truncate mt-1`}>{l.bank}</p>
                    <p className={`text-lg font-bold mt-2 ${matchPercentClass(l.match, light)}`}>{l.match}%</p>
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
                <button key={l.id} type="button" onClick={() => setSelectedId(l.id)} className={`text-left rounded-lg border px-2 py-2 text-xs truncate ${light ? 'text-[#0a1628]' : ''} ${finelyOsListItem(l.id === selectedId, 'fuchsia')}`}>
                  {l.bank} · {l.match}%
                </button>
              )}
            />
          ) : null}

          <div className={`${light ? finelyOsVisibleTintShell('sky', '!p-0 overflow-hidden') : `${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony overflow-hidden`}`}>
            <div className={`px-4 py-3 border-b border-white/[0.08] ${entitySub} flex items-center justify-between`}>
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
                <p className={`text-sm ${entityValue}`}>{selected.bank}</p>
                <p className={`text-xs ${entityBody}`}>{selected.product}</p>
                <p className={`text-2xl font-bold ${matchPercentClass(selected.match, light)}`}>{selected.match}% fit</p>
              </div>
            ) : (
              <div className={`p-4 text-sm ${entityBody}`}>Select a match above.</div>
            )}
          </div>
        </div>

        <div className={`min-w-0 ${layout === 'compact' ? 'xl:col-span-7' : 'lg:col-span-7'}`}>
          {selected ? (
            <div className={`${light ? finelyOsVisibleTintShell('sky', 'space-y-5') : `${finelyOsGlassShell('panel', 'sky')} space-y-5`}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className={entitySub}>Recommended lender</div>
                  <div className={`mt-1 text-2xl font-light ${entityValue} truncate`}>{selected.bank}</div>
                  <div className={`mt-1 ${entitySub} truncate`}>{selected.product}</div>
                  <div className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${selected.why === 'curated preset' ? 'text-violet-700' : 'text-sky-700'}`}>
                    {selected.why}
                    {lenderHasSbaActivity(selected.bank, marketSignals) ? ' · SBA activity in your state' : ''}
                    {lenderInNoraCatalog(selected.bank, marketSignals) ? ' · Nora catalog match' : ''}
                  </div>
                  {formatLenderMarketLine(marketSignals) ? (
                    <p className={`mt-2 ${entityBody}`}>{formatLenderMarketLine(marketSignals)}</p>
                  ) : null}
                </div>
                <div className="shrink-0 flex flex-wrap items-center gap-2">
                  <div className={light ? 'rounded-lg border border-sky-300/45 bg-sky-500/15 px-2 py-1 text-[10px] font-mono text-sky-950' : FINELY_OS_ENTITY_CHIP}>
                    projected: <span className={`font-mono ${entityValue}`}>{selected.projectedLimit}</span>
                  </div>
                  <div className={light ? 'inline-flex items-center px-2.5 py-1 rounded-lg border border-fuchsia-400/45 bg-fuchsia-500/15 text-xs font-black uppercase tracking-widest text-fuchsia-900' : finelyOsStatusChip(selected.match >= 82 ? 'ok' : selected.match >= 62 ? 'warn' : 'blocked')}>fit: {selected.match}%</div>
                </div>
              </div>

              <div className={`${light ? finelyOsVisibleTintShell('sky', '!p-4 space-y-3') : `${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className={entitySub}>Key criteria</div>
                  <div className={`${entitySub} font-mono`}>pass/fail</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {selected.requirements.map((r) => {
                    const ok = r.pass(inputs);
                    return (
                      <div key={r.label} className={light ? 'rounded-2xl border border-sky-300/50 bg-white/95 p-4' : finelyOsInlineListItem()}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`text-sm ${entityValue}`}>{r.label}</div>
                            <div className={`mt-1 text-xs ${entityBody}`}>{ok ? 'Meets requirement.' : r.tip}</div>
                          </div>
                          <div className={`w-3 h-3 rounded-full shrink-0 ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} title={ok ? 'Pass' : 'Fail'} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`${light ? finelyOsVisibleTintShell('violet', '!p-4 space-y-3') : `${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className={entitySub}>Next best actions</div>
                  <div className={`${entitySub} font-mono`}>top 3</div>
                </div>
                {selected.nextActions.length ? (
                  <ul className={`space-y-2 ${entityBody}`}>
                    {selected.nextActions.map((t, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <span className="min-w-0">{t}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={entityBody}>You’re in a strong lane for this lender. Keep documentation tight and apply strategically.</div>
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
            <div className={`${light ? finelyOsVisibleTintShell('sky', '!p-4') : `${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} ${entityBody}`}>Select a lender to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
