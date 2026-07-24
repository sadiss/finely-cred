import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, Loader2, Sparkles, Upload } from 'lucide-react';
import type { DebtCase } from '../../domain/debt';
import { upsertDebt } from '../../data/debtRepo';
import {
  debtPatchFromLitigationScrape,
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

export function LitigationDocScraperChat({
  debt,
  partnerId,
  onDebtChange,
  onScrapeApplied,
  defaultHearingIso,
}: {
  debt: DebtCase | null;
  partnerId: string;
  onDebtChange: (d: DebtCase) => void;
  onScrapeApplied?: (result: LitigationScrapeResult) => void;
  defaultHearingIso?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<LitigationScrapeResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatLine[]>([
    {
      role: 'assistant',
      text: 'Upload a summons, complaint, affidavit, or docket PDF. I will scrape case #, court, plaintiff, counsel, amounts, service and hearing dates — then explain each field and route you to the right defense step.',
    },
  ]);

  const fieldRows = useMemo(() => result?.fields ?? [], [result]);

  const explainField = (f: ScrapedLitigationField) => {
    setChat((prev) => [
      ...prev,
      { role: 'user', text: `Explain ${f.label}` },
      {
        role: 'assistant',
        text: `${f.label}: “${f.value}” (${f.confidence} confidence${f.sourceHint ? ` · ${f.sourceHint}` : ''}).\n\nWhat this means: ${f.meaning}\n\nSuggested next: apply fields to your debt case, then open the Litigation stage that matches this document.`,
      },
    ]);
  };

  const runFile = async (file: File) => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    setProgress('Starting scrape…');
    setChat((prev) => [...prev, { role: 'user', text: `Uploaded ${file.name}` }]);
    try {
      const scraped = await scrapeLitigationDocument(file, {
        maxOcrPages: 10,
        onProgress: (msg) => setProgress(msg),
      });
      setResult(scraped);
      onScrapeApplied?.(scraped);
      const lines = scraped.fields.length
        ? scraped.fields.map((f) => `• ${f.label}: ${f.value} (${f.confidence})`).join('\n')
        : 'Few structured fields found — review the PDF caption manually.';
      setChat((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `${scraped.summary}\n\n${lines}\n\n${scraped.nextActions.slice(0, 3).map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n${scraped.compliance}`,
        },
      ]);
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
    const patch = debtPatchFromLitigationScrape(result.entities);
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

    const next = upsertDebt({
      ...base,
      partnerId,
      type: base.type === 'debt' && result.docKind !== 'collector_letter' ? 'summons' : base.type,
      name: patch.name || base.name,
      amountCents: amountCents && amountCents > 0 ? amountCents : base.amountCents,
      courtCaseNumber: patch.courtCaseNumber || base.courtCaseNumber,
      recipientName: patch.recipientName || base.recipientName,
      recipientAddress: patch.recipientAddress || base.recipientAddress,
      recipientPhone: patch.recipientPhone || base.recipientPhone,
      collectorName: patch.collectorName || base.collectorName,
      plaintiffLawFirm: patch.plaintiffLawFirm || base.plaintiffLawFirm,
      plaintiffLawFirmAddress: patch.plaintiffLawFirmAddress || base.plaintiffLawFirmAddress,
      plaintiffAttorneyBarNumber: patch.plaintiffAttorneyBarNumber || base.plaintiffAttorneyBarNumber,
      originalCreditor: patch.originalCreditor || base.originalCreditor,
      stateJurisdiction: patch.stateJurisdiction || base.stateJurisdiction,
      dateServed: parseLooseDate(patch.dateServed || '') || base.dateServed,
      hearingDate: hearingIso || base.hearingDate,
      source: 'document',
      notes: [base.notes, `Litigation scrape: ${result.filename} (${result.docKind}).`].filter(Boolean).join('\n'),
    });
    onDebtChange(next);
    setNotice('Case updated from scrape — recipient, court facts, and hearing date saved.');
    setChat((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: `Applied scrape to case “${next.name}”. Case #: ${next.courtCaseNumber || '—'} · Hearing: ${next.hearingDate || '—'} · Recipient: ${next.recipientName || '—'}. Next: confirm parties, then build Answer / Affidavit.`,
      },
    ]);
  };

  return (
    <div className={`${finelyOsCatalogCardCompact('fuchsia')} space-y-3 overflow-hidden relative`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 10% 0%, rgba(232,121,249,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(56,189,248,0.12), transparent 50%)',
        }}
      />
      <div className="relative space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-200/90`}>
              <FileSearch size={14} /> Litigation doc scraper
            </div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              Docket · summons · complaint · affidavit · collector letter — field-by-field with confidence.
            </p>
          </div>
          <span className={finelyOsStatusChip(result ? 'ok' : 'warn')}>
            {result ? `${result.docKind.replace('_', ' ')} · ${result.fields.length} fields` : 'Ready'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={FINELY_OS_PRIMARY_BTN}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {busy ? 'Scraping…' : 'Upload court PDF'}
          </button>
          {result ? (
            <button type="button" disabled={!partnerId} onClick={applyToCase} className={FINELY_OS_SECONDARY_BTN}>
              <Sparkles size={14} /> Apply to case
            </button>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void runFile(f);
            }}
          />
        </div>
        {progress ? <div className={`text-[11px] text-fuchsia-100/80`}>{progress}</div> : null}
        {notice ? <div className="text-[11px] text-emerald-200/90">{notice}</div> : null}
        {err ? <div className="text-[11px] text-rose-200/90">{err}</div> : null}

        {fieldRows.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
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

        <div className="rounded-xl border border-white/10 bg-black/35 max-h-[200px] overflow-y-auto space-y-2 p-3">
          {chat.map((line, i) => (
            <div
              key={i}
              className={`text-xs whitespace-pre-wrap ${
                line.role === 'user' ? 'text-sky-100/90' : FINELY_OS_ENTITY_BODY
              }`}
            >
              <span className="text-[10px] uppercase tracking-widest text-white/40 mr-2">
                {line.role === 'user' ? 'You' : 'Scraper'}
              </span>
              {line.text}
            </div>
          ))}
        </div>
        <p className="text-[9px] text-white/35">Educational · not legal advice · verify against your paper file · results vary</p>
      </div>
    </div>
  );
}
