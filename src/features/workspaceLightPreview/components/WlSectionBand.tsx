import React from 'react';
import type { WlAccent } from '../workspaceLightDesignTokens';

export type WlSectionVariant = 'ivory' | 'tinted' | 'obsidian' | 'open';

export function WlSectionBand({
  accent,
  id,
  children,
  className = '',
  variant = 'tinted',
}: {
  accent: WlAccent;
  id?: string;
  children: React.ReactNode;
  className?: string;
  variant?: WlSectionVariant;
}) {
  return (
    <section
      id={id}
      className={`fc-wl-section-band fc-wl-section-band--${variant} ${className}`}
      data-fc-accent={accent}
      data-fc-wl-section={id}
    >
      {children}
    </section>
  );
}
