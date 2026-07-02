import React from 'react';
import { Activity, ExternalLink, Zap } from 'lucide-react';
import type { StaffMissionPlan } from './types';
import { StaffAvatar } from './StaffAvatar';

export function StaffWorkroomPanel({ missions }: { missions: StaffMissionPlan[] }) {
  return (
    <div className="rounded-[34px] border border-white/10 bg-black/30 p-6 space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 text-amber-300 text-[10px] uppercase tracking-widest font-black"><Activity size={16} /> Staff Workroom</div>
        <h2 className="mt-2 text-2xl font-black text-white">Current missions and handoffs</h2>
        <p className="mt-2 max-w-3xl text-sm text-white/60">This is where the system stops feeling mysterious. Every run has an owner, a department, first steps, and a handoff checklist.</p>
      </div>

      {missions.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/60">No staff missions yet. Create one from Mission Builder.</div>
      ) : (
        <div className="space-y-4">
          {missions.map((m) => (
            <div key={m.request.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  <StaffAvatar staff={m.leadOwner} size="lg" />
                  <div>
                    <div className="text-white font-black text-xl">{m.request.title}</div>
                    <div className="mt-1 text-sm text-amber-200/80">Lead owner: {m.leadOwner.name} • {m.systemOwnerLabel}</div>
                    <p className="mt-2 max-w-3xl text-sm text-white/60">{m.request.objective}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/55">{m.executionLane.replace(/_/g, ' ')}</div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="inline-flex items-center gap-2 text-white font-bold"><Zap size={14} className="text-amber-300" /> First steps</div>
                  <div className="mt-3 space-y-2">{m.firstThreeSteps.map((s) => <div key={s} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/65">{s}</div>)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-white font-bold">Support staff</div>
                  <div className="mt-3 space-y-2">{m.supportStaff.map((s) => <div key={s.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2"><StaffAvatar staff={s} size="sm" /><span className="text-sm text-white/70">{s.name}</span></div>)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-white font-bold">Handoff checklist</div>
                  <div className="mt-3 space-y-2">{m.handoffChecklist.map((s) => <div key={s} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/65">✓ {s}</div>)}</div>
                </div>
              </div>

              {m.blockedUntil ? <div className="mt-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-3 text-sm text-rose-100">Blocked until: {m.blockedUntil}</div> : null}
              <button type="button" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-100 hover:bg-amber-500/15">{m.suggestedNextButton} <ExternalLink size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
