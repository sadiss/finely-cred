import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, Loader2, Paperclip, Send, Sparkles, ShieldCheck, X } from 'lucide-react';
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
import { getPublicChatPersonaPresentation, getPublicChatAiReceptionistPresentation, PUBLIC_CHAT_AI_PERSONA_ID } from './publicChatPersonaUi';
import { PublicChatStaffAvatar } from './PublicChatStaffAvatar';
import { useAuth } from '../../auth/AuthProvider';
import { findPartnerByEmail } from '../../data/partnersRepo';
import {
  analyzePublicChatDocumentHeuristic,
  formatPublicChatDocReply,
  persistPublicChatDocumentForPartner,
  sprinkleChatEmoji,
  type PublicChatDocAnalysis,
} from '../../lib/publicChatDocumentIntake';
import { openCommunicationHub } from './communicationHubModel';
import { finelyBrainOrchestrate } from '../../lib/finelyBrain/finelyBrainOrchestrate';
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
  attachments?: PublicChatDocAnalysis[];
};

type Goal = 'personal' | 'business' | 'tradelines' | 'debt' | 'not_sure';

const GENERIC_WELCOME =
  "Hi — I'm Aia, Finely Cred's AI guide. Pick a lane below or tell me what you're working on — I'll connect you with the right live specialist when you're ready.";

const LIVE_AGENT_PATTERN =
  /\b(live\s+(agent|person|human|rep|specialist)|real\s+(person|human|agent)|speak\s+(with|to)\s+(a\s+)?(human|person|agent|someone|live)|talk\s+to\s+(a\s+)?(human|real|live)|connect\s+me\s+(to|with)\s+(a\s+)?(human|person|live))/i;

const AI_RECEPTIONIST_PROMPT =
  'You are Aia, Finely Cred\'s AI receptionist on the public website. Be warm, concise, and educational — never legal advice. Use friendly emojis sparingly (1–2 per message max) to keep the chat approachable. Orient guests, answer basics, and when they need deeper help or a live person, explain that you will connect them with an on-duty specialist after they pick a lane or share their goal. Do not pretend to be human; you are the AI guide that routes to real team members.';

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
  const [easyReadMode, setEasyReadMode] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<PublicChatDocAnalysis[]>([]);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [aiHistory, setAiHistory] = useState<AiGatewayMessage[]>([]);
  const [handoffComplete, setHandoffComplete] = useState(false);
  const [handoffPhase, setHandoffPhase] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persona = useMemo(() => resolvePersona(goal, personaOverrideId), [goal, personaOverrideId]);
  const presentation = useMemo(() => getPublicChatPersonaPresentation(persona), [persona]);
  const aiPresentation = useMemo(() => getPublicChatAiReceptionistPresentation(), []);
  const launcherPresentation = aiPresentation;
  const showSpecialistIdentity = handoffPhase === 'connecting' || handoffComplete;

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
    for (const pres of [launcherPresentation, aiPresentation, presentation]) {
      const url = pres.avatarUrl?.trim();
      if (url) {
        const img = new Image();
        img.src = url;
      }
    }
  }, [launcherPresentation, aiPresentation, presentation]);

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
    else handoffTimerRef.current = setTimeout(finish, 1400 + Math.floor(Math.random() * 900));
  };

  useEffect(() => {
    setMessages([
      {
        id: 'm0',
        role: 'bot',
        text: t(locale, 'welcomeGeneric'),
        personaId: PUBLIC_CHAT_AI_PERSONA_ID,
      },
    ]);
  }, [locale]);

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
      setOpen(true);
      if (detail.personaId) setPersonaOverrideId(detail.personaId);
      if (detail.goal) {
        setGoal(detail.goal);
        const p = resolvePersona(detail.goal, detail.personaId);
        pushBot(
          `Got it — let me check who's on duty for ${p.displayTitle.toLowerCase()}. One moment while I connect you…`,
          PUBLIC_CHAT_AI_PERSONA_ID,
        );
        window.setTimeout(() => beginHandoff(p), 700);
      } else if (detail.personaId) {
        const p = getAgentPersona(detail.personaId) ?? personaOnDutyAt();
        pushBot(`I'll connect you with our ${p.displayTitle.toLowerCase()} team — checking availability now…`, PUBLIC_CHAT_AI_PERSONA_ID);
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

  const pushBot = (text: string, personaId: AgentPersonaId, source?: ChatMsg['source'], kbRefs?: string[]) => {
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: 'bot', text: sprinkleChatEmoji(text, goal), source, personaId, kbRefs },
    ]);
  };

  const pushUser = (text: string, attachments?: PublicChatDocAnalysis[]) => {
    setMessages((prev) => [...prev, { id: newId(), role: 'user', text, attachments }]);
  };

  const handleAttachmentPick = async (files: FileList | null) => {
    if (!files?.length || attachmentBusy) return;
    const slots = MAX_CHAT_ATTACHMENTS - pendingAttachments.length;
    if (slots <= 0) {
      pushBot('You can attach up to 2 documents per message. Send these first, then upload more. 📎', PUBLIC_CHAT_AI_PERSONA_ID);
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
        PUBLIC_CHAT_AI_PERSONA_ID,
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
        PUBLIC_CHAT_AI_PERSONA_ID,
      );
      return;
    }
    if (!handoffComplete) {
      if (!goal) {
        pushBot('Pick your lane above first — then I can connect you with a live specialist.', PUBLIC_CHAT_AI_PERSONA_ID);
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
      pushBot(t(activeLocale, 'needPartnerForStaff'), PUBLIC_CHAT_AI_PERSONA_ID);
      setAppointmentDraft((prev) => ({ notes: `${prev?.notes ?? ''} ${trimmed}`.trim(), ...parseAppointmentDraft(trimmed) }));
      if (!handoffComplete) {
        window.setTimeout(() => beginHandoff(getEffectiveAgentPersona('appointment_setter')), 500);
      }
    }

    if (LIVE_AGENT_PATTERN.test(trimmed) || (chatIntent === 'specific_staff' && user)) {
      requestLiveAgent();
      return;
    }

    const classified = classifyMessageIntent(trimmed);
    let activePersona = personaOverride ?? (handoffComplete ? persona : getEffectiveAgentPersona(PUBLIC_CHAT_AI_PERSONA_ID));
    const activePersonaId = handoffComplete ? activePersona.id : PUBLIC_CHAT_AI_PERSONA_ID;

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
          PUBLIC_CHAT_AI_PERSONA_ID,
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
      const addendum = buildConversationalSystemAddendum({
        locale: activeLocale,
        tone,
        priorBotSnippets: priorBot,
        staffName: presentation.firstName,
        onShiftRole: activePersona.displayTitle,
        isPartner: Boolean(user),
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        userMessage: `${aiText}${attachmentBlock}`,
        easyReadMode,
      });

      const result = await converseWithFinelyAi({
        messages: aiHistory,
        userMessage: `${aiText}${attachmentBlock}`,
        systemPromptBase: handoffComplete ? activePersona.systemPrompt : AI_RECEPTIONIST_PROMPT,
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

      const trusted = matchTrustedResources(aiText);
      let replyText = result.text;
      if (trusted.length && !replyText.includes('http') && !replyText.includes('/free-')) {
        const linkLines = trusted.slice(0, 2).map((r) => `${r.label}: ${r.href.startsWith('http') ? r.href : `${window.location.origin}${r.href}`}`);
        replyText = `${replyText}\n\n${t(activeLocale, 'trustedLinks')}:\n${linkLines.join('\n')}`;
      }

      const kbRefs = result.knowledgeUsed.slice(0, 2).map((c) => c.article.title);
      pushBot(replyText, activePersonaId, result.source, kbRefs.length ? kbRefs : undefined);
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
    const result = finelyBrainOrchestrate({ pathname, userMessage: prompt, seniorMode: easyReadMode });
    pushBot(sprinkleChatEmoji(result.reply), result.personaId, 'knowledge_local');
  };

  const pickGoal = (g: Goal) => {
    setOptionsOpen(false);
    setGoal(g);
    const p = resolvePersona(g);
    setPersonaOverrideId(undefined);
    pushBot(`Perfect — I'll connect you with our ${p.displayTitle.toLowerCase()} team. Checking who's available…`, PUBLIC_CHAT_AI_PERSONA_ID);
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
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300/90">Chat with Aia</div>
            <div className="text-xs text-white/80 truncate">AI guide · live specialist when ready</div>
          </div>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-[120] sm:w-[min(440px,calc(100vw-2rem))] sm:max-h-[calc(100vh-2rem)] flex flex-col">
          <div className="relative flex flex-col h-full sm:h-[min(640px,calc(100vh-2rem))] sm:rounded-3xl border border-emerald-500/20 bg-[#070d0b] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] overflow-hidden ring-1 ring-white/5">
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
                        <span className="font-bold text-white text-base">{aiPresentation.firstName}</span>
                        <div className="text-xs font-medium text-cyan-200/80 mt-0.5">
                          {aiPresentation.title} · routing you to the right specialist
                        </div>
                        <p className="text-[11px] text-white/45 mt-1 leading-snug">{aiPresentation.tagline}</p>
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className={`${FINELY_OS_ENTITY_SUBLABEL} shrink-0`} htmlFor="public-chat-locale">
                  {t(locale, 'language')}:
                </label>
                <select
                  id="public-chat-locale"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as ChatLocale)}
                  className="min-w-0 max-w-full flex-1 rounded-lg border border-white/15 bg-[#0a1210] px-2 py-1.5 text-[11px] text-white/85 focus:border-emerald-400/50 focus:outline-none"
                >
                  {CHAT_LOCALE_ORDER.map((loc) => (
                    <option key={loc} value={loc}>
                      {CHAT_LOCALE_LABELS[loc]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              ref={scrollerRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-4 bg-[#0c1014] border-y border-white/[0.06]"
            >
              {handoffPhase === 'connecting' ? (
                <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 flex items-center gap-3 animate-pulse">
                  <PublicChatStaffAvatar presentation={presentation} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-sky-50">
                      {presentation.firstName} is coming online…
                    </p>
                    <p className="text-[10px] text-sky-100/70 mt-0.5">
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
                        <div className="text-[9px] text-sky-200/70 text-right mb-1 font-bold uppercase tracking-wider">{t(locale, 'you')}</div>
                        <div className="rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-white bg-gradient-to-br from-sky-600 to-blue-700 shadow-[0_4px_16px_-4px_rgba(56,189,248,0.35)] border border-sky-400/40 font-medium">
                          {m.text}
                          {m.attachments?.length ? (
                            <div className="mt-2 pt-2 border-t border-white/20 space-y-1 text-[11px] text-sky-50/90">
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

                const msgPersona =
                  m.role === 'bot' && !handoffComplete
                    ? aiPresentation
                    : m.personaId
                      ? getPublicChatPersonaPresentation(getAgentPersona(m.personaId)!)
                      : showSpecialistIdentity
                        ? presentation
                        : aiPresentation;
                return (
                  <div key={m.id} className="flex justify-start gap-2.5 pr-6">
                    <PublicChatStaffAvatar presentation={msgPersona} size="sm" />
                    <div className="min-w-0 max-w-[88%] space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-white/85">{msgPersona.firstName}</span>
                        <span className="text-[9px] text-white/45">· {msgPersona.title}</span>
                        <span className="text-[8px] uppercase tracking-wider text-emerald-300/70 border border-emerald-400/25 rounded px-1 py-0.5 bg-emerald-500/10">Staff</span>
                      </div>
                      <div className="rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-900 bg-white border border-slate-200/90 shadow-sm">
                        {m.text}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 px-0.5">
                        {m.source ? (
                          <span className="text-[9px] text-white/40">
                            {m.source === 'gateway' ? 'Live reply' : 'Knowledge base'}
                          </span>
                        ) : null}
                        {m.kbRefs?.map((ref) => (
                          <span key={ref} className="text-[8px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-100 border border-violet-300/20">
                            KB · {ref}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

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
                    <span className="text-xs text-white/55">{handoffComplete ? `${presentation.firstName} is typing…` : `${aiPresentation.firstName} is typing…`}</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="shrink-0 px-3 py-3 border-t border-white/[0.08] bg-[#070d0b] space-y-2">
              {pendingAttachments.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {pendingAttachments.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-1 text-[10px] text-amber-100">
                      {a.emoji} {a.label}
                      <button type="button" className="opacity-70 hover:opacity-100" onClick={() => setPendingAttachments((prev) => prev.filter((x) => x.id !== a.id))} aria-label="Remove attachment">×</button>
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOptionsOpen((v) => !v)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider shadow-[0_0_18px_-4px_rgba(251,191,36,0.55)] ${
                  optionsOpen
                    ? 'border-amber-300 bg-gradient-to-br from-amber-400 to-orange-500 text-black'
                    : 'border-amber-400/80 bg-gradient-to-br from-amber-500/25 to-orange-600/30 text-amber-50 hover:from-amber-400/40 hover:to-orange-500/40'
                }`}
                aria-expanded={optionsOpen}
                aria-label={optionsOpen ? t(locale, 'closeOptions') : t(locale, 'openOptions')}
              >
                <LayoutGrid size={14} />
                ✨ {t(locale, 'openOptions')}
              </button>
              <input ref={fileInputRef} type="file" accept="application/pdf,image/*,.html,.htm" className="hidden" onChange={(e) => void handleAttachmentPick(e.target.files)} />
              <button
                type="button"
                disabled={attachmentBusy || pendingAttachments.length >= MAX_CHAT_ATTACHMENTS}
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-2.5 rounded-xl border border-sky-400/40 bg-sky-500/15 text-[10px] font-bold uppercase tracking-wide text-sky-100 hover:bg-sky-500/25 disabled:opacity-40"
                title={`Attach up to ${MAX_CHAT_ATTACHMENTS} documents (PDF, image, HTML)`}
              >
                {attachmentBusy ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                Docs
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={handoffComplete ? `Message ${presentation.firstName}…` : `Message ${aiPresentation.firstName}…`}
                dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
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
                disabled={busy || (!sanitize(draft) && !pendingAttachments.length)}
                className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black disabled:opacity-40 shadow-lg shrink-0"
                title="Send"
              >
                <Send size={16} />
              </button>
              </div>
            </div>
            <p className="shrink-0 text-[9px] text-center text-white/30 pb-2 px-3">Educational guidance · not legal advice</p>

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
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/55">{t(locale, 'yourOptions')}</span>
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
                              className="px-2.5 py-1.5 rounded-full border border-teal-400/35 bg-teal-500/15 text-[10px] text-teal-50 hover:bg-teal-500/25 text-left"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-2xl border border-amber-400/25 bg-amber-950/30 p-3 space-y-3">
                      <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={easyReadMode}
                          onChange={(e) => setEasyReadMode(e.target.checked)}
                          className="accent-amber-400"
                        />
                        {t(locale, 'easyReadMode')}
                      </label>
                      <button
                        type="button"
                        onClick={sendPageHelp}
                        className="w-full py-2.5 rounded-xl border border-amber-400/35 bg-amber-500/15 text-[10px] font-black uppercase tracking-widest text-amber-100 hover:bg-amber-500/25"
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
                            className="px-2.5 py-1.5 rounded-lg border border-white/12 bg-white/[0.04] text-[9px] font-semibold text-white/75 hover:border-emerald-400/35 hover:text-emerald-100"
                          >
                            {topic.label}
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
                    ) : null}

                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOptionsOpen(false);
                          requestLiveAgent();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-sky-400/25 bg-sky-500/10 text-[10px] font-black uppercase tracking-widest text-sky-100 hover:bg-sky-500/15"
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
                            className="flex-1 min-w-[120px] py-2 rounded-xl border border-white/15 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/80 hover:bg-white/10"
                          >
                            Log in
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOptionsOpen(false);
                              navigate('/signup');
                            }}
                            className="flex-1 min-w-[120px] py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-[10px] font-black uppercase tracking-widest text-black hover:brightness-105"
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
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-violet-400/25 bg-violet-500/10 text-[10px] font-black uppercase tracking-widest text-violet-200 hover:bg-violet-500/15"
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
                          className={`px-2 py-1 rounded-lg ${FINELY_OS_ENTITY_CHIP} text-[9px] hover:text-emerald-200 hover:border-emerald-400/30`}
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
