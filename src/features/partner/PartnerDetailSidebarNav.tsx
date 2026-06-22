import React from 'react';
import type { EntityTabSpec } from '../os/FinelyEntityTabLaneNav';
import { FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE } from '../os/finelyOsLightUi';

const ACCENT_RING: Record<string, string> = {
  overview: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-50',
  profile: 'border-violet-400/40 bg-violet-500/15 text-violet-50',
  reports: 'border-sky-400/40 bg-sky-500/15 text-sky-50',
  analysis: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
  evidence: 'border-sky-400/30 bg-sky-500/10 text-sky-100',
  letters: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  tasks: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100',
  notes: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
  debt: 'border-violet-400/40 bg-violet-500/15 text-violet-50',
};

export function PartnerDetailSidebarNav({
  tabs,
  activeTabKey,
  onTabChange,
}: {
  tabs: EntityTabSpec[];
  activeTabKey: string;
  onTabChange: (key: string) => void;
}) {
  const visible = tabs.filter((t) => !t.hidden);

  return (
    <nav
      className="lg:sticky lg:top-4 space-y-2 fc-partner-sidebar-nav"
      aria-label="Partner profile sections"
    >
      <div className={`hidden lg:block mb-3 ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>Partner workspace</div>
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
        {visible.map((t) => {
          const active = activeTabKey === t.key;
          const tone = ACCENT_RING[t.key] ?? 'border-white/15 bg-white/5 text-white/80';
          return (
            <button
              key={t.key}
              type="button"
              aria-current={active ? 'page' : undefined}
              data-fc-tab-active={active ? 'true' : undefined}
              onClick={() => onTabChange(t.key)}
              className={
                'w-full text-left rounded-2xl border px-4 py-3.5 transition-all flex items-center gap-3 min-h-[52px] ' +
                (active
                  ? `${tone} ring-2 ring-white/20 shadow-lg scale-[1.01]`
                  : 'border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white')
              }
            >
              <span className="shrink-0 opacity-90">{t.icon}</span>
              <span className={`text-sm font-semibold ${active ? FINELY_OS_ENTITY_VALUE : ''}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
