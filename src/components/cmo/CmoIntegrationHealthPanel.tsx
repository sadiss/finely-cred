import React, { useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import type { CmoIntegrationHealth } from '../../domain/cmoPhase3';
import { listCmoIntegrationHealth } from '../../data/cmoPhase3Repo';
import { checkCmoIntegrationHealth } from '../../lib/cmoPhase3/cmoIntegrationHealth';

export function CmoIntegrationHealthPanel() {
  const [items, setItems] = useState<CmoIntegrationHealth[]>(() => listCmoIntegrationHealth());
  const run = () => setItems(checkCmoIntegrationHealth());
  return (
    <section className="fc-panel p-5 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">Integration Health</p>
          <h2 className="text-2xl font-semibold text-white">Does the CMO actually have hands everywhere?</h2>
          <p className="mt-2 text-sm text-slate-300">Checks Lead Intel, CRM, Comms, Media, Scheduler, Analytics, Supabase, Social Publishers, Site Watch, and CoOwner wiring.</p>
        </div>
        <button type="button" className="fc-button-soft inline-flex items-center gap-2" onClick={run}><RefreshCw className="h-4 w-4" /> Check wiring</button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="fc-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-amber-300" /><h3 className="font-semibold text-white">{item.integration.replaceAll('_', ' ')}</h3></div>
              <span className={`rounded-full px-2 py-1 text-xs ${item.status === 'connected' ? 'bg-emerald-400/10 text-emerald-100' : item.status === 'missing' ? 'bg-rose-400/10 text-rose-100' : 'bg-amber-300/10 text-amber-100'}`}>{item.status}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{item.message}</p>
            {item.requiredNextStep ? <p className="mt-2 text-xs text-slate-500">Next: {item.requiredNextStep}</p> : null}
          </div>
        ))}
        {!items.length ? <div className="fc-card p-6 text-sm text-slate-300">Run a health check. No poking around with a blindfold; that is not strategy, that is slapstick.</div> : null}
      </div>
    </section>
  );
}
