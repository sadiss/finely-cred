import React, { useState } from 'react';
import { addCmoBudgetAllocation, loadCmoPhase5State } from '../../data/cmoPhase5Repo';
import { buildCmoBudgetAllocation } from '../../lib/cmoPhase5/cmoBudgetAllocator';

export function CmoBudgetAllocatorPanel() {
  const [state, setState] = useState(loadCmoPhase5State());
  const [budget, setBudget] = useState(0);
  const allocation = state.budgetAllocations[0];

  function allocate() {
    const next = addCmoBudgetAllocation(buildCmoBudgetAllocation(state.channelModels, budget));
    setState(next);
  }

  return (
    <section className="fc-panel p-5 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">Spend discipline</p>
        <h2 className="text-2xl font-semibold text-white">CMO Budget + Effort Allocator</h2>
        <p className="mt-1 text-sm text-slate-300">Allocate money and effort to the channels with proof. No cowboy spending. No casino keyboard.</p>
      </div>
      <div className="fc-card p-4 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="number"
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none md:max-w-xs"
          value={budget}
          onChange={(event) => setBudget(Number(event.target.value))}
          min={0}
          placeholder="Daily budget"
        />
        <button type="button" className="fc-button-brand" onClick={allocate}>Allocate</button>
      </div>
      {allocation ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {allocation.allocations.map((item) => (
            <article key={item.channel} className="fc-card p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">{item.channel}</h3>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{item.decision}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">Budget: ${item.budget} · Effort: {item.effortUnits}</p>
              <p className="mt-2 text-xs text-slate-400">{item.reason}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
