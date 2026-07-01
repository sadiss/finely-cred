import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { CmoUnifiedCommandCenter } from '../../components/cmo/CmoUnifiedCommandCenter';

export default function AdminCmoCommandPage() {
  return (
    <PageShell
      badge="Admin"
      title="CMO Command"
      subtitle="Unified growth OS — site watch, staff directives, autopilot runs, accounts, publishing, scale intelligence, and safe approval gates."
    >
      <CmoUnifiedCommandCenter />
    </PageShell>
  );
}
