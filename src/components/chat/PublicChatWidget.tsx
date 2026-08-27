import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, Loader2, Paperclip, Send, Smile, Sparkles, ShieldCheck, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitLeadCapture } from '../../data/leadsRepo';
import { converseWithFinelyAi } from '../../lib/conversationalAi';
import { classifyMessageIntent } from '../../lib/intentClassifier';
import { publicChatPersonaForGoal, type AgentPersona } from '../../domain/agentPersonas';
import { getEffectiveAgentPersona, getPersonaOverride } from '../../data/agentPersonaOverridesRepo';
import { personaOnDutyAt } from '../../data/agentPersonasRepo';
import { saveAgentHandoff } from '../../lib/agentHandoffBridge';
import { createPublicAppointmentRequest } from '../../data/calendarRepo';
import {
  buildConversationalSystemAddendum,
  detectPublicChatIntent,
  extractStaffNameHint,
  humanReplyDelayMs,
  inferUserTone,
  matchTrustedResources,
  parseAppointmentDraft,
  shouldUseAppointmentSetter,
} from '../../lib/publicChatEngine';
import {
  CHAT_LOCALE_LABELS,
  CHAT_LOCALE_ORDER,
  detectLocaleFromText,
  isRtlLocale,
  t,
  type ChatLocale,
} from '../../lib/publicChatI18n';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import { getAgentPersona } from '../../domain/agentPersonas';
import { OPEN_PUBLIC_CHAT_EVENT, type PublicChatGoal } from '../../lib/publicChatEvents';
import { emitPlatformEvent } from '../../domain/platformEvents';
import { resolveToolPath, toolsForPersona } from '../../lib/agentPersonaTools';
import type { AiGatewayMessage } from '../../lib/aiClient';
import { getPublicChatPersonaPresentation } from './publicChatPersonaUi';
import {
  buildAiAssistSystemPrompt,
  refreshChatStaffPresentation,
  resolveChatStaffPresentation,
} from '../../lib/chatStaffPresentation';
import { buildWarmUnclassifiedReply, isUnclassifiableChatMessage } from '../../lib/chatMessageFallback';
import { forceStaffShiftPolicyResync, getStaffMemberById, isStaffOnShift, staffShiftSummary } from '../../data/staffRoster';
import { PublicChatStaffAvatar } from './PublicChatStaffAvatar';
import { useAuth } from '../../auth/AuthProvider';
import { findPartnerByEmail } from '../../data/partnersRepo';
import {
  analyzePublicChatDocumentHeuristic,
  enrichPublicChatReply,
  formatPublicChatDocReply,
  persistPublicChatDocumentForPartner,
  type PublicChatDocAnalysis,
} from '../../lib/publicChatDocumentIntake';
import { FinelyPremiumEmojiPicker } from './FinelyPremiumEmojiPicker';
import { openCommunicationHub } from './communicationHubModel';
import {
  finelyPublicAnswer,
  shouldUseFinelyPublicAnswer,
} from '../../lib/finelyBrain/finelyPublicAnswer';
import { recordFinelyPublicAnswerRoute } from '../../lib/finelyBrain/finelyPublicAnswerMetrics';
import { recordKnowledgeFeedback } from '../../data/knowledgeFeedbackRepo';
import {
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

const MAX_CHAT_ATTACHMENTS = 2;

type ChatRole = 'bot' | 'user';
type ChatMsg = {
  id: string;
  role: ChatRole;
  text: string;
  source?: 'gateway' | 'knowledge_local';
  personaId?: AgentPersonaId;
  kbRefs?: string[];
  kbChunkIds?: string[];
  kbQuery?: string;
  feedbackGiven?: 'up' | 'down';
  attachments?: PublicChatDocAnalysis[];
};

type Goal = 'personal' | 'business' | 'tradelines' | 'debt' | 'not_sure';

const LIVE_AGENT_PATTERN =
  /\b(live\s+(agent|person|human|rep|specialist)|real\s+(person|human|agent)|speak\s+(with|to)\s+(a\s+)?(human|person|agent|someone|live)|talk\s+to\s+(a\s+)?(human|real|live)|connect\s+me\s+(to|with)\s+(a\s+)?(human|person|live))/i;

const LANE_OPTIONS = [
  {
    id: 'personal' as const,
    emoji: '✨',
    label: 'Personal restore',
    roleHint: 'Credit Restoration',
    card: 'border-emerald-400/50 bg-emerald-600/35 hover:bg-emerald-500/45',
    sub: 'text-emerald-100/90',
  },
  {
    id: 'business' as const,
    emoji: '🚀',
    label: 'Business credit',
    roleHint: 'Funding Strategist',
    card: 'border-sky-400/50 bg-sky-600/30 hover:bg-sky-500/40',
    sub: 'text-sky-100/90',
  },
  {
    id: 'tradelines' as const,
    emoji: '💳',
    label: 'Tradelines',
    roleHint: 'Funding Strategist',
    card: 'border-violet-400/50 bg-violet-600/30 hover:bg-violet-500/40',
    sub: 'text-violet-100/90',
  },
  {
    id: 'debt' as const,
    emoji: '🛡️',
    label: 'Debt help',
    roleHint: 'Debt Resolution',
    card: 'border-rose-400/50 bg-rose-600/30 hover:bg-rose-500/40',
    sub: 'text-rose-100/90',
  },
] as const;

const QUICK_TOPICS = [
  { emoji: '📋', label: 'How disputes work', prompt: 'How do credit disputes work step by step?' },
  { emoji: '⚖️', label: 'DIY vs DFY', prompt: 'What is the difference between DIY and done-for-you at Finely Cred?' },
  { emoji: '🎁', label: 'Free guide', prompt: 'What do I get in the free credit dispute guide?' },
  { emoji: '🛡️', label: 'Debt help', prompt: 'How does Finely Cred help with collections or debt validation?' },
  { emoji: '🚀', label: 'Business credit', prompt: 'How do I build business credit the right way?' },
  { emoji: '📎', label: 'Upload my report', prompt: 'How do I upload a credit report in the portal?' },
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
  if (overrideId) return getEffectiveAgentPersona(overrideId) ?? personaOnDutyAt();
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
  const { user } = useAuth();
  const [open, setOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState(false);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [personaOverrideId, setPersonaOverrideId] = useState<AgentPersonaId | undefined>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [submitted, setSubmitted] = useState<null | { remote: string; ref: string }>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [locale, setLocale] = useState<ChatLocale>('en');
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [appointmentDraft, setAppointmentDraft] = useState<{ notes: string; email?: string; phone?: string } | null>(null);

  const [draft, setDraft] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [easyReadMode, setEasyReadMode] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<PublicChatDocAnalysis[]>([]);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [aiHistory, setAiHistory] = useState<AiGatewayMessage[]>([]);
  const [handoffComplete, setHandoffComplete] = useState(false);
  const [handoffPhase, setHandoffPhase] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dutyTick, setDutyTick] = useState(0);

  const refreshDutyFace = (opts?: { forcePolicy?: boolean }) => {
    if (opts?.forcePolicy) forceStaffShiftPolicyResync();
    setDutyTick((n) => n + 1);
  };

  useEffect(() => {
    refreshDutyFace({ forcePolicy: true });
    const onFocus = () => {
      if (document.visibilityState === 'hidden') return;
      refreshDutyFace({ forcePolicy: true });
    };
    const onStore = () => refreshDutyFace();
    const interval = window.setInterval(() => refreshDutyFace(), 30_000);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('finely:store', onStore);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('finely:store', onStore);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    refreshDutyFace({ forcePolicy: true });
  }, [open]);

  const persona = useMemo(() => resolvePersona(goal, personaOverrideId), [goal, personaOverrideId]);
  const audience = user ? 'partner' : 'guest';
  const chatStaff = useMemo(() => {
    void dutyTick;
    return resolveChatStaffPresentation({
      personaId: goal ? persona.id : undefined,
      audience,
    });
  }, [persona.id, goal, dutyTick, audience]);
  const presentation = chatStaff.presentation;
  const aiAssistBadgeLabel = chatStaff.aiAssistBadgeLabel;
  const launcherShiftMeta = useMemo(() => {
    void dutyTick;
    const id = presentation.staffMemberId;
    if (!id) return null;
    const staff = getStaffMemberById(id);
    if (!staff) return null;
    return { onShift: isStaffOnShift(staff), summary: staffShiftSummary(staff) };
  }, [presentation.staffMemberId, dutyTick]);

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

  useEffect(() => {
    const url = presentation.avatarUrl?.trim();
    if (url) {
      const img = new Image();
      img.src = url;
    }
  }, [presentation.avatarUrl]);

  const seedWelcome = (p: AgentPersona, name?: string) => {
    const staffBundle = resolveChatStaffPresentation({ personaId: p.id, audience });
    setMessages([
      {
        id: newId(),
        role: 'bot',
        text: personalizeAgentWelcome(staffBundle.welcomeWithAiDisclosure, name ?? fullName),
        personaId: staffBundle.personaId,
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
    else handoffTimerRef.current = setTimeout(finish, 1400 + Math.floor(Math.random() * 900));
  };

  useEffect(() => {
    const staffBundle = refreshChatStaffPresentation({ audience });
    setMessages([
      {
        id: 'm0',
        role: 'bot',
        text: personalizeAgentWelcome(staffBundle.welcomeWithAiDisclosure, fullName),
        personaId: staffBundle.personaId,
      },
    ]);
  }, [locale, dutyTick, audience, fullName]);

  useEffect(() => {
    return () => {
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
      refreshDutyFace({ forcePolicy: true });
      setOpen(true);
      if (detail.personaId) setPersonaOverrideId(detail.personaId);
      if (detail.goal) {
        setGoal(detail.goal);
        const p = resolvePersona(detail.goal, detail.personaId);
        pushBot(
          `Got it — let me check who's on duty for ${p.displayTitle.toLowerCase()}. One moment while I connect you…`,
          chatStaff.personaId,
        );
        window.setTimeout(() => beginHandoff(p), 700);
      } else if (detail.personaId) {
        const p = getAgentPersona(detail.personaId) ?? personaOnDutyAt();
        pushBot(`I'll connect you with our ${p.displayTitle.toLowerCase()} team — checking availability now…`, chatStaff.personaId);
        window.setTimeout(() => beginHandoff(p), 700);
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

  const pushBot = (
    text: string,
    personaId: AgentPersonaId = chatStaff.personaId,
    source?: ChatMsg['source'],
    kbRefs?: string[],
    kbChunkIds?: string[],
    kbQuery?: string,
  ) => {
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: 'bot', text: enrichPublicChatReply(text, goal), source, personaId, kbRefs, kbChunkIds, kbQuery },
    ]);
  };

  const submitKnowledgeFeedback = (msg: ChatMsg, helpful: boolean) => {
    if (!msg.kbChunkIds?.length || msg.feedbackGiven) return;
    recordKnowledgeFeedback({
      chunkIds: msg.kbChunkIds,
      query: msg.kbQuery ?? '',
      helpful,
      surface: 'public_chat',
      route: pathname,
    });
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, feedbackGiven: helpful ? 'up' : 'down' } : m)));
  };

  const insertEmojiAtCursor = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setDraft((prev) => `${prev}${emoji}`);
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    setDraft(`${draft.slice(0, start)}${emoji}${draft.slice(end)}`);
  };

  const pushUser = (text: string, attachments?: PublicChatDocAnalysis[]) => {
    setMessages((prev) => [...prev, { id: newId(), role: 'user', text, attachments }]);
  };

  const handleAttachmentPick = async (files: FileList | null) => {
    if (!files?.length || attachmentBusy) return;
    const slots = MAX_CHAT_ATTACHMENTS - pendingAttachments.length;
    if (slots <= 0) {
      pushBot('You can attach up to 2 documents per message. Send these first, then upload more. 📎', chatStaff.personaId);
      return;
    }
    setAttachmentBusy(true);
    try {
      const picked = Array.from(files).slice(0, slots);
      const partner = user?.email ? await findPartnerByEmail(user.email) : null;
      const analyzed: PublicChatDocAnalysis[] = [];
      for (const file of picked) {
        let analysis = analyzePublicChatDocumentHeuristic(file);
        if (partner) {
          const persisted = await persistPublicChatDocumentForPartner({ partnerId: partner.id, file, analysis });
          analysis = persisted.analysis;
        }
        analyzed.push(analysis);
      }
      setPendingAttachments((prev) => [...prev, ...analyzed].slice(0, MAX_CHAT_ATTACHMENTS));
      pushBot(
        analyzed.map((a, i) => formatPublicChatDocReply(a, i, analyzed.length)).join('\n\n') +
          (partner ? '' : '\n\n💡 Log in or sign up free to save uploads to your profile automatically.'),
        chatStaff.personaId,
      );
    } finally {
      setAttachmentBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const requestLiveAgent = () => {
    if (!user) {
      pushBot(
        'Direct messages with our live team require a free partner account. Create one or log in — then we can connect you with a specialist in the Communication Hub.',
        chatStaff.personaId,
      );
      return;
    }
    if (!handoffComplete) {
      if (!goal) {
        pushBot('Pick your lane above first — then I can connect you with a live specialist.', chatStaff.personaId);
        return;
      }
      beginHandoff(resolvePersona(goal, personaOverrideId));
      return;
    }
    openCommunicationHub({ tab: 'team', expanded: true });
    pushBot(
      `Opening the Communication Hub — you can message ${presentation.firstName}'s team directly there.`,
      persona.id,
    );
  };

  const sendMessage = async (text: string, personaOverride?: AgentPersona) => {
    const trimmed = sanitize(text);
    const attachments = pendingAttachments.length ? [...pendingAttachments] : undefined;
    const displayText = trimmed || (attachments?.length ? `📎 ${attachments.map((a) => a.fileName).join(', ')}` : '');
    if (!displayText || busy) return;

    const detected = detectLocaleFromText(trimmed || displayText);
    const activeLocale = detected ?? locale;
    if (detected && detected !== locale) setLocale(detected);

    setDraft('');
    setPendingAttachments([]);
    pushUser(displayText, attachments);

    const aiText = trimmed || 'Please review the document(s) I just uploaded and tell me what they mean for my case.';
    const chatIntent = detectPublicChatIntent(aiText);
    const staffHint = extractStaffNameHint(aiText);

    if (chatIntent === 'specific_staff' && !user) {
      pushBot(t(activeLocale, 'needPartnerForStaff'), chatStaff.personaId);
      setAppointmentDraft((prev) => ({ notes: `${prev?.notes ?? ''} ${trimmed}`.trim(), ...parseAppointmentDraft(trimmed) }));
      if (!handoffComplete) {
        window.setTimeout(() => beginHandoff(getEffectiveAgentPersona('appointment_setter')), 500);
      }
    }

    if (LIVE_AGENT_PATTERN.test(trimmed) || (chatIntent === 'specific_staff' && user)) {
      requestLiveAgent();
      return;
    }

    if (isUnclassifiableChatMessage(trimmed)) {
      setBusy(true);
      setTypingLabel(`${presentation.firstName} ${t(activeLocale, 'typing')}`);
      const delayMs = humanReplyDelayMs({ userMessage: trimmed });
      await new Promise((r) => window.setTimeout(r, delayMs));
      const staffBundle = resolveChatStaffPresentation({ personaId: persona.id, audience });
      const fallback = buildWarmUnclassifiedReply({
        presentation: staffBundle.presentation,
        audience,
        sentContent: trimmed,
      });
      pushBot(fallback.reply, staffBundle.personaId, 'knowledge_local');
      setFollowUps(fallback.followUps);
      setTypingLabel(null);
      setBusy(false);
      return;
    }

    if (!attachments?.length && shouldUseFinelyPublicAnswer(trimmed, pathname)) {
      setBusy(true);
      setTypingLabel(`${presentation.firstName} ${t(activeLocale, 'typing')}`);
      const delayMs = humanReplyDelayMs({ userMessage: aiText });
      await new Promise((r) => window.setTimeout(r, delayMs));
      try {
        const result = finelyPublicAnswer({
          pathname,
          message: trimmed,
          channel: 'chat',
          seniorMode: easyReadMode,
        });
        recordFinelyPublicAnswerRoute('canned');
        const kbRefs = result.citations.slice(0, 2).map((c) => c.title);
        const kbChunkIds = result.citations.map((c) => c.id);
        pushBot(
          enrichPublicChatReply(result.reply, goal),
          chatStaff.personaId,
          'knowledge_local',
          kbRefs.length ? kbRefs : undefined,
          kbChunkIds.length ? kbChunkIds : undefined,
          trimmed,
        );
        setAiHistory((prev) => [
          ...prev,
          { role: 'user', content: aiText },
          { role: 'assistant', content: result.reply },
        ]);
      } finally {
        setTypingLabel(null);
        setBusy(false);
      }
      return;
    }

    const classified = classifyMessageIntent(trimmed);
    let activePersona = personaOverride ?? persona;
    const staffBundle = resolveChatStaffPresentation({ personaId: activePersona.id, audience });
    const activePersonaId = staffBundle.personaId;

    if (shouldUseAppointmentSetter(chatIntent) && handoffComplete) {
      activePersona = getEffectiveAgentPersona('appointment_setter');
      setPersonaOverrideId('appointment_setter');
    }

    if (handoffComplete && classified.confidence >= 0.55) {
      const routed = getEffectiveAgentPersona(classified.suggestedPersonaId);
      if (routed) {
        activePersona = routed;
        setPersonaOverrideId(routed.id);
        beginHandoff(routed);
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
    } else if (!handoffComplete && classified.confidence >= 0.55 && classified.suggestedPersonaId) {
      const routed = getEffectiveAgentPersona(classified.suggestedPersonaId);
      if (routed) {
        pushBot(
          `Sounds like ${routed.displayTitle.toLowerCase()} is the right lane — connecting you now…`,
          chatStaff.personaId,
        );
        setGoal((prev) => prev ?? 'not_sure');
        window.setTimeout(() => beginHandoff(routed), 600);
        return;
      }
    }

    const tone = inferUserTone(aiText);
    const priorBot = messages.filter((m) => m.role === 'bot').map((m) => m.text);
    const delayMs = getPersonaOverride(activePersona.id)?.typingDelayMs ?? humanReplyDelayMs({ userMessage: aiText });
    const attachmentBlock = attachments?.length
      ? `\n\nUploaded documents:\n${attachments.map((a) => `- ${a.label} (${a.fileName})${a.bureau ? ` bureau=${a.bureau}` : ''}${a.creditorOrLender ? ` creditor=${a.creditorOrLender}` : ''}: ${a.summary}`).join('\n')}`
      : '';

    setBusy(true);
    setTypingLabel(`${presentation.firstName} ${t(activeLocale, 'typing')}`);
    await new Promise((r) => window.setTimeout(r, delayMs));

    try {
      const replyStaffBundle = resolveChatStaffPresentation({ personaId: activePersona.id, audience });
      const addendum = buildConversationalSystemAddendum({
        locale: activeLocale,
        tone,
        priorBotSnippets: priorBot,
        staffName: replyStaffBundle.presentation.firstName,
        onShiftRole: replyStaffBundle.presentation.title,
        isPartner: Boolean(user),
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        userMessage: `${aiText}${attachmentBlock}`,
        easyReadMode,
      });

      const systemPromptBase = buildAiAssistSystemPrompt({
        presentation: replyStaffBundle.presentation,
        persona: activePersona,
        staff: replyStaffBundle.staff,
        personalityHint: replyStaffBundle.personalityHint,
        audience,
        extra: `${activePersona.systemPrompt}\n\n${addendum}`,
      });

      const result = await converseWithFinelyAi({
        messages: aiHistory,
        userMessage: `${aiText}${attachmentBlock}`,
        systemPromptBase,
        taskType: 'public_chat',
        context: {
          surface: 'public_widget',
          goal: goalLabel,
          userName: fullName || undefined,
          personaId: activePersonaId,
          pathname,
          locale: activeLocale,
          conversationalAddendum: addendum,
        },
      });

      recordFinelyPublicAnswerRoute(result.source === 'gateway' ? 'llm' : 'canned');
      const trusted = matchTrustedResources(aiText);
      let replyText = result.text;
      if (trusted.length && !replyText.includes('http') && !replyText.includes('/free-')) {
        const linkLines = trusted.slice(0, 2).map((r) => `${r.label}: ${r.href.startsWith('http') ? r.href : `${window.location.origin}${r.href}`}`);
        replyText = `${replyText}\n\n${t(activeLocale, 'trustedLinks')}:\n${linkLines.join('\n')}`;
      }

      const kbRefs = result.knowledgeUsed.slice(0, 2).map((c) => c.article.title);
      const kbChunkIds = result.knowledgeUsed.map((c) => c.article.id);
      pushBot(
        replyText,
        activePersonaId,
        result.source,
        kbRefs.length ? kbRefs : undefined,
        kbChunkIds.length ? kbChunkIds : undefined,
        aiText,
      );
      setFollowUps(result.followUps);
      setAiHistory((prev) => [
        ...prev,
        { role: 'user', content: `${aiText}${attachmentBlock}` },
        { role: 'assistant', content: replyText },
      ]);

      const apptDraft = parseAppointmentDraft(`${appointmentDraft?.notes ?? ''} ${trimmed}`);
      const apptEmail = apptDraft.email || sanitize(email) || appointmentDraft?.email;
      const apptName = sanitize(fullName) || 'Guest';
      if (
        (chatIntent === 'appointment' || shouldUseAppointmentSetter(chatIntent)) &&
        apptEmail &&
        apptName.length > 1 &&
        handoffComplete
      ) {
        createPublicAppointmentRequest({
          topic: 'enlightenment',
          fullName: apptName,
          email: apptEmail,
          phone: apptDraft.phone || sanitize(phone) || undefined,
          availabilityNotes: apptDraft.availabilityNotes || trimmed,
          notes: staffHint ? `Requested staff: ${staffHint}` : undefined,
          meetingAgenda: goalLabel,
        });
        pushBot(t(activeLocale, 'appointmentSet'), activePersonaId);
        setAppointmentDraft(null);
      } else if (chatIntent === 'appointment' || shouldUseAppointmentSetter(chatIntent)) {
        setAppointmentDraft({
          notes: `${appointmentDraft?.notes ?? ''} ${trimmed}`.trim(),
          email: apptDraft.email,
          phone: apptDraft.phone,
        });
      }
    } catch (e: unknown) {
      pushBot((e as Error)?.message || 'Something went wrong — try again or book a free session below.', activePersonaId);
    } finally {
      setTypingLabel(null);
      setBusy(false);
    }
  };

  const sendPageHelp = () => {
    const prompt = 'What should I do on this page?';
    setOptionsOpen(false);
    pushUser(prompt);
    const result = finelyPublicAnswer({
      pathname,
      message: prompt,
      channel: 'chat',
      seniorMode: easyReadMode,
    });
    const kbChunkIds = result.citations.map((c) => c.id);
    pushBot(
      enrichPublicChatReply(result.reply, goal),
      chatStaff.personaId,
      'knowledge_local',
      undefined,
      kbChunkIds.length ? kbChunkIds : undefined,
      prompt,
    );
  };

  const pickGoal = (g: Goal) => {
    setOptionsOpen(false);
    setGoal(g);
    const p = resolvePersona(g);
    setPersonaOverrideId(undefined);
    pushBot(`Perfect — I'll connect you with our ${p.displayTitle.toLowerCase()} team. Checking who's available…`, chatStaff.personaId);
    window.setTimeout(() => beginHandoff(p), 600);
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

  const resolveMsgPresentation = (personaId?: AgentPersonaId) => {
    if (!personaId) return presentation;
    return resolveChatStaffPresentation({ personaId, audience }).presentation;
  };

  return (
    <div className="finely-public-chat-widget" data-fc-public-chat-widget="1" data-fc-obsidian-chat="1">
      {!open && (
        <button
          type="button"
          onClick={() => {
            refreshDutyFace({ forcePolicy: true });
            setOpen(true);
          }}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[120] inline-flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-600/90 via-teal-700/85 to-cyan-900/80 backdrop-blur-xl pl-2 pr-4 py-2 shadow-[0_12px_40px_-8px_rgba(16,185,129,0.55),0_0_0_1px_rgba(139,92,246,0.25)] hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.55),0_0_24px_-4px_rgba(45,212,191,0.35)] transition-all max-w-[calc(100vw-2rem)] ring-1 ring-violet-400/20"
          title={`${presentation.firstName} on duty · not legal advice`}
        >
          <PublicChatStaffAvatar
            key={presentation.staffMemberId ?? presentation.firstName}
            presentation={presentation}
            size="sm"
            showOnline
          />
          <div className="text-left min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300/90">
              Chat with {presentation.firstName}
            </div>
            <div className="text-xs text-white/80 truncate">On duty · {aiAssistBadgeLabel}</div>
          </div>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-[120] sm:w-[min(440px,calc(100vw-2rem))] sm:max-h-[calc(100vh-2rem)] flex flex-col">
          <div className="relative flex flex-col h-full sm:h-[min(640px,calc(100vh-2rem))] sm:rounded-3xl border border-white/[0.08] fc-comms-solid-shell fc-public-chat-panel shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] overflow-hidden ring-1 ring-white/5">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(16,185,129,0.12),transparent_55%),radial-gradient(ellipse_60%_40%_at_90%_20%,rgba(45,212,191,0.08),transparent_50%),radial-gradient(ellipse_50%_35%_at_70%_100%,rgba(139,92,246,0.07),transparent_45%)]"
            />
            <div className={`relative z-10 shrink-0 px-4 pt-4 pb-3 border-b border-white/[0.08] bg-gradient-to-br ${presentation.headerGradient}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <PublicChatStaffAvatar
                    key={presentation.staffMemberId ?? presentation.firstName}
                    presentation={presentation}
                    size="lg"
                    showOnline={launcherShiftMeta?.onShift ?? true}
                  />
                  <div className="min-w-0">
                    {handoffComplete ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-base truncate">{presentation.firstName}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-50 border border-emerald-300/40 uppercase tracking-wider font-bold animate-pulse">
                            Active now
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full text-violet-100 border border-violet-400/35 bg-violet-500/15 uppercase tracking-wider font-bold">
                            {aiAssistBadgeLabel}
                          </span>
                        </div>
                        <div className={`text-xs font-medium ${presentation.accentText} truncate`}>{presentation.title}</div>
                        <p className="text-xs text-white/55 mt-1 leading-snug">{presentation.tagline}</p>
                      </>
                    ) : handoffPhase === 'connecting' ? (
                      <>
                        <span className="font-bold text-white text-base">{presentation.firstName}</span>
                        <div className="text-xs font-medium text-emerald-200/80 mt-0.5">
                          Connecting you with {presentation.title}…
                        </div>
                        <p className="text-xs text-white/55 mt-1 leading-snug">{presentation.tagline}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-base">{presentation.firstName}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
                              launcherShiftMeta?.onShift
                                ? 'bg-emerald-400/25 text-emerald-50 border-emerald-300/35'
                                : 'bg-white/10 text-white/70 border-white/20'
                            }`}
                          >
                            {launcherShiftMeta?.onShift ? 'On shift' : 'After hours'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full text-violet-100 border border-violet-400/35 bg-violet-500/15 uppercase tracking-wider font-bold">
                            {aiAssistBadgeLabel}
                          </span>
                        </div>
                        <div className={`text-xs font-medium ${presentation.accentText} truncate mt-0.5`}>
                          {presentation.title}
                          {launcherShiftMeta?.summary ? (
                            <span className="text-white/45"> · {launcherShiftMeta.summary}</span>
                          ) : null}
                        </div>
                        <p className="text-xs text-white/45 mt-1 leading-snug">{presentation.tagline}</p>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={FINELY_OS_SECONDARY_BTN}
                  aria-label={t(locale, 'close')}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              ref={scrollerRef}
              className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-4 fc-public-chat-messages border-y border-white/[0.06]"
            >
              {handoffPhase === 'connecting' ? (
                <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 flex items-center gap-3 animate-pulse">
                  <PublicChatStaffAvatar presentation={presentation} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-sky-50">
                      {presentation.firstName} is coming online…
                    </p>
                    <p className="text-xs text-sky-100/70 mt-0.5">
                      Connecting you with {presentation.title}
                    </p>
                  </div>
                  <Loader2 size={18} className="text-sky-200 animate-spin shrink-0 ml-auto" />
                </div>
              ) : null}

              {typingLabel ? (
                <div className="flex items-center gap-2 text-xs text-white/45 px-1">
                  <Loader2 size={14} className="animate-spin text-emerald-300" />
                  {typingLabel}
                </div>
              ) : null}

              {messages.map((m) => {
                if (m.role === 'user') {
                  return (
                    <div key={m.id} className="flex justify-end pl-8">
                      <div className="max-w-[88%]">
                        <div className="text-xs text-sky-200/70 text-right mb-1 font-bold uppercase tracking-wider">{t(locale, 'you')}</div>
                        <div className="rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-white bg-gradient-to-br from-sky-600 to-blue-700 shadow-[0_4px_16px_-4px_rgba(56,189,248,0.35)] border border-sky-400/40 font-medium">
                          {m.text}
                          {m.attachments?.length ? (
                            <div className="mt-2 pt-2 border-t border-white/20 space-y-1 text-xs text-sky-50/90">
                              {m.attachments.map((a) => (
                                <div key={a.id}>{a.emoji} {a.label} · {a.fileName}</div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                }

                const msgPersona = resolveMsgPresentation(m.personaId);
                return (
                  <div key={m.id} className="flex justify-start gap-2.5 pr-6">
                    <PublicChatStaffAvatar presentation={msgPersona} size="sm" />
                    <div className="min-w-0 max-w-[88%] space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white/85">{msgPersona.firstName}</span>
                        <span className="text-xs text-white/45">· {msgPersona.title}</span>
                        <span className="text-xs uppercase tracking-wider rounded px-1.5 py-0.5 border text-violet-100 border-violet-400/35 bg-violet-500/15">
                          {aiAssistBadgeLabel}
                        </span>
                      </div>
                      <div className="rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-900 bg-white border border-slate-200/90 shadow-sm">
                        {m.text}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 px-0.5">
                        {m.source ? (
                          <span className="text-xs text-white/40">
                            {m.source === 'gateway' ? 'Live reply' : 'Knowledge base'}
                          </span>
                        ) : null}
                        {m.kbRefs?.map((ref) => (
                          <span key={ref} className="text-xs px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-100 border border-violet-300/20">
                            KB · {ref}
                          </span>
                        ))}
                      </div>
                      {m.kbChunkIds?.length ? (
                        <div className="flex items-center gap-1.5 px-0.5">
                          {m.feedbackGiven ? (
                            <span className="text-xs text-white/35">
                              {m.feedbackGiven === 'up' ? 'Thanks — glad that helped!' : 'Thanks — we\'ll improve this.'}
                            </span>
                          ) : (
                            <>
                              <span className="text-xs text-white/35">Helpful?</span>
                              <button
                                type="button"
                                onClick={() => submitKnowledgeFeedback(m, true)}
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-200/80 hover:bg-emerald-500/20 hover:text-emerald-100"
                                aria-label="Mark this answer helpful"
                                title="Helpful"
                              >
                                <ThumbsUp size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => submitKnowledgeFeedback(m, false)}
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-rose-400/25 bg-rose-500/10 text-rose-200/80 hover:bg-rose-500/20 hover:text-rose-100"
                                aria-label="Mark this answer not helpful"
                                title="Not helpful"
                              >
                                <ThumbsDown size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {busy ? (
                <div className="flex justify-start gap-2.5 pr-6">
                  <PublicChatStaffAvatar presentation={presentation} size="sm" />
                  <div className={`${finelyOsInlineListItem()} px-4 py-3 inline-flex gap-2 items-center`}>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:120ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:240ms]" />
                    </span>
                    <span className="text-xs text-white/55">{presentation.firstName} is typing…</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative shrink-0 px-3 py-3 border-t border-white/[0.08] bg-[#070d0b]/95 space-y-2">
              {pendingAttachments.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {pendingAttachments.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-500/15 px-2 py-1 text-xs text-sky-100">
                      {a.emoji} {a.label}
                      <button type="button" className="opacity-70 hover:opacity-100" onClick={() => setPendingAttachments((prev) => prev.filter((x) => x.id !== a.id))} aria-label="Remove attachment">×</button>
                    </span>
                  ))}
                </div>
              ) : null}

              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${presentation.firstName}…`}
                dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
                rows={3}
                className="w-full bg-white/[0.08] border border-emerald-400/25 rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-white/45 focus:border-emerald-400/55 focus:outline-none focus:ring-1 focus:ring-emerald-500/35 resize-none leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(draft);
                  }
                }}
                disabled={busy}
              />

              <div className="grid grid-cols-4 gap-1.5 items-stretch">
                <button
                  type="button"
                  onClick={() => {
                    setEmojiOpen(false);
                    setOptionsOpen((v) => !v);
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-black uppercase tracking-wider ${
                    optionsOpen
                      ? 'border-violet-300 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white'
                      : 'border-violet-400/80 bg-violet-500/25 text-violet-50 hover:bg-violet-500/35'
                  }`}
                  aria-expanded={optionsOpen}
                  aria-label={optionsOpen ? t(locale, 'closeOptions') : t(locale, 'openOptions')}
                >
                  <LayoutGrid size={14} />
                  <span className="hidden sm:inline">{t(locale, 'openOptions')}</span>
                </button>
                <input ref={fileInputRef} type="file" accept="application/pdf,image/*,.html,.htm" className="hidden" onChange={(e) => void handleAttachmentPick(e.target.files)} />
                <button
                  type="button"
                  disabled={attachmentBusy || pendingAttachments.length >= MAX_CHAT_ATTACHMENTS}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl border border-sky-400/40 bg-sky-500/15 text-xs font-bold uppercase tracking-wide text-sky-100 hover:bg-sky-500/25 disabled:opacity-40"
                  title={`Attach up to ${MAX_CHAT_ATTACHMENTS} documents (PDF, image, HTML)`}
                >
                  {attachmentBusy ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                  <span className="hidden sm:inline">Attach</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOptionsOpen(false);
                    setEmojiOpen((open) => !open);
                  }}
                  className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl border text-xs font-bold uppercase tracking-wide transition-all ${
                    emojiOpen
                      ? 'border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_0_1px_rgba(217,70,239,0.25)]'
                      : 'border-white/15 bg-white/[0.06] text-white/80 hover:border-fuchsia-400/35 hover:bg-fuchsia-500/10'
                  }`}
                  aria-expanded={emojiOpen}
                  aria-label="Insert emoji"
                >
                  <Smile size={14} />
                  <span className="hidden sm:inline">Emoji</span>
                </button>
                <button
                  type="button"
                  onClick={() => void sendMessage(draft)}
                  disabled={busy || (!sanitize(draft) && !pendingAttachments.length)}
                  className="inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black disabled:opacity-40 shadow-lg shadow-emerald-500/20 text-xs font-black uppercase tracking-wider"
                  title="Send"
                >
                  <Send size={16} />
                  Send
                </button>
              </div>

              {emojiOpen ? (
                <FinelyPremiumEmojiPicker
                  className="mt-1"
                  onPick={(emoji) => {
                    insertEmojiAtCursor(emoji);
                    setEmojiOpen(false);
                  }}
                />
              ) : null}

              {followUps.length > 0 ? (
                <div className="space-y-1.5 pt-0.5">
                  <span className={`${FINELY_OS_ENTITY_SUBLABEL} block text-teal-200/80`}>{t(locale, 'suggestedReplies')}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {followUps.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => void sendMessage(f)}
                        className="w-full px-2.5 py-2 rounded-xl border border-teal-400/35 bg-teal-500/15 text-xs text-teal-50 hover:bg-teal-500/25 text-left leading-snug"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {!goal && !handoffComplete ? (
                <div className="space-y-1.5 pt-0.5">
                  <span className={`${FINELY_OS_ENTITY_SUBLABEL} block text-emerald-200/80`}>{t(locale, 'pickLaneToStart')}</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LANE_OPTIONS.map((x) => (
                      <button
                        key={x.id}
                        data-testid={`public-chat-lane-chip-${x.id}`}
                        type="button"
                        onClick={() => pickGoal(x.id)}
                        className={`w-full px-2.5 py-2 rounded-xl border text-xs font-semibold text-left transition-all ${x.card}`}
                      >
                        {x.emoji} {x.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5 pt-0.5">
                <span className={`${FINELY_OS_ENTITY_SUBLABEL} block`}>{t(locale, 'language')}</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {CHAT_LOCALE_ORDER.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocale(loc)}
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold border transition-colors text-center ${
                        locale === loc
                          ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100'
                          : 'border-white/12 bg-white/[0.04] text-white/55 hover:border-white/25 hover:text-white/80'
                      }`}
                      aria-pressed={locale === loc}
                    >
                      {CHAT_LOCALE_LABELS[loc]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="shrink-0 text-xs text-center text-white/30 pb-2 px-3">Educational guidance · not legal advice</p>

            {optionsOpen ? (
              <>
                <button
                  type="button"
                  className="absolute inset-0 z-20 bg-black/55"
                  aria-label={t(locale, 'closeOptions')}
                  onClick={() => setOptionsOpen(false)}
                />
                <div className="absolute inset-x-0 bottom-0 z-30 max-h-[min(78vh,520px)] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-white/15 bg-[#141a21] shadow-[0_-20px_60px_-12px_rgba(0,0,0,0.75)]">
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#141a21]/95 px-4 py-3 backdrop-blur-sm">
                    <span className="text-xs font-black uppercase tracking-[0.28em] text-white/55">{t(locale, 'yourOptions')}</span>
                    <button
                      type="button"
                      onClick={() => setOptionsOpen(false)}
                      className={FINELY_OS_SECONDARY_BTN}
                      aria-label={t(locale, 'closeOptions')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="px-3 sm:px-4 py-3 space-y-3 pb-6">
                    {!goal && !handoffComplete ? (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-3">
                        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2 text-emerald-200/90`}>{t(locale, 'pickLaneToStart')}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {LANE_OPTIONS.map((x) => (
                            <button
                              data-testid={`public-chat-lane-${x.id}`}
                              key={x.id}
                              type="button"
                              onClick={() => pickGoal(x.id)}
                              className={`px-2.5 py-2.5 rounded-xl border text-left transition-all ${x.card}`}
                            >
                              <div className="text-xs font-black uppercase tracking-widest text-white/90">{x.emoji} {x.label}</div>
                              <div className={`text-xs mt-0.5 ${x.sub}`}>{x.roleHint}</div>
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => pickGoal('not_sure')}
                          className="mt-2 w-full px-3 py-2 rounded-xl border border-dashed border-rose-400/35 bg-rose-500/15 text-xs font-black uppercase tracking-widest text-rose-100 hover:bg-rose-500/25"
                        >
                          Not sure — Welcome Concierge
                        </button>
                      </div>
                    ) : null}

                    {followUps.length > 0 ? (
                      <div className="rounded-2xl border border-teal-400/25 bg-teal-950/30 p-3">
                        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2 text-teal-200/90`}>{t(locale, 'suggestedReplies')}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {followUps.map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => {
                                setOptionsOpen(false);
                                void sendMessage(f);
                              }}
                              className="px-2.5 py-1.5 rounded-full border border-teal-400/35 bg-teal-500/15 text-xs text-teal-50 hover:bg-teal-500/25 text-left"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-2xl border border-violet-400/25 bg-violet-950/30 p-3 space-y-3">
                      <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={easyReadMode}
                          onChange={(e) => setEasyReadMode(e.target.checked)}
                          className="accent-violet-400"
                        />
                        {t(locale, 'easyReadMode')}
                      </label>
                      <button
                        type="button"
                        onClick={sendPageHelp}
                        className="w-full py-2.5 rounded-xl border border-violet-400/35 bg-violet-500/15 text-xs font-black uppercase tracking-widest text-violet-100 hover:bg-violet-500/25"
                      >
                        {t(locale, 'pageHelp')}
                      </button>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2 text-white/55`}>{t(locale, 'popularTopics')}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_TOPICS.map((topic) => (
                          <button
                            key={topic.label}
                            type="button"
                            onClick={() => {
                              setOptionsOpen(false);
                              void sendMessage(topic.prompt);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-white/12 bg-white/[0.04] text-xs font-semibold text-white/75 hover:border-emerald-400/35 hover:text-emerald-100"
                          >
                            {topic.emoji} {topic.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {!submitted ? (
                      <details className="rounded-2xl border border-emerald-400/25 bg-emerald-500/8 overflow-hidden group">
                        <summary className="cursor-pointer list-none p-3 flex flex-wrap items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                          <div className="text-xs text-white/70 inline-flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-300 shrink-0" />
                            Free strategy call{handoffComplete ? ` with ${presentation.firstName}'s team` : ' with our specialists'}
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest text-emerald-300 group-open:hidden">Reserve →</span>
                          <span className="text-xs font-black uppercase tracking-widest text-white/40 hidden group-open:inline">Collapse</span>
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
                          <button type="button" disabled={!canSubmit || busy} onClick={() => void handleSubmitLead()} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-black uppercase tracking-widest text-xs disabled:opacity-50">
                            Submit
                          </button>
                        </div>
                      </details>
                    ) : null}

                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOptionsOpen(false);
                          requestLiveAgent();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-sky-400/25 bg-sky-500/10 text-xs font-black uppercase tracking-widest text-sky-100 hover:bg-sky-500/15"
                      >
                        Speak with a live agent
                      </button>

                      {!user ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setOptionsOpen(false);
                              navigate('/login');
                            }}
                            className="flex-1 min-w-[120px] py-2 rounded-xl border border-white/15 bg-white/5 text-xs font-black uppercase tracking-widest text-white/80 hover:bg-white/10"
                          >
                            Log in
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOptionsOpen(false);
                              navigate('/signup');
                            }}
                            className="flex-1 min-w-[120px] py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-xs font-black uppercase tracking-widest text-black hover:brightness-105"
                          >
                            Sign up free
                          </button>
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => {
                          setOptionsOpen(false);
                          navigate(funnelCta);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-violet-400/25 bg-violet-500/10 text-xs font-black uppercase tracking-widest text-violet-200 hover:bg-violet-500/15"
                      >
                        <Sparkles size={12} /> Get free guide stack
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {toolsForPersona(persona.id).map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            setOptionsOpen(false);
                            navigate(resolveToolPath(tool, { goal: goalLabel, funnelPath: funnelCta }));
                          }}
                          className={`px-2 py-1 rounded-lg ${FINELY_OS_ENTITY_CHIP} text-xs hover:text-emerald-200 hover:border-emerald-400/30`}
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
