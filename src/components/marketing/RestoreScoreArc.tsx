import React, { useEffect, useId, useState } from 'react';

const ARC_RADIUS = 90;
const ARC_LENGTH = Math.PI * ARC_RADIUS;

type Props = {
  value?: number;
  label?: string;
  animate?: boolean;
  className?: string;
};

export function RestoreScoreArc({
  value = 89,
  label = 'Restore momentum',
  animate = true,
  className = '',
}: Props) {
  const gradId = useId().replace(/:/g, '');
  const [mounted, setMounted] = useState(!animate);
  const pct = Math.max(0, Math.min(100, value));
  const displayPct = mounted ? pct : 0;
  const offset = ARC_LENGTH * (1 - displayPct / 100);
  const angle = Math.PI * (1 - displayPct / 100);
  const headX = 125 + ARC_RADIUS * Math.cos(angle);
  const headY = 118 - ARC_RADIUS * Math.sin(angle);

  useEffect(() => {
    if (!animate) return;
    const t = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(t);
  }, [animate]);

  return (
    <svg
      className={`pc-restore-arc ${className}`.trim()}
      viewBox="0 0 250 150"
      role="img"
      aria-label={`${label} ${Math.round(pct)} percent`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9b2d4a" />
          <stop offset="22%" stopColor="#c45c2a" />
          <stop offset="45%" stopColor="#b8860b" />
          <stop offset="68%" stopColor="#1f7a5c" />
          <stop offset="88%" stopColor="#3db896" />
          <stop offset="100%" stopColor="#d4af37" />
        </linearGradient>
        <filter id={`${gradId}-glow`}>
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="pc-restore-arc-ticks">
        {Array.from({ length: 11 }).map((_, i) => {
          const a = Math.PI * (1 - i / 10);
          const inner = ARC_RADIUS - 12;
          return (
            <line
              key={i}
              x1={125 + inner * Math.cos(a)}
              y1={118 - inner * Math.sin(a)}
              x2={125 + (ARC_RADIUS - 4) * Math.cos(a)}
              y2={118 - (ARC_RADIUS - 4) * Math.sin(a)}
              strokeWidth={i % 5 === 0 ? 2 : 1}
            />
          );
        })}
      </g>

      <path
        className="pc-restore-arc-track"
        d={`M ${125 - ARC_RADIUS} 118 A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${125 + ARC_RADIUS} 118`}
        fill="none"
        strokeWidth={12}
      />
      <path
        className="pc-restore-arc-fill"
        d={`M ${125 - ARC_RADIUS} 118 A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${125 + ARC_RADIUS} 118`}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={ARC_LENGTH}
        strokeDashoffset={offset}
        filter={`url(#${gradId}-glow)`}
        style={{ transition: animate ? 'stroke-dashoffset 1.15s cubic-bezier(0.22, 1, 0.36, 1)' : undefined }}
      />
      <circle className="pc-restore-arc-head" cx={headX} cy={headY} r={6} />

      <text className="pc-restore-arc-value" x="125" y="106" textAnchor="middle">
        {Math.round(displayPct)}%
      </text>
      <text className="pc-restore-arc-label" x="125" y="132" textAnchor="middle">
        {label}
      </text>
    </svg>
  );
}
