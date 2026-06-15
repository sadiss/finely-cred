import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { AXIS_TICK, CARD_CLASS, CHART_PALETTE, LEGEND_CHIP_CLASS, TOOLTIP_STYLE, defaultSeriesColors } from './chartTheme';

export type LineSeries = { id: string; label: string; color?: string; values: number[] };

export function LineChartCard(props: {
  title: string;
  subtitle?: string;
  labels: string[];
  series: LineSeries[];
  height?: number;
  curved?: boolean;
}) {
  const height = Math.max(180, props.height ?? 260);

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
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_PALETTE.grid} strokeDasharray={CHART_PALETTE.gridDash} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
            <Tooltip {...TOOLTIP_STYLE} />
            {props.series.map((s, i) => (
              <Line
                key={s.id}
                type={props.curved !== false ? 'monotone' : 'linear'}
                dataKey={s.id}
                name={s.label}
                stroke={s.color ?? defaultSeriesColors(i)}
                strokeWidth={2.5}
                dot={{ r: 3, fill: s.color ?? defaultSeriesColors(i), strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'rgba(255,255,255,0.3)' }}
                animationDuration={900}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
