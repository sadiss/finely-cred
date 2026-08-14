import React, { useEffect, useMemo, useState } from 'react';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listTasksByPartner } from '../../data/tasksRepo';
import { unreadCount } from '../../data/notificationsRepo';
import { persistPortalNavMode, readPortalNavMode, type FinelyPortalNavMode } from '../../lib/finelyPortalNavMode';
import { useIsMobileOrTabletViewport } from '../../hooks/useMediaQuery';
import { PartnerPortalStickyTabs } from './PartnerPortalStickyTabs';
import { FinelyPortalSimpleNav } from '../../features/os/FinelyPortalSimpleNav';
import { FINELY_OS_ENTITY_SUBLABEL } from '../../features/os/finelyOsLightUi';

export function PartnerPortalNav() {
  const [storeVersion, setStoreVersion] = useState(0);
  const [navMode, setNavMode] = useState<FinelyPortalNavMode>(() => readPortalNavMode());

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const isCompactViewport = useIsMobileOrTabletViewport();
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

  const setMode = (mode: FinelyPortalNavMode) => {
    setNavMode(mode);
    persistPortalNavMode(mode);
  };

  if (navMode === 'simple') {
    return (
      <div className="mb-6 space-y-2" data-fc-portal-nav="simple">
        <FinelyPortalSimpleNav onShowFullNav={() => setMode('full')} />
      </div>
    );
  }

  return (
    <nav className="mb-6 fc-portal-nav-structured" data-fc-portal-nav="full">
      <PartnerPortalStickyTabs compact={isCompactViewport} />
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 mt-2">
        <p className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case hidden sm:block`}>
          {openTasks > 0 || unread > 0 ? (
            <>
              {openTasks > 0 ? `${openTasks} open task${openTasks === 1 ? '' : 's'}` : null}
              {openTasks > 0 && unread > 0 ? ' · ' : null}
              {unread > 0 ? `${unread} unread` : null}
            </>
          ) : (
            'Overview · reports · disputes · tasks'
          )}
        </p>
        <button
          type="button"
          onClick={() => setMode('simple')}
          className="fc-portal-nav-mode-toggle text-[10px] font-black uppercase tracking-widest text-white/45 hover:text-white transition-colors"
        >
          Classic nav
        </button>
      </div>
    </nav>
  );
}
