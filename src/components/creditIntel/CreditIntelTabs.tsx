import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Camera,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Gavel,
  GitCompareArrows,
  IdCard,
  Layers,
  Scale,
  ShieldAlert,
  Search,
  SplitSquareVertical,
  TrendingUp,
} from 'lucide-react';
import type { Bureau, DisputeCandidate, ParsedCreditReport, ParsedCreditorContact, ParsedSection, ParsedSectionItem, ParsedTradeline, TradelineRow } from '../../domain/creditReports';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import { suggestDisputeReasons } from '../../creditReports/disputeReasons';
import { computeCreditIntelReadiness, rankDisputeCandidates } from '../../creditReports/creditIntelInsights';
import { ParsedReportViewer } from '../reports/ParsedReportViewer';
import { SectionItemEvidenceSheet } from '../evidence/EvidenceSheet';
import type { EvidenceItem } from '../../domain/evidence';
import { getBlobStore } from '../../storage/getBlobStore';
import { upsertEvidence } from '../../data/evidenceRepo';
import { addAuditEvent } from '../../data/auditRepo';
import { newId } from '../../utils/ids';
import { useLocation, useNavigate } from 'react-router-dom';
import { captureCleanPng } from '../../utils/capturePng';
import { captureReactElementPng } from '../../utils/captureReactPng';
import { toCsv, toTsv } from '../../utils/tabularExport';
import { downloadText } from '../../utils/download';

type TabKey =
  | 'overview'
  | 'pi'
  | 'creditors'
  | 'accounts'
  | 'collections'
  | 'public_records'
  | 'late_payments'
  | 'inquiries'
  | 'negatives'
  | 'strategy'
  | 'disputes'
  | 'education'
  | 'comparison'
  | 'simulation';

function safe(v?: string | number | null) {
  const s = `${v ?? ''}`.trim();
  return s ? s : '-';
}

function parseMoney(raw?: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[, ]/g, '').replace(/[^0-9.\-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toUsd(n: number | null) {
  if (n == null) return '-';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function toUsdShort(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return '-';
  try {
    return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  } catch {
    return `$${Math.round(n)}`;
  }
}

function normalizeScoreModelName(model: string) {
  let m = (model || '').trim();
  if (!m) return '';
  m = m.replace(/[®™]/g, '').replace(/\s+/g, ' ').trim();
  // Common provider variations
  m = m.replace(/^fico\s*score\s*/i, 'FICO ');
  m = m.replace(/^vantage\s*score\s*/i, 'VantageScore ');
  m = m.replace(/^vantage\s*score/i, 'VantageScore');
  // "FICO 08" -> "FICO 8"
  m = m.replace(/\bFICO\s+0?(\d+)\b/i, (_, n) => `FICO ${Number(n)}`);
  // "VantageScore 3" -> "VantageScore 3.0" (best-effort)
  m = m.replace(/\bVantageScore\s+3\b/i, 'VantageScore 3.0');
  m = m.replace(/\bVantageScore\s+4\b/i, 'VantageScore 4.0');
  return m;
}

function scoreFamily(model: string): 'FICO' | 'VantageScore' | 'Other' {
  const m = (model || '').toLowerCase();
  if (m.includes('fico')) return 'FICO';
  if (m.includes('vantage')) return 'VantageScore';
  return 'Other';
}

function getFieldValueByBureau(parsed: ParsedCreditReport, labelIncludes: string): Partial<Record<Bureau, string>>[] {
  const out: Partial<Record<Bureau, string>>[] = [];
  const needle = labelIncludes.toLowerCase();
  for (const t of parsed.tradelines) {
    const row = (t.fields ?? []).find((f) => f?.label?.toLowerCase?.().includes(needle));
    if (row?.byBureau) out.push(row.byBureau);
  }
  return out;
}

/** Try multiple label synonyms so utilization works across different provider exports. */
function getFieldValuesByBureau(parsed: ParsedCreditReport, needles: string[]): Partial<Record<Bureau, string>>[] {
  for (const n of needles) {
    const out = getFieldValueByBureau(parsed, n);
    if (out.length) return out;
  }
  return [];
}

function computeMoneyTotals(parsed: ParsedCreditReport) {
  const bureaus: Bureau[] = ['EXP', 'EQF', 'TUC'];

  const balances = getFieldValuesByBureau(parsed, [
    'balance',
    'current balance',
    'amount owed',
    'balance amount',
    'high balance',
  ]).map((m) => m);
  const limits = getFieldValuesByBureau(parsed, [
    'credit limit',
    'high credit',
    'limit',
    'high credit limit',
    'credit line',
  ]).map((m) => m);

  const totals: Record<Bureau, { balance: number | null; limit: number | null; utilizationPct: number | null }> = {
    EXP: { balance: null, limit: null, utilizationPct: null },
    EQF: { balance: null, limit: null, utilizationPct: null },
    TUC: { balance: null, limit: null, utilizationPct: null },
  };

  for (const b of bureaus) {
    let balSum = 0;
    let balCount = 0;
    for (const m of balances) {
      const v = parseMoney(m[b]);
      if (v != null) {
        balSum += v;
        balCount++;
      }
    }

    let limSum = 0;
    let limCount = 0;
    for (const m of limits) {
      const v = parseMoney(m[b]);
      if (v != null) {
        limSum += v;
        limCount++;
      }
    }

    const balance = balCount ? balSum : null;
    const limit = limCount ? limSum : null;
    const utilizationPct = balance != null && limit != null && limit > 0 ? Math.round((balance / limit) * 100) : null;
    totals[b] = { balance, limit, utilizationPct };
  }

  return totals;
}

function bureauTableRows(rows: { field: string; exp?: string; eqf?: string; tuc?: string }[]) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-separate border-spacing-0">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-white/40">
            <th className="py-3 pr-4">Field</th>
            <th className="py-3 pr-4">Experian</th>
            <th className="py-3 pr-4">Equifax</th>
            <th className="py-3">TransUnion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/5">
              <td className="py-3 pr-4 text-white/70">{r.field}</td>
              <td className="py-3 pr-4 text-white/80 font-mono whitespace-pre-wrap break-all">{safe(r.exp)}</td>
              <td className="py-3 pr-4 text-white/80 font-mono whitespace-pre-wrap break-all">{safe(r.eqf)}</td>
              <td className="py-3 text-white/80 font-mono whitespace-pre-wrap break-all">{safe(r.tuc)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function genericTable(args: { columns: string[]; rows: string[][] }) {
  const cols = args.columns.slice(0, 8);
  const rows = args.rows.slice(0, 40);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-separate border-spacing-0">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-white/40">
            {cols.map((c, i) => (
              <th key={i} className="py-3 pr-4">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-white/5 align-top">
              {cols.map((_, ci) => (
                <td key={ci} className="py-3 pr-4 text-white/80 font-mono whitespace-pre-wrap break-words align-top">
                  {safe(r[ci] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {args.rows.length > rows.length && (
        <div className="mt-3 text-[11px] text-white/40">Showing first {rows.length} rows.</div>
      )}
    </div>
  );
}

/** Render table rows as one card per row — enterprise-style list for Collections/Inquiries. */
function sectionTableAsCards(args: { columns: string[]; rows: string[][]; maxCards?: number }) {
  const { columns, rows, maxCards = 100 } = args;
  const displayRows = rows.slice(0, maxCards);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {displayRows.map((row, ri) => (
        <div
          key={ri}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2"
        >
          {columns.map((col, ci) => {
            const val = row[ci] ?? '';
            if (!val) return null;
            return (
              <div key={ci} className="flex gap-2">
                <span className="text-[10px] uppercase tracking-widest text-white/40 shrink-0">{col}:</span>
                <span className="text-white/80 text-sm font-mono break-words">{val}</span>
              </div>
            );
          })}
        </div>
      ))}
      {rows.length > displayRows.length && (
        <div className="md:col-span-2 text-[11px] text-white/40">Showing {displayRows.length} of {rows.length} items.</div>
      )}
    </div>
  );
}

/** Phase 1: Render structured section items (collections/inquiries) as cards. */
function sectionItemsAsCards(items: ParsedSectionItem[], maxCards = 100) {
  const display = items.slice(0, maxCards);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {display.map((item, i) => (
        <div
          key={item.rowIndex ?? i}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2"
        >
          {Object.entries(item.fields).map(([key, val]) => {
            if (!(val ?? '').trim()) return null;
            return (
              <div key={key} className="flex gap-2">
                <span className="text-[10px] uppercase tracking-widest text-white/40 shrink-0">{key}:</span>
                <span className="text-white/80 text-sm font-mono break-words">{val}</span>
              </div>
            );
          })}
        </div>
      ))}
      {items.length > display.length && (
        <div className="md:col-span-2 text-[11px] text-white/40">Showing {display.length} of {items.length} items.</div>
      )}
    </div>
  );
}

function tabBtn(active: boolean) {
  return `px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
  }`;
}

export function CreditIntelTabs({
  parsed,
  reportId,
  partnerId,
  evidence,
  availableReports,
  onStartDispute,
  onOpenLetterGenerator,
  onOpenEvidenceVault,
  onOpenTasks,
  initialTab,
  initialScrollToAccount,
}: {
  parsed: ParsedCreditReport;
  reportId?: string;
  partnerId?: string;
  /** Evidence vault items (used for restore-mode “evidence coverage” signals). */
  evidence?: EvidenceItem[];
  availableReports?: { id: string; receivedAt: string; filename: string; parsed?: ParsedCreditReport }[];
  /** When provided, enables "Start dispute" per candidate (partner portal). */
  onStartDispute?: (candidate: DisputeCandidate, reasonTexts: string[]) => void;
  /** When provided, "Open Disputes tab" in Credit Intel jumps to the page-level Disputes tab (letter generator). */
  onOpenLetterGenerator?: () => void;
  /** When provided, opens the evidence vault/uploader in the hosting page. */
  onOpenEvidenceVault?: () => void;
  /** When provided, opens Tasks & Notifications in the hosting page. */
  onOpenTasks?: () => void;
  /** Optional deep-link behavior when arriving from Letters. */
  initialTab?: TabKey;
  /** Optional deep-link auto-scroll target (uses ParsedReportViewer scrollToCreditorName). */
  initialScrollToAccount?: string | null;
}) {
  /** Guard against malformed or legacy stored data: ensure arrays exist so we never throw on .length or .filter. */
  const safeParsed = useMemo((): ParsedCreditReport => {
    if (!parsed || typeof parsed !== 'object') {
      return { provider: 'unknown', tradelines: [], sections: [], scores: [] };
    }
    return {
      ...parsed,
      tradelines: Array.isArray(parsed.tradelines) ? parsed.tradelines : [],
      sections: Array.isArray(parsed.sections) ? parsed.sections : undefined,
      scores: Array.isArray(parsed.scores) ? parsed.scores : undefined,
      creditorContacts: Array.isArray(parsed.creditorContacts) ? parsed.creditorContacts : undefined,
      personalInfo: parsed.personalInfo && typeof parsed.personalInfo === 'object' ? parsed.personalInfo : undefined,
    };
  }, [parsed]);

  const [tab, setTab] = useState<TabKey>(initialTab ?? 'accounts');
  const [paydownAmount, setPaydownAmount] = useState<number>(1000);
  const [manualBalanceOverride, setManualBalanceOverride] = useState<string>('');
  const [manualLimitOverride, setManualLimitOverride] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [expandedStrategyCandidateId, setExpandedStrategyCandidateId] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [scrollToAccount, setScrollToAccount] = useState<string | null>(initialScrollToAccount ?? null);
  const [insightsOpenId, setInsightsOpenId] = useState<string | null>(null);
  const [showEvidenceTables, setShowEvidenceTables] = useState(false);
  const [piOpen, setPiOpen] = useState(true);
  const [restoreModeOn, setRestoreModeOn] = useState(true);
  const [fixMissingEvidenceMode, setFixMissingEvidenceMode] = useState(false);
  const [showAllBySectionKey, setShowAllBySectionKey] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (initialTab) setTab(initialTab);
    if (initialScrollToAccount) setScrollToAccount(initialScrollToAccount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab, initialScrollToAccount]);

  const disputeCandidates = useMemo(() => deriveDisputeCandidates(safeParsed, reportId), [safeParsed, reportId]);
  const totals = useMemo(() => computeMoneyTotals(safeParsed), [safeParsed]);
  const candidatePriority = useMemo(() => rankDisputeCandidates({ parsed: safeParsed, candidates: disputeCandidates }), [safeParsed, disputeCandidates]);
  const rankedById = useMemo(() => new Map(candidatePriority.map((c) => [c.id, c])), [candidatePriority]);
  const activeInsight = useMemo(() => (insightsOpenId ? rankedById.get(insightsOpenId) ?? null : null), [insightsOpenId, rankedById]);

  const screenshotEvidence = useMemo(() => (evidence ?? []).filter((x) => x.type === 'screenshot'), [evidence]);

  const hasScreenshotForAccount = (accountName: string) => {
    const needle = (accountName || '').trim().toLowerCase();
    if (!needle) return false;
    for (const ev of screenshotEvidence) {
      const cn = (ev.creditorName || '').trim().toLowerCase();
      if (cn && (cn === needle || cn.includes(needle) || needle.includes(cn))) return true;
      const fn = (ev.filename || '').toLowerCase();
      if (fn && fn.includes(needle)) return true;
    }
    return false;
  };

  const evidenceCoverage = useMemo(() => {
    const total = candidatePriority.length;
    let covered = 0;
    for (const c of candidatePriority) if (hasScreenshotForAccount(c.account)) covered += 1;
    return { covered, total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatePriority, screenshotEvidence]);

  const intelReadiness = useMemo(() => {
    return computeCreditIntelReadiness({
      parsed: safeParsed,
      rankedCandidates: candidatePriority,
      evidenceCoverage,
    });
  }, [candidatePriority, evidenceCoverage, safeParsed]);

  const nextMissingEvidenceCandidate = useMemo(() => {
    return candidatePriority.find((c) => !hasScreenshotForAccount(c.account)) ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatePriority, screenshotEvidence]);

  const restoreDisputeList = useMemo(() => {
    if (!fixMissingEvidenceMode) return candidatePriority;
    return candidatePriority.filter((c) => !hasScreenshotForAccount(c.account));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatePriority, fixMissingEvidenceMode, screenshotEvidence]);

  useEffect(() => {
    const linked = candidatePriority.filter((c) => Boolean((c as any).linkedTradeline)).length;
    const missingLinked = Math.max(0, candidatePriority.length - linked);
    void linked;
    void missingLinked;
  }, [candidatePriority, disputeCandidates.length, reportId, safeParsed.provider, safeParsed.tradelines?.length]);

  const openEvidence = () => {
    if (onOpenEvidenceVault) return onOpenEvidenceVault();
    // best-effort route fallback (partner report page has a vault; portal docs is universal)
    if (location.pathname.startsWith('/portal')) return navigate('/portal/documents');
  };
  const openTasks = () => {
    if (onOpenTasks) return onOpenTasks();
    if (location.pathname.startsWith('/portal')) return navigate('/portal/tasks');
  };

  useEffect(() => {
    if (tab === 'accounts' && scrollToAccount) {
      const t = setTimeout(() => setScrollToAccount(null), 400);
      return () => clearTimeout(t);
    }
  }, [tab, scrollToAccount]);

  const negativeBuckets = useMemo(() => {
    const n = (s: string) => (s || '').toLowerCase();
    const buckets = {
      collectionsAndChargeOffs: [] as ParsedTradeline[],
      latePayments: [] as ParsedTradeline[],
      otherDerog: [] as ParsedTradeline[],
    };

    const hasAnyDerogCode = (t: ParsedTradeline, pred: (code: string) => boolean) => {
      const history = t.paymentHistory2y?.byBureau ?? {};
      for (const codes of Object.values(history)) {
        for (const c of codes ?? []) {
          const code = n(c?.code ?? '').trim();
          if (!code) continue;
          if (pred(code)) return true;
        }
      }
      return false;
    };

    const findAnyField = (t: ParsedTradeline, ...needles: string[]) => {
      const lower = (x: string) => (x || '').toLowerCase();
      const rows = (t.fields ?? []).filter((f) => f?.label && needles.some((nd) => lower(f.label).includes(lower(nd))));
      const pick = (by: any) => (by?.EXP || by?.TUC || by?.EQF || '').toString();
      return rows.map((r) => pick(r.byBureau)).join(' ').trim();
    };
    const allFieldBlob = (t: ParsedTradeline) => {
      const parts: string[] = [];
      for (const row of t.fields ?? []) {
        if (!row) continue;
        const by = row.byBureau ?? ({} as any);
        const vals = [by.EXP, by.EQF, by.TUC].filter(Boolean).join(' ');
        parts.push(`${row.label ?? ''} ${vals}`.trim());
      }
      return n(parts.join(' '));
    };

    for (const t of safeParsed.tradelines ?? []) {
      const typeBlob = n(
        [
          t.accountType ?? '',
          findAnyField(t, 'account type', 'type of account', 'account type - detail', 'type detail', 'portfolio type'),
        ].join(' '),
      );
      const status = n(t.accountStatus ?? '');
      const paymentStatus = n(
        findAnyField(
          t,
          'payment status',
          'pay status',
          'worst pay',
          'rating',
          'remarks',
          'special comment',
          'special comments',
          'comment',
          'comments',
          'narrative',
          'status',
          'delinquency',
        ),
      );
      const anyField = allFieldBlob(t);

      const isCollectionOrCO =
        typeBlob.includes('collection') ||
        paymentStatus.includes('collection') ||
        anyField.includes('collection') ||
        status.includes('charge') ||
        status.includes('charge-off') ||
        status.includes('charge off') ||
        status.includes('chargeoff') ||
        paymentStatus.includes('charge') ||
        paymentStatus.includes('charge-off') ||
        paymentStatus.includes('charge off') ||
        paymentStatus.includes('chargeoff') ||
        paymentStatus.includes('charged off') ||
        anyField.includes('charge off') ||
        anyField.includes('chargeoff') ||
        anyField.includes('charged off') ||
        anyField.includes('write off') ||
        anyField.includes('writeoff') ||
        status.includes('collection') ||
        hasAnyDerogCode(t, (c) => c === 'co' || c === 'cl' || c.includes('col') || c.includes('charge'));

      const isLateOnly =
        !isCollectionOrCO &&
        (hasAnyDerogCode(t, (c) => ['30', '60', '90', '120'].includes(c)) ||
          paymentStatus.includes('late') ||
          paymentStatus.includes('delinq') ||
          paymentStatus.includes('30') ||
          paymentStatus.includes('60') ||
          paymentStatus.includes('90') ||
          paymentStatus.includes('120'));

      const isOtherDerog =
        !isCollectionOrCO &&
        !isLateOnly &&
        (paymentStatus.includes('repo') ||
          paymentStatus.includes('repos') ||
          paymentStatus.includes('foreclos') ||
          paymentStatus.includes('bankrupt') ||
          status.includes('repo') ||
          status.includes('foreclos'));

      if (isCollectionOrCO) buckets.collectionsAndChargeOffs.push(t);
      else if (isLateOnly) buckets.latePayments.push(t);
      else if (isOtherDerog) buckets.otherDerog.push(t);
    }

    return buckets;
  }, [safeParsed.tradelines]);

  const sectionsByKey = useMemo(() => {
    const m = new Map<string, ParsedSection>();
    const normCol = (c: string) => (c || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const mergeTables = (a: { columns: string[]; rows: string[][] }, b: { columns: string[]; rows: string[][] }) => {
      const outCols: string[] = [];
      const keyToIdx = new Map<string, number>();
      const addCols = (cols: string[]) => {
        cols.forEach((c) => {
          const k = normCol(c);
          if (!k) return;
          if (!keyToIdx.has(k)) {
            keyToIdx.set(k, outCols.length);
            outCols.push(c);
          }
        });
      };
      addCols(a.columns);
      addCols(b.columns);
      const mapRow = (tbl: { columns: string[]; rows: string[][] }, row: string[]) => {
        const outRow = Array(outCols.length).fill('') as string[];
        tbl.columns.forEach((c, i) => {
          const outIdx = keyToIdx.get(normCol(c));
          if (outIdx == null) return;
          outRow[outIdx] = row[i] ?? '';
        });
        return outRow;
      };
      return { columns: outCols, rows: [...a.rows.map((r) => mapRow(a, r)), ...b.rows.map((r) => mapRow(b, r))] };
    };

    const toPublicRecordsKey = (k: string) => (k === 'bankruptcy' ? 'public_records' : k);
    const ensureRecordTypeColumn = (table: { columns: string[]; rows: string[][] }, recordType: string) => {
      const has = table.columns.some((c) => normCol(c) === normCol('Record type'));
      if (has) return table;
      return { columns: ['Record type', ...table.columns], rows: table.rows.map((r) => [recordType, ...r]) };
    };
    const rowsAsTable = (rows: TradelineRow[], recordType: string) => {
      return {
        columns: ['Record type', 'Field', 'Experian', 'Equifax', 'TransUnion'],
        rows: rows.map((r) => [
          recordType,
          r.label,
          r.byBureau?.EXP ?? '',
          r.byBureau?.EQF ?? '',
          r.byBureau?.TUC ?? '',
        ]),
      };
    };

    for (const s of safeParsed.sections ?? []) {
      const key = toPublicRecordsKey(s.key);
      const isLegacyBankruptcy = s.key === 'bankruptcy';
      const baseTitle = key === 'public_records' ? 'Public Records' : s.title;
      const recordTypeHint = isLegacyBankruptcy ? 'Bankruptcy' : 'Public record';

      const normalized: ParsedSection = {
        ...s,
        key,
        title: baseTitle,
        table: s.table
          ? (key === 'public_records' ? ensureRecordTypeColumn(s.table as any, recordTypeHint) : (s.table as any))
          : isLegacyBankruptcy && s.rows?.length
            ? (rowsAsTable(s.rows as any, 'Bankruptcy') as any)
            : undefined,
        rows: key === 'public_records' ? undefined : s.rows,
      } as any;

      const prev = m.get(key);
      if (!prev) {
        m.set(key, normalized);
        continue;
      }

      // Merge sections with same key (common for public records, legacy bankruptcy, and provider duplicates).
      const merged: ParsedSection = {
        ...prev,
        title: prev.title || normalized.title,
        table:
          prev.table && normalized.table
            ? (mergeTables(prev.table as any, normalized.table as any) as any)
            : (prev.table as any) || (normalized.table as any),
        items: [...(prev.items ?? []), ...(normalized.items ?? [])],
        rows: [...(prev.rows ?? []), ...(normalized.rows ?? [])],
      };
      if (!merged.items?.length) delete (merged as any).items;
      if (!merged.rows?.length) delete (merged as any).rows;
      m.set(key, merged);
    }

    return m;
  }, [safeParsed.sections]);

  const hasPublicRecords = useMemo(() => {
    const s = sectionsByKey.get('public_records');
    return Boolean(s?.rows?.length || s?.table?.rows?.length || s?.items?.length);
  }, [sectionsByKey]);
  const publicRecordsCount = useMemo(() => {
    const s = sectionsByKey.get('public_records');
    if (!s) return 0;
    return (s.items?.length ?? s.table?.rows?.length ?? s.rows?.length ?? 0) || 0;
  }, [sectionsByKey]);

  const collectionsDisplayTradelines = useMemo((): ParsedTradeline[] => negativeBuckets.collectionsAndChargeOffs, [negativeBuckets]);
  const latePaymentTradelines = useMemo((): ParsedTradeline[] => negativeBuckets.latePayments, [negativeBuckets]);

  /** Phase 2: Score factors derived from parsed data (what's helping / hurting). */
  const scoreFactors = useMemo(() => {
    const helping: string[] = [];
    const hurting: string[] = [];
    const utilVals = [totals.EXP.utilizationPct, totals.EQF.utilizationPct, totals.TUC.utilizationPct].filter(
      (x): x is number => typeof x === 'number',
    );
    const utilAvg = utilVals.length ? Math.round(utilVals.reduce((a, b) => a + b, 0) / utilVals.length) : null;
    const tlCount = safeParsed.tradelines.length;
    const derogCount = disputeCandidates.length;
    const hasCollections = (safeParsed.sections ?? []).some((s) => s.key === 'collections' && (s.rows?.length || (s as any).table?.rows?.length || s.items?.length));

    if (utilAvg != null && utilAvg <= 30 && utilAvg > 0) helping.push('Revolving utilization in a reasonable range (under 30%).');
    if (utilAvg === 0 && tlCount > 0) helping.push('No revolving balance reported (0% utilization).');
    if (tlCount >= 5) helping.push('Multiple accounts reporting (credit mix and history depth).');
    else if (tlCount >= 3) helping.push('Several tradelines reporting (helps score factors).');

    if (derogCount > 0) hurting.push(`${derogCount} negative item${derogCount !== 1 ? 's' : ''} detected (collections, charge-offs, or late payments).`);
    if (utilAvg != null && utilAvg > 30) hurting.push(`High utilization (${utilAvg}% avg) — consider paying down balances below 30%.`);
    if (hasCollections) hurting.push('Collection account(s) present — address for score improvement.');
    if (tlCount < 3 && tlCount > 0) helping.push('Adding positive accounts over time can strengthen your profile.');
    if (tlCount === 0) hurting.push('No tradelines extracted — upload a full report export for better insights.');

    return { helping, hurting };
  }, [safeParsed.tradelines.length, safeParsed.sections, disputeCandidates.length, totals]);

  /** Phase 2: Precompute suggested dispute reasons per candidate (for Strategy + Disputes tabs). */
  const disputeReasonsByCandidateId = useMemo(() => {
    const m = new Map<string, { id: string; text: string }[]>();
    for (const c of disputeCandidates) {
      m.set(c.id, suggestDisputeReasons(safeParsed, c));
    }
    return m;
  }, [safeParsed, disputeCandidates]);

  const scoreRows = useMemo(() => {
    const scores = safeParsed.scores ?? [];
    if (!scores.length) return [];
    const specificity = (s: { model: string; bureau?: Bureau; value: number; sourceText?: string }) => {
      const src = (s.sourceText || '').toLowerCase();
      let n = 0;
      if (s.bureau) n += 12;
      if (src.includes('experian') || src.includes('equifax') || src.includes('transunion') || /\b(exp|eqf|tuc|tu)\b/.test(src)) n += 10;
      if (src.includes('vantage')) n += 8;
      if (src.includes('fico')) n += 8;
      if (/\bvantagescore\s*[0-9]/i.test(s.model)) n += 8;
      if (/\bfico\s*[0-9]/i.test(s.model)) n += 8;
      const len = (s.sourceText || '').length;
      if (len > 0) n += Math.max(0, 12 - Math.floor(len / 40));
      return n;
    };

    const pick = (prev: any, next: any) => {
      if (!prev) return next;
      return specificity(next) > specificity(prev) ? next : prev;
    };

    const byModel = new Map<string, Partial<Record<Bureau, { value: number; sourceText?: string }>>>();
    for (const s of scores) {
      if (!s.model || !Number.isFinite(s.value as any)) continue;
      const model = normalizeScoreModelName(s.model) || s.model;
      const cur = byModel.get(model) ?? {};
      if (s.bureau) {
        const prev = cur[s.bureau];
        cur[s.bureau] = pick(prev, { value: s.value, sourceText: s.sourceText });
      }
      byModel.set(model, cur);
    }
    return Array.from(byModel.entries()).map(([model, by]) => ({
      field: model,
      exp: by.EXP != null ? String(by.EXP.value) : undefined,
      eqf: by.EQF != null ? String(by.EQF.value) : undefined,
      tuc: by.TUC != null ? String(by.TUC.value) : undefined,
    }));
  }, [safeParsed.scores]);

  const detectedScoreModels = useMemo(() => {
    const scores = safeParsed.scores ?? [];
    const set = new Map<string, { family: string; model: string }>();
    for (const s of scores) {
      const model = normalizeScoreModelName(s.model) || s.model;
      if (!model) continue;
      set.set(model, { family: scoreFamily(model), model });
    }
    return Array.from(set.values()).sort((a, b) => (a.family === b.family ? a.model.localeCompare(b.model) : a.family.localeCompare(b.family)));
  }, [safeParsed.scores]);

  const commonScoreRows = useMemo(() => {
    const scores = safeParsed.scores ?? [];
    if (!scores.length) return [];
    const pick = (needle: string) => {
      const n = needle.toLowerCase();
      const specificity = (s: { model: string; bureau?: Bureau; value: number; sourceText?: string }) => {
        const src = (s.sourceText || '').toLowerCase();
        let k = 0;
        if (s.bureau) k += 12;
        if (src.includes('experian') || src.includes('equifax') || src.includes('transunion') || /\b(exp|eqf|tuc|tu)\b/.test(src)) k += 10;
        if (src.includes('vantage')) k += 8;
        if (src.includes('fico')) k += 8;
        if (/\bvantagescore\s*[0-9]/i.test(s.model)) k += 8;
        if (/\bfico\s*[0-9]/i.test(s.model)) k += 8;
        const len = (s.sourceText || '').length;
        if (len > 0) k += Math.max(0, 12 - Math.floor(len / 40));
        return k;
      };
      const by: Partial<Record<Bureau, { value: number; sourceText?: string; model: string; bureau?: Bureau }>> = {};
      for (const s of scores) {
        const model = (normalizeScoreModelName(s.model) || s.model || '').toLowerCase();
        if (!model.includes(n)) continue;
        if (!s.bureau) continue;
        const prev = by[s.bureau];
        const next = { value: s.value, sourceText: s.sourceText, model: s.model, bureau: s.bureau };
        by[s.bureau] = !prev ? next : specificity(next) > specificity(prev) ? next : prev;
      }
      return by;
    };

    const rows: { field: string; exp?: string; eqf?: string; tuc?: string }[] = [];
    const add = (label: string, needle: string) => {
      const by = pick(needle);
      rows.push({
        field: label,
        exp: by.EXP != null ? String(by.EXP.value) : undefined,
        eqf: by.EQF != null ? String(by.EQF.value) : undefined,
        tuc: by.TUC != null ? String(by.TUC.value) : undefined,
      });
    };

    // Commonly referenced models (fill when present; otherwise shows '-')
    add('FICO 8 (general lending)', 'fico 8');
    add('VantageScore 3.0 (monitoring)', 'vantagescore 3.0');
    add('VantageScore 4.0 (monitoring)', 'vantagescore 4.0');
    add('Experian FICO 2 (mortgage classic)', 'fico 2');
    add('TransUnion FICO 4 (mortgage classic)', 'fico 4');
    add('Equifax FICO 5 (mortgage classic)', 'fico 5');
    return rows;
  }, [safeParsed.scores]);

  const creditorContactsDerived = useMemo(() => {
    const matchLabel = (label: string) => {
      const s = label.toLowerCase();
      return (
        s.includes('creditor') ||
        s.includes('subscriber') ||
        s.includes('furnisher') ||
        s.includes('address') ||
        s.includes('phone') ||
        s.includes('telephone') ||
        s.includes('contact') ||
        s.includes('website') ||
        s.includes('url')
      );
    };
    const pick = (by: any) => by?.EXP || by?.EQF || by?.TUC || '';
    return (safeParsed.tradelines ?? []).map((t) => {
      const fields = t.fields ?? [];
      const rows = fields.filter((f) => f?.label && matchLabel(f.label));
      const website = rows.find((r) => r?.label?.toLowerCase?.().includes('web') || r?.label?.toLowerCase?.().includes('url'));
      const phone = rows.find((r) => r?.label?.toLowerCase?.().includes('phone') || r?.label?.toLowerCase?.().includes('telephone'));
      const address = rows.find((r) => r?.label?.toLowerCase?.().includes('address'));
      const subscriber = rows.find((r) => r?.label?.toLowerCase?.().includes('subscriber') || r?.label?.toLowerCase?.().includes('furnisher'));
      return {
        creditorName: t.creditorName,
        subscriber: pick(subscriber?.byBureau),
        phone: pick(phone?.byBureau),
        website: pick(website?.byBureau),
        address: pick(address?.byBureau),
        other: rows
          .filter((r) => r && ![website, phone, address, subscriber].includes(r))
          .slice(0, 6)
          .map((r) => ({ label: r?.label ?? '', value: pick(r?.byBureau) }))
          .filter((x) => Boolean((x.value || '').trim())),
      };
    });
  }, [safeParsed.tradelines]);

  const compareBase = useMemo(() => {
    if (!availableReports?.length) return null;
    const list = availableReports.filter((r) => r.parsed).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
    return list.find((r) => r.id !== reportId) ?? null;
  }, [availableReports, reportId]);
  const [compareId, setCompareId] = useState<string | null>(null);
  const compareOther = useMemo(() => {
    const list = (availableReports ?? []).filter((r) => r.parsed) as any[];
    const id = compareId ?? compareBase?.id ?? null;
    if (!id) return null;
    return list.find((r) => r.id === id) ?? null;
  }, [availableReports, compareBase?.id, compareId]);

  const compareSummary = useMemo(() => {
    const otherParsed = compareOther?.parsed as ParsedCreditReport | undefined;
    if (!otherParsed) return null;

    const nowScores = safeParsed.scores ?? [];
    const prevScores = otherParsed.scores ?? [];
    const scoreKey = (s: any) => `${s.bureau || 'NA'}|${s.model}`;
    const toMap = (arr: any[]) => {
      const m = new Map<string, number>();
      for (const s of arr) {
        if (!s?.model || !Number.isFinite(s.value)) continue;
        m.set(scoreKey(s), s.value);
      }
      return m;
    };
    const nowM = toMap(nowScores);
    const prevM = toMap(prevScores);
    const scoreChanges: { key: string; before?: number; after?: number; delta?: number }[] = [];
    for (const k of new Set([...Array.from(nowM.keys()), ...Array.from(prevM.keys())])) {
      const before = prevM.get(k);
      const after = nowM.get(k);
      if (before == null && after == null) continue;
      const delta = before != null && after != null ? after - before : undefined;
      scoreChanges.push({ key: k, before, after, delta });
    }
    scoreChanges.sort((a, b) => (a.key > b.key ? 1 : -1));

    const nowNames = new Set(safeParsed.tradelines.map((t) => t.creditorName.trim().toLowerCase()).filter(Boolean));
    const prevNames = new Set(otherParsed.tradelines.map((t) => t.creditorName.trim().toLowerCase()).filter(Boolean));
    const added = Array.from(nowNames).filter((x) => !prevNames.has(x)).length;
    const removed = Array.from(prevNames).filter((x) => !nowNames.has(x)).length;

    return { scoreChanges, added, removed, other: compareOther };
  }, [compareOther, safeParsed.scores, safeParsed.tradelines]);

  const captureSectionScreenshot = async (args: { key: string; title: string }) => {
    if (!partnerId) return;
    const el = sectionRefs.current[args.key];
    if (!el) return;
    setSavingKey(args.key);
    setNotice(null);
    try {
      const dataUrl = await captureCleanPng(el, { pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const store = getBlobStore();
      const put = await store.put(blob, {
        kind: 'evidence_screenshot_section',
        partnerId,
        reportId,
        sectionKey: args.key,
        sectionTitle: args.title,
      });

      const safeKey = args.key.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
      const filename = `Screenshot_${safeKey || 'Section'}_${new Date().toISOString().slice(0, 10)}.png`;
      const item: EvidenceItem = {
        id: newId('evidence'),
        partnerId,
        reportId,
        type: 'screenshot',
        source: 'section_screenshot',
        sectionKey: args.key,
        caption: `Section screenshot: ${args.title}`,
        filename,
        mimeType: 'image/png',
        sizeBytes: blob.size,
        blobRef: put.ref,
        createdAt: new Date().toISOString(),
      };
      upsertEvidence(item);
      addAuditEvent({
        partnerId,
        actorType: 'partner',
        action: 'evidence.captured',
        entityType: 'evidence',
        entityId: item.id,
        meta: { filename, source: item.source, reportId: reportId ?? null, sectionKey: args.key },
      });
      setNotice(`Saved section evidence screenshot: ${filename}`);
    } catch (e: any) {
      setNotice(`Section screenshot failed: ${e?.message || 'unknown error'}`);
    } finally {
      setSavingKey(null);
    }
  };

  /** Capture one collection/inquiry card so evidence can be linked to the matching dispute item (by creditorName). */
  const captureSectionItemScreenshot = async (args: { key: string; title: string; itemIndex: number; itemLabel: string; element: React.ReactElement }) => {
    if (!partnerId) return;
    const refKey = `${args.key}_${args.itemIndex}`;
    setSavingKey(refKey);
    setNotice(null);
    try {
      const dataUrl = await captureReactElementPng(args.element, { pixelRatio: 2, widthPx: 1100 });
      const blob = await (await fetch(dataUrl)).blob();
      const store = getBlobStore();
      const put = await store.put(blob, {
        kind: 'evidence_screenshot_section_item',
        partnerId,
        reportId,
        sectionKey: args.key,
        sectionTitle: args.title,
      });
      const safeLabel = (args.itemLabel || `Item ${args.itemIndex + 1}`).replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
      const filename = `Screenshot_${args.key}_${safeLabel}_${new Date().toISOString().slice(0, 10)}.png`;
      const item: EvidenceItem = {
        id: newId('evidence'),
        partnerId,
        reportId,
        type: 'screenshot',
        source: 'section_screenshot',
        sectionKey: args.key,
        creditorName: args.itemLabel || undefined,
        caption: `${args.title}: ${args.itemLabel || `Item ${args.itemIndex + 1}`}`,
        filename,
        mimeType: 'image/png',
        sizeBytes: blob.size,
        blobRef: put.ref,
        createdAt: new Date().toISOString(),
      };
      upsertEvidence(item);
      addAuditEvent({
        partnerId,
        actorType: 'partner',
        action: 'evidence.captured',
        entityType: 'evidence',
        entityId: item.id,
        meta: {
          filename,
          source: item.source,
          reportId: reportId ?? null,
          sectionKey: args.key,
          creditorName: item.creditorName ?? null,
        },
      });
      setNotice(`Saved screenshot for evidence vault. Attach it to the matching dispute item.`);
    } catch (e: any) {
      setNotice(`Screenshot failed: ${e?.message || 'unknown error'}`);
    } finally {
      setSavingKey(null);
    }
  };

  const renderSection = (key: string) => {
    const s = sectionsByKey.get(key);
    if (!s) return null;
    const hasStructuredItems = s.items && s.items.length > 0;
    const isCollectionsOrInquiries = key === 'collections' || key === 'inquiries';
    const isEvidenceScreenshotSection =
      key === 'collections' || key === 'inquiries' || key === 'public_records' || key === 'personal_information';
    const hasTableRows = (s.table?.rows?.length ?? 0) > 0;
    const norm = (v: string) => (v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const isBureauCol = (c: string) => {
      const n = norm(c);
      return (
        /\bexperian\b|\bexp\b/.test(n) ||
        /\bequifax\b|\beqf\b/.test(n) ||
        /\btransunion\b|\btuc\b/.test(n)
      );
    };
    const bureauKeyCount = (fields: Record<string, string>) => {
      const keys = Object.keys(fields || {}).map((k) => norm(k));
      const hasExp = keys.some((k) => /\bexperian\b|\bexp\b/.test(k));
      const hasEqf = keys.some((k) => /\bequifax\b|\beqf\b/.test(k));
      const hasTuc = keys.some((k) => /\btransunion\b|\btuc\b/.test(k));
      return Number(hasExp) + Number(hasEqf) + Number(hasTuc);
    };
    // Some exports include a "collections tradeline" matrix (rows are fields, columns are bureaus).
    // Rendering that as per-row screenshot cards is noisy and causes overflow; show it as a collapsed table instead.
    const looksLikeBureauMatrixTable =
      isCollectionsOrInquiries &&
      hasTableRows &&
      (s.table?.columns ?? []).filter(isBureauCol).length >= 2 &&
      (s.table?.rows?.length ?? 0) >= 6;
    const looksLikeBureauMatrixItems =
      isCollectionsOrInquiries &&
      hasStructuredItems &&
      (s.items?.length ?? 0) >= 6 &&
      (s.items ?? []).slice(0, 8).every((it) => bureauKeyCount(it.fields) >= 2);

    const usePerCardScreenshots =
      Boolean(partnerId) &&
      isEvidenceScreenshotSection &&
      !looksLikeBureauMatrixTable &&
      !looksLikeBureauMatrixItems &&
      (hasStructuredItems || hasTableRows);

    const getItemLabel = (index: number): string => {
      if (hasStructuredItems && s.items![index]) {
        const fields = s.items![index]!.fields;
        const prefer = (k: string) => fields[k] || fields[k.toLowerCase()] || fields[k.replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '')];
        const looksLikeName = (v: string) => (v || '').trim().length > 2 && !/^\d[\d\s\-*]*$/.test((v || '').trim());
        // Prefer name-like fields over "account" (which may be account number)
        const nameVal =
          prefer('creditor') ||
          prefer('agency') ||
          prefer('original creditor') ||
          prefer('original_creditor') ||
          prefer('furnisher') ||
          prefer('subscriber') ||
          prefer('creditor_name') ||
          prefer('collector');
        if (nameVal && looksLikeName(nameVal)) return nameVal;
        const accountVal = prefer('account');
        if (accountVal && looksLikeName(accountVal)) return accountVal;
        const firstVal = Object.values(fields)[0];
        if (firstVal && looksLikeName(firstVal)) return firstVal;
        return nameVal || accountVal || firstVal || `Item ${index + 1}`;
      }
      if (hasTableRows && s.table!.rows[index]) {
        const row = s.table!.rows[index]!;
        const cols = s.table!.columns.map((c) => (c || '').toLowerCase());
        if (key === 'public_records') {
          const normCol = (c: string) => (c || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
          const normCols = (s.table!.columns ?? []).map((c) => normCol(c));
          const idxOf = (re: RegExp) => normCols.findIndex((c) => re.test(c));
          const recordTypeIdx = idxOf(/\brecord\s*type\b/);
          const courtIdx = idxOf(/\bcourt\b/);
          const caseIdx = idxOf(/\bcase\b|docket|file\s*#|case\s*#/);
          const detailsIdx = idxOf(/\bdetails\b|description|remarks|note/);

          const recordType = recordTypeIdx >= 0 ? String(row[recordTypeIdx] ?? '').trim() : '';
          const courtRaw = courtIdx >= 0 ? String(row[courtIdx] ?? '').trim() : '';
          const caseRaw = caseIdx >= 0 ? String(row[caseIdx] ?? '').trim() : '';
          const details = detailsIdx >= 0 ? String(row[detailsIdx] ?? '').trim() : '';

          const extractFromDetails = (label: string) => {
            const t = String(details || '');
            const re = new RegExp(`${label}\\s*[:\\-]\\s*([^\\n\\r;,.]{3,80})`, 'i');
            const m = t.match(re);
            return (m?.[1] || '').trim();
          };
          const court = courtRaw || extractFromDetails('court');
          const caseNo = caseRaw || extractFromDetails('case');

          const parts = [recordType || 'Public record', court || '', caseNo || ''].filter(Boolean);
          const label = parts.join(' • ').trim();
          if (label) return label.slice(0, 120);
        }
        const nameLikeIdx = cols.findIndex((c) => /creditor|agency|furnisher|original\s*creditor|collector|subscriber|name/.test(c) && !/account\s*#|account\s*number|acct/.test(c));
        const fallbackIdx = cols.findIndex((c) => /creditor|agency|furnisher|original|collector|account/.test(c));
        const creditorIdx = nameLikeIdx >= 0 ? nameLikeIdx : fallbackIdx;
        const val = creditorIdx >= 0 ? (row[creditorIdx] ?? '').trim() : (row[0] ?? '').trim();
        const firstCol = (row[0] ?? '').trim();
        if (val && !/^\d[\d\s\-*]*$/.test(val)) return val;
        if (firstCol && !/^\d[\d\s\-*]*$/.test(firstCol)) return firstCol;
        return val || firstCol || `Item ${index + 1}`;
      }
      return `Item ${index + 1}`;
    };

    const isExpanded = Boolean(showAllBySectionKey[key]);
    const CARD_LIMIT = 12;
    const cardLimit = isExpanded ? 9999 : CARD_LIMIT;

    if (usePerCardScreenshots) {
      const items = hasStructuredItems ? s.items! : [];
      const rows = hasTableRows ? s.table!.rows! : [];
      const count = items.length || rows.length;
      const columns = s.table?.columns ?? [];

      return (
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40">{s.title}</p>
          <p className="text-white/60 text-sm">
            Each card can be screenshotted and attached to the matching dispute item when generating your letter.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {hasStructuredItems
              ? items.slice(0, cardLimit).map((item, i) => {
                  const itemLabel = getItemLabel(i);
                  return (
                    <div key={item.rowIndex ?? i}>
                      <div
                        ref={(el) => {
                          sectionRefs.current[`${key}_${i}`] = el;
                        }}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2"
                      >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-white/40 shrink-0">
                        {itemLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void captureSectionItemScreenshot({
                            key,
                            title: s.title,
                            itemIndex: i,
                            itemLabel,
                            element: <SectionItemEvidenceSheet sectionTitle={s.title} itemLabel={itemLabel} item={item} />,
                          })
                        }
                        data-no-capture="true"
                        className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-bold uppercase tracking-wider text-white/70 disabled:opacity-60"
                        disabled={Boolean(savingKey)}
                        title="Save this card to Evidence Vault — attach to the matching dispute item"
                      >
                        <Camera size={12} className="text-amber-400" />
                        {savingKey === `${key}_${i}` ? 'Saving…' : 'Screenshot'}
                      </button>
                    </div>
                    {Object.entries(item.fields).map(([k, val]) =>
                      (val ?? '').trim() ? (
                        <div key={k} className="flex gap-2">
                          <span className="text-[10px] uppercase tracking-widest text-white/40 shrink-0">{k}:</span>
                          <span className="text-white/80 text-sm font-mono whitespace-pre-wrap break-all">{val}</span>
                        </div>
                      ) : null
                    )}
                      </div>
                    </div>
                  );
                })
              : rows.slice(0, cardLimit).map((row, i) => {
                  const itemLabel = getItemLabel(i);
                  return (
                    <div key={i}>
                      <div
                        ref={(el) => {
                          sectionRefs.current[`${key}_${i}`] = el;
                        }}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2"
                      >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-white/40 shrink-0 truncate">
                        {itemLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void captureSectionItemScreenshot({
                            key,
                            title: s.title,
                            itemIndex: i,
                            itemLabel,
                            element: <SectionItemEvidenceSheet sectionTitle={s.title} itemLabel={itemLabel} columns={columns} row={row} />,
                          })
                        }
                        data-no-capture="true"
                        className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-bold uppercase tracking-wider text-white/70 disabled:opacity-60"
                        disabled={Boolean(savingKey)}
                        title="Save this card to Evidence Vault — attach to the matching dispute item"
                      >
                        <Camera size={12} className="text-amber-400" />
                        {savingKey === `${key}_${i}` ? 'Saving…' : 'Screenshot'}
                      </button>
                    </div>
                    {columns.map((col, ci) => {
                      const val = (row[ci] ?? '').trim();
                      if (!val) return null;
                      return (
                        <div key={ci} className="flex gap-2">
                          <span className="text-[10px] uppercase tracking-widest text-white/40 shrink-0">{col}:</span>
                          <span className="text-white/80 text-sm font-mono whitespace-pre-wrap break-all">{val}</span>
                        </div>
                      );
                    })}
                      </div>
                    </div>
                  );
                })}
          </div>
          {count > CARD_LIMIT ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAllBySectionKey((cur) => ({ ...cur, [key]: !cur[key] }))}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                title={isExpanded ? 'Show fewer items' : 'Show all items'}
              >
                {isExpanded ? 'Show less' : `Show all (${count})`}
              </button>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div
        ref={(el) => {
          sectionRefs.current[key] = el;
        }}
        className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-widest text-white/40">{s.title}</p>
          {partnerId && (
            <button
              type="button"
              onClick={() => void captureSectionScreenshot({ key, title: s.title })}
              data-no-capture="true"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={Boolean(savingKey)}
              title="Save screenshot to Evidence Vault — included when you download the dispute letter PDF"
            >
              <Camera size={14} className="text-amber-400" />
              {savingKey === key ? 'Saving…' : 'Screenshot'}
            </button>
          )}
        </div>
        {looksLikeBureauMatrixTable && s.table?.rows?.length ? (
          <details className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl p-4 platinum-shimmer fc-platinum-frame">
            <summary className="cursor-pointer select-none flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest text-white/60">
              <span>View bureau matrix (collapsed)</span>
              <span className="text-white/35 font-mono">{s.table.rows.length} rows</span>
            </summary>
            <div className="mt-4 overflow-x-auto pr-1">
              {(() => {
                const cols = s.table!.columns || [];
                const normCols = cols.map((c) => norm(c));
                const expIdx = normCols.findIndex((c) => /\bexperian\b|\bexp\b/.test(c));
                const eqfIdx = normCols.findIndex((c) => /\bequifax\b|\beqf\b/.test(c));
                const tucIdx = normCols.findIndex((c) => /\btransunion\b|\btuc\b/.test(c));
                let fieldIdx = normCols.findIndex((c) => !isBureauCol(c));
                if (fieldIdx < 0) fieldIdx = 0;
                const rows = s.table!.rows.map((r) => ({
                  field: (r[fieldIdx] ?? '').trim() || '—',
                  exp: expIdx >= 0 ? (r[expIdx] ?? '').trim() : undefined,
                  eqf: eqfIdx >= 0 ? (r[eqfIdx] ?? '').trim() : undefined,
                  tuc: tucIdx >= 0 ? (r[tucIdx] ?? '').trim() : undefined,
                }));
                return bureauTableRows(rows);
              })()}
            </div>
            <div className="mt-3 text-[11px] text-white/45">
              Tip: This is “supplemental” provider data. Your main Collections &amp; Charge-offs list above is pulled from Account History and is the one you dispute from.
            </div>
          </details>
        ) : hasStructuredItems ? (
          isCollectionsOrInquiries ? sectionItemsAsCards(s.items!, cardLimit) : sectionItemsAsCards(s.items!)
        ) : s?.rows?.length ? (
          bureauTableRows(
            s.rows.map((r) => {
              const by = r?.byBureau ?? {};
              return { field: r?.label ?? '', exp: by.EXP, eqf: by.EQF, tuc: by.TUC };
            }),
          )
        ) : s?.table?.rows?.length ? (
          ['collections', 'inquiries'].includes(key)
            ? sectionTableAsCards({ columns: s.table!.columns, rows: s.table!.rows, maxCards: cardLimit })
            : genericTable({ columns: s.table!.columns, rows: s.table!.rows })
        ) : null}

        {isCollectionsOrInquiries &&
        !looksLikeBureauMatrixTable &&
        !looksLikeBureauMatrixItems &&
        ((hasStructuredItems && (s.items?.length ?? 0) > CARD_LIMIT) || (hasTableRows && (s.table?.rows?.length ?? 0) > CARD_LIMIT)) ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAllBySectionKey((cur) => ({ ...cur, [key]: !cur[key] }))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              title={isExpanded ? 'Show fewer items' : 'Show all items'}
            >
              {isExpanded ? 'Show less' : `Show all (${hasStructuredItems ? s.items!.length : s.table!.rows.length})`}
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  const diagnosticsText = useMemo(() => {
    const d = parsed.debug;
    if (!d) return 'Diagnostics unavailable.';
    const sections = (d.sectionsFound || [])
      .map((s) => `${s.key}${s.hasRows ? '(rows)' : s.hasTable ? '(table)' : ''}`)
      .join(', ');
    return [
      `provider: ${parsed.provider}`,
      `tables: ${d.tablesFound}`,
      `sub_headers: ${d.subHeadersFound}`,
      `tradelines: ${d.tradelinesParsed}`,
      `scores: ${d.scoresFound}`,
      `sections: ${sections || '—'}`,
    ].join('\n');
  }, [safeParsed.debug, safeParsed.provider]);

  const overviewRows = useMemo(() => {
    return [
      {
        field: 'Tradelines (count)',
        exp: String(safeParsed.tradelines.length),
        eqf: String(safeParsed.tradelines.length),
        tuc: String(safeParsed.tradelines.length),
      },
      {
        field: 'Negative items detected (count)',
        exp: String(disputeCandidates.filter((c) => c.bureau === 'EXP').length),
        eqf: String(disputeCandidates.filter((c) => c.bureau === 'EQF').length),
        tuc: String(disputeCandidates.filter((c) => c.bureau === 'TUC').length),
      },
      {
        field: 'Total balance (detected)',
        exp: toUsd(totals.EXP.balance),
        eqf: toUsd(totals.EQF.balance),
        tuc: toUsd(totals.TUC.balance),
      },
      {
        field: 'Total limit/high credit (detected)',
        exp: toUsd(totals.EXP.limit),
        eqf: toUsd(totals.EQF.limit),
        tuc: toUsd(totals.TUC.limit),
      },
      {
        field: 'Utilization % (estimated)',
        exp: totals.EXP.utilizationPct != null ? `${totals.EXP.utilizationPct}%` : '-',
        eqf: totals.EQF.utilizationPct != null ? `${totals.EQF.utilizationPct}%` : '-',
        tuc: totals.TUC.utilizationPct != null ? `${totals.TUC.utilizationPct}%` : '-',
      },
    ];
  }, [safeParsed.tradelines.length, disputeCandidates, totals]);

  const actionPlan = useMemo(() => {
    const items: string[] = [];
    const anyDerog = disputeCandidates.length > 0;
    const utilVals = [totals.EXP.utilizationPct, totals.EQF.utilizationPct, totals.TUC.utilizationPct].filter(
      (x): x is number => typeof x === 'number',
    );
    const utilAvg = utilVals.length ? Math.round(utilVals.reduce((a, b) => a + b, 0) / utilVals.length) : null;

    if (anyDerog) items.push('Prioritize disputes: address the highest-impact derogatory items first (collections/charge-offs/late codes).');
    if (utilAvg != null) {
      if (utilAvg > 30) items.push('Reduce revolving utilization below 30% (ideal: 1–9%) to improve score optics.');
      else items.push('Maintain utilization in the optimal range (1–9%) and avoid statement spikes.');
    } else {
      items.push('Utilization not detected from this report export; we’ll calculate it once limits/balances are available.');
    }

    items.push('Keep all payments on-time; any new delinquency will reset progress and reduce funding readiness.');
    return items;
  }, [disputeCandidates.length, totals]);

  const paydown = useMemo(() => {
    const amt = Number.isFinite(paydownAmount) ? Math.max(0, paydownAmount) : 0;
    const manualBal = parseMoney(manualBalanceOverride);
    const manualLim = parseMoney(manualLimitOverride);
    const next: Record<Bureau, { newBalance: number | null; newUtilPct: number | null }> = {
      EXP: { newBalance: null, newUtilPct: null },
      EQF: { newBalance: null, newUtilPct: null },
      TUC: { newBalance: null, newUtilPct: null },
    };
    (['EXP', 'EQF', 'TUC'] as const).forEach((b) => {
      const bal = totals[b].balance ?? manualBal;
      const lim = totals[b].limit ?? manualLim;
      if (bal == null || lim == null || lim <= 0) return;
      const newBalance = Math.max(0, bal - amt);
      const newUtilPct = Math.round((newBalance / lim) * 100);
      next[b] = { newBalance, newUtilPct };
    });
    return next;
  }, [paydownAmount, totals, manualBalanceOverride, manualLimitOverride]);

  return (
    <div className="space-y-6">
      {notice && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 text-white/70 text-sm">
          {notice}
        </div>
      )}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <BarChart3 size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Credit Intelligence</span>
            </div>
            <p className="text-white/60 text-sm">
              Provider: <span className="text-white/80 font-mono">{parsed.provider}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className={tabBtn(tab === 'overview')} onClick={() => setTab('overview')}>
              <Layers size={12} className="inline mr-2" /> Overview
            </button>
            <button className={tabBtn(tab === 'pi')} onClick={() => setTab('pi')}>
              <IdCard size={12} className="inline mr-2" /> Personal Info
            </button>
            <button className={tabBtn(tab === 'creditors')} onClick={() => setTab('creditors')}>
              <FileText size={12} className="inline mr-2" /> Creditors
            </button>
            <button className={tabBtn(tab === 'accounts')} onClick={() => setTab('accounts')}>
              <SplitSquareVertical size={12} className="inline mr-2" /> Accounts
            </button>
            <button className={tabBtn(tab === 'collections')} onClick={() => setTab('collections')}>
              <Scale size={12} className="inline mr-2" /> Collections
            </button>
            <button className={tabBtn(tab === 'public_records')} onClick={() => setTab('public_records')}>
              <Gavel size={12} className="inline mr-2" /> Public records
            </button>
            <button className={tabBtn(tab === 'late_payments')} onClick={() => setTab('late_payments')}>
              <ShieldAlert size={12} className="inline mr-2" /> Late payments
            </button>
            <button className={tabBtn(tab === 'negatives')} onClick={() => setTab('negatives')}>
              <ShieldAlert size={12} className="inline mr-2" /> Negatives
            </button>
            <button className={tabBtn(tab === 'inquiries')} onClick={() => setTab('inquiries')}>
              <Search size={12} className="inline mr-2" /> Inquiries
            </button>
            <button className={tabBtn(tab === 'strategy')} onClick={() => setTab('strategy')}>
              <TrendingUp size={12} className="inline mr-2" /> Strategy
            </button>
            <button className={tabBtn(tab === 'disputes')} onClick={() => setTab('disputes')}>
              <Gavel size={12} className="inline mr-2" /> Disputes
            </button>
            <button className={tabBtn(tab === 'education')} onClick={() => setTab('education')}>
              <BookOpen size={12} className="inline mr-2" /> Education
            </button>
            <button className={tabBtn(tab === 'comparison')} onClick={() => setTab('comparison')}>
              <GitCompareArrows size={12} className="inline mr-2" /> Compare
            </button>
            <button className={tabBtn(tab === 'simulation')} onClick={() => setTab('simulation')}>
              <Activity size={12} className="inline mr-2" /> Simulate
            </button>
          </div>
        </div>
      </div>

      {restoreModeOn ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Restore mode</div>
              <div className="mt-2 text-white/80 text-sm">
                Results-first workflow: focus on top negatives, capture clean evidence, then generate your letter.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRestoreModeOn(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                title="Hide Restore Mode strip"
              >
                Hide
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Top issues</div>
              <div className="text-white font-semibold">{candidatePriority.length} negative item{candidatePriority.length === 1 ? '' : 's'}</div>
              <div className="text-white/60 text-sm">
                Collections/charge-offs: <span className="text-white/80">{negativeBuckets.collectionsAndChargeOffs.length}</span> • Late payments:{' '}
                <span className="text-white/80">{negativeBuckets.latePayments.length}</span>
              </div>
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTab('collections')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Review collections <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setTab('negatives')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Review negatives <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Evidence coverage</div>
              <div className="text-white font-semibold">
                {evidenceCoverage.covered}/{evidenceCoverage.total} negatives screenshot-ready
              </div>
              <div className="text-white/60 text-sm">Screenshots make letters faster and stronger.</div>
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFixMissingEvidenceMode((v) => !v)}
                  className={
                    'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ' +
                    (fixMissingEvidenceMode
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-100'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70')
                  }
                  title="Filter dispute candidates to only items missing screenshots"
                >
                  Fix missing evidence
                </button>
                {onOpenEvidenceVault ? (
                  <button
                    type="button"
                    onClick={onOpenEvidenceVault}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  >
                    Open Evidence Vault <ChevronRight size={14} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Next best action</div>
              {nextMissingEvidenceCandidate ? (
                <>
                  <div className="text-white font-semibold truncate">Capture screenshot: {nextMissingEvidenceCandidate.account}</div>
                  <div className="text-white/60 text-sm">
                    We’ll jump you to the right section and auto-scroll to the company name.
                  </div>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const t = (nextMissingEvidenceCandidate.type || '').toLowerCase();
                        const isCol = t.includes('collection') || t.includes('charge');
                        setTab(isCol ? 'collections' : 'accounts');
                        setScrollToAccount(nextMissingEvidenceCandidate.account);
                        setNotice(`Jumped you to ${isCol ? 'Collections' : 'Accounts'} — scroll to "${nextMissingEvidenceCandidate.account}".`);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                    >
                      Capture evidence <ChevronRight size={14} />
                    </button>
                    {onOpenLetterGenerator ? (
                      <button
                        type="button"
                        onClick={onOpenLetterGenerator}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
                      >
                        Open Letters <ChevronRight size={14} />
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-white font-semibold">Evidence looks good</div>
                  <div className="text-white/60 text-sm">Next step is selecting disputes + generating your letter PDF.</div>
                  {onOpenLetterGenerator ? (
                    <button
                      type="button"
                      onClick={onOpenLetterGenerator}
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                    >
                      Open Letters <ChevronRight size={14} />
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setRestoreModeOn(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
          >
            Show Restore Mode
          </button>
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Report summary at a glance — enterprise-style one-line context */}
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Report summary</span>
            <span className="text-white/80 font-mono text-sm">
              {safeParsed.provider} {safeParsed.reportDate ? ` • ${safeParsed.reportDate}` : ''}
            </span>
            <span className="text-white/70 text-sm">
              {safeParsed.tradelines.length} tradeline{safeParsed.tradelines.length !== 1 ? 's' : ''}
            </span>
            <span className="text-white/70 text-sm">{disputeCandidates.length} negative item{disputeCandidates.length !== 1 ? 's' : ''} detected</span>
            {scoreRows.length ? (
              <span className="text-white/70 text-sm">
                Scores: {scoreRows.map((r) => `${r.field} ${[r.exp, r.eqf, r.tuc].filter(Boolean).join('/')}`).join(' • ')}
              </span>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40">3-bureau overview (derived from extracted data)</p>
            {bureauTableRows(overviewRows)}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <button
              type="button"
              className="flex items-center justify-between w-full text-left px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/50"
              onClick={() => setShowDiagnostics((v) => !v)}
            >
              <span>Troubleshooting: report diagnostics (for support)</span>
              <ChevronRight size={14} className={showDiagnostics ? 'rotate-90' : ''} />
            </button>
            {showDiagnostics && (
              <>
                <p className="text-white/60 text-sm">
                  If something is missing, copy this and send to support — it shows whether the HTML contains tables, scores, sections.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(diagnosticsText);
                        setNotice('Copied diagnostics to clipboard.');
                      } catch {
                        setNotice('Copy failed. Select and copy manually.');
                      }
                    }}
                  >
                    Copy
                  </button>
                </div>
                <pre className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-[11px] text-white/70 whitespace-pre-wrap overflow-auto max-h-[280px]">
                  {diagnosticsText}
                </pre>
              </>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-white/40">Scores (best-effort extraction)</p>
              {detectedScoreModels.length ? (
                <div className="flex flex-wrap gap-2">
                  {detectedScoreModels.map((m) => (
                    <span
                      key={m.model}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                        m.family === 'FICO'
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
                          : m.family === 'VantageScore'
                            ? 'border-sky-500/25 bg-sky-500/10 text-sky-200'
                            : 'border-white/10 bg-white/[0.02] text-white/70'
                      }`}
                      title={`Scoring system: ${m.family}`}
                    >
                      {m.family !== 'Other' ? m.family : 'Score'} • {m.model}
                    </span>
                  ))}
                </div>
              ) : null}
              {scoreRows.length ? (
                bureauTableRows(scoreRows)
              ) : (
                <div className="text-white/60 text-sm">
                  No FICO/Vantage score values were detected in this HTML export. (Some providers render scores as images or in a separate
                  summary view.)
                </div>
              )}
              {commonScoreRows.length ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Common score models matrix</p>
                  <p className="text-white/60 text-sm">
                    This does not convert scores — it only shows what this export actually contained. Missing cells usually mean the provider did not include that model in this view.
                  </p>
                  {bureauTableRows(commonScoreRows)}
                </div>
              ) : null}
              {safeParsed.scores?.length ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-[11px] text-white/60">
                  Tip: if you see duplicates, we keep the most specific/confident value per bureau/model. Source text is stored for debugging.
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-white/40">Score models (what they are + who uses them)</p>
              <div className="space-y-3 text-white/70 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-white font-semibold">FICO 8</div>
                  <div className="mt-1 text-white/60">
                    Most commonly used “general lending” model for credit cards/personal loans (varies by lender).
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-white font-semibold">Mortgage classic scores</div>
                  <div className="mt-1 text-white/60">
                    Many mortgage underwrites still use older FICO versions by bureau:
                    <span className="text-white/70"> Equifax FICO 5</span>, <span className="text-white/70">Experian FICO 2</span>,{' '}
                    <span className="text-white/70">TransUnion FICO 4</span>.
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-white font-semibold">VantageScore (3.0 / 4.0)</div>
                  <div className="mt-1 text-white/60">
                    Common in consumer apps/monitoring. Some lenders use it, but many underwriting decisions still reference FICO variants.
                  </div>
                </div>
                <div className="text-[11px] text-white/50">
                  This is educational and not legal/underwriting advice. Lenders can use different models by product, channel, and partner bank.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'pi' && (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
          {(() => {
            const sectionNode = renderSection('personal_information');
            const pi = safeParsed.personalInfo;
            const summaryBits: string[] = [];
            if (pi?.fullName) summaryBits.push(pi.fullName);
            if (pi?.ssnMasked) summaryBits.push(pi.ssnMasked);
            if (pi?.dob) summaryBits.push(`DOB ${pi.dob}`);
            if ((pi?.addresses?.length ?? 0) > 0) summaryBits.push(`${pi!.addresses!.length} address${pi!.addresses!.length === 1 ? '' : 'es'}`);
            if ((pi?.phones?.length ?? 0) > 0) summaryBits.push(`${pi!.phones!.length} phone${pi!.phones!.length === 1 ? '' : 's'}`);
            const summary = summaryBits.join(' · ');
            const hasAny = Boolean(sectionNode) || Boolean(summaryBits.length);

            return (
              <div
                className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden relative platinum-shimmer fc-platinum-frame"
              >
                <button
                  type="button"
                  onClick={() => setPiOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-6 px-6 py-5 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="text-left min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Personal information</p>
                    <p className="mt-2 text-white/80 text-sm font-semibold truncate">
                      {hasAny ? summary || 'Identification details detected' : 'No personal info detected in this export'}
                    </p>
                    <p className="mt-1 text-white/50 text-xs">
                      {hasAny ? 'Click to expand/collapse.' : 'Upload a fuller HTML export for best PI extraction.'}
                    </p>
                  </div>
                  <ChevronDown size={18} className={`text-white/50 transition-transform ${piOpen ? 'rotate-180' : ''}`} />
                </button>

                {piOpen ? (
                  <div className="px-6 pb-6 space-y-4">
                    {summaryBits.length ? (
                      <div className="rounded-xl border border-white/15 bg-black/30 p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Summary</div>
                        <div className="mt-2 text-white/80 text-sm font-mono whitespace-pre-wrap break-words">{summary}</div>
                      </div>
                    ) : null}

                    {sectionNode ? (
                      <div className="space-y-4">{sectionNode}</div>
                    ) : (
                      <p className="text-white/70 text-sm">
                        No structured Personal Information section was detected in this export. Next step is provider-specific PI parsing (names,
                        addresses, employers) from the report’s “Identification” area.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })()}
        </div>
      )}

      {tab === 'creditors' && (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Creditor contacts (best-effort)</p>
          <p className="text-white/60 text-sm">
            {parsed.creditorContacts?.length
              ? 'Structured contacts derived from tradelines and collection sections.'
              : 'This comes from whatever “creditor/subscriber/address/phone” fields exist inside the tradelines. If the export doesn’t include contact details, this list will be sparse.'}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {safeParsed.creditorContacts?.length
              ? safeParsed.creditorContacts.map((c, i) => (
                  <div key={`${c.creditorName}_${i}`} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                    <div className="text-white font-semibold truncate">{c.creditorName}</div>
                    <div className="text-[11px] text-white/70 font-mono space-y-1 whitespace-pre-wrap break-words">
                      {c.accountNumberMasked ? <div>acct: {c.accountNumberMasked}</div> : null}
                      {c.address ? <div>address: {c.address}</div> : null}
                      {c.phone ? <div>phone: {c.phone}</div> : null}
                      {c.bureau ? <div>bureau: {c.bureau}</div> : null}
                      <div className="text-white/50">source: {c.source}</div>
                      {!c.address && !c.phone ? (
                        <div className="text-white/40">No contact details for this entry.</div>
                      ) : null}
                    </div>
                  </div>
                ))
              : creditorContactsDerived.map((c, i) => (
                  <div key={`${c.creditorName}_${i}`} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                    <div className="text-white font-semibold truncate">{c.creditorName}</div>
                    <div className="text-[11px] text-white/70 font-mono space-y-1 whitespace-pre-wrap break-words">
                      {c.subscriber ? <div>subscriber: {c.subscriber}</div> : null}
                      {c.phone ? <div>phone: {c.phone}</div> : null}
                      {c.website ? <div>website: {c.website}</div> : null}
                      {c.address ? <div>address: {c.address}</div> : null}
                      {c.other.map((o, oi) => (
                        <div key={oi}>
                          {o.label}: {o.value}
                        </div>
                      ))}
                      {!c.subscriber && !c.phone && !c.website && !c.address && c.other.length === 0 ? (
                        <div className="text-white/40">No contact fields detected for this tradeline.</div>
                      ) : null}
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {tab === 'accounts' && (
            <ParsedReportViewer
              parsed={safeParsed}
              partnerId={partnerId}
              reportId={reportId}
              scrollToCreditorName={scrollToAccount}
            />
          )}

      {tab === 'collections' && (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-6">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Collections & charge-offs</p>
          {/* From Account History — full account table + 2-year payment history (same layout as Accounts tab) */}
          <p className="text-white/60 text-sm">
            These are collection / charge-off tradelines pulled from Account History. Expand an account to see details and payment history (when available).
          </p>
          {collectionsDisplayTradelines.length > 0 ? (
            <ParsedReportViewer
              parsed={{ ...safeParsed, tradelines: collectionsDisplayTradelines }}
              partnerId={partnerId}
              reportId={reportId}
            />
          ) : (
            <p className="text-white/70 text-sm">
              No collections detected in Account History. Upload a full report export; collection accounts from Account History and report sections will appear here.
            </p>
          )}

          {/* Supplemental: provider “Collections / Public Records” sections when present */}
          {(renderSection('collections') || renderSection('public_records')) && (
            <div className="pt-2 space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40">From report sections (supplemental)</p>
                <p className="mt-2 text-white/60 text-sm">
                  Some provider exports list collections/public records outside Account History. If present, they’ll show here as additional rows/cards.
                </p>
              </div>
              {renderSection('collections')}
              {renderSection('public_records')}
            </div>
          )}
        </div>
      )}

      {tab === 'public_records' && (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-6">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Public records</p>
          <p className="text-white/60 text-sm">
            Public records are extracted from provider report sections when present (bankruptcy, judgments, tax liens, and similar entries). If your report has no public records, we’ll say so explicitly.
          </p>

          {hasPublicRecords ? (
            <>
              {renderSection('public_records')}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-white/60 text-sm">
                Tip: If you believe public records should be present but aren’t showing, try a different provider export (HTML preferred) or re-upload the report.
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-white font-semibold">No public records found</div>
              <div className="mt-2 text-white/60 text-sm">
                We did not detect any public record entries in this report export. If you have a report that includes a Public Records table/section, upload that version for extraction.
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-white font-semibold">Public record dispute candidates</div>
              <button
                type="button"
                onClick={() => (onOpenLetterGenerator ? onOpenLetterGenerator() : setTab('disputes'))}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                Open disputes
              </button>
            </div>
            <div className="mt-3 text-white/60 text-sm">
              {(() => {
                const n = disputeCandidates.filter((c) => c.type === 'Public Record').length;
                return n > 0
                  ? `Detected ${n} public record candidate${n === 1 ? '' : 's'} from the dispute engine.`
                  : 'No public record candidates detected by the dispute engine for this report.';
              })()}
            </div>
          </div>
        </div>
      )}

      {tab === 'late_payments' && (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-6">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Late payments</p>
          <p className="text-white/60 text-sm">
            Late payments are derived from payment status fields and the 2‑year payment history grid (when included in your report export). This tab isolates “late-only” tradelines so you can review them quickly.
          </p>

          {latePaymentTradelines.length > 0 ? (
            <ParsedReportViewer
              parsed={{ ...safeParsed, tradelines: latePaymentTradelines }}
              partnerId={partnerId}
              reportId={reportId}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-white font-semibold">No late-payment tradelines detected</div>
              <div className="mt-2 text-white/60 text-sm">
                If you expect late payments but don’t see them here, upload a full HTML export (preferred). Some providers omit the payment-history grid or compress delinquency codes into text that’s harder to extract.
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-white font-semibold">Late-payment dispute candidates</div>
              <button
                type="button"
                onClick={() => (onOpenLetterGenerator ? onOpenLetterGenerator() : setTab('disputes'))}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                Open disputes
              </button>
            </div>
            <div className="mt-3 text-white/60 text-sm">
              {(() => {
                const n = disputeCandidates.filter((c) => c.type === 'Late Payment').length;
                return n > 0
                  ? `Detected ${n} late-payment candidate${n === 1 ? '' : 's'} from the dispute engine.`
                  : 'No late-payment candidates detected by the dispute engine for this report.';
              })()}
            </div>
          </div>
        </div>
      )}

      {tab === 'negatives' && (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-8">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Disputable negatives (categorized)</p>
          <p className="text-white/60 text-sm">
            Not all negatives are the same. Late payments on an open account are different from a collection/charge-off, and public records are different again.
            This view separates them so your dispute strategy stays precise.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-white font-semibold">Negatives breakdown (from dispute engine)</div>
              <button
                type="button"
                onClick={() => (onOpenLetterGenerator ? onOpenLetterGenerator() : setTab('disputes'))}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                Open disputes
              </button>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(() => {
                const counts = new Map<string, number>();
                for (const c of disputeCandidates) counts.set(c.type, (counts.get(c.type) ?? 0) + 1);
                const rows = [
                  { k: 'Collection', label: 'Collections' },
                  { k: 'Charge-Off', label: 'Charge-offs' },
                  { k: 'Late Payment', label: 'Late payments' },
                  { k: 'Repossession', label: 'Repos' },
                  { k: 'Foreclosure', label: 'Foreclosures' },
                  { k: 'Public Record', label: 'Public records' },
                ];
                return rows.map((r) => (
                  <div key={r.k} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">{r.label}</div>
                    <div className="mt-2 text-2xl font-light text-white">{counts.get(r.k) ?? 0}</div>
                  </div>
                ));
              })()}
            </div>
            <div className="mt-4 text-white/60 text-sm">
              This count is driven by the same engine used to generate dispute candidates. If something is missing, click <strong className="text-white/80">Re-parse</strong> on the report to refresh extraction.
            </div>
          </div>

          {candidatePriority.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white font-semibold">Top priority disputes (ranked)</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">severity 1–100</div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {candidatePriority.slice(0, 8).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      const isCollections = c.type === 'Collection' || c.type === 'Charge-Off';
                      if (isCollections) setTab('collections');
                      else setTab('accounts');
                      setScrollToAccount(c.account);
                    }}
                    className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-4"
                    title="Jump to account"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{c.account}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {c.bureau} • {c.type}
                        </div>
                      </div>
                      <div className="shrink-0 inline-flex items-center px-2 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[10px] font-black uppercase tracking-widest">
                        {c.severity}
                      </div>
                    </div>
                    <div className="mt-2 text-white/60 text-sm space-y-1">
                      {(c.insight?.whyTop ?? []).slice(0, 3).map((w, i) => (
                        <div key={i} className="text-[11px] text-white/65">• {w}</div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInsightsOpenId(c.id);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/75 transition-all"
                        title="Open insights"
                      >
                        Insights <ChevronRight size={14} />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-white/40">
                Tip: severity is explainable (type impact + detected balances/past-due + recency from DOFD/history + cross-bureau inconsistencies).
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Collections/Charge-offs</div>
              <div className="mt-2 text-3xl font-light text-white">{collectionsDisplayTradelines.length}</div>
              <button
                type="button"
                onClick={() => setTab('collections')}
                className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                Open
              </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Late payments</div>
              <div className="mt-2 text-3xl font-light text-white">{latePaymentTradelines.length}</div>
              <button
                type="button"
                onClick={() => setScrollToAccount(latePaymentTradelines[0]?.creditorName ?? null)}
                className="mt-3 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                disabled={latePaymentTradelines.length === 0}
              >
                Jump to first
              </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Public records</div>
              <div className="mt-2 text-3xl font-light text-white">{hasPublicRecords ? publicRecordsCount : 0}</div>
              <div className="mt-3 text-white/60 text-sm">Shown below when present in the export.</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-white font-semibold">Late payment tradelines (from Account History)</div>
            {latePaymentTradelines.length ? (
              <ParsedReportViewer parsed={{ ...safeParsed, tradelines: latePaymentTradelines }} partnerId={partnerId} reportId={reportId} />
            ) : (
              <div className="text-white/60 text-sm">
                No late-payment tradelines detected from the extracted data. This usually means the export doesn’t include payment history and doesn’t label late status in fields.
              </div>
            )}
          </div>

          {renderSection('public_records') && (
            <div className="space-y-4">
              <div className="text-white font-semibold">Public records (from report sections)</div>
              {renderSection('public_records')}
            </div>
          )}
        </div>
      )}

      {tab === 'inquiries' && (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Inquiries</p>
          {renderSection('inquiries') ? (
            <div className="space-y-4">{renderSection('inquiries')}</div>
          ) : (
            <p className="text-white/70 text-sm">
              This provider export did not yield structured Inquiries data in the current extraction pass. Next step is provider-specific inquiry parsing.
            </p>
          )}
        </div>
      )}

      {tab === 'strategy' && (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-6">
          <p className="text-[10px] uppercase tracking-widest text-white/40">AI-guided action plan (Phase 2)</p>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Readiness score</div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-4xl font-light text-white">{intelReadiness.score}</div>
                <div className="text-white/50 text-sm">/ 100</div>
              </div>
              <div className="mt-3 text-white/60 text-sm">
                Higher means your file is more “ready” to execute disputes (identity present, extraction strong, evidence attached).
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTab('disputes')}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  Open disputes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('disputes');
                    setShowEvidenceTables(true);
                  }}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Evidence View
                </button>
                <button
                  type="button"
                  onClick={() => setTab('simulation')}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Simulate
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-2">
              <div className="text-amber-300 font-semibold text-sm">Top blockers</div>
              {intelReadiness.blockers.length ? (
                <ul className="space-y-1 text-white/80 text-sm list-disc pl-4">
                  {intelReadiness.blockers.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/60 text-sm">No major blockers detected from extracted data.</p>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
              <div className="text-emerald-300 font-semibold text-sm">Next actions (recommended)</div>
              {intelReadiness.nextActions.length ? (
                <ul className="space-y-1 text-white/80 text-sm list-disc pl-4">
                  {intelReadiness.nextActions.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/60 text-sm">No next actions needed. (Still monitor utilization and keep positive accounts reporting.)</p>
              )}
            </div>
          </div>

          {/* Phase 2: Score factors */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
              <div className="text-emerald-300 font-semibold text-sm">What&apos;s helping</div>
              {scoreFactors.helping.length ? (
                <ul className="space-y-1 text-white/80 text-sm list-disc pl-4">
                  {scoreFactors.helping.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/50 text-sm">No positive factors detected. Add on-time accounts and keep utilization low to build score.</p>
              )}
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-2">
              <div className="text-amber-300 font-semibold text-sm">What&apos;s hurting</div>
              {scoreFactors.hurting.length ? (
                <ul className="space-y-1 text-white/80 text-sm list-disc pl-4">
                  {scoreFactors.hurting.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/50 text-sm">No major negative factors detected from the extracted data.</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <div className="text-white font-semibold">Next best actions</div>
              <ul className="space-y-2 text-white/70 text-sm list-disc pl-5">
                {disputeCandidates.length > 0 && (
                  <li>Dispute {disputeCandidates.length} negative item{disputeCandidates.length !== 1 ? 's' : ''} — open the Disputes tab to review and draft letters.</li>
                )}
                {actionPlan.slice(0, 4).map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => (onOpenLetterGenerator ? onOpenLetterGenerator() : setTab('disputes'))}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  {onOpenLetterGenerator ? 'Open letter generator' : 'Open disputes'}
                </button>
                <button
                  type="button"
                  onClick={() => setTab('collections')}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Collections
                </button>
                <button
                  type="button"
                  onClick={() => setTab('inquiries')}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Inquiries
                </button>
                <button
                  type="button"
                  onClick={() => setTab('simulation')}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Simulate
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <div className="text-white font-semibold">What we extracted</div>
              <div className="text-[11px] text-white/60">
                {safeParsed.debug ? (
                  <div className="space-y-1 font-mono">
                    <div>tables: {safeParsed.debug.tablesFound}</div>
                    <div>sub_headers: {safeParsed.debug.subHeadersFound}</div>
                    <div>tradelines: {safeParsed.debug.tradelinesParsed}</div>
                    <div>scores: {safeParsed.debug.scoresFound}</div>
                    <div>
                      sections:{' '}
                      {(safeParsed.debug.sectionsFound || [])
                        .map((s) => `${s.key}${s.hasRows ? '(rows)' : s.hasTable ? '(table)' : ''}`)
                        .join(', ') || '—'}
                    </div>
                  </div>
                ) : (
                  <div>Debug unavailable for this report.</div>
                )}
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-[11px] text-white/60">
                If you still see missing sections, it usually means the HTML export is a “shell” that loads data via scripts, or the table labels differ.
                This debug block tells us which it is.
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {(() => {
              const pi = safeParsed.personalInfo as any;
              const hasName = Boolean(String(pi?.fullName || '').trim());
              const hasAddr = Array.isArray(pi?.addresses) ? pi.addresses.length > 0 : Boolean(String(pi?.address1 || '').trim());
              const hasIdentity = hasName && hasAddr;
              const hasNegatives = disputeCandidates.length > 0;
              const evidenceOk = evidenceCoverage.total > 0 ? evidenceCoverage.covered >= evidenceCoverage.total : true;
              const canGenerate = Boolean(onOpenLetterGenerator || onStartDispute);

              const timeline = [
                {
                  id: 'tl_identity',
                  title: 'Confirm identity + mailing details',
                  why: 'Letters must have your name/address. Missing PI also causes report mismatches.',
                  done: hasIdentity,
                  cta: { label: 'Open PI', action: () => setTab('pi') },
                },
                {
                  id: 'tl_evidence',
                  title: 'Capture evidence screenshots (clean)',
                  why: 'Screenshots make disputes faster and strengthen exhibits.',
                  done: evidenceOk,
                  cta: {
                    label: 'Evidence View',
                    action: () => {
                      setTab('disputes');
                      setShowEvidenceTables(true);
                    },
                  },
                },
                {
                  id: 'tl_disputes',
                  title: 'Draft Round 1 disputes',
                  why: 'Start with the highest severity items first.',
                  done: false,
                  cta: { label: 'Open Disputes', action: () => setTab('disputes') },
                },
                {
                  id: 'tl_send',
                  title: 'Export + mail (certified recommended)',
                  why: 'Create a paper trail. Save your exhibits and mailing proof.',
                  done: false,
                  cta: canGenerate
                    ? {
                        label: onOpenLetterGenerator ? 'Open Letters' : 'Start disputes',
                        action: () => (onOpenLetterGenerator ? onOpenLetterGenerator() : setTab('disputes')),
                      }
                    : null,
                },
                {
                  id: 'tl_follow',
                  title: 'Track responses + escalate if needed',
                  why: 'If unresolved: Round 2/3, then regulatory complaints (CFPB/AG) when appropriate.',
                  done: false,
                  cta: { label: 'Open tasks', action: openTasks },
                },
              ];

              const contradictionsTotal = candidatePriority.reduce((sum, c) => sum + (c.insight?.contradictions?.length ?? 0), 0);
              const highSeverity = candidatePriority.filter((c) => (c.severity ?? 0) >= 80).length;
              const evidencePct =
                evidenceCoverage.total > 0 ? Math.round((evidenceCoverage.covered / evidenceCoverage.total) * 100) : null;

              return (
                <>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white font-semibold">Strategy timeline</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">action order</div>
                    </div>
                    <div className="space-y-3">
                      {timeline.map((s, idx) => {
                        const isNext = !s.done && timeline.slice(0, idx).every((x) => x.done);
                        const tone = s.done ? 'border-emerald-500/25 bg-emerald-500/10' : isNext ? 'border-amber-500/25 bg-amber-500/10' : 'border-white/10 bg-black/30';
                        const label = s.done ? 'done' : isNext ? 'next' : 'later';
                        return (
                          <div key={s.id} className={`rounded-2xl border p-4 ${tone}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-white/90 font-semibold">{idx + 1}. {s.title}</div>
                                <div className="mt-1 text-white/60 text-sm">{s.why}</div>
                              </div>
                              <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70">
                                {label}
                              </span>
                            </div>
                            {s.cta ? (
                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={s.cta.action}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/75 transition-all"
                                >
                                  {s.cta.label} <ChevronRight size={14} />
                                </button>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    {!hasNegatives ? (
                      <div className="text-[11px] text-white/50">
                        No negatives detected from extracted data. (This can also mean the export didn’t include Account History.)
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white font-semibold">Litigation readiness (signals)</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">derived</div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Evidence</div>
                        <div className="mt-2 text-white text-lg font-semibold">
                          {evidencePct == null ? '—' : `${evidencePct}%`}
                        </div>
                        <div className="mt-1 text-[11px] text-white/55">Screenshot coverage</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Contradictions</div>
                        <div className="mt-2 text-white text-lg font-semibold">{contradictionsTotal}</div>
                        <div className="mt-1 text-[11px] text-white/55">Cross-bureau mismatches found</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">High severity</div>
                        <div className="mt-2 text-white text-lg font-semibold">{highSeverity}</div>
                        <div className="mt-1 text-[11px] text-white/55">Items severity ≥ 80</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setTab('disputes')}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                      >
                        Open disputes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTab('disputes');
                          setShowEvidenceTables(true);
                        }}
                        className="px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        Evidence View
                      </button>
                      <button
                        type="button"
                        onClick={openEvidence}
                        className="px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        Evidence vault
                      </button>
                    </div>
                    <div className="text-[11px] text-white/45">
                      Educational only — not legal advice. These are signals to help you organize evidence and dispute execution.
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Phase 2: Suggested dispute angles */}
          {disputeCandidates.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <div className="text-white font-semibold">Suggested dispute angles</div>
              <p className="text-white/60 text-sm">Data-driven reasons you can use when disputing. Expand to view; copy to paste into letters.</p>
              <div className="space-y-2">
                {disputeCandidates.slice(0, 5).map((c) => {
                  const reasons = disputeReasonsByCandidateId.get(c.id) ?? [];
                  const isExpanded = expandedStrategyCandidateId === c.id;
                  return (
                    <div key={c.id} className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                        onClick={() => setExpandedStrategyCandidateId(isExpanded ? null : c.id)}
                      >
                        <span className="text-white/90 font-medium truncate">{c.account}</span>
                        <span className="text-[10px] uppercase text-white/40 shrink-0">{c.bureau} · {c.type}</span>
                        {isExpanded ? <ChevronDown size={14} className="text-white/50" /> : <ChevronRight size={14} className="text-white/50" />}
                      </button>
                      {isExpanded && reasons.length > 0 && (
                        <div className="px-4 pb-4 space-y-2">
                          {reasons.map((r) => (
                            <div key={r.id} className="text-white/70 text-sm pl-2 border-l-2 border-white/10">{r.text}</div>
                          ))}
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/[0.05]"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const text = reasons.map((r) => r.text).join('\n\n');
                              try {
                                await navigator.clipboard.writeText(text);
                                setNotice('Copied suggested reasons to clipboard.');
                              } catch {
                                setNotice('Copy failed.');
                              }
                            }}
                          >
                            <Copy size={12} /> Copy reasons
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {disputeCandidates.length > 5 && (
                <p className="text-[11px] text-white/40">Showing first 5 of {disputeCandidates.length}. Open Disputes tab for all with suggested reasons.</p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-[11px] text-white/60">
            Note: Collections/Public Records/Inquiries tabs will automatically populate as we enhance extraction for those sections per provider (no deletions to your existing pipeline).
          </div>
        </div>
      )}

      {tab === 'disputes' && (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Dispute letters — one place</p>
          <p className="text-white/70 text-sm">
            The same items you see in <strong className="text-white/90">Collections</strong> and <strong className="text-white/90">Inquiries</strong> are used for dispute letters. Select items and generate your letter in the <strong className="text-amber-400">Disputes</strong> tab in the toolbar above — no duplicate selection.
          </p>
          {disputeCandidates.length === 0 ? (
            <div className="text-white/60 text-sm">
              No dispute candidates from this report. Upload a report with account history so collections/charge-offs appear in the Collections tab.
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-white/90 text-sm font-medium">{disputeCandidates.length} negative item{disputeCandidates.length !== 1 ? 's' : ''} detected</p>
                {onOpenLetterGenerator && (
                  <>
                    <p className="text-white/60 text-xs mt-1">Use the Disputes tab (toolbar above) to select items, attach evidence, and generate your letter PDF.</p>
                    <button
                      type="button"
                      onClick={onOpenLetterGenerator}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider hover:brightness-110"
                    >
                      <Gavel size={12} /> Open letter generator
                    </button>
                  </>
                )}
                {onStartDispute && !onOpenLetterGenerator && (
                  <p className="text-white/60 text-xs mt-1">Start a dispute below, then go to Dispute Center to build and generate your letter.</p>
                )}
              </div>
              {onStartDispute && (
                <div className="pt-2 space-y-3">
                  {(() => {
                    const groups = new Map<string, typeof restoreDisputeList>();
                    for (const c of restoreDisputeList) groups.set(c.type || 'Other', [...(groups.get(c.type || 'Other') ?? []), c]);
                    const entries = Array.from(groups.entries()).sort((a, b) => {
                      const maxA = Math.max(...a[1].map((x) => x.severity ?? 0), 0);
                      const maxB = Math.max(...b[1].map((x) => x.severity ?? 0), 0);
                      if (maxA !== maxB) return maxB - maxA;
                      return b[1].length - a[1].length;
                    });

                    const missing = Math.max(0, evidenceCoverage.total - evidenceCoverage.covered);

                    return (
                      <>
                        <div className="grid md:grid-cols-4 gap-3">
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                            <div className="text-[10px] uppercase tracking-widest text-white/40">Readiness</div>
                            <div className="mt-2 text-2xl font-light text-white">{intelReadiness.score}/100</div>
                            <div className="mt-2 text-[11px] text-white/55">Derived from extraction + identity + evidence.</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                            <div className="text-[10px] uppercase tracking-widest text-white/40">Negatives</div>
                            <div className="mt-2 text-2xl font-light text-white">{restoreDisputeList.length}</div>
                            <div className="mt-2 text-[11px] text-white/55">Items available to dispute in this report.</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                            <div className="text-[10px] uppercase tracking-widest text-white/40">Evidence coverage</div>
                            <div className="mt-2 text-2xl font-light text-white">
                              {evidenceCoverage.covered}/{evidenceCoverage.total}
                            </div>
                            <div className="mt-2 text-[11px] text-white/55">{missing ? `${missing} missing screenshots.` : 'All screenshot-ready.'}</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                            <div className="text-[10px] uppercase tracking-widest text-white/40">Action</div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowEvidenceTables(true);
                                if (missing > 0) setFixMissingEvidenceMode(true);
                              }}
                              className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                            >
                              <Camera size={12} /> Capture evidence
                            </button>
                            <div className="mt-2 text-[11px] text-white/55">Use Evidence View tables for clean screenshots.</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {entries.map(([type, list]) => {
                            const openByDefault = ['Collection', 'Charge-Off', 'Late Payment', 'Public Record'].includes(type);
                            const title = `${type} (${list.length})`;
                            const maxSeverity = Math.max(...list.map((x) => x.severity ?? 0), 0);

                            return (
                              <details key={type} className="group rounded-2xl border border-white/10 bg-white/[0.02] p-4" open={openByDefault}>
                                <summary className="cursor-pointer select-none list-none flex items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                                  <div className="min-w-0">
                                    <div className="text-white font-semibold truncate">{title}</div>
                                    <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                      max severity {maxSeverity} • {list.filter((c) => hasScreenshotForAccount(c.account)).length}/{list.length} screenshot-ready
                                    </div>
                                  </div>
                                  <ChevronRight size={16} className="text-white/40 transition-transform group-open:rotate-90" />
                                </summary>

                                <div className="mt-4 grid md:grid-cols-2 gap-3">
                                  {list.map((c) => {
                                    const reasons = disputeReasonsByCandidateId.get(c.id) ?? [];
                                    const hasShot = hasScreenshotForAccount(c.account);
                                    return (
                                      <div
                                        key={c.id}
                                        className="rounded-xl border border-white/10 bg-black/30 p-4 flex items-start justify-between gap-3"
                                      >
                                        <div className="min-w-0">
                                          <p className="text-white font-semibold truncate">{c.account}</p>
                                          <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                            {c.bureau} · {c.type}
                                          </p>
                                          {(c.insight?.whyTop ?? []).length ? (
                                            <div className="mt-2 text-[11px] text-white/60 space-y-1">
                                              {(c.insight.whyTop ?? []).slice(0, 2).map((w, i) => (
                                                <div key={i}>• {w}</div>
                                              ))}
                                            </div>
                                          ) : null}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[10px] font-black uppercase tracking-widest">
                                            {c.severity}
                                          </span>
                                          <span
                                            className={
                                              'inline-flex items-center px-2 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ' +
                                              (hasShot
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100/90'
                                                : 'border-red-500/30 bg-red-500/10 text-red-100/90')
                                            }
                                            title={hasShot ? 'Screenshot exists for this company' : 'No screenshot found yet for this company'}
                                          >
                                            {hasShot ? 'evidence ok' : 'needs evidence'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => setInsightsOpenId(c.id)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-white/80 hover:bg-white/[0.05]"
                                            title="Open insights"
                                          >
                                            Insights <ChevronRight size={12} />
                                          </button>
                                          {!hasShot ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const t = (c.type || '').toLowerCase();
                                                const isCol = t.includes('collection') || t.includes('charge');
                                                setTab(isCol ? 'collections' : 'accounts');
                                                setScrollToAccount(c.account);
                                                setNotice(
                                                  `Jumped you to ${isCol ? 'Collections' : 'Accounts'} — scroll to "${c.account}" and capture a screenshot.`
                                                );
                                              }}
                                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-black/40 text-[10px] font-black uppercase tracking-widest text-white/80 hover:bg-white/[0.05]"
                                              title="Jump to the best section for capturing evidence"
                                            >
                                              <Camera size={12} /> Capture
                                            </button>
                                          ) : null}
                                          <button
                                            type="button"
                                            onClick={() => onStartDispute(c, reasons.map((r) => r.text))}
                                            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider hover:brightness-110"
                                          >
                                            <Gavel size={12} /> Start dispute
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </details>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="pt-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-colors text-left"
                    onClick={() => setShowEvidenceTables((v) => !v)}
                  >
                    <div className="min-w-0">
                      <div className="text-white font-semibold">Evidence View tables (screenshot-safe)</div>
                      <div className="mt-1 text-white/60 text-sm">
                        Full, compartmentalized tables per category. Copy as TSV/CSV or save a clean screenshot into the Evidence Vault.
                      </div>
                    </div>
                    <ChevronRight size={16} className={showEvidenceTables ? 'rotate-90 text-white/70' : 'text-white/40'} />
                  </button>

                  {showEvidenceTables && (
                    <div className="space-y-4">
                      {(() => {
                        const groups = new Map<string, typeof candidatePriority>();
                        for (const c of candidatePriority) {
                          const k = c.type || 'Other';
                          groups.set(k, [...(groups.get(k) ?? []), c]);
                        }
                        const entries = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
                        const columns = [
                          'Severity',
                          'Bureau',
                          'Type',
                          'Account',
                          'Status',
                          'Code',
                          'DOFD',
                          'Balance',
                          'PastDue',
                          'Contradictions',
                          'EvidenceNeeds',
                        ];

                        const fmtMoney = (n: number | null | undefined) => (n == null ? '' : `$${Math.round(n).toLocaleString()}`);
                        const safeCell = (v: any) => `${v ?? ''}`.trim();
                        const mkKey = (t: string) => `evidence_table_${(t || 'other').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

                        return entries.map(([type, list]) => {
                          const rows = list.map((c) => {
                            const facts = c.insight?.keyFacts ?? {};
                            const contrad = (c.insight?.contradictions ?? []).slice(0, 6).join(' | ');
                            const needs = (c.insight?.evidenceChecklist ?? []).map((x) => x.title).slice(0, 6).join(' | ');
                            return [
                              c.severity,
                              safeCell(c.bureau),
                              safeCell(c.type),
                              safeCell(c.account),
                              safeCell(c.status),
                              safeCell(c.code),
                              safeCell((facts as any).dofd),
                              fmtMoney((facts as any).balance),
                              fmtMoney((facts as any).pastDue),
                              contrad,
                              needs,
                            ];
                          });

                          const tableKey = mkKey(type);
                          const title = `Evidence View: ${type} (${list.length})`;
                          const safeFilenameBase = `Evidence_View_${(type || 'other')
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '_')
                            .replace(/^_+|_+$/g, '')}_${new Date().toISOString().slice(0, 10)}`;

                          return (
                            <details key={type} className="group rounded-2xl border border-white/10 bg-black/30 p-4">
                              <summary className="cursor-pointer select-none list-none flex items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
                                <div className="min-w-0">
                                  <div className="text-white font-semibold truncate">{title}</div>
                                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                    {list.length} row{list.length !== 1 ? 's' : ''} • stable columns • screenshot-safe
                                  </div>
                                </div>
                                <ChevronRight size={16} className="text-white/40 transition-transform group-open:rotate-90" />
                              </summary>

                              <div className="mt-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                    Export / capture
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(toTsv({ columns, rows }));
                                          setNotice(`Copied TSV: ${type}`);
                                        } catch {
                                          setNotice('Copy failed.');
                                        }
                                      }}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/75 transition-all"
                                    >
                                      <Copy size={12} /> Copy TSV
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        downloadText({
                                          text: toTsv({ columns, rows }),
                                          filename: `${safeFilenameBase}.tsv`,
                                          mimeType: 'text/tab-separated-values;charset=utf-8',
                                        });
                                      }}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/75 transition-all"
                                    >
                                      <FileText size={12} /> TSV
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(toCsv({ columns, rows }));
                                          setNotice(`Copied CSV: ${type}`);
                                        } catch {
                                          setNotice('Copy failed.');
                                        }
                                      }}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/75 transition-all"
                                    >
                                      <Copy size={12} /> Copy CSV
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        downloadText({
                                          text: toCsv({ columns, rows }),
                                          filename: `${safeFilenameBase}.csv`,
                                          mimeType: 'text/csv;charset=utf-8',
                                        });
                                      }}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/75 transition-all"
                                    >
                                      <FileText size={12} /> CSV
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void captureSectionScreenshot({ key: tableKey, title })}
                                      disabled={Boolean(savingKey)}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
                                    >
                                      <Camera size={12} /> {savingKey === tableKey ? 'Saving…' : 'Screenshot'}
                                    </button>
                                  </div>
                                </div>

                                <div
                                  ref={(el) => {
                                    sectionRefs.current[tableKey] = el;
                                  }}
                                  className="rounded-2xl border border-black/10 bg-white text-black p-4"
                                >
                                  <table className="w-full text-left text-[11px] border-separate border-spacing-0">
                                    <thead>
                                      <tr className="text-[10px] uppercase tracking-widest text-black/60">
                                        {columns.map((c) => (
                                          <th key={c} className="py-2 pr-3 bg-white">
                                            {c}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rows.map((r, ri) => (
                                        <tr key={ri} className="border-t border-black/10 align-top">
                                          {r.map((cell, ci) => (
                                            <td key={ci} className="py-2 pr-3 font-mono whitespace-pre-wrap break-words align-top">
                                              {safeCell(cell)}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </details>
                          );
                        });
                      })()}
                      <div className="text-[11px] text-white/40">
                        Tip: These tables are designed for evidence capture. Save screenshots here, then attach them to dispute items inside the letter generator.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'education' && (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-6">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Tools & education</p>
          <p className="text-white/80 text-sm">
            Here’s the kind of knowledge that makes the rest of this app make sense. Use it to stay clear on how disputes work and how to use your report and letters.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <div className="text-amber-400 font-semibold text-sm">Dispute rounds: what actually changes</div>
              <p className="text-white/70 text-sm">
                Round 1 is your first formal dispute: the bureau contacts the furnisher and has 30 days to investigate. Round 2 and 3 are follow-ups—often with a slightly different angle or additional evidence. Many items get corrected or removed in Round 1; others need persistence. We structure your letters so each round is clear and professional.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <div className="text-amber-400 font-semibold text-sm">Utilization: why it matters</div>
              <p className="text-white/70 text-sm">
                Revolving utilization is the ratio of your balance to your limit. High utilization (especially over 30%) can hurt your score even if you pay in full later—because the score often uses the balance that was reported on your statement date. Paying before the statement closes, or spreading balances across cards, can keep reported utilization in a better range (ideally 1–9%).
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
            <div className="text-amber-400 font-semibold text-sm">Your dispute letter: what we generate</div>
            <p className="text-white/70 text-sm">
              Each bureau letter we build for you follows a forensic-style template: your name and address at the top, the bureau’s dispute address, a clear subject line (e.g. NOTICE OF FACTUAL AUDIT & DISPUTE PURSUANT TO 15 U.S.C. § 1681i), an opening that states you’re disputing inaccurate reporting and requesting reinvestigation, then each disputed item with furnisher name, account identifier (last 4 or [DATA_NOT_READABLE] if we can’t read it), any balance/dates we have, your evidence exhibits, a short dispute statement, and bullet-point reasons. We never guess at data we can’t read—we mark it so your letter stays credible. You can add or edit text and export to PDF before mailing.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
            <div className="text-amber-400 font-semibold text-sm">Funding readiness: personal vs business</div>
            <p className="text-white/70 text-sm">
              Cleaning up personal credit first (disputes, utilization, on-time history) usually sets you up better before chasing business credit or funding. Lenders often look at the person behind the business. Once your personal file is in good shape, building business tradelines and keeping business utilization low follows the same principles: accuracy, consistency, and proof.
            </p>
          </div>

          <p className="text-[11px] text-white/50">
            This is educational only and not legal or credit advice. Your situation may require professional guidance.
          </p>
        </div>
      )}

      {tab === 'comparison' && (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Comparison mode</p>
          {!availableReports?.some((r) => r.parsed) ? (
            <p className="text-white/70 text-sm">No other parsed reports available to compare.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Compare this report against</label>
                  <select
                    value={compareOther?.id || ''}
                    onChange={(e) => setCompareId(e.target.value)}
                    className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    {(availableReports ?? [])
                      .filter((r) => r.parsed && r.id !== reportId)
                      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {new Date(r.receivedAt).toLocaleString()} — {r.filename}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="text-[11px] text-white/50">
                  Comparing to: <span className="text-white/70 font-mono">{compareOther?.filename || '—'}</span>
                </div>
              </div>

              {compareSummary ? (
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                    <div className="text-white font-semibold">Tradelines changed</div>
                    <div className="text-white/70 text-sm">
                      Added: <span className="text-white font-mono">{compareSummary.added}</span> • Removed:{' '}
                      <span className="text-white font-mono">{compareSummary.removed}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                    <div className="text-white font-semibold">Score changes</div>
                    {compareSummary.scoreChanges.length ? (
                      <div className="space-y-2">
                        {compareSummary.scoreChanges.slice(0, 12).map((s) => (
                          <div key={s.key} className="text-[11px] text-white/70 font-mono flex items-center justify-between gap-3">
                            <div className="truncate">{s.key}</div>
                            <div className="shrink-0">
                              {s.before ?? '—'} → {s.after ?? '—'}{' '}
                              {typeof s.delta === 'number' ? (
                                <span className={s.delta >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                                  ({s.delta >= 0 ? '+' : ''}
                                  {s.delta})
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-white/50 text-sm">No score rows available in either report.</div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-white/70 text-sm">Pick another report to compare.</p>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'simulation' && (
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-6">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Predictive simulation (derived)</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Simulate pay-down amount</label>
                <input
                  type="number"
                  value={paydownAmount}
                  onChange={(e) => setPaydownAmount(Number(e.target.value))}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="1000"
                  min={0}
                />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Manual fallback (if report didn’t extract)</p>
                <input
                  type="text"
                  value={manualBalanceOverride}
                  onChange={(e) => setManualBalanceOverride(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder:text-white/30"
                  placeholder="Total balance (e.g. 15000)"
                />
                <input
                  type="text"
                  value={manualLimitOverride}
                  onChange={(e) => setManualLimitOverride(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder:text-white/30"
                  placeholder="Total limit (e.g. 25000)"
                />
                <p className="text-[11px] text-white/50">Used when detected totals show “-”. Leave blank if report already has balance/limit.</p>
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-[10px] uppercase tracking-widest text-white/40">Estimated utilization after pay-down</p>
              <div className="mt-4">
                {bureauTableRows([
                  {
                    field: 'New balance (estimated)',
                    exp: toUsd(paydown.EXP.newBalance),
                    eqf: toUsd(paydown.EQF.newBalance),
                    tuc: toUsd(paydown.TUC.newBalance),
                  },
                  {
                    field: 'New utilization % (estimated)',
                    exp: paydown.EXP.newUtilPct != null ? `${paydown.EXP.newUtilPct}%` : '-',
                    eqf: paydown.EQF.newUtilPct != null ? `${paydown.EQF.newUtilPct}%` : '-',
                    tuc: paydown.TUC.newUtilPct != null ? `${paydown.TUC.newUtilPct}%` : '-',
                  },
                ])}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeInsight && (
        <div className="fixed inset-0 z-[999] p-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setInsightsOpenId(null)} />
          <div
            className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0d1512] shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Insights drawer</div>
                <div className="mt-2 text-2xl font-light text-white truncate">{activeInsight.account}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  {activeInsight.bureau} • {activeInsight.type} • severity {activeInsight.severity}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInsightsOpenId(null)}
                className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                <div className="text-white font-semibold">Why this is ranked high</div>
                <ul className="mt-2 text-white/70 text-sm list-disc pl-5 space-y-1">
                  {(activeInsight.insight?.whyTop ?? []).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                <div className="text-white font-semibold">Key facts (detected)</div>
                {(() => {
                  const f = activeInsight.insight?.keyFacts ?? {};
                  const rows: { k: string; v: string }[] = [
                    { k: 'Account type', v: safe(f.accountType) },
                    { k: 'Account status', v: safe(f.accountStatus) },
                    { k: 'Date opened', v: safe(f.dateOpened) },
                    { k: 'Date closed', v: safe(f.dateClosed) },
                    { k: 'DOFD', v: safe(f.dofd) },
                    { k: 'Balance', v: toUsdShort(f.balance ?? null) },
                    { k: 'Past due', v: toUsdShort(f.pastDue ?? null) },
                    { k: 'Limit', v: toUsdShort(f.creditLimit ?? null) },
                    { k: 'High bal', v: toUsdShort(f.highBalance ?? null) },
                    { k: 'Derog (24mo)', v: safe(f.recentDerogCount24) },
                    { k: 'Derog (6mo)', v: safe(f.recentDerogCount6) },
                  ];
                  return (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rows.map((r) => (
                        <div key={r.k} className="rounded-xl border border-white/10 bg-black/30 p-3">
                          <div className="text-[9px] uppercase tracking-widest text-white/40">{r.k}</div>
                          <div className="mt-1 text-white/80 font-mono text-sm break-words">{r.v}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                <div className="text-white font-semibold">Contradictions / dispute angles</div>
                {(activeInsight.insight?.contradictions ?? []).length ? (
                  <ul className="text-white/70 text-sm list-disc pl-5 space-y-1">
                    {(activeInsight.insight?.contradictions ?? []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-white/60 text-sm">
                    No explicit contradictions detected from the parsed fields. (Still disputable if inaccurate/unverifiable.)
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white font-semibold">Evidence checklist</div>
                  <button
                    type="button"
                    onClick={openEvidence}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                  >
                    Upload evidence now
                  </button>
                </div>
                <div className="space-y-2">
                  {(activeInsight.insight?.evidenceChecklist ?? []).map((ev) => (
                    <div key={ev.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <div className="text-white/85 font-semibold text-sm">{ev.title}</div>
                      <div className="mt-1 text-white/60 text-sm">{ev.why}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  type="button"
                  onClick={openTasks}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Open tasks
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInsightsOpenId(null);
                    if (onOpenLetterGenerator) onOpenLetterGenerator();
                    else setTab('disputes');
                  }}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
                >
                  Open disputes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

