import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, ExternalLink, Mic, MicOff, RotateCcw, Send, Sparkles, Volume2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { AiGatewayMessage } from '../../lib/aiClient';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { converseWithFinelyAi } from '../../lib/conversationalAi';
import { classifyMessageIntent } from '../../lib/intentClassifier';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import { getAgentPersona } from '../../domain/agentPersonas';
import { getPortalStaffPersona, portalPersonaForLane } from '../../data/agentPersonasRepo';
import { consumeAgentHandoff } from '../../lib/agentHandoffBridge';
import { resolveToolPath, toolsForPersona } from '../../lib/agentPersonaTools';
import { listPortalStaffForLane, resolveStaffOnDuty, loadStaffRoster } from '../../data/staffRoster';
import { staffMemberFullName, type StaffMember } from '../../domain/staffMember';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import { resolveStaffPortraitUrl, STAFF_PORTRAIT_PHOTO_CLASS } from '../../lib/staffPortrait';
import { getPublicChatPersonaPresentation } from './publicChatPersonaUi';
import {
  AI_SUGGESTION_TREE,
  DASHBOARD_AI_COACH_SYSTEM,
  openCommunicationHub,
  type AiSuggestionNode,
} from './communicationHubModel';
import { routeCommsIntent, buildThreadSubject, type CommsRoutingSuggestion } from '../../lib/commsIntentRouter';
import { recordCommsRoutingFeedback } from '../../lib/staffIntelligenceEngine';
import { addThreadMessage, getOrCreateThreadBySubject } from '../../data/supportRepo';
import type { SupportTopic } from '../../domain/support';
import {
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsMessageBubble,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsAiGatewayBanner } from '../../features/os/FinelyOsAiGatewayBanner';
import { useFinelyVoiceInput, speakFinelyText } from '../../hooks/useFinelyVoiceInput';

type Props = {
  partnerId?: string;
  lane?: string;
  journeyStage?: string;
  compact?: boolean;
  userName?: string;
};

type ChatMessage = AiGatewayMessage & { id: string; ts: string; source?: 'gateway' | 'knowledge_local' };

function newMsgId() {
  return `msg_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function buildCoachGreeting(firstName: string, userName?: string) {
  const you = userName?.trim().split(/\s+/)[0];
  if (you && you.length >= 2) {
    return `Hey ${you} — I'm ${firstName}, your in-dashboard coach. What's on your mind? Tap a suggestion below, or tell me what you're working on.`;
  }
  return `Hey — I'm ${firstName}, your in-dashboard coach. What's on your mind? Tap a suggestion below, or tell me what you're working on.`;
}

export function HubAiCoachPanel({ partnerId, lane, journeyStage, compact, userName }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const enabled = isFeatureEnabled('aiGateway');
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [path, setPath] = useState<AiSuggestionNode[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [personaId, setPersonaId] = useState<AgentPersonaId>(() => portalPersonaForLane(lane).id);
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);
  const [handoffBanner, setHandoffBanner] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [routingChips, setRoutingChips] = useState<CommsRoutingSuggestion[]>([]);
  const [lastUserText, setLastUserText] = useState('');

  const rosterTabs = useMemo(() => listPortalStaffForLane(lane), [lane]);
  const persona = useMemo(() => getPortalStaffPersona(personaId), [personaId]);
  const activeStaff: StaffMember | null = useMemo(() => {
    if (activeStaffId) return rosterTabs.find((s) => s.id === activeStaffId) ?? resolveStaffOnDuty(personaId);
    return resolveStaffOnDuty(personaId);
  }, [activeStaffId, rosterTabs, personaId]);

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

  const displayTitle = persona.displayTitle ?? persona.role;

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: newMsgId(),
      role: 'assistant',
      content: buildCoachGreeting('your coach', userName),
      ts: new Date().toISOString(),
    },
  ]);

  const voice = useFinelyVoiceInput((text) => setInput(text));
  const lastAssistantText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m?.role === 'assistant' && m.content.trim()) return m.content.trim();
    }
    return '';
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: newMsgId(),
        role: 'assistant',
        content: buildCoachGreeting(presentation.firstName, userName),
        ts: new Date().toISOString(),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentation.firstName, userName]);

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

  useEffect(() => {
    setPersonaId(portalPersonaForLane(lane).id);
    setActiveStaffId(null);
  }, [lane]);

  useEffect(() => {
    const handoff = consumeAgentHandoff();
    if (!handoff) return;
    setConnecting(true);
    setPersonaId(handoff.personaId);
    const staff = resolveStaffOnDuty(handoff.personaId);
    if (staff) setActiveStaffId(staff.id);
    const p = getPortalStaffPersona(handoff.personaId);
    const title = p.displayTitle ?? p.role;
    const name = staff ? staffMemberFullName(staff) : p.name;
    setHandoffBanner(`Continuing from your funnel chat with ${name}, ${title}.`);
    const t = window.setTimeout(() => {
      setConnecting(false);
      setMessages([
        {
          id: newMsgId(),
          role: 'assistant',
          content: handoff.leadId
            ? `Welcome back — ${name} here (${title}). I see you connected from our site (ref ${handoff.leadId}). What would you like to tackle first in your portal?`
            : `Welcome — ${name} here (${title}), continuing from your earlier conversation. How can I help in your dashboard today?`,
          ts: new Date().toISOString(),
        },
      ]);
    }, 450);
    return () => window.clearTimeout(t);
  }, []);

  const switchStaff = (member: StaffMember) => {
    if (member.primaryRoleId !== personaId) {
      setConnecting(true);
      setPersonaId(member.primaryRoleId);
      const p = getAgentPersona(member.primaryRoleId);
      setHandoffBanner(`Connecting you with ${staffMemberFullName(member)}, ${p?.displayTitle ?? p?.role ?? ''}…`);
      window.setTimeout(() => {
        setActiveStaffId(member.id);
        setConnecting(false);
        setHandoffBanner(null);
      }, 400);
    } else {
      setActiveStaffId(member.id);
    }
  };

  const currentNodes = useMemo(() => {
    if (path.length === 0) return AI_SUGGESTION_TREE;
    return path[path.length - 1]?.children ?? [];
  }, [path]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, connecting]);

  const sendPrompt = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setErr(null);
      setBusy(true);
      setInput('');
      setLastUserText(trimmed);
      const routed = routeCommsIntent({ message: trimmed, lane, journeyStage });
      setRoutingChips(routed.suggestions);
      if (routed.preferredStaff[0] && routed.classifiedPersonaId !== personaId) {
        setPersonaId(routed.classifiedPersonaId);
        setActiveStaffId(routed.preferredStaff[0]?.id ?? null);
      }
      const userMsg: ChatMessage = { id: newMsgId(), role: 'user', content: trimmed, ts: new Date().toISOString() };
      const history = [...messages, userMsg];
      setMessages(history);

      const classified = classifyMessageIntent(trimmed);
      let activePersona = persona;
      if (classified.confidence >= 0.6 && classified.suggestedPersonaId !== personaId) {
        setPersonaId(classified.suggestedPersonaId);
        activePersona = getPortalStaffPersona(classified.suggestedPersonaId);
        const staff = resolveStaffOnDuty(classified.suggestedPersonaId);
        if (staff) setActiveStaffId(staff.id);
      }

      try {
        const result = await converseWithFinelyAi({
          messages: history.map(({ role, content }) => ({ role, content })),
          userMessage: trimmed,
          systemPromptBase: `${activePersona.systemPrompt}\n\n${DASHBOARD_AI_COACH_SYSTEM}`,
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
        setErr((e as Error)?.message || 'AI coach unavailable.');
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, ctx, persona, personaId],
  );

  const onPickSuggestion = (node: AiSuggestionNode) => {
    if (node.children?.length) {
      setPath((prev) => [...prev, node]);
      return;
    }
    if (node.navigate) navigate(node.navigate);
    if (node.prompt) void sendPrompt(node.prompt);
  };

  const clearChat = () => {
    setMessages([
      {
        id: newMsgId(),
        role: 'assistant',
        content: buildCoachGreeting(presentation.firstName, userName),
        ts: new Date().toISOString(),
      },
    ]);
    setFollowUps([]);
    setPath([]);
    setErr(null);
    setHandoffBanner(null);
    setRoutingChips([]);
  };

  const applyRoutingChip = (chip: CommsRoutingSuggestion) => {
    recordCommsRoutingFeedback({
      intent: routeCommsIntent({ message: lastUserText || input, lane }).intent,
      staffId: chip.staffId,
      personaId: chip.personaId,
      kind: chip.kind,
    });
    if (chip.kind === 'navigate' || chip.kind === 'book_call') {
      if (chip.navigate) navigate(chip.navigate);
      return;
    }
    if (chip.kind === 'staff_ai' && chip.staffId) {
      const staff = listPortalStaffForLane(lane).find((s) => s.id === chip.staffId);
      if (staff) switchStaff(staff);
      return;
    }
    if (chip.kind === 'team_handoff' && partnerId && lastUserText.trim()) {
      const staff = chip.staffId ? loadStaffRoster().find((s) => s.id === chip.staffId) : activeStaff;
      const topic = chip.topic ?? 'general';
      const subject = buildThreadSubject({ topic, staff: staff ?? null, snippet: lastUserText });
      const thread = getOrCreateThreadBySubject({ partnerId, topic, subject });
      addThreadMessage({
        threadId: thread.id,
        partnerId,
        topic,
        fromPartner: true,
        body: lastUserText.trim(),
      });
      openCommunicationHub({ tab: 'team', threadId: thread.id, topic, expanded: true });
      setHandoffBanner(`Sent to ${staff ? staffMemberFullName(staff) : 'team'} — check Team chat for replies.`);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[320px]">
      <div className="shrink-0 px-4 py-2 border-b border-emerald-500/20 space-y-2 bg-white/[0.07]">
        {handoffBanner ? (
          <div className="text-[11px] text-emerald-200/90 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
            {handoffBanner}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          {connecting ? (
            <div className="w-10 h-10 rounded-full border-2 border-emerald-400/40 border-t-emerald-300 animate-spin" />
          ) : activeStaff ? (
            <StaffPortraitImg staff={activeStaff} className="w-10 h-10 rounded-full border border-emerald-400/30" />
          ) : (
            <img src={presentation.avatarUrl} alt="" className={`w-10 h-10 rounded-full border border-emerald-400/30 ${STAFF_PORTRAIT_PHOTO_CLASS}`} />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-emerald-300/90 font-black inline-flex items-center gap-1.5">
              <Sparkles size={11} />
              {connecting ? 'Connecting…' : `${presentation.firstName} · ${displayTitle}`}
              {!enabled ? <span className="text-white/40 normal-case font-semibold">(local)</span> : null}
            </div>
            {!connecting && activeStaff ? (
              <div className="text-[9px] text-emerald-300/80 mt-0.5 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active now
              </div>
            ) : null}
          </div>
          <button type="button" onClick={clearChat} className={FINELY_OS_SECONDARY_BTN}>
            <RotateCcw size={11} /> Clear
          </button>
        </div>

        <p className="text-[10px] text-white/50">
          Type your question — routing chips appear after each reply to connect you with the right specialist or team chat.
        </p>

        <div className="flex flex-wrap gap-1">
          {toolsForPersona(personaId).map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => navigate(resolveToolPath(tool, { goal: lane, partnerId }))}
              className="px-2 py-0.5 rounded-full text-[9px] border border-emerald-500/20 text-emerald-200/80 hover:bg-emerald-500/10"
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      {!enabled ? <FinelyOsAiGatewayBanner compact className="mx-3 mt-2 !p-2" /> : null}

      <div ref={scrollerRef} className={`flex-1 overflow-y-auto space-y-3 ${compact ? 'p-3' : 'p-4'}`}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start gap-2.5'}`}
          >
            {m.role === 'assistant' ? (
              <img
                src={presentation.avatarUrl}
                alt=""
                className={`w-8 h-8 rounded-full shrink-0 mt-0.5 border border-emerald-400/25 ${STAFF_PORTRAIT_PHOTO_CLASS}`}
              />
            ) : null}
            <div className="max-w-[92%] space-y-1">
              {m.role === 'assistant' ? (
                <div className={`text-[10px] font-bold ${FINELY_OS_ENTITY_SUBLABEL} px-1`}>
                  {presentation.firstName} · {displayTitle}
                </div>
              ) : null}
              <div
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'rounded-2xl px-4 py-3 text-black'
                    : finelyOsMessageBubble('assistant')
                }`}
                style={
                  m.role === 'user'
                    ? {
                        backgroundImage:
                          'linear-gradient(145deg, rgba(251,191,36,0.95) 0%, rgba(245,158,11,0.95) 45%, rgba(217,119,6,0.95) 100%)',
                        boxShadow: '0 18px 44px -26px rgba(245,158,11,0.70)',
                      }
                    : undefined
                }
              >
                {m.content}
              </div>
              {m.role === 'assistant' && m.source ? (
                <div className="text-[9px] text-white/30 px-1">
                  {m.source === 'gateway' ? `${presentation.firstName} · live` : `${presentation.firstName} · knowledge base`}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {busy || connecting ? (
          <div className="flex justify-start">
            <div className={`${finelyOsInlineListItem()} px-4 py-3 inline-flex items-center gap-1.5`}>
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:120ms]" />
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:240ms]" />
            </div>
          </div>
        ) : null}
        {err ? <div className="text-[11px] text-red-200/90">{err}</div> : null}
      </div>

      {followUps.length > 0 && (
        <div className="px-3 py-2 border-t border-white/[0.08] flex flex-wrap gap-1.5 bg-black/15">
          {followUps.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => void sendPrompt(f.replace(/^Open /, 'How do I use '))}
              className="px-2.5 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[10px] text-emerald-100 hover:bg-emerald-500/15"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {routingChips.length > 0 ? (
        <div className="px-3 py-2 border-t border-white/[0.08] space-y-2 bg-emerald-500/5">
          <div className="text-[10px] uppercase tracking-widest text-emerald-300/90 font-black">Suggested next step</div>
          <div className="flex flex-wrap gap-2">
            {routingChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => applyRoutingChip(chip)}
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

      <div className="border-t border-white/[0.08] p-3 space-y-2 bg-white/[0.05]">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-fuchsia-300/90 font-black">
          <Sparkles size={12} />
          {path.length === 0 ? 'Try asking about…' : path[path.length - 1]?.label}
          {path.length > 0 && (
            <button
              type="button"
              onClick={() => setPath((p) => p.slice(0, -1))}
              className="ml-auto text-white/50 hover:text-white normal-case tracking-normal font-semibold"
            >
              ← Back
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
          {currentNodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onPickSuggestion(node)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-white/90 text-xs font-semibold transition-all"
              title={node.hint}
            >
              <span>{node.emoji}</span>
              <span>{node.label}</span>
              {node.children?.length ? <ChevronRight size={12} className="text-fuchsia-200/80" /> : null}
              {node.navigate && !node.children?.length ? <ExternalLink size={11} className="text-white/40" /> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-white/[0.08] flex items-center gap-2">
        {voice.supported ? (
          <button
            type="button"
            onClick={() => (voice.listening ? voice.stop() : voice.start())}
            className={`inline-flex items-center justify-center ${FINELY_OS_SECONDARY_BTN} !px-3`}
            title={voice.listening ? 'Stop listening' : 'Speak your question'}
            disabled={busy}
          >
            {voice.listening ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
        ) : null}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell me what you're working on…"
          className={`flex-1 ${FINELY_OS_ENTITY_INPUT} !mt-0 border-emerald-500/20 focus:border-emerald-500/40`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void sendPrompt(input);
            }
          }}
          disabled={busy}
        />
        {lastAssistantText ? (
          <button
            type="button"
            onClick={() => speakFinelyText(lastAssistantText)}
            className={`inline-flex items-center justify-center ${FINELY_OS_SECONDARY_BTN} !px-3`}
            title="Read last reply aloud"
          >
            <Volume2 size={14} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void sendPrompt(input)}
          disabled={busy || !input.trim()}
          className={`inline-flex items-center justify-center gap-1.5 ${FINELY_OS_PRIMARY_BTN} disabled:opacity-50`}
        >
          <Send size={14} /> {busy ? '…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
