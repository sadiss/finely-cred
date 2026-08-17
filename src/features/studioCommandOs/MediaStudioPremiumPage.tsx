import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { ContentStudioDepartmentPage } from './ContentStudioDepartmentPage';

type MediaStudioPremiumPageProps = {
  /** When true, skip outer PageShell (embedded in Marketing Department hub). */
  embedded?: boolean;
};

export function MediaStudioPremiumPage({ embedded = false }: MediaStudioPremiumPageProps) {
  if (embedded) {
    return <ContentStudioDepartmentPage />;
  }
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
