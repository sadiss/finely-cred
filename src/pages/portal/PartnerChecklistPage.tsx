import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { PartnerRestoreWorkspace } from '../../features/partner/PartnerRestoreWorkspace';
import {
  FINELY_OS_PAGE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PRIMARY_BTN,
} from '../../features/os/finelyOsLightUi';

export default function PartnerChecklistPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();

  return (
    <PageShell
      badge="Partner Portal"
      title="Personal Credit Restore"
      subtitle="Your complete restore sequence — reports, findings, evidence, disputes, letters, and vault — with one clear next step."
    >
      {!partner ? (
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
            No partner profile found for this account. If you are an admin, use Partner Management to pick a partner.
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <PartnerRestoreWorkspace partner={partner} showTours showDock />
      )}
    </PageShell>
  );
}
