import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { CommsCommandLibrary } from './CommsCommandLibrary';

export function CommsStudioPremiumPage() {
  return (
    <PageShell badge="Admin" title="Communication Command Hub" subtitle="Template libraries, nurture drafts, and campaign messages as spacious command decks instead of side-by-side clutter." back={{ to: -1 }}>
      <CommsCommandLibrary />
    </PageShell>
  );
}
