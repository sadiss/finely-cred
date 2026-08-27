import React from 'react';
import type { WlAccent } from '../workspaceLightDesignTokens';

export function WlMicroStat({ accent, children }: { accent: WlAccent; children: React.ReactNode }) {
  return (
    <span className="fc-wl-micro-stat" data-fc-accent={accent}>
      {children}
    </span>
  );
}
