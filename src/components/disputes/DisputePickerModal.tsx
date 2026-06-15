import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, FileText, Gavel, CheckSquare, Square, ChevronRight } from 'lucide-react';
import type { Bureau, DisputeCandidate, ParsedCreditReport } from '../../domain/creditReports';
import type { DisputeCase } from '../../domain/cases';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import { bureauFullName, bureauShortCode } from '../../utils/bureaus';
import { letterCategoryForCandidate } from '../../creditReports/letterCategory';

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

function tabBtn(active: boolean) {
  return `px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/[0.08] hover:bg-white/10 hover:text-white'
  }`;
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
  // Default to the report's candidates (the primary "build disputes from my report"
  // flow). Only fall back to saved cases when there are no reports to pick from.
  const [sourceTab, setSourceTab] = useState<'report' | 'cases'>(() =>
    reports.length > 0 ? 'report' : cases.length > 0 ? 'cases' : 'report',
  );
  const [query, setQuery] = useState('');
  const [bureauFilter, setBureauFilter] = useState<'ALL' | Bureau>('ALL');
  const [hideSelected, setHideSelected] = useState(true);
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
    setHideSelected(true);
    setNotice(null);
    setSourceTab(reports.length > 0 ? 'report' : cases.length > 0 ? 'cases' : 'report');
    if (!activeReportId && reports[0]?.id) setActiveReportId(reports[0].id);
    if (!activeCaseId && cases[0]?.id) setActiveCaseId(cases[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parsed = useMemo(() => reports.find((r) => r.id === activeReportId)?.parsed ?? null, [reports, activeReportId]);
  const reportCandidates = useMemo(() => {
    if (!parsed) return [];
    const all = deriveDisputeCandidates(parsed, activeReportId);
    const q = query.trim().toLowerCase();
    return all.filter((c) => {
      if (bureauFilter !== 'ALL' && c.bureau !== bureauFilter) return false;
      if (hideSelected && selectedByKey[c.id]) return false;
      if (!q) return true;
      return `${c.account} ${c.type} ${c.status} ${c.code}`.toLowerCase().includes(q);
    });
  }, [parsed, activeReportId, query, bureauFilter, hideSelected, selectedByKey]);

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

  const activeCase = useMemo(() => cases.find((c) => c.id === activeCaseId) ?? null, [cases, activeCaseId]);
  const caseItems = useMemo(() => {
    const c = activeCase;
    if (!c) return [];
    const q = query.trim().toLowerCase();
    return (c.items || [])
      .map((it) => ({
        key: it.candidateId || it.id,
        bureau: it.bureau,
        account: it.account,
        type: it.type,
        status: it.status,
        code: it.code,
        reportId: it.reportId,
        evidenceId: it.evidenceId,
        reasons: it.reasons,
        caseItemId: it.id,
      }))
      .filter((it) => {
        if (bureauFilter !== 'ALL' && it.bureau !== bureauFilter) return false;
        if (hideSelected && selectedByKey[it.key]) return false;
        if (!q) return true;
        return `${it.account} ${it.type} ${it.status} ${it.code}`.toLowerCase().includes(q);
      });
  }, [activeCase, query, bureauFilter, hideSelected, selectedByKey]);

  const isSelected = (key: string) => Boolean(selectedByKey[key]);
  const toggle = (s: SelectedDispute) => {
    setSelectedByKey((prev) => {
      if (prev[s.key]) {
        const next = { ...prev };
        delete next[s.key];
        setNotice(null);
        return next;
      }

      // Enforce: one negative category per bureau letter. (Collections + charge-offs are one category.)
      const bureau = s.candidate.bureau;
      const existing = Object.values(prev).filter((x) => x.candidate.bureau === bureau);
      if (existing.length) {
        const haveCat = letterCategoryForCandidate(existing[0]!.candidate).key;
        const nextCat = letterCategoryForCandidate(s.candidate).key;
        if (haveCat !== nextCat) {
          const haveLabel = letterCategoryForCandidate(existing[0]!.candidate).label;
          const nextLabel = letterCategoryForCandidate(s.candidate).label;
          setNotice(`This ${bureauShortCode(bureau)} letter is locked to “${haveLabel}”. Clear those selections before adding “${nextLabel}”.`);
          return prev;
        }
      }

      setNotice(null);
      return { ...prev, [s.key]: s };
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl border border-white/[0.08] bg-fc-shell shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Choose disputes</div>
            <div className="mt-2 text-2xl font-light text-white truncate">Select disputes to include in your letters</div>
            <div className="mt-1 text-white/60 text-sm">Pick from a report’s candidates or from saved dispute cases.</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
          >
            <X size={14} /> Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {notice ? (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-white/75 text-sm">
              {notice}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" className={tabBtn(sourceTab === 'report')} onClick={() => setSourceTab('report')}>
                <FileText size={14} className="inline-block mr-2" />
                From report
              </button>
              <button type="button" className={tabBtn(sourceTab === 'cases')} onClick={() => setSourceTab('cases')}>
                <Gavel size={14} className="inline-block mr-2" />
                From saved cases
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={bureauFilter}
                onChange={(e) => setBureauFilter(e.target.value as any)}
                className="bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm"
              >
                <option value="ALL">All bureaus</option>
                <option value="EXP">Experian (EXP)</option>
                <option value="EQF">Equifax (EQF)</option>
                <option value="TUC">TransUnion (Trans)</option>
              </select>
              <label className="inline-flex items-center gap-2 px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-white/70 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={hideSelected} onChange={(e) => setHideSelected(e.target.checked)} />
                Hide already selected
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search account/type/code…"
                  className="pl-9 pr-3 py-2 bg-fc-input border border-white/[0.08] rounded-xl text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors text-sm w-[260px]"
                />
              </div>
            </div>
          </div>

          {sourceTab === 'report' ? (
            <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4 items-end">
                <div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Report</div>
                  <select
                    value={activeReportId}
                    onChange={(e) => setActiveReportId(e.target.value)}
                    className="mt-2 w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    {reports.length === 0 ? <option value="">No reports uploaded</option> : null}
                    {reports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.filename || r.id}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-[11px] text-white/40">
                    Candidates are derived from parsed report tradelines/sections.
                  </div>
                </div>
                <div className="text-right text-[10px] uppercase tracking-widest text-white/40">
                  Selected: <span className="text-white/70">{Object.keys(selectedByKey).length}</span>
                </div>
              </div>

              <div className="space-y-3">
                {!parsed ? (
                  <div className="text-white/50 text-sm">This report has no parsed data available.</div>
                ) : reportCandidates.length === 0 ? (
                  <div className="text-white/50 text-sm">No candidates match your filters.</div>
                ) : (
                  groupedReportCandidates.map(([type, list]) => {
                    const selectedCount = list.filter((c) => isSelected(c.id)).length;
                    const openByDefault = ['Collections & charge-offs', 'Late payments', 'Inquiries', 'Public records'].includes(type);
                    return (
                      <details key={type} className="group fc-light-glass-panel fc-light-chrome-panel p-4" open={openByDefault}>
                        <summary className="cursor-pointer select-none list-none flex items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">
                              {type} <span className="text-white/40 font-normal">({list.length})</span>
                            </div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                              Selected: <span className="text-white/70">{selectedCount}</span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedByKey((prev) => {
                                  const next = { ...prev };
                                  // Enforce category lock per bureau even for bulk select.
                                  for (const c of list) {
                                    const key = c.id;
                                    if (next[key]) continue;
                                    const bureau = c.bureau;
                                    const existing = Object.values(next).filter((x) => x.candidate.bureau === bureau);
                                    if (existing.length) {
                                      const haveCat = letterCategoryForCandidate(existing[0]!.candidate).key;
                                      const nextCat = letterCategoryForCandidate(c).key;
                                      if (haveCat !== nextCat) continue;
                                    }
                                    next[key] = {
                                      key,
                                      candidate: { ...c, id: key },
                                      source: { kind: 'report', reportId: activeReportId },
                                    };
                                  }
                                  return next;
                                });
                              }}
                              className="px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.04] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                              title={`Select all ${type} items`}
                            >
                              Select all
                            </button>
                            {selectedCount ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const keys = new Set(list.map((c) => c.id));
                                  setSelectedByKey((prev) => {
                                    const next = { ...prev };
                                    for (const k of Object.keys(next)) if (keys.has(k)) delete next[k];
                                    return next;
                                  });
                                }}
                                className="px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.04] text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                                title={`Clear selected ${type} items`}
                              >
                                Clear
                              </button>
                            ) : null}
                            <ChevronRight size={16} className="text-white/40 transition-transform group-open:rotate-90" />
                          </div>
                        </summary>

                        <div className="mt-3 space-y-2">
                          {list.map((c) => {
                            const key = c.id;
                            const checked = isSelected(key);
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() =>
                                  toggle({
                                    key,
                                    candidate: { ...c, id: key },
                                    source: { kind: 'report', reportId: activeReportId },
                                  })
                                }
                                className="w-full text-left fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.03] transition-all p-4 flex items-start justify-between gap-4"
                              >
                                <div className="min-w-0">
                                  <div className="text-white font-semibold truncate">
                                    {c.account}
                                    {c.subtype ? (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 text-[9px] font-black uppercase tracking-widest">
                                        {c.subtype}
                                      </span>
                                    ) : null}
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full fc-light-glass-panel fc-light-chrome-panel border text-white/70 text-[9px] font-black uppercase tracking-widest">
                                      {c.type}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                                    {bureauFullName(c.bureau)} ({bureauShortCode(c.bureau)}) • {c.status} • {c.code}
                                  </div>
                                </div>
                                <div className="shrink-0 text-white/70">
                                  {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4 items-end">
                <div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Saved case</div>
                  <select
                    value={activeCaseId}
                    onChange={(e) => setActiveCaseId(e.target.value)}
                    className="mt-2 w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    {cases.length === 0 ? <option value="">No cases yet</option> : null}
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {bureauShortCode(c.bureau)} • {c.status} • {c.title} • {c.items.length} items
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-[11px] text-white/40">Selecting case items will prefill saved evidence + reasons.</div>
                </div>
                <div className="text-right text-[10px] uppercase tracking-widest text-white/40">
                  Selected: <span className="text-white/70">{Object.keys(selectedByKey).length}</span>
                </div>
              </div>

              <div className="max-h-[52vh] overflow-y-auto pr-2 fc-scroll-area space-y-2">
                {!activeCase ? (
                  <div className="text-white/50 text-sm">No case selected.</div>
                ) : caseItems.length === 0 ? (
                  <div className="text-white/50 text-sm">No case items match your filters.</div>
                ) : (
                  caseItems.map((it) => {
                    const checked = isSelected(it.key);
                    return (
                      <button
                        key={it.key}
                        type="button"
                        onClick={() =>
                          toggle({
                            key: it.key,
                            candidate: {
                              id: it.key,
                              bureau: it.bureau,
                              account: it.account,
                              type: it.type,
                              status: it.status,
                              code: it.code,
                              reportId: it.reportId,
                            },
                            source: { kind: 'case', caseId: activeCaseId, caseItemId: it.caseItemId },
                            prefillEvidenceId: it.evidenceId,
                            prefillReasons: it.reasons ?? [],
                          })
                        }
                        className="w-full text-left fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.04] transition-all p-4 flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">
                            {it.account} — {it.type}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                            {bureauFullName(it.bureau)} ({bureauShortCode(it.bureau)}) • {it.status} • {it.code} • evidence {it.evidenceId ? 'linked' : '—'}
                          </div>
                        </div>
                        <div className="shrink-0 text-white/70">
                          {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-white/40">
            Selected disputes will be grouped into bureau letters automatically.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onApply(Object.values(selectedByKey));
                onClose();
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Apply selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

