import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { FinelyOsGlowAccent } from '../../features/os/finelyOsLightUi';

/**
 * Shared before/after credit-score comparison graphic renderer.
 *
 * Extracted from `src/features/studioCommandOs/BeforeAfterScoreGraphicPanel.tsx` (the admin-only
 * proof-graphic generator, Content Studio Deliverable 2) so the exact same canvas-drawing logic
 * can also power `src/pages/BeforeAfterGalleryPage.tsx` (the public before/after proof gallery,
 * Phase C2) without duplicating the drawing code in two places. Both consumers pass real
 * `caseStudiesRepo.ts` score pairs — this component itself has no data-fetching opinion, it only
 * draws whatever numbers/alias it is given.
 */

export type BeforeAfterGraphicThemeId = 'emerald' | 'violet' | 'amber';

export const BEFORE_AFTER_GRAPHIC_THEMES: Array<{
  id: BeforeAfterGraphicThemeId;
  label: string;
  before: string;
  after: string;
  glow: FinelyOsGlowAccent;
}> = [
  { id: 'emerald', label: 'Emerald restore', before: '#52525b', after: '#10b981', glow: 'emerald' },
  { id: 'violet', label: 'Violet premium', before: '#52525b', after: '#8b5cf6', glow: 'violet' },
  { id: 'amber', label: 'Amber gold', before: '#52525b', after: '#f59e0b', glow: 'amber' },
];

export const BEFORE_AFTER_GRAPHIC_DISCLAIMER =
  'Results vary · not legal advice · individual outcomes depend on your credit profile and cooperation with the process.';

export function scoreBand(score: number): string {
  if (score >= 740) return 'Excellent';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Needs work';
}

export function clampScore(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(300, Math.min(850, Math.round(n)));
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

export type BeforeAfterScoreGraphicCanvasProps = {
  startingScore: number;
  endingScore: number;
  partnerAlias: string;
  themeId?: BeforeAfterGraphicThemeId;
  /** Overrides the standard footer disclaimer text drawn on the canvas. */
  disclaimer?: string;
  className?: string;
};

/**
 * Renders the 1080x1080 before/after proof graphic onto a `<canvas>`. Forwards the underlying
 * `HTMLCanvasElement` ref so callers can export it (PNG download, save-as-asset) exactly like the
 * admin panel already does.
 */
export const BeforeAfterScoreGraphicCanvas = forwardRef<HTMLCanvasElement, BeforeAfterScoreGraphicCanvasProps>(
  function BeforeAfterScoreGraphicCanvas(
    { startingScore, endingScore, partnerAlias, themeId = 'emerald', disclaimer, className },
    forwardedRef,
  ) {
    const internalRef = useRef<HTMLCanvasElement | null>(null);
    useImperativeHandle(forwardedRef, () => internalRef.current as HTMLCanvasElement);

    const theme = BEFORE_AFTER_GRAPHIC_THEMES.find((t) => t.id === themeId) ?? BEFORE_AFTER_GRAPHIC_THEMES[0]!;
    const delta = endingScore - startingScore;

    useEffect(() => {
      const canvas = internalRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = 1080;
      const H = 1080;
      canvas.width = W;
      canvas.height = H;

      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#05070a');
      bg.addColorStop(1, '#0d1117');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(W / 2, H * 0.2, 40, W / 2, H * 0.2, W * 0.7);
      glow.addColorStop(0, `${theme.after}30`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '700 26px system-ui, -apple-system, sans-serif';
      ctx.fillText('FINELY CRED · PARTNER RESULT', W / 2, 84);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 50px system-ui, -apple-system, sans-serif';
      ctx.fillText('Credit score progress', W / 2, 150);

      const circleY = 470;
      const radius = 185;
      const beforeX = W * 0.28;
      const afterX = W * 0.72;

      function ring(
        context: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        r: number,
        color: string,
        label: string,
        score: number,
      ) {
        context.beginPath();
        context.arc(cx, cy, r, 0, Math.PI * 2);
        context.fillStyle = 'rgba(255,255,255,0.03)';
        context.fill();
        context.lineWidth = 14;
        context.strokeStyle = 'rgba(255,255,255,0.10)';
        context.stroke();

        const pct = Math.max(0, Math.min(1, score / 850));
        context.beginPath();
        context.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        context.lineWidth = 14;
        context.strokeStyle = color;
        context.lineCap = 'round';
        context.stroke();

        context.fillStyle = '#ffffff';
        context.font = '800 82px system-ui, -apple-system, sans-serif';
        context.fillText(String(score), cx, cy + 26);

        context.font = '700 21px system-ui, -apple-system, sans-serif';
        context.fillStyle = 'rgba(255,255,255,0.55)';
        context.fillText(scoreBand(score).toUpperCase(), cx, cy + 60);

        context.font = '800 23px system-ui, -apple-system, sans-serif';
        context.fillStyle = color;
        context.fillText(label, cx, cy - r - 28);
      }

      ring(ctx, beforeX, circleY, radius, theme.before, 'BEFORE', clampScore(startingScore));
      ring(ctx, afterX, circleY, radius, theme.after, 'AFTER', clampScore(endingScore));

      ctx.strokeStyle = theme.after;
      ctx.fillStyle = theme.after;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(beforeX + radius + 26, circleY);
      ctx.lineTo(afterX - radius - 46, circleY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(afterX - radius - 46, circleY - 18);
      ctx.lineTo(afterX - radius - 18, circleY);
      ctx.lineTo(afterX - radius - 46, circleY + 18);
      ctx.closePath();
      ctx.fill();

      ctx.font = '800 28px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = theme.after;
      ctx.fillText(delta >= 0 ? `+${delta} POINTS` : `${delta} POINTS`, W / 2, circleY - 8);

      ctx.font = '700 30px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(partnerAlias.trim() || 'Finely Cred partner', W / 2, circleY + radius + 84);

      ctx.font = '500 18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      wrapCanvasText(ctx, disclaimer ?? BEFORE_AFTER_GRAPHIC_DISCLAIMER, W / 2, H - 56, W - 160, 24);
    }, [startingScore, endingScore, partnerAlias, theme.before, theme.after, delta, disclaimer]);

    return (
      <canvas
        ref={internalRef}
        className={className ?? 'w-full max-w-[240px] aspect-square rounded-xl border border-white/10 bg-black/40'}
      />
    );
  },
);

/** Downloads the given canvas as a PNG, matching the admin panel's export naming convention. */
export function downloadBeforeAfterGraphicPng(canvas: HTMLCanvasElement, startingScore: number, endingScore: number) {
  const link = document.createElement('a');
  link.download = `finely-cred-before-after-${startingScore}-${endingScore}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
