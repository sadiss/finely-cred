import React, { useMemo, useState } from 'react';
import { MessageSquarePlus, Send } from 'lucide-react';
import { getHumanStaffAgent, recommendAgentsForMission } from './humanStaffDirectory';
import { getStaffRoster, staffFullName } from '../staffCommandCenter/staffRoster';
import { addHumanStaffMessage, humanStaffNowIso, loadHumanStaffStore, makeHumanStaffId, updateHumanStaffThread } from './humanStaffRepo';
import { buildAgentMessage, buildConversationSummary } from './staffResponseEngine';
import { humanStaffDisplayName } from './humanStaffRosterBridge';
import { HumanStaffAvatar } from './HumanStaffAvatar';
import type { HumanStaffAgentId, HumanStaffMessage, HumanStaffThread } from './types';
import {
  STAFF_CMD_BODY,
  STAFF_CMD_EYEBROW,
  STAFF_CMD_KPI,
  STAFF_CMD_PRIMARY_BTN,
  STAFF_CMD_TITLE,
  staffCmdSelected,
} from './humanStaffOsUi';

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
      memory: ['Conversation started from Staff Command Center.'],
    };
    const store = loadHumanStaffStore();
    updateHumanStaffThread(thread);
    return store.threads.find((t) => t.id === thread.id) ?? thread;
  }

  return (
    <div className="space-y-6">
      <div className={`${STAFF_CMD_KPI} p-4 space-y-3`}>
        <div className={`inline-flex items-center gap-2 ${STAFF_CMD_EYEBROW}`}>
          <MessageSquarePlus size={18} />
          <span>Durable threads</span>
        </div>
        <h2 className={STAFF_CMD_TITLE}>Talk to the team, not a mystery bot.</h2>
        <p className={`text-sm ${STAFF_CMD_BODY}`}>Threads remember context, owners, blockers, and prior answers.</p>
        <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
          {store.threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => setActiveThreadId(thread.id)}
              className={`w-full text-left rounded-xl border p-3 transition-all ${
                activeThread?.id === thread.id
                  ? 'border-violet-400/60 bg-violet-500/10'
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <div className="font-bold text-white text-sm line-clamp-1">{thread.title}</div>
              <div className="mt-1 text-xs text-white/40">
                {thread.status} • {thread.messages.length} messages
              </div>
              <p className={`mt-2 text-xs ${STAFF_CMD_BODY} line-clamp-2`}>{thread.summary}</p>
            </button>
          ))}
          {!store.threads.length ? (
            <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm ${STAFF_CMD_BODY}`}>
              No threads yet. Send a message to start one.
            </div>
          ) : null}
        </div>
      </div>

      <div className={`${STAFF_CMD_KPI} p-4 space-y-3`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Active conversation</div>
            <h3 className={`mt-1 ${STAFF_CMD_TITLE}`}>{activeThread?.title ?? 'New staff conversation'}</h3>
            <p className={`mt-1 text-sm ${STAFF_CMD_BODY}`}>{activeThread?.nextAction ?? 'Ask the staff for the next action.'}</p>
          </div>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value as HumanStaffAgentId)}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80"
          >
            {getStaffRoster()
              .filter((s) => s.canBeSelected)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {staffFullName(s)} — {s.title}
                </option>
              ))}
          </select>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 min-h-[380px] max-h-[480px] overflow-auto space-y-3">
          {(activeThread?.messages ?? []).map((message) => {
            const isUser = message.fromAgentId === 'user';
            const agent = isUser ? null : getHumanStaffAgent(message.fromAgentId as HumanStaffAgentId);
            return (
              <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && agent ? <HumanStaffAvatar agent={agent} size="sm" /> : null}
                <div
                  className={`max-w-[82%] rounded-xl border p-3 ${
                    isUser ? 'border-violet-500/30 bg-violet-500/10' : 'border-white/10 bg-black/25'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">
                    {isUser ? 'You' : agent ? humanStaffDisplayName(agent) : 'Staff'}
                  </div>
                  <div className={`mt-2 whitespace-pre-line text-sm ${STAFF_CMD_BODY}`}>{message.body}</div>
                  {message.suggestedActions?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.suggestedActions.map((action) => (
                        <span key={action} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] text-white/45">
                          {action}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3 flex gap-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Ask the staff what to do next..."
            className="min-h-[76px] flex-1 resize-none bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30"
          />
          <button type="button" onClick={sendMessage} disabled={!prompt.trim()} className={`self-end ${STAFF_CMD_PRIMARY_BTN} disabled:opacity-50`}>
            <Send size={14} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
