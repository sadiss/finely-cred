import React from 'react';

type Props = {
  className?: string;
  size?: 'sm' | 'md';
};

/** Funnel / homepage video — typography only (no raster logo mark). */
export function VideoFinelyCredWordmark({ className = '', size = 'md' }: Props) {
  const text =
    size === 'sm'
      ? 'text-base sm:text-lg tracking-[-0.02em]'
      : 'text-xl sm:text-2xl tracking-[-0.03em]';
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      aria-hidden
    >
      <p
        className={`del-serif font-semibold ${text} text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]`}
      >
        Finely{' '}
        <span className="font-light italic text-[#ffd993]">Cred</span>
      </p>
    </div>
  );
}
