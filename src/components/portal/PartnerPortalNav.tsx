import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Lock } from 'lucide-react';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listTasksByPartner } from '../../data/tasksRepo';
import { unreadCount } from '../../data/notificationsRepo';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { hasEntitlement } from '../../data/billingRepo';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PORTAL_NAV_STRIP,
  FINELY_OS_SIDE_RAIL_SHELL,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';
import {
  isPortalNavPathActive,
  PORTAL_LETTER_FLOW_LINKS,
  PORTAL_MORE_LINKS,
  PORTAL_PRIMARY_LINKS,
} from '../../config/portalNavLanes';
import { FinelyPortalSimpleNav } from '../../features/os/FinelyPortalSimpleNav';
import { persistPortalNavMode, readPortalNavMode, type FinelyPortalNavMode } from '../../lib/finelyPortalNavMode';
import { useIsMobileOrTabletViewport } from '../../hooks/useMediaQuery';

function entitlementForPath(path: string) {
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

export function PartnerPortalNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [storeVersion, setStoreVersion] = useState(0);
  const [navMode, setNavMode] = useState<FinelyPortalNavMode>(() => readPortalNavMode());

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const isCompactViewport = useIsMobileOrTabletViewport();

  const setMode = (mode: FinelyPortalNavMode) => {
    setNavMode(mode);
    persistPortalNavMode(mode);
  };

  const { partner } = usePartnerSession();
  const openTasks = useMemo(() => {
    if (!partner) return 0;
    const tasks = listTasksByPartner(partner.id);
    return tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  }, [partner, storeVersion]);
  const unread = useMemo(() => {
    if (!partner) return 0;
    return unreadCount({ partnerId: partner.id, audience: 'partner' });
  }, [partner, storeVersion]);

  const isActivePath = (path: string) => isPortalNavPathActive(pathname, path);

  const isNavLocked = (path: string, requiredKey: string | null) => {
    if (!partner || !requiredKey) return false;
    if (path === '/portal/disputes' || path.startsWith('/portal/letters')) {
      return !hasEntitlement(partner.id, ENTITLEMENT_KEYS.disputes) && !hasEntitlement(partner.id, ENTITLEMENT_KEYS.letters);
    }
    return !hasEntitlement(partner.id, requiredKey);
  };

  if (navMode === 'simple' || isCompactViewport) {
    return (
      <div className="mb-8 space-y-3" data-fc-portal-nav="simple">
        <FinelyPortalSimpleNav onShowFullNav={() => setMode('full')} />
      </div>
    );
  }

  const moreActive = PORTAL_MORE_LINKS.some((l) => isActivePath(l.path));
  const letterFlowActive =
    pathname.startsWith('/portal/disputes') || pathname.startsWith('/portal/letters');

  return (
    <nav className="mb-8" data-fc-portal-nav="full">
      <div className="-mx-2 overflow-x-auto md:overflow-visible">
        <div className={`${FINELY_OS_PORTAL_NAV_STRIP} min-w-max md:min-w-0 pb-2 px-2`}>
          {PORTAL_PRIMARY_LINKS.map(({ path, label, icon: Icon }) => {
            const active = isActivePath(path);
            const requiredKey = partner ? entitlementForPath(path) : null;
            const locked = isNavLocked(path, requiredKey);
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(locked ? '/portal/billing' : path)}
                className={`${finelyOsViewTab(active, 'emerald')} ${locked && !active ? '!opacity-45' : ''}`}
                title={locked ? `${label} (locked)` : label}
                aria-label={locked ? `${label} (locked — upgrade in billing)` : label}
                aria-current={active ? 'page' : undefined}
              >
                {locked ? <Lock size={12} /> : <Icon size={12} />}
                <span className="inline-flex items-center gap-2">
                  {label}
                  {path === '/portal/projects' && (openTasks > 0 || unread > 0) && (
                    <span className="inline-flex items-center gap-1">
                      {openTasks > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest ${
                            active ? 'bg-white/25 text-white' : 'border border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-200'
                          }`}
                        >
                          {openTasks}
                        </span>
                      )}
                      {unread > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest ${
                            active ? 'bg-white/25 text-white' : 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
                          }`}
                        >
                          {unread}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </button>
            );
          })}

          <details className="relative inline-block">
            <summary
              className={`list-none cursor-pointer ${finelyOsViewTab(moreActive, 'sky')}`}
              title="More"
              aria-label="More portal navigation links"
            >
              More <ChevronDown size={12} />
            </summary>
            <div className={`absolute right-0 mt-2 w-64 ${FINELY_OS_SIDE_RAIL_SHELL} !p-2 !max-h-none shadow-2xl z-50`}>
              {PORTAL_MORE_LINKS.map(({ path, label, icon: Icon }) => {
                const active = isActivePath(path);
                const requiredKey = partner ? entitlementForPath(path) : null;
                const locked = isNavLocked(path, requiredKey);
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => navigate(locked ? '/portal/billing' : path)}
                    className={`w-full text-left ${finelyOsViewTab(active, 'emerald')} !w-full justify-start mb-1 last:mb-0 ${
                      locked && !active ? '!opacity-45' : ''
                    }`}
                    title={locked ? `${label} (locked)` : label}
                    aria-label={locked ? `${label} (locked — upgrade in billing)` : label}
                    aria-current={active ? 'page' : undefined}
                  >
                    {locked ? <Lock size={12} /> : <Icon size={12} />}
                    {label}
                  </button>
                );
              })}
            </div>
          </details>
        </div>
      </div>
      {letterFlowActive ? (
        <div className="-mx-2 overflow-x-auto md:overflow-visible">
          <div className={`${FINELY_OS_PORTAL_NAV_STRIP} mt-2 min-w-max md:min-w-0 px-2 pb-2`}>
          {PORTAL_LETTER_FLOW_LINKS.map(({ path, label }) => {
            const active =
              path === '/portal/disputes'
                ? pathname.startsWith('/portal/disputes')
                : pathname === path || pathname.startsWith(`${path}/`);
            const requiredKey = entitlementForPath(path);
            const locked = isNavLocked(path, requiredKey);
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(locked ? '/portal/billing' : path)}
                className={`${finelyOsViewTab(active, 'amber')} ${locked && !active ? '!opacity-45' : ''}`}
                title={locked ? `${label} (locked)` : label}
                aria-current={active ? 'page' : undefined}
              >
                {locked ? <Lock size={12} /> : null}
                {label}
              </button>
            );
          })}
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 mt-1">
        <p className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case hidden md:block`}>
          Dispute letters includes drafts, cases, and vault · Partner workspace navigation
        </p>
        <button
          type="button"
          onClick={() => setMode('simple')}
          className="fc-portal-nav-mode-toggle text-[10px] font-black uppercase tracking-widest text-white/55 hover:text-white transition-colors"
        >
          Simple nav
        </button>
      </div>
    </nav>
  );
}
