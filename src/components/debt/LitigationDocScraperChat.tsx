import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, Loader2, Sparkles, Upload } from 'lucide-react';
import type { DebtCase } from '../../domain/debt';
import { upsertDebt } from '../../data/debtRepo';
import { listReportsByPartner } from '../../data/reportsRepo';
import {
  debtPatchFromLitigationScrape,
  enrichLitigationScrapeFromCreditReports,
  mergeEmptyDebtFieldsFromScrape,
  scrapeLitigationDocument,
  type LitigationScrapeResult,
  type ScrapedLitigationField,
} from '../../lib/ocr/litigationDocScraper';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowKpi,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type ChatLine = { role: 'system' | 'user' | 'assistant'; text: string };

function confidenceTone(c: ScrapedLitigationField['confidence']): 'ok' | 'warn' | 'blocked' {
  if (c === 'high') return 'ok';
  if (c === 'medium') return 'warn';
  return 'blocked';
}

function parseLooseDate(raw: string): string | undefined {
  const s = String(raw || '').trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const mm = m[1]!.padStart(2, '0');
    const dd = m[2]!.padStart(2, '0');
    let yyyy = m[3]!;
    if (yyyy.length === 2) yyyy = `20${yyyy}`;
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return undefined;
}

function amountToCents(raw?: string): number | undefined {
  if (!raw) return undefined;
  const n = Number(String(raw).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 100);
}

/**
 * Unified Litigation Command intake: one cinematic drag-drop + chat unit.
 * Drop PDF / image / HTML → scrape → explain fields → Apply fills empty case fields
 * (court, validation recipient, firm address, amounts, account, etc.).
 */
export function LitigationDocScraperChat({
  debt,
  partnerId,
  onDebtChange,
  onScrapeApplied,
  onScrapeComplete,
  defaultHearingIso,
  reports: reportsProp,
  autoApplyOnHighConfidence = false,
}: {
  debt: DebtCase | null;
  partnerId: string;
  onDebtChange: (d: DebtCase) => void;
  /** Fires after Apply fills empty case fields (pipeline advances here). */
  onScrapeApplied?: (result: LitigationScrapeResult) => void;
  /** Fires when scrape finishes (before Apply). */
  onScrapeComplete?: (result: LitigationScrapeResult) => void;
  defaultHearingIso?: string;
  reports?: Array<{ id?: string; parsed?: { tradelines?: Array<Record<string, unknown>>; creditorContacts?: Array<Record<string, unknown>> } | null }>;
  /** When most fields are high/medium confidence, auto-Apply so first-timers do not stall. */
  autoApplyOnHighConfidence?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<LitigationScrapeResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [chat, setChat] = useState<ChatLine[]>([
    {
      role: 'assistant',
      text: 'Drop any summons, docket, complaint, affidavit, collector letter, HTML report, or image here. I scrape every accessible field (case #, court, plaintiff, firm, mailing address, counsel, bar #, amounts, hearing, account, original creditor), explain each one, then Apply fills only empty fields on your debt / litigation case — Court + Validation panels update together.',
    },
  ]);

  const reports = useMemo(
    () => reportsProp ?? (partnerId ? listReportsByPartner(partnerId) : []),
    [reportsProp, partnerId],
  );
  const fieldRows = useMemo(() => result?.fields ?? [], [result]);

  const explainField = (f: ScrapedLitigationField) => {
    setChat((prev) => [
      ...prev,
      { role: 'user', text: `Explain ${f.label}` },
      {
        role: 'assistant',
        text: `${f.label}: “${f.value}”\nConfidence: ${f.confidence}${f.sourceHint ? ` · Source: ${f.sourceHint}` : ''}\n\nWhat this means:\n${f.meaning}\n\nWhere it goes: Apply maps this into the matching debt/litigation field (recipient, firm address, court case #, hearing, account, original creditor, etc.) without overwriting values you already confirmed.`,
      },
    ]);
  };

  const applyScrape = (scraped: LitigationScrapeResult, opts?: { auto?: boolean }) => {
    if (!partnerId) return;
    const patch = debtPatchFromLitigationScrape(scraped.entities);
    const hearingIso = parseLooseDate(patch.hearingDate || '') || defaultHearingIso;
    const amountCents = amountToCents(patch.amountClaimed);
    const base: DebtCase =
      debt ||
      ({
        id: '',
        partnerId,
        type: 'summons',
        name: patch.name || 'Court matter',
        amountCents: amountCents || 0,
        status: 'in_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as DebtCase);

    const merged = mergeEmptyDebtFieldsFromScrape(
      {
        ...base,
        partnerId,
        type: base.type === 'debt' && scraped.docKind !== 'collector_letter' ? 'summons' : base.type,
        hearingDate: parseLooseDate(String(base.hearingDate || '')) || hearingIso || base.hearingDate,
        dateServed: parseLooseDate(String(base.dateServed || '')) || parseLooseDate(patch.dateServed || '') || base.dateServed,
        source: 'document' as const,
        notes: [base.notes, `Litigation scrape: ${scraped.filename} (${scraped.docKind}).`].filter(Boolean).join('\n'),
      },
      { ...patch, hearingDate: hearingIso || patch.hearingDate, dateServed: parseLooseDate(patch.dateServed || '') || patch.dateServed },
      amountCents,
    );

    const next = upsertDebt(merged as DebtCase);
    onDebtChange(next);

    const filled = [
      next.courtCaseNumber && 'case #',
      next.plaintiffLawFirm && 'firm',
      next.plaintiffLawFirmAddress && 'firm address',
      next.plaintiffAttorneyName && 'attorney',
      next.recipientName && 'recipient',
      next.hearingDate && 'hearing',
      next.amountCents > 0 && 'amount',
      next.accountNumberMasked && 'account',
      next.originalCreditor && 'original creditor',
      next.name && 'plaintiff name',
    ].filter(Boolean);

    setNotice(
      `${opts?.auto ? 'Auto-applied' : 'Applied'} ${filled.length} field groups — every empty Court / Validation field filled. Confirm parties next.`,
    );
    setChatOpen(false);
    setChat((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: `${opts?.auto ? 'Auto-applied' : 'Applied'} scrape to “${next.name}”.\nCourt: ${(next as any).courtName || '—'}\nCase #: ${next.courtCaseNumber || '—'}\nHearing: ${next.hearingDate || '—'}\nFirm: ${next.plaintiffLawFirm || '—'}\nFirm address: ${next.plaintiffLawFirmAddress || next.recipientAddress || '—'}\nAttorney: ${next.plaintiffAttorneyName || '—'}\nRecipient: ${next.recipientName || '—'}\nAccount: ${next.accountNumberMasked || '—'}\nOriginal creditor: ${next.originalCreditor || '—'}\nAmount: ${next.amountCents ? `$${(next.amountCents / 100).toFixed(2)}` : '—'}\n\nNext: confirm parties (Step 2), then one-tap Build written answer. Regenerating letters will use these filled fields.`,
      },
    ]);
    onScrapeApplied?.(scraped);
  };

  const runFile = async (file: File) => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    setProgress('Starting scrape…');
    setChatOpen(true);
    setChat((prev) => [...prev, { role: 'user', text: `Uploaded ${file.name}` }]);
    try {
      let scraped = await scrapeLitigationDocument(file, {
        maxOcrPages: 12,
        onProgress: (msg) => setProgress(msg),
      });
      if (reports.length) {
        setProgress('Enriching from credit reports…');
        scraped = enrichLitigationScrapeFromCreditReports(scraped, reports);
      }
      setResult(scraped);
      onScrapeComplete?.(scraped);
      const lines = scraped.fields.length
        ? scraped.fields.map((f) => `• ${f.label}: ${f.value} (${f.confidence})`).join('\n')
        : 'Few structured fields found — review the document caption manually, then type missing facts into the parties panel.';
      const usable = scraped.fields.filter((f) => f.confidence === 'high' || f.confidence === 'medium');
      const hasCore =
        Boolean(scraped.entities.caseNumber || scraped.entities.plaintiffName || scraped.entities.address) &&
        usable.length >= 2;
      const shouldAuto =
        autoApplyOnHighConfidence && partnerId && (usable.length >= 2 || hasCore) && scraped.fields.length > 0;
      setChat((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `${scraped.summary}\n\n${lines}\n\n${scraped.nextActions
            .slice(0, 4)
            .map((a, i) => `${i + 1}. ${a}`)
            .join('\n')}\n\n${
            shouldAuto
              ? 'High-confidence scrape — auto-applying empty fields now. You can still edit anything on Step 2.'
              : 'Tap Apply to case — empty Court / Validation fields fill dynamically (never overwrites what you already confirmed).'
          }\n\n${scraped.compliance}`,
        },
      ]);
      if (shouldAuto) {
        setProgress('Auto-applying empty fields…');
        applyScrape(scraped, { auto: true });
      }
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'Scrape failed.';
      setErr(msg);
      setChat((prev) => [...prev, { role: 'assistant', text: `Could not scrape that file: ${msg}` }]);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const applyToCase = () => {
    if (!result || !partnerId) return;
    applyScrape(result);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void runFile(f);
  };

  return (
    <div className={`${finelyOsCatalogCardCompact('fuchsia')} space-y-3 overflow-hidden relative`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 10% 0%, rgba(232,121,249,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(251,191,36,0.14), transparent 50%)',
        }}
      />
      <div className="relative space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-200/90`}>
              <FileSearch size={14} /> Upload · Scrape · Chat · Apply
            </div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              One unit for Litigation Command — dockets, summons, affidavits, HTML reports, and images. Credit-report tradelines enrich empty account / original-creditor fields when they match.
            </p>
          </div>
          <span className={finelyOsStatusChip(result ? 'ok' : 'warn')}>
            {result ? `${result.docKind.replace('_', ' ')} · ${result.fields.length} fields` : 'Drop a file'}
          </span>
        </div>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !busy && inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-amber-400/70 bg-amber-500/15'
              : 'border-fuchsia-400/35 bg-black/35 hover:border-fuchsia-300/55 hover:bg-fuchsia-500/10'
          }`}
        >
          <div className="inline-flex items-center justify-center gap-2 text-amber-100 font-semibold text-sm">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {busy ? progress || 'Scraping…' : 'Drag & drop PDF, image, or HTML — or click to browse'}
          </div>
          <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Accepts court PDFs, screenshots, and credit-report HTML. OCR runs when native text is sparse.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/*,.html,.htm,.txt,text/html"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void runFile(f);
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {result ? (
            <button
              type="button"
              disabled={!partnerId || busy}
              onClick={applyToCase}
              className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
            >
              <Sparkles size={16} /> Apply to case — fill ALL empty fields
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
            >
              <Upload size={16} /> Choose file to scrape
            </button>
          )}
          {result ? (
            <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={FINELY_OS_SECONDARY_BTN}>
              Drop another file
            </button>
          ) : null}
          {reports.length ? (
            <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{reports.length} credit report(s) for enrichment</span>
          ) : null}
        </div>

        {progress ? <div className="text-[11px] text-fuchsia-100/80">{progress}</div> : null}
        {notice ? (
          <div className="rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-100">
            {notice}
          </div>
        ) : null}
        {err ? <div className="text-[11px] text-rose-200/90">{err}</div> : null}

        {fieldRows.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
            {fieldRows.map((f) => (
              <button
                key={f.key + f.value}
                type="button"
                onClick={() => explainField(f)}
                className={`${finelyOsGlowKpi('fuchsia')} !p-3 text-left`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>{f.label}</div>
                  <span className={finelyOsStatusChip(confidenceTone(f.confidence))}>{f.confidence}</span>
                </div>
                <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE} line-clamp-2`}>{f.value}</div>
                <div className={`mt-1 text-[10px] ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{f.meaning}</div>
              </button>
            ))}
          </div>
        ) : null}

        {result?.routes?.length ? (
          <div className="flex flex-wrap gap-2">
            {result.routes.map((r) => (
              <Link
                key={r.id}
                to={r.path}
                className={`${FINELY_OS_SECONDARY_BTN} !text-[11px] ${r.priority === 'urgent' ? '!border-amber-400/40 !text-amber-100' : ''}`}
              >
                {r.label}
              </Link>
            ))}
          </div>
        ) : null}

        <details
          open={chatOpen}
          onToggle={(e) => setChatOpen((e.target as HTMLDetailsElement).open)}
          className="rounded-xl border border-white/10 bg-black/35"
        >
          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-white/80">
            Scrape chat ({chat.length} lines) — tap a field chip above to explain
          </summary>
          <div className="max-h-[200px] overflow-y-auto space-y-2 p-3 pt-0">
            {chat.map((line, i) => (
              <div
                key={i}
                className={`text-xs whitespace-pre-wrap ${line.role === 'user' ? 'text-sky-100/90' : FINELY_OS_ENTITY_BODY}`}
              >
                <span className="text-[10px] uppercase tracking-widest text-white/40 mr-2">
                  {line.role === 'user' ? 'You' : 'Scraper'}
                </span>
                {line.text}
              </div>
            ))}
          </div>
        </details>
        <p className="text-[9px] text-white/35">Educational · not legal advice · verify against your paper file · results vary</p>
      </div>
    </div>
  );
}
