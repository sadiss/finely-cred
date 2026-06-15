import React, { useEffect, useMemo, useState } from 'react';
import { Cpu, Crosshair, FastForward, Gavel, Scale } from 'lucide-react';
import type { DisputeCandidate } from '../../domain/creditReports';
import { bureauShortCode } from '../../utils/bureaus';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,  FINELY_OS_NOTICE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsGlassShell,
  finelyOsInlineListItem,
  finelyOsListItem,
  finelyOsStatusChip,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

export function DisputeWeaver({ fractures }: { fractures: DisputeCandidate[] }) {
  const [activeNode, setActiveNode] = useState<DisputeCandidate | null>(null);
  const [executing, setExecuting] = useState(false);
  const [query, setQuery] = useState('');
  const [filterBureau, setFilterBureau] = useState<'ALL' | 'EXP' | 'EQF' | 'TUC'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'COLLECTIONS' | 'LATES' | 'OTHER'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

  const handleExecute = () => {
    setExecuting(true);
    setTimeout(() => setExecuting(false), 3000);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const norm = (s: string) => (s || '').toLowerCase();
    const bucket = (c: DisputeCandidate) => {
      const t = norm(c.type);
      if (t.includes('collection') || t.includes('charge')) return 'COLLECTIONS' as const;
      if (t.includes('late') || t.includes('delinq')) return 'LATES' as const;
      return 'OTHER' as const;
    };
    return (fractures ?? [])
      .filter((c) => {
        if (q) {
          const hay = `${c.account} ${c.type} ${c.status} ${c.code} ${c.bureau}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (filterBureau !== 'ALL' && c.bureau !== filterBureau) return false;
        if (filterType !== 'ALL' && bucket(c) !== filterType) return false;
        if (filterStatus !== 'ALL') {
          const s = norm(c.status);
          const isClosed = s.includes('closed') || s.includes('paid') || s.includes('resolved');
          if (filterStatus === 'CLOSED' && !isClosed) return false;
          if (filterStatus === 'OPEN' && isClosed) return false;
        }
        return true;
      })
      .slice()
      .sort((a, b) => a.account.localeCompare(b.account));
  }, [fractures, filterBureau, filterStatus, filterType, query]);

  useEffect(() => {
    if (activeNode) return;
    if (filtered.length) setActiveNode(filtered[0]);
  }, [activeNode, filtered]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/[0.08] pb-5 gap-4">
        <div className="space-y-2 text-left min-w-0">
          <h3 className={FINELY_OS_ENTITY_TITLE}>
            Autonomous <span className="text-fuchsia-300">Dispute Weaver</span>
          </h3>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Statutory enforcement engine • NLP active</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0 flex-wrap">
          <button type="button" className={FINELY_OS_SECONDARY_BTN}>
            <Scale size={14} /> Audit mode
          </button>
          <button type="button" className={FINELY_OS_PRIMARY_BTN}>
            <FastForward size={14} /> Auto-execute
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-5 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Identified fractures</p>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${fractures.length ? 'bg-rose-500 animate-pulse' : 'bg-white/25'}`} />
              <span className="text-[9px] font-mono text-rose-300">
                {filtered.length} / {fractures.length} active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <div className={FINELY_OS_ENTITY_LABEL}>Search</div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Account name, type, code…" className={FINELY_OS_ENTITY_INPUT} />
            </label>
            <div className={`sm:col-span-2 ${FINELY_OS_VIEW_TABS} flex-wrap`}>
              {(['ALL', 'COLLECTIONS', 'LATES', 'OTHER'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setFilterType(t)} className={finelyOsViewTab(filterType === t, 'emerald')}>
                  {t === 'ALL' ? 'All' : t === 'COLLECTIONS' ? 'Collections/CO' : t === 'LATES' ? 'Lates' : 'Other'}
                </button>
              ))}
            </div>
            <div className={`sm:col-span-2 ${FINELY_OS_VIEW_TABS} flex-wrap`}>
              {[
                { id: 'ALL' as const, label: 'All bureaus', set: () => setFilterBureau('ALL') },
                { id: 'EXP' as const, label: 'EXP', set: () => setFilterBureau('EXP') },
                { id: 'EQF' as const, label: 'EQF', set: () => setFilterBureau('EQF') },
                { id: 'TUC' as const, label: 'Trans', set: () => setFilterBureau('TUC') },
              ].map((b) => (
                <button key={b.id} type="button" onClick={b.set} className={finelyOsViewTab(filterBureau === b.id, 'violet')}>
                  {b.label}
                </button>
              ))}
              {(['ALL', 'OPEN', 'CLOSED'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setFilterStatus(s)} className={finelyOsViewTab(filterStatus === s, 'sky')}>
                  {s === 'ALL' ? 'Any status' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony overflow-hidden`}>
            <div className={`px-4 py-3 border-b border-white/[0.08] ${FINELY_OS_ENTITY_SUBLABEL} flex items-center justify-between`}>
              <span>Queue</span>
              <span className="font-mono">{filtered.length}</span>
            </div>
            <div className="max-h-[560px] overflow-auto">
              {fractures.length === 0 ? (
                <div className={`p-6 ${FINELY_OS_ENTITY_BODY}`}>Upload an HTML credit report to populate dispute candidates from real tradelines and payment history.</div>
              ) : filtered.length === 0 ? (
                <div className={`p-6 ${FINELY_OS_ENTITY_BODY}`}>No items match your filter/search.</div>
              ) : (
                filtered.map((f) => {
                  const active = activeNode?.id === f.id;
                  return (
                    <button key={f.id} type="button" onClick={() => setActiveNode(f)} className={`w-full text-left px-4 py-4 border-b border-white/[0.08] transition-all ${active ? 'bg-fuchsia-500/10' : 'hover:bg-white/[0.04]'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{f.account}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className={finelyOsStatusChip('ok')}>{bureauShortCode(f.bureau)}</span>
                            <span className={finelyOsStatusChip('blocked')}>{f.type}</span>
                            <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono uppercase`}>{f.code}</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={finelyOsStatusChip('warn')}>{f.status}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 min-w-0">
          <div className={`${finelyOsGlassShell('panel', 'violet')} shadow-xl overflow-hidden`}>
            {activeNode ? (
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
                  <div className="min-w-0">
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>Target locked</div>
                    <div className={`mt-1 text-3xl font-extralight ${FINELY_OS_ENTITY_VALUE} truncate`}>{activeNode.account}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={finelyOsStatusChip('ok')}>{bureauShortCode(activeNode.bureau)}</span>
                      <span className={finelyOsStatusChip('blocked')}>{activeNode.type}</span>
                      <span className={`${FINELY_OS_ENTITY_CHIP} font-mono uppercase`}>{activeNode.code}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full border border-fuchsia-500/30 flex items-center justify-center bg-fuchsia-500/10">
                      <Cpu size={18} className="text-fuchsia-300" />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                    <div className={`flex items-center justify-between ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      <span>Readiness / injection</span>
                      <span className="font-mono">15 U.S.C. § 1681</span>
                    </div>
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/[0.08]">
                      <div className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-400 w-[75%]" />
                    </div>
                    <div className={FINELY_OS_ENTITY_BODY}>This panel is intentionally compact. Expand the draft below when you need to review language.</div>
                  </div>

                  <details className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                    <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_SUBLABEL}`}>Draft affidavit (collapsed)</summary>
                    <div className={`mt-4 p-4 fc-light-glass-panel fc-light-chrome-panel rounded-xl font-mono text-[11px] ${FINELY_OS_ENTITY_BODY} leading-relaxed relative overflow-hidden`}>
                      <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500" />
                      <span className="text-fuchsia-300 font-bold">DRAFT DISPUTE FINDINGS:</span>
                      <br />
                      <br />
                      "On my file, <span className="bg-fuchsia-500/20 px-1 rounded text-fuchsia-200">{activeNode.type.toLowerCase()}</span> for this furnisher reports status and balance fields that conflict with my records — specifically the {activeNode.code} line shows inconsistent dates and derogatory codes on the same tradeline..."
                    </div>
                  </details>

                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Actions</div>
                    <button type="button" onClick={handleExecute} className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center py-4`}>
                      {executing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Executing protocol...
                        </>
                      ) : (
                        <>
                          <Gavel size={18} /> Execute dispute cycle
                        </>
                      )}
                    </button>
                    <div className={FINELY_OS_ENTITY_BODY}>Next: we'll tie this action into your Evidence Vault + Letter Generator so execution produces a ready-to-send packet.</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-10 flex flex-col items-center justify-center text-center ${FINELY_OS_NOTICE}`}>
                <div className="w-20 h-20 rounded-full border-2 border-violet-200 flex items-center justify-center mb-6">
                  <Crosshair size={40} className="text-violet-400" />
                </div>
                <p className={`text-sm font-light uppercase tracking-widest ${FINELY_OS_ENTITY_BODY}`}>Select a fracture node to engage</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
