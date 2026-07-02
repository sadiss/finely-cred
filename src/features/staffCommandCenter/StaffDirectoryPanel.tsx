import React, { useMemo, useState } from 'react';
import { CheckCircle2, Filter, Search, Users } from 'lucide-react';
import type { StaffDepartmentId, StaffMember } from './types';
import { STAFF_DEPARTMENTS, STAFF_MEMBERS } from './staffDirectory';
import { setSelectedStaff } from './staffCommandRepo';
import { StaffAvatar, StaffStatusPill } from './StaffAvatar';

function cardBorder(staff: StaffMember, selected: boolean) {
  if (selected) return 'border-amber-400/60 bg-amber-500/10';
  if (staff.status === 'blocked') return 'border-rose-500/25 bg-rose-500/5';
  if (staff.status === 'needs_approval') return 'border-amber-500/25 bg-amber-500/5';
  if (staff.status === 'working') return 'border-emerald-500/20 bg-emerald-500/5';
  return 'border-white/10 bg-white/[0.03]';
}

export function StaffDirectoryPanel({ selectedIds, onChanged }: { selectedIds: string[]; onChanged: () => void }) {
  const [query, setQuery] = useState('');
  const [departmentId, setDepartmentId] = useState<StaffDepartmentId | 'all'>('all');
  const [showFuture, setShowFuture] = useState(true);

  const staff = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STAFF_MEMBERS.filter((x) => {
      if (!showFuture && (x.kind === 'future_hire' || x.kind === 'human_staff')) return false;
      if (departmentId !== 'all' && x.departmentId !== departmentId) return false;
      if (!q) return true;
      return `${x.name} ${x.title} ${x.departmentId} ${x.tagline} ${x.responsibilities.join(' ')}`.toLowerCase().includes(q);
    });
  }, [departmentId, query, showFuture]);

  function toggleStaff(id: string) {
    const selected = selectedIds.includes(id);
    const next = selected ? selectedIds.filter((x) => x !== id) : [...selectedIds, id].slice(0, 3);
    setSelectedStaff(next.length ? next : [id]);
    onChanged();
  }

  return (
    <div className="rounded-[34px] border border-white/10 bg-black/30 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300 text-[10px] uppercase tracking-widest font-black"><Users size={16} /> Staff Directory</div>
          <h2 className="mt-2 text-2xl font-black text-white">Choose 1–3 staff members for the mission</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/60">This is the staff identity layer: AI staff, future real staff, departments, responsibilities, tools, blockers, and work modes in one place.</p>
        </div>
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-100">
          Selected: <span className="font-black">{selectedIds.length}/3</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 flex items-center gap-2">
          <Search size={16} className="text-white/35" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff, tools, blockers, responsibilities…" className="w-full bg-transparent py-2 text-sm text-white/80 outline-none placeholder:text-white/30" />
        </div>
        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 flex items-center gap-2">
          <Filter size={16} className="text-white/35" />
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value as any)} className="w-full bg-transparent py-2 text-sm text-white/80 outline-none">
            <option value="all">All departments</option>
            {STAFF_DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <label className="lg:col-span-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 flex items-center gap-3 text-sm text-white/70">
          <input type="checkbox" checked={showFuture} onChange={(e) => setShowFuture(e.target.checked)} />
          Show future real staff
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-2">
        {staff.map((x) => {
          const selected = selectedIds.includes(x.id);
          return (
            <button key={x.id} type="button" onClick={() => toggleStaff(x.id)} className={`group text-left rounded-3xl border p-5 transition-all hover:-translate-y-0.5 hover:border-amber-400/40 ${cardBorder(x, selected)}`}>
              <div className="flex gap-4">
                <StaffAvatar staff={x} active={selected} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-white font-black text-lg leading-tight">{x.name}</div>
                      <div className="mt-1 text-xs text-amber-200/80 font-bold">{x.title}</div>
                    </div>
                    {selected ? <CheckCircle2 size={18} className="text-amber-300" /> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2"><StaffStatusPill status={x.status} /><span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/55">{x.kind.replace(/_/g, ' ')}</span></div>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/65 line-clamp-2">{x.tagline}</p>
              <div className="mt-4 grid gap-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[9px] uppercase tracking-widest text-white/35 font-black">Owns</div>
                  <div className="mt-2 text-xs text-white/65 line-clamp-2">{x.responsibilities.slice(0, 3).join(' • ')}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[9px] uppercase tracking-widest text-white/35 font-black">Blocked by</div>
                  <div className="mt-2 text-xs text-white/65 line-clamp-1">{x.blockers.join(' • ') || 'No active blockers'}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
