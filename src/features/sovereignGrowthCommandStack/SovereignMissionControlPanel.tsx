import React, { useEffect, useMemo, useState } from 'react';
import type { SovereignMissionType, SovereignChannelId } from './types';
import { missionBlueprints, createSovereignMission, explainDeepFormOwnership, buildMissionBoardSummary } from './sovereignMissionEngine';
import { sovereignAgents, recommendSovereignAgentsForMission } from './sovereignAgentDirectory';
import { listSovereignMissions } from './sovereignGrowthRepo';
import { SovereignStaffAvatar } from './SovereignStaffAvatar';

const cities = ['Dallas', 'Houston', 'Atlanta', 'Phoenix', 'Charlotte'];
const channels: SovereignChannelId[] = ['meta', 'instagram', 'tiktok', 'youtube', 'linkedin', 'seo', 'email', 'sms', 'partners', 'pr'];

export function SovereignMissionControlPanel() {
  const [version, setVersion] = useState(0);
  const [type, setType] = useState<SovereignMissionType>('deep_swarm');
  const [city, setCity] = useState('Dallas');
  const [channel, setChannel] = useState<SovereignChannelId>('meta');
  const [selectedOwners, setSelectedOwners] = useState<string[]>(recommendSovereignAgentsForMission('deep_swarm').map((a) => a.id));
  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:sovereign-growth-store', onStore as EventListener);
    return () => window.removeEventListener('finely:sovereign-growth-store', onStore as EventListener);
  }, []);
  useEffect(() => {
    setSelectedOwners(recommendSovereignAgentsForMission(type).map((a) => a.id));
  }, [type]);
  const missions = useMemo(() => listSovereignMissions(), [version]);
  const summary = useMemo(() => buildMissionBoardSummary(missions), [missions]);
  const recommended = recommendSovereignAgentsForMission(type);
  const create = () => {
    createSovereignMission({ type, city, channel, ownerIds: selectedOwners });
    setVersion((v) => v + 1);
  };
  const toggleOwner = (id: string) => {
    setSelectedOwners((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id].slice(0, 3);
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Mission control</div>
        <h2 className="mt-2 text-2xl font-black text-white">Choose the staff, mission, city, and channel</h2>
        <p className="mt-2 text-sm text-white/60 max-w-4xl">This turns vague buttons into named work. Deep Swarm is owned by multiple staff lanes, not one mystery process. You can choose one to three staff members, then the system creates a mission thread and notifies connected departments.</p>
      </div>

      <div className="grid xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5 rounded-3xl border border-white/10 bg-black/30 p-5 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-black">Mission type</label>
            <select value={type} onChange={(e) => setType(e.target.value as SovereignMissionType)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white text-sm">
              {missionBlueprints.map((b) => <option key={b.type} value={b.type}>{b.label}</option>)}
            </select>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-black">City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white text-sm">
                {cities.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-black">Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value as SovereignChannelId)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white text-sm">
                {channels.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-white/75">{explainDeepFormOwnership()}</div>
          <button type="button" onClick={create} className="w-full rounded-xl bg-amber-400 text-black px-5 py-4 text-[10px] uppercase tracking-widest font-black hover:brightness-110">Create mission + notify staff</button>
        </div>

        <div className="xl:col-span-7 rounded-3xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Recommended staff</div>
          <div className="grid md:grid-cols-3 gap-3">
            {recommended.map((agent) => (
              <button key={agent.id} type="button" onClick={() => toggleOwner(agent.id)} className={`rounded-2xl border p-4 text-left transition-all ${selectedOwners.includes(agent.id) ? 'border-amber-400/40 bg-amber-500/10' : 'border-white/10 bg-black/25 hover:bg-white/[0.04]'}`}>
                <SovereignStaffAvatar agent={agent} />
                <div className="mt-3 text-white font-bold">{agent.name}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{agent.title}</div>
                <p className="mt-2 text-xs text-white/60 line-clamp-3">{agent.mission}</p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Selected owners</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedOwners.map((id) => {
                const agent = sovereignAgents.find((a) => a.id === id);
                return <span key={id} className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70">{agent?.name ?? id}</span>;
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-3">
        {summary.map((line) => <div key={line} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/75">{line}</div>)}
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/30 overflow-hidden">
        <div className="p-5 border-b border-white/10"><div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Recent missions</div></div>
        <div className="divide-y divide-white/10">
          {missions.length === 0 ? <div className="p-5 text-white/50 text-sm">No missions yet. Create one above.</div> : missions.slice(0, 8).map((mission) => (
            <div key={mission.id} className="p-5 grid md:grid-cols-12 gap-4">
              <div className="md:col-span-5"><div className="text-white font-bold">{mission.title}</div><div className="text-xs text-white/50 mt-1">{mission.objective}</div></div>
              <div className="md:col-span-2 text-xs text-white/60 uppercase tracking-widest">{mission.priority}<br />{mission.status}</div>
              <div className="md:col-span-3 flex flex-wrap gap-2">{mission.ownerIds.map((id) => <span key={id} className="rounded-full bg-white/[0.05] border border-white/10 px-2 py-1 text-[10px] text-white/60">{id}</span>)}</div>
              <div className="md:col-span-2 text-xs text-white/50">{mission.updatedAt.slice(0, 10)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
