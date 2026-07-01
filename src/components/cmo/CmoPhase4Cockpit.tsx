import React from 'react';
import { CmoAccountHealthPanel } from './CmoAccountHealthPanel';
import { CmoAccountOpsPanel } from './CmoAccountOpsPanel';
import { CmoPublishingQueuePanel } from './CmoPublishingQueuePanel';

export function CmoPhase4Cockpit() {
  return (
    <div className="space-y-6">
      <CmoAccountOpsPanel />
      <CmoPublishingQueuePanel />
      <CmoAccountHealthPanel />
    </div>
  );
}
