import React, { useMemo, useState } from 'react';
import { MessageSquarePlus, Send } from 'lucide-react';
import { HUMAN_STAFF_AGENTS, getHumanStaffAgent, recommendAgentsForMission } from './humanStaffDirectory';
import { addHumanStaffMessage, humanStaffNowIso, loadHumanStaffStore, makeHumanStaffId, updateHumanStaffThread } from './humanStaffRepo';
import { buildAgentMessage, buildConversationSummary } from './staffResponseEngine';
import { HumanStaffAvatar } from './HumanStaffAvatar';
import type { HumanStaffAgentId, HumanStaffMessage, HumanStaffThread } from './types';

export function HumanStaffConversationPanel({ selectedIds, onChanged }: { selectedIds: HumanStaffAgentId[]; onChanged: () => void }) {
  const [storeVersion, setStoreVersion] = useState(0);
  const store = useMemo(() => loadHumanStaffStore(), [storeVersion]);
  const [activeThreadId, setActiveThreadId] = useState(store.threads[0]?.id ?? '');
  const activeThread = store.threads.find((thread) => thread.id === activeThreadId) ?? store.threads[0];
  const [prompt, setPrompt] = useState('Explain who should run Deep Swarm and what they do next.');
  const [agentId, setAgentId] = useState<HumanStaffAgentId>(selectedIds[0] ?? 'professor_apex');
  const selectedAgents = (selectedIds.length ? selectedIds : recommendAgentsForMission(activeThread?.missionType ?? 'staff command')).slice(0, 3) as HumanStaffAgentId[];

  function refresh() {
    setStoreVersion((v) => v + 1);
    onChanged();
  }

  function sendMessage() {
    const targetThread = activeThread ?? createStarterThread(prompt, selectedAgents);
    const toAgentIds = selectedAgents.filter((id) => id !== agentId);
    const userMessage: HumanStaffMessage = {
      id: makeHumanStaffId('msg'),
      createdAt: humanStaffNowIso(),
      fromAgentId: 'user',
      toAgentIds: selectedAgents,
      body: prompt,
      tone: 'direct',
      priority: 'normal',
      tags: ['user-note'],
      suggestedActions: ['Ask staff to respond', 'Update mission memory'],
    };
    addHumanStaffMessage(targetThread.id, userMessage);
    const staffReply = buildAgentMessage({ agentId, toAgentIds, userAsk: prompt, missionType: targetThread.missionType, cityIds: targetThread.cityIds });
    const nextStore = addHumanStaffMessage(targetThread.id, staffReply);
    const latest = nextStore.threads.find((thread) => thread.id === targetThread.id);
    if (latest) {
      updateHumanStaffThread({ ...latest, summary: buildConversationSummary(latest.messages), nextAction: staffReply.suggestedActions?.[0] ?? 'Review staff response' });
    }
    setPrompt('');
    setActiveThreadId(targetThread.id);
    refresh();
  }

  function createStarterThread(title: string, agents: HumanStaffAgentId[]): HumanStaffThread {
    const thread: HumanStaffThread = {
      id: makeHumanStaffId('thread'),
      createdAt: humanStaffNowIso(),
      updatedAt: humanStaffNowIso(),
      title: title.slice(0, 70) || 'Staff conversation',
      missionType: 'staff_conversation',
      status: 'open',
      cityIds: [],
      assignedAgentIds: agents,
      messages: [],
      summary: 'New staff conversation started.',
      nextAction: 'Ask the assigned staff for their first recommendation.',
      memory: ['Conversation started from Human Staff OS.'],
    };
    const store = loadHumanStaffStore();
    updateHumanStaffThread(thread);
    return store.threads.find((t) => t.id === thread.id) ?? thread;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="xl:col-span-4 rounded-[30px] border border-white/10 bg-black/25 p-5 space-y-4">
        <div className="inline-flex items-center gap-2 text-amber-300"><MessageSquarePlus size={18} /><span className="text-[10px] font-black uppercase tracking-widest">Durable staff threads</span></div>
        <h2 className="text-2xl font-black text-white">Talk to the team, not a mystery bot.</h2>
        <p className="text-sm text-white/55">Threads remember context, owners, blockers, and prior answers. The response engine varies openings, tone, and next actions by agent.</p>
        <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
          {store.threads.map((thread) => (
            <button key={thread.id} type="button" onClick={() => setActiveThreadId(thread.id)} className={`w-full text-left rounded-2xl border p-4 ${activeThread?.id === thread.id ? 'border-amber-400/60 bg-amber-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}>
              <div className="font-black text-white line-clamp-1">{thread.title}</div>
              <div className="mt-1 text-xs text-white/40">{thread.status} • {thread.messages.length} messages</div>
              <p className="mt-2 text-sm text-white/55 line-clamp-2">{thread.summary}</p>
            </button>
          ))}
          {!store.threads.length ? <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">No threads yet. Send a message to start one.</div> : null}
        </div>
      </div>

      <div className="xl:col-span-8 rounded-[30px] border border-white/10 bg-black/25 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Active conversation</div>
            <h3 className="mt-1 text-2xl font-black text-white">{activeThread?.title ?? 'New staff conversation'}</h3>
            <p className="mt-1 text-sm text-white/50">{activeThread?.nextAction ?? 'Ask the staff for the next action.'}</p>
          </div>
          <select value={agentId} onChange={(e) => setAgentId(e.target.value as HumanStaffAgentId)} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80">
            {HUMAN_STAFF_AGENTS.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
          </select>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 min-h-[420px] max-h-[520px] overflow-auto space-y-4">
          {(activeThread?.messages ?? []).map((message) => {
            const isUser = message.fromAgentId === 'user';
            const agent = isUser ? null : getHumanStaffAgent(message.fromAgentId as HumanStaffAgentId);
            return (
              <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && agent ? <HumanStaffAvatar agent={agent} size="sm" /> : null}
                <div className={`max-w-[82%] rounded-2xl border p-4 ${isUser ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-black/25'}`}>
                  <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">{isUser ? 'You' : agent?.name}</div>
                  <div className="mt-2 whitespace-pre-line text-sm text-white/70">{message.body}</div>
                  {message.suggestedActions?.length ? <div className="mt-3 flex flex-wrap gap-2">{message.suggestedActions.map((action) => <span key={action} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/45">{action}</span>)}</div> : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-3 flex gap-3">
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Ask the staff what to do next..." className="min-h-[76px] flex-1 resize-none bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30" />
          <button type="button" onClick={sendMessage} disabled={!prompt.trim()} className="self-end inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-50"><Send size={14} />Send</button>
        </div>
      </div>
    </div>
  );
}
