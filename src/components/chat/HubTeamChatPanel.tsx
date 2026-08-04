import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageSquareText,
  Mail,
  Paperclip,
  Plus,
  Send,
  Smile,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { addThreadMessage, createThread, listMessagesByThread, listThreadsByPartner } from '../../data/supportRepo';
import {
  buildComposeHandoffFromThread,
  commsStudioUrlFromHandoff,
  saveComposeHandoffDraft,
} from '../../lib/commsConversationHandoff';
import type { SupportTopic } from '../../domain/support';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import type { EvidenceItem } from '../../domain/evidence';
import {
  CHAT_ATTACHMENT_ACCEPT,
  describeChatAttachmentError,
  formatAttachmentSize,
  uploadChatAttachment,
} from '../../lib/chatAttachments';
import {
  CHAT_VAULT_ATTACH_LIMIT,
  chatVaultAttachmentLabel,
  listChatVaultAttachments,
} from '../../lib/chatVaultAttachments';
import { ChatAttachmentTray, type ChatAttachmentTrayItem } from './ChatAttachmentTray';
import { FinelyPremiumEmojiPicker } from './FinelyPremiumEmojiPicker';
import { getChatSettings } from '../../data/settingsRepo';
import { fetchSupportReplySuggestions } from '../../lib/supportReplySuggestions';
import { STAFF_MESSAGE_SNIPPETS } from '../../lib/staffMessageSnippets';
import { searchTenorGifs, type TenorGif } from '../../lib/tenorClient';
import { SUPPORT_TOPICS } from './communicationHubModel';
import { routeCommsIntent, type CommsRoutingSuggestion } from '../../lib/commsIntentRouter';
import { recordCommsRoutingFeedback } from '../../lib/staffIntelligenceEngine';
import { StartVideoCallButton } from '../video/StartVideoCallButton';
import { resolveTeamContact, listAllTeamContacts } from '../../lib/staffMessagingContacts';
import { TeamContactPicker } from './TeamContactPicker';
import type { VideoCallParticipant } from '../../domain/videoCalls';
import {
  FINELY_OS_AI_WIDGET_HEADER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_PRIMARY_BTN,
  finelyOsMessageBubble,
} from '../../features/os/finelyOsLightUi';

const VAULT_ATTACH_LIMIT = CHAT_VAULT_ATTACH_LIMIT;

type ComposeMode = 'new' | 'reply';

const TEAM_COMPOSE_STARTERS = [
  { emoji: '⚖️', label: 'Dispute update', body: 'I have a question about my current dispute round and what I should do next.' },
  { emoji: '📄', label: 'Report review', body: 'I uploaded a credit report and need help understanding what to tackle first.' },
  { emoji: '🏛️', label: 'Debt / summons', body: 'I received a collection notice or summons and need guidance on next steps in the portal.' },
  { emoji: '📬', label: 'Letter status', body: 'I mailed dispute letters and want to track deadlines and bureau responses.' },
  { emoji: '💳', label: 'Billing question', body: 'I have a billing or subscription question on my Finely Cred account.' },
  { emoji: '📅', label: 'Schedule a call', body: 'I would like to schedule a video session to walk through my file.' },
];

const TEAM_REPLY_STARTERS = [
  { title: 'Thanks + next step', body: 'Thanks for the update — I will take care of that today and follow up if anything is unclear.' },
  { title: 'Need clarification', body: 'Can you clarify what you need from me and by when? I want to keep my round on track.' },
  { title: 'Attached evidence', body: 'I attached the screenshots/documents you asked for in my vault — please confirm you can see them.' },
  { title: 'Dispute mailed', body: 'I mailed my dispute letters today — can you help me set the follow-up timeline in tasks?' },
];

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function MessageBody({ text }: { text: string }) {
  const lines = String(text ?? '').split('\n');
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const isGifUrl = (u: string) => /\.(gif)(\?.*)?$/i.test(u) || (u.includes('tenor') && u.includes('.gif'));

  return (
    <div className="space-y-1 text-sm text-white/85 leading-relaxed whitespace-pre-wrap break-words">
      {lines.map((line, i) => {
        const parts = line.split(urlRe);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              urlRe.test(part) ? (
                isGifUrl(part) ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <img key={j} src={part} className="mt-2 max-w-full rounded-xl border border-white/[0.08] max-h-48 object-contain bg-black/30" />
                ) : (
                  <a key={j} href={part} target="_blank" rel="noreferrer" className="text-fuchsia-300 underline break-all">
                    {part}
                  </a>
                )
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}

function AttachmentChip({ item }: { item: EvidenceItem }) {
  const [openErr, setOpenErr] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1 max-w-full">
      <button
        type="button"
        onClick={() => {
          setOpenErr(null);
          void openBlobRefInNewTab({ blobRef: item.blobRef, mimeType: item.mimeType }).then((res) => {
            if (!res.ok) setOpenErr(res.message);
          });
        }}
        className={`inline-flex items-center gap-1.5 ${FINELY_OS_ENTITY_CHIP} hover:bg-white/[0.08]`}
        title={`Open ${item.filename}`}
      >
        <Paperclip size={10} /> {item.filename}
        {item.sizeBytes ? <span className="text-white/40 normal-case">{formatAttachmentSize(item.sizeBytes)}</span> : null}
      </button>
      {openErr ? <span className="text-[10px] text-rose-200 leading-snug normal-case">{openErr}</span> : null}
    </span>
  );
}

type Props = {
  partnerId?: string;
  partnerDisplayName?: string;
  compact?: boolean;
  initialTopic?: SupportTopic;
  initialThreadId?: string;
  lane?: string;
  adminMode?: boolean;
};

export function HubTeamChatPanel({ partnerId, partnerDisplayName, compact, initialTopic, initialThreadId, lane, adminMode }: Props) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(initialThreadId ?? null);
  const [showNew, setShowNew] = useState(false);
  const [newTopic, setNewTopic] = useState<SupportTopic>(initialTopic ?? 'general');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newAttachments, setNewAttachments] = useState<string[]>([]);
  const [replyBody, setReplyBody] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
  const [emojiOpen, setEmojiOpen] = useState<null | 'new' | 'reply'>(null);
  const [gifOpen, setGifOpen] = useState<null | 'new' | 'reply'>(null);
  const [gifQuery, setGifQuery] = useState('');
  const [gifBusy, setGifBusy] = useState(false);
  const [gifErr, setGifErr] = useState<string | null>(null);
  const [gifResults, setGifResults] = useState<TenorGif[]>([]);
  const [uploadBusyMode, setUploadBusyMode] = useState<ComposeMode | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<ComposeMode, string | null>>({ new: null, reply: null });
  const [attachmentWarnings, setAttachmentWarnings] = useState<Record<string, string>>({});
  const [composeErr, setComposeErr] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; body: string }>>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [showPeoplePicker, setShowPeoplePicker] = useState(false);
  const [threadFilter, setThreadFilter] = useState<'all' | 'direct' | 'team'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [composeRouting, setComposeRouting] = useState<CommsRoutingSuggestion[]>([]);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);
  const newRef = useRef<HTMLTextAreaElement | null>(null);

  const tenorApiKey = useMemo(() => getChatSettings().tenorApiKey ?? '', []);
  const gifsEnabled = Boolean(tenorApiKey);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (initialTopic) setNewTopic(initialTopic);
  }, [initialTopic]);

  useEffect(() => {
    const onStaffDm = (e: Event) => {
      const detail = (e as CustomEvent).detail as { staffId?: string; staffName?: string };
      if (!detail?.staffId) return;
      setSelectedContactIds([detail.staffId]);
      setNewSubject(detail.staffName ? `Direct: ${detail.staffName}` : 'Direct message');
      setShowNew(true);
      setComposeErr(null);
    };
    window.addEventListener('finely:staff-direct-message', onStaffDm as EventListener);
    return () => window.removeEventListener('finely:staff-direct-message', onStaffDm as EventListener);
  }, []);

  useEffect(() => {
    if (!gifOpen) return;
    const q = gifQuery.trim();
    if (!q || !gifsEnabled) {
      setGifResults([]);
      return;
    }
    setGifBusy(true);
    const t = window.setTimeout(async () => {
      try {
        setGifResults(await searchTenorGifs({ apiKey: tenorApiKey, query: q, limit: 16 }));
        setGifErr(null);
      } catch (e: any) {
        setGifErr(e?.message || 'GIF search failed.');
      } finally {
        setGifBusy(false);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [gifOpen, gifQuery, gifsEnabled, tenorApiKey]);

  const threads = useMemo(
    () => (partnerId ? listThreadsByPartner(partnerId).slice().sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)) : []),
    [partnerId, version],
  );
  const filteredThreads = useMemo(() => {
    if (threadFilter === 'all') return threads;
    if (threadFilter === 'direct') return threads.filter((t) => t.threadKind === 'direct' || (t.participantIds?.length === 1));
    return threads.filter((t) => t.threadKind === 'team' || (t.participantIds?.length ?? 0) > 1);
  }, [threads, threadFilter]);
  const selectedThread = useMemo(() => threads.find((t) => t.id === selectedThreadId) ?? null, [threads, selectedThreadId]);

  useEffect(() => {
    if (initialThreadId) setSelectedThreadId(initialThreadId);
    else if (threads.length && !selectedThreadId) setSelectedThreadId(threads[0]!.id);
  }, [initialThreadId, threads, selectedThreadId]);

  useEffect(() => {
    const text = (showNew ? newBody : replyBody).trim();
    if (text.length < 8) {
      setComposeRouting([]);
      return;
    }
    const routed = routeCommsIntent({ message: text, lane });
    setComposeRouting(routed.suggestions.filter((s) => s.kind !== 'ai_continue').slice(0, 4));
  }, [showNew, newBody, replyBody, lane]);

  const messages = useMemo(
    () => (selectedThread ? listMessagesByThread(selectedThread.id) : []),
    [selectedThread, version],
  );

  const prepCommsFromChat = (channel: 'email' | 'sms' | 'portal') => {
    if (!partnerId || !selectedThread) return;
    const handoff = buildComposeHandoffFromThread({ thread: selectedThread, channel, partnerId });
    saveComposeHandoffDraft(handoff);
    navigate(commsStudioUrlFromHandoff(handoff));
  };

  const evidence = useMemo(
    () => (partnerId ? listChatVaultAttachments(partnerId, VAULT_ATTACH_LIMIT) : []),
    [partnerId, version],
  );
  const evidenceById = useMemo(() => {
    // Resolve chips from full partner vault so sent/selected ids aren't dropped
    // just because they fell outside the chat attach limit ranking.
    const all = partnerId ? listEvidenceByPartner(partnerId) : [];
    return new Map(all.map((e) => [e.id, e]));
  }, [partnerId, version]);

  const VaultAttachPicker = ({ mode }: { mode: ComposeMode }) => {
    if (!evidence.length) return null;
    const selected = mode === 'new' ? newAttachments : replyAttachments;
    const screenshotCount = evidence.filter((e) => e.type === 'screenshot').length;
    return (
      <details open={screenshotCount > 0} className="rounded-xl border border-sky-500/25 bg-sky-500/8 px-3 py-2">
        <summary className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-sky-200/85">
          Attach from vault · {evidence.length}
          {screenshotCount ? ` · ${screenshotCount} report screenshot${screenshotCount === 1 ? '' : 's'}` : ''}
        </summary>
        <p className="mt-1.5 text-[10px] text-white/45">
          Credit-report screenshots appear first so you can send them without digging through older uploads.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {evidence.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => toggleAttach(ev.id, mode)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border ${
                selected.includes(ev.id)
                  ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-50'
                  : ev.type === 'screenshot'
                    ? 'border-sky-400/35 bg-sky-500/10 text-sky-50 hover:bg-sky-500/20'
                    : 'border-white/[0.08] text-white/55 hover:text-white/85'
              }`}
              title={ev.caption || ev.filename}
            >
              <Paperclip size={10} />
              <span className="truncate max-w-[130px]">{chatVaultAttachmentLabel(ev)}</span>
              {ev.sizeBytes ? <span className="text-white/35">{formatAttachmentSize(ev.sizeBytes)}</span> : null}
            </button>
          ))}
        </div>
      </details>
    );
  };

  const insertAtCursor = (mode: 'new' | 'reply', text: string) => {
    const ref = mode === 'new' ? newRef : replyRef;
    const setter = mode === 'new' ? setNewBody : setReplyBody;
    const el = ref.current;
    if (!el) {
      setter((prev) => `${prev}${text}`);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    setter(`${el.value.slice(0, start)}${text}${el.value.slice(end)}`);
  };

  const toggleAttach = (id: string, mode: 'new' | 'reply') => {
    const setter = mode === 'new' ? setNewAttachments : setReplyAttachments;
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const setUploadError = (mode: ComposeMode, text: string | null) =>
    setUploadErrors((prev) => ({ ...prev, [mode]: text }));

  const uploadFile = async (file: File, mode: ComposeMode) => {
    setUploadBusyMode(mode);
    setUploadError(mode, null);
    try {
      const { item, warning } = await uploadChatAttachment({ file, partnerId });
      if (warning) setAttachmentWarnings((prev) => ({ ...prev, [item.id]: warning }));
      const setter = mode === 'new' ? setNewAttachments : setReplyAttachments;
      setter((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
      window.dispatchEvent(new CustomEvent('finely:store'));
    } catch (e: unknown) {
      setUploadError(mode, describeChatAttachmentError(e));
    } finally {
      setUploadBusyMode(null);
    }
  };

  /** Selected attachments resolved for the pending-attachment tray. */
  const trayItems = (ids: string[]): ChatAttachmentTrayItem[] =>
    ids.map((id) => {
      const ev = evidenceById.get(id);
      return {
        id,
        filename: ev?.filename || 'Attachment',
        sizeBytes: ev?.sizeBytes,
        warning: attachmentWarnings[id] ?? null,
        missing: !ev,
      };
    });

  const removeAttachment = (id: string, mode: ComposeMode) => {
    const setter = mode === 'new' ? setNewAttachments : setReplyAttachments;
    setter((prev) => prev.filter((x) => x !== id));
  };

  const runAiSuggestions = async () => {
    if (!partnerId || !selectedThread) return;
    setAiBusy(true);
    try {
      setAiSuggestions(
        await fetchSupportReplySuggestions({
          thread: selectedThread,
          messages,
          partnerId,
          staffOutbound: adminMode,
        }),
      );
    } catch {
      setAiSuggestions([]);
    } finally {
      setAiBusy(false);
    }
  };

  /**
   * Keeps only attachment ids we can still resolve in the vault, so a stale
   * selection never turns into an invisible attachment on a sent message.
   */
  const sendableAttachments = (ids: string[]) => ids.filter((id) => evidenceById.has(id));

  /** Clears per-message attachment state and reports anything that got dropped. */
  const finishAttachments = (mode: ComposeMode, ids: string[], sent: string[]) => {
    setUploadError(
      mode,
      sent.length === ids.length
        ? null
        : 'One attachment could not be found in your vault and was not sent. Re-attach the file and send again.',
    );
    setAttachmentWarnings((prev) => {
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });
  };

  const attachmentOnlyBody = (count: number) =>
    count === 1
      ? 'Shared an evidence file from the Documents Vault.'
      : `Shared ${count} evidence files from the Documents Vault.`;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId) return;
    if (uploadBusyMode === 'new') {
      setUploadError('new', 'Your attachment is still uploading — wait a moment, then send.');
      return;
    }
    const sentAttachmentIds = sendableAttachments(newAttachments);
    if (!newBody.trim() && !sentAttachmentIds.length) return;
    const messageBody = newBody.trim() || attachmentOnlyBody(sentAttachmentIds.length);
    const newMessageAttachments = sentAttachmentIds.map((id) => ({ evidenceId: id }));

    if (adminMode) {
      const subject = newSubject.trim() || `Message from Finely · ${partnerDisplayName || 'Partner'}`;
      const { thread } = createThread({
        partnerId,
        topic: newTopic,
        subject,
        threadKind: 'general',
        initialMessage: {
          fromPartner: false,
          body: messageBody,
          attachments: newMessageAttachments,
        },
      });
      setSelectedThreadId(thread.id);
      setNewSubject('');
      setNewBody('');
      finishAttachments('new', newAttachments, sentAttachmentIds);
      setNewAttachments([]);
      setShowNew(false);
      setComposeErr(null);
      return;
    }

    const routed = routeCommsIntent({ message: newBody || messageBody, lane });
    const topic = routed.primaryTopic ?? newTopic;
    let contactIds = selectedContactIds;
    if (!contactIds.length && routed.preferredStaff[0]) {
      contactIds = [routed.preferredStaff[0].id];
    }
    if (!contactIds.length) {
      setComposeErr('Type your message — AI will suggest who to route to, or tap a suggestion chip.');
      return;
    }
    const contacts = contactIds.map((id) => resolveTeamContact(id)).filter(Boolean);
    const subject =
      newSubject.trim() ||
      (contacts.length === 1 ? `Direct: ${contacts[0]!.name}` : `Team: ${contacts.map((c) => c!.name).join(', ')}`);
    const { thread } = createThread({
      partnerId,
      topic,
      subject,
      participantIds: contactIds,
      threadKind: contactIds.length === 1 ? 'direct' : 'team',
      initialMessage: {
        fromPartner: true,
        body: messageBody,
        attachments: newMessageAttachments,
      },
    });
    setSelectedThreadId(thread.id);
    setNewSubject('');
    setNewBody('');
    finishAttachments('new', newAttachments, sentAttachmentIds);
    setNewAttachments([]);
    setShowNew(false);
    setComposeErr(null);
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || !selectedThread) return;
    if (uploadBusyMode === 'reply') {
      setUploadError('reply', 'Your attachment is still uploading — wait a moment, then send.');
      return;
    }
    const sentAttachmentIds = sendableAttachments(replyAttachments);
    if (!replyBody.trim() && !sentAttachmentIds.length) return;
    addThreadMessage({
      threadId: selectedThread.id,
      partnerId,
      topic: selectedThread.topic,
      fromPartner: adminMode ? false : true,
      body: replyBody.trim() || attachmentOnlyBody(sentAttachmentIds.length),
      attachments: sentAttachmentIds.map((id) => ({ evidenceId: id })),
    });
    setReplyBody('');
    finishAttachments('reply', replyAttachments, sentAttachmentIds);
    setReplyAttachments([]);
  };

  const videoInvitees = useMemo((): VideoCallParticipant[] => {
    return selectedContactIds
      .map((id) => resolveTeamContact(id))
      .filter(Boolean)
      .map((c) => ({
        role: c!.role,
        label: c!.name,
      }));
  }, [selectedContactIds]);

  const EmojiPicker = ({ mode }: { mode: 'new' | 'reply' }) =>
    emojiOpen === mode ? (
      <FinelyPremiumEmojiPicker
        className="mt-2"
        onPick={(emoji) => insertAtCursor(mode, emoji)}
      />
    ) : null;

  if (!partnerId) {
    return (
      <div className="p-6 text-sm text-white/60 space-y-3">
        <p>
          💬 Team threads are tied to a customer file. {adminMode ? 'To talk to agents live, use the AI Coach tab and tap Choose agent.' : 'Open a partner profile to message on their behalf.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {adminMode ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('finely:hub-switch-tab', { detail: { tab: 'ai' } }))}
              className="text-fuchsia-300 underline"
            >
              Switch to AI Coach
            </button>
          ) : null}
          <button type="button" onClick={() => navigate(adminMode ? '/admin/messages' : '/admin/support')} className="text-fuchsia-300 underline">
            {adminMode ? 'Admin Communication Hub' : 'Support Inbox'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full min-h-[360px] ${compact ? '' : 'lg:flex-row'}`}>
      {!compact ? (
        <div className="px-3 py-2 border-b border-white/[0.08] shrink-0 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setSidebarOpen((v) => !v)} className={FINELY_OS_PRIMARY_BTN}>
            <MessageSquareText size={14} /> {sidebarOpen ? 'Hide' : 'Show'} past conversations
          </button>
          {!showNew ? (
            <button
              type="button"
              onClick={() => {
                setShowNew(true);
                setComposeErr(null);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-white/[0.08] text-[10px] font-black uppercase text-white/70 hover:text-white"
            >
              <Plus size={14} /> New message
            </button>
          ) : null}
        </div>
      ) : null}
      {(sidebarOpen || compact) ? (
      <div
        className={`border-white/[0.08] bg-[#070b09]/40 ${compact ? 'border-b' : 'lg:w-72 lg:border-r shrink-0'} flex flex-col min-h-0 ${!compact && !sidebarOpen ? 'hidden' : ''}`}
      >
        <div className="p-3 space-y-3 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-widest text-fuchsia-300 font-black inline-flex items-center gap-1">
              <MessageSquareText size={12} /> Past conversations
            </span>
            {!compact ? (
              <button type="button" onClick={() => setSidebarOpen(false)} className="text-[10px] text-white/45 lg:hidden">
                Hide
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              setShowNew(true);
              setComposeErr(null);
            }}
            className={`w-full ${FINELY_OS_PRIMARY_BTN} justify-center`}
            title="Start a new message"
          >
            <Plus size={16} strokeWidth={3} /> New message
          </button>
          <div className="flex gap-1 fc-light-glass-panel fc-light-chrome-panel rounded-xl p-1">
            {(['all', 'direct', 'team'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setThreadFilter(f)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  threadFilter === f ? 'bg-fuchsia-500/20 text-fuchsia-100 border border-fuchsia-500/30' : 'text-white/45 hover:text-white/70'
                }`}
              >
                {f === 'all' ? 'All' : f === 'direct' ? 'Direct' : 'Teams'}
              </button>
            ))}
          </div>
        </div>
        <div className={`overflow-y-auto divide-y divide-white/5 ${compact ? 'max-h-36' : 'flex-1 min-h-[140px]'}`}>
        {filteredThreads.length === 0 ? (
          <p className="p-4 text-xs text-white/50">No threads yet — tap <strong className="text-fuchsia-300">New thread</strong> above.</p>
        ) : (
          filteredThreads.map((t) => {
            const people = (t.participantIds ?? []).map((id) => resolveTeamContact(id)).filter(Boolean);
            return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedThreadId(t.id)}
              className={`w-full text-left rounded-none border-0 p-3 transition-all ${
                selectedThreadId === t.id ? 'bg-fuchsia-500/10 border-l-2 border-l-fuchsia-500' : 'hover:bg-white/[0.04] border-l-2 border-l-transparent'
              }`}
            >
              <div className="text-sm text-white font-medium truncate">{t.subject}</div>
              {people.length ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {people.slice(0, 3).map((c) => (
                    <span key={c!.id} className="px-1.5 py-0.5 rounded fc-light-glass-panel fc-light-chrome-panel border text-[9px] text-white/55">
                      {c!.emoji} {c!.name.split(' ')[0]}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="text-[10px] text-white/40 mt-0.5">
                {SUPPORT_TOPICS.find((x) => x.value === t.topic)?.emoji}{' '}
                {SUPPORT_TOPICS.find((x) => x.value === t.topic)?.label ?? t.topic}
                {t.threadKind === 'direct' ? ' • Direct' : t.threadKind === 'team' ? ' • Team' : ''} • {fmtWhen(t.lastMessageAt)}
              </div>
            </button>
          );
          })
        )}
        </div>
      </div>
      ) : null}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {showNew && (
          <form onSubmit={handleCreate} className="border-b border-white/[0.08] p-3 space-y-3 bg-fuchsia-500/5 shrink-0 max-h-[48vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] uppercase tracking-widest text-fuchsia-300 font-black">✨ New team thread</div>
              <button type="button" onClick={() => setShowNew(false)} className="p-1.5 rounded-lg border border-white/[0.08] text-white/50 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <TeamContactPicker
              selectedIds={selectedContactIds}
              onChange={setSelectedContactIds}
              hint="Pick credit specialists, dispute analysts, affiliates, AU sellers, funding advisors, or any staff member."
            />
            <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 space-y-2">
              <p className="text-[9px] uppercase tracking-widest text-sky-200/80 font-black">
                {adminMode ? 'Staff quick messages' : 'Quick starters'}
              </p>
              <div className="flex flex-wrap gap-2">
                {adminMode
                  ? STAFF_MESSAGE_SNIPPETS.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setNewBody(chip.body(partnerDisplayName || 'Partner'))}
                        className="px-2 py-1.5 rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/10 text-[10px] text-fuchsia-100"
                      >
                        {chip.emoji} {chip.label}
                      </button>
                    ))
                  : TEAM_COMPOSE_STARTERS.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          setNewBody(chip.body);
                          setNewTopic(
                            chip.label.includes('Billing')
                              ? 'billing'
                              : chip.label.includes('Debt')
                                ? 'debt_summons'
                                : chip.label.includes('Dispute') || chip.label.includes('Letter')
                                  ? 'disputes'
                                  : 'general',
                          );
                        }}
                        className="px-2 py-1.5 rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/10 text-[10px] text-fuchsia-100"
                      >
                        {chip.emoji} {chip.label}
                      </button>
                    ))}
              </div>
            </div>
            {!adminMode ? (
            <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 space-y-2">
              <p className="text-[9px] uppercase tracking-widest text-sky-200/80 font-black">Or let AI suggest routing</p>
              <p className="text-[11px] text-white/55">Describe your issue — tap a chip below to auto-select staff, or pick someone above.</p>
              {composeRouting.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {composeRouting.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => {
                        if (chip.staffId) {
                          setSelectedContactIds([chip.staffId]);
                          recordCommsRoutingFeedback({
                            intent: routeCommsIntent({ message: newBody, lane }).intent,
                            staffId: chip.staffId,
                            personaId: chip.personaId,
                            kind: chip.kind,
                          });
                        }
                        if (chip.topic) setNewTopic(chip.topic);
                      }}
                      className="px-2 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-100"
                    >
                      {chip.emoji} {chip.label}
                    </button>
                  ))}
                </div>
              ) : null}
              {selectedContactIds.length > 0 ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedContactIds.map((id) => {
                    const c = resolveTeamContact(id);
                    if (!c) return null;
                    return (
                      <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-sky-500/40 bg-sky-500/15 text-[9px] text-sky-100">
                        {c.emoji} {c.name}
                        <button type="button" onClick={() => setSelectedContactIds((ids) => ids.filter((x) => x !== id))}>×</button>
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
            ) : null}
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Subject (optional — auto-generated if blank)"
              className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-2 py-1.5 text-white text-xs placeholder:text-white/30"
            />
            <textarea
              ref={newRef}
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Message Finely ops, your specialist, or program team…"
              rows={2}
              className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm resize-none"
            />
            <ChatAttachmentTray
              items={trayItems(newAttachments)}
              onRemove={(id) => removeAttachment(id, 'new')}
              busy={uploadBusyMode === 'new'}
              error={uploadErrors.new}
              onDismissError={() => setUploadError('new', null)}
            />
            <VaultAttachPicker mode="new" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEmojiOpen((p) => (p === 'new' ? null : 'new'))} className="px-2 py-1 rounded-lg border border-white/[0.08] text-xs text-white/70">
                <Smile size={12} className="inline mr-1" /> Emoji
              </button>
              {gifsEnabled && (
                <button type="button" onClick={() => setGifOpen((p) => (p === 'new' ? null : 'new'))} className="px-2 py-1 rounded-lg border border-white/[0.08] text-xs text-white/70">
                  GIF
                </button>
              )}
              <label
                className={`px-2 py-1 rounded-lg border border-white/[0.08] text-xs text-white/70 ${
                  uploadBusyMode === 'new' ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-emerald-400/35'
                }`}
                title="Attach a photo, PDF, or document"
              >
                <UploadCloud size={12} className="inline mr-1" /> {uploadBusyMode === 'new' ? 'Uploading…' : 'Attach file'}
                <input
                  type="file"
                  className="hidden"
                  accept={CHAT_ATTACHMENT_ACCEPT}
                  disabled={uploadBusyMode === 'new'}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.currentTarget.value = '';
                    void (async () => {
                      for (const f of files) await uploadFile(f, 'new');
                    })();
                  }}
                  multiple
                />
              </label>
              <button
                type="submit"
                disabled={
                  (!newBody.trim() && !newAttachments.length) ||
                  (!adminMode && selectedContactIds.length === 0) ||
                  uploadBusyMode === 'new'
                }
                className={`ml-auto ${FINELY_OS_PRIMARY_BTN} !py-2 !px-4`}
              >
                Send
              </button>
            </div>
            <EmojiPicker mode="new" />
            {composeErr ? <div className="text-xs text-red-200">{composeErr}</div> : null}
          </form>
        )}

        <div className="flex-1 overflow-y-auto p-3 pb-6 space-y-3 min-h-0">
          {!selectedThread ? (
            <div className={`text-center py-12 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Select a thread or create one to message your Finely team 🤝
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.fromPartner ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] px-4 py-3 ${
                    m.fromPartner
                      ? 'rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/30'
                      : finelyOsMessageBubble('assistant')
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                    {m.fromPartner ? partnerDisplayName || 'Partner' : adminMode ? 'Finely team (you)' : 'Finely team'} •{' '}
                    {fmtWhen(m.createdAt)}
                  </div>
                  <MessageBody text={m.body} />
                  {m.attachments?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.attachments.map((a) => {
                        const ev = evidenceById.get(a.evidenceId);
                        return ev ? (
                          <AttachmentChip key={a.evidenceId} item={ev} />
                        ) : (
                          <span
                            key={a.evidenceId}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-amber-400/35 bg-amber-500/10 text-[10px] text-amber-100"
                            title="This attachment is not in the vault on this device."
                          >
                            <Paperclip size={10} /> Attachment unavailable here
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedThread && (
          <form onSubmit={handleReply} className="border-t-2 border-fuchsia-500/20 p-3 space-y-3 bg-[#070b09]/95 shrink-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] text-white/40 truncate">{selectedThread.subject}</span>
              <div className="flex items-center gap-2 flex-wrap">
                {partnerId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowPeoplePicker((v) => !v)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-white/[0.08] text-[9px] font-black uppercase text-white/55 hover:border-sky-500/30"
                    >
                      👥 {selectedContactIds.length} invited
                    </button>
                    <StartVideoCallButton
                      partnerId={partnerId}
                      threadId={selectedThread.id}
                      displayName={partnerDisplayName || 'Partner'}
                      compact
                      defaultTitle={`Video: ${selectedThread.subject}`}
                      invitees={videoInvitees}
                    />
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => void runAiSuggestions()}
                  disabled={aiBusy}
                  className="inline-flex items-center gap-1 text-[10px] text-fuchsia-300 font-black uppercase"
                >
                  <Sparkles size={11} /> {aiBusy ? '…' : 'AI drafts'}
                </button>
                {adminMode && partnerId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => prepCommsFromChat('email')}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-amber-500/25 text-[9px] font-black uppercase text-amber-200 hover:bg-amber-500/10"
                    >
                      <Mail size={11} /> Comms email
                    </button>
                    <button
                      type="button"
                      onClick={() => prepCommsFromChat('sms')}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-sky-500/25 text-[9px] font-black uppercase text-sky-200 hover:bg-sky-500/10"
                    >
                      SMS
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            {showPeoplePicker && partnerId ? (
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 flex flex-wrap gap-2">
                <p className="w-full text-[9px] uppercase tracking-widest text-sky-200/70 font-black">Invite to video call</p>
                {listAllTeamContacts().map((c) => {
                  const on = selectedContactIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSelectedContactIds((ids) =>
                          on ? ids.filter((x) => x !== c.id) : [...ids, c.id],
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] transition-all ${
                        on
                          ? 'border-sky-500/40 bg-sky-500/15 text-sky-100'
                          : 'border-white/[0.08] bg-white/[0.05] text-white/50 hover:text-white/80'
                      }`}
                    >
                      <span>{c.emoji}</span> {c.name}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {aiSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {aiSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReplyBody(s.body)}
                    className="text-left px-3 py-2 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 text-xs text-white/80 max-w-full"
                    title={s.body}
                  >
                    ✨ {s.title}
                  </button>
                ))}
              </div>
            )}
            {!replyBody.trim() && aiSuggestions.length === 0 ? (
              <div className="flex flex-wrap gap-2">
                {adminMode
                  ? STAFF_MESSAGE_SNIPPETS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setReplyBody(s.body(partnerDisplayName || 'Partner'))}
                        className="text-left px-3 py-2 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 text-xs text-white/80"
                        title={s.body(partnerDisplayName || 'Partner')}
                      >
                        {s.emoji} {s.label}
                      </button>
                    ))
                  : TEAM_REPLY_STARTERS.map((s) => (
                      <button
                        key={s.title}
                        type="button"
                        onClick={() => setReplyBody(s.body)}
                        className="text-left px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white/75"
                        title={s.body}
                      >
                        {s.title}
                      </button>
                    ))}
              </div>
            ) : null}
            <div className="rounded-2xl border-2 border-amber-400/25 bg-[#151d19] shadow-inner">
              <textarea
                ref={replyRef}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Reply with emojis, files, or GIFs…"
                rows={compact ? 2 : 3}
                className="w-full bg-transparent border-0 outline-none px-4 py-3 text-white text-sm resize-none min-h-[88px] placeholder:text-white/35"
              />
            </div>
            <ChatAttachmentTray
              items={trayItems(replyAttachments)}
              onRemove={(id) => removeAttachment(id, 'reply')}
              busy={uploadBusyMode === 'reply'}
              error={uploadErrors.reply}
              onDismissError={() => setUploadError('reply', null)}
            />
            <div className="rounded-xl border border-white/12 bg-black/35 px-3 py-2.5 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setEmojiOpen((p) => (p === 'reply' ? null : 'reply'))} className="p-2.5 rounded-xl border border-white/15 bg-white/[0.06] text-white/80 hover:border-fuchsia-400/35">
                <Smile size={14} />
              </button>
              {gifsEnabled && (
                <button type="button" onClick={() => setGifOpen((p) => (p === 'reply' ? null : 'reply'))} className="p-2.5 rounded-xl border border-white/15 bg-white/[0.06] text-white/80 hover:border-sky-400/35">
                  GIF
                </button>
              )}
              <label
                className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-white/15 bg-white/[0.06] text-white/80 text-[11px] font-semibold ${
                  uploadBusyMode === 'reply' ? 'opacity-60 cursor-wait' : 'hover:border-emerald-400/35 cursor-pointer'
                }`}
                title="Attach a photo, PDF, or document"
              >
                <UploadCloud size={14} />
                {uploadBusyMode === 'reply' ? 'Uploading…' : 'Attach'}
                <input
                  type="file"
                  className="hidden"
                  accept={CHAT_ATTACHMENT_ACCEPT}
                  disabled={uploadBusyMode === 'reply'}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.currentTarget.value = '';
                    void (async () => {
                      for (const f of files) await uploadFile(f, 'reply');
                    })();
                  }}
                  multiple
                />
              </label>
              <button
                type="submit"
                disabled={(!replyBody.trim() && !replyAttachments.length) || uploadBusyMode === 'reply'}
                className={`ml-auto ${FINELY_OS_PRIMARY_BTN} !py-2 !px-4`}
              >
                <Send size={14} /> Send
              </button>
            </div>
            {evidence.length ? (
              <VaultAttachPicker mode="reply" />
            ) : null}
            <EmojiPicker mode="reply" />
            {gifOpen === 'reply' && gifsEnabled && (
              <div className="rounded-xl border border-white/[0.08] p-2 space-y-2">
                <input
                  value={gifQuery}
                  onChange={(e) => setGifQuery(e.target.value)}
                  placeholder="Search GIFs…"
                  className="w-full bg-fc-input border border-white/[0.08] rounded-lg px-2 py-1 text-white text-xs"
                />
                <div className="grid grid-cols-4 gap-1 max-h-24 overflow-y-auto">
                  {gifResults.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        insertAtCursor('reply', `${g.url}\n`);
                        setGifOpen(null);
                      }}
                      className="rounded-lg overflow-hidden border border-white/[0.08]"
                    >
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <img src={g.previewUrl || g.url} className="w-full h-14 object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
                {gifErr ? <div className="text-xs text-red-200">{gifErr}</div> : null}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
