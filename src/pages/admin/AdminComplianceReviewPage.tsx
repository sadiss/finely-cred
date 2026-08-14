import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { ContentComplianceReviewPanel } from '../../components/compliance/ContentComplianceReviewPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FINELY_OS_COMPACT_PAGE } from '../../features/os/finelyOsLightUi';

export default function AdminComplianceReviewPage() {
  return (
    <PageShell
      badge="Admin"
      title="Compliance review gate"
      subtitle="Approve doctrine-derived public content — articles, state pages, outcome wizards — before their routes ship."
    >
      <div className={FINELY_OS_COMPACT_PAGE}>
        <ContentComplianceReviewPanel />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
