import React, { useMemo, useState } from 'react';
import { ArrowRight, ClipboardList, Play, ShieldAlert } from 'lucide-react';
import type { StaffMissionIntensity, StaffMissionType, StaffRiskLevel } from './types';
import { GEO_CLUSTERS } from './staffDirectory';
import { addStaffMission } from './staffCommandRepo';
import { buildStaffMissionPlan, buildStaffMissionRequest, recommendedStaffForMission } from './staffMissionEngine';
import { StaffAvatar } from './StaffAvatar';

const missionOptions: Array<{ id: StaffMissionType; label: string; plain: string }> = [
  { id: 'deep_swarm', label: 'Deep Swarm', plain: 'Continuous Lead Intel discovery across cities/sources.' },
  { id: 'lead_action_review', label: 'Action Center', plain: 'Turn found leads into message + short link + owner.' },
  { id: 'city_growth_sprint', label: 'City Growth Sprint', plain: 'Make a city more usable and better routed.' },
  { id: 'appointment_blitz', label: 'Appointment Blitz', plain: 'Turn hot leads into booked calls.' },
  { id: 'sales_follow_up', label: 'Sales Follow-Up', plain: 'Create close-stage tasks and next steps.' },
  { id: 'recruiting_drive', label: 'Recruiting Drive', plain: 'Recruit specialists, affiliates, partners, sellers.' },
  { id: 'partner_outreach', label: 'Partner Outreach', plain: 'Build referral/agency/affiliate activation.' },
  { id: 'content_pack', label: 'Content Pack', plain: 'Generate hooks, captions, scripts, briefs.' },
  { id: 'pr_pitch', label: 'PR Pitch', plain: 'Create authority/interview/news angle.' },
  { id: 'nurture_fix', label: 'Nurture Fix', plain: 'Repair follow-up gaps and safer messaging.' },
  { id: 'geo_page_push', label: 'Geo Page Push', plain: 'Prepare local lead magnet/page asset.' },
  { id: 'analytics_diagnosis', label: 'Analytics Diagnosis', plain: 'Find bottleneck and next best action.' },
  { id: 'compliance_review', label: 'Compliance Review', plain: 'Approve/rewrite/block risky copy.' },
  { id: 'overnight_run', label: 'Overnight Run', plain: 'Coordinate overnight swarm, content, brief.' },
];

export function StaffMissionBuilder({ selectedIds, onChanged }: { selectedIds: string[]; onChanged: () => void }) {
  const [missionType, setMissionType] = useState<StaffMissionType>('deep_swarm');
  const [cityIds, setCityIds] = useState<string[]>(GEO_CLUSTERS.slice(0, 3).map((g) => g.id));
  const [intensity, setIntensity] = useState<StaffMissionIntensity>('standard');
  const [riskLevel, setRiskLevel] = useState<StaffRiskLevel>('medium');
  const [objective, setObjective] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const recommended = useMemo(() => recommendedStaffForMission(missionType, selectedIds).slice(0, 4), [missionType, selectedIds]);
  const preview = useMemo(() => {
    const request = buildStaffMissionRequest({ missionType, cityIds, selectedStaffIds: selectedIds, intensity, riskLevel, objective });
    return buildStaffMissionPlan(request);
  }, [cityIds, intensity, missionType, objective, riskLevel, selectedIds]);

  function toggleCity(id: string) {
    setCityIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(0, 8));
  }

  function createMission() {
    const request = buildStaffMissionRequest({ missionType, cityIds, selectedStaffIds: selectedIds, intensity, riskLevel, objective });
    const plan = buildStaffMissionPlan(request);
    addStaffMission(plan);
    setNotice(`${plan.leadOwner.name} now owns ${plan.request.title}.`);
    onChanged();
  }

  return (
    <div className="rounded-[34px] border border-white/10 bg-black/30 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300 text-[10px] uppercase tracking-widest font-black"><ClipboardList size={16} /> Mission Builder</div>
          <h2 className="mt-2 text-2xl font-black text-white">Tell the staff what to do</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/60">Pick the mission, cities, intensity, and 1–3 staff. The system explains who owns it, what happens first, and what is blocked until approval.</p>
        </div>
        <button type="button" onClick={createMission} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:brightness-110"><Play size={14} /> Create mission</button>
      </div>

      {notice ? <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">{notice}</div> : null}

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Mission type</div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {missionOptions.map((m) => (
                <button key={m.id} type="button" onClick={() => setMissionType(m.id)} className={`text-left rounded-2xl border p-3 transition-all ${missionType === m.id ? 'border-amber-400/60 bg-amber-500/10' : 'border-white/10 bg-black/20 hover:bg-white/[0.05]'}`}>
                  <div className="text-white text-sm font-bold">{m.label}</div>
                  <div className="mt-1 text-[11px] text-white/45">{m.plain}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Intensity</div>
              <select value={intensity} onChange={(e) => setIntensity(e.target.value as StaffMissionIntensity)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80">
                <option value="light">Light</option>
                <option value="standard">Standard</option>
                <option value="aggressive">Aggressive internal</option>
                <option value="overnight">Overnight</option>
              </select>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Risk</div>
              <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as StaffRiskLevel)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High — approval required</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Cities</div>
            <div className="mt-3 space-y-2 max-h-[470px] overflow-y-auto pr-1">
              {GEO_CLUSTERS.map((g) => (
                <label key={g.id} className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm ${cityIds.includes(g.id) ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100' : 'border-white/10 bg-black/20 text-white/70'}`}>
                  <span>{g.city}, {g.state}</span>
                  <input type="checkbox" checked={cityIds.includes(g.id)} onChange={() => toggleCity(g.id)} />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5">
            <div className="text-[10px] uppercase tracking-widest text-amber-200 font-black">Recommended staff</div>
            <div className="mt-4 space-y-3">
              {recommended.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                  <StaffAvatar staff={s} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-bold truncate">{idx === 0 ? 'Lead: ' : 'Support: '}{s.name}</div>
                    <div className="text-[11px] text-white/50 truncate">{s.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Preview</div>
            <div className="mt-2 text-white font-black text-lg">{preview.request.title}</div>
            <p className="mt-2 text-sm text-white/60">{preview.commandSummary}</p>
            {preview.request.approvalRequired ? <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-100"><ShieldAlert size={15} /> Approval required before risky/external actions.</div> : null}
            <div className="mt-4 space-y-2">
              {preview.firstThreeSteps.map((s) => <div key={s} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65">{s}</div>)}
            </div>
            <button type="button" onClick={createMission} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-100 hover:bg-amber-500/15">{preview.suggestedNextButton} <ArrowRight size={14} /></button>
          </div>
        </div>
      </div>

      <textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Optional: tell the staff exactly what you want this mission to accomplish…" className="min-h-[96px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80 outline-none placeholder:text-white/30" />
    </div>
  );
}
