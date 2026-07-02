import React from 'react';
import { defaultGeoCells } from './marketingIntelligenceVault';
import { sovereignAgents } from './sovereignAgentDirectory';

export function SovereignGeoIntelligencePanel() {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-white/[0.04] to-blue-500/10 p-6">
        <div className="text-[10px] uppercase tracking-widest text-emerald-200 font-black">Geo intelligence</div>
        <h2 className="mt-2 text-3xl font-black text-white">City cells with owners, blockers, source mix, and next moves</h2>
        <p className="mt-3 text-sm text-white/65 max-w-4xl">This makes geo functionality usable. Each city has target offers, owners, readiness, blockers, source mix, and action steps instead of a vague map or list.</p>
      </div>
      <div className="grid xl:grid-cols-2 gap-5">
        {defaultGeoCells.map((cell) => (
          <div key={cell.id} className="rounded-3xl border border-white/10 bg-black/30 p-5 space-y-4">
            <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] uppercase tracking-widest text-white/40 font-black">{cell.state} / {cell.priority}</div><h3 className="mt-2 text-2xl font-black text-white">{cell.city}</h3></div><div className="rounded-2xl bg-emerald-400 text-black px-3 py-2 text-sm font-black">{cell.readinessScore}%</div></div>
            <div className="grid md:grid-cols-2 gap-3">
              <Box title="Focus offers" items={cell.focusOffers} />
              <Box title="Source mix" items={cell.sourceMix} />
              <Box title="Owners" items={cell.assignedAgentIds.map((id) => sovereignAgents.find((a) => a.id === id)?.name ?? id)} />
              <Box title="Overnight target" items={[`${cell.leadTargetOvernight} leads`]} />
            </div>
            <Box title="Next moves" items={cell.nextMoves} />
            {cell.blockers.length > 0 && <Box title="Blockers" items={cell.blockers} warn />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Box({ title, items, warn }: { title: string; items: string[]; warn?: boolean }) {
  return <div className={`rounded-2xl border ${warn ? 'border-amber-400/20 bg-amber-500/10' : 'border-white/10 bg-white/[0.03]'} p-4`}><div className="text-[10px] uppercase tracking-widest text-white/40 font-black">{title}</div><div className="mt-3 flex flex-wrap gap-2">{items.map((x) => <span key={x} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70">{x}</span>)}</div></div>;
}
