import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { AutomationStudioDepartmentPage } from './AutomationStudioDepartmentPage';

export function AutomationStudioPremiumPage() {
  return (
    <PageShell
      badge="Admin"
      title="Automation Studio"
      subtitle="Scenario blueprints, visual flow builder, and the full trigger & recipe catalog."
      back={{ to: -1 }}
    >
      <AutomationStudioDepartmentPage />
    </PageShell>
  );
}
