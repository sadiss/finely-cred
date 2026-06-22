import React from 'react';
import { PageShell } from './PageShell';
import { PartnerDetailSidebarNav } from '../../features/partner/PartnerDetailSidebarNav';
import { FINELY_OS_PAGE } from '../../features/os/finelyOsLightUi';

type TabSpec = { key: string; label: string; icon?: React.ReactNode; hidden?: boolean };

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
  stickyBar?: React.ReactNode;
  /** Left sidebar with large section buttons (partner profile). */
  useSidebarNav?: boolean;
  /** @deprecated use useSidebarNav */
  useTabLanes?: boolean;
  children: React.ReactNode;
}) {
  const tabs = (args.tabs ?? []).filter((t) => !t.hidden);
  const useSidebar = args.useSidebarNav ?? false;

  return (
    <PageShell badge={args.badge} title={args.title} subtitle={args.subtitle}>
      <div className={FINELY_OS_PAGE}>
        {(args.headerLeft || args.headerRight) ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>{args.headerLeft}</div>
            <div className="flex flex-wrap items-center gap-2">{args.headerRight}</div>
          </div>
        ) : null}

        {args.kpis ? <div>{args.kpis}</div> : null}

        {useSidebar && tabs.length && args.activeTabKey && args.onTabChange ? (
          <div className="grid lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
            <PartnerDetailSidebarNav tabs={tabs} activeTabKey={args.activeTabKey} onTabChange={args.onTabChange} />
            <div className="min-w-0 space-y-6">
              {args.stickyBar ? (
                <div className="sticky top-0 z-20 -mx-1 px-1 py-2 rounded-xl border border-violet-500/20 bg-fc-chrome/95 backdrop-blur-md shadow-lg shadow-black/10 fc-entity-sticky-bar">
                  {args.stickyBar}
                </div>
              ) : null}
              <div>{args.children}</div>
            </div>
          </div>
        ) : (
          <>
            {tabs.length && args.activeTabKey && args.onTabChange ? (
              <PartnerDetailSidebarNav tabs={tabs} activeTabKey={args.activeTabKey} onTabChange={args.onTabChange} />
            ) : null}
            {args.stickyBar ? (
              <div className="sticky top-0 z-20 -mx-1 px-1 py-2 rounded-xl border border-violet-500/20 bg-fc-chrome/95 backdrop-blur-md shadow-lg shadow-black/10 fc-entity-sticky-bar">
                {args.stickyBar}
              </div>
            ) : null}
            <div>{args.children}</div>
          </>
        )}
      </div>
    </PageShell>
  );
}
