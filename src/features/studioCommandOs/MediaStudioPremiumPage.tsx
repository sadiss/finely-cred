import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { ContentStudioDepartmentPage } from './ContentStudioDepartmentPage';

export function MediaStudioPremiumPage() {
  return (
    <PageShell
      badge="Admin"
      title="Content Studio"
      subtitle="Super video generator, research, scripts, design, voice, e-books, review, and publish bridges."
      back={{ to: -1 }}
    >
      <ContentStudioDepartmentPage />
    </PageShell>
  );
}
