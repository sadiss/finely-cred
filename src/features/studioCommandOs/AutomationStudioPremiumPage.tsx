import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { AutomationCommandGrid } from './AutomationCommandGrid';

export function AutomationStudioPremiumPage() {
  return (
    <PageShell badge="Admin" title="Automation Studio Command Grid" subtitle="GoHighLevel-style blueprint gallery, stable automation grid, approval gates, and scenario-based install flow." back={{ to: -1 }}>
      <AutomationCommandGrid />
    </PageShell>
  );
}
