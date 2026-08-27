import React, { useMemo, useSyncExternalStore } from 'react';
import { ChevronUp, Eye, ShieldAlert, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import {
  allRolePreviewEntries,
  rolePreviewEntry,
  type RolePreviewRole,
} from '../../config/rolePreviewCatalog';
import {
  activateRolePreview,
  clearActiveRolePreview,
  isRolePreviewLaneRoute,
  readActiveRolePreview,
  subscribeAdminRolePreview,
} from '../../lib/adminRolePreview';
import { canUseAdminRolePreview } from '../../lib/adminRolePreviewAccess';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

function getRoleSnapshot() {
  return readActiveRolePreview();
}

/**
 * Compact exit chip while an admin is browsing a non-admin product lane.
 * Never covers public marketing / login headers — those routes hide this entirely.
 */
export function AdminRolePreviewBanner() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const activeRole = useSyncExternalStore(subscribeAdminRolePreview, getRoleSnapshot, () => null);
  const [expanded, setExpanded] = React.useState(false);

  const email =
    auth.user?.email ||
    ((auth.user as { user_metadata?: { email?: string } } | null)?.user_metadata?.email ?? '');

  const allowed = useMemo(
    () => canUseAdminRolePreview({ userId: auth.user?.id, email }),
    [auth.user?.id, email],
  );

  const entries = useMemo(() => allRolePreviewEntries(), []);

  if (!allowed || !activeRole) return null;
  if (!isRolePreviewLaneRoute(location.pathname)) return null;

  const entry = rolePreviewEntry(activeRole);

  const exitPreview = () => {
    clearActiveRolePreview();
    navigate('/admin', { replace: true });
  };

  const openStudio = () => {
    navigate(entry.studioPath);
  };

  const switchRole = (role: RolePreviewRole) => {
    if (role === 'admin') {
      clearActiveRolePreview();
      navigate('/admin');
      return;
    }
    navigate(activateRolePreview(role));
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <div className="fixed bottom-4 left-4 z-[109] max-w-sm pointer-events-none">
        <button
          type="button"
          className={`${FINELY_OS_SECONDARY_BTN} pointer-events-auto shadow-2xl`}
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          aria-label="Open role preview switcher"
        >
          <ShieldAlert size={16} aria-hidden="true" />
          Roles · {entry.shortLabel}
          <ChevronUp size={14} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-[109] w-[min(100vw-2rem,28rem)] pointer-events-none"
      role="region"
      aria-label="Role preview banner"
    >
      <div className="pointer-events-auto rounded-2xl border border-violet-500/40 bg-[#0b1220]/95 backdrop-blur-xl p-4 lg:p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-violet-200">
              <ShieldAlert size={16} aria-hidden="true" />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Admin · role preview</span>
            </div>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
              Previewing as <span className={FINELY_OS_ENTITY_VALUE}>{entry.label}</span>. Not a live partner file.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className={FINELY_OS_SECONDARY_BTN}
            aria-label="Collapse role preview banner"
          >
            <ChevronUp size={14} className="rotate-180" />
          </button>
        </div>

        <div
          className="flex flex-wrap gap-2 max-h-[min(32vh,12rem)] overflow-y-auto overscroll-contain"
          role="tablist"
          aria-label="Product roles"
        >
          {entries.map((lane) => (
            <button
              key={lane.role}
              type="button"
              role="tab"
              aria-selected={lane.role === activeRole}
              className={finelyOsViewTab(lane.role === activeRole, lane.accent)}
              onClick={() => switchRole(lane.role)}
            >
              {lane.shortLabel}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          <button type="button" onClick={openStudio} className={FINELY_OS_SECONDARY_BTN}>
            <Eye size={14} aria-hidden="true" /> Role studio
          </button>
          <button type="button" onClick={exitPreview} className={FINELY_OS_SECONDARY_BTN} title="Exit role preview">
            <X size={14} aria-hidden="true" /> Exit
          </button>
        </div>
      </div>
    </div>
  );
}
