import React, { useEffect, useMemo, useState } from 'react';
import { sovereignAgents } from './sovereignAgentDirectory';
import { listSovereignThreads, listSovereignMissions, upsertSovereignThread } from './sovereignGrowthRepo';
import { appendAgentTurn, buildAgentResponse, diagnoseRepetitiveStaffLanguage } from './sovereignConversationEngine';
import { SovereignStaffAvatar } from './SovereignStaffAvatar';
import type { SovereignConversationThread } from './types';

function nowIso() { return new Date().toISOString(); }
function id(prefix: string) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

export function SovereignConversationCommandPanel() {
  const [version, setVersion] = useState(0);
  const [agentId, setAgentId] = useState('cmo-prime');
  const [prompt, setPrompt] = useState('Give me the highest-level next move for today.');
  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:sovereign-growth-store', onStore as EventListener);
    return () => window.removeEventListener('finely:sovereign-growth-store', onStore as EventListener);
  }, []);
  const threads = useMemo(() => listSovereignThreads(), [version]);
  const missions = useMemo(() => listSovereignMissions(), [version]);
  const [threadId, setThreadId] = useState('');
  const thread = threads.find((t) => t.id === threadId) ?? threads[0];
  const selectedAgent = sovereignAgents.find((a) => a.id === agentId) ?? sovereignAgents[0];
  const activeMission = missions[0];

  const ask = () => {
    if (!thread) {
      const newThread: SovereignConversationThread = {
        id: id('thread'),
        title: 'Sovereign command conversation',
        missionId: activeMission?.id,
        participantAgentIds: [agentId],
        createdAt: nowIso(),
        updatedAt: nowIso(),
        turns: [{ id: id('turn'), agentId, role: 'agent', content: buildAgentResponse(agentId, prompt, activeMission), createdAt: nowIso(), tags: ['manual_start'] }],
        memorySummary: `Started with ${selectedAgent.name}: ${prompt}`,
        openDecisions: ['Decide next command move', 'Assign staff owner', 'Create tracked action'],
      };
      upsertSovereignThread(newThread);
      setThreadId(newThread.id);
    } else {
      appendAgentTurn(thread, agentId, prompt, activeMission);
    }
    setVersion((v) => v + 1);
  };

  const combinedText = thread?.turns.map((t) => t.content).join('\n') ?? '';
  const repetitionFindings = diagnoseRepetitiveStaffLanguage(combinedText);

  return (
    <div className="grid xl:grid-cols-12 gap-5">
      <div className="xl:col-span-4 rounded-3xl border border-white/10 bg-black/30 p-5 space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Human staff conversation</div>
          <h2 className="mt-2 text-2xl font-black text-white">Ask a specific staff member</h2>
          <p className="mt-2 text-sm text-white/60">The response engine uses each agent's voice, knowledge, mission role, escalation partners, and recent phrasing to reduce repetitive answers.</p>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-white/40 font-black">Agent</label>
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white text-sm">
            {sovereignAgents.map((a) => <option key={a.id} value={a.id}>{a.name} - {a.title}</option>)}
          </select>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex gap-3">
          <SovereignStaffAvatar agent={selectedAgent} />
          <div><div className="text-white font-bold">{selectedAgent.name}</div><div className="text-xs text-white/50 mt-1">{selectedAgent.mission}</div></div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-white/40 font-black">Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white text-sm" />
        </div>
        <button onClick={ask} className="w-full rounded-xl bg-amber-400 text-black px-5 py-4 text-[10px] uppercase tracking-widest font-black hover:brightness-110">Ask selected staff</button>
        {repetitionFindings.length > 0 && <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4"><div className="text-[10px] uppercase tracking-widest text-amber-200 font-black">Repetition guard</div><div className="mt-2 space-y-1 text-xs text-white/65">{repetitionFindings.map((f) => <div key={f}>{f}</div>)}</div></div>}
      </div>

      <div className="xl:col-span-8 rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden">
        <div className="p-5 border-b border-white/10 flex flex-wrap justify-between gap-3">
          <div><div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Mission threads</div><div className="mt-1 text-white font-bold">{thread?.title ?? 'No thread yet'}</div></div>
          <select value={thread?.id ?? ''} onChange={(e) => setThreadId(e.target.value)} className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white text-xs">
            {threads.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div className="p-5 space-y-4 max-h-[760px] overflow-auto">
          {!thread ? <div className="text-white/50 text-sm">No conversation yet. Ask a staff member to start.</div> : thread.turns.map((turn) => {
            const agent = sovereignAgents.find((a) => a.id === turn.agentId) ?? sovereignAgents[0];
            return (
              <div key={turn.id} className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="flex items-start gap-3">
                  <SovereignStaffAvatar agent={agent} size="sm" />
                  <div className="min-w-0 flex-1"><div className="text-white font-bold">{agent.name}</div><div className="text-[10px] uppercase tracking-widest text-white/40">{agent.title}</div><pre className="mt-4 whitespace-pre-wrap text-sm text-white/72 leading-relaxed font-sans">{turn.content}</pre></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
