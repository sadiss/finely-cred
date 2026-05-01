import React, { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { AXIS_TICK, CARD_CLASS, CHART_PALETTE, LEGEND_CHIP_CLASS, TOOLTIP_STYLE, defaultSeriesColors, defaultSeriesFills } from './chartTheme';

export type ComposedSeries = {
  id: string;
  label: string;
  type: 'area' | 'line' | 'bar';
  color?: string;
  values: number[];
};

export function ComposedChartCard(props: {
  title: string;
  subtitle?: string;
  labels: string[];
  series: ComposedSeries[];
  height?: number;
}) {
  const height = Math.max(180, props.height ?? 280);

  const data = useMemo(() => {
    const n = Math.max(props.labels.length, ...props.series.map((s) => s.values.length));
    const out: Record<string, any>[] = [];
    for (let i = 0; i < n; i++) {
      const row: Record<string, any> = { label: props.labels[i] ?? String(i + 1) };
      for (const s of props.series) row[s.id] = s.values[i] ?? 0;
      out.push(row);
    }
    return out;
  }, [props.labels, props.series]);

  return (
    <div className={CARD_CLASS}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="text-white font-semibold">{props.title}</div>
          {props.subtitle && <div className="mt-1 text-white/60 text-sm">{props.subtitle}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {props.series.map((s, i) => (
            <span key={s.id} className={LEGEND_CHIP_CLASS}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color ?? defaultSeriesColors(i) }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_PALETTE.grid} strokeDasharray={CHART_PALETTE.gridDash} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
            <Tooltip {...TOOLTIP_STYLE} />
            {props.series.map((s, i) => {
              const color = s.color ?? defaultSeriesColors(i);
              const fill = defaultSeriesFills(i);
              if (s.type === 'area') {
                return <Area key={s.id} type="monotone" dataKey={s.id} name={s.label} stroke={color} fill={fill} fillOpacity={1} strokeWidth={2} dot={false} animationDuration={800} />;
              }
              if (s.type === 'bar') {
                return <Bar key={s.id} dataKey={s.id} name={s.label} fill={color} fillOpacity={0.8} radius={[4, 4, 0, 0]} animationDuration={800} />;
              }
              return <Line key={s.id} type="monotone" dataKey={s.id} name={s.label} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth: 0 }} animationDuration={800} />;
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
