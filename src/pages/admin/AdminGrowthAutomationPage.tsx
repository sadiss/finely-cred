import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyAutomationConsole } from '../../features/admin/FinelyAutomationConsole';

export default function AdminGrowthAutomationPage() {
  return (
    <PageShell
      badge="Admin"
      title="Growth Autopilot"
      subtitle="While you slept — find, nurture, scorecard, and exception review."
    >
      <FinelyAutomationConsole />
    </PageShell>
  );
}
