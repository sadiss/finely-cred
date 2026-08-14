import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckSquare,
  ChevronRight,
  FileText,
  Gavel,
  Layers,
  Search,
  Shield,
  Sparkles,
  Square,
  TrendingDown,
  Zap,
} from 'lucide-react';
import type { Bureau, DisputeCandidate, ParsedCreditReport } from '../../domain/creditReports';
import type { DisputeCase } from '../../domain/cases';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import { bureauFullName, bureauShortCode } from '../../utils/bureaus';
import { letterCategoryForCandidate } from '../../creditReports/letterCategory';
import { FINELY_OS_MODAL_HEADER } from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';

export type DisputePickSource =
  | { kind: 'report'; reportId: string }
  | { kind: 'case'; caseId: string; caseItemId: string };

export type SelectedDispute = {
  key: string;
  candidate: DisputeCandidate;
  source: DisputePickSource;
  prefillEvidenceId?: string;
  prefillReasons?: string[];
};

const CATEGORY_STYLE: Record<string, { tone: string; icon: typeof Gavel }> = {
  'Collections & charge-offs': { tone: 'from-rose-500/20 to-rose-950/30 border-rose-400/35 text-rose-100', icon: AlertTriangle },
  'Late payments': { tone: 'from-amber-500/20 to-amber-950/30 border-amber-400/35 text-amber-100', icon: Zap },
  Inquiries: { tone: 'from-sky-500/20 to-sky-950/30 border-sky-400/35 text-sky-100', icon: Search },
  'Public records': { tone: 'from-violet-500/20 to-violet-950/30 border-violet-400/35 text-violet-100', icon: Shield },
  Repossessions: { tone: 'from-orange-500/20 to-orange-950/30 border-orange-400/35 text-orange-100', icon: AlertTriangle },
  Foreclosures: { tone: 'from-fuchsia-500/20 to-fuchsia-950/30 border-fuchsia-400/35 text-fuchsia-100', icon: AlertTriangle },
  'Student loans': { tone: 'from-emerald-500/20 to-emerald-950/30 border-emerald-400/35 text-emerald-100', icon: FileText },
  'Other negatives': { tone: 'from-slate-500/20 to-slate-950/30 border-white/15 text-white/80', icon: Gavel },
};

function categoryStyle(label: string) {
  return CATEGORY_STYLE[label] ?? CATEGORY_STYLE['Other negatives']!;
}

export function DisputePickerModal({
  open,
  onClose,
  reports,
  cases,
  initialSelected,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  reports: { id: string; filename: string; parsed?: ParsedCreditReport | null }[];
  cases: DisputeCase[];
  initialSelected: SelectedDispute[];
  onApply: (next: SelectedDispute[]) => void;
}) {
  const [sourceTab, setSourceTab] = useState<'report' | 'cases'>(() =>
    reports.length > 0 ? 'report' : cases.length > 0 ? 'cases' : 'report',
  );
  const [query, setQuery] = useState('');
  const [bureauFilter, setBureauFilter] = useState<'ALL' | Bureau>('ALL');
  const [activeCategory, setActiveCategory] = useState<string | 'ALL'>('ALL');
  const [notice, setNotice] = useState<string | null>(null);
  const [activeReportId, setActiveReportId] = useState<string>(reports[0]?.id ?? '');
  const [activeCaseId, setActiveCaseId] = useState<string>(cases[0]?.id ?? '');

  const [selectedByKey, setSelectedByKey] = useState<Record<string, SelectedDispute>>(() =>
    Object.fromEntries((initialSelected || []).map((s) => [s.key, s])),
  );

  useEffect(() => {
    if (!open) return;
    setSelectedByKey(Object.fromEntries((initialSelected || []).map((s) => [s.key, s])));
    setQuery('');
    setBureauFilter('ALL');
    setActiveCategory('ALL');
    setNotice(null);
    setSourceTab(reports.length > 0 ? 'report' : cases.length > 0 ? 'cases' : 'report');
    if (!activeReportId && reports[0]?.id) setActiveReportId(reports[0].id);
    if (!activeCaseId && cases[0]?.id) setActiveCaseId(cases[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parsed = useMemo(() => reports.find((r) => r.id === activeReportId)?.parsed ?? null, [reports, activeReportId]);

  const allReportCandidates = useMemo(() => {
    if (!parsed) return [];
    return deriveDisputeCandidates(parsed, activeReportId);
  }, [parsed, activeReportId]);

  const reportCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allReportCandidates.filter((c) => {
      if (bureauFilter !== 'ALL' && c.bureau !== bureauFilter) return false;
      if (activeCategory !== 'ALL' && letterCategoryForCandidate(c).label !== activeCategory) return false;
      if (!q) return true;
      return `${c.account} ${c.type} ${c.status} ${c.code}`.toLowerCase().includes(q);
    });
  }, [allReportCandidates, query, bureauFilter, activeCategory]);

  const groupedReportCandidates = useMemo(() => {
    const order = ['Collections & charge-offs', 'Late payments', 'Inquiries', 'Public records', 'Repossessions', 'Foreclosures', 'Student loans', 'Other negatives'];
    const idx = (t: string) => {
      const i = order.indexOf(t);
      return i >= 0 ? i : 999;
    };
    const m = new Map<string, DisputeCandidate[]>();
    for (const c of reportCandidates) {
      const k = letterCategoryForCandidate(c).label;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(c);
    }
    return Array.from(m.entries())
      .map(([label, list]) => [label, list.slice().sort((a, b) => a.account.localeCompare(b.account))] as const)
      .sort((a, b) => idx(a[0]) - idx(b[0]) || a[0].localeCompare(b[0]));
  }, [reportCandidates]);

  const categorySummaries = useMemo(() => {
    const m = new Map<string, { total: number; selected: number }>();
    for (const c of allReportCandidates) {
      const label = letterCategoryForCandidate(c).label;
      const cur = m.get(label) ?? { total: 0, selected: 0 };
      cur.total += 1;
      if (selectedByKey[c.id]) cur.selected += 1;
      m.set(label, cur);
    }
    return m;
  }, [allReportCandidates, selectedByKey]);

  const kpis = useMemo(() => {
    const selected = Object.values(selectedByKey);
    const byBureau = { EXP: 0, EQF: 0, TUC: 0 } as Record<Bureau, number>;
    for (const s of selected) byBureau[s.candidate.bureau] = (byBureau[s.candidate.bureau] ?? 0) + 1;
    return {
      totalNegatives: allReportCandidates.length,
      selected: selected.length,
      categories: categorySummaries.size,
      exp: byBureau.EXP,
      eqf: byBureau.EQF,
      tuc: byBureau.TUC,
    };
  }, [allReportCandidates.length, selectedByKey, categorySummaries.size]);

  const activeCase = useMemo(() => cases.find((c) => c.id === activeCaseId) ?? null, [cases, activeCaseId]);

  const isSelected = (key: string) => Boolean(selectedByKey[key]);

  const toggle = (s: SelectedDispute) => {
    setSelectedByKey((prev) => {
      if (prev[s.key]) {
        const next = { ...prev };
        delete next[s.key];
        setNotice(null);
        return next;
      }
      const bureau = s.candidate.bureau;
      const existing = Object.values(prev).filter((x) => x.candidate.bureau === bureau);
      if (existing.length) {
        const haveCat = letterCategoryForCandidate(existing[0]!.candidate).key;
        const nextCat = letterCategoryForCandidate(s.candidate).key;
        if (haveCat !== nextCat) {
          setNotice(
            `${bureauShortCode(bureau)} letters use one negative category per round. Clear "${letterCategoryForCandidate(existing[0]!.candidate).label}" before adding "${letterCategoryForCandidate(s.candidate).label}".`,
          );
          return prev;
        }
      }
      setNotice(null);
      return { ...prev, [s.key]: s };
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/88 backdrop-blur-md" onClick={onClose} />
      <div
        className="relative w-full max-w-6xl max-h-[94vh] rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-[#0c0f14] via-[#10131c] to-[#0a0d12] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${FINELY_OS_MODAL_HEADER} p-5 md:p-6 bg-gradient-to-r from-amber-500/10 via-transparent to-fuchsia-500/5`}>
          <div className="flex items-start justify-between gap-4 w-full">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                <Sparkles size={12} /> Dispute intelligence
              </div>
              <h2 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">Choose your negatives</h2>
              <p className="mt-1 text-sm text-white/55 max-w-2xl">
                Pick by category — collections, lates, inquiries, and more. We split selections into separate bureau letters automatically.
              </p>
            </div>
            <FinelyOsModalCloseButton onClick={onClose} />
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { label: 'Negatives found', value: kpis.totalNegatives, tone: 'from-slate-500/15 to-slate-900/40 border-white/15', icon: TrendingDown, accent: 'text-white' },
              { label: 'Selected', value: kpis.selected, tone: 'from-emerald-500/25 to-emerald-950/40 border-emerald-400/40', icon: CheckSquare, accent: 'text-emerald-100' },
              { label: 'Categories', value: kpis.categories, tone: 'from-violet-500/20 to-violet-950/40 border-violet-400/35', icon: Layers, accent: 'text-violet-100' },
              { label: 'EXP', value: kpis.exp, tone: 'from-sky-500/20 to-sky-950/40 border-sky-400/35', icon: Shield, accent: 'text-sky-100' },
              { label: 'EQF', value: kpis.eqf, tone: 'from-rose-500/20 to-rose-950/40 border-rose-400/35', icon: Shield, accent: 'text-rose-100' },
              { label: 'TUC', value: kpis.tuc, tone: 'from-teal-500/20 to-teal-950/40 border-teal-400/35', icon: Shield, accent: 'text-teal-100' },
            ].map((k) => {
              const Icon = k.icon;
              return (
                <div
                  key={k.label}
                  className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${k.tone} px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}
                >
                  <div className="absolute -right-2 -top-2 h-10 w-10 rounded-full bg-white/5 blur-xl" />
                  <div className="flex items-center justify-between gap-2">
                    <div className={`text-[9px] font-black uppercase tracking-widest opacity-75 ${k.accent}`}>{k.label}</div>
                    <Icon size={14} className={`opacity-60 ${k.accent}`} />
                  </div>
                  <div className={`mt-2 text-3xl font-black tabular-nums leading-none ${k.accent}`}>{k.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {notice ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{notice}</div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSourceTab('report')}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${sourceTab === 'report' ? 'border-amber-400/50 bg-amber-500/20 text-amber-100' : 'border-white/10 text-white/55'}`}
            >
              <FileText size={14} /> From report
            </button>
            <button
              type="button"
              onClick={() => setSourceTab('cases')}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${sourceTab === 'cases' ? 'border-amber-400/50 bg-amber-500/20 text-amber-100' : 'border-white/10 text-white/55'}`}
            >
              <Gavel size={14} /> Saved cases
            </button>
            <select
              value={bureauFilter}
              onChange={(e) => setBureauFilter(e.target.value as Bureau | 'ALL')}
              className="ml-auto rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80"
            >
              <option value="ALL">All bureaus</option>
              <option value="EXP">Experian</option>
              <option value="EQF">Equifax</option>
              <option value="TUC">TransUnion</option>
            </select>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search account…"
                className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white/85"
              />
            </div>
          </div>

          {sourceTab === 'report' ? (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex-1 min-w-[200px]">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Credit report</span>
                  <select
                    value={activeReportId}
                    onChange={(e) => setActiveReportId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white/85"
                  >
                    {reports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.filename || r.id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setActiveCategory('ALL')}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${activeCategory === 'ALL' ? 'border-amber-400/40 bg-amber-500/15 text-amber-100' : 'border-white/10 text-white/50'}`}
                >
                  All categories
                </button>
                {Array.from(categorySummaries.entries()).map(([label, stats]) => {
                  const st = categoryStyle(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setActiveCategory(label)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                        activeCategory === label ? `bg-gradient-to-r ${st.tone}` : 'border-white/10 text-white/50'
                      }`}
                    >
                      {label} ({stats.selected}/{stats.total})
                    </button>
                  );
                })}
              </div>

              {reports.length === 0 ? (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-8 text-center space-y-2">
                  <div className="text-amber-50 font-semibold">No credit report on this partner yet</div>
                  <p className="text-sm text-white/60 max-w-lg mx-auto">
                    Round 1 / Round 2 selection and dispute checkboxes appear after a report is uploaded and parsed on the Reports tab.
                  </p>
                </div>
              ) : !parsed ? (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-8 text-center space-y-2">
                  <div className="text-amber-50 font-semibold">This report is not parsed yet</div>
                  <p className="text-sm text-white/60 max-w-lg mx-auto">
                    Open Reports, finish parsing, then return here — negatives will show as selectable Round items.
                  </p>
                </div>
              ) : groupedReportCandidates.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-8 text-center space-y-2">
                  <div className="text-white font-semibold">No selectable negatives</div>
                  <p className="text-sm text-white/55 max-w-lg mx-auto">
                    Nothing matches your bureau/category filters, or the report has no dispute candidates. Clear filters or pick another report.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedReportCandidates.map(([label, list]) => {
                    const st = categoryStyle(label);
                    const Icon = st.icon;
                    const selectedInCat = list.filter((c) => isSelected(c.id)).length;
                    return (
                      <section
                        key={label}
                        className={`rounded-3xl border bg-gradient-to-br ${st.tone} p-4 md:p-5 space-y-4`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-black/25">
                              <Icon size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-white">{label}</h3>
                              <p className="text-[10px] uppercase tracking-widest text-white/50">
                                {selectedInCat} selected · {list.length} in category
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedByKey((prev) => {
                                  const next = { ...prev };
                                  for (const c of list) {
                                    next[c.id] = {
                                      key: c.id,
                                      candidate: { ...c, id: c.id },
                                      source: { kind: 'report', reportId: activeReportId },
                                    };
                                  }
                                  return next;
                                });
                              }}
                              className="rounded-xl border border-white/15 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/75"
                            >
                              Select all
                            </button>
                            {selectedInCat > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const keys = new Set(list.map((c) => c.id));
                                  setSelectedByKey((prev) => {
                                    const next = { ...prev };
                                    for (const k of Object.keys(next)) if (keys.has(k)) delete next[k];
                                    return next;
                                  });
                                }}
                                className="rounded-xl border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/45"
                              >
                                Clear
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {list.map((c) => {
                            const checked = isSelected(c.id);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() =>
                                  toggle({
                                    key: c.id,
                                    candidate: { ...c, id: c.id },
                                    source: { kind: 'report', reportId: activeReportId },
                                  })
                                }
                                className={`text-left rounded-2xl border p-3 transition-all ${
                                  checked
                                    ? 'border-emerald-400/40 bg-emerald-500/15 ring-1 ring-emerald-400/25'
                                    : 'border-white/10 bg-black/25 hover:border-white/20'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="font-semibold text-white truncate">{c.account}</div>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/55">
                                        {bureauShortCode(c.bureau)}
                                      </span>
                                      <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/55">
                                        {c.type}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-[10px] text-white/40 truncate">{c.status} · {c.code}</div>
                                  </div>
                                  {checked ? <CheckSquare size={18} className="text-emerald-300 shrink-0" /> : <Square size={18} className="text-white/30 shrink-0" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-black/30 p-5 space-y-4">
              <select
                value={activeCaseId}
                onChange={(e) => setActiveCaseId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white/85"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {bureauShortCode(c.bureau)} · {c.title} · {c.items.length} items
                  </option>
                ))}
              </select>
              <div className="grid gap-2 sm:grid-cols-2">
                {(activeCase?.items ?? []).map((it) => {
                  const key = it.candidateId || it.id;
                  const checked = isSelected(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        toggle({
                          key,
                          candidate: {
                            id: key,
                            bureau: it.bureau,
                            account: it.account,
                            type: it.type,
                            status: it.status,
                            code: it.code,
                            reportId: it.reportId,
                          },
                          source: { kind: 'case', caseId: activeCaseId, caseItemId: it.id },
                          prefillEvidenceId: it.evidenceId,
                          prefillReasons: it.reasons ?? [],
                        })
                      }
                      className={`text-left rounded-2xl border p-3 ${checked ? 'border-emerald-400/40 bg-emerald-500/15' : 'border-white/10 bg-black/25'}`}
                    >
                      <div className="font-semibold text-white truncate">{it.account}</div>
                      <div className="text-[10px] text-white/40 mt-1">{bureauFullName(it.bureau)} · evidence {it.evidenceId ? '✓' : '—'}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 p-4 md:p-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40">
          <div className="text-xs text-white/45">
            <span className="text-white/80 font-semibold">{Object.keys(selectedByKey).length}</span> disputes ready for letter split
          </div>
          <button
            type="button"
            onClick={() => {
              onApply(Object.values(selectedByKey));
              onClose();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:brightness-110"
          >
            Apply selection <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
