import React, { useMemo, useState } from 'react';
import { ArrowLeft, Building2, ClipboardList, MapPinned, RefreshCw, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { StaffDirectoryPanel } from '../../features/staffCommandCenter/StaffDirectoryPanel';
import { StaffGeoWarRoomPanel } from '../../features/staffCommandCenter/StaffGeoWarRoomPanel';
import { StaffMissionBuilder } from '../../features/staffCommandCenter/StaffMissionBuilder';
import { StaffOrgChartPanel } from '../../features/staffCommandCenter/StaffOrgChartPanel';
import { StaffWorkroomPanel } from '../../features/staffCommandCenter/StaffWorkroomPanel';
import { loadStaffCommandStore, resetStaffCommandDemo } from '../../features/staffCommandCenter/staffCommandRepo';
import { GEO_CLUSTERS, STAFF_DEPARTMENTS, STAFF_MEMBERS } from '../../features/staffCommandCenter/staffDirectory';
import { StaffAvatar } from '../../features/staffCommandCenter/StaffAvatar';

type View = 'floor' | 'departments' | 'missions' | 'directory' | 'geo' | 'workroom';

export default function AdminStaffCommandCenterPage() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<View>('floor');
  const store = useMemo(() => loadStaffCommandStore(), [version]);
  const selectedStaff = store.selectedStaffIds.map((id) => STAFF_MEMBERS.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const working = STAFF_MEMBERS.filter((s) => s.status === 'working').length;
  const blocked = STAFF_MEMBERS.filter((s) => s.status === 'blocked').length;
  const future = STAFF_MEMBERS.filter((s) => s.kind === 'future_hire' || s.kind === 'human_staff').length;
  const refresh = () => setVersion((v) => v + 1);

  const tabs: Array<{ id: View; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; hint: string }> = [
    { id: 'floor', label: 'Staff Floor', icon: Users, hint: 'who is who' },
    { id: 'departments', label: 'Departments', icon: Building2, hint: 'hierarchy' },
    { id: 'missions', label: 'Mission Builder', icon: ClipboardList, hint: 'choose staff' },
    { id: 'directory', label: 'Directory', icon: Users, hint: 'all profiles' },
    { id: 'geo', label: 'Geo War Room', icon: MapPinned, hint: 'city owners' },
    { id: 'workroom', label: 'Workroom', icon: RefreshCw, hint: 'active missions' },
  ];

  return (
    <PageShell
      badge="Admin"
      title="Staff Command Center"
      subtitle="One organized floor for AI staff, future real staff, departments, missions, Lead Intel ownership, Geo command, and action routing."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"><ArrowLeft size={16} /> Admin Dashboard</button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/admin/lead-intel')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.08]">Lead Intel Swarm</button>
            <button type="button" onClick={() => navigate('/admin/crm')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.08]">CRM</button>
            <button type="button" onClick={() => { resetStaffCommandDemo(); refresh(); }} className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-100 hover:bg-amber-500/15">Reset demo</button>
          </div>
        </div>

        <div className="rounded-[34px] border border-white/10 bg-gradient-to-br from-amber-500/15 via-white/[0.04] to-emerald-500/10 p-6 overflow-hidden relative">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="relative grid gap-6 xl:grid-cols-12 items-start">
            <div className="xl:col-span-7">
              <div className="text-[10px] uppercase tracking-[0.34em] text-amber-200 font-black">Staff-first operating system</div>
              <h1 className="mt-3 text-3xl md:text-5xl font-black text-white tracking-tight">Stop hunting for tools. Pick the staff, then run the mission.</h1>
              <p className="mt-4 text-white/65 max-w-3xl">Lead Intel, Geo, CMO, appointment setting, sales, recruiting, PR, nurture, automation, and compliance are now visible as departments with named owners. Deep Swarm is a system process owned by staff, not a mystery button.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const active = view === t.id;
                  return <button key={t.id} type="button" onClick={() => setView(t.id)} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'border-amber-400 bg-amber-500 text-black' : 'border-white/10 bg-black/25 text-white/70 hover:bg-white/[0.06]'}`}><Icon size={14} /> {t.label}</button>;
                })}
              </div>
            </div>
            <div className="xl:col-span-5 grid gap-3 md:grid-cols-2">
              {[
                ['Staff', STAFF_MEMBERS.length, 'AI + future real'],
                ['Departments', STAFF_DEPARTMENTS.length, 'clear hierarchy'],
                ['Working', working, 'active now'],
                ['Blocked', blocked, 'needs setup'],
                ['Future staff', future, 'real hires later'],
                ['Geo clusters', GEO_CLUSTERS.length, 'city boards'],
              ].map(([label, value, hint]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-[10px] uppercase tracking-widest text-white/35">{label}</div><div className="mt-2 text-2xl font-black text-white">{value}</div><div className="text-xs text-white/45">{hint}</div></div>)}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-black/25 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-[10px] uppercase tracking-widest text-white/35 font-black mr-2">Selected staff</div>
            {selectedStaff.map((s) => <div key={s.id} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2"><StaffAvatar staff={s} size="sm" /><span className="text-xs text-white/75 font-bold">{s?.name}</span></div>)}
            {!selectedStaff.length ? <div className="text-sm text-white/45">No staff selected yet.</div> : null}
          </div>
        </div>

        {view === 'floor' && (
          <div className="grid gap-6 xl:grid-cols-2">
            <StaffOrgChartPanel onSelectDepartment={() => setView('departments')} />
            <StaffMissionBuilder selectedIds={store.selectedStaffIds} onChanged={refresh} />
          </div>
        )}
        {view === 'departments' && <StaffOrgChartPanel />}
        {view === 'missions' && <StaffMissionBuilder selectedIds={store.selectedStaffIds} onChanged={refresh} />}
        {view === 'directory' && <StaffDirectoryPanel selectedIds={store.selectedStaffIds} onChanged={refresh} />}
        {view === 'geo' && <StaffGeoWarRoomPanel activeIds={store.settings.activeGeoClusterIds} />}
        {view === 'workroom' && <StaffWorkroomPanel missions={store.missions} />}
      </div>
    </PageShell>
  );
}
