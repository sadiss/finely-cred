import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = {
  livePath: string;
  liveLabel?: string;
};

/**
 * Side-by-side before (live dark) vs after (light preview) — pinned above dashboard content.
 */
export function WlBeforeAfterStrip({ livePath, liveLabel = 'View dark dashboard' }: Props) {
  return (
    <section className="fc-wl-dashboard-compare" aria-label="Before and after comparison">
      <div className="fc-wl-compare-strip fc-wl-compare-strip--dashboard">
        <div className="fc-wl-compare-dark">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">Before · dark workspace</div>
            <Link to={livePath} className="fc-wl-compare-live-link">
              {liveLabel} <ExternalLink size={11} />
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-white/10 bg-black/50 p-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Menu bar</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {['Dashboard', 'Reports', 'Disputes', 'Tasks'].map((t) => (
                  <span key={t} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-white/55">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/8 bg-white/5 p-2">
                <div className="text-[8px] uppercase text-white/35">Glass KPI</div>
                <div className="text-sm font-bold text-white/25">42</div>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/5 p-2">
                <div className="text-[8px] uppercase text-white/35">Wash</div>
                <div className="text-sm font-bold text-white/25">—</div>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/5 p-2">
                <div className="text-[8px] uppercase text-white/35">Fade</div>
                <div className="text-sm font-bold text-white/25">5%</div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-white/40">
            Cramped glass layers · low contrast washes · hidden until hover.
          </p>
        </div>

        <div className="fc-wl-compare-light fc-wl-compare-light--active">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">After · light preview (this page)</div>
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Side rail + top menu</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['Dashboard', 'Reports', 'Disputes', 'Tasks'].map((t, i) => (
                  <span
                    key={t}
                    className="rounded-md border px-2 py-0.5 text-[9px] font-semibold"
                    style={{
                      borderColor: ['rgba(16,185,129,0.45)', 'rgba(14,165,233,0.45)', 'rgba(139,92,246,0.45)', 'rgba(217,70,239,0.45)'][i],
                      background: ['rgba(16,185,129,0.12)', 'rgba(14,165,233,0.12)', 'rgba(139,92,246,0.12)', 'rgba(217,70,239,0.12)'][i],
                      color: '#0a1628',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['emerald', 'sky', 'violet'] as const).map((tone) => (
                <div key={tone} className={`fc-wl-kpi-tile fc-wl-kpi-tile--mini`} data-fc-accent={tone}>
                  <div className="fc-wl-kpi-label">Solid</div>
                  <div className="fc-wl-kpi-value">✓</div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
            Full-width layout · vivid accents · readable ink on every tile.
          </p>
        </div>
      </div>
    </section>
  );
}
