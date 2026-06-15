import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, RotateCcw, Send, Sparkles, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AiGatewayMessage } from '../../lib/aiClient';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { converseWithFinelyAi } from '../../lib/conversationalAi';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import { getAgentPersona } from '../../domain/agentPersonas';
import { getPortalStaffPersona, portalPersonaForLane } from '../../data/agentPersonasRepo';
import { loadStaffRoster, resolveStaffOnDuty } from '../../data/staffRoster';
import { staffMemberFullName, type StaffMember } from '../../domain/staffMember';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import { resolveStaffPortraitUrl, STAFF_PORTRAIT_PHOTO_CLASS } from '../../lib/staffPortrait';
import { getPublicChatPersonaPresentation } from './publicChatPersonaUi';
import {
  AI_SUGGESTION_TREE,
  DASHBOARD_AI_COACH_SYSTEM,
  type AiSuggestionNode,
} from './communicationHubModel';
import {
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsMessageBubble,
  FINELY_OS_ENTITY_SUBLABEL,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsAiGatewayBanner } from '../../features/os/FinelyOsAiGatewayBanner';
import {
  addThreadMessage,
  getOrCreateThreadBySubject,
  listMessagesByThread,
} from '../../data/supportRepo';
import type { SupportTopic } from '../../domain/support';
import {
  buildThreadSubject,
  routeCommsIntent,
  type CommsRoutingSuggestion,
} from '../../lib/commsIntentRouter';
import { recordCommsRoutingFeedback } from '../../lib/staffIntelligenceEngine';

type Props = {
  partnerId?: string;
  lane?: string;
  journeyStage?: string;
  compact?: boolean;
  userName?: string;
  initialTopic?: SupportTopic;
};

type ChatMessage = AiGatewayMessage & {
  id: string;
  ts: string;
  source?: 'gateway' | 'knowledge_local' | 'team' | 'system';
  staffName?: string;
};

function newMsgId() {
  return `msg_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function greeting(firstName: string, userName?: string) {
  const you = userName?.trim().split(/\s+/)[0];
  if (you && you.length >= 2) {
    return `Hey ${you} — I'm ${firstName}. Just talk to me like a person. I'll route you to the right specialist when you need a human — no dropdowns, no picking threads.`;
  }
  return `Hey — I'm ${firstName}. Talk naturally; I'll suggest the right person or team when it helps.`;
}

export function HubUnifiedConversationPanel({
  partnerId,
  lane,
  journeyStage,
  compact,
  userName,
  initialTopic,
}: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const enabled = isFeatureEnabled('aiGateway');
  const messagingEnabled = isFeatureEnabled('inAppMessaging');
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [path, setPath] = useState<AiSuggestionNode[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [routingChips, setRoutingChips] = useState<CommsRoutingSuggestion[]>([]);
  const [personaId, setPersonaId] = useState<AgentPersonaId>(() => portalPersonaForLane(lane).id);
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(() => resolveStaffOnDuty(portalPersonaForLane(lane).id));
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [storeVersion, setStoreVersion] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const persona = useMemo(() => getPortalStaffPersona(personaId), [personaId]);
  const presentation = useMemo(() => {
    const base = getPublicChatPersonaPresentation(persona);
    if (!activeStaff) return base;
    return {
      ...base,
      firstName: activeStaff.firstName,
      avatarUrl: resolveStaffPortraitUrl(activeStaff),
      initials: `${activeStaff.firstName[0] ?? ''}${activeStaff.lastName[0] ?? ''}`.toUpperCase(),
    };
  }, [persona, activeStaff]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: newMsgId(),
      role: 'assistant',
      content: greeting('your coach', userName),
      ts: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    setMessages([
      { id: newMsgId(), role: 'assistant', content: greeting(presentation.firstName, userName), ts: new Date().toISOString() },
    ]);
  }, [presentation.firstName, userName]);

  useEffect(() => {
    setPersonaId(portalPersonaForLane(lane).id);
    setActiveStaff(resolveStaffOnDuty(portalPersonaForLane(lane).id));
  }, [lane]);

  useEffect(() => {
    const onStaffDm = (e: Event) => {
      const detail = (e as CustomEvent).detail as { staffId?: string };
      if (!detail?.staffId) return;
      const staff = loadStaffRoster().find((s) => s.id === detail.staffId);
      if (staff) {
        setActiveStaff(staff);
        setPersonaId(staff.primaryRoleId);
      }
    };
    window.addEventListener('finely:staff-direct-message', onStaffDm as EventListener);
    return () => window.removeEventListener('finely:staff-direct-message', onStaffDm as EventListener);
  }, []);

  const teamReplies = useMemo(() => {
    if (!activeThreadId) return [];
    return listMessagesByThread(activeThreadId).filter((m) => !m.fromPartner);
  }, [activeThreadId, storeVersion]);

  useEffect(() => {
    if (!teamReplies.length) return;
    const latest = teamReplies[teamReplies.length - 1]!;
    setMessages((prev) => {
      if (prev.some((m) => m.id === latest.id)) return prev;
      return [
        ...prev,
        {
          id: latest.id,
          role: 'assistant' as const,
          content: latest.body,
          ts: latest.createdAt,
          source: 'team' as const,
          staffName: 'Finely team',
        },
      ];
    });
  }, [teamReplies]);

  const ctx = useMemo(
    () => ({
      surface: 'communication_hub' as const,
      partnerId,
      lane,
      journeyStage,
      userName,
      personaId,
      staffMemberId: activeStaff?.id,
      pathname,
    }),
    [partnerId, lane, journeyStage, userName, personaId, activeStaff?.id, pathname],
  );

  const currentNodes = useMemo(() => {
    if (path.length === 0) return AI_SUGGESTION_TREE;
    return path[path.length - 1]?.children ?? [];
  }, [path]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, routingChips]);

  const handoffToTeam = useCallback(
    (args: { body: string; suggestion: CommsRoutingSuggestion; topic?: SupportTopic }) => {
      if (!partnerId || !messagingEnabled) return null;
      const staff = args.suggestion.staffId
        ? loadStaffRoster().find((s) => s.id === args.suggestion.staffId) ?? activeStaff
        : activeStaff;
      const topic = args.topic ?? args.suggestion.topic ?? initialTopic ?? 'general';
      const subject = buildThreadSubject({ topic, staff, snippet: args.body });
      const thread = getOrCreateThreadBySubject({ partnerId, topic, subject });
      addThreadMessage({
        threadId: thread.id,
        partnerId,
        topic,
        fromPartner: true,
        body: args.body,
      });
      setActiveThreadId(thread.id);
      window.dispatchEvent(new CustomEvent('finely:store'));
      return thread;
    },
    [partnerId, messagingEnabled, activeStaff, initialTopic],
  );

  const applySuggestion = useCallback(
    async (suggestion: CommsRoutingSuggestion, lastUserText: string) => {
      recordCommsRoutingFeedback({
        intent: routeCommsIntent({ message: lastUserText, lane }).intent,
        staffId: suggestion.staffId,
        personaId: suggestion.personaId,
        kind: suggestion.kind,
      });

      if (suggestion.kind === 'navigate' || suggestion.kind === 'book_call') {
        if (suggestion.navigate) navigate(suggestion.navigate);
        return;
      }

      if (suggestion.kind === 'staff_ai' && suggestion.staffId) {
        const staff = loadStaffRoster().find((s) => s.id === suggestion.staffId);
        if (staff) {
          setActiveStaff(staff);
          setPersonaId(staff.primaryRoleId);
          const p = getAgentPersona(staff.primaryRoleId);
          setMessages((prev) => [
            ...prev,
            {
              id: newMsgId(),
              role: 'assistant',
              content: `You're now with ${staffMemberFullName(staff)} (${p?.displayTitle ?? p?.role ?? 'specialist'}). What should we tackle?`,
              ts: new Date().toISOString(),
              source: 'system',
            },
          ]);
        }
        return;
      }

      if (suggestion.kind === 'team_handoff' && lastUserText.trim()) {
        const thread = handoffToTeam({ body: lastUserText, suggestion });
        if (thread) {
          setMessages((prev) => [
            ...prev,
            {
              id: newMsgId(),
              role: 'assistant',
              content: `Sent to our team (${thread.subject}). They'll reply here — you'll see it in this same conversation.`,
              ts: new Date().toISOString(),
              source: 'system',
            },
          ]);
        }
      }
    },
    [handoffToTeam, lane, navigate],
  );

  const sendPrompt = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setErr(null);
      setBusy(true);
      setInput('');
      const userMsg: ChatMessage = { id: newMsgId(), role: 'user', content: trimmed, ts: new Date().toISOString() };
      const history = [...messages, userMsg];
      setMessages(history);

      const routed = routeCommsIntent({ message: trimmed, lane, journeyStage });
      setRoutingChips(routed.suggestions);

      if (routed.preferredStaff[0] && routed.classifiedPersonaId !== personaId) {
        setPersonaId(routed.classifiedPersonaId);
        setActiveStaff(routed.preferredStaff[0] ?? null);
      }

      const activePersona = getPortalStaffPersona(routed.classifiedPersonaId);

      try {
        const result = await converseWithFinelyAi({
          messages: history.map(({ role, content }) => ({ role, content })),
          userMessage: trimmed,
          systemPromptBase: `${activePersona.systemPrompt}\n\n${DASHBOARD_AI_COACH_SYSTEM}\n\nIf the partner needs a human, suggest they tap a routing chip — never tell them to pick a thread or dropdown.`,
          taskType: 'portal_chat',
          context: ctx,
          providerHint: 'openai',
        });

        setMessages((prev) => [
          ...prev,
          {
            id: newMsgId(),
            role: 'assistant',
            content: result.text,
            ts: new Date().toISOString(),
            source: result.source,
          },
        ]);
        setFollowUps(result.followUps);
      } catch (e: unknown) {
        setErr((e as Error)?.message || 'Coach unavailable.');
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, ctx, lane, journeyStage, personaId],
  );

  const onPickTree = (node: AiSuggestionNode) => {
    if (node.children?.length) {
      setPath((prev) => [...prev, node]);
      return;
    }
    if (node.navigate) navigate(node.navigate);
    if (node.prompt) void sendPrompt(node.prompt);
  };

  const clearChat = () => {
    setMessages([
      { id: newMsgId(), role: 'assistant', content: greeting(presentation.firstName, userName), ts: new Date().toISOString() },
    ]);
    setFollowUps([]);
    setRoutingChips([]);
    setPath([]);
    setErr(null);
    setActiveThreadId(null);
  };

  return (
    <div className="flex flex-col h-full min-h-[320px]">
      <div className="shrink-0 px-4 py-2 border-b border-emerald-500/20 space-y-2 bg-white/[0.07]">
        <div className="flex items-center gap-3">
          {activeStaff ? (
            <StaffPortraitImg staff={activeStaff} className="w-10 h-10 rounded-full border border-emerald-400/30" />
          ) : (
            <img src={presentation.avatarUrl} alt="" className={`w-10 h-10 rounded-full border border-emerald-400/30 ${STAFF_PORTRAIT_PHOTO_CLASS}`} />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-emerald-300/90 font-black inline-flex items-center gap-1.5">
              <Sparkles size={11} />
              {presentation.firstName} · {persona.displayTitle ?? persona.role}
            </div>
            <div className={`text-[10px] ${FINELY_OS_ENTITY_SUBLABEL} mt-0.5`}>
              One conversation — AI routes you to the right human automatically
            </div>
          </div>
          <button type="button" onClick={clearChat} className={FINELY_OS_SECONDARY_BTN}>
            <RotateCcw size={11} /> Clear
          </button>
        </div>
      </div>

      {!enabled ? <FinelyOsAiGatewayBanner compact className="mx-3 mt-2 !p-2" /> : null}

      <div ref={scrollerRef} className={`flex-1 overflow-y-auto space-y-3 ${compact ? 'p-3' : 'p-4'}`}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start gap-2.5'}`}>
            {m.role === 'assistant' ? (
              activeStaff ? (
                <StaffPortraitImg staff={activeStaff} className="w-8 h-8 rounded-full shrink-0 mt-0.5 border border-emerald-400/25" />
              ) : (
                <img src={presentation.avatarUrl} alt="" className={`w-8 h-8 rounded-full shrink-0 mt-0.5 border border-emerald-400/25 ${STAFF_PORTRAIT_PHOTO_CLASS}`} />
              )
            ) : null}
            <div className="max-w-[92%] space-y-1">
              {m.role === 'assistant' ? (
                <div className={`text-[10px] font-bold ${FINELY_OS_ENTITY_SUBLABEL} px-1`}>
                  {m.source === 'team' ? m.staffName ?? 'Team' : `${presentation.firstName}`}
                  {m.source === 'team' ? ' · replied' : ''}
                </div>
              ) : null}
              <div
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user' ? 'rounded-2xl px-4 py-3 text-black' : finelyOsMessageBubble('assistant')
                }`}
                style={
                  m.role === 'user'
                    ? {
                        backgroundImage:
                          'linear-gradient(145deg, rgba(251,191,36,0.95) 0%, rgba(245,158,11,0.95) 45%, rgba(217,119,6,0.95) 100%)',
                      }
                    : undefined
                }
              >
                {m.content}
              </div>
            </div>
          </div>
        ))}

        {routingChips.length ? (
          <div className="space-y-2 pt-1">
            <div className={`text-[10px] font-black uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>
              Suggested next step
            </div>
            <div className="flex flex-wrap gap-2">
              {routingChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    const lastUser = [...messages].reverse().find((x) => x.role === 'user')?.content ?? input;
                    void applySuggestion(chip, lastUser);
                  }}
                  className="px-3 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-left hover:bg-emerald-500/20 transition-all max-w-[220px]"
                >
                  <div className="text-xs font-semibold text-emerald-100">
                    {chip.emoji ? `${chip.emoji} ` : ''}
                    {chip.label}
                  </div>
                  {chip.hint ? <div className="text-[10px] text-white/50 mt-0.5">{chip.hint}</div> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {followUps.length ? (
          <div className="flex flex-wrap gap-2">
            {followUps.map((f) => (
              <button key={f} type="button" onClick={() => void sendPrompt(f)} className={finelyOsInlineListItem()}>
                {f}
              </button>
            ))}
          </div>
        ) : null}

        {path.length === 0 && currentNodes.length ? (
          <div className="space-y-2 pt-2">
            <div className={`text-[10px] font-black uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>Quick starts</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {currentNodes.map((node) => (
                <button key={node.id} type="button" onClick={() => onPickTree(node)} className={`${finelyOsInlineListItem()} text-left !py-3`}>
                  <span className="mr-1">{node.emoji}</span> {node.label}
                  {node.hint ? <span className="block text-[10px] text-white/45 mt-0.5">{node.hint}</span> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {path.length ? (
          <div className="flex flex-wrap gap-2 items-center">
            <button type="button" onClick={() => setPath((p) => p.slice(0, -1))} className={FINELY_OS_SECONDARY_BTN}>
              ← Back
            </button>
            {currentNodes.map((node) => (
              <button key={node.id} type="button" onClick={() => onPickTree(node)} className={finelyOsInlineListItem()}>
                {node.emoji} {node.label} <ChevronRight size={12} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {err ? <div className="px-4 text-rose-300 text-xs">{err}</div> : null}

      <div className={`shrink-0 border-t border-white/[0.08] ${compact ? 'p-3' : 'p-4'} space-y-2`}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendPrompt(input);
              }
            }}
            placeholder="Type naturally — billing, disputes, funding, anything…"
            className={`flex-1 ${FINELY_OS_ENTITY_INPUT}`}
            disabled={busy}
          />
          <button type="button" disabled={busy || !input.trim()} onClick={() => void sendPrompt(input)} className={FINELY_OS_PRIMARY_BTN}>
            <Send size={16} />
          </button>
        </div>
        {messagingEnabled && activeThreadId ? (
          <button type="button" onClick={() => setShowHistory((v) => !v)} className="text-[10px] text-emerald-300/80 inline-flex items-center gap-1">
            <Users size={11} /> {showHistory ? 'Hide' : 'Show'} team thread detail
          </button>
        ) : null}
      </div>
    </div>
  );
}
