import React from 'react';
import { CARD_CLASS, defaultSeriesColors } from './chartTheme';

export type FunnelStep = { label: string; value: number; color?: string };

/**
 * Horizontal funnel chart — premium glass styling.
 * Steps are rendered as progressively narrowing bars.
 */
export function FunnelChartCard(props: {
  title: string;
  subtitle?: string;
  steps: FunnelStep[];
}) {
  const maxValue = Math.max(...props.steps.map((s) => s.value), 1);

  return (
    <div className={CARD_CLASS}>
      <div className="mb-5">
        <div className="text-white font-semibold">{props.title}</div>
        {props.subtitle && <div className="mt-1 text-white/60 text-sm">{props.subtitle}</div>}
      </div>
      <div className="space-y-3">
        {props.steps.map((step, i) => {
          const pct = Math.max(8, (step.value / maxValue) * 100);
          const color = step.color ?? defaultSeriesColors(i);
          const convRate = i > 0 ? Math.round((step.value / props.steps[i - 1]!.value) * 100) : 100;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">{step.label}</span>
                <span className="text-white font-semibold tabular-nums">{step.value.toLocaleString()}</span>
              </div>
              <div className="relative h-8 rounded-xl overflow-hidden bg-white/[0.04]">
                <div
                  className="absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                />
                {i > 0 && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{convRate}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
