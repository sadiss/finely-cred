import React, { useMemo, useState } from 'react';
import { Clipboard, Info, Wrench, AlertTriangle } from 'lucide-react';
import type { ParsedCreditReport } from '../../domain/creditReports';

type Variant = 'partner' | 'admin';

function safeJsonStringify(obj: unknown) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    try {
      return JSON.stringify({ error: 'Could not stringify diagnostics.' }, null, 2);
    } catch {
      return '{ "error": "Could not stringify diagnostics." }';
    }
  }
}

function buildDiagnosticsPayload(parsed: ParsedCreditReport, extra?: Record<string, unknown>) {
  const payload = {
    kind: 'finely.parsedCreditReport.diagnostics.v1',
    provider: parsed.provider,
    reportDate: parsed.reportDate,
    counts: {
      tradelines: parsed.tradelines?.length ?? 0,
      scores: parsed.scores?.length ?? 0,
      sections: parsed.sections?.length ?? 0,
      creditorContacts: parsed.creditorContacts?.length ?? 0,
    },
    flags: {
      fallbackTradelinesUsed: Boolean(parsed.debug?.fallbackTradelinesUsed),
      reportDateDetected: parsed.debug?.reportDateDetected || undefined,
      providerUnknown: parsed.provider === 'unknown',
    },
    debug: parsed.debug
      ? {
          tablesFound: parsed.debug.tablesFound,
          subHeadersFound: parsed.debug.subHeadersFound,
          tradelinesParsed: parsed.debug.tradelinesParsed,
          scoresFound: parsed.debug.scoresFound,
          fallbackTradelinesUsed: parsed.debug.fallbackTradelinesUsed,
          reportDateDetected: parsed.debug.reportDateDetected,
          sectionsFound: parsed.debug.sectionsFound,
        }
      : undefined,
    ...extra,
  };
  return payload;
}

export function ParsedReportDiagnosticsPanel({
  parsed,
  variant,
  filename,
  pdfMeta,
  defaultOpen = false,
}: {
  parsed: ParsedCreditReport;
  variant: Variant;
  filename?: string;
  pdfMeta?: { numPages?: number; extractedChars?: number; ocrUsed?: boolean; ocrEngine?: string };
  defaultOpen?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => {
    const tradelines = parsed.tradelines?.length ?? 0;
    const scores = parsed.scores?.length ?? 0;
    const withHistory = (parsed.tradelines ?? []).filter((t) => t.paymentHistory2y?.months?.length).length;
    const fallback = Boolean(parsed.debug?.fallbackTradelinesUsed);
    const providerUnknown = parsed.provider === 'unknown';

    const issues: string[] = [];
    if (providerUnknown) issues.push('Provider not recognized');
    if (tradelines === 0) issues.push('No tradelines parsed');
    if (withHistory === 0) issues.push('No payment history detected');
    if (scores === 0) issues.push('No scores detected');
    if (fallback) issues.push('Fallback detection used');

    return { tradelines, scores, withHistory, fallback, providerUnknown, issues, hasIssues: issues.length > 0 };
  }, [parsed]);

  const detailsTitle = variant === 'admin' ? 'Parsing diagnostics (admin)' : 'Parsing diagnostics';
  const detailIcon = variant === 'admin' ? <Wrench size={14} /> : <Info size={14} />;

  const payloadText = useMemo(() => {
    return safeJsonStringify(buildDiagnosticsPayload(parsed, { ...(filename ? { filename } : {}), ...(pdfMeta ? { pdfMeta } : {}) }));
  }, [parsed, filename, pdfMeta]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payloadText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard may be blocked; ignore.
      setCopied(false);
    }
  };

  return (
    <details
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl"
      open={defaultOpen}
    >
      <summary className="cursor-pointer select-none list-none px-5 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0 flex items-center gap-2 text-white/80">
          <span className="text-amber-300">{detailIcon}</span>
          <span className="text-[11px] font-black uppercase tracking-widest">{detailsTitle}</span>
          {summary.hasIssues && (
            <span className="ml-2 inline-flex items-center gap-2 text-[10px] px-3 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-200 uppercase tracking-widest font-black">
              <AlertTriangle size={12} className="inline -mt-0.5" />
              Needs review
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void copy();
          }}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70"
          title="Copy parsing diagnostics"
        >
          <Clipboard size={14} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </summary>

      <div className="px-5 pb-5 space-y-4">
        {variant === 'partner' ? (
          <div className="text-sm text-white/70 space-y-2">
            <p>
              If your report didn’t parse cleanly, copy the diagnostics above and send it to support. This helps us
              identify provider layout changes quickly.
            </p>
            {summary.hasIssues && (
              <ul className="list-disc pl-5 text-white/70">
                {summary.issues.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="text-sm text-white/70 space-y-2">
            <p>
              Admin view includes parsing quality signals and section coverage. Use “Copy” to capture the exact debug
              payload without including full tradeline/personal info contents.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Tradelines</div>
            <div className="mt-1 text-white font-semibold">{summary.tradelines}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Scores</div>
            <div className="mt-1 text-white font-semibold">{summary.scores}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/40">24‑mo History</div>
            <div className="mt-1 text-white font-semibold">{summary.withHistory}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Fallback</div>
            <div className="mt-1 text-white font-semibold">{summary.fallback ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {variant === 'admin' && parsed.debug?.sectionsFound?.length ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-3">Section coverage</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {parsed.debug.sectionsFound.map((s) => (
                <div key={s.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-white/90 font-semibold text-sm">{s.key}</div>
                  <div className="mt-1 text-[11px] text-white/60">
                    rows: {s.rows ?? 0} · cols: {s.cols ?? 0} · table: {s.hasTable ? 'yes' : 'no'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <pre className="p-4 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white/60 whitespace-pre-wrap overflow-x-auto">
          {payloadText}
        </pre>
      </div>
    </details>
  );
}

