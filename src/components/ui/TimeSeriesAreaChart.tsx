import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type Series = {
  id: string;
  label: string;
  color: string;
  values: number[];
};

export function TimeSeriesAreaChart(args: {
  title: string;
  subtitle?: string;
  labels: string[];
  series: Series[];
  height?: number;
}) {
  const height = Math.max(160, Math.round(args.height ?? 220));

  const data = useMemo(() => {
    const n = Math.max(args.labels.length, ...args.series.map((s) => s.values.length));
    const out: Array<Record<string, any>> = [];
    for (let i = 0; i < n; i++) {
      const row: Record<string, any> = { label: args.labels[i] ?? String(i + 1) };
      for (const s of args.series) row[s.id] = s.values[i] ?? 0;
      out.push(row);
    }
    return out;
  }, [args.labels, args.series]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-white font-semibold">{args.title}</div>
          {args.subtitle ? <div className="mt-1 text-white/60 text-sm">{args.subtitle}</div> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {args.series.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-black/30 text-[10px] font-black uppercase tracking-widest text-white/70"
              title={s.label}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              contentStyle={{
                background: 'rgba(10,14,12,0.94)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                color: 'rgba(255,255,255,0.9)',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
            />
            {args.series.map((s) => (
              <Area
                key={s.id}
                type="monotone"
                dataKey={s.id}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.18}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

