import React, { useState } from 'react';
import { Newspaper } from 'lucide-react';
import type { CmoBrief } from '../../domain/cmoPhase3';
import { listCmoBriefs } from '../../data/cmoPhase3Repo';
import { generateDailyCmoBrief } from '../../lib/cmoPhase3/cmoBriefScheduler';

export function CmoBriefingPanel() {
  const [briefs, setBriefs] = useState<CmoBrief[]>(() => listCmoBriefs());
  const create = () => {
    generateDailyCmoBrief();
    setBriefs(listCmoBriefs());
  };
  const latest = briefs[0];
  return (
    <section className="fc-panel p-5 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">Executive Briefs</p>
          <h2 className="text-2xl font-semibold text-white">Morning orders and weekly kill/scale list</h2>
        </div>
        <button type="button" className="fc-button-brand inline-flex items-center gap-2" onClick={create}><Newspaper className="h-4 w-4" /> Generate brief</button>
      </div>
      {latest ? (
        <div className="fc-card p-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{latest.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{latest.summary}</p>
          </div>
          <List title="Today orders" items={latest.todayOrders} />
          <div className="grid gap-4 lg:grid-cols-2">
            <List title="Scale" items={latest.scaleList} />
            <List title="Kill" items={latest.killList} />
          </div>
        </div>
      ) : <div className="fc-card p-6 text-sm text-slate-300">No brief yet. Generate one and make the CMO come to the staff meeting prepared.</div>}
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-amber-100">{title}</h4>
      <ul className="mt-2 space-y-2 text-sm text-slate-300">
        {items.map((item) => <li key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">{item}</li>)}
      </ul>
    </div>
  );
}
