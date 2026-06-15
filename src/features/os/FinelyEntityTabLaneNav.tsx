import React, { useEffect, useMemo, useState } from 'react';
import { FinelyOsPaginatedStack } from './FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PORTAL_NAV_STRIP,
  finelyOsCatalogCard,
  finelyOsViewTab,
} from './finelyOsLightUi';

export type EntityTabSpec = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  hidden?: boolean;
};

export type EntityTabLaneSpec = {
  id: string;
  label: string;
  hint: string;
  accent: 'emerald' | 'amber' | 'sky' | 'violet';
  tabKeys: string[];
};

export function FinelyEntityTabLaneNav({
  tabs,
  lanes,
  activeTabKey,
  onTabChange,
  resolveLaneId,
}: {
  tabs: EntityTabSpec[];
  lanes: EntityTabLaneSpec[];
  activeTabKey: string;
  onTabChange: (key: string) => void;
  resolveLaneId?: (activeTab: string) => string;
}) {
  const visible = tabs.filter((t) => !t.hidden);
  const [activeLaneId, setActiveLaneId] = useState(() =>
    resolveLaneId ? resolveLaneId(activeTabKey) : lanes[0]?.id ?? 'file',
  );

  useEffect(() => {
    if (resolveLaneId) {
      setActiveLaneId(resolveLaneId(activeTabKey));
    }
  }, [activeTabKey, resolveLaneId]);

  const laneTabs = useMemo(() => {
    const lane = lanes.find((l) => l.id === activeLaneId) ?? lanes[0];
    if (!lane) return visible;
    const keys = new Set(lane.tabKeys);
    return visible.filter((t) => keys.has(t.key));
  }, [activeLaneId, lanes, visible]);

  const activeLane = lanes.find((l) => l.id === activeLaneId) ?? lanes[0];

  if (visible.length <= 5) {
    return (
      <div className={FINELY_OS_PORTAL_NAV_STRIP}>
        {visible.map((t) => (
          <button
            key={t.key}
            type="button"
            className={finelyOsViewTab(activeTabKey === t.key, 'violet')}
            onClick={() => onTabChange(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 fc-entity-tab-lane-nav" data-fc-entity-tab-nav="lanes">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {lanes.map((lane) => {
          const laneActive = lane.id === activeLaneId;
          const hasActiveTab = lane.tabKeys.includes(activeTabKey);
          return (
            <button
              key={lane.id}
              type="button"
              onClick={() => {
                setActiveLaneId(lane.id);
                if (!lane.tabKeys.includes(activeTabKey) && lane.tabKeys[0]) {
                  onTabChange(lane.tabKeys[0]);
                }
              }}
              className={`text-left p-3 rounded-2xl border transition-all ${finelyOsCatalogCard(lane.accent)} ${
                laneActive || hasActiveTab ? 'fc-wayfinder-lane-active' : ''
              }`}
            >
              <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{lane.label}</div>
              <div className={`text-xs mt-0.5 ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>{lane.hint}</div>
            </button>
          );
        })}
      </div>

      <div className={`${FINELY_OS_PORTAL_NAV_STRIP} flex-col !items-stretch !gap-0 p-3`}>
        <div className={`mb-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>
          {activeLane?.label} · pick a section
        </div>
        <FinelyOsPaginatedStack
          items={laneTabs}
          pageSize={4}
          itemSpacingClassName="grid sm:grid-cols-2 gap-2"
          emptyMessage="No sections in this lane."
          renderItem={(t) => (
            <button
              key={t.key}
              type="button"
              className={`w-full text-left ${finelyOsViewTab(activeTabKey === t.key, activeLane?.accent ?? 'violet')} !w-full justify-start`}
              onClick={() => onTabChange(t.key)}
            >
              {t.icon}
              {t.label}
            </button>
          )}
        />
      </div>
    </div>
  );
}
