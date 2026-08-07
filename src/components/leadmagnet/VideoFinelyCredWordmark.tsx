import React from 'react';

type Props = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Glass plaque — covers raster logo zones on marketing posters. */
  plaque?: boolean;
};

/** Funnel / homepage video — typography only (no raster logo mark). */
export function VideoFinelyCredWordmark({ className = '', size = 'md', plaque = false }: Props) {
  const text =
    size === 'sm'
      ? 'text-base sm:text-lg tracking-[-0.02em]'
      : size === 'lg'
        ? 'text-2xl sm:text-3xl tracking-[-0.04em]'
        : 'text-xl sm:text-2xl tracking-[-0.03em]';
  const inner = (
    <p
      className={`del-serif font-semibold ${text} text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]`}
    >
      Finely{' '}
      <span className="font-light italic text-[#ffd993]">Cred</span>
    </p>
  );
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden>
      {plaque ? (
        <div className="rounded-xl border border-emerald-400/25 bg-[#041a14]/75 backdrop-blur-md px-3.5 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          {inner}
        </div>
      ) : (
        inner
      )}
    </div>
  );
}
