import React from 'react';
import { WlMicroStat } from './WlMicroStat';
import { WlObsidianSlab } from './WlContrastTiles';
import type { WlAccent } from '../workspaceLightDesignTokens';

export function WlCommandHub({
  accent = 'violet',
  eyebrow,
  title,
  subtitle,
  badge,
  actions,
}: {
  accent?: WlAccent;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}) {
  return (
    <WlObsidianSlab className="fc-wl-command-hub sticky z-30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {badge ? <WlMicroStat accent={accent}>{badge}</WlMicroStat> : null}
            {eyebrow ? <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200/80">{eyebrow}</span> : null}
          </div>
          <h1 className="fc-wl-command-title-obsidian">{title}</h1>
          {subtitle ? <p className="text-sm leading-relaxed text-white/72">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </WlObsidianSlab>
  );
}
