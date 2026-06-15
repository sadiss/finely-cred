import React from 'react';
import { PageShell } from './PageShell';
import { PARTNER_DETAIL_TAB_LANES, resolvePartnerDetailLaneId } from '../../config/partnerDetailTabLanes';
import { FinelyEntityTabLaneNav } from '../../features/os/FinelyEntityTabLaneNav';
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
  /** When true, group many tabs into 4 lanes with paginated pickers. */
  useTabLanes?: boolean;
  children: React.ReactNode;
}) {
  const tabs = (args.tabs ?? []).filter((t) => !t.hidden);
  const useLanes = args.useTabLanes ?? tabs.length > 5;

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

        {tabs.length && args.activeTabKey && args.onTabChange ? (
          useLanes ? (
            <FinelyEntityTabLaneNav
              tabs={tabs}
              lanes={PARTNER_DETAIL_TAB_LANES}
              activeTabKey={args.activeTabKey}
              onTabChange={args.onTabChange}
              resolveLaneId={resolvePartnerDetailLaneId}
            />
          ) : (
            <FinelyEntityTabLaneNav
              tabs={tabs}
              lanes={[]}
              activeTabKey={args.activeTabKey}
              onTabChange={args.onTabChange}
            />
          )
        ) : null}

        {args.stickyBar ? (
          <div className="sticky top-0 z-20 -mx-1 px-1 py-2 rounded-xl border border-violet-500/20 bg-fc-chrome/95 backdrop-blur-md shadow-lg shadow-black/10 fc-entity-sticky-bar">
            {args.stickyBar}
          </div>
        ) : null}

        <div>{args.children}</div>
      </div>
    </PageShell>
  );
}
