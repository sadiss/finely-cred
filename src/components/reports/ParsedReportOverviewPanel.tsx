import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Database, FileText, ShieldCheck } from 'lucide-react';
import type { ParsedCreditReport } from '../../domain/creditReports';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  finelyOsGlassShell,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

function badgeClass(kind: 'ok' | 'warn') {
  return finelyOsStatusChip(kind === 'ok' ? 'ok' : 'warn');
}

export function ParsedReportOverviewPanel({
  parsed,
  filename,
}: {
  parsed: ParsedCreditReport;
  filename?: string;
}) {
  const stats = useMemo(() => {
    const tradelines = parsed.tradelines?.length ?? 0;
    const scores = parsed.scores?.length ?? 0;
    const sections = parsed.sections?.length ?? 0;
    const withHistory = (parsed.tradelines ?? []).filter((t) => t.paymentHistory2y?.months?.length).length;
    const hasPI = Boolean(parsed.personalInfo?.fullName || parsed.personalInfo?.addresses?.length || parsed.personalInfo?.ssnMasked);
    const contacts = parsed.creditorContacts?.length ?? 0;
    const fallback = Boolean(parsed.debug?.fallbackTradelinesUsed);
    const reportDate = parsed.reportDate || parsed.debug?.reportDateDetected;
    const quality: Array<{ kind: 'ok' | 'warn'; text: string }> = [];
    if (tradelines > 0) quality.push({ kind: 'ok', text: `${tradelines} tradelines` });
    else quality.push({ kind: 'warn', text: 'No tradelines parsed' });
    if (withHistory > 0) quality.push({ kind: 'ok', text: `${withHistory} w/ 24‑month history` });
    else quality.push({ kind: 'warn', text: 'Payment history not detected' });
    if (scores > 0) quality.push({ kind: 'ok', text: `${scores} scores` });
    else quality.push({ kind: 'warn', text: 'Scores not detected' });
    if (sections > 0) quality.push({ kind: 'ok', text: `${sections} sections` });
    if (parsed.provider === 'unknown') quality.push({ kind: 'warn', text: 'Unknown provider' });
    if (fallback) quality.push({ kind: 'warn', text: 'Fallback tradeline detection' });
    return { tradelines, scores, sections, withHistory, hasPI, contacts, fallback, reportDate, quality };
  }, [parsed]);

  const hasWarnings = stats.quality.some((q) => q.kind === 'warn');

  return (
    <div className={`${finelyOsGlassShell('panel', 'sky')} space-y-4`}>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-sky-800">
            <Database size={18} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Parsed report overview</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 ${badgeClass(hasWarnings ? 'warn' : 'ok')}`}>
              {hasWarnings ? (
                <>
                  <AlertTriangle size={12} />
                  Needs review
                </>
              ) : (
                <>
                  <CheckCircle2 size={12} />
                  Parsed cleanly
                </>
              )}
            </span>
            <span className={finelyOsStatusChip('ok')}>
              Provider: <span className="font-mono normal-case">{parsed.provider}</span>
            </span>
            {stats.reportDate && (
              <span className={finelyOsStatusChip('ok')}>
                Report date: <span className="font-mono normal-case">{stats.reportDate}</span>
              </span>
            )}
          </div>
          <div className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
            {filename ? (
              <span className="inline-flex items-center gap-2">
                <FileText size={14} className="text-white/40" />
                <span className={FINELY_OS_ENTITY_VALUE}>{filename}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <div className="inline-flex items-center gap-2 text-emerald-300">
            <ShieldCheck size={18} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Coverage</span>
          </div>
          <div className={`mt-2 text-2xl font-light ${FINELY_OS_ENTITY_VALUE}`}>{stats.tradelines}</div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>tradelines parsed</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {stats.quality.map((q, idx) => (
          <span key={`${q.kind}_${idx}`} className={badgeClass(q.kind)}>
            {q.text}
          </span>
        ))}
        {stats.contacts > 0 && <span className={badgeClass('ok')}>{stats.contacts} contacts extracted</span>}
        {stats.hasPI && <span className={badgeClass('ok')}>Personal info found</span>}
      </div>

      {hasWarnings && (
        <div className={FINELY_OS_NOTICE_WARN}>
          Tip: If this export came from a monitoring provider, use the <span className="font-semibold">HTML export</span> format for best parsing.
          Some providers render different layouts; “fallback detection” means we inferred tradelines from bureau-header tables.
        </div>
      )}
    </div>
  );
}
