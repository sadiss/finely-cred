import React, { useMemo, useState } from 'react';
import { Clipboard, Info, Wrench, AlertTriangle } from 'lucide-react';
import type { ParsedCreditReport } from '../../domain/creditReports';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

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
    const withDla = (parsed.tradelines ?? []).filter((t) => t.dateLastActive).length;
    const fallback = Boolean(parsed.debug?.fallbackTradelinesUsed);
    const providerUnknown = parsed.provider === 'unknown';

    const issues: string[] = [];
    if (providerUnknown) issues.push('Provider not recognized');
    if (tradelines === 0) issues.push('No tradelines parsed');
    if (withHistory === 0) issues.push('No payment history detected');
    if (withDla === 0 && tradelines > 0) issues.push('Date Last Active not detected on tradelines');
    if (scores === 0) issues.push('No scores detected');
    if (fallback) issues.push('Fallback detection used');

    return { tradelines, scores, withHistory, withDla, fallback, providerUnknown, issues, hasIssues: issues.length > 0 };
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
      setCopied(false);
    }
  };

  return (
    <details className={`${finelyOsGlassShell('catalog', 'violet')} !p-0 overflow-hidden`} open={defaultOpen}>
      <summary className="cursor-pointer select-none list-none px-5 py-4 flex items-center justify-between gap-4 border-b border-white/[0.08]">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <span className="text-amber-300/80">{detailIcon}</span>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>{detailsTitle}</span>
          {summary.hasIssues && (
            <span className={`inline-flex items-center gap-2 ${finelyOsStatusChip('warn')}`}>
              <AlertTriangle size={12} />
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
          className={FINELY_OS_SECONDARY_BTN}
          title="Copy parsing diagnostics"
        >
          <Clipboard size={14} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </summary>

      <div className="px-5 py-5 space-y-4">
        {variant === 'partner' ? (
          <div className={`${FINELY_OS_ENTITY_BODY} space-y-2`}>
            <p>
              If your report didn’t parse cleanly, copy the diagnostics above and send it to support. This helps us
              identify provider layout changes quickly.
            </p>
            {summary.hasIssues && (
              <ul className="list-disc pl-5">
                {summary.issues.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className={FINELY_OS_ENTITY_BODY}>
            <p>
              Admin view includes parsing quality signals and section coverage. Use “Copy” to capture the exact debug
              payload without including full tradeline/personal info contents.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Tradelines', value: summary.tradelines },
            { label: 'Scores', value: summary.scores },
            { label: '24‑mo History', value: summary.withHistory },
            { label: 'Fallback', value: summary.fallback ? 'Yes' : 'No' },
          ].map((x) => (
            <div key={x.label} className={`${FINELY_OS_GLASS_CATALOG} !p-3 space-y-1`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{x.label}</div>
              <div className={FINELY_OS_ENTITY_VALUE}>{x.value}</div>
            </div>
          ))}
        </div>

        {variant === 'admin' && parsed.debug?.sectionsFound?.length ? (
          <div className={`${FINELY_OS_GLASS_CATALOG} space-y-3`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Section coverage</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {parsed.debug.sectionsFound.map((s) => (
                <div key={s.key} className={`${FINELY_OS_GLASS_CATALOG} !p-3 space-y-1`}>
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{s.key}</div>
                  <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                    rows: {s.rows ?? 0} · cols: {s.cols ?? 0} · table: {s.hasTable ? 'yes' : 'no'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <pre className="p-4 rounded-xl border border-white/[0.08] bg-fc-input text-[11px] text-white/65 whitespace-pre-wrap overflow-x-auto font-mono">
          {payloadText}
        </pre>
      </div>
    </details>
  );
}
