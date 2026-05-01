import React from 'react';
import { PageShell } from './PageShell';

type TabSpec = { key: string; label: string; icon?: React.ReactNode; hidden?: boolean };

function tabBtn(active: boolean) {
  return `px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
  }`;
}

export function EntityDetailShell(args: {
  badge: string;
  title: string;
  subtitle?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  kpis?: React.ReactNode;
  tabs?: TabSpec[];
  activeTabKey?: string;
  onTabChange?: (key: string) => void;
  children: React.ReactNode;
}) {
  const tabs = (args.tabs ?? []).filter((t) => !t.hidden);

  return (
    <PageShell badge={args.badge} title={args.title} subtitle={args.subtitle}>
      <div className="space-y-6">
        {(args.headerLeft || args.headerRight) ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>{args.headerLeft}</div>
            <div className="flex flex-wrap items-center gap-2">{args.headerRight}</div>
          </div>
        ) : null}

        {args.kpis ? <div>{args.kpis}</div> : null}

        {tabs.length && args.activeTabKey && args.onTabChange ? (
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button key={t.key} className={tabBtn(args.activeTabKey === t.key)} onClick={() => args.onTabChange?.(t.key)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        ) : null}

        <div>{args.children}</div>
      </div>
    </PageShell>
  );
}

