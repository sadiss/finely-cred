import React from 'react';
import { MapPinned } from 'lucide-react';
import { getHumanStaffAgent } from './humanStaffDirectory';
import { HumanStaffAvatar } from './HumanStaffAvatar';

const cityBoards = [
  { id: 'dallas', city: 'Dallas', state: 'TX', readiness: 82, owners: ['geo_commander', 'scout_supreme', 'appointment_architect'], focus: ['business credit', 'funding readiness', 'credit specialist recruiting'], blockers: ['needs 2 more local proof blocks', 'retarget pixel not verified'], next: 'Publish city guide and route business owner leads to appointment flow.' },
  { id: 'houston', city: 'Houston', state: 'TX', readiness: 74, owners: ['geo_commander', 'local_news_radar', 'pipeline_titan'], focus: ['business funding', 'affiliate partners', 'AU sellers'], blockers: ['source mix thin on partner referrals'], next: 'Run partner recruiting sprint and create local source board.' },
  { id: 'atlanta', city: 'Atlanta', state: 'GA', readiness: 69, owners: ['cmo_prime', 'goldframe', 'liora_lifecycle'], focus: ['agency partners', 'credit repair guide', 'events'], blockers: ['lead magnet page needs premium rebuild'], next: 'Assign Goldframe to page upgrade and Liora to nurture.' },
  { id: 'phoenix', city: 'Phoenix', state: 'AZ', readiness: 61, owners: ['scout_supreme', 'night_owl_intel', 'analytics_beast'], focus: ['credit specialist recruiting', 'business credit'], blockers: ['need more local queries', 'no city-specific content'], next: 'Expand query pool and generate 10 local content hooks.' },
  { id: 'charlotte', city: 'Charlotte', state: 'NC', readiness: 58, owners: ['pr_sentinel', 'local_news_radar', 'partner_recruiter'], focus: ['PR authority', 'partner recruiting', 'funding readiness'], blockers: ['PR list not built', 'tracking links missing'], next: 'Build authority outreach list and partner route.' },
];

export function HumanStaffGeoOpsPanel() {
  return (
    <div className="rounded-[30px] border border-white/10 bg-black/25 p-5 space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 text-amber-300"><MapPinned size={18} /><span className="text-[10px] font-black uppercase tracking-widest">Geo staff war room</span></div>
        <h2 className="mt-2 text-2xl font-black text-white">Make every city board real, staffed, and actionable.</h2>
        <p className="mt-2 text-sm text-white/55 max-w-3xl">Geo is now displayed as city readiness, assigned staff, focus funnels, blockers, and next moves. The point is to stop adding city names without an execution path.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {cityBoards.map((board) => (
          <div key={board.id} className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="text-2xl font-black text-white">{board.city}, {board.state}</div><div className="mt-1 text-xs text-white/40">Readiness {board.readiness}%</div></div>
              <div className="h-14 w-14 rounded-2xl border border-white/10 bg-black/25 grid place-items-center text-lg font-black text-amber-200">{board.readiness}</div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-amber-500" style={{ width: `${board.readiness}%` }} /></div>
            <div className="mt-4 flex flex-wrap gap-2">{board.owners.map((id) => { const agent = getHumanStaffAgent(id as any); return <div key={id} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2"><HumanStaffAvatar agent={agent} size="sm" /><span className="text-xs font-bold text-white/70">{agent.name}</span></div>; })}</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Focus funnels</div><ul className="mt-2 space-y-1 text-sm text-white/60 list-disc pl-4">{board.focus.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Blockers</div><ul className="mt-2 space-y-1 text-sm text-white/60 list-disc pl-4">{board.blockers.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100"><span className="font-black">Next move:</span> {board.next}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
