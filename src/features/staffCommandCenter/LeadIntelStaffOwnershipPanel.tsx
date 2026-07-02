import React from 'react';
import { ArrowRight, Brain, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STAFF_MEMBERS } from './staffDirectory';
import { StaffAvatar } from './StaffAvatar';

export function LeadIntelStaffOwnershipPanel() {
  const navigate = useNavigate();
  const owners = STAFF_MEMBERS.filter((s) => ['pipeline_titan', 'scout_supreme', 'night_owl_intel', 'geo_commander', 'switchboard', 'velvet_hammer'].includes(s.id));
  return (
    <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-white/[0.04] to-emerald-500/10 p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300 text-[10px] uppercase tracking-widest font-black"><Brain size={16} /> Who owns Lead Intel?</div>
          <h2 className="mt-2 text-2xl font-black text-white">Lead Intel is a staff department, not just a button</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/60">Start Swarm / Deep Swarm is the system process. Pipeline Titan owns the lead goal, Scout Supreme owns discovery, Night Owl Intel runs overnight, Geo Commander picks city strategy, Switchboard owns workers, and Velvet Hammer blocks unsafe action.</p>
        </div>
        <button type="button" onClick={() => navigate('/admin/staff')} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:brightness-110"><Users size={14} /> Open Staff <ArrowRight size={14} /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {owners.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
            <div className="flex justify-center"><StaffAvatar staff={s} size="md" /></div>
            <div className="mt-2 text-sm font-bold text-white">{s.name}</div>
            <div className="mt-1 text-[10px] text-white/45 line-clamp-2">{s.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
