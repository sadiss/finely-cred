import React from 'react';

type Bar = { label: string; value: number; color?: string; sublabel?: string };

export function CalculatorBarChart({
  bars,
  maxValue,
  formatValue,
  height = 160,
}: {
  bars: Bar[];
  maxValue?: number;
  formatValue: (n: number) => string;
  height?: number;
}) {
  const max = maxValue ?? Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
        {bars.map((b) => {
          const pct = Math.max(4, Math.round((b.value / max) * 100));
          return (
            <div key={b.label} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full gap-2">
              <span className="text-[10px] font-semibold text-white/75 tabular-nums">{formatValue(b.value)}</span>
              <div
                className="w-full rounded-t-lg transition-all duration-500 shadow-sm"
                style={{
                  height: `${pct}%`,
                  background: b.color ?? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
                  minHeight: 8,
                }}
              />
              <span className="text-[9px] uppercase tracking-wider text-white/50 text-center truncate w-full">{b.label}</span>
              {b.sublabel ? <span className="text-[8px] text-white/40 text-center">{b.sublabel}</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalculatorSparkline({
  values,
  color = '#0ea5e9',
  height = 48,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  if (!values.length) return null;
  const max = Math.max(1, ...values);
  const w = 100;
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * w;
      const y = height - (v / max) * (height - 4);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      <polyline fill={`${color}22`} stroke="none" points={`0,${height} ${points} ${w},${height}`} />
    </svg>
  );
}
