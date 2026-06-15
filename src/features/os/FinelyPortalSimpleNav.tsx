import React, { useEffect, useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { hasEntitlement } from '../../data/billingRepo';
import {
  isPortalNavPathActive,
  PORTAL_NAV_LANES,
  resolvePortalNavLaneId,
  type PortalNavLinkDef,
} from '../../config/portalNavLanes';
import { FinelyOsPaginatedStack } from './FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PORTAL_NAV_STRIP,
  finelyOsCatalogCard,
  finelyOsViewTab,
} from './finelyOsLightUi';

function entitlementForPortalPath(path: string): string | null {
  if (path.startsWith('/portal/reports')) return ENTITLEMENT_KEYS.reports;
  if (path.startsWith('/portal/analysis')) return ENTITLEMENT_KEYS.reports;
  if (path.startsWith('/portal/documents')) return ENTITLEMENT_KEYS.documents;
  if (path.startsWith('/portal/messages')) return ENTITLEMENT_KEYS.messages;
  if (path.startsWith('/portal/projects') || path.startsWith('/portal/tasks')) return ENTITLEMENT_KEYS.tasks;
  if (path.startsWith('/portal/disputes')) return ENTITLEMENT_KEYS.disputes;
  if (path.startsWith('/portal/templates')) return ENTITLEMENT_KEYS.templates;
  if (path.startsWith('/portal/letters')) return ENTITLEMENT_KEYS.letters;
  if (path.startsWith('/portal/debt')) return ENTITLEMENT_KEYS.debt;
  if (path.startsWith('/portal/escalations')) return ENTITLEMENT_KEYS.escalations;
  if (path.startsWith('/portal/identity-theft')) return ENTITLEMENT_KEYS.identityTheft;
  if (path.startsWith('/portal/build')) return ENTITLEMENT_KEYS.businessBuild;
  if (path.startsWith('/portal/courses')) return ENTITLEMENT_KEYS.courses;
  if (path.startsWith('/portal/barter')) return ENTITLEMENT_KEYS.barter;
  return null;
}

function isNavLocked(partnerId: string | undefined, path: string, requiredKey: string | null): boolean {
  if (!partnerId || !requiredKey) return false;
  if (path === '/portal/disputes' || path.startsWith('/portal/letters')) {
    return !hasEntitlement(partnerId, ENTITLEMENT_KEYS.disputes) && !hasEntitlement(partnerId, ENTITLEMENT_KEYS.letters);
  }
  return !hasEntitlement(partnerId, requiredKey);
}

export function FinelyPortalSimpleNav({ onShowFullNav }: { onShowFullNav: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { partner } = usePartnerSession();
  const [activeLaneId, setActiveLaneId] = useState(() => resolvePortalNavLaneId(pathname));

  useEffect(() => {
    setActiveLaneId(resolvePortalNavLaneId(pathname));
  }, [pathname]);

  const activeLane = useMemo(
    () => PORTAL_NAV_LANES.find((lane) => lane.id === activeLaneId) ?? PORTAL_NAV_LANES[0],
    [activeLaneId],
  );

  const renderLink = (link: PortalNavLinkDef) => {
    const active = isPortalNavPathActive(pathname, link.path);
    const requiredKey = partner ? entitlementForPortalPath(link.path) : null;
    const locked = isNavLocked(partner?.id, link.path, requiredKey);
    const Icon = link.icon;
    return (
      <button
        key={link.path}
        type="button"
        onClick={() => navigate(locked ? '/portal/billing' : link.path)}
        className={`w-full text-left ${finelyOsViewTab(active, activeLane.accent)} !w-full justify-start ${
          locked && !active ? '!opacity-45' : ''
        }`}
        title={locked ? `${link.label} (locked)` : link.label}
        aria-label={locked ? `${link.label} (locked — upgrade in billing)` : link.label}
        aria-current={active ? 'page' : undefined}
      >
        {locked ? <Lock size={12} /> : <Icon size={12} />}
        {link.label}
      </button>
    );
  };

  return (
    <nav className="mb-8 fc-portal-simple-nav" data-fc-portal-nav="simple">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        {PORTAL_NAV_LANES.map((lane) => {
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
          {activeLane.label} · {activeLane.links.length} destinations
        </div>
        <FinelyOsPaginatedStack
          items={[...activeLane.links]}
          pageSize={Math.max(activeLane.links.length, 1)}
          itemSpacingClassName="grid sm:grid-cols-2 gap-2"
          renderItem={(link) => renderLink(link)}
          emptyMessage="No links in this lane."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 mt-2">
        <p className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>
          Simple nav — pick a lane, then a destination
        </p>
        <button
          type="button"
          onClick={onShowFullNav}
          className="fc-portal-nav-mode-toggle text-[10px] font-black uppercase tracking-widest text-white/55 hover:text-white transition-colors"
        >
          Show full nav
        </button>
      </div>
    </nav>
  );
}
