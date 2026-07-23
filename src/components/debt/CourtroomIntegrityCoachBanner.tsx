import React from 'react';
import { getCourtroomIntegrityPreamble } from '../../legal/courtroomPackBodies';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';

export function CourtroomIntegrityCoachBanner() {
  const lines = getCourtroomIntegrityPreamble().split('\n');
  const coachLine = lines[1] || lines[0];
  return (
    <div className="sticky top-2 z-10 space-y-2">
      <FinelyOsAlertBanner tone="warning" message={`Integrity coach: ${coachLine}`} />
      <p className="text-[10px] text-center text-white/40">Results vary · not legal advice · educational templates only</p>
    </div>
  );
}
