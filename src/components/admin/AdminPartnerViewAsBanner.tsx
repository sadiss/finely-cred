import React, { useSyncExternalStore } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { isStaffEmail } from '../../auth/staffIdentity';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import {
  exitAdminPartnerView,
  readAdminPartnerOverrideId,
  subscribeAdminPartnerOverride,
} from '../../lib/adminPartnerViewAs';
import './AdminPartnerViewAsBanner.css';

function getOverrideSnapshot() {
  return readAdminPartnerOverrideId();
}

function usePartnerViewAsState() {
  const auth = useAuth();
  const { partner, refresh } = usePartnerSession();
  const location = useLocation();
  const navigate = useNavigate();
  const overrideId = useSyncExternalStore(subscribeAdminPartnerOverride, getOverrideSnapshot, () => '');

  const email = (auth.user?.email || '').trim();
  const isStaff = email ? isStaffEmail(email) : false;
  const onPortal = location.pathname.startsWith('/portal');
  const visible = Boolean(isStaff && onPortal);
  const partnerLabel = partner?.profile?.fullName?.trim() || partner?.profile?.email?.trim() || overrideId;

  const exitView = () => {
    exitAdminPartnerView(navigate, overrideId || partner?.id);
    refresh();
  };

  return { visible, partnerLabel, overrideId, exitView };
}

/** Compact control for the product header. */
export function AdminPartnerViewAsChip() {
  const { visible, partnerLabel, overrideId, exitView } = usePartnerViewAsState();
  if (!visible) return null;

  return (
    <div className="fc-wlp-viewas-row">
      <div className="fc-wlp-viewas-chip" role="status" aria-label="Viewing the partner portal as staff">
        <ShieldAlert size={14} aria-hidden="true" />
        <span className="fc-wlp-viewas-chip-copy">
          {overrideId || partnerLabel ? (
            <>
              Viewing as <strong>{partnerLabel || 'partner'}</strong>
            </>
          ) : (
            'Staff preview'
          )}
        </span>
        <button type="button" className="fc-wlp-viewas-chip-btn" onClick={exitView}>
          <ArrowLeft size={13} aria-hidden="true" />
          Back to admin
        </button>
      </div>
    </div>
  );
}

/** Always-visible return path while staff is inside a partner portal. */
export function AdminPartnerViewAsBanner() {
  const { visible, partnerLabel, overrideId, exitView } = usePartnerViewAsState();
  if (!visible) return null;

  return (
    <div className="fc-admin-viewas-banner" role="status">
      <div className="fc-admin-viewas-banner-inner">
        <p className="fc-admin-viewas-banner-copy">
          <ShieldAlert size={20} aria-hidden="true" />
          <span>
            {overrideId || partnerLabel ? (
              <>
                Viewing partner portal as <strong>{partnerLabel || 'this partner'}</strong>
              </>
            ) : (
              'You are in the partner portal'
            )}
          </span>
        </p>
        <button type="button" className="fc-admin-viewas-banner-btn" onClick={exitView}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back to admin
        </button>
      </div>
    </div>
  );
}
