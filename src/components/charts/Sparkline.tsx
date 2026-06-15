import React from 'react';

/**
 * Tiny inline sparkline chart for KPI cards. Pure SVG, no Recharts dependency.
 * Renders within whatever container dimensions are provided.
 */
export function Sparkline(props: {
  values: number[];
  color?: string;
  fillOpacity?: number;
  height?: number;
  className?: string;
}) {
  const color = props.color ?? 'rgba(245,158,11,1)';
  const fillOpacity = props.fillOpacity ?? 0.2;
  const h = props.height ?? 32;
  const vals = props.values;
  if (!vals.length) return null;

  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const range = max - min || 1;
  const w = 100;

  const points = vals.map((v, i) => {
    const x = vals.length > 1 ? (i / (vals.length - 1)) * w : w / 2;
    const y = h - ((v - min) / range) * (h * 0.85) - h * 0.05;
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const fillPath = `M0,${h} ${points.join(' ')} ${w},${h}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={props.className ?? 'w-full'}
      style={{ height: h }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`sp-g-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#sp-g-${color.replace(/[^a-z0-9]/gi, '')})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
