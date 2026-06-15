import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { CrmRoutingRulesPanel } from '../../features/crm/routing/CrmRoutingRulesPanel';
import { FINELY_OS_BACK_LINK } from '../../features/os/finelyOsLightUi';

export default function AdminCrmRoutingPage() {
  const navigate = useNavigate();
  return (
    <PageShell badge="Admin" title="CRM routing rules" subtitle="Auto-assign, stage moves, and tags when leads match conditions.">
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/admin/crm')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> CRM workspace
        </button>
        <CrmRoutingRulesPanel />
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}
