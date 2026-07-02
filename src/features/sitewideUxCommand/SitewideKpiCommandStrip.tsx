import React from 'react';
import { Activity, Globe, LayoutGrid, Lock, MonitorCog, ShieldCheck } from 'lucide-react';
import type { SitewideUxSummary } from './types';

const items = [
  { key: 'totalPages', label: 'Pages found', icon: Globe },
  { key: 'adminPages', label: 'Admin', icon: MonitorCog },
  { key: 'publicPages', label: 'Public', icon: LayoutGrid },
  { key: 'portalPages', label: 'Portal', icon: Activity },
  { key: 'criticalPages', label: 'Critical UX', icon: ShieldCheck },
  { key: 'protectedPages', label: 'Protected', icon: Lock },
] as const;

export function SitewideKpiCommandStrip({ summary }: { summary: SitewideUxSummary }) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-6 gap-3">
      {items.map((x) => {
        const Icon = x.icon;
        return (
          <div key={x.key} className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/40 font-black">{x.label}</div>
              <Icon size={16} className="text-amber-300" />
            </div>
            <div className="mt-4 text-3xl font-light text-white">{summary[x.key]}</div>
            <div className="mt-2 text-white/45 text-xs">sitewide layout command</div>
          </div>
        );
      })}
    </div>
  );
}
