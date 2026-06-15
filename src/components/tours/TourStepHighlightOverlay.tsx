import React from 'react';
import type { TourStepHighlight } from '../../domain/tourStepHighlights';

type Props = {
  highlight: TourStepHighlight | null;
  containerClassName?: string;
};

/** Pulsing ring overlay for instructional tour screenshots. */
export function TourStepHighlightOverlay({ highlight, containerClassName = '' }: Props) {
  if (!highlight) return null;
  const { x, y, width, height, label } = highlight;
  return (
    <div className={`pointer-events-none absolute inset-0 ${containerClassName}`}>
      <div
        className="absolute rounded-lg border-[3px] border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.42)] animate-pulse"
        style={{ left: x, top: y, width, height }}
      />
      {label ? (
        <div
          className="absolute px-2 py-1 rounded-lg bg-emerald-500 text-black text-xs font-bold shadow-lg"
          style={{ left: x, top: Math.max(0, y - 28) }}
        >
          👆 {label}
        </div>
      ) : null}
    </div>
  );
}
