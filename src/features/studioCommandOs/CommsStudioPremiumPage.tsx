import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { CommsStudioDepartmentPage } from './CommsStudioDepartmentPage';

export function CommsStudioPremiumPage() {
  return (
    <PageShell
      badge="Admin"
      title="Communication Command Hub"
      subtitle="Inbox, compose, templates, sequences, and campaigns — unified department layout."
      back={{ to: -1 }}
    >
      <CommsStudioDepartmentPage />
    </PageShell>
  );
}
