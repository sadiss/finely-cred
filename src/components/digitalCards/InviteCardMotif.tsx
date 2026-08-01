import React from 'react';
import type { DigitalInviteSilhouette } from '../../config/digitalInviteCardDesign';

interface MotifProps {
  silhouette: DigitalInviteSilhouette;
  width: number;
  height: number;
  /** Foil colour used for engraved line work. */
  line: string;
  /** Brighter foil for accent strokes. */
  lineBright: string;
}

/**
 * Engraved background artwork. One motif per silhouette so the three primary
 * cards never share a visual language: architectural contours for real estate,
 * a banknote guilloche rosette for the specialist credential, and court-seal
 * line work for the case desk docket.
 *
 * Rendered as inline SVG (no external assets) so PNG export is pixel-identical.
 */
export function InviteCardMotif({ silhouette, width, height, line, lineBright }: MotifProps) {
  return (
    <svg
      className="fcdc-layer fcdc-motif"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      {silhouette === 'estate' ? <EstateMotif w={width} h={height} line={line} bright={lineBright} /> : null}
      {silhouette === 'credential' ? <CredentialMotif w={width} h={height} line={line} bright={lineBright} /> : null}
      {silhouette === 'docket' ? <DocketMotif w={width} h={height} line={line} bright={lineBright} /> : null}
      {silhouette === 'ledger' ? <LedgerMotif w={width} h={height} line={line} bright={lineBright} /> : null}
      {silhouette === 'vault' ? <VaultMotif w={width} h={height} line={line} bright={lineBright} /> : null}
    </svg>
  );
}

type SubProps = { w: number; h: number; line: string; bright: string };

/** Architectural elevation: surveyed contour grid, skyline, and a struck key. */
function EstateMotif({ w, h, line, bright }: SubProps) {
  const towers = [
    { x: 0.52, wd: 0.075, top: 0.3 },
    { x: 0.605, wd: 0.055, top: 0.46 },
    { x: 0.668, wd: 0.095, top: 0.19 },
    { x: 0.772, wd: 0.062, top: 0.4 },
    { x: 0.842, wd: 0.084, top: 0.28 },
    { x: 0.934, wd: 0.05, top: 0.52 },
  ];

  return (
    <g>
      {/* Survey grid */}
      <g stroke={line} strokeWidth={0.6} opacity={0.16}>
        {Array.from({ length: 22 }, (_, i) => (
          <line key={`v${i}`} x1={i * (w / 21)} y1={0} x2={i * (w / 21)} y2={h} />
        ))}
        {Array.from({ length: 14 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * (h / 13)} x2={w} y2={i * (h / 13)} />
        ))}
      </g>

      {/* Contour bands sweeping under the copy block */}
      <g fill="none" stroke={bright} strokeWidth={1.1} opacity={0.18}>
        {Array.from({ length: 7 }, (_, i) => {
          const off = i * 26;
          return (
            <path
              key={`c${i}`}
              d={`M${-40} ${h * 0.76 + off} C ${w * 0.24} ${h * 0.6 + off}, ${w * 0.44} ${h * 0.92 + off}, ${w + 40} ${h * 0.58 + off}`}
            />
          );
        })}
      </g>

      {/* Engraved skyline */}
      <g opacity={0.26}>
        {towers.map((t, i) => (
          <g key={`t${i}`}>
            <rect
              x={t.x * w}
              y={t.top * h}
              width={t.wd * w}
              height={h - t.top * h}
              fill="none"
              stroke={bright}
              strokeWidth={1.2}
            />
            {Array.from({ length: 9 }, (_, r) => (
              <line
                key={`tf${i}-${r}`}
                x1={t.x * w + 4}
                y1={t.top * h + 16 + r * 32}
                x2={t.x * w + t.wd * w - 4}
                y2={t.top * h + 16 + r * 32}
                stroke={line}
                strokeWidth={0.7}
              />
            ))}
          </g>
        ))}
      </g>

      {/* Key watermark — sits in the gap between the proof chips and the bonus
          ribbon so it reads as a stamped mark, not a stray shape. */}
      <g opacity={0.11} transform={`translate(${w * 0.075} ${h * 0.6}) rotate(-14)`}>
        <circle cx={0} cy={0} r={40} fill="none" stroke={bright} strokeWidth={7} />
        <circle cx={0} cy={0} r={17} fill="none" stroke={bright} strokeWidth={5} />
        <rect x={34} y={-5} width={190} height={10} rx={5} fill={bright} />
        <rect x={172} y={3} width={12} height={30} rx={4} fill={bright} />
        <rect x={198} y={3} width={12} height={21} rx={4} fill={bright} />
      </g>
    </g>
  );
}

/** Banknote guilloche rosette + score arc — the "credential" security print. */
function CredentialMotif({ w, h, line, bright }: SubProps) {
  const cx = w * 0.5;
  const cy = h * 0.42;
  const petals = 44;

  return (
    <g>
      {/* Rosette: rotated ellipses form a spirograph engraving */}
      <g opacity={0.2} fill="none" stroke={bright} strokeWidth={0.75}>
        {Array.from({ length: petals }, (_, i) => (
          <ellipse
            key={`p${i}`}
            cx={cx}
            cy={cy}
            rx={w * 0.42}
            ry={w * 0.13}
            transform={`rotate(${(i * 180) / petals} ${cx} ${cy})`}
          />
        ))}
      </g>

      {/* Inner counter-rosette */}
      <g opacity={0.22} fill="none" stroke={line} strokeWidth={0.6}>
        {Array.from({ length: 26 }, (_, i) => (
          <ellipse
            key={`q${i}`}
            cx={cx}
            cy={cy}
            rx={w * 0.2}
            ry={w * 0.055}
            transform={`rotate(${(i * 180) / 26 + 7} ${cx} ${cy})`}
          />
        ))}
      </g>

      {/* Score arc gauge across the lower third */}
      <g opacity={0.3} fill="none" strokeLinecap="round">
        <path
          d={`M${w * 0.16} ${h * 0.83} A ${w * 0.34} ${w * 0.34} 0 0 1 ${w * 0.84} ${h * 0.83}`}
          stroke={line}
          strokeWidth={3}
          strokeDasharray="2 9"
        />
        <path
          d={`M${w * 0.16} ${h * 0.83} A ${w * 0.34} ${w * 0.34} 0 0 1 ${w * 0.63} ${h * 0.55}`}
          stroke={bright}
          strokeWidth={4}
        />
      </g>

      {/* Micro-print rules top and bottom */}
      <g opacity={0.18} stroke={line} strokeWidth={0.7}>
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`m${i}`} x1={w * 0.1} y1={h * 0.9 + i * 7} x2={w * 0.9} y2={h * 0.9 + i * 7} />
        ))}
      </g>
    </g>
  );
}

/** Court seal, engraved scales, and statute rules for the case desk docket. */
function DocketMotif({ w, h, line, bright }: SubProps) {
  const cx = w * 0.42;
  const cy = h * 0.52;

  return (
    <g>
      {/* Concentric seal rings */}
      <g fill="none" opacity={0.2}>
        <circle cx={cx} cy={cy} r={w * 0.34} stroke={bright} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={w * 0.315} stroke={line} strokeWidth={0.8} strokeDasharray="3 6" />
        <circle cx={cx} cy={cy} r={w * 0.24} stroke={line} strokeWidth={1.2} />
        {Array.from({ length: 72 }, (_, i) => {
          const a = (i * Math.PI * 2) / 72;
          const r1 = w * 0.24;
          const r2 = w * 0.265;
          return (
            <line
              key={`tick${i}`}
              x1={cx + Math.cos(a) * r1}
              y1={cy + Math.sin(a) * r1}
              x2={cx + Math.cos(a) * r2}
              y2={cy + Math.sin(a) * r2}
              stroke={bright}
              strokeWidth={1.1}
            />
          );
        })}
      </g>

      {/* Scales of justice, engraved */}
      <g opacity={0.16} fill="none" stroke={bright} strokeWidth={4} strokeLinecap="round">
        <line x1={cx} y1={cy - w * 0.16} x2={cx} y2={cy + w * 0.15} />
        <line x1={cx - w * 0.16} y1={cy - w * 0.11} x2={cx + w * 0.16} y2={cy - w * 0.11} />
        <line x1={cx - w * 0.1} y1={cy + w * 0.15} x2={cx + w * 0.1} y2={cy + w * 0.15} />
        <path d={`M${cx - w * 0.16} ${cy - w * 0.11} L${cx - w * 0.235} ${cy + w * 0.01} L${cx - w * 0.085} ${cy + w * 0.01} Z`} />
        <path d={`M${cx + w * 0.16} ${cy - w * 0.11} L${cx + w * 0.085} ${cy + w * 0.01} L${cx + w * 0.235} ${cy + w * 0.01} Z`} />
        <line x1={cx - w * 0.16} y1={cy - w * 0.11} x2={cx - w * 0.16} y2={cy - w * 0.145} />
        <line x1={cx + w * 0.16} y1={cy - w * 0.11} x2={cx + w * 0.16} y2={cy - w * 0.145} />
      </g>

      {/* Statute rules — faint pleading lines behind the copy */}
      <g opacity={0.12} stroke={line} strokeWidth={0.8}>
        {Array.from({ length: 26 }, (_, i) => (
          <line key={`s${i}`} x1={74} y1={46 + i * 35} x2={w - 40} y2={46 + i * 35} />
        ))}
      </g>
    </g>
  );
}

/** Chevron rails + ledger bars for the agency charter. */
function LedgerMotif({ w, h, line, bright }: SubProps) {
  return (
    <g>
      <g opacity={0.16} fill="none" stroke={bright} strokeWidth={1.4}>
        {Array.from({ length: 16 }, (_, i) => (
          <path key={`ch${i}`} d={`M${-60 + i * 96} ${h} L${20 + i * 96} ${0} L${68 + i * 96} ${0} L${-12 + i * 96} ${h} Z`} />
        ))}
      </g>
      <g opacity={0.14} stroke={line} strokeWidth={0.7}>
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`rule${i}`} x1={0} y1={h * 0.12 + i * 62} x2={w} y2={h * 0.12 + i * 62} />
        ))}
      </g>
      <g opacity={0.22}>
        {[0.24, 0.4, 0.58, 0.72, 0.86].map((f, i) => (
          <rect
            key={`bar${i}`}
            x={w * 0.56 + i * 58}
            y={h * (1 - f) - 40}
            width={28}
            height={h * f}
            rx={4}
            fill="none"
            stroke={bright}
            strokeWidth={1.3}
          />
        ))}
      </g>
    </g>
  );
}

/** Vault dial + seasoned tradeline bars. */
function VaultMotif({ w, h, line, bright }: SubProps) {
  const cx = w * 0.5;
  const cy = h * 0.4;

  return (
    <g>
      <g fill="none" opacity={0.2}>
        <circle cx={cx} cy={cy} r={w * 0.4} stroke={line} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={w * 0.32} stroke={bright} strokeWidth={2.4} />
        <circle cx={cx} cy={cy} r={w * 0.22} stroke={line} strokeWidth={1.4} />
        <circle cx={cx} cy={cy} r={w * 0.08} stroke={bright} strokeWidth={3} />
        {Array.from({ length: 48 }, (_, i) => {
          const a = (i * Math.PI * 2) / 48;
          return (
            <line
              key={`d${i}`}
              x1={cx + Math.cos(a) * w * 0.32}
              y1={cy + Math.sin(a) * w * 0.32}
              x2={cx + Math.cos(a) * w * (i % 4 === 0 ? 0.38 : 0.35)}
              y2={cy + Math.sin(a) * w * (i % 4 === 0 ? 0.38 : 0.35)}
              stroke={bright}
              strokeWidth={i % 4 === 0 ? 2.2 : 1}
            />
          );
        })}
        {[0, 90, 180, 270].map((deg) => (
          <line
            key={`sp${deg}`}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos((deg * Math.PI) / 180) * w * 0.22}
            y2={cy + Math.sin((deg * Math.PI) / 180) * w * 0.22}
            stroke={line}
            strokeWidth={1.6}
          />
        ))}
      </g>

      <g opacity={0.18}>
        {[0.42, 0.62, 0.78, 0.9].map((f, i) => (
          <rect
            key={`tl${i}`}
            x={w * 0.14}
            y={h * 0.76 + i * 26}
            width={(w * 0.72) * f}
            height={12}
            rx={6}
            fill="none"
            stroke={bright}
            strokeWidth={1.2}
          />
        ))}
      </g>
    </g>
  );
}
