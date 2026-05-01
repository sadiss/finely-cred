import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Database, FileText, ShieldCheck } from 'lucide-react';
import type { ParsedCreditReport } from '../../domain/creditReports';

function badgeClass(kind: 'ok' | 'warn') {
  return kind === 'ok'
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
    : 'border-amber-500/25 bg-amber-500/10 text-amber-200';
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
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-amber-500/10 backdrop-blur-xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <Database size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Parsed report overview</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`text-[10px] px-3 py-1.5 rounded-full border uppercase tracking-widest font-bold ${hasWarnings ? badgeClass('warn') : badgeClass('ok')}`}>
              {hasWarnings ? (
                <>
                  <AlertTriangle size={12} className="inline -mt-0.5 mr-2" />
                  Needs review
                </>
              ) : (
                <>
                  <CheckCircle2 size={12} className="inline -mt-0.5 mr-2" />
                  Parsed cleanly
                </>
              )}
            </span>
            <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-white/70 uppercase tracking-widest font-bold">
              Provider: <span className="text-white/90">{parsed.provider}</span>
            </span>
            {stats.reportDate && (
              <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-white/70 uppercase tracking-widest font-bold">
                Report date: <span className="text-white/90">{stats.reportDate}</span>
              </span>
            )}
          </div>
          <div className="mt-3 text-white/60 text-sm">
            {filename ? (
              <span className="inline-flex items-center gap-2">
                <FileText size={14} className="text-white/40" />
                <span className="text-white/80 font-semibold">{filename}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <div className="inline-flex items-center gap-2 text-emerald-300">
            <ShieldCheck size={18} />
            <span className="text-[10px] uppercase tracking-widest text-white/50">Coverage</span>
          </div>
          <div className="mt-2 text-white text-2xl font-light">{stats.tradelines}</div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">tradelines parsed</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {stats.quality.map((q, idx) => (
          <span
            key={`${q.kind}_${idx}`}
            className={`text-[10px] px-3 py-1.5 rounded-full border uppercase tracking-widest font-bold ${badgeClass(q.kind)}`}
          >
            {q.text}
          </span>
        ))}
        {stats.contacts > 0 && (
          <span className={`text-[10px] px-3 py-1.5 rounded-full border uppercase tracking-widest font-bold ${badgeClass('ok')}`}>
            {stats.contacts} contacts extracted
          </span>
        )}
        {stats.hasPI && (
          <span className={`text-[10px] px-3 py-1.5 rounded-full border uppercase tracking-widest font-bold ${badgeClass('ok')}`}>
            Personal info found
          </span>
        )}
      </div>

      {hasWarnings && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-white/70 text-sm">
          Tip: If this export came from a monitoring provider, use the <span className="text-white/90 font-semibold">HTML export</span> format for best parsing.
          Some providers render different layouts; “fallback detection” means we inferred tradelines from bureau-header tables.
        </div>
      )}
    </div>
  );
}

