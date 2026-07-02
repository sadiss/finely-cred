import React, { useMemo } from 'react';
import { MapPinned, TrendingUp } from 'lucide-react';
import { buildGeoWarRoomSummary } from './staffGeoEngine';
import { STAFF_MEMBERS } from './staffDirectory';
import { StaffAvatar } from './StaffAvatar';

export function StaffGeoWarRoomPanel({ activeIds }: { activeIds?: string[] }) {
  const summary = useMemo(() => buildGeoWarRoomSummary(activeIds), [activeIds]);

  return (
    <div className="rounded-[34px] border border-white/10 bg-black/30 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-cyan-300 text-[10px] uppercase tracking-widest font-black"><MapPinned size={16} /> Geo War Room</div>
          <h2 className="mt-2 text-2xl font-black text-white">Make city growth real and usable</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/60">Each city has staff owners, active funnels, zip focus, source mix, blockers, and next moves. This gives Geo Commander a real board instead of vague city names.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="text-[9px] uppercase tracking-widest text-white/35">Daily target</div><div className="text-xl font-black text-white">{summary.totals.dailyTarget}</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="text-[9px] uppercase tracking-widest text-white/35">Overnight</div><div className="text-xl font-black text-white">{summary.totals.overnightTarget}</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="text-[9px] uppercase tracking-widest text-white/35">Ready</div><div className="text-xl font-black text-white">{summary.totals.ready}</div></div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {summary.scores.map(({ cluster, readiness, leadPotential, missingPieces, ownerNames, recommendedMission }) => (
          <div key={cluster.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-white font-black text-xl">{cluster.city}, {cluster.state}</div>
                <div className="mt-1 text-xs text-white/45">{cluster.timezone} • zips {cluster.zipFocus.slice(0, 4).join(', ')}</div>
              </div>
              <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-right">
                <div className="text-[9px] uppercase tracking-widest text-cyan-100/60">Readiness</div>
                <div className="text-2xl font-black text-cyan-100">{readiness}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[9px] uppercase tracking-widest text-white/35">Potential</div><div className="mt-1 text-lg font-black text-white">{leadPotential}</div></div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[9px] uppercase tracking-widest text-white/35">Daily</div><div className="mt-1 text-lg font-black text-white">{cluster.dailyTarget}</div></div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[9px] uppercase tracking-widest text-white/35">Overnight</div><div className="mt-1 text-lg font-black text-white">{cluster.overnightTarget}</div></div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {cluster.assignedStaffIds.map((id) => {
                const s = STAFF_MEMBERS.find((x) => x.id === id);
                return s ? <StaffAvatar key={id} staff={s} size="sm" /> : null;
              })}
              <div className="min-w-[180px] text-xs text-white/55">Owners: {ownerNames.join(', ')}</div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Source mix</div>
              {cluster.sourceMix.map((s) => (
                <div key={s.source} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3 text-xs"><span className="text-white/75">{s.source}</span><span className={s.health === 'good' ? 'text-emerald-200' : s.health === 'blocked' ? 'text-rose-200' : 'text-amber-200'}>{s.currentPct}% / {s.targetPct}% • {s.health}</span></div>
                  <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-300" style={{ width: `${Math.min(100, Math.max(3, s.currentPct))}%` }} /></div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="inline-flex items-center gap-2 text-amber-100 font-bold"><TrendingUp size={15} /> Recommended mission: {recommendedMission.replace(/_/g, ' ')}</div>
              <div className="mt-2 space-y-1 text-xs text-amber-100/75">{missingPieces.slice(0, 4).map((m) => <div key={m}>• {m}</div>)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Next moves</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">{summary.nextMoves.map((m) => <div key={m} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/65">{m}</div>)}</div>
      </div>
    </div>
  );
}
