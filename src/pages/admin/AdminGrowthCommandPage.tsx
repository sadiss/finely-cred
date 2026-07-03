import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { GrowthCommandDepartmentPage } from '../../features/studioCommandOs/GrowthCommandDepartmentPage';

export default function AdminGrowthCommandPage() {
  return (
    <PageShell
      badge="Admin"
      title="Growth Command"
      subtitle="Promote, nurture, and communicate — full-depth department workspaces behind every lane."
      back={{ to: -1 }}
    >
      <GrowthCommandDepartmentPage />
    </PageShell>
  );
}
