import React, { useEffect, useId, useMemo, useState } from 'react';
import type { FcmAccent, FcmBed, FcmFoilVariant } from '../../../../styles/finelyMaterials';
import { ProductAnimatedNumber, prefersReducedMotion } from './ProductMotion';

/**
 * ProductInstruments — the workspace's "gauge, not a number in a box" layer.
 *
 * Ports the visual techniques already proven in the marketing/lead-magnet
 * surfaces (see file header comment in the mission brief this was built
 * from: `personalCreditRestoreVisual.css` spectrum ramp, `RestoreScoreArc`
 * multi-stop arc, `scoreBoostGuideReader.css` mono window tags, and
 * `BeforeAfterScoreGraphicCanvas` zinc→accent pairing) into compact,
 * `fcm-*`-aware React components for the workspace product layer.
 *
 * Brand constraint: no gold / amber / brown / orange fills. Where the
 * source material used gold as a ramp midpoint, this file substitutes a
 * neutral platinum→sky step instead (see `SPECTRUM_BANDS` below).
 */

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function fractionOf(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

/** Maps an `FcmAccent` onto the 3 foil variants `.fcm-foil` actually ships. */
function foilVariantFor(accent: FcmAccent): FcmFoilVariant {
  if (accent === 'violet') return 'violet';
  if (accent === 'platinum') return 'platinum';
  return 'emerald';
}

const SPECTRUM_BAND_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'] as const;

function spectrumBandLabel(pct: number): string {
  const idx = Math.min(4, Math.floor(pct / 20));
  return SPECTRUM_BAND_LABELS[Math.max(0, idx)];
}

function qualitativeBand(pct: number): string {
  if (pct < 40) return 'needs attention';
  if (pct < 65) return 'fair';
  if (pct < 85) return 'good';
  return 'excellent';
}

/* =============================================================================
   ProductWindowTag — small mono instrument kicker.
   ============================================================================= */
export type ProductWindowTagTone = 'emerald' | 'violet' | 'sky' | 'rose' | 'platinum' | 'neutral';

export function ProductWindowTag({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: ProductWindowTagTone;
}) {
  return (
    <span className="fc-wlp-inst-tag" data-tone={tone}>
      {children}
    </span>
  );
}

/* =============================================================================
   ProductSpectrumBar — five-segment poor→excellent measuring bar.
   ============================================================================= */
export function ProductSpectrumBar({
  value,
  min = 300,
  max = 850,
  label,
  caption,
  accent = 'emerald',
  showTicks = false,
  size = 'md',
  animate = false,
  bed = 'light',
}: {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  caption?: string;
  accent?: FcmAccent;
  showTicks?: boolean;
  size?: 'sm' | 'md';
  animate?: boolean;
  bed?: FcmBed;
}) {
  const fraction = fractionOf(value, min, max);
  const pct = fraction * 100;
  const band = spectrumBandLabel(pct);
  const roundedValue = Math.round(value);
  const foilVariant = foilVariantFor(accent);
  const shouldAnimate = animate && !prefersReducedMotion();

  const ariaLabel = `${label ? `${label}: ` : ''}${roundedValue} of ${min}–${max}, ${band.toLowerCase()}`;

  return (
    <div
      className="fc-wlp-inst-spectrum"
      data-size={size}
      data-bed={bed}
      data-fcm-accent={accent}
      data-fcm-motion={shouldAnimate ? 'on' : undefined}
      role="img"
      aria-label={ariaLabel}
    >
      {label || size === 'md' ? (
        <div className="fc-wlp-inst-spectrum-head">
          {label ? <ProductWindowTag tone={accent}>{label}</ProductWindowTag> : <span />}
          {size === 'md' ? (
            <span className={`fc-wlp-inst-spectrum-value fcm-foil fcm-foil--${foilVariant}`}>{roundedValue}</span>
          ) : (
            <span className="fc-wlp-inst-spectrum-value-sm">{roundedValue}</span>
          )}
        </div>
      ) : null}

      <div className="fc-wlp-inst-spectrum-track" aria-hidden>
        <span className="fc-wlp-inst-spectrum-seg fc-wlp-inst-spectrum-seg--poor" />
        <span className="fc-wlp-inst-spectrum-seg fc-wlp-inst-spectrum-seg--fair" />
        <span className="fc-wlp-inst-spectrum-seg fc-wlp-inst-spectrum-seg--good" />
        <span className="fc-wlp-inst-spectrum-seg fc-wlp-inst-spectrum-seg--verygood" />
        <span className="fc-wlp-inst-spectrum-seg fc-wlp-inst-spectrum-seg--excellent" />
        {shouldAnimate ? (
          <>
            <span className="fc-wlp-inst-spectrum-sweep fc-wlp-inst-spectrum-sweep--overlay" />
            <span className="fc-wlp-inst-spectrum-sweep fc-wlp-inst-spectrum-sweep--comet" />
            <span className="fc-wlp-inst-spectrum-sweep fc-wlp-inst-spectrum-sweep--glow" />
          </>
        ) : null}
        <span className="fc-wlp-inst-spectrum-marker" style={{ left: `${pct}%` }} />
      </div>

      {showTicks ? (
        <div className="fc-wlp-inst-spectrum-ticks" aria-hidden>
          {SPECTRUM_BAND_LABELS.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      ) : null}

      {caption ? <div className="fc-wlp-inst-spectrum-caption">{caption}</div> : null}
    </div>
  );
}

/* =============================================================================
   ProductArcGauge — three-quarter SVG arc with tick marks + glowing head.
   ============================================================================= */
const ARC_START_DEG = -135;
const ARC_SWEEP_DEG = 270;

function arcPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

export function ProductArcGauge({
  value,
  min = 0,
  max = 100,
  label,
  sublabel,
  accent = 'emerald',
  size = 132,
  ticks = 11,
  animate = true,
  bed = 'light',
}: {
  value: number;
  min?: number;
  max?: number;
  label: string;
  sublabel?: string;
  accent?: FcmAccent;
  size?: number;
  ticks?: number;
  animate?: boolean;
  bed?: FcmBed;
}) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const gradId = `fcWlpArcGrad${uid}`;
  const glowId = `fcWlpArcGlow${uid}`;

  const clampedSize = clamp(size, 96, 200);
  const viewBox = 132;
  const cx = viewBox / 2;
  const cy = viewBox / 2 + 4;
  const radius = 50;
  const strokeWidth = 10;

  const fraction = fractionOf(value, min, max);
  const pct = fraction * 100;
  const roundedValue = Math.round(value);
  const foilVariant = foilVariantFor(accent);
  const qualitative = qualitativeBand(pct);

  const reduced = useMemo(() => prefersReducedMotion(), []);
  const shouldAnimate = animate && !reduced;
  const [mounted, setMounted] = useState(!shouldAnimate);

  useEffect(() => {
    if (!shouldAnimate) return;
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, [shouldAnimate]);

  const displayFraction = mounted ? fraction : 0;
  const arcLength = radius * ((ARC_SWEEP_DEG * Math.PI) / 180);
  const dashOffset = arcLength * (1 - displayFraction);

  const trackStart = arcPoint(cx, cy, radius, ARC_START_DEG);
  const trackEnd = arcPoint(cx, cy, radius, ARC_START_DEG + ARC_SWEEP_DEG);
  const trackPath = `M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 1 1 ${trackEnd.x} ${trackEnd.y}`;

  const headDeg = ARC_START_DEG + ARC_SWEEP_DEG * displayFraction;
  const head = arcPoint(cx, cy, radius, headDeg);

  const ariaLabel = `${label} ${roundedValue} out of ${max}, ${qualitative}`;

  return (
    <span
      className="fc-wlp-inst-arc"
      data-bed={bed}
      data-fcm-accent={accent}
      style={{ width: clampedSize, height: clampedSize, ['--fc-wlp-inst-arc-size' as string]: `${clampedSize}px` } as React.CSSProperties}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        className="fc-wlp-inst-arc-svg"
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9465ff" />
            <stop offset="50%" stopColor="#18b6ef" />
            <stop offset="100%" stopColor="#0fc78d" />
          </linearGradient>
          <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="fc-wlp-inst-arc-ticks">
          {Array.from({ length: ticks }).map((_, i) => {
            const deg = ARC_START_DEG + (ARC_SWEEP_DEG * i) / (ticks - 1);
            const inner = arcPoint(cx, cy, radius - 9, deg);
            const outer = arcPoint(cx, cy, radius - 2, deg);
            return (
              <line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                strokeWidth={i === 0 || i === ticks - 1 || i === Math.floor((ticks - 1) / 2) ? 1.75 : 1}
              />
            );
          })}
        </g>

        <path className="fc-wlp-inst-arc-track" d={trackPath} fill="none" strokeWidth={strokeWidth} />
        <path
          className="fc-wlp-inst-arc-fill"
          d={trackPath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={dashOffset}
          filter={`url(#${glowId})`}
          style={{ transition: shouldAnimate ? 'stroke-dashoffset 1.15s var(--fcm-ease-entrance, cubic-bezier(0.22, 1, 0.36, 1))' : undefined }}
        />
        <circle className="fc-wlp-inst-arc-head" cx={head.x} cy={head.y} r={5.5} />
      </svg>

      <span className="fc-wlp-inst-arc-center">
        <strong className={`fcm-foil fcm-foil--${foilVariant}`}>
          <ProductAnimatedNumber value={roundedValue} durationMs={900} />
        </strong>
        <span className="fc-wlp-inst-arc-label">{sublabel ?? label}</span>
      </span>
    </span>
  );
}

/* =============================================================================
   ProductDeltaPair — before/after instrument, mirrors the shareable
   BeforeAfterScoreGraphicCanvas zinc→accent pairing for in-app consistency.
   ============================================================================= */
export function ProductDeltaPair({
  before,
  after,
  label,
  unit = '',
  accent = 'emerald',
  bed = 'light',
}: {
  before: number;
  after: number;
  label: string;
  unit?: string;
  accent?: FcmAccent;
  bed?: FcmBed;
}) {
  const delta = after - before;
  const foilVariant = foilVariantFor(accent);
  const sign = delta > 0 ? '+' : '';
  const ariaLabel = `${label}: before ${before}${unit}, after ${after}${unit}, ${sign}${delta}${unit} change`;

  return (
    <div className="fc-wlp-inst-delta" data-bed={bed} data-fcm-accent={accent} role="img" aria-label={ariaLabel}>
      <ProductWindowTag tone="neutral">{label}</ProductWindowTag>
      <div className="fc-wlp-inst-delta-row">
        <div className="fc-wlp-inst-delta-tile fc-wlp-inst-delta-tile--before">
          <span className="fc-wlp-inst-delta-value">
            {before}
            {unit}
          </span>
          <span className="fc-wlp-inst-delta-tag">Before</span>
        </div>

        <div className="fc-wlp-inst-delta-arrow" aria-hidden>
          <svg viewBox="0 0 40 16" width="34" height="14">
            <line x1="1" y1="8" x2="30" y2="8" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="28,2 38,8 28,14" />
          </svg>
          <span className="fc-wlp-inst-delta-amount">
            {sign}
            {delta}
            {unit}
          </span>
        </div>

        <div className="fc-wlp-inst-delta-tile fc-wlp-inst-delta-tile--after">
          <span className={`fc-wlp-inst-delta-value fcm-foil fcm-foil--${foilVariant}`}>
            <ProductAnimatedNumber value={after} durationMs={640} />
            {unit}
          </span>
          <span className="fc-wlp-inst-delta-tag">After</span>
        </div>
      </div>
    </div>
  );
}
