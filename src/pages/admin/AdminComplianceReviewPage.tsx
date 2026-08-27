import React from 'react';
import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';
import { useMappedAdminNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';
import { ContentComplianceReviewPanel } from '../../components/compliance/ContentComplianceReviewPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FINELY_OS_COMPACT_PAGE } from '../../features/os/finelyOsLightUi';

export default function AdminComplianceReviewPage({ embedded = false }: AdminEmbeddablePageProps = {}) {
  return (
    <AdminWorkstationFrame embedded={embedded} kind="compliance-review-workstation"
      badge="Admin"
      title="Compliance review gate"
      subtitle="Approve doctrine-derived public content — articles, state pages, outcome wizards — before their routes ship."
    >
      <div className={FINELY_OS_COMPACT_PAGE}>
        <ContentComplianceReviewPanel />
        {!embedded ? <FinelyOsPageFooter /> : null}
      </div>
    </AdminWorkstationFrame>
  );
}
