import React, { useEffect, useId, useMemo, useState } from 'react';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fmtCompact(n: number) {
  try {
    // "Compact" notation (1.2K) reads like a dense dashboard; default to full numbers.
    return n.toLocaleString();
  } catch {
    return String(n);
  }
}

function useCountUp(target: number, ms = 650) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const start = v;
    const delta = target - start;
    let raf = 0;
    const tick = (t: number) => {
      const p = clamp((t - t0) / ms, 0, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(start + delta * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return v;
}

export function Sparkline({
  values,
  height = 28,
  stroke = 'rgba(245, 158, 11, 0.9)',
}: {
  values: number[];
  height?: number;
  stroke?: string;
}) {
  const w = 110;
  const h = height;
  const pad = 2;
  const gid = useId();
  const fillId = `sparkFill_${gid.replace(/:/g, '')}`;

  const points = useMemo(() => {
    const xs = values.length ? values : [0, 0, 0, 0, 0];
    const max = Math.max(...xs, 1);
    const min = Math.min(...xs, 0);
    const span = Math.max(1, max - min);
    return xs.map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / Math.max(1, xs.length - 1);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return { x, y };
    });
  }, [values, h]);

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const last = points[points.length - 1] ?? { x: w - pad, y: h / 2 };

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id={`${fillId}_stroke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.2" />
          <stop offset="55%" stopColor={stroke} stopOpacity="0.95" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.85)" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#${fillId}_stroke)`} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={`${d} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`}
        fill={`url(#${fillId})`}
        opacity="0.35"
      />
      {/* End-point glow */}
      <circle cx={last.x} cy={last.y} r="4.2" fill={stroke} opacity="0.25" />
      <circle cx={last.x} cy={last.y} r="2.2" fill={stroke} opacity="0.9" />
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.55" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  series,
  tone = 'amber',
  onClick,
}: {
  label: string;
  value: number | string;
  hint?: string;
  series?: number[];
  tone?: 'amber' | 'emerald' | 'sky' | 'violet';
  onClick?: () => void;
}) {
  const numeric = typeof value === 'number' ? value : Number.NaN;
  const display = useCountUp(Number.isFinite(numeric) ? numeric : 0);
  const toneCls =
    tone === 'emerald'
      ? 'border-emerald-500/20 bg-emerald-500/5'
      : tone === 'sky'
        ? 'border-sky-500/20 bg-sky-500/5'
        : tone === 'violet'
          ? 'border-violet-500/20 bg-violet-500/5'
          : 'border-amber-500/20 bg-amber-500/5';
  const stroke =
    tone === 'emerald'
      ? 'rgba(16,185,129,0.9)'
      : tone === 'sky'
        ? 'rgba(56,189,248,0.9)'
        : tone === 'violet'
          ? 'rgba(167,139,250,0.9)'
          : 'rgba(245,158,11,0.9)';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border ${toneCls} p-6 hover:brightness-110 transition-all ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
      disabled={!onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-white/70">{label}</div>
          <div className="mt-2 text-4xl font-light text-white leading-none">
            {typeof value === 'number' ? fmtCompact(display) : String(value)}
          </div>
          {hint ? <div className="mt-2 text-white/60 text-sm">{hint}</div> : null}
        </div>
        {series ? <Sparkline values={series} stroke={stroke} /> : null}
      </div>
    </button>
  );
}

