import React, { useMemo } from 'react';
import { encodeQrMatrixBestFit } from './qrMatrix';

export interface InviteQrCodeProps {
  /** URL encoded into the matrix. */
  value: string;
  /** Rendered edge length in design px. */
  size: number;
  /** Foil colour for the finder eyes. */
  eyeColor: string;
  /** Colour for the data modules. */
  moduleColor: string;
  /** Plate colour behind the code — keep light for scanner contrast. */
  plateColor?: string;
  /** Monogram struck into the middle of the code. Relies on ECC-H headroom. */
  monogram?: string;
  className?: string;
}

/**
 * Branded QR plate rendered as inline SVG.
 *
 * Drawn with rounded data modules and squared foil finder eyes so the code
 * reads as jewellery rather than a bar-code sticker, while keeping the quiet
 * zone, contrast, and module geometry a scanner needs. Inline SVG (no <img>,
 * no canvas) means html-to-image exports it losslessly and without CORS taint.
 */
export function InviteQrCode({
  value,
  size,
  eyeColor,
  moduleColor,
  plateColor = '#fbfaf6',
  monogram,
  className = '',
}: InviteQrCodeProps) {
  const matrix = useMemo(() => encodeQrMatrixBestFit(value, 'H'), [value]);

  if (!matrix) {
    return (
      <div
        className={`fcdc-qr-fallback ${className}`}
        style={{ width: size, height: size, color: moduleColor, borderColor: eyeColor }}
      >
        <span>Open the link</span>
      </div>
    );
  }

  const quiet = 4;
  const span = matrix.size + quiet * 2;
  const eyeOrigins: Array<[number, number]> = [
    [quiet, quiet],
    [quiet, quiet + matrix.size - 7],
    [quiet + matrix.size - 7, quiet],
  ];

  const inEye = (row: number, col: number) =>
    eyeOrigins.some(([r0, c0]) => row >= r0 && row < r0 + 7 && col >= c0 && col < c0 + 7);

  // Knockout window for the monogram. ECC level H tolerates ~30% damage; a
  // 5-module square on a v6+ code stays far inside that budget.
  const knockout = monogram ? Math.max(5, Math.round(matrix.size * 0.16)) : 0;
  const knockoutStart = Math.floor((matrix.size - knockout) / 2) + quiet;
  const inKnockout = (row: number, col: number) =>
    knockout > 0 &&
    row >= knockoutStart &&
    row < knockoutStart + knockout &&
    col >= knockoutStart &&
    col < knockoutStart + knockout;

  const dots: string[] = [];
  for (let r = 0; r < matrix.size; r += 1) {
    for (let c = 0; c < matrix.size; c += 1) {
      if (!matrix.modules[r][c]) continue;
      const row = r + quiet;
      const col = c + quiet;
      if (inEye(row, col) || inKnockout(row, col)) continue;
      dots.push(`M${col + 0.11} ${row + 0.5}a0.39 0.39 0 1 0 0.78 0a0.39 0.39 0 1 0 -0.78 0`);
    }
  }

  return (
    <svg
      className={`fcdc-qr ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${span} ${span}`}
      role="img"
      aria-label="QR code linking to the Finely Cred invite"
      shapeRendering="geometricPrecision"
    >
      <rect x="0" y="0" width={span} height={span} rx={2.4} fill={plateColor} />
      <path d={dots.join(' ')} fill={moduleColor} />

      {eyeOrigins.map(([r0, c0]) => (
        <g key={`${r0}-${c0}`}>
          <rect
            x={c0 + 0.35}
            y={r0 + 0.35}
            width={6.3}
            height={6.3}
            rx={1.7}
            fill="none"
            stroke={eyeColor}
            strokeWidth={0.95}
          />
          <rect x={c0 + 2} y={r0 + 2} width={3} height={3} rx={0.9} fill={eyeColor} />
        </g>
      ))}

      {monogram ? (
        <g>
          <rect
            x={knockoutStart - 0.35}
            y={knockoutStart - 0.35}
            width={knockout + 0.7}
            height={knockout + 0.7}
            rx={1.5}
            fill={plateColor}
          />
          <rect
            x={knockoutStart + 0.15}
            y={knockoutStart + 0.15}
            width={knockout - 0.3}
            height={knockout - 0.3}
            rx={1.2}
            fill="none"
            stroke={eyeColor}
            strokeWidth={0.42}
          />
          <text
            x={knockoutStart + knockout / 2}
            y={knockoutStart + knockout / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={knockout * 0.5}
            fontFamily="ui-serif, Georgia, 'Times New Roman', serif"
            fontWeight={700}
            letterSpacing={knockout * 0.02}
            fill={moduleColor}
          >
            {monogram}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
