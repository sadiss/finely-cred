import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import CrmSequenceBuilder from '../../features/crm/sequences/CrmSequenceBuilder';

import { FINELY_OS_BACK_LINK } from '../../features/os/finelyOsLightUi';

export default function AdminCrmSequencesPage() {
  const navigate = useNavigate();
  return (
    <PageShell badge="Admin" title="CRM sequences" subtitle="Visual follow-up builder — wait → email → task → stage move.">
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/admin/crm')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> CRM workspace
        </button>
        <CrmSequenceBuilder />
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}
