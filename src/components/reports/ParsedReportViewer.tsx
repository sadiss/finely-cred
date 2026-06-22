import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ChevronDown, Database, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Bureau, ParsedCreditReport, ParsedTradeline, TradelineRow } from '../../domain/creditReports';
import type { EvidenceItem } from '../../domain/evidence';
import { upsertEvidence } from '../../data/evidenceRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { newId } from '../../utils/ids';
import { TradelineEvidenceSheet } from '../evidence/EvidenceSheet';
import { captureReactElementPng } from '../../utils/captureReactPng';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { bureauShortCode } from '../../utils/bureaus';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_LUXURY_PAGINATION,
  FINELY_OS_LUXURY_PAGINATION_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsGlassShell,
  finelyOsInlineListItem,
  finelyOsStatusChip,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

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

function hasBureauData(t: ParsedTradeline, bureau: Bureau): boolean {
  return (t.fields ?? []).some((row: TradelineRow) => ((row?.byBureau ?? {})[bureau] ?? '').trim().length > 0);
}

function responsibilityBadge(responsibility?: string | null) {
  const raw = String(responsibility || '').trim();
  const r = raw.toLowerCase();
  if (!raw) return null;
  if (r.includes('authorized') || r === 'au' || r.includes('auth user') || r.includes('authorized user')) {
    return { label: 'Authorized User', hint: raw, cls: 'border-violet-500/30 bg-violet-500/10 text-violet-200' };
  }
  if (r.includes('joint')) return { label: 'Joint', hint: raw, cls: 'border-sky-500/30 bg-sky-500/10 text-sky-200' };
  if (r.includes('individual') || r.includes('primary') || r.includes('single')) {
    return { label: 'Primary', hint: raw, cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' };
  }
  return { label: raw, hint: raw, cls: 'border-white/[0.08] bg-white/[0.06] text-white/70' };
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
  layout = 'list',
  showSequence = false,
}: {
  parsed: ParsedCreditReport;
  partnerId?: string;
  reportId?: string;
  scrollToCreditorName?: string | null;
  layout?: 'list' | 'grid';
  showSequence?: boolean;
}) {
  const isGrid = false;
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filterBureau, setFilterBureau] = useState<Bureau | ''>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterResp, setFilterResp] = useState<'' | 'AU' | 'Primary' | 'Joint'>('');
  const [query, setQuery] = useState<string>('');
  const [showAllFieldsByIdx, setShowAllFieldsByIdx] = useState<Record<number, boolean>>({});
  const [tradelinePage, setTradelinePage] = useState(0);
  const TRADELINE_PAGE_SIZE = 6;
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
    const scoreCount = parsed.scores?.length ?? 0;
    return { tradelines, withHistory, scoreCount, rawTradelines: parsed.tradelines.length };
  }, [filteredTradelines, parsed.scores, parsed.tradelines.length]);

  const parseQualityNote = useMemo(() => {
    if (stats.rawTradelines === 0) {
      return 'Partial parse — no tradelines extracted. Re-upload an HTML export or use Re-parse from the report menu.';
    }
    if (stats.scoreCount === 0) {
      return 'Partial parse — tradelines found but bureau scores were not detected. Review before disputing.';
    }
    return null;
  }, [stats.rawTradelines, stats.scoreCount]);

  useEffect(() => {
    setTradelinePage(0);
  }, [filterBureau, filterType, filterStatus, filterResp, query]);

  const tradelineTotalPages = Math.max(1, Math.ceil(filteredTradelines.length / TRADELINE_PAGE_SIZE));
  const safeTradelinePage = Math.min(tradelinePage, tradelineTotalPages - 1);
  const visibleTradelines = filteredTradelines.slice(
    safeTradelinePage * TRADELINE_PAGE_SIZE,
    safeTradelinePage * TRADELINE_PAGE_SIZE + TRADELINE_PAGE_SIZE,
  );

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
    <div className="space-y-6 w-full max-w-full overflow-visible" data-fc-parsed-report-viewer>
      {notice && <div className={FINELY_OS_NOTICE}>{notice}</div>}
      {parseQualityNote ? <div className={FINELY_OS_NOTICE_WARN}>{parseQualityNote}</div> : null}
      <div className={`${finelyOsGlassShell('catalog', 'sky')} flex items-start justify-between gap-6`}>
        <div className="space-y-1 min-w-0">
          <div className="inline-flex items-center gap-2 text-sky-800">
            <Database size={16} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Parsed report</span>
          </div>
          <p className={FINELY_OS_ENTITY_BODY}>
            Provider: <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>{parsed.provider}</span>
          </p>
        </div>
        <div className="text-right space-y-1 shrink-0">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>tradelines</p>
          <p className={`text-2xl font-light ${FINELY_OS_ENTITY_VALUE}`}>{stats.tradelines}</p>
          <p className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>
            with payment history: <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>{stats.withHistory}</span>
          </p>
        </div>
      </div>

      <div className={`${FINELY_OS_TOOLBAR} flex-wrap`}>
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Filters</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creditor / acct / type…"
          className={`${FINELY_OS_ENTITY_INPUT} !mt-0 w-56 max-w-full`}
        />
        <select
          value={openIndex == null ? '' : String(openIndex)}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            const idx = parseInt(v, 10);
            if (!Number.isFinite(idx)) return;
            setOpenIndex(idx);
            window.setTimeout(() => {
              cardRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          }}
          className={FINELY_OS_ENTITY_SELECT}
          title="Jump to a tradeline without scrolling (first 40 matches)"
        >
          <option value="">Jump to…</option>
          {filteredTradelines.slice(0, 40).map((t, idx) => (
            <option key={`${t.creditorName}_${idx}`} value={String(idx)}>
              {t.creditorName}
            </option>
          ))}
        </select>
        <select
          value={filterBureau}
          onChange={(e) => setFilterBureau((e.target.value || '') as Bureau | '')}
          className={FINELY_OS_ENTITY_SELECT}
        >
          <option value="">All bureaus</option>
          <option value="EXP">Experian</option>
          <option value="EQF">Equifax</option>
          <option value="TUC">TransUnion (Trans)</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
          <option value="">All types</option>
          {distinctTypes.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
          <option value="">All statuses</option>
          {distinctStatuses.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap items-center gap-2 pl-1">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Responsibility</span>
          {(
            [
              { k: '', label: `All (${filteredNoResp.length})` },
              { k: 'Primary', label: `Primary (${respCounts.Primary})` },
              { k: 'AU', label: `AU (${respCounts.AU})` },
              { k: 'Joint', label: `Joint (${respCounts.Joint})` },
            ] as const
          ).map((x) => (
            <button
              key={x.k || 'all'}
              type="button"
              onClick={() => setFilterResp(x.k)}
              className={finelyOsViewTab(filterResp === x.k, 'sky')}
              title="Filter by responsibility (AU vs Primary vs Joint)"
            >
              {x.label}
            </button>
          ))}
        </div>
        {(filterBureau || filterType || filterStatus || filterResp) && (
          <button
            type="button"
            onClick={() => {
              setFilterBureau('');
              setFilterType('');
              setFilterStatus('');
              setFilterResp('');
              setQuery('');
            }}
            className="text-[10px] font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200"
          >
            Clear
          </button>
        )}
      </div>

      <CollapsibleSection
        variant="dark"
        title="Tradelines"
        subtitle="Full-width account view — expand any tradeline for bureau field table + 2-year payment history grid (as on the report)."
        count={`${filteredTradelines.length}`}
        defaultOpen
        storageKey={`reports.viewer.tradelines.${parsed.provider || 'unknown'}.list`}
        className="!overflow-visible"
        bodyClassName="!p-0 !overflow-visible"
      >
        <div className="p-4 md:p-6 space-y-5 w-full max-w-full overflow-visible">
          {visibleTradelines.map((t, pageIdx) => {
          const idx = safeTradelinePage * TRADELINE_PAGE_SIZE + pageIdx;
          const isOpen = openIndex === idx;
          const rk = responsibilityKind(t.responsibility);
          const fields = t.fields ?? [];
          const accountNoRow = fields.find((f) => f?.label?.toLowerCase?.()?.includes('account #'));
          const by = accountNoRow?.byBureau ?? {};
          const acct = by.EXP || by.TUC || by.EQF;
          const showAllFields = showAllFieldsByIdx[idx] ?? true;
          const screenshotKey = `${idx}_${t.creditorName}`;
          const sequenceLabel = showSequence ? idx + 1 : null;

          return (
            <div
              key={`${t.creditorName}_${idx}`}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={`rounded-2xl border overflow-visible min-w-0 w-full max-w-full ${finelyOsInlineListItem()} !p-0 ${
                rk === 'AU'
                  ? 'border-violet-500/35'
                  : rk === 'Primary'
                    ? 'border-emerald-500/35'
                    : rk === 'Joint'
                      ? 'border-sky-500/35'
                      : 'border-white/[0.08]'
              }`}
            >
              <button
                className="w-full flex items-start justify-between gap-4 text-left transition-colors px-5 py-4 md:px-6 md:py-5 hover:bg-white/[0.04] items-center"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
              >
                <div className="min-w-0 flex-1">
                  {sequenceLabel ? (
                    <span className="inline-flex mb-2 px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-100 text-[10px] font-black uppercase tracking-widest">
                      #{sequenceLabel}
                    </span>
                  ) : null}
                  <p className={`${FINELY_OS_ENTITY_VALUE} text-lg md:text-xl leading-tight`}>{t.creditorName}</p>
                  <p className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>
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
                      <span className={`inline-flex px-2.5 py-1 rounded-full border ${finelyOsStatusChip('ok')}`}>
                        {t.accountType}
                      </span>
                    ) : null}
                    {t.accountStatus ? (
                      <span className={`inline-flex px-2.5 py-1 rounded-full border ${finelyOsStatusChip('warn')}`}>
                        {t.accountStatus}
                      </span>
                    ) : null}
                    {t.utilizationPct && Object.keys(t.utilizationPct).length > 0 ? (
                      <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY} font-mono`}>
                        Util:{' '}
                        {(['EXP', 'EQF', 'TUC'] as const)
                          .filter((b) => t.utilizationPct![b] != null)
                          .map((b) => `${bureauShortCode(b)} ${t.utilizationPct![b]}%`)
                          .join(' · ')}
                      </span>
                    ) : null}
                    {toUsdShort(t.balance) ? (
                      <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY} font-mono`}>Bal: {toUsdShort(t.balance)}</span>
                    ) : null}
                    {toUsdShort(t.pastDue) ? (
                      <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY} font-mono`}>Past-due: {toUsdShort(t.pastDue)}</span>
                    ) : null}
                    {toUsdShort(t.creditLimit) ? (
                      <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY} font-mono`}>Limit: {toUsdShort(t.creditLimit)}</span>
                    ) : null}
                    {t.dofd ? <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY} font-mono`}>DOFD: {t.dofd}</span> : null}
                  </div>
                  {isOpen ? null : t.paymentHistory2y?.byBureau ? (
                    <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>Expand to view full bureau field table + 2-year payment history grid.</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {partnerId && isOpen ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        captureTradelineScreenshot({ idx, tradeline: t });
                      }}
                      data-no-capture="true"
                      className={FINELY_OS_SECONDARY_BTN}
                      disabled={Boolean(savingKey)}
                      title="Save screenshot to Evidence Vault — included when you download the dispute letter PDF (print-ready)"
                    >
                      <Camera size={14} className="text-amber-300" />
                      {savingKey === screenshotKey ? 'Saving…' : 'Screenshot'}
                    </button>
                  ) : null}
                  <ChevronDown size={18} className={`text-white/45 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-6 md:px-6 space-y-6 border-t border-white/[0.08] bg-black/20 w-full max-w-full overflow-visible">
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
                      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className={FINELY_OS_ENTITY_SUBLABEL}>Account details</div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                              Showing <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>{rowsToShow.length}</span> of{' '}
                              <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>{fields.length}</span> fields
                              {!showAllFields ? ' (key fields)' : ''}.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAllFieldsByIdx((cur) => ({ ...cur, [idx]: !showAllFields }))}
                            className={FINELY_OS_SECONDARY_BTN}
                          >
                            {showAllFields ? 'Show key fields only' : 'Show all fields'}
                          </button>
                        </div>

                        <p className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>Bureau field table — scroll horizontally to see TransUnion, Experian, and Equifax</p>
                        <div className="w-full max-w-full overflow-x-auto overflow-y-visible pb-2">
                          <table className="min-w-[960px] w-full text-left text-sm border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-[#070b09]/98 backdrop-blur-xl border-b border-white/[0.08]">
                              <tr className={FINELY_OS_ENTITY_SUBLABEL}>
                                <th className="py-3 pr-4 text-left">Field</th>
                                <th className="py-3 pr-4 text-left">TransUnion</th>
                                <th className="py-3 pr-4 text-left">Experian</th>
                                <th className="py-3 text-left">Equifax</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rowsToShow.map((row, ri) => {
                                const byBureau = row?.byBureau ?? {};
                                return (
                                  <tr key={ri} className="border-t border-white/[0.08]">
                                    <td className={`py-3 pr-4 ${FINELY_OS_ENTITY_BODY}`}>{row?.label ?? ''}</td>
                                    <td className={`py-3 pr-4 font-mono ${FINELY_OS_ENTITY_VALUE} text-sm`}>{safe(byBureau.TUC)}</td>
                                    <td className={`py-3 pr-4 font-mono ${FINELY_OS_ENTITY_VALUE} text-sm`}>{safe(byBureau.EXP)}</td>
                                    <td className={`py-3 font-mono ${FINELY_OS_ENTITY_VALUE} text-sm`}>{safe(byBureau.EQF)}</td>
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
                    <div className={`${FINELY_OS_GLASS_CATALOG} w-full max-w-full overflow-visible p-4 md:p-5`}>
                      <p className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>2-year payment history (full grid)</p>
                      <p className={`${FINELY_OS_ENTITY_BODY} text-xs mb-3 opacity-80`}>Scroll horizontally to view all months — Equifax column is at the far right.</p>
                      <div className="w-full max-w-full overflow-x-auto pb-2">
                      <table className="min-w-max w-full text-[11px] md:text-xs border-separate border-spacing-0">
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
                                  <td className={`pr-4 py-2 font-semibold ${FINELY_OS_ENTITY_BODY}`}>Month</td>
                                  {months.map((m, i) => (
                                    <td key={i} className={`px-2 py-2 ${FINELY_OS_ENTITY_BODY}`}>
                                      {m}
                                    </td>
                                  ))}
                                </tr>
                                <tr>
                                  <td className={`pr-4 py-2 font-semibold ${FINELY_OS_ENTITY_BODY}`}>Year</td>
                                  {years.map((y, i) => (
                                    <td key={i} className="px-2 py-2 text-white/45">
                                      {y}
                                    </td>
                                  ))}
                                </tr>
                                {(['TUC', 'EXP', 'EQF'] as const).map((b) => (
                                  <tr key={b}>
                                    <td className={`pr-4 py-2 font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{bureauShortCode(b)}</td>
                                    {((t.paymentHistory2y?.byBureau ?? {})[b] ?? []).map((c, i) => {
                                      const code = c.code || '';
                                      const isDerog = ['30', '60', '90', '120', 'CO'].includes(code.toUpperCase());
                                      return (
                                        <td
                                          key={i}
                                          className={`px-2 py-2 font-mono ${isDerog ? 'text-red-700 font-semibold' : FINELY_OS_ENTITY_BODY}`}
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
                    </div>
                  ) : (
                    <div className={`${FINELY_OS_GLASS_CATALOG} flex items-center gap-3`}>
                      <ShieldAlert size={16} className="text-amber-300" />
                      <p className={FINELY_OS_ENTITY_BODY}>Payment history was not detected for this tradeline in the uploaded file.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
          })}

          {filteredTradelines.length > TRADELINE_PAGE_SIZE ? (
            <div className={FINELY_OS_LUXURY_PAGINATION}>
              <span className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal font-mono`}>
                Page {safeTradelinePage + 1} of {tradelineTotalPages} · {filteredTradelines.length} tradelines
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={safeTradelinePage <= 0}
                  onClick={() => setTradelinePage((p) => p - 1)}
                  className={FINELY_OS_LUXURY_PAGINATION_BTN}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  disabled={safeTradelinePage >= tradelineTotalPages - 1}
                  onClick={() => setTradelinePage((p) => p + 1)}
                  className={FINELY_OS_LUXURY_PAGINATION_BTN}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </CollapsibleSection>
    </div>
  );
}

