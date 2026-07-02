import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { ContentStudioDepartmentPage } from './ContentStudioDepartmentPage';

export function MediaStudioPremiumPage() {
  return (
    <PageShell
      badge="Admin"
      title="Content Studio Department"
      subtitle="Professional production floor for research, scripts, design, voice, video, e-books, assets, reviews, and publishing across Finely Cred."
      back={{ to: -1 }}
    >
      <ContentStudioDepartmentPage />
    </PageShell>
  );
}
