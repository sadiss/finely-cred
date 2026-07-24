import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, Loader2, Radar, Sparkles } from 'lucide-react';
import type { LitigationScrapeResult, ScrapedLitigationField } from '../../lib/ocr/litigationDocScraper';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlowField,
  finelyOsGlowKpi,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

export type ScrapeIntelLine = {
  kind: 'probe' | 'signal' | 'alert';
  text: string;
};

function confidenceTone(c: ScrapedLitigationField['confidence']): 'ok' | 'warn' | 'blocked' {
  if (c === 'high') return 'ok';
  if (c === 'medium') return 'warn';
  return 'blocked';
}

/**
 * Distinct scrape-intel console — not a Finely chat bubble UI.
 * Terminal / radar aesthetic for OCR field signals.
 */
export function EvidenceScrapeIntelPanel({
  busy,
  progress,
  result,
  lines,
  notice,
  err,
  canApply,
  onApply,
  onExplainField,
  onProbe,
  compact,
}: {
  busy?: boolean;
  progress?: string | null;
  result?: LitigationScrapeResult | null;
  lines: ScrapeIntelLine[];
  notice?: string | null;
  err?: string | null;
  canApply?: boolean;
  onApply?: () => void;
  onExplainField?: (f: ScrapedLitigationField) => void;
  onProbe?: (query: string) => void;
  compact?: boolean;
}) {
  const [probe, setProbe] = useState('');
  const fieldRows = result?.fields ?? [];

  useEffect(() => {
    if (!result) setProbe('');
  }, [result?.filename]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-[#050a12]/95 ${
        compact ? '!p-3 space-y-2' : '!p-4 space-y-3'
      }`}
      style={{
        boxShadow: 'inset 0 0 40px rgba(34,211,238,0.08), 0 0 24px rgba(34,211,238,0.12)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,211,238,0.03) 2px, rgba(34,211,238,0.03) 4px), radial-gradient(ellipse 70% 50% at 80% 0%, rgba(251,191,36,0.12), transparent 55%)',
        }}
      />
      <div className="relative space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/90">
              <Radar size={14} className="text-amber-300" /> Scrape intel
            </div>
            <p className={`mt-1 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
              Field radar — drop a summons, collector letter, or PDF on the left. Signals land here (not chat).
            </p>
          </div>
          <span className={finelyOsStatusChip(result ? 'ok' : busy ? 'warn' : 'blocked')}>
            {busy ? progress || 'Scanning…' : result ? `${result.docKind.replace(/_/g, ' ')} · ${result.fields.length}` : 'Standby'}
          </span>
        </div>

        {notice ? (
          <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100">
            {notice}
          </div>
        ) : null}
        {err ? <div className="text-[11px] text-rose-300/90">{err}</div> : null}

        {fieldRows.length > 0 ? (
          <div className={`grid sm:grid-cols-2 gap-2 ${compact ? 'max-h-[140px]' : 'max-h-[200px]'} overflow-y-auto pr-0.5`}>
            {fieldRows.map((f) => (
              <button
                key={`${f.key}-${f.value}`}
                type="button"
                onClick={() => onExplainField?.(f)}
                className={`${finelyOsGlowKpi('sky')} !p-2.5 text-left hover:border-cyan-300/50`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} !text-cyan-200/80`}>{f.label}</div>
                  <span className={finelyOsStatusChip(confidenceTone(f.confidence))}>{f.confidence}</span>
                </div>
                <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE} line-clamp-2`}>{f.value}</div>
                <div className={`mt-0.5 text-[10px] text-cyan-100/50 line-clamp-2`}>{f.meaning}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-cyan-400/25 bg-black/40 px-3 py-5 text-center">
            {busy ? (
              <div className="inline-flex items-center gap-2 text-xs text-cyan-100/80">
                <Loader2 size={14} className="animate-spin" /> {progress || 'Extracting signals…'}
              </div>
            ) : (
              <p className="text-[11px] text-cyan-100/55">No signals yet — upload on the capture deck to run OCR scrape.</p>
            )}
          </div>
        )}

        {result?.routes?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {result.routes.map((r) => (
              <Link
                key={r.id}
                to={r.path}
                className={`${FINELY_OS_SECONDARY_BTN} !text-[10px] ${r.priority === 'urgent' ? '!border-amber-400/40 !text-amber-100' : ''}`}
              >
                {r.label}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {canApply && result ? (
            <button type="button" disabled={busy} onClick={onApply} className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}>
              <Sparkles size={14} /> Apply signals to case
            </button>
          ) : null}
        </div>

        <div className="rounded-xl border border-cyan-400/20 bg-black/50 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-cyan-400/15 flex items-center gap-2">
            <Crosshair size={12} className="text-amber-300" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">Signal log</span>
            <span className="text-[10px] text-white/35 ml-auto">{lines.length}</span>
          </div>
          <div className={`${compact ? 'max-h-[120px]' : 'max-h-[160px]'} overflow-y-auto space-y-1.5 p-2.5 font-mono`}>
            {lines.length === 0 ? (
              <p className="text-[10px] text-cyan-100/40">Awaiting upload…</p>
            ) : (
              lines.map((line, i) => (
                <div
                  key={i}
                  className={`text-[10px] whitespace-pre-wrap leading-relaxed ${
                    line.kind === 'probe'
                      ? 'text-amber-200/90'
                      : line.kind === 'alert'
                        ? 'text-rose-200/90'
                        : 'text-cyan-100/75'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-widest text-white/30 mr-2">
                    {line.kind === 'probe' ? 'PROBE' : line.kind === 'alert' ? 'ALERT' : 'SIGNAL'}
                  </span>
                  {line.text}
                </div>
              ))
            )}
          </div>
          {onProbe ? (
            <form
              className="flex gap-2 p-2 border-t border-cyan-400/15"
              onSubmit={(e) => {
                e.preventDefault();
                const q = probe.trim();
                if (!q) return;
                onProbe(q);
                setProbe('');
              }}
            >
              <input
                value={probe}
                onChange={(e) => setProbe(e.target.value)}
                placeholder="Probe a field (e.g. case number, plaintiff)…"
                className={`${finelyOsGlowField('sky')} !py-2 text-xs font-mono`}
              />
              <button type="submit" className={`${FINELY_OS_SECONDARY_BTN} shrink-0 !text-[10px]`}>
                Probe
              </button>
            </form>
          ) : null}
        </div>

        <p className="text-[9px] text-white/30">Educational · not legal advice · verify against your paper file · results vary</p>
      </div>
    </div>
  );
}
