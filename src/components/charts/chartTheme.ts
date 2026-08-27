/** Shared theme constants for all premium chart components. */

export const CHART_PALETTE = {
  amber: 'rgba(245,158,11,1)',
  amberFill: 'rgba(245,158,11,0.18)',
  emerald: 'rgba(16,185,129,1)',
  emeraldFill: 'rgba(16,185,129,0.18)',
  violet: 'rgba(139,92,246,1)',
  violetFill: 'rgba(139,92,246,0.18)',
  rose: 'rgba(244,63,94,1)',
  roseFill: 'rgba(244,63,94,0.18)',
  sky: 'rgba(56,189,248,1)',
  skyFill: 'rgba(56,189,248,0.18)',
  white: 'rgba(255,255,255,0.85)',
  whiteMuted: 'rgba(255,255,255,0.55)',
  grid: 'rgba(255,255,255,0.06)',
  gridDash: '3 3',
} as const;

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(10,14,12,0.96)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    boxShadow: '0 20px 50px -12px rgba(0,0,0,0.6)',
  },
  labelStyle: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  cursor: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 },
} as const;

export const AXIS_TICK = {
  fill: 'rgba(255,255,255,0.68)',
  fontSize: 12,
} as const;

export const CARD_CLASS =
  'fc-premium-chart-card overflow-hidden rounded-2xl border border-sky-300/20 bg-[linear-gradient(145deg,rgba(12,25,42,0.98),rgba(24,20,55,0.96))] p-4 text-white shadow-[0_24px_54px_-36px_rgba(56,189,248,0.8)]';

export const LEGEND_CHIP_CLASS =
  'inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white/75';

export function defaultSeriesColors(idx: number): string {
  const colors = [CHART_PALETTE.emerald, CHART_PALETTE.violet, CHART_PALETTE.sky, CHART_PALETTE.rose];
  return colors[idx % colors.length]!;
}

export function defaultSeriesFills(idx: number): string {
  const fills = [CHART_PALETTE.emeraldFill, CHART_PALETTE.violetFill, CHART_PALETTE.skyFill, CHART_PALETTE.roseFill];
  return fills[idx % fills.length]!;
}
