import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { isPortalNavPathActive, PORTAL_NAV_LANES, PORTAL_SECONDARY_LINKS } from '../../config/portalNavLanes';
import { PartnerPortalStickyTabs } from '../../components/portal/PartnerPortalStickyTabs';
import { FINELY_OS_ENTITY_SUBLABEL } from './finelyOsLightUi';

/** Legacy lane picker — kept for partners who prefer the old four-lane grid. */
export function FinelyPortalSimpleNav({ onShowFullNav }: { onShowFullNav: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { partner } = usePartnerSession();

  const workLane = PORTAL_NAV_LANES.find((l) => l.id === 'work') ?? PORTAL_NAV_LANES[0];
  const workActive = workLane.links.some((link) => isPortalNavPathActive(pathname, link.path));

  return (
    <nav className="mb-6 fc-portal-simple-nav space-y-3" data-fc-portal-nav="simple">
      <PartnerPortalStickyTabs compact />

      {!workActive ? (
        <details className="fc-portal-simple-nav__more rounded-2xl border border-white/10 bg-black/20 p-3">
          <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>
            Letter station · Connect · Grow — {PORTAL_SECONDARY_LINKS.length} tools
          </summary>
          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {PORTAL_SECONDARY_LINKS.map(({ path, label }) => (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className="text-left rounded-xl border border-white/10 px-3 py-2 text-xs text-white/75 hover:bg-white/[0.06] transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </details>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>
          {partner?.profile?.fullName ? `${partner.profile.fullName} · ` : ''}
          Work lane active
        </p>
        <button
          type="button"
          onClick={onShowFullNav}
          className="fc-portal-nav-mode-toggle text-[10px] font-black uppercase tracking-widest text-white/55 hover:text-white transition-colors"
        >
          Structured nav
        </button>
      </div>
    </nav>
  );
}
