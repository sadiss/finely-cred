import React from 'react';
import type { WlAccent } from '../workspaceLightDesignTokens';
import { WlObsidianSlab } from './WlContrastTiles';

export function WlTabNav({
  tabs,
  activeId,
  onChange,
}: {
  tabs: Array<{ id: string; label: string }>;
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="fc-wl-tab-nav" aria-label="Section navigation">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`fc-wl-tab-btn ${activeId === t.id ? 'fc-wl-tab-btn--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

export function WlOpsPanel({
  accent,
  children,
}: {
  accent: WlAccent;
  children: React.ReactNode;
}) {
  return (
    <div className="fc-wl-ops-panel" data-fc-accent={accent}>
      {children}
    </div>
  );
}

export function WlPartnerWorkstation({ children }: { children: React.ReactNode }) {
  return (
    <WlObsidianSlab className="fc-wl-partner-workstation fc-admin-workspace !p-3 sm:!p-4">
      {children}
    </WlObsidianSlab>
  );
}

export function WlChartCanvas({ children }: { children: React.ReactNode }) {
  return (
    <WlObsidianSlab className="fc-wl-chart-canvas !p-3 sm:!p-4" glow>
      {children}
    </WlObsidianSlab>
  );
}
