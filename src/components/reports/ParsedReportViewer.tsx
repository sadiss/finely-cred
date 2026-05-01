import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ChevronDown, Database, ShieldAlert } from 'lucide-react';
import type { Bureau, ParsedCreditReport, ParsedTradeline, TradelineRow } from '../../domain/creditReports';
import type { EvidenceItem } from '../../domain/evidence';
import { upsertEvidence } from '../../data/evidenceRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { newId } from '../../utils/ids';
import { TradelineEvidenceSheet } from '../evidence/EvidenceSheet';
import { captureReactElementPng } from '../../utils/captureReactPng';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { bureauShortCode } from '../../utils/bureaus';

function safe(v?: string) {
  return (v || '').trim() || '-';
}

function toUsdShort(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return null;
  try {
    return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  } catch {
    return `$${Math.round(n)}`;
  }
}

function codeKind(codeRaw: string): 'ok' | 'derog' | 'unknown' {
  const c = (codeRaw || '').trim().toUpperCase();
  if (!c || c === '·') return 'ok';
  if (['OK', 'CUR', 'CURRENT', 'PAID', '0', '00', '1'].includes(c)) return 'ok';
  if (['CO', 'COL', 'CL', 'CHARGE', 'CHARGE-OFF', 'CHARGE OFF'].includes(c)) return 'derog';
  const n = Number(c);
  if (Number.isFinite(n) && n >= 30) return 'derog';
  if (c.includes('LATE') || c.includes('DELINQ') || c.includes('CHARGE') || c.includes('COLLECT')) return 'derog';
  return 'unknown';
}

function pickHistoryRow(args: { t: ParsedTradeline; preferredBureau?: Bureau | '' }) {
  const by = args.t.paymentHistory2y?.byBureau ?? {};
  const pick = (b: Bureau) => by[b] ?? [];
  const preferred = args.preferredBureau ? pick(args.preferredBureau as Bureau) : [];
  const row =
    preferred.length
      ? preferred
      : pick('TUC').length
        ? pick('TUC')
        : pick('EXP').length
          ? pick('EXP')
          : pick('EQF');
  const bureauUsed: Bureau | null =
    preferred.length
      ? (args.preferredBureau as Bureau)
      : pick('TUC').length
        ? 'TUC'
        : pick('EXP').length
          ? 'EXP'
          : pick('EQF').length
            ? 'EQF'
            : null;
  return { bureauUsed, codes: row.map((x) => x.code || '').filter((x) => x != null) };
}

function hasBureauData(t: ParsedTradeline, bureau: Bureau): boolean {
  return (t.fields ?? []).some((row: TradelineRow) => ((row?.byBureau ?? {})[bureau] ?? '').trim().length > 0);
}

function responsibilityBadge(responsibility?: string | null) {
  const raw = String(responsibility || '').trim();
  const r = raw.toLowerCase();
  if (!raw) return null;
  if (r.includes('authorized') || r === 'au' || r.includes('auth user') || r.includes('authorized user')) {
    return { label: 'Authorized User', hint: raw, cls: 'bg-violet-500/15 border-violet-500/30 text-violet-200' };
  }
  if (r.includes('joint')) return { label: 'Joint', hint: raw, cls: 'bg-sky-500/15 border-sky-500/30 text-sky-200' };
  if (r.includes('individual') || r.includes('primary') || r.includes('single')) {
    return { label: 'Primary', hint: raw, cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' };
  }
  return { label: raw, hint: raw, cls: 'bg-white/[0.06] border-white/10 text-white/75' };
}

function responsibilityKind(responsibility?: string | null): 'AU' | 'Joint' | 'Primary' | 'Other' {
  const raw = String(responsibility || '').trim();
  const r = raw.toLowerCase();
  if (!raw) return 'Other';
  if (r.includes('authorized') || r === 'au' || r.includes('auth user') || r.includes('authorized user')) return 'AU';
  if (r.includes('joint')) return 'Joint';
  if (r.includes('individual') || r.includes('primary') || r.includes('single')) return 'Primary';
  return 'Other';
}

export function ParsedReportViewer({
  parsed,
  partnerId,
  reportId,
  scrollToCreditorName,
}: {
  parsed: ParsedCreditReport;
  partnerId?: string;
  reportId?: string;
  scrollToCreditorName?: string | null;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filterBureau, setFilterBureau] = useState<Bureau | ''>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterResp, setFilterResp] = useState<'' | 'AU' | 'Primary' | 'Joint'>('');
  const [query, setQuery] = useState<string>('');
  const [showAllFields, setShowAllFields] = useState(false);
  const [showAllTradelines, setShowAllTradelines] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const distinctTypes = useMemo(() => {
    const set = new Set<string>();
    parsed.tradelines.forEach((t) => {
      if (t.accountType) set.add(t.accountType);
    });
    return Array.from(set).sort();
  }, [parsed.tradelines]);
  const distinctStatuses = useMemo(() => {
    const set = new Set<string>();
    parsed.tradelines.forEach((t) => {
      if (t.accountStatus) set.add(t.accountStatus);
    });
    return Array.from(set).sort();
  }, [parsed.tradelines]);

  const filteredNoResp = useMemo(() => {
    return parsed.tradelines.filter((t) => {
      const q = query.trim().toLowerCase();
      if (q) {
        const hay = [t.creditorName, t.accountType, t.accountStatus, t.accountNumberMasked].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterBureau && !hasBureauData(t, filterBureau)) return false;
      if (filterType && (t.accountType ?? '') !== filterType) return false;
      if (filterStatus && (t.accountStatus ?? '') !== filterStatus) return false;
      return true;
    });
  }, [parsed.tradelines, filterBureau, filterType, filterStatus, query]);

  const respCounts = useMemo(() => {
    const c = { AU: 0, Primary: 0, Joint: 0, Other: 0 };
    for (const t of filteredNoResp) c[responsibilityKind(t.responsibility)] += 1;
    return c;
  }, [filteredNoResp]);

  const filteredTradelines = useMemo(() => {
    if (!filterResp) return filteredNoResp;
    return filteredNoResp.filter((t) => responsibilityKind(t.responsibility) === filterResp);
  }, [filteredNoResp, filterResp]);

  useEffect(() => {
    if (!scrollToCreditorName || !filteredTradelines.length) return;
    const want = scrollToCreditorName.trim().toLowerCase();
    if (!want) return;
    let idx = filteredTradelines.findIndex((t) => t.creditorName.trim().toLowerCase() === want);
    if (idx < 0) {
      idx = filteredTradelines.findIndex(
        (t) =>
          t.creditorName.trim().toLowerCase().includes(want) || want.includes(t.creditorName.trim().toLowerCase())
      );
    }
    if (idx >= 0) setOpenIndex(idx);
  }, [scrollToCreditorName, filteredTradelines]);

  const stats = useMemo(() => {
    const tradelines = filteredTradelines.length;
    const withHistory = filteredTradelines.filter((t) => t.paymentHistory2y?.months?.length).length;
    return { tradelines, withHistory };
  }, [filteredTradelines]);

  async function captureTradelineScreenshot(args: { tradeline: ParsedTradeline; idx: number }) {
    if (!partnerId) return;

    const key = `${args.idx}_${args.tradeline.creditorName}`;
    setSavingKey(key);
    setNotice(null);
    try {
      // Capture a dedicated print-styled EvidenceSheet (white background, no UI chrome, no scrollbars).
      const dataUrl = await captureReactElementPng(<TradelineEvidenceSheet tradeline={args.tradeline} showHeader={false} />, {
        pixelRatio: 2,
        widthPx: 1100,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const store = getBlobStore();
      const put = await store.put(blob, {
        kind: 'evidence_screenshot',
        partnerId,
        reportId,
        creditorName: args.tradeline.creditorName,
      });

      const safeName = args.tradeline.creditorName.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
      const filename = `Screenshot_${safeName || 'Tradeline'}_${new Date().toISOString().slice(0, 10)}.png`;
      const item: EvidenceItem = {
        id: newId('evidence'),
        partnerId,
        reportId,
        type: 'screenshot',
        source: 'tradeline_screenshot',
        creditorName: args.tradeline.creditorName,
        caption: `Tradeline screenshot: ${args.tradeline.creditorName}`,
        filename,
        mimeType: 'image/png',
        sizeBytes: blob.size,
        blobRef: put.ref,
        createdAt: new Date().toISOString(),
      };
      upsertEvidence(item);
      setNotice(`Saved evidence screenshot: ${filename}`);
    } catch (e: any) {
      setNotice(`Screenshot failed: ${e?.message || 'unknown error'}`);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 text-white/70 text-sm">
          {notice}
        </div>
      )}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 flex items-start justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <Database size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Parsed report</span>
          </div>
          <p className="text-white/60 text-sm">
            Provider: <span className="text-white/80 font-mono">{parsed.provider}</span>
          </p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-white/40">tradelines</p>
          <p className="text-2xl font-light text-white">{stats.tradelines}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/30">
            with payment history: <span className="text-white/60">{stats.withHistory}</span>
          </p>
        </div>
      </div>

      {/* Phase 1: filters */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 flex flex-wrap items-center gap-3">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Filters</span>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-black/40">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creditor / acct / type…"
            className="bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30 w-56 max-w-full"
          />
        </div>
        <select
          value={openIndex == null ? '' : String(openIndex)}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            const idx = parseInt(v, 10);
            if (!Number.isFinite(idx)) return;
            setOpenIndex(idx);
            // Scroll the card into view when jumping
            window.setTimeout(() => {
              cardRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          }}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-amber-500"
          title="Jump to a tradeline without scrolling"
        >
          <option value="">Jump to…</option>
          {filteredTradelines.slice(0, 200).map((t, idx) => (
            <option key={`${t.creditorName}_${idx}`} value={String(idx)}>
              {t.creditorName}
            </option>
          ))}
        </select>
        <select
          value={filterBureau}
          onChange={(e) => setFilterBureau((e.target.value || '') as Bureau | '')}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="">All bureaus</option>
          <option value="EXP">Experian</option>
          <option value="EQF">Equifax</option>
          <option value="TUC">TransUnion (Trans)</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="">All types</option>
          {distinctTypes.map((x) => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="">All statuses</option>
          {distinctStatuses.map((x) => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>

        <div className="flex flex-wrap items-center gap-2 pl-1">
          <span className="text-[10px] uppercase tracking-widest text-white/40">Responsibility</span>
          {([
            { k: '', label: `All (${filteredNoResp.length})` },
            { k: 'Primary', label: `Primary (${respCounts.Primary})` },
            { k: 'AU', label: `AU (${respCounts.AU})` },
            { k: 'Joint', label: `Joint (${respCounts.Joint})` },
          ] as const).map((x) => (
            <button
              key={x.k || 'all'}
              type="button"
              onClick={() => setFilterResp(x.k)}
              className={
                'px-3 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-colors ' +
                (filterResp === x.k ? 'border-amber-500/40 bg-amber-500/15 text-amber-100' : 'border-white/10 bg-black/40 text-white/70 hover:bg-white/[0.03]')
              }
              title="Filter by responsibility (AU vs Primary vs Joint)"
            >
              {x.label}
            </button>
          ))}
        </div>
        {(filterBureau || filterType || filterStatus || filterResp) && (
          <button
            type="button"
            onClick={() => { setFilterBureau(''); setFilterType(''); setFilterStatus(''); setFilterResp(''); setQuery(''); }}
            className="text-[10px] uppercase tracking-widest text-amber-400 hover:text-amber-300"
          >
            Clear
          </button>
        )}
      </div>

      <CollapsibleSection
        title="Tradelines"
        subtitle="Accounts detected from your parsed report. Expand a tradeline to view bureau fields + evidence."
        count={`${filteredTradelines.length}`}
        defaultOpen
        storageKey={`reports.viewer.tradelines.${parsed.provider || 'unknown'}`}
        bodyClassName="!p-0"
        className="border-white/10 bg-white/[0.03]"
      >
        <div className="p-5 md:p-6 space-y-4">
          {(showAllTradelines ? filteredTradelines : filteredTradelines.slice(0, 12)).map((t, idx) => {
          const isOpen = openIndex === idx;
          const rk = responsibilityKind(t.responsibility);
          const fields = t.fields ?? [];
          const accountNoRow = fields.find((f) => f?.label?.toLowerCase?.()?.includes('account #'));
          const by = accountNoRow?.byBureau ?? {};
          const acct = by.EXP || by.TUC || by.EQF;
          const screenshotKey = `${idx}_${t.creditorName}`;

          return (
            <div
              key={`${t.creditorName}_${idx}`}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={
                'rounded-2xl border bg-black/30 backdrop-blur-xl overflow-hidden ' +
                (rk === 'AU'
                  ? 'border-violet-500/25'
                  : rk === 'Primary'
                    ? 'border-emerald-500/20'
                    : rk === 'Joint'
                      ? 'border-sky-500/20'
                      : 'border-white/10')
              }
            >
              <button
                className="w-full flex items-center justify-between gap-6 px-6 py-5 hover:bg-white/[0.03] transition-colors"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
              >
                <div className="text-left min-w-0">
                  <p className="text-white text-xl font-semibold leading-tight truncate">{t.creditorName}</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                    acct: {safe(t.accountNumberMasked ?? acct)}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(() => {
                      const rb = responsibilityBadge(t.responsibility);
                      if (!rb) return null;
                      return (
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${rb.cls}`}
                          title={rb.hint}
                        >
                          {rb.label}
                        </span>
                      );
                    })()}
                    {t.accountType ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-black uppercase tracking-widest text-white/75">
                        {t.accountType}
                      </span>
                    ) : null}
                    {t.accountStatus ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[10px] font-black uppercase tracking-widest">
                        {t.accountStatus}
                      </span>
                    ) : null}
                    {t.utilizationPct && Object.keys(t.utilizationPct).length > 0 ? (
                      <span className="text-[10px] text-white/50 font-mono">
                        Util:{' '}
                        {(['EXP', 'EQF', 'TUC'] as const)
                          .filter((b) => t.utilizationPct![b] != null)
                          .map((b) => `${bureauShortCode(b)} ${t.utilizationPct![b]}%`)
                          .join(' · ')}
                      </span>
                    ) : null}
                    {toUsdShort(t.balance) ? (
                      <span className="text-[10px] text-white/50 font-mono">Bal: {toUsdShort(t.balance)}</span>
                    ) : null}
                    {toUsdShort(t.pastDue) ? (
                      <span className="text-[10px] text-white/50 font-mono">Past-due: {toUsdShort(t.pastDue)}</span>
                    ) : null}
                    {toUsdShort(t.creditLimit) ? (
                      <span className="text-[10px] text-white/50 font-mono">Limit: {toUsdShort(t.creditLimit)}</span>
                    ) : null}
                    {t.dofd ? <span className="text-[10px] text-white/50 font-mono">DOFD: {t.dofd}</span> : null}
                  </div>
                  {t.paymentHistory2y?.byBureau && (
                    <div className="mt-3 flex items-center gap-2">
                      {(() => {
                        const { bureauUsed, codes } = pickHistoryRow({ t, preferredBureau: filterBureau });
                        const last = codes.slice(-24);
                        if (!last.length) return null;
                        const derog = last.filter((c) => codeKind(c) === 'derog').length;
                        return (
                          <>
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono shrink-0">
                              24mo {bureauUsed ? bureauShortCode(bureauUsed) : ''}
                              {derog ? ` • ${derog} derog` : ''}
                            </span>
                            <div className="flex gap-1 overflow-x-auto overflow-y-hidden pr-1">
                              {last.map((c, i) => {
                                const kind = codeKind(c);
                                const cls =
                                  kind === 'derog'
                                    ? 'bg-red-500/20 border-red-500/30'
                                    : kind === 'ok'
                                      ? 'bg-emerald-500/10 border-emerald-500/20'
                                      : 'bg-amber-500/10 border-amber-500/20';
                                const label = (c || '·').toUpperCase();
                                return (
                                  <span
                                    key={i}
                                    className={`w-3.5 h-3.5 rounded-sm border ${cls} shrink-0`}
                                    title={`${bureauUsed ?? ''} ${label}`.trim()}
                                  />
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {partnerId && isOpen && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        captureTradelineScreenshot({ idx, tradeline: t });
                      }}
                      data-no-capture="true"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70"
                      disabled={Boolean(savingKey)}
                      title="Save screenshot to Evidence Vault — included when you download the dispute letter PDF (print-ready)"
                    >
                      <Camera size={14} className="text-amber-400" />
                      {savingKey === screenshotKey ? 'Saving…' : 'Screenshot'}
                    </button>
                  )}
                  <ChevronDown size={18} className={`text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 space-y-6">
                  {(() => {
                    const fields = t.fields ?? [];
                    const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
                    const want = (label: string) => {
                      const l = norm(label);
                      return (
                        l.includes('account status') ||
                        l.includes('payment status') ||
                        l.includes('account type') ||
                        l.includes('responsibility') ||
                        l.includes('date opened') ||
                        l.includes('date closed') ||
                        l.includes('date of first delinquency') ||
                        l.includes('dofd') ||
                        l.includes('last reported') ||
                        l.includes('balance') ||
                        l.includes('amount owed') ||
                        l.includes('credit limit') ||
                        l.includes('credit line') ||
                        l.includes('high balance') ||
                        l.includes('high credit') ||
                        l.includes('past due') ||
                        l.includes('monthly payment') ||
                        l.includes('scheduled payment') ||
                        l.includes('remarks')
                      );
                    };
                    const keyRows = fields.filter((r) => want(r.label || '')).slice(0, 18);
                    const rowsToShow = showAllFields ? fields : keyRows;

                    return (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-white/40">Account details</div>
                            <div className="mt-1 text-white/60 text-sm">
                              Showing <span className="text-white/80 font-mono">{rowsToShow.length}</span> of{' '}
                              <span className="text-white/80 font-mono">{fields.length}</span> fields
                              {!showAllFields ? ' (key fields)' : ''}.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAllFields((v) => !v)}
                            className="px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                          >
                            {showAllFields ? 'Show key fields' : 'Show all fields'}
                          </button>
                        </div>

                        <div className="overflow-x-auto overflow-y-hidden pr-1">
                          <table className="w-full text-left text-sm border-separate border-spacing-0">
                            <thead className="sticky top-0 bg-[#0b1110]">
                              <tr className="text-[10px] uppercase tracking-widest text-white/40">
                                <th className="py-3 pr-4">Field</th>
                                <th className="py-3 pr-4">TransUnion</th>
                                <th className="py-3 pr-4">Experian</th>
                                <th className="py-3">Equifax</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rowsToShow.map((row, ri) => {
                                const byBureau = row?.byBureau ?? {};
                                return (
                                  <tr key={ri} className="border-t border-white/5">
                                    <td className="py-3 pr-4 text-white/70">{row?.label ?? ''}</td>
                                    <td className="py-3 pr-4 text-white/80 font-mono">{safe(byBureau.TUC)}</td>
                                    <td className="py-3 pr-4 text-white/80 font-mono">{safe(byBureau.EXP)}</td>
                                    <td className="py-3 text-white/80 font-mono">{safe(byBureau.EQF)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {t.paymentHistory2y ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 overflow-x-auto overflow-y-hidden">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-4">2-year payment history</p>
                      <table className="text-[11px] border-separate border-spacing-0">
                        <tbody>
                          {(() => {
                            const by = t.paymentHistory2y?.byBureau ?? {};
                            const anyRow = by.TUC || by.EXP || by.EQF || [];
                            const cols =
                              anyRow.length || t.paymentHistory2y.months.length || t.paymentHistory2y.years.length || 0;
                            const months = t.paymentHistory2y.months.length
                              ? t.paymentHistory2y.months
                              : Array.from({ length: cols }).map((_, i) => String(i + 1));
                            const years = t.paymentHistory2y.years.length
                              ? t.paymentHistory2y.years
                              : Array.from({ length: cols }).map(() => '');

                            return (
                              <>
                                <tr>
                                  <td className="pr-4 py-2 text-white/50 font-semibold">Month</td>
                                  {months.map((m, i) => (
                                    <td key={i} className="px-2 py-2 text-white/60">
                                      {m}
                                    </td>
                                  ))}
                                </tr>
                                <tr>
                                  <td className="pr-4 py-2 text-white/50 font-semibold">Year</td>
                                  {years.map((y, i) => (
                                    <td key={i} className="px-2 py-2 text-white/40">
                                      {y}
                                    </td>
                                  ))}
                                </tr>
                                {(['TUC', 'EXP', 'EQF'] as const).map((b) => (
                                  <tr key={b}>
                                    <td className="pr-4 py-2 text-white/70 font-semibold">{bureauShortCode(b)}</td>
                                    {((t.paymentHistory2y?.byBureau ?? {})[b] ?? []).map((c, i) => {
                                      const code = c.code || '';
                                      const isDerog = ['30', '60', '90', '120', 'CO'].includes(code.toUpperCase());
                                      return (
                                        <td
                                          key={i}
                                          className={`px-2 py-2 font-mono ${isDerog ? 'text-red-300' : 'text-white/60'}`}
                                        >
                                          {code || '·'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-3 text-white/50">
                      <ShieldAlert size={16} className="text-amber-400" />
                      <p className="text-sm">Payment history was not detected for this tradeline in the uploaded file.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
          })}

          {filteredTradelines.length > 12 ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAllTradelines((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                title={showAllTradelines ? 'Show fewer tradelines' : 'Show all tradelines'}
              >
                {showAllTradelines ? 'Show less' : `Show all (${filteredTradelines.length})`}
              </button>
            </div>
          ) : null}
        </div>
      </CollapsibleSection>
    </div>
  );
}

