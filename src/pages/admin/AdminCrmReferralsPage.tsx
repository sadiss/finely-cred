import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { CrmReferralDashboard } from '../../features/crm/referrals/CrmReferralDashboard';
import { FINELY_OS_BACK_LINK, FINELY_OS_ENTITY_SUBLABEL } from '../../features/os/finelyOsLightUi';

export default function AdminCrmReferralsPage() {
  const navigate = useNavigate();
  return (
    <PageShell badge="Admin" title="Referral analytics" subtitle="Attribution, conversion, and pipeline value by promo code.">
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/admin/crm')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> CRM workspace
        </button>
        <CrmReferralDashboard />
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}
