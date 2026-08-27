import React from 'react';
import type { WlAccent } from '../workspaceLightDesignTokens';
import { WlSolidKpi } from './WlContrastTiles';
import { wlAccentToAdminTone, WL_KPI_TONE_ROTATION } from '../wlContrastMap';
import type { FcAdminTone } from '../../os/finelyOsAdminSurface';

export type WlKpiItem = {
  label: string;
  value: string | number;
  hint?: string;
  accent: WlAccent;
  tone?: FcAdminTone;
  onClick?: () => void;
};

export function WlKpiGrid({ items }: { items: WlKpiItem[] }) {
  return (
    <div className="fc-wl-kpi-grid">
      {items.map((k, idx) => (
        <WlSolidKpi
          key={k.label}
          label={k.label}
          value={k.value}
          hint={k.hint}
          tone={k.tone ?? WL_KPI_TONE_ROTATION[idx % WL_KPI_TONE_ROTATION.length]}
          onClick={k.onClick}
        />
      ))}
    </div>
  );
}

export function WlKpiRail({ items }: { items: WlKpiItem[] }) {
  return (
    <div className="fc-wl-kpi-rail">
      {items.map((k, idx) => (
        <WlSolidKpi
          key={k.label}
          label={k.label}
          value={k.value}
          hint={k.hint}
          tone={k.tone ?? WL_KPI_TONE_ROTATION[idx % WL_KPI_TONE_ROTATION.length]}
          onClick={k.onClick}
        />
      ))}
    </div>
  );
}
