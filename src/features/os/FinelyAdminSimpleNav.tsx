import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminOpsCaps, isAdminNavPathAllowed } from '../../hooks/useAdminOpsCaps';
import {
  ADMIN_NAV_LANES,
  isAdminNavPathActive,
  resolveAdminNavLaneId,
  type AdminNavLinkDef,
} from '../../config/adminNavLanes';
import { FinelyOsPaginatedStack } from './FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PORTAL_NAV_STRIP,
  finelyOsCatalogCard,
  finelyOsViewTab,
} from './finelyOsLightUi';

export function FinelyAdminSimpleNav({ onShowFullNav }: { onShowFullNav: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const caps = useAdminOpsCaps();
  const [activeLaneId, setActiveLaneId] = useState(() => resolveAdminNavLaneId(pathname));

  useEffect(() => {
    setActiveLaneId(resolveAdminNavLaneId(pathname));
  }, [pathname]);

  const lanes = useMemo(
    () =>
      ADMIN_NAV_LANES.map((lane) => ({
        ...lane,
        items: lane.items.filter((item) => isAdminNavPathAllowed(item.path, caps)),
      })).filter((lane) => lane.items.length > 0),
    [caps],
  );

  const activeLane = useMemo(
    () => lanes.find((lane) => lane.id === activeLaneId) ?? lanes[0],
    [activeLaneId, lanes],
  );

  const renderLink = (link: AdminNavLinkDef) => {
    const active = isAdminNavPathActive(pathname, link.path);
    const Icon = link.icon;
    return (
      <button
        key={link.path}
        type="button"
        onClick={() => navigate(link.path)}
        className={`w-full text-left ${finelyOsViewTab(active, activeLane?.accent ?? 'emerald')} !w-full justify-start`}
        title={link.hint || link.label}
        aria-current={active ? 'page' : undefined}
      >
        <Icon size={12} />
        <span className="truncate">{link.label}</span>
      </button>
    );
  };

  if (!activeLane) return null;

  return (
    <nav className="mb-6 fc-admin-simple-nav" data-fc-admin-nav="simple">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        {lanes.map((lane) => {
          const laneActive = lane.id === activeLaneId;
          return (
            <button
              key={lane.id}
              type="button"
              onClick={() => setActiveLaneId(lane.id)}
              data-fc-accent={lane.accent}
              className={`text-left p-3 rounded-2xl border transition-all ${finelyOsCatalogCard(lane.accent)} ${
                laneActive ? 'fc-wayfinder-lane-active' : ''
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
          {activeLane.label} · {activeLane.items.length} modules
        </div>
        <FinelyOsPaginatedStack
          items={[...activeLane.items]}
          pageSize={Math.max(activeLane.items.length, 1)}
          itemSpacingClassName="grid sm:grid-cols-2 gap-2"
          renderItem={(link) => renderLink(link)}
          emptyMessage="No modules in this lane for your role."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 mt-2">
        <p className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>Simple admin nav — pick a lane first</p>
        <button
          type="button"
          onClick={onShowFullNav}
          className="fc-admin-nav-mode-toggle text-[10px] font-black uppercase tracking-widest text-white/55 hover:text-white transition-colors"
        >
          Show full nav
        </button>
      </div>
    </nav>
  );
}
