import React, { useMemo, useState } from 'react';
import { Rocket, UserCheck } from 'lucide-react';
import { getHumanStaffAgent, recommendAgentsForMission } from './humanStaffDirectory';
import { buildHumanStaffMissionPlan, explainWhoShouldRun } from './staffOrchestrationEngine';
import { setSelectedHumanStaff } from './humanStaffRepo';
import { HumanStaffAvatar } from './HumanStaffAvatar';
import { humanStaffDisplayName } from './humanStaffRosterBridge';
import { syncHumanSelectionToCommandCenter } from '../staffCommandCenter/staffSelectionSync';
import type { HumanStaffAgentId } from './types';
import {
  STAFF_CMD_BODY,
  STAFF_CMD_EYEBROW,
  STAFF_CMD_PANEL,
  STAFF_CMD_PRIMARY_BTN,
  STAFF_CMD_SECONDARY_BTN,
  STAFF_CMD_TITLE,
  staffCmdSelected,
} from './humanStaffOsUi';

const missionOptions = ['deep_swarm', 'lead_action_center', 'city_growth_sprint', 'appointment_blitz', 'sales_follow_up', 'recruiting_drive', 'premium_content_push', 'geo_page_push', 'worker_repair', 'compliance_review'];
const cityOptions = ['dallas', 'houston', 'atlanta', 'phoenix', 'charlotte', 'miami', 'orlando', 'tampa', 'austin', 'st_louis'];

export function HumanStaffMissionControlPanel({ selectedIds, onChanged }: { selectedIds: HumanStaffAgentId[]; onChanged: () => void }) {
  const [missionType, setMissionType] = useState('deep_swarm');
  const [title, setTitle] = useState('Lead discovery clarity and action cards');
  const [objective, setObjective] = useState('Make lead discovery easy to understand, staff-owned, and connected to lead action cards.');
  const [cityIds, setCityIds] = useState<string[]>(['dallas', 'houston']);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const recommendation = useMemo(() => explainWhoShouldRun(missionType), [missionType]);
  const staff = selectedIds.length ? selectedIds : recommendation.selected;

  function toggleCity(city: string) {
    setCityIds((prev) => (prev.includes(city) ? prev.filter((x) => x !== city) : [...prev, city].slice(0, 5)));
  }

  function applyRecommended() {
    const ids = recommendation.selected as HumanStaffAgentId[];
    setSelectedHumanStaff(ids);
    syncHumanSelectionToCommandCenter(ids);
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
    const ids = [plan.leadAgentId, ...plan.supportingAgentIds] as HumanStaffAgentId[];
    setSelectedHumanStaff(ids);
    syncHumanSelectionToCommandCenter(ids);
    onChanged();
  }

  return (
    <div className={STAFF_CMD_PANEL}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`inline-flex items-center gap-2 ${STAFF_CMD_EYEBROW}`}>
            <Rocket size={18} />
            <span>Deep mission control</span>
          </div>
          <h2 className={`mt-2 ${STAFF_CMD_TITLE}`}>Staff-owned missions with threads and notifications.</h2>
          <p className={`mt-2 text-sm ${STAFF_CMD_BODY} max-w-3xl`}>
            Creates durable mission threads and agent notifications. For quick operational missions, use the Missions tab.
          </p>
        </div>
        <button type="button" onClick={applyRecommended} className={STAFF_CMD_SECONDARY_BTN}>
          <UserCheck size={14} />
          Use recommended team
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-white/35">Mission type</span>
          <select value={missionType} onChange={(e) => setMissionType(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/80">
            {missionOptions.map((m) => (
              <option key={m} value={m}>{m.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-white/35">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/80" />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-white/35">Objective</span>
          <textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/80" />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-white/35">Risk</span>
          <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as 'low' | 'medium' | 'high')} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/80">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Recommended team</div>
          <p className="mt-2 text-sm text-white/60">{recommendation.reason}</p>
          <div className="mt-4 space-y-3">
            {staff.map((id) => {
              const agent = getHumanStaffAgent(id);
              return (
                <div key={id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <HumanStaffAvatar agent={agent} size="md" />
                  <div>
                    <div className="font-black text-white">{humanStaffDisplayName(agent)}</div>
                    <div className="text-sm text-violet-200/80">{agent.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">City focus</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {cityOptions.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => toggleCity(city)}
                className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${staffCmdSelected(cityIds.includes(city))}`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={runMission} className={`w-full ${STAFF_CMD_PRIMARY_BTN}`}>
          Create staff mission + notify agents
        </button>
      </div>
    </div>
  );
}
