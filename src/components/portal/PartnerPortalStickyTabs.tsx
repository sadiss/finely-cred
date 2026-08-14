import React from 'react';
import { Lock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { hasEntitlement } from '../../data/billingRepo';
import { isPortalNavPathActive, PORTAL_FULL_NAV_TABS } from '../../config/portalNavLanes';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_VIEW_TABS,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

function entitlementForPath(path: string): string | null {
  if (path.startsWith('/portal/reports')) return ENTITLEMENT_KEYS.reports;
  if (path.startsWith('/portal/documents')) return ENTITLEMENT_KEYS.documents;
  if (path.startsWith('/portal/messages')) return ENTITLEMENT_KEYS.messages;
  if (path.startsWith('/portal/projects')) return ENTITLEMENT_KEYS.tasks;
  if (path.startsWith('/portal/disputes')) return ENTITLEMENT_KEYS.disputes;
  if (path.startsWith('/portal/templates')) return ENTITLEMENT_KEYS.templates;
  if (path.startsWith('/portal/letters')) return ENTITLEMENT_KEYS.letters;
  if (path.startsWith('/portal/debt')) return ENTITLEMENT_KEYS.debt;
  if (path.startsWith('/portal/build') || path.startsWith('/business/')) return ENTITLEMENT_KEYS.businessBuild;
  return null;
}

function isNavLocked(partnerId: string | undefined, path: string, requiredKey: string | null): boolean {
  if (!partnerId || !requiredKey) return false;
  if (path === '/portal/disputes' || path.startsWith('/portal/letters')) {
    return !hasEntitlement(partnerId, ENTITLEMENT_KEYS.disputes) && !hasEntitlement(partnerId, ENTITLEMENT_KEYS.letters);
  }
  return !hasEntitlement(partnerId, requiredKey);
}

/** Full-width partner nav — every destination visible; locked lanes show a lock icon. */
export function PartnerPortalStickyTabs({ compact }: { compact?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { partner } = usePartnerSession();

  return (
    <div className="fc-portal-sticky-tabs space-y-2" data-fc-portal-sticky-tabs="1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>
          Partner workspace
          {partner?.profile?.fullName ? (
            <>
              {' '}
              · <span className="text-white/80">{partner.profile.fullName}</span>
            </>
          ) : null}
        </span>
      </div>
      <div
        className={`${FINELY_OS_VIEW_TABS} fc-portal-sticky-tabs__strip w-full !flex !flex-wrap !items-stretch !justify-stretch !gap-1.5 !p-2`}
      >
        {PORTAL_FULL_NAV_TABS.map(({ path, label, accent }) => {
          const active = isPortalNavPathActive(pathname, path);
          const requiredKey = partner ? entitlementForPath(path) : null;
          const locked = isNavLocked(partner?.id, path, requiredKey);
          return (
            <button
              key={path}
              type="button"
              aria-current={active ? 'page' : undefined}
              aria-disabled={locked ? true : undefined}
              onClick={() => navigate(locked ? '/portal/billing' : path)}
              className={`${finelyOsViewTab(active, accent)} flex-1 min-w-[4.75rem] !justify-center gap-1 ${
                compact ? '!py-2 !text-[10px] !px-2' : '!py-2.5 !text-xs !px-2.5'
              } ${locked && !active ? '!opacity-70' : ''}`}
              title={locked ? `${label} — upgrade to unlock` : label}
            >
              {locked ? <Lock size={11} aria-hidden className="shrink-0 opacity-90" /> : null}
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
