import React from 'react';
import { Building2, Crown } from 'lucide-react';
import { STAFF_DEPARTMENTS, STAFF_MEMBERS, listDepartmentStaff } from './staffDirectory';
import { StaffAvatar, StaffStatusPill } from './StaffAvatar';

export function StaffOrgChartPanel({ onSelectDepartment }: { onSelectDepartment?: (id: string) => void }) {
  return (
    <div className="rounded-[34px] border border-white/10 bg-black/30 p-6 space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 text-amber-300 text-[10px] uppercase tracking-widest font-black"><Building2 size={16} /> Staff Hierarchy</div>
        <h2 className="mt-2 text-2xl font-black text-white">One company floor, clear departments</h2>
        <p className="mt-2 max-w-4xl text-sm text-white/60">Lead Intel is no longer a mystery button. It becomes one department inside Staff Command. The swarm is a system process, but Scout Supreme, Night Owl Intel, Pipeline Titan, and Switchboard own it.</p>
      </div>

      <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-white/[0.04] to-black/30 p-5">
        <div className="flex flex-wrap items-center gap-4">
          {STAFF_MEMBERS.filter((x) => ['professor_apex', 'cmo_prime', 'pipeline_titan', 'switchboard', 'velvet_hammer'].includes(x.id)).map((x) => (
            <div key={x.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 min-w-[220px]">
              <StaffAvatar staff={x} size="md" />
              <div className="min-w-0">
                <div className="flex items-center gap-2"><Crown size={13} className="text-amber-300" /><div className="text-white font-bold text-sm truncate">{x.name}</div></div>
                <div className="text-[11px] text-white/50 truncate">{x.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {STAFF_DEPARTMENTS.map((dept) => {
          const members = listDepartmentStaff(dept.id);
          const owner = STAFF_MEMBERS.find((s) => s.id === dept.primaryOwnerId);
          return (
            <button key={dept.id} type="button" onClick={() => onSelectDepartment?.(dept.id)} className="text-left rounded-3xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] hover:border-amber-400/30 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">{dept.shortName}</div>
                  <div className="mt-1 text-white font-black text-lg">{dept.name}</div>
                  <p className="mt-2 text-sm text-white/55 line-clamp-2">{dept.description}</p>
                </div>
                {owner ? <StaffAvatar staff={owner} size="md" /> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {members.slice(0, 5).map((m) => <StaffStatusPill key={m.id} status={m.status} />)}
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/50">{members.length} staff</span>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {dept.workProducts.slice(0, 4).map((w) => <div key={w} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-white/60">{w}</div>)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
