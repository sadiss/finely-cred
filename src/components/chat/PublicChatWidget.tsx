import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Headphones, Loader2, Send, Sparkles, ShieldCheck, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitLeadCapture } from '../../data/leadsRepo';
import { converseWithFinelyAi } from '../../lib/conversationalAi';
import { classifyMessageIntent } from '../../lib/intentClassifier';
import { publicChatPersonaForGoal, getAgentPersona, type AgentPersona } from '../../domain/agentPersonas';
import { personaOnDutyAt } from '../../data/agentPersonasRepo';
import { saveAgentHandoff } from '../../lib/agentHandoffBridge';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import { OPEN_PUBLIC_CHAT_EVENT, type PublicChatGoal } from '../../lib/publicChatEvents';
import { emitPlatformEvent } from '../../domain/platformEvents';
import { resolveToolPath, toolsForPersona } from '../../lib/agentPersonaTools';
import type { AiGatewayMessage } from '../../lib/aiClient';
import { getPublicChatPersonaPresentation, getPublicChatPersonaPresentationById } from './publicChatPersonaUi';
import { PublicChatStaffAvatar } from './PublicChatStaffAvatar';
import { playStaffReplyAudio, stopStaffReplyAudio } from '../../lib/publicChatStaffVoice';
import { getVoiceStudioStatus } from '../../lib/voiceStudioClient';
import {
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

type ChatRole = 'bot' | 'user';
type ChatMsg = {
  id: string;
  role: ChatRole;
  text: string;
  source?: 'gateway' | 'knowledge_local';
  personaId?: AgentPersonaId;
  kbRefs?: string[];
};

type Goal = 'personal' | 'business' | 'tradelines' | 'debt' | 'not_sure';

const GENERIC_WELCOME =
  "Hi — welcome to Finely Cred. Pick a lane below or describe what you're working on; we'll connect you with the right specialist.";

const LANE_OPTIONS = [
  {
    id: 'personal' as const,
    label: 'Personal restore',
    roleHint: 'Credit Restoration',
    card: 'border-emerald-400/50 bg-emerald-600/35 hover:bg-emerald-500/45',
    sub: 'text-emerald-100/90',
  },
  {
    id: 'business' as const,
    label: 'Business credit',
    roleHint: 'Funding Strategist',
    card: 'border-amber-400/50 bg-amber-600/30 hover:bg-amber-500/40',
    sub: 'text-amber-100/90',
  },
  {
    id: 'tradelines' as const,
    label: 'Tradelines',
    roleHint: 'Funding Strategist',
    card: 'border-violet-400/50 bg-violet-600/30 hover:bg-violet-500/40',
    sub: 'text-violet-100/90',
  },
  {
    id: 'debt' as const,
    label: 'Debt help',
    roleHint: 'Debt Resolution',
    card: 'border-orange-400/50 bg-orange-600/30 hover:bg-orange-500/40',
    sub: 'text-orange-100/90',
  },
] as const;

const QUICK_TOPICS = [
  { label: 'How disputes work', prompt: 'How do credit disputes work step by step?' },
  { label: 'DIY vs DFY', prompt: 'What is the difference between DIY and done-for-you at Finely Cred?' },
  { label: 'Free guide', prompt: 'What do I get in the free credit dispute guide?' },
  { label: 'Debt help', prompt: 'How does Finely Cred help with collections or debt validation?' },
  { label: 'Business credit', prompt: 'How do I build business credit the right way?' },
  { label: 'Upload my report', prompt: 'How do I upload a credit report in the portal?' },
];

function newId() {
  return crypto?.randomUUID ? crypto.randomUUID() : `${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function sanitize(s: string) {
  return (s || '').trim();
}

function personalizeAgentWelcome(welcome: string, fullName?: string): string {
  const first = fullName?.trim().split(/\s+/)[0];
  if (!first || first.length < 2) return welcome;
  if (new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(welcome)) return welcome;
  return welcome.replace(/^(Hey|Hi|Welcome|Hello)( —|-|:)?/i, `$1, ${first}$2`);
}

function resolvePersona(goal: Goal | null, overrideId?: AgentPersonaId): AgentPersona {
  if (overrideId) return getAgentPersona(overrideId) ?? personaOnDutyAt();
  if (!goal) return personaOnDutyAt();
  const label =
    goal === 'personal'
      ? 'Personal credit restore'
      : goal === 'business'
        ? 'Business credit'
        : goal === 'tradelines'
          ? 'Authorized user tradelines'
          : goal === 'debt'
            ? 'Debt / summons'
            : 'Exploring options';
  return publicChatPersonaForGoal(label);
}

export function PublicChatWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState(false);
  const [voiceBusyId, setVoiceBusyId] = useState<string | null>(null);
  const [voiceErr, setVoiceErr] = useState<string | null>(null);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [personaOverrideId, setPersonaOverrideId] = useState<AgentPersonaId | undefined>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [submitted, setSubmitted] = useState<null | { remote: string; ref: string }>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [aiHistory, setAiHistory] = useState<AiGatewayMessage[]>([]);
  const [handoffComplete, setHandoffComplete] = useState(false);
  const [handoffPhase, setHandoffPhase] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persona = useMemo(() => resolvePersona(goal, personaOverrideId), [goal, personaOverrideId]);
  const presentation = useMemo(() => getPublicChatPersonaPresentation(persona), [persona]);
  const launcherPresentation = useMemo(() => getPublicChatPersonaPresentation(personaOnDutyAt()), []);
  const showSpecialistIdentity = handoffComplete || handoffPhase === 'connecting' || Boolean(goal);
  const voiceStudio = useMemo(() => getVoiceStudioStatus(), [open]);

  const goalLabel = useMemo(() => {
    if (!goal) return undefined;
    if (goal === 'personal') return 'Personal credit restore';
    if (goal === 'business') return 'Business credit';
    if (goal === 'tradelines') return 'Authorized user tradelines';
    if (goal === 'debt') return 'Debt / summons';
    return 'Exploring options';
  }, [goal]);

  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const seedWelcome = (p: AgentPersona, name?: string) => {
    const pres = getPublicChatPersonaPresentation(p);
    setMessages([
      {
        id: newId(),
        role: 'bot',
        text: personalizeAgentWelcome(pres.welcome, name ?? fullName),
        personaId: p.id,
      },
    ]);
  };

  const beginHandoff = (p: AgentPersona, opts?: { immediate?: boolean }) => {
    if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);
    setHandoffPhase('connecting');
    const finish = () => {
      setHandoffPhase('connected');
      setHandoffComplete(true);
      seedWelcome(p);
    };
    if (opts?.immediate) finish();
    else handoffTimerRef.current = setTimeout(finish, 480);
  };

  useEffect(() => {
    const p = personaOnDutyAt();
    setMessages([{ id: 'm0', role: 'bot', text: GENERIC_WELCOME, personaId: p.id }]);
  }, []);

  useEffect(() => {
    return () => {
      stopStaffReplyAudio();
      if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);
    };
  }, []);

  const scrollToBottom = () => {
    const el = scrollerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, busy]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { goal?: PublicChatGoal; leadId?: string; personaId?: AgentPersonaId };
      setOpen(true);
      if (detail.personaId) setPersonaOverrideId(detail.personaId);
      if (detail.goal) {
        setGoal(detail.goal);
        const p = resolvePersona(detail.goal, detail.personaId);
        beginHandoff(p, { immediate: Boolean(detail.personaId) });
      } else if (detail.personaId) {
        const p = getAgentPersona(detail.personaId) ?? personaOnDutyAt();
        beginHandoff(p, { immediate: true });
      }
      if (detail.leadId) {
        setLeadId(detail.leadId);
        saveAgentHandoff({
          leadId: detail.leadId,
          personaId: detail.personaId ?? persona.id,
          surface: 'public_chat',
        });
      }
    };
    window.addEventListener(OPEN_PUBLIC_CHAT_EVENT, handler as EventListener);
    return () => window.removeEventListener(OPEN_PUBLIC_CHAT_EVENT, handler as EventListener);
  }, [persona.id]);

  const pushBot = (text: string, personaId: AgentPersonaId, source?: ChatMsg['source'], kbRefs?: string[]) => {
    setMessages((prev) => [...prev, { id: newId(), role: 'bot', text, source, personaId, kbRefs }]);
  };

  const pushUser = (text: string) => {
    setMessages((prev) => [...prev, { id: newId(), role: 'user', text }]);
  };

  const playMessage = async (msg: ChatMsg) => {
    if (msg.role !== 'bot' || !msg.personaId) return;
    setVoiceErr(null);
    setVoiceBusyId(msg.id);
    stopStaffReplyAudio();
    const msgPresentation = getPublicChatPersonaPresentationById(msg.personaId);
    const res = await playStaffReplyAudio({
      text: msg.text,
      personaId: msg.personaId,
      staffMemberId: msgPresentation.staffMemberId,
    });
    setVoiceBusyId(null);
    if (!res.ok) setVoiceErr(res.reason ?? 'Voice unavailable');
  };

  const sendMessage = async (text: string, personaOverride?: AgentPersona) => {
    const trimmed = sanitize(text);
    if (!trimmed || busy) return;
    setDraft('');
    pushUser(trimmed);
    const classified = classifyMessageIntent(trimmed);
    let activePersona = personaOverride ?? persona;
    if (classified.confidence >= 0.55) {
      const routed = getAgentPersona(classified.suggestedPersonaId);
      if (routed) {
        activePersona = routed;
        setPersonaOverrideId(routed.id);
        if (!handoffComplete) beginHandoff(routed);
      }
      if (classified.intent === 'complaint') {
        emitPlatformEvent({
          type: 'automation.triggered',
          tenantId: 'finely_cred',
          leadId: leadId ?? undefined,
          entityType: 'chat',
          entityId: leadId ?? 'public_chat',
          payload: {
            kind: 'complaint_detected',
            snippet: trimmed.slice(0, 240),
            personaId: classified.suggestedPersonaId,
          },
        });
      }
    }
    setBusy(true);
    try {
      const result = await converseWithFinelyAi({
        messages: aiHistory,
        userMessage: trimmed,
        systemPromptBase: activePersona.systemPrompt,
        taskType: 'public_chat',
        context: {
          surface: 'public_widget',
          goal: goalLabel,
          userName: fullName || undefined,
          personaId: activePersona.id,
          pathname,
        },
      });
      const kbRefs = result.knowledgeUsed.slice(0, 2).map((c) => c.article.title);
      pushBot(result.text, activePersona.id, result.source, kbRefs.length ? kbRefs : undefined);
      setFollowUps(result.followUps);
      setAiHistory((prev) => [
        ...prev,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: result.text },
      ]);
    } catch (e: unknown) {
      pushBot((e as Error)?.message || 'Something went wrong — try again or book a free session below.', activePersona.id);
    } finally {
      setBusy(false);
    }
  };

  const pickGoal = (g: Goal) => {
    setGoal(g);
    const p = resolvePersona(g);
    setPersonaOverrideId(undefined);
    beginHandoff(p);
  };

  const canSubmit = goal && sanitize(fullName) && sanitize(email) && sanitize(phone) && consent;

  const handleSubmitLead = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      const interest = goalLabel ?? 'General';
      const res = await submitLeadCapture({
        source: 'chat',
        offer: 'free_1h_consult',
        interest,
        fullName: sanitize(fullName),
        email: sanitize(email),
        phone: sanitize(phone),
        consentToContact: Boolean(consent),
        funnelPath:
          goal === 'debt'
            ? '/free-debt-guide'
            : goal === 'business'
              ? '/free-business-guide'
              : goal === 'tradelines'
                ? '/free-tradeline-guide'
                : '/free-guide',
        funnelId:
          goal === 'debt'
            ? 'debt_freedom'
            : goal === 'business'
              ? 'business_credit'
              : goal === 'tradelines'
                ? 'tradeline_insider'
                : 'credit_dispute',
      });
      setSubmitted({ remote: res.remote, ref: res.lead.id });
      setLeadId(res.lead.id);
      saveAgentHandoff({
        personaId: persona.id,
        goal: goalLabel,
        leadId: res.lead.id,
        email: sanitize(email),
        surface: 'public_chat',
      });
      pushBot(
        `You're officially on the team — ref ${res.lead.id}. ${presentation.firstName} will follow up personally. Keep chatting while you wait if you'd like.`,
        persona.id,
      );
    } finally {
      setBusy(false);
    }
  };

  const funnelCta =
    goal === 'debt'
      ? '/free-debt-guide'
      : goal === 'business'
        ? '/free-business-guide'
        : goal === 'tradelines'
          ? '/free-tradeline-guide'
          : '/free-guide';

  return (
    <div className="finely-public-chat-widget" data-fc-public-chat-widget="1">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[120] inline-flex items-center gap-3 rounded-2xl border border-emerald-400/35 bg-gradient-to-r from-slate-900/95 via-emerald-950/90 to-teal-950/90 backdrop-blur-xl pl-2 pr-4 py-2 shadow-2xl hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.45)] transition-all max-w-[calc(100vw-2rem)]"
          title="AI guide · not legal advice"
        >
          <PublicChatStaffAvatar presentation={launcherPresentation} size="sm" />
          <div className="text-left min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300/90">Talk to our team</div>
            <div className="text-xs text-white/80 truncate">We&apos;ll match you to a specialist</div>
          </div>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-[120] sm:w-[min(440px,calc(100vw-2rem))] sm:max-h-[calc(100vh-2rem)] flex flex-col">
          <div className="flex flex-col h-full sm:h-[min(640px,calc(100vh-2rem))] sm:rounded-3xl border border-emerald-500/20 bg-[#070d0b] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] overflow-hidden ring-1 ring-white/5">
            {/* Header */}
            <div
              className={`shrink-0 px-4 pt-4 pb-3 border-b border-white/[0.08] ${
                handoffComplete
                  ? `bg-gradient-to-br ${presentation.headerGradient}`
                  : 'bg-gradient-to-br from-slate-800/40 via-emerald-900/30 to-teal-900/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {showSpecialistIdentity ? (
                    <PublicChatStaffAvatar presentation={presentation} size="lg" showOnline={handoffComplete} />
                  ) : (
                    <PublicChatStaffAvatar presentation={launcherPresentation} size="lg" />
                  )}
                  <div className="min-w-0">
                    {handoffComplete ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-base truncate">{presentation.firstName}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-50 border border-emerald-300/40 uppercase tracking-wider font-bold animate-pulse">
                            Active now
                          </span>
                        </div>
                        <div className={`text-xs font-medium ${presentation.accentText} truncate`}>{presentation.title}</div>
                        <p className="text-[11px] text-white/55 mt-1 leading-snug">{presentation.tagline}</p>
                        <button
                          type="button"
                          onClick={() => {
                            const welcome = messages.find((m) => m.role === 'bot' && m.personaId);
                            if (welcome?.personaId) {
                              void playStaffReplyAudio({
                                text: welcome.text,
                                personaId: welcome.personaId,
                                staffMemberId: presentation.staffMemberId,
                              });
                            }
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100/90 hover:text-white bg-white/10 hover:bg-white/15 px-2 py-1 rounded-lg border border-emerald-200/20"
                        >
                          <Headphones size={11} /> Hear welcome
                        </button>
                      </>
                    ) : showSpecialistIdentity ? (
                      <>
                        <span className="font-bold text-white text-base">{presentation.firstName}</span>
                        <div className="text-xs font-medium text-emerald-200/80 mt-0.5">
                          {handoffPhase === 'connecting'
                            ? `Connecting you with ${presentation.title}…`
                            : `${presentation.title} · ready when you are`}
                        </div>
                        <p className="text-[11px] text-white/55 mt-1 leading-snug">{presentation.tagline}</p>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-white text-base">Finely Cred team</span>
                        <div className="text-xs font-medium text-emerald-200/80 mt-0.5">
                          A specialist will join when we know your lane
                        </div>
                        <p className="text-[11px] text-white/45 mt-1 leading-snug">Educational guidance only · not legal advice</p>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopStaffReplyAudio();
                    setOpen(false);
                  }}
                  className={FINELY_OS_SECONDARY_BTN}
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              ref={scrollerRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-4 bg-[#1a3228] bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.22)_0%,_transparent_55%),linear-gradient(180deg,rgba(16,185,129,0.1)_0%,rgba(6,78,59,0.14)_100%)] border-y border-emerald-500/15"
            >
              {handoffPhase === 'connecting' ? (
                <div className="rounded-2xl border border-emerald-300/35 bg-emerald-500/20 px-4 py-3 flex items-center gap-3 animate-pulse">
                  <PublicChatStaffAvatar presentation={presentation} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-emerald-50">
                      {presentation.firstName} is coming online…
                    </p>
                    <p className="text-[10px] text-emerald-100/70 mt-0.5">
                      Connecting you with {presentation.title}
                    </p>
                  </div>
                  <Loader2 size={18} className="text-emerald-200 animate-spin shrink-0 ml-auto" />
                </div>
              ) : null}

              {!goal && !handoffComplete && (
                <div className={`${finelyOsInlineListItem()} p-3`}>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>Pick your lane</div>
                  <div className="grid grid-cols-2 gap-2">
                    {LANE_OPTIONS.map((x) => (
                      <button
                        data-testid={`public-chat-lane-${x.id}`}
                        key={x.id}
                        type="button"
                        onClick={() => pickGoal(x.id)}
                        className={`px-2.5 py-2.5 rounded-xl border text-left transition-all ${x.card}`}
                      >
                        <div className="text-[9px] font-black uppercase tracking-widest text-white/90">{x.label}</div>
                        <div className={`text-[9px] mt-0.5 ${x.sub}`}>{x.roleHint}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => pickGoal('not_sure')}
                    className="mt-2 w-full px-3 py-2 rounded-xl border border-dashed border-rose-400/35 bg-rose-500/15 text-[9px] font-black uppercase tracking-widest text-rose-100 hover:bg-rose-500/25"
                  >
                    Not sure — Welcome Concierge
                  </button>
                </div>
              )}

              {messages.map((m) => {
                if (m.role === 'user') {
                  return (
                    <div key={m.id} className="flex justify-end pl-8">
                      <div className="max-w-[88%]">
                        <div className="text-[9px] text-white/35 text-right mb-1 font-bold uppercase tracking-wider">You</div>
                        <div className="rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-emerald-50 bg-gradient-to-br from-emerald-600/90 via-emerald-700/85 to-teal-700/80 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.45)] border border-emerald-400/35 font-medium">
                          {m.text}
                        </div>
                      </div>
                    </div>
                  );
                }

                const msgPersona = m.personaId
                  ? getPublicChatPersonaPresentation(getAgentPersona(m.personaId)!)
                  : showSpecialistIdentity
                    ? presentation
                    : launcherPresentation;
                return (
                  <div key={m.id} className="flex justify-start gap-2.5 pr-6">
                    <PublicChatStaffAvatar presentation={msgPersona} size="sm" />
                    <div className="min-w-0 max-w-[88%] space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-white/70">{msgPersona.firstName}</span>
                        <span className="text-[9px] text-white/30">· {msgPersona.title}</span>
                      </div>
                      <div
                        className={`rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-white border ${
                          msgPersona.staffBubble ?? 'bg-emerald-900/40 border-emerald-500/25'
                        }`}
                      >
                        {m.text}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 px-0.5">
                        {m.source ? (
                          <span className="text-[9px] text-emerald-100/50">
                            {m.source === 'gateway' ? 'Live reply' : 'Knowledge base'}
                          </span>
                        ) : null}
                        {m.kbRefs?.map((ref) => (
                          <span key={ref} className="text-[8px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-100 border border-violet-300/20">
                            KB · {ref}
                          </span>
                        ))}
                        <button
                          type="button"
                          disabled={voiceBusyId === m.id}
                          onClick={() => void playMessage(m)}
                          className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300/90 hover:text-emerald-200 disabled:opacity-50"
                          title={voiceStudio.available ? 'Listen in natural voice' : 'Voice Studio — enable for human-quality audio'}
                        >
                          {voiceBusyId === m.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Headphones size={11} />
                          )}
                          {voiceStudio.available ? 'Listen' : 'Voice (prod)'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {voiceErr ? <p className="text-[10px] text-amber-200/80 px-1">{voiceErr}</p> : null}

              {busy ? (
                <div className="flex justify-start gap-2.5 pr-6">
                  <PublicChatStaffAvatar
                    presentation={showSpecialistIdentity ? presentation : launcherPresentation}
                    size="sm"
                  />
                  <div className={`${finelyOsInlineListItem()} px-4 py-3 inline-flex gap-2 items-center`}>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:120ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:240ms]" />
                    </span>
                    <span className="text-xs text-white/55">{handoffComplete ? `${presentation.firstName} is typing…` : 'Finely team is typing…'}</span>
                  </div>
                </div>
              ) : null}

              {followUps.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 pl-10">
                  {followUps.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => void sendMessage(f)}
                      className="px-2.5 py-1 rounded-full border border-teal-400/30 bg-teal-500/10 text-[10px] text-teal-100 hover:bg-teal-500/20"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1 pl-1">
                {QUICK_TOPICS.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => void sendMessage(t.prompt)}
                    className={`px-2 py-1 rounded-lg ${FINELY_OS_ENTITY_CHIP} text-[9px] hover:border-emerald-400/30`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {!submitted && (
                <details className="ml-1 rounded-2xl border border-emerald-400/25 bg-emerald-500/8 overflow-hidden group">
                  <summary className="cursor-pointer list-none p-3 flex flex-wrap items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                    <div className="text-xs text-white/70 inline-flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-300 shrink-0" />
                      Free strategy call with {presentation.firstName}'s team
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 group-open:hidden">Reserve →</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 hidden group-open:inline">Collapse</span>
                  </summary>
                  <div className="px-3 pb-3 space-y-2 border-t border-emerald-400/15 pt-3">
                    <div className="text-xs text-white/80 font-semibold">Join the team — reserve your session</div>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={FINELY_OS_ENTITY_INPUT} />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={FINELY_OS_ENTITY_INPUT} />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={FINELY_OS_ENTITY_INPUT} />
                    <label className="flex items-start gap-2 text-xs text-white/60">
                      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                      I consent to be contacted by Finely Cred.
                    </label>
                    <button type="button" disabled={!canSubmit || busy} onClick={() => void handleSubmitLead()} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-black uppercase tracking-widest text-[10px] disabled:opacity-50">
                      Submit
                    </button>
                  </div>
                </details>
              )}

              <button
                type="button"
                onClick={() => navigate(funnelCta)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-violet-400/25 bg-violet-500/10 text-[10px] font-black uppercase tracking-widest text-violet-200 hover:bg-violet-500/15 ml-1"
              >
                <Sparkles size={12} /> Get free guide stack
              </button>
            </div>

            <div className="shrink-0 px-3 py-2 border-t border-white/[0.08] bg-[#070d0b] flex flex-wrap gap-1.5">
              {toolsForPersona(persona.id).map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => navigate(resolveToolPath(tool, { goal: goalLabel, funnelPath: funnelCta }))}
                  className={`px-2 py-1 rounded-lg ${FINELY_OS_ENTITY_CHIP} text-[9px] hover:text-emerald-200 hover:border-emerald-400/30`}
                >
                  {tool.label}
                </button>
              ))}
            </div>

            <div className="shrink-0 px-3 py-3 border-t border-emerald-500/15 bg-gradient-to-r from-[#070d0b] to-emerald-950/30 flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={handoffComplete ? `Message ${presentation.firstName}…` : 'Describe what you need…'}
                className="flex-1 min-w-0 bg-[#0a1210] border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(draft);
                  }
                }}
                disabled={busy}
              />
              <button
                type="button"
                onClick={() => void sendMessage(draft)}
                disabled={busy || !sanitize(draft)}
                className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black disabled:opacity-40 shadow-lg"
                title="Send"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="shrink-0 text-[9px] text-center text-white/30 pb-2 px-3">Educational guidance · not legal advice</p>
          </div>
        </div>
      )}
    </div>
  );
}
