import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageSquareText,
  Paperclip,
  Plus,
  Send,
  Smile,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listEvidenceByPartner, upsertEvidence } from '../../data/evidenceRepo';
import { addThreadMessage, createThread, listMessagesByThread, listThreadsByPartner } from '../../data/supportRepo';
import type { SupportTopic } from '../../domain/support';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { getBlobStore } from '../../storage/getBlobStore';
import { newId } from '../../utils/ids';
import type { EvidenceItem } from '../../domain/evidence';
import { EMOJI_CATEGORIES, EMOJI_LIST, PREMIUM_EMOJI_CATEGORIES } from './emojiData';
import { callAiGateway } from '../../lib/aiClient';
import { extractFirstJsonObject } from '../../utils/jsonExtract';
import { getChatSettings } from '../../data/settingsRepo';
import { searchTenorGifs, type TenorGif } from '../../lib/tenorClient';
import { openUrlInNewTab } from '../../utils/download';
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

const blobStore = getBlobStore();
const VAULT_ATTACH_LIMIT = 10;

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
  return (
    <button
      type="button"
      onClick={async () => {
        const res = await getBlobUrl(item.blobRef, { mimeType: item.mimeType });
        if (!res?.url) return;
        openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
      }}
      className={`inline-flex items-center gap-1.5 ${FINELY_OS_ENTITY_CHIP} hover:bg-white/[0.08]`}
    >
      <Paperclip size={10} /> {item.filename}
    </button>
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
  const [emojiQuery, setEmojiQuery] = useState('');
  const [gifOpen, setGifOpen] = useState<null | 'new' | 'reply'>(null);
  const [gifQuery, setGifQuery] = useState('');
  const [gifBusy, setGifBusy] = useState(false);
  const [gifErr, setGifErr] = useState<string | null>(null);
  const [gifResults, setGifResults] = useState<TenorGif[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
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
      setUploadErr(null);
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
  const evidence = useMemo(() => (partnerId ? listEvidenceByPartner(partnerId) : []), [partnerId, version]);
  const evidenceById = useMemo(() => new Map(evidence.map((e) => [e.id, e])), [evidence]);

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

  const uploadFile = async (file: File, mode: 'new' | 'reply') => {
    if (!partnerId) return;
    setUploadBusy(true);
    setUploadErr(null);
    try {
      const { ref } = await blobStore.put(file, {
        partnerId,
        caption: 'Chat attachment',
        scanMode: false,
        kind: 'evidence',
      });
      const item: EvidenceItem = {
        id: newId('evidence'),
        partnerId,
        type: 'upload',
        source: 'upload',
        caption: 'Chat attachment',
        filename: file.name || 'attachment',
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        blobRef: ref,
        createdAt: new Date().toISOString(),
      };
      upsertEvidence(item);
      toggleAttach(item.id, mode);
      window.dispatchEvent(new CustomEvent('finely:store'));
    } catch (e: any) {
      setUploadErr(e?.message || 'Upload failed.');
    } finally {
      setUploadBusy(false);
    }
  };

  const runAiSuggestions = async () => {
    if (!partnerId || !selectedThread) return;
    setAiBusy(true);
    try {
      const recent = messages.slice(-8);
      const transcript = recent.map((m) => `${m.fromPartner ? 'You' : 'Finely'}: ${m.body}`).join('\n');
      const res = await callAiGateway({
        taskType: 'support.reply_suggestions',
        providerHint: 'openai',
        responseFormat: 'json',
        context: { topic: selectedThread.topic, threadId: selectedThread.id, partnerId },
        messages: [
          {
            role: 'system',
            content:
              'Return JSON only: { "suggestions": [ { "title": string, "body": string } ] }. Provide 4 concise reply drafts for a credit repair customer. Friendly, compliant, no legal advice.',
          },
          { role: 'user', content: `Subject: ${selectedThread.subject}\n\n${transcript}` },
        ],
      });
      const obj = extractFirstJsonObject(res.text) as any;
      setAiSuggestions(
        (Array.isArray(obj?.suggestions) ? obj.suggestions : [])
          .map((s: any) => ({ title: `${s?.title ?? ''}`.trim(), body: `${s?.body ?? ''}`.trim() }))
          .filter((s: any) => s.title && s.body)
          .slice(0, 5),
      );
    } catch {
      setAiSuggestions([]);
    } finally {
      setAiBusy(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || !newBody.trim()) return;
    const routed = routeCommsIntent({ message: newBody, lane });
    const topic = routed.primaryTopic ?? newTopic;
    let contactIds = selectedContactIds;
    if (!contactIds.length && routed.preferredStaff[0]) {
      contactIds = [routed.preferredStaff[0].id];
    }
    if (!contactIds.length) {
      setUploadErr('Type your message — AI will suggest who to route to, or tap a suggestion chip.');
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
        body: newBody.trim(),
        attachments: newAttachments.map((id) => ({ evidenceId: id })),
      },
    });
    setSelectedThreadId(thread.id);
    setNewSubject('');
    setNewBody('');
    setNewAttachments([]);
    setShowNew(false);
    setUploadErr(null);
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || !selectedThread || !replyBody.trim()) return;
    addThreadMessage({
      threadId: selectedThread.id,
      partnerId,
      topic: selectedThread.topic,
      fromPartner: true,
      body: replyBody.trim(),
      attachments: replyAttachments.map((id) => ({ evidenceId: id })),
    });
    setReplyBody('');
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
      <div className="rounded-xl border border-fuchsia-500/20 bg-gradient-to-b from-fuchsia-500/[0.06] to-[#0a0f0d] p-3 mt-2 max-h-52 overflow-y-auto">
        <input
          value={emojiQuery}
          onChange={(e) => setEmojiQuery(e.target.value)}
          placeholder="Search emojis…"
          className="w-full mb-2 bg-fc-input border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs"
        />
        {!emojiQuery &&
          PREMIUM_EMOJI_CATEGORIES.map((cat) => (
            <div key={cat.label} className="mb-3">
              <span className="text-[9px] uppercase tracking-widest text-fuchsia-300/80 font-black">{cat.label}</span>
              <div className="grid grid-cols-10 gap-0.5 mt-1">
                {cat.emojis.map((em, idx) => (
                  <button
                    key={`${cat.label}_${em}_${idx}`}
                    type="button"
                    onClick={() => insertAtCursor(mode, `${em} `)}
                    className="w-8 h-8 rounded-lg hover:bg-fuchsia-500/15 text-lg transition-all hover:scale-110"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          ))}
        <div className="flex gap-1 flex-wrap mb-2">
          {EMOJI_CATEGORIES.slice(0, 4).map((cat) => (
            <span key={cat.label} className="text-[9px] uppercase text-white/40 w-full mt-1">
              {cat.label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-1">
          {(emojiQuery ? EMOJI_LIST.filter((x) => x.includes(emojiQuery)) : EMOJI_LIST)
            .slice(0, emojiQuery ? 120 : 72)
            .map((em, idx) => (
              <button
                key={`${em}_${idx}`}
                type="button"
                onClick={() => insertAtCursor(mode, `${em} `)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-lg"
              >
                {em}
              </button>
            ))}
        </div>
      </div>
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
                setUploadErr(null);
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
              setUploadErr(null);
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
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEmojiOpen((p) => (p === 'new' ? null : 'new'))} className="px-2 py-1 rounded-lg border border-white/[0.08] text-xs text-white/70">
                <Smile size={12} className="inline mr-1" /> Emoji
              </button>
              {gifsEnabled && (
                <button type="button" onClick={() => setGifOpen((p) => (p === 'new' ? null : 'new'))} className="px-2 py-1 rounded-lg border border-white/[0.08] text-xs text-white/70">
                  GIF
                </button>
              )}
              <label className="px-2 py-1 rounded-lg border border-white/[0.08] text-xs text-white/70 cursor-pointer">
                <UploadCloud size={12} className="inline mr-1" /> {uploadBusy ? '…' : 'File'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadFile(f, 'new');
                    e.currentTarget.value = '';
                  }}
                />
              </label>
              <button type="submit" disabled={!newBody.trim() || selectedContactIds.length === 0} className={`ml-auto ${FINELY_OS_PRIMARY_BTN} !py-2 !px-4`}>
                Send
              </button>
            </div>
            <EmojiPicker mode="new" />
            {uploadErr ? <div className="text-xs text-red-200">{uploadErr}</div> : null}
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
                    {m.fromPartner ? 'You' : 'Finely team'} • {fmtWhen(m.createdAt)}
                  </div>
                  <MessageBody text={m.body} />
                  {m.attachments?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.attachments.map((a) => {
                        const ev = evidenceById.get(a.evidenceId);
                        return ev ? <AttachmentChip key={a.evidenceId} item={ev} /> : null;
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedThread && (
          <form onSubmit={handleReply} className="border-t border-white/[0.08] p-3 space-y-2 bg-[#070b09]/95 shrink-0">
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
            <textarea
              ref={replyRef}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Reply with emojis, files, or GIFs…"
              rows={compact ? 2 : 3}
              className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm resize-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setEmojiOpen((p) => (p === 'reply' ? null : 'reply'))} className="p-2 rounded-xl border border-white/[0.08] text-white/70">
                <Smile size={14} />
              </button>
              {gifsEnabled && (
                <button type="button" onClick={() => setGifOpen((p) => (p === 'reply' ? null : 'reply'))} className="p-2 rounded-xl border border-white/[0.08] text-white/70">
                  GIF
                </button>
              )}
              <label className="p-2 rounded-xl border border-white/[0.08] text-white/70 cursor-pointer">
                <UploadCloud size={14} />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadFile(f, 'reply');
                    e.currentTarget.value = '';
                  }}
                />
              </label>
              {evidence.slice(0, VAULT_ATTACH_LIMIT).map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => toggleAttach(ev.id, 'reply')}
                  className={`px-2 py-1 rounded-lg text-[10px] border ${replyAttachments.includes(ev.id) ? 'border-fuchsia-500/50 bg-fuchsia-500/15' : 'border-white/[0.08] text-white/50'}`}
                >
                  📎 {ev.filename.slice(0, 12)}
                </button>
              ))}
              <button
                type="submit"
                disabled={!replyBody.trim()}
                className={`ml-auto ${FINELY_OS_PRIMARY_BTN} !py-2 !px-4`}
              >
                <Send size={14} /> Send
              </button>
            </div>
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
