import React from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { hasEntitlement } from '../../data/billingRepo';
import {
  isPortalNavPathActive,
  PORTAL_SECONDARY_LINKS,
  PORTAL_STICKY_TABS,
} from '../../config/portalNavLanes';
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
  if (path.startsWith('/portal/build')) return ENTITLEMENT_KEYS.businessBuild;
  return null;
}

function isNavLocked(partnerId: string | undefined, path: string, requiredKey: string | null): boolean {
  if (!partnerId || !requiredKey) return false;
  if (path === '/portal/disputes' || path.startsWith('/portal/letters')) {
    return !hasEntitlement(partnerId, ENTITLEMENT_KEYS.disputes) && !hasEntitlement(partnerId, ENTITLEMENT_KEYS.letters);
  }
  return !hasEntitlement(partnerId, requiredKey);
}

/** Admin-style structured tabs for the partner portal — primary lanes only; secondary in More. */
export function PartnerPortalStickyTabs({ compact }: { compact?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { partner } = usePartnerSession();

  const moreActive = PORTAL_SECONDARY_LINKS.some((l) => isPortalNavPathActive(pathname, l.path));

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
      <div className={`${FINELY_OS_VIEW_TABS} fc-portal-sticky-tabs__strip w-full !flex-wrap !gap-2 !p-2`}>
        {PORTAL_STICKY_TABS.map(({ path, label, accent }) => {
          const active = isPortalNavPathActive(pathname, path);
          const requiredKey = partner ? entitlementForPath(path) : null;
          const locked = isNavLocked(partner?.id, path, requiredKey);
          return (
            <button
              key={path}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => navigate(locked ? '/portal/billing' : path)}
              className={`${finelyOsViewTab(active, accent)} ${compact ? '!py-2 !text-xs !min-w-[5.5rem]' : ''} ${
                locked && !active ? '!opacity-45' : ''
              }`}
              title={locked ? `${label} (locked)` : label}
            >
              {locked ? <Lock size={12} aria-hidden /> : null}
              {label}
            </button>
          );
        })}

        <details className="relative inline-block">
          <summary
            className={`list-none cursor-pointer ${finelyOsViewTab(moreActive, 'amber')} ${
              compact ? '!py-2 !text-xs !min-w-[5.5rem]' : ''
            }`}
            title="More tools"
            aria-label="More portal destinations"
          >
            More <ChevronDown size={12} aria-hidden />
          </summary>
          <div className="absolute right-0 mt-2 z-50 min-w-[13rem] rounded-2xl border border-white/15 bg-[#0a1018]/98 p-2 shadow-2xl backdrop-blur-md">
            {PORTAL_SECONDARY_LINKS.map(({ path, label, icon: Icon }) => {
              const active = isPortalNavPathActive(pathname, path);
              const requiredKey = partner ? entitlementForPath(path) : null;
              const locked = isNavLocked(partner?.id, path, requiredKey);
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(locked ? '/portal/billing' : path)}
                  className={`w-full text-left ${finelyOsViewTab(active, 'emerald')} !w-full !justify-start mb-1 last:mb-0 ${
                    locked && !active ? '!opacity-45' : ''
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {locked ? <Lock size={12} aria-hidden /> : <Icon size={12} aria-hidden />}
                  {label}
                </button>
              );
            })}
          </div>
        </details>
      </div>
    </div>
  );
}
