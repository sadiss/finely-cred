import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CARD_CLASS, TOOLTIP_STYLE, defaultSeriesColors } from './chartTheme';

export type DonutSlice = { label: string; value: number; color?: string };

export function DonutChartCard(props: {
  title: string;
  subtitle?: string;
  slices: DonutSlice[];
  centerLabel?: string;
  centerValue?: string | number;
  height?: number;
}) {
  const height = Math.max(180, props.height ?? 260);

  const data = useMemo(
    () => props.slices.map((s, i) => ({ name: s.label, value: s.value, fill: s.color ?? defaultSeriesColors(i) })),
    [props.slices],
  );

  return (
    <div className={CARD_CLASS}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-white font-semibold">{props.title}</div>
          {props.subtitle && <div className="mt-1 text-white/60 text-sm">{props.subtitle}</div>}
        </div>
      </div>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="85%"
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        {(props.centerLabel || props.centerValue != null) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {props.centerValue != null && (
              <div className="text-3xl font-light text-white tabular-nums">{props.centerValue}</div>
            )}
            {props.centerLabel && (
              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/50">{props.centerLabel}</div>
            )}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        {props.slices.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-[10px] text-white/70">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color ?? defaultSeriesColors(i) }} />
            {s.label}: {s.value}
          </span>
        ))}
      </div>
    </div>
  );
}
