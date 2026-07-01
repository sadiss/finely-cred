import React from 'react';
import { CmoPhase3Cockpit } from '../../components/cmo/CmoPhase3Cockpit';

export default function AdminCmoAutopilotPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
      <section className="fc-panel p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">Finely Cred Growth OS</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">CMO Autopilot Phase 3</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
          The Phase 3 layer turns the CMO from cockpit into operator: playbooks, 200-lead/day math, safe execution gates,
          experiments, executive briefs, site/watch integration health, and approval-first publishing infrastructure.
        </p>
      </section>
      <CmoPhase3Cockpit />
    </main>
  );
}
