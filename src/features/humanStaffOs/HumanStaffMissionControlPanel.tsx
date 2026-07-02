import React, { useMemo, useState } from 'react';
import { Rocket, UserCheck } from 'lucide-react';
import { HUMAN_STAFF_AGENTS, getHumanStaffAgent, recommendAgentsForMission } from './humanStaffDirectory';
import { buildHumanStaffMissionPlan, explainWhoShouldRun } from './staffOrchestrationEngine';
import { setSelectedHumanStaff } from './humanStaffRepo';
import { HumanStaffAvatar } from './HumanStaffAvatar';
import type { HumanStaffAgentId } from './types';

const missionOptions = ['deep_swarm', 'lead_action_center', 'city_growth_sprint', 'appointment_blitz', 'sales_follow_up', 'recruiting_drive', 'premium_content_push', 'geo_page_push', 'worker_repair', 'compliance_review'];
const cityOptions = ['dallas', 'houston', 'atlanta', 'phoenix', 'charlotte', 'miami', 'orlando', 'tampa', 'austin', 'st_louis'];

export function HumanStaffMissionControlPanel({ selectedIds, onChanged }: { selectedIds: HumanStaffAgentId[]; onChanged: () => void }) {
  const [missionType, setMissionType] = useState('deep_swarm');
  const [title, setTitle] = useState('Deep Swarm clarity and action cards');
  const [objective, setObjective] = useState('Make Start Swarm easy to understand, staff-owned, and connected to lead action cards.');
  const [cityIds, setCityIds] = useState<string[]>(['dallas', 'houston']);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const recommendation = useMemo(() => explainWhoShouldRun(missionType), [missionType]);
  const staff = selectedIds.length ? selectedIds : recommendation.selected;

  function toggleCity(city: string) {
    setCityIds((prev) => (prev.includes(city) ? prev.filter((x) => x !== city) : [...prev, city].slice(0, 5)));
  }

  function applyRecommended() {
    setSelectedHumanStaff(recommendation.selected as HumanStaffAgentId[]);
    onChanged();
  }

  function runMission() {
    const plan = buildHumanStaffMissionPlan({
      title,
      objective,
      missionType,
      cityIds,
      selectedAgentIds: staff as HumanStaffAgentId[],
      riskLevel,
      autonomy: 'approval_required_external',
    });
    setSelectedHumanStaff([plan.leadAgentId, ...plan.supportingAgentIds] as HumanStaffAgentId[]);
    onChanged();
  }

  return (
    <div className="rounded-[30px] border border-white/10 bg-black/25 p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300"><Rocket size={18} /><span className="text-[10px] font-black uppercase tracking-widest">Mission control</span></div>
          <h2 className="mt-2 text-2xl font-black text-white">Choose the staff, then run the work.</h2>
          <p className="mt-2 text-sm text-white/55 max-w-3xl">This converts the system from hidden buttons into named missions with a lead agent, support staff, notifications, durable thread, approval gates, and expected outputs.</p>
        </div>
        <button type="button" onClick={applyRecommended} className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-100"><UserCheck size={14} />Use recommended team</button>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5 space-y-4">
          <label className="block"><span className="text-[10px] uppercase tracking-widest text-white/35">Mission type</span><select value={missionType} onChange={(e) => setMissionType(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/80">{missionOptions.map((m) => <option key={m} value={m}>{m.replaceAll('_', ' ')}</option>)}</select></label>
          <label className="block"><span className="text-[10px] uppercase tracking-widest text-white/35">Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/80" /></label>
          <label className="block"><span className="text-[10px] uppercase tracking-widest text-white/35">Objective</span><textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/80" /></label>
          <label className="block"><span className="text-[10px] uppercase tracking-widest text-white/35">Risk</span><select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as any)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/80"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        </div>
        <div className="xl:col-span-7 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Recommended team</div>
            <p className="mt-2 text-sm text-white/60">{recommendation.reason}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {staff.map((id) => {
                const agent = getHumanStaffAgent(id);
                return <div key={id} className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="flex items-center gap-3"><HumanStaffAvatar agent={agent} size="sm" /><div><div className="font-black text-white text-sm">{agent.name}</div><div className="text-[10px] text-white/40">{agent.title}</div></div></div></div>;
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">City focus</div>
            <div className="mt-3 flex flex-wrap gap-2">{cityOptions.map((city) => <button key={city} type="button" onClick={() => toggleCity(city)} className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${cityIds.includes(city) ? 'border-amber-400 bg-amber-500 text-black' : 'border-white/10 bg-black/20 text-white/50'}`}>{city}</button>)}</div>
          </div>
          <button type="button" onClick={runMission} className="w-full rounded-2xl bg-amber-500 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-black hover:brightness-110">Create staff mission + notify agents</button>
        </div>
      </div>
    </div>
  );
}
