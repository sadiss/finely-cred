import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { ChevronUp, Eye } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import {
  allRolePreviewEntries,
  parseRolePreviewRole,
  rolePreviewEntry,
  type RolePreviewRole,
} from '../../config/rolePreviewCatalog';
import {
  activateRolePreview,
  clearActiveRolePreview,
  isAdminChromeRoute,
  readActiveRolePreview,
  subscribeAdminRolePreview,
} from '../../lib/adminRolePreview';
import { canUseAdminRolePreview } from '../../lib/adminRolePreviewAccess';
import { readAdminPartnerOverrideId, subscribeAdminPartnerOverride } from '../../lib/adminPartnerViewAs';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

function getRoleSnapshot() {
  return readActiveRolePreview();
}

function getPartnerOverrideSnapshot() {
  return readAdminPartnerOverrideId();
}

/**
 * Admin-only role switcher — lives on `/admin` routes, collapsed by default.
 * Never mounts on public marketing pages (login, home, pricing, etc.).
 */
export function AdminRolePreviewSwitcher() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { partner } = usePartnerSession();
  /** Stay collapsed until the admin explicitly opens it — never auto-expand on load. */
  const [collapsed, setCollapsed] = useState(true);

  const activeRole = useSyncExternalStore(subscribeAdminRolePreview, getRoleSnapshot, () => null);
  const partnerOverrideId = useSyncExternalStore(subscribeAdminPartnerOverride, getPartnerOverrideSnapshot, () => '');

  const email =
    auth.user?.email ||
    ((auth.user as { user_metadata?: { email?: string } } | null)?.user_metadata?.email ?? '');

  const allowed = useMemo(
    () => canUseAdminRolePreview({ userId: auth.user?.id, email }),
    [auth.user?.id, email],
  );

  const entries = useMemo(() => allRolePreviewEntries(), []);

  const onAdminRoute = isAdminChromeRoute(location.pathname);

  if (!allowed || !onAdminRoute) return null;

  const partnerLabel =
    partner?.profile?.fullName?.trim() || partner?.profile?.email?.trim() || partnerOverrideId || null;

  const currentLabel = partnerOverrideId && partnerLabel
    ? `Partner · ${partnerLabel}`
    : activeRole
      ? rolePreviewEntry(activeRole).shortLabel
      : 'Admin';

  const switchRole = (role: RolePreviewRole) => {
    const path = activateRolePreview(role);
    navigate(path);
    setCollapsed(true);
  };

  const goAdmin = () => {
    clearActiveRolePreview();
    navigate('/admin');
  };

  const goPartnerPortal = () => {
    switchRole('partner');
  };

  const openStudio = () => {
    const role = activeRole ?? parseRolePreviewRole(new URLSearchParams(location.search).get('role'));
    navigate(rolePreviewEntry(role).studioPath);
  };

  if (collapsed) {
    return (
      <div className="fixed bottom-4 left-4 z-[108] pointer-events-none">
        <button
          type="button"
          className={`${FINELY_OS_SECONDARY_BTN} pointer-events-auto shadow-2xl`}
          onClick={() => setCollapsed(false)}
          aria-expanded={false}
          aria-label="Open role preview switcher"
        >
          <Eye size={16} aria-hidden="true" />
          Roles · {currentLabel}
          <ChevronUp size={14} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-[108] pointer-events-none w-[min(100vw-2rem,28rem)]"
      role="region"
      aria-label="Role preview switcher"
    >
      <div className="pointer-events-auto rounded-2xl border border-violet-500/35 bg-[#0b1220]/95 backdrop-blur-xl p-4 lg:p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Role preview · admin only</div>
            <div className="text-base font-extrabold text-white mt-1">Now viewing: {currentLabel}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={openStudio}>
              <Eye size={14} /> Role studio
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={goAdmin}>
              Admin home
            </button>
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => setCollapsed(true)}
              aria-label="Collapse role switcher"
            >
              <ChevronUp size={14} className="rotate-180" />
            </button>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-2 max-h-[min(40vh,16rem)] overflow-y-auto overscroll-contain pr-1"
          role="tablist"
          aria-label="Product roles"
        >
          {entries.map((entry) => {
            const selected =
              entry.role === 'partner'
                ? Boolean(partnerOverrideId) || activeRole === 'partner'
                : entry.role === 'admin'
                  ? !activeRole && !partnerOverrideId
                  : activeRole === entry.role;
            return (
              <button
                key={entry.role}
                type="button"
                role="tab"
                aria-selected={selected}
                className={finelyOsViewTab(selected, entry.accent)}
                onClick={() => (entry.role === 'admin' ? goAdmin() : switchRole(entry.role))}
              >
                {entry.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="text-sm font-semibold text-white/70 max-w-2xl">
            Jump between product lanes from admin. For a specific partner&apos;s data, use{' '}
            <span className="text-white font-extrabold">See what this partner sees</span> on their admin record.
          </p>
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={goPartnerPortal}>
            Partner portal
          </button>
        </div>
      </div>
    </div>
  );
}
