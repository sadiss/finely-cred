import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, ExternalLink, Languages, Mic, MicOff, RotateCcw, Send, Sparkles, UploadCloud, Volume2 } from 'lucide-react';
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
import {
  forceStaffShiftPolicyResync,
  listPortalStaffForLane,
  resolveStaffOnDuty,
  resolveStaffOnDutyForLane,
  loadStaffRoster,
  listAllMessageableStaff,
} from '../../data/staffRoster';
import { staffMemberFullName, type StaffMember } from '../../domain/staffMember';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import { STAFF_PORTRAIT_PHOTO_CLASS } from '../../lib/staffPortrait';
import {
  buildAiAssistSystemPrompt,
  resolveChatStaffPresentation,
} from '../../lib/chatStaffPresentation';
import { buildWarmUnclassifiedReply, isUnclassifiableChatMessage } from '../../lib/chatMessageFallback';
import {
  buildConversationalSystemAddendum,
  humanReplyDelayMs,
  inferUserTone,
} from '../../lib/publicChatEngine';
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
  CHAT_ATTACHMENT_ACCEPT,
  describeChatAttachmentError,
  uploadChatAttachment,
} from '../../lib/chatAttachments';
import { ChatAttachmentTray, type ChatAttachmentTrayItem } from './ChatAttachmentTray';
import {
  FINELY_OS_COMPACT_TEXTAREA,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsMessageBubble,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsAiGatewayBanner } from '../../features/os/FinelyOsAiGatewayBanner';
import { speakFinelyText, useFinelyVoiceInput } from '../../hooks/useFinelyVoiceInput';
import {
  finelyPublicAnswer,
  shouldUseFinelyPublicAnswer,
} from '../../lib/finelyBrain/finelyPublicAnswer';
import { resolveWorkspaceProductPath } from '../../features/workspaceLightPreview/product/workspaceProductNav';
import {
  CHAT_LOCALE_LABELS,
  CHAT_LOCALE_ORDER,
  detectLocaleFromText,
  isRtlLocale,
  localeInstruction,
  t,
  type ChatLocale,
} from '../../lib/publicChatI18n';

const SPEECH_LOCALE: Record<ChatLocale, string> = {
  en: 'en-US',
  es: 'es-US',
  ht: 'ht-HT',
  fr: 'fr-FR',
  pt: 'pt-BR',
  zh: 'zh-CN',
  vi: 'vi-VN',
  ar: 'ar-SA',
};

type Props = {
  partnerId?: string;
  lane?: string;
  journeyStage?: string;
  compact?: boolean;
  userName?: string;
  showAllAgents?: boolean;
  navigationMode?: 'preview' | 'live';
  workspaceRole?: 'partner' | 'admin';
  draftPrompt?: string;
  draftPromptKey?: number;
  contextLabel?: string;
};

type ChatMessage = AiGatewayMessage & { id: string; ts: string; source?: 'gateway' | 'knowledge_local' };

function newMsgId() {
  return `msg_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function buildCoachGreeting(staffBundle: ReturnType<typeof resolveChatStaffPresentation>, userName?: string) {
  const welcome = staffBundle.welcomeWithAiDisclosure;
  const you = userName?.trim().split(/\s+/)[0];
  if (you && you.length >= 2 && !new RegExp(`\\b${you.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(welcome)) {
    return welcome.replace(/^(You're chatting|Hey|Hi|Welcome|Hello)( —|-|:)?/i, `$1, ${you}$2`);
  }
  return welcome;
}

export function HubAiCoachPanel({
  partnerId,
  lane,
  journeyStage,
  compact,
  userName,
  showAllAgents,
  navigationMode = 'live',
  workspaceRole = 'partner',
  draftPrompt,
  draftPromptKey,
  contextLabel,
}: Props) {
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
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachmentTrayItem[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [locale, setLocale] = useState<ChatLocale>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const saved = window.localStorage.getItem('fc_hub_locale') as ChatLocale | null;
      return saved && CHAT_LOCALE_ORDER.includes(saved) ? saved : 'en';
    } catch {
      return 'en';
    }
  });
  const navigateTo = useCallback(
    (target: string) => navigate(resolveWorkspaceProductPath(workspaceRole, target, navigationMode)),
    [navigate, navigationMode, workspaceRole],
  );

  const rosterTabs = useMemo(
    () => (showAllAgents ? listAllMessageableStaff() : listPortalStaffForLane(lane)),
    [lane, showAllAgents],
  );
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [dutyTick, setDutyTick] = useState(0);
  const persona = useMemo(() => getPortalStaffPersona(personaId), [personaId]);

  useEffect(() => {
    forceStaffShiftPolicyResync();
    setDutyTick((n) => n + 1);
    const onStore = () => setDutyTick((n) => n + 1);
    const interval = window.setInterval(() => setDutyTick((n) => n + 1), 30_000);
    window.addEventListener('finely:store', onStore);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('finely:store', onStore);
    };
  }, []);

  const activeStaff: StaffMember | null = useMemo(() => {
    void dutyTick;
    if (activeStaffId) return rosterTabs.find((s) => s.id === activeStaffId) ?? resolveStaffOnDutyForLane(lane);
    return resolveStaffOnDutyForLane(lane) ?? resolveStaffOnDuty(personaId);
  }, [activeStaffId, rosterTabs, personaId, lane, dutyTick]);

  const chatStaff = useMemo(() => {
    void dutyTick;
    return resolveChatStaffPresentation({
      personaId,
      lane,
      staffMemberId: activeStaffId,
      audience: 'partner',
    });
  }, [personaId, lane, activeStaffId, dutyTick]);

  const presentation = chatStaff.presentation;
  const aiAssistBadgeLabel = chatStaff.aiAssistBadgeLabel;

  const displayTitle = persona.displayTitle ?? persona.role;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const staffBundle = resolveChatStaffPresentation({ personaId, lane, audience: 'partner' });
    return [
      {
        id: newMsgId(),
        role: 'assistant',
        content: buildCoachGreeting(staffBundle, userName),
        ts: new Date().toISOString(),
      },
    ];
  });

  const voice = useFinelyVoiceInput({
    lang: SPEECH_LOCALE[locale],
    onResult: (text) => {
      const detected = detectLocaleFromText(text);
      if (detected) setLocale(detected);
      setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
    },
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('fc_hub_locale', locale);
    } catch {
      // Language persistence is optional.
    }
  }, [locale]);

  useEffect(() => {
    if (draftPrompt?.trim()) setInput(draftPrompt.trim());
  }, [draftPrompt, draftPromptKey]);

  const displayInput = useMemo(() => {
    if (!voice.listening || !voice.interimTranscript) return input;
    const base = input.trim();
    const interim = voice.interimTranscript.trim();
    if (!base) return interim;
    return `${base} ${interim}`;
  }, [input, voice.listening, voice.interimTranscript]);

  useEffect(() => {
    setMessages([
      {
        id: newMsgId(),
        role: 'assistant',
        content: buildCoachGreeting(chatStaff, userName),
        ts: new Date().toISOString(),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentation.firstName, presentation.staffMemberId, userName]);

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
      locale,
      conversationalAddendum: contextLabel
        ? `Current workspace context selected in the interface: ${contextLabel}.`
        : undefined,
    }),
    [partnerId, lane, journeyStage, userName, personaId, activeStaff?.id, pathname, locale, contextLabel],
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
            ? `Welcome back — you're chatting with Finely's AI, standing in for ${name}, ${title} (ref ${handoff.leadId}). What would you like to tackle first in your portal?`
            : `Welcome — Finely's AI here, standing in for ${name}, ${title}, continuing from your earlier conversation. How can I help in your dashboard today?`,
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

  const uploadAttachment = async (file: File) => {
    setUploadBusy(true);
    setUploadErr(null);
    try {
      const { item, warning } = await uploadChatAttachment({ file, partnerId });
      setPendingAttachments((prev) => [
        ...prev,
        { id: item.id, filename: item.filename, sizeBytes: item.sizeBytes, warning },
      ]);
      window.dispatchEvent(new CustomEvent('finely:store'));
    } catch (e: unknown) {
      setUploadErr(describeChatAttachmentError(e));
    } finally {
      setUploadBusy(false);
    }
  };

  /**
   * The coach can't read binaries, so a file the partner attaches here is handed to
   * the human team thread with the same message body. Returns the thread subject so
   * the partner gets told exactly where the file landed.
   */
  const deliverAttachmentsToTeam = (body: string): string | null => {
    if (!partnerId || !pendingAttachments.length) return null;
    const topic: SupportTopic = routeCommsIntent({ message: body, lane }).primaryTopic ?? 'documents';
    const subject = buildThreadSubject({ topic, staff: activeStaff ?? null, snippet: body });
    const thread = getOrCreateThreadBySubject({ partnerId, topic, subject });
    addThreadMessage({
      threadId: thread.id,
      partnerId,
      topic,
      fromPartner: true,
      body,
      attachments: pendingAttachments.map((a) => ({ evidenceId: a.id })),
    });
    window.dispatchEvent(new CustomEvent('finely:store'));
    return thread.subject;
  };

  const sendPrompt = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      const detectedLocale = detectLocaleFromText(trimmed);
      const responseLocale = detectedLocale ?? locale;
      if (detectedLocale && detectedLocale !== locale) setLocale(detectedLocale);
      if (uploadBusy) {
        setUploadErr('Your attachment is still uploading — wait a moment, then send.');
        return;
      }
      setErr(null);
      setBusy(true);
      setInput('');
      setLastUserText(trimmed);

      const attachmentCount = pendingAttachments.length;
      const deliveredSubject = attachmentCount ? deliverAttachmentsToTeam(trimmed) : null;
      if (deliveredSubject) {
        setPendingAttachments([]);
        setUploadErr(null);
        setHandoffBanner(
          `${attachmentCount === 1 ? 'Your file' : `Your ${attachmentCount} files`} went to the Finely team — open Team chat to see their reply.`,
        );
      } else if (attachmentCount) {
        setUploadErr('We could not attach your file to a team thread. Open Team chat and send it there.');
      }
      const routed = routeCommsIntent({ message: trimmed, lane, journeyStage });
      setRoutingChips(routed.suggestions);
      if (routed.preferredStaff[0] && routed.classifiedPersonaId !== personaId) {
        setPersonaId(routed.classifiedPersonaId);
        setActiveStaffId(routed.preferredStaff[0]?.id ?? null);
      }
      const userMsg: ChatMessage = { id: newMsgId(), role: 'user', content: trimmed, ts: new Date().toISOString() };
      const history = [...messages, userMsg];
      setMessages(history);

      const delayMs = humanReplyDelayMs({ userMessage: trimmed });
      await new Promise((r) => window.setTimeout(r, delayMs));

      if (isUnclassifiableChatMessage(trimmed)) {
        const staffBundle = resolveChatStaffPresentation({
          personaId,
          lane,
          staffMemberId: activeStaffId,
          audience: 'partner',
        });
        const fallback = buildWarmUnclassifiedReply({
          presentation: staffBundle.presentation,
          audience: 'partner',
          sentContent: trimmed,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: newMsgId(),
            role: 'assistant',
            content: fallback.reply,
            ts: new Date().toISOString(),
            source: 'knowledge_local',
          },
        ]);
        setFollowUps(fallback.followUps);
        return;
      }

      if (responseLocale === 'en' && shouldUseFinelyPublicAnswer(trimmed, pathname)) {
        try {
          const publicResult = finelyPublicAnswer({
            pathname,
            message: trimmed,
            channel: 'chat',
          });
          setMessages((prev) => [
            ...prev,
            {
              id: newMsgId(),
              role: 'assistant',
              content: publicResult.reply,
              ts: new Date().toISOString(),
              source: 'knowledge_local',
            },
          ]);
          setFollowUps([]);
          return;
        } catch {
          // fall through to live coach
        }
      }

      const classified = classifyMessageIntent(trimmed);
      let activePersona = persona;
      if (classified.confidence >= 0.6 && classified.suggestedPersonaId !== personaId) {
        setPersonaId(classified.suggestedPersonaId);
        activePersona = getPortalStaffPersona(classified.suggestedPersonaId);
        const staff = resolveStaffOnDuty(classified.suggestedPersonaId);
        if (staff) setActiveStaffId(staff.id);
      }

      try {
        const replyStaffBundle = resolveChatStaffPresentation({
          personaId: activePersona.id,
          lane,
          staffMemberId: activeStaffId,
          audience: 'partner',
        });
        const priorBot = messages.filter((m) => m.role === 'assistant').map((m) => m.content);
        const addendum = buildConversationalSystemAddendum({
          locale: responseLocale,
          tone: inferUserTone(trimmed),
          priorBotSnippets: priorBot,
          staffName: replyStaffBundle.presentation.firstName,
          onShiftRole: replyStaffBundle.presentation.title,
          isPartner: true,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          userMessage: trimmed,
          easyReadMode: true,
        });
        const systemPromptBase = buildAiAssistSystemPrompt({
          presentation: replyStaffBundle.presentation,
          persona: activePersona,
          staff: replyStaffBundle.staff,
          personalityHint: replyStaffBundle.personalityHint,
          audience: 'partner',
          extra: `${activePersona.systemPrompt}\n\n${DASHBOARD_AI_COACH_SYSTEM}\n\n${localeInstruction(responseLocale)}\n\n${addendum}`,
        });

        const result = await converseWithFinelyAi({
          messages: history.map(({ role, content }) => ({ role, content })),
          userMessage: trimmed,
          systemPromptBase,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, messages, ctx, persona, personaId, pendingAttachments, uploadBusy, partnerId, activeStaff, lane, locale],
  );

  const onPickSuggestion = (node: AiSuggestionNode) => {
    if (node.children?.length) {
      setPath((prev) => [...prev, node]);
      return;
    }
    if (node.navigate) navigateTo(node.navigate);
    if (node.prompt) void sendPrompt(node.prompt);
  };

  const clearChat = () => {
    setMessages([
      {
        id: newMsgId(),
        role: 'assistant',
        content: buildCoachGreeting(chatStaff, userName),
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
      if (chip.navigate) navigateTo(chip.navigate);
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
    <div className="flex flex-col h-full min-h-0">
      <div className="fc-comms-agent-rail shrink-0 px-4 py-2 border-b space-y-2">
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
            <div className="text-xs uppercase tracking-widest text-emerald-300/90 font-black inline-flex items-center gap-1.5 flex-wrap">
              <Sparkles size={11} />
              {connecting ? 'Connecting…' : `${presentation.firstName} · ${displayTitle}`}
              {!connecting ? (
                <span className="text-xs px-1.5 py-0.5 rounded-full text-violet-100 border border-violet-400/35 bg-violet-500/15 normal-case tracking-normal font-bold">
                  {aiAssistBadgeLabel}
                </span>
              ) : null}
              {!enabled ? <span className="text-white/40 normal-case font-semibold">(local)</span> : null}
            </div>
            {!connecting && activeStaff ? (
              <div className="text-xs text-emerald-300/80 mt-0.5 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active now
              </div>
            ) : null}
          </div>
          <button type="button" onClick={clearChat} className={FINELY_OS_SECONDARY_BTN}>
            <RotateCcw size={11} /> Clear
          </button>
        </div>

        {compact ? null : (
        <p className="text-[10px] text-white/50">
          Type your question — or pick a specialist below to talk with that team member.
        </p>
        )}

        {compact ? null : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setAgentPickerOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/25 text-emerald-200/90 hover:bg-emerald-500/10"
          >
            {agentPickerOpen ? 'Hide specialist roster' : 'Choose specialist'}
          </button>
          {agentPickerOpen ? (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {rosterTabs.map((member) => {
                const selected = activeStaff?.id === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      switchStaff(member);
                      setAgentPickerOpen(false);
                    }}
                    className={`shrink-0 flex flex-col items-center gap-1 w-[4.5rem] p-1.5 rounded-xl border transition ${
                      selected
                        ? 'border-emerald-400/50 bg-emerald-500/15'
                        : 'border-white/[0.08] bg-white/[0.04] hover:border-emerald-400/30'
                    }`}
                    title={staffMemberFullName(member)}
                  >
                    <StaffPortraitImg staff={member} className="w-9 h-9 rounded-full border border-emerald-400/25" />
                    <span className="text-[8px] font-bold text-white/75 line-clamp-2 text-center leading-tight">
                      {member.firstName}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        )}

        {compact ? null : (
        <div className="flex flex-wrap gap-1">
          {toolsForPersona(personaId).map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => navigateTo(resolveToolPath(tool, { goal: lane, partnerId }))}
              className="px-2 py-0.5 rounded-full text-[9px] border border-emerald-500/20 text-emerald-200/80 hover:bg-emerald-500/10"
            >
              {tool.label}
            </button>
          ))}
        </div>
        )}
      </div>

      {!enabled ? <FinelyOsAiGatewayBanner compact className="mx-3 mt-2 !p-2" /> : null}

      <div ref={scrollerRef} className={`flex-1 min-h-0 overflow-y-auto space-y-3 ${compact ? 'p-3' : 'p-4'}`}>
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
                <div className={`text-xs font-bold ${FINELY_OS_ENTITY_SUBLABEL} px-1 flex flex-wrap items-center gap-2`}>
                  <span>{presentation.firstName} · {displayTitle}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full text-violet-100 border border-violet-400/35 bg-violet-500/15 uppercase tracking-wider">
                    {aiAssistBadgeLabel}
                  </span>
                </div>
              ) : null}
              <div
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'rounded-2xl px-4 py-3 text-white'
                    : finelyOsMessageBubble('assistant')
                }`}
                style={
                  m.role === 'user'
                    ? {
                        backgroundImage:
                          'linear-gradient(145deg, rgba(14,165,233,0.95) 0%, rgba(59,130,246,0.95) 48%, rgba(124,58,237,0.95) 100%)',
                        boxShadow: '0 18px 44px -26px rgba(59,130,246,0.70)',
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
              {m.role === 'assistant' ? (
                <button
                  type="button"
                  onClick={() => speakFinelyText(m.content, SPEECH_LOCALE[locale])}
                  className="inline-flex items-center gap-1 px-1 text-[10px] text-sky-200/75 hover:text-sky-100"
                  title="Read this reply aloud"
                >
                  <Volume2 size={11} /> Read aloud
                </button>
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
        <div className="px-3 py-1.5 border-t border-white/[0.08] flex gap-1.5 overflow-x-auto bg-black/15">
          {followUps.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => void sendPrompt(f.replace(/^Open /, 'How do I use '))}
              className="shrink-0 px-2.5 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[10px] text-emerald-100 hover:bg-emerald-500/15"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {routingChips.length > 0 ? (
        <div className="px-3 py-1.5 border-t border-white/[0.08] space-y-1.5 bg-emerald-500/5">
          <div className="text-[10px] uppercase tracking-widest text-emerald-300/90 font-black">Suggested next step</div>
          <div className="flex gap-2 overflow-x-auto">
            {routingChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => applyRoutingChip(chip)}
                className="shrink-0 px-3 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-left hover:bg-emerald-500/20 transition-all max-w-[220px]"
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

      <div className="fc-comms-composer border-t p-3 space-y-2">
        {partnerId ? (
          <ChatAttachmentTray
            items={pendingAttachments}
            onRemove={(id) => setPendingAttachments((prev) => prev.filter((x) => x.id !== id))}
            busy={uploadBusy}
            error={uploadErr}
            onDismissError={() => setUploadErr(null)}
            label="Will be sent to your Finely team"
          />
        ) : null}
        <textarea
          value={displayInput}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(locale, 'sendPlaceholder')}
          dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
          rows={2}
          className={`w-full resize-none ${FINELY_OS_COMPACT_TEXTAREA} !mt-0 !min-h-[4.5rem] !py-2.5 border-emerald-500/20 focus:border-emerald-500/40 ${
            voice.listening ? 'border-sky-400/40 shadow-[0_0_0_1px_rgba(56,189,248,0.22)]' : ''
          }`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void sendPrompt(input.trim() ? input : displayInput);
            }
          }}
          disabled={busy}
        />
        {voice.listening ? (
          <p className="text-[10px] text-emerald-200/75 animate-pulse">Listening — your words appear here as you speak…</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTopicsOpen((v) => !v)}
            className={`inline-flex items-center justify-center gap-1.5 ${FINELY_OS_SECONDARY_BTN} !px-3`}
            aria-expanded={topicsOpen}
          >
            <Sparkles size={14} />
            {topicsOpen ? 'Hide' : 'More'}
          </button>
          {compact ? null : (
          <label
            className={`inline-flex items-center gap-1.5 ${FINELY_OS_SECONDARY_BTN} !px-2`}
            title="Choose the coach and microphone language"
          >
            <Languages size={14} />
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as ChatLocale)}
              className="max-w-[8.5rem] bg-transparent text-inherit text-xs outline-none"
              aria-label="Coach language"
            >
              {CHAT_LOCALE_ORDER.map((option) => (
                <option key={option} value={option} className="bg-slate-950 text-white">
                  {CHAT_LOCALE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          )}
          {voice.supported ? (
            <button
              type="button"
              onClick={() => (voice.listening ? voice.stop() : voice.start())}
              className={`inline-flex items-center justify-center gap-1.5 ${FINELY_OS_SECONDARY_BTN} !px-3`}
              title={voice.listening ? 'Stop dictation' : 'Dictate your message'}
              disabled={busy}
            >
              {voice.listening ? <MicOff size={14} /> : <Mic size={14} />}
              {voice.listening ? 'Stop' : 'Mic'}
            </button>
          ) : null}
          {partnerId ? (
            <label
              className={`inline-flex items-center justify-center gap-1.5 ${FINELY_OS_SECONDARY_BTN} !px-3 ${
                uploadBusy ? 'opacity-60 cursor-wait' : 'cursor-pointer'
              }`}
              title="Attach a photo, PDF, or document — it goes to your Finely team"
            >
              <UploadCloud size={14} /> Attach
              <input
                type="file"
                className="hidden"
                accept={CHAT_ATTACHMENT_ACCEPT}
                disabled={uploadBusy || busy}
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.currentTarget.value = '';
                  void (async () => {
                    for (const f of files) await uploadAttachment(f);
                  })();
                }}
              />
            </label>
          ) : null}
          <button
            type="button"
            onClick={() => void sendPrompt(input.trim() ? input : displayInput)}
            disabled={busy || !(input.trim() || displayInput.trim())}
            className={`inline-flex items-center justify-center gap-1.5 ${FINELY_OS_PRIMARY_BTN} disabled:opacity-50 ml-auto`}
          >
            <Send size={14} /> {busy ? '…' : 'Send'}
          </button>
        </div>
      </div>

      {topicsOpen ? (
      <div className="fc-comms-composer border-t px-3 py-2 space-y-2">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-fuchsia-300/90 font-black">
          <Sparkles size={12} />
          {path.length === 0 ? 'Topics' : path[path.length - 1]?.label}
        </div>
        {compact ? (
          <label className={`inline-flex items-center gap-1.5 ${FINELY_OS_SECONDARY_BTN} !px-2`}>
            <Languages size={14} />
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as ChatLocale)}
              className="max-w-[8.5rem] bg-transparent text-inherit text-xs outline-none"
              aria-label="Coach language"
            >
              {CHAT_LOCALE_ORDER.map((option) => (
                <option key={option} value={option} className="bg-slate-950 text-white">
                  {CHAT_LOCALE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
            {path.length > 0 ? (
              <button
                type="button"
                onClick={() => setPath((p) => p.slice(0, -1))}
                className="text-[11px] text-white/50 hover:text-white font-semibold"
              >
                ← Back
              </button>
            ) : null}
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {currentNodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => onPickSuggestion(node)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-white/90 text-xs font-semibold transition-all"
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
      ) : null}
    </div>
  );
}
