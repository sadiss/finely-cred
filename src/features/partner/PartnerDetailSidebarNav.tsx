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

const LIGHT_ACCENT_RING: Record<string, string> = {
  overview: 'border-emerald-600/35 bg-emerald-500/10 text-emerald-950',
  profile: 'border-violet-600/35 bg-violet-500/10 text-violet-950',
  reports: 'border-sky-600/35 bg-sky-500/10 text-sky-950',
  analysis: 'border-sky-600/32 bg-sky-500/10 text-sky-950',
  evidence: 'border-sky-600/30 bg-sky-500/10 text-sky-950',
  letters: 'border-amber-700/35 bg-amber-500/12 text-amber-950',
  tasks: 'border-emerald-600/32 bg-emerald-500/10 text-emerald-950',
  notes: 'border-emerald-600/30 bg-emerald-500/10 text-emerald-950',
  debt: 'border-violet-600/35 bg-violet-500/10 text-violet-950',
};

export function PartnerDetailSidebarNav({
  tabs,
  activeTabKey,
  onTabChange,
  light = false,
}: {
  tabs: EntityTabSpec[];
  activeTabKey: string;
  onTabChange: (key: string) => void;
  /** Use the ivory entity-detail treatment without changing portal tabs. */
  light?: boolean;
}) {
  const visible = tabs.filter((t) => !t.hidden);

  return (
    <nav
      data-fc-sidebar-surface={light ? 'ivory' : 'default'}
      className="lg:sticky lg:top-4 space-y-2 fc-partner-sidebar-nav"
      aria-label="Partner profile sections"
    >
      <div className={`hidden lg:block mb-3 normal-case ${light ? 'text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0a1628]/55' : FINELY_OS_ENTITY_SUBLABEL}`}>
        Partner workspace
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
        {visible.map((t) => {
          const active = activeTabKey === t.key;
          const tone = light
            ? LIGHT_ACCENT_RING[t.key] ?? 'border-[#0a1628]/20 bg-[#0a1628]/[0.04] text-[#0a1628]'
            : ACCENT_RING[t.key] ?? 'border-white/15 bg-white/5 text-white/80';
          return (
            <button
              key={t.key}
              type="button"
              aria-current={active ? 'page' : undefined}
              data-fc-tab-active={active ? 'true' : undefined}
              data-fc-tab-surface={light ? 'ivory' : 'default'}
              onClick={() => onTabChange(t.key)}
              className={
                'w-full text-left rounded-2xl border px-4 py-3.5 transition-all flex items-center gap-3 min-h-[52px] ' +
                (active
                  ? `${tone} ${light ? 'ring-1 ring-black/5 shadow-sm' : 'ring-2 ring-white/20 shadow-lg'} scale-[1.01]`
                  : light
                    ? 'border-[#0a1628]/15 bg-transparent text-[#0a1628]/70 hover:border-[#0a1628]/28 hover:bg-white/60 hover:text-[#0a1628]'
                    : 'border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white')
              }
            >
              <span className="shrink-0 opacity-90">{t.icon}</span>
              <span className={`text-sm font-semibold ${active && !light ? FINELY_OS_ENTITY_VALUE : ''}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
