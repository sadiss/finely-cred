import React from 'react';
import { FinelyCredLogo } from './FinelyCredLogo';
import { NcgLogo } from './NcgLogo';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Finely Cred + NCG co-brand for credit / funding lead magnets.
 * Matches existing logo placement density (header chrome / footer marks).
 */
export function LeadMagnetCobrand({
  className,
  size = 'sm',
  showPartnerLabel = true,
  layout = 'row',
}: {
  className?: string;
  size?: 'sm' | 'md';
  showPartnerLabel?: boolean;
  layout?: 'row' | 'stack';
}) {
  const ncgSize = size === 'md' ? 'md' : 'sm';
  return (
    <div
      className={cn(
        'flex items-center',
        layout === 'stack' ? 'flex-col gap-2' : 'flex-row gap-3 sm:gap-4',
        className,
      )}
    >
      <FinelyCredLogo size={size} forceLight alignLeft />
      <span
        className="hidden h-7 w-px shrink-0 bg-gradient-to-b from-transparent via-white/35 to-transparent sm:block"
        aria-hidden
      />
      <div className="flex items-center gap-2">
        {showPartnerLabel ? (
          <span className="hidden text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 sm:inline">
            With
          </span>
        ) : null}
        <NcgLogo variant="calligraphic" size={ncgSize} className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]" />
      </div>
    </div>
  );
}

/** Compact footer mark pair for lead magnet footers. */
export function LeadMagnetCobrandFooterMarks({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <FinelyCredLogo variant="mark" size="md" forceLight />
      <span className="h-8 w-px bg-white/20" aria-hidden />
      <NcgLogo variant="mark" size="md" />
    </div>
  );
}
