import React, { useSyncExternalStore } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { isStaffEmail } from '../../auth/staffIdentity';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import {
  clearAdminPartnerOverrideId,
  readAdminPartnerOverrideId,
  subscribeAdminPartnerOverride,
} from '../../lib/adminPartnerViewAs';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

function getOverrideSnapshot() {
  return readAdminPartnerOverrideId();
}

/** Shown on portal routes when an admin is viewing via local partner override. */
export function AdminPartnerViewAsBanner() {
  const auth = useAuth();
  const { partner, refresh } = usePartnerSession();
  const location = useLocation();
  const navigate = useNavigate();
  const overrideId = useSyncExternalStore(subscribeAdminPartnerOverride, getOverrideSnapshot, () => '');

  const email = (auth.user?.email || '').trim();
  const isStaff = email ? isStaffEmail(email) : false;

  if (!isStaff || !overrideId) return null;
  if (!location.pathname.startsWith('/portal') || location.pathname.startsWith('/portal/select-partner')) {
    return null;
  }

  const partnerLabel = partner?.profile?.fullName?.trim() || partner?.profile?.email?.trim() || overrideId;

  const exitView = () => {
    clearAdminPartnerOverrideId();
    refresh();
    navigate('/portal/select-partner', { replace: true });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[110] px-4 pt-3 pointer-events-none">
      <div className={`${FINELY_OS_NOTICE_WARN} pointer-events-auto space-y-2`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-fuchsia-200">
              <ShieldAlert size={16} aria-hidden="true" />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Admin · partner view</span>
            </div>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
              You are viewing the Partner Portal as{' '}
              <span className={FINELY_OS_ENTITY_VALUE}>{partnerLabel}</span>. Actions apply to this partner file.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/admin/partners/${overrideId}?tab=profile#admin-partner-access-panel`)}
              className={FINELY_OS_SECONDARY_BTN}
            >
              Admin record
            </button>
            <button type="button" onClick={exitView} className={FINELY_OS_SECONDARY_BTN} title="Clear partner override">
              <X size={14} aria-hidden="true" /> Exit partner view
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
