import React from 'react';
import { CmoBudgetAllocatorPanel } from './CmoBudgetAllocatorPanel';
import { CmoForecastPanel } from './CmoForecastPanel';
import { CmoScaleCommandPanel } from './CmoScaleCommandPanel';

export function CmoPhase5Cockpit() {
  return (
    <div className="space-y-6">
      <CmoScaleCommandPanel />
      <CmoBudgetAllocatorPanel />
      <CmoForecastPanel />
    </div>
  );
}
