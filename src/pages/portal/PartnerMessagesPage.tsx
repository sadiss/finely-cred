import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Mail, MessageSquareText, Paperclip, Send, Smile, Sparkles, UploadCloud, X } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { listEvidenceByPartner, upsertEvidence } from '../../data/evidenceRepo';
import { createTask } from '../../data/tasksRepo';
import { addThreadMessage, createThread, listMessagesByThread, listThreadsByPartner, setThreadStatus } from '../../data/supportRepo';
import type { SupportThreadStatus, SupportTopic } from '../../domain/support';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { getBlobStore } from '../../storage/getBlobStore';
import { newId } from '../../utils/ids';
import type { EvidenceItem } from '../../domain/evidence';
import { EMOJI_LIST } from '../../components/chat/emojiData';
import { callAiGateway } from '../../lib/aiClient';
import { extractFirstJsonObject } from '../../utils/jsonExtract';
import { getChatSettings } from '../../data/settingsRepo';
import { searchTenorGifs, type TenorGif } from '../../lib/tenorClient';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { openUrlInNewTab } from '../../utils/download';

const blobStore = getBlobStore();

const TOPICS: { value: SupportTopic; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'billing', label: 'Billing' },
  { value: 'disputes', label: 'Disputes & reports' },
  { value: 'documents', label: 'Documents & uploads' },
  { value: 'debt_summons', label: 'Debt & summons' },
  { value: 'identity_theft', label: 'Identity theft' },
  { value: 'business', label: 'Business portal' },
  { value: 'au', label: 'Tradelines / AU' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS: { value: SupportThreadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'waiting_on_team', label: 'Waiting on team' },
  { value: 'waiting_on_partner', label: 'Waiting on partner' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function AttachmentPreviewCard({ item }: { item: EvidenceItem }) {
  const [url, setUrl] = useState<string | null>(null);
  const revokeRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getBlobUrl(item.blobRef, { mimeType: item.mimeType });
        if (!alive) return;
        revokeRef.current?.();
        revokeRef.current = res?.revoke ?? null;
        setUrl(res?.url ?? null);
      } catch {
        setUrl(null);
      }
    })();
    return () => {
      alive = false;
      revokeRef.current?.();
      revokeRef.current = null;
    };
  }, [item.blobRef, item.mimeType]);

  const isImg = item.mimeType.startsWith('image/');
  const isVid = item.mimeType.startsWith('video/');

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-white/80 text-sm truncate">{item.filename}</div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">{item.mimeType}</div>
      {url && isImg && (
        <a href={url} target="_blank" rel="noreferrer" className="block mt-3 rounded-xl overflow-hidden border border-white/10">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={url} className="w-full h-40 object-cover bg-black/30" />
        </a>
      )}
      {url && isVid && (
        <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-black/30">
          <video src={url} controls className="w-full h-40 object-cover" />
        </div>
      )}
      {(!url || (!isImg && !isVid)) && (
        <button
          type="button"
          onClick={async () => {
            const res = await getBlobUrl(item.blobRef, { mimeType: item.mimeType });
            if (!res?.url) return;
            openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
          }}
          className="mt-3 inline-flex items-center justify-center w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.04] text-white/70 text-[10px] font-black uppercase tracking-widest transition-all"
        >
          Open
        </button>
      )}
    </div>
  );
}

function MessageBody({ text }: { text: string }) {
  const lines = String(text ?? '').split('\n');
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const isGifUrl = (u: string) => /\.(gif)(\?.*)?$/i.test(u) || (u.includes('tenor') && u.includes('.gif'));

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const parts = line.split(urlRe).filter((p) => p !== '');
        const urls = (line.match(urlRe) ?? []).slice(0, 3);
        return (
          <div key={idx} className="space-y-2">
            <div className="text-white/80 text-sm whitespace-pre-wrap break-words">
              {parts.map((p, i) => {
                const isUrl = /^https?:\/\//.test(p);
                return isUrl ? (
                  <a key={i} href={p} target="_blank" rel="noreferrer" className="text-amber-300 underline">
                    {p}
                  </a>
                ) : (
                  <span key={i}>{p}</span>
                );
              })}
            </div>
            {urls.filter(isGifUrl).map((u) => (
              <a key={u} href={u} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img
                  src={u}
                  className="max-w-[360px] w-full rounded-xl border border-white/10 bg-black/30"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function PartnerMessagesPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [storeVersion, setStoreVersion] = useState(0);
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const threads = useMemo(() => (partner ? listThreadsByPartner(partner.id) : []), [partner, storeVersion]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const selectedThread = useMemo(
    () => (selectedThreadId ? threads.find((t) => t.id === selectedThreadId) ?? null : threads[0] ?? null),
    [selectedThreadId, threads],
  );
  const messages = useMemo(() => (selectedThread ? listMessagesByThread(selectedThread.id) : []), [selectedThread, storeVersion]);
  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner, storeVersion]);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const [newTopic, setNewTopic] = useState<SupportTopic>('general');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newAttachments, setNewAttachments] = useState<string[]>([]);
  const [showAllVaultAttachments, setShowAllVaultAttachments] = useState(false);

  const [replyBody, setReplyBody] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);

  const [emojiOpen, setEmojiOpen] = useState<null | 'new' | 'reply'>(null);
  const [emojiQuery, setEmojiQuery] = useState('');
  const [gifOpen, setGifOpen] = useState<null | 'new' | 'reply'>(null);
  const [gifQuery, setGifQuery] = useState('');
  const [gifBusy, setGifBusy] = useState(false);
  const [gifErr, setGifErr] = useState<string | null>(null);
  const [gifResults, setGifResults] = useState<TenorGif[]>([]);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);
  const newRef = useRef<HTMLTextAreaElement | null>(null);

  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; body: string }>>([]);

  const tenorApiKey = useMemo(() => getChatSettings().tenorApiKey ?? '', []);
  const gifsEnabled = Boolean(tenorApiKey);

  const MESSAGES_LIMIT = 12;
  const VAULT_ATTACH_LIMIT = 14;

  useEffect(() => {
    if (!gifOpen) return;
    const q = gifQuery.trim();
    if (!q || !gifsEnabled) {
      setGifResults([]);
      setGifErr(null);
      return;
    }
    setGifErr(null);
    setGifBusy(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await searchTenorGifs({ apiKey: tenorApiKey, query: q, limit: 18 });
        setGifResults(res);
      } catch (e: any) {
        setGifErr(e?.message || 'GIF search failed.');
      } finally {
        setGifBusy(false);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [gifOpen, gifQuery, gifsEnabled, tenorApiKey]);

  const toggleAttach = (id: string, mode: 'new' | 'reply') => {
    const setter = mode === 'new' ? setNewAttachments : setReplyAttachments;
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
    const next = `${el.value.slice(0, start)}${text}${el.value.slice(end)}`;
    setter(next);
    window.setTimeout(() => {
      try {
        el.focus();
        const pos = start + text.length;
        el.setSelectionRange(pos, pos);
      } catch {
        // ignore
      }
    }, 0);
  };

  const uploadEvidenceFromChat = async (file: File, mode: 'new' | 'reply') => {
    if (!partner) return;
    setUploadErr(null);
    setUploadBusy(true);
    try {
      const type = file.type || 'application/octet-stream';
      const { ref } = await blobStore.put(file, {
        partnerId: partner.id,
        caption: `Chat attachment (${mode})`,
        scanMode: false,
        kind: 'evidence',
      });
      const item: EvidenceItem = {
        id: newId('evidence'),
        partnerId: partner.id,
        type: 'upload',
        source: 'upload',
        caption: `Chat attachment (${mode})`,
        filename: file.name || 'attachment',
        mimeType: type,
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
    if (!partner || !selectedThread) return;
    setAiErr(null);
    setAiBusy(true);
    try {
      const recent = listMessagesByThread(selectedThread.id).slice(-8);
      const transcript = recent
        .map((m) => `${m.fromPartner ? 'Partner' : 'Support'}: ${m.body}`)
        .join('\n');
      const res = await callAiGateway({
        taskType: 'support.reply_suggestions',
        providerHint: 'openai',
        responseFormat: 'json',
        context: { topic: selectedThread.topic, threadId: selectedThread.id, partnerId: partner.id },
        messages: [
          {
            role: 'system',
            content:
              'You are an expert support agent for a credit repair/credit building platform. Return JSON only: { "suggestions": [ { "title": string, "body": string } ] }. Provide 5 suggestions. Keep each body under 900 characters. Be compliant and avoid legal advice language.',
          },
          { role: 'user', content: `Thread subject: ${selectedThread.subject}\nTopic: ${selectedThread.topic}\n\nRecent messages:\n${transcript}` },
        ],
      });
      const obj = extractFirstJsonObject(res.text) as any;
      const suggestions = Array.isArray(obj?.suggestions) ? obj.suggestions : [];
      const cleaned = suggestions
        .map((s: any) => ({ title: `${s?.title ?? ''}`.trim(), body: `${s?.body ?? ''}`.trim() }))
        .filter((s: any) => s.title && s.body)
        .slice(0, 8);
      setAiSuggestions(cleaned);
    } catch (e: any) {
      setAiErr(e?.message || 'AI suggestions failed.');
    } finally {
      setAiBusy(false);
    }
  };

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    if (!newSubject.trim() || !newBody.trim()) return;
    const { thread } = createThread({
      partnerId: partner.id,
      topic: newTopic,
      subject: newSubject.trim(),
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
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner || !selectedThread) return;
    if (!replyBody.trim()) return;
    addThreadMessage({
      threadId: selectedThread.id,
      partnerId: partner.id,
      topic: selectedThread.topic,
      fromPartner: true,
      body: replyBody.trim(),
      attachments: replyAttachments.map((id) => ({ evidenceId: id })),
    });
    setReplyBody('');
    setReplyAttachments([]);
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  const createFollowUpTask = () => {
    if (!partner || !selectedThread) return;
    const kind =
      selectedThread.topic === 'documents'
        ? 'upload_document'
        : selectedThread.topic === 'disputes'
          ? 'follow_up'
          : selectedThread.topic === 'billing'
            ? 'general'
            : 'general';
    createTask({
      partnerId: partner.id,
      title: `Support follow-up: ${selectedThread.subject}`,
      kind,
      status: 'pending',
      notes: `Created from Support thread ${selectedThread.id} (${selectedThread.topic}).`,
    });
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <PageShell
      badge="Partner Portal"
      title="Messages & Support"
      subtitle="Threaded support inbox with attachments. Keep everything in one place and convert requests into tasks."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found for this account. If you're an admin, use Partner Management to pick a partner.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.messages]}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => navigate('/portal/dashboard')}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft size={16} /> Partner Dashboard
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft size={16} /> Finely Cred
              </button>
            </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-amber-400">
                  <MessageSquareText size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Threads</span>
                </div>
                {sent && <span className="text-amber-300 text-xs">Saved</span>}
              </div>
              <div className="mt-4 space-y-2">
                {threads.length === 0 ? (
                  <div className="text-white/60 text-sm">No threads yet. Create one to start.</div>
                ) : (
                  threads.map((t) => {
                    const active = selectedThread?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedThreadId(t.id)}
                        className={`w-full text-left rounded-2xl border p-4 transition-all ${
                          active ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{t.subject}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                              {TOPICS.find((x) => x.value === t.topic)?.label ?? t.topic} • {t.status}
                            </div>
                          </div>
                          <div className="text-[10px] text-white/40 font-mono">{fmtWhen(t.lastMessageAt)}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Send size={18} className="text-amber-400" />
                  Start a new thread
                </h2>
                <form onSubmit={handleCreateThread} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Topic</label>
                      <select
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value as SupportTopic)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                      >
                        {TOPICS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Subject</label>
                      <input
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="Brief subject"
                        maxLength={120}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Message</label>
                    <textarea
                      value={newBody}
                      onChange={(e) => setNewBody(e.target.value)}
                      ref={newRef}
                      placeholder="Describe what you need. Attach relevant documents below."
                      rows={4}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEmojiOpen((p) => (p === 'new' ? null : 'new'))}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-white/70 text-[10px] font-black uppercase tracking-widest transition-all"
                          title="Insert emoji"
                        >
                          <Smile size={14} /> Emoji
                        </button>
                        {gifsEnabled && (
                          <button
                            type="button"
                            onClick={() => setGifOpen((p) => (p === 'new' ? null : 'new'))}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-white/70 text-[10px] font-black uppercase tracking-widest transition-all"
                            title="Search GIFs"
                          >
                            GIF
                          </button>
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-white/70 text-[10px] font-black uppercase tracking-widest transition-all">
                          <UploadCloud size={14} />
                          {uploadBusy ? 'Uploading…' : 'Upload file'}
                          <input
                            type="file"
                            className="hidden"
                            disabled={uploadBusy}
                            accept="image/*,video/*,application/pdf"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void uploadEvidenceFromChat(f, 'new');
                              e.currentTarget.value = '';
                            }}
                          />
                        </label>
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40">
                        attachments: <span className="text-white/70 font-mono">{newAttachments.length}</span>
                      </div>
                    </div>
                  </div>

                  {emojiOpen === 'new' && (
                    <div className="rounded-2xl border border-white/10 bg-[#0a0f0d]/95 backdrop-blur-xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Emoji picker</div>
                        <button
                          type="button"
                          onClick={() => setEmojiOpen(null)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 transition-all"
                          title="Close"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <input
                        value={emojiQuery}
                        onChange={(e) => setEmojiQuery(e.target.value)}
                        placeholder="Search (visual)…"
                        className="mt-3 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                      />
                      <div className="mt-3 grid grid-cols-10 sm:grid-cols-12 md:grid-cols-14 gap-2">
                        {EMOJI_LIST.filter((x) => (emojiQuery.trim() ? x.includes(emojiQuery.trim()) : true))
                          .slice(0, 140)
                          .map((e, idx) => (
                            <button
                              key={`${e}_${idx}`}
                              type="button"
                              onClick={() => insertAtCursor('new', `${e} `)}
                              className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-lg"
                              title={e}
                            >
                              {e}
                            </button>
                          ))}
                      </div>
                      <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">
                        Showing up to 140 (search to refine)
                      </div>
                    </div>
                  )}

                  {gifOpen === 'new' && (
                    <div className="rounded-2xl border border-white/10 bg-[#0a0f0d]/95 backdrop-blur-xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/60">GIF search</div>
                        <button
                          type="button"
                          onClick={() => setGifOpen(null)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 transition-all"
                          title="Close"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <input
                        value={gifQuery}
                        onChange={(e) => setGifQuery(e.target.value)}
                        placeholder="Search Tenor…"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                      />
                      {gifErr && <div className="text-rose-200 text-sm">{gifErr}</div>}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {gifBusy && gifResults.length === 0 ? (
                          <div className="col-span-full text-white/50 text-sm">Searching…</div>
                        ) : (
                          gifResults.slice(0, 24).map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                insertAtCursor('new', `${g.url}\n`);
                                setGifOpen(null);
                                setGifQuery('');
                                setGifResults([]);
                              }}
                              className="rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] overflow-hidden"
                              title={g.title || 'GIF'}
                            >
                              {/* eslint-disable-next-line jsx-a11y/alt-text */}
                              <img src={g.previewUrl || g.url} className="w-full h-20 object-cover bg-black/30" loading="lazy" />
                            </button>
                          ))
                        )}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Powered by Tenor</div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 text-white/70">
                        <Paperclip size={16} className="text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Attach from Documents Vault</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40">
                        selected: <span className="text-white/70 font-mono">{newAttachments.length}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {evidence.length} file{evidence.length === 1 ? '' : 's'}
                      </div>
                      {evidence.length > VAULT_ATTACH_LIMIT ? (
                        <button
                          type="button"
                          onClick={() => setShowAllVaultAttachments((v) => !v)}
                          className="fc-action-link fc-focus-ring"
                          title={showAllVaultAttachments ? 'Show fewer files' : 'Show all files'}
                        >
                          {showAllVaultAttachments ? 'Show less' : `Show all (${evidence.length})`}
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-3 grid md:grid-cols-2 gap-2">
                      {evidence.length === 0 ? (
                        <div className="text-white/50 text-sm">
                          No documents yet. Upload in{' '}
                          <button type="button" onClick={() => navigate('/portal/documents')} className="text-amber-300 underline">
                            Documents Vault
                          </button>
                          .
                        </div>
                      ) : (
                        (showAllVaultAttachments ? evidence.slice(0, 200) : evidence.slice(0, VAULT_ATTACH_LIMIT)).map((ev) => (
                          <label key={ev.id} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newAttachments.includes(ev.id)}
                              onChange={() => toggleAttach(ev.id, 'new')}
                              className="mt-1"
                            />
                            <div className="min-w-0">
                              <div className="text-white/80 text-sm truncate">{ev.filename}</div>
                              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                                {ev.mimeType} • {fmtWhen(ev.createdAt)}
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all"
                      disabled={!newSubject.trim() || !newBody.trim()}
                    >
                      <Send size={14} /> Send
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/portal/documents')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    >
                      Open Documents Vault <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">{selectedThread?.subject ?? 'Select a thread'}</div>
                    {selectedThread && (
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                        {TOPICS.find((x) => x.value === selectedThread.topic)?.label ?? selectedThread.topic} • thread_id:{' '}
                        <span className="font-mono">{selectedThread.id}</span>
                      </div>
                    )}
                  </div>
                  {selectedThread && (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedThread.status}
                        onChange={(e) => setThreadStatus(selectedThread.id, e.target.value as SupportThreadStatus)}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={createFollowUpTask}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all"
                      >
                        Create task <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {!selectedThread ? (
                  <div className="text-white/60 text-sm">Select a thread on the left to view messages and reply.</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">
                        Messages <span className="font-mono">({messages.length})</span>
                      </div>
                      {messages.length > MESSAGES_LIMIT ? (
                        <button
                          type="button"
                          onClick={() => setShowAllMessages((v) => !v)}
                          className="fc-action-link fc-focus-ring"
                          title={showAllMessages ? 'Show fewer messages' : 'Show all messages'}
                        >
                          {showAllMessages ? 'Show less' : `Show all (${messages.length})`}
                        </button>
                      ) : null}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-white/50 text-sm">No messages yet.</div>
                      ) : (
                        (showAllMessages ? messages : messages.slice(-MESSAGES_LIMIT)).map((m) => (
                          <div key={m.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                            <div className="text-[10px] uppercase tracking-widest text-white/40">
                              {m.fromPartner ? 'You' : 'Support'} • {fmtWhen(m.createdAt)}
                            </div>
                            <div className="mt-2">
                              <MessageBody text={m.body} />
                            </div>
                            {(m.attachments?.length ?? 0) > 0 && (
                              <div className="mt-3">
                                <div className="text-[10px] uppercase tracking-widest text-white/40">Attachments</div>
                                <div className="mt-2 grid md:grid-cols-2 gap-2">
                                  {m.attachments!.map((a) => {
                                    const ev = evidence.find((e) => e.id === a.evidenceId) ?? null;
                                    if (!ev) return null;
                                    return <AttachmentPreviewCard key={a.evidenceId} item={ev} />;
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleReply} className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 text-amber-400">
                          <Sparkles size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">AI</span>
                        </div>
                        <button
                          type="button"
                          onClick={runAiSuggestions}
                          disabled={aiBusy}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/15 transition-all disabled:opacity-60"
                          title="Generate reply suggestions"
                        >
                          <Sparkles size={14} /> {aiBusy ? 'Thinking…' : 'Suggestions'}
                        </button>
                      </div>
                      {aiErr && (
                        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                          {aiErr}
                        </div>
                      )}
                      {aiSuggestions.length > 0 && (
                        <div className="grid md:grid-cols-2 gap-2">
                          {aiSuggestions.map((s, idx) => (
                            <button
                              key={`${idx}_${s.title}`}
                              type="button"
                              onClick={() => setReplyBody(s.body)}
                              className="text-left rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-4 transition-all"
                              title="Click to insert"
                            >
                              <div className="text-white font-semibold">{s.title}</div>
                              <div className="mt-2 text-white/60 text-sm line-clamp-3 whitespace-pre-wrap">{s.body}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Reply</label>
                        <textarea
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          ref={replyRef}
                          rows={3}
                          placeholder="Reply to support…"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEmojiOpen((p) => (p === 'reply' ? null : 'reply'))}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-white/70 text-[10px] font-black uppercase tracking-widest transition-all"
                              title="Insert emoji"
                            >
                              <Smile size={14} /> Emoji
                            </button>
                            {gifsEnabled && (
                              <button
                                type="button"
                                onClick={() => setGifOpen((p) => (p === 'reply' ? null : 'reply'))}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-white/70 text-[10px] font-black uppercase tracking-widest transition-all"
                                title="Search GIFs"
                              >
                                GIF
                              </button>
                            )}
                            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-white/70 text-[10px] font-black uppercase tracking-widest transition-all">
                              <UploadCloud size={14} />
                              {uploadBusy ? 'Uploading…' : 'Upload file'}
                              <input
                                type="file"
                                className="hidden"
                                disabled={uploadBusy}
                                accept="image/*,video/*,application/pdf"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) void uploadEvidenceFromChat(f, 'reply');
                                  e.currentTarget.value = '';
                                }}
                              />
                            </label>
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-white/40">
                            selected: <span className="text-white/70 font-mono">{replyAttachments.length}</span>
                          </div>
                        </div>
                      </div>

                      {uploadErr && (
                        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                          {uploadErr}
                        </div>
                      )}

                      {emojiOpen === 'reply' && (
                        <div className="rounded-2xl border border-white/10 bg-[#0a0f0d]/95 backdrop-blur-xl p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Emoji picker</div>
                            <button
                              type="button"
                              onClick={() => setEmojiOpen(null)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 transition-all"
                              title="Close"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <input
                            value={emojiQuery}
                            onChange={(e) => setEmojiQuery(e.target.value)}
                            placeholder="Search (visual)…"
                            className="mt-3 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                          />
                          <div className="mt-3 grid grid-cols-10 sm:grid-cols-12 md:grid-cols-14 gap-2">
                            {EMOJI_LIST.filter((x) => (emojiQuery.trim() ? x.includes(emojiQuery.trim()) : true))
                              .slice(0, 140)
                              .map((e, idx) => (
                                <button
                                  key={`${e}_${idx}`}
                                  type="button"
                                  onClick={() => insertAtCursor('reply', `${e} `)}
                                  className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-lg"
                                  title={e}
                                >
                                  {e}
                                </button>
                              ))}
                          </div>
                          <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">
                            Showing up to 140 (search to refine)
                          </div>
                        </div>
                      )}

                      {gifOpen === 'reply' && (
                        <div className="rounded-2xl border border-white/10 bg-[#0a0f0d]/95 backdrop-blur-xl p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/60">GIF search</div>
                            <button
                              type="button"
                              onClick={() => setGifOpen(null)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 transition-all"
                              title="Close"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <input
                            value={gifQuery}
                            onChange={(e) => setGifQuery(e.target.value)}
                            placeholder="Search Tenor…"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                          />
                          {gifErr && <div className="text-rose-200 text-sm">{gifErr}</div>}
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {gifBusy && gifResults.length === 0 ? (
                              <div className="col-span-full text-white/50 text-sm">Searching…</div>
                            ) : (
                              gifResults.slice(0, 24).map((g) => (
                                <button
                                  key={g.id}
                                  type="button"
                                  onClick={() => {
                                    insertAtCursor('reply', `${g.url}\n`);
                                    setGifOpen(null);
                                    setGifQuery('');
                                    setGifResults([]);
                                  }}
                                  className="rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] overflow-hidden"
                                  title={g.title || 'GIF'}
                                >
                                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                  <img src={g.previewUrl || g.url} className="w-full h-20 object-cover bg-black/30" loading="lazy" />
                                </button>
                              ))
                            )}
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Powered by Tenor</div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase tracking-widest text-white/40">Attach</span>
                          {evidence.slice(0, 8).map((ev) => (
                            <button
                              key={ev.id}
                              type="button"
                              onClick={() => toggleAttach(ev.id, 'reply')}
                              className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                replyAttachments.includes(ev.id)
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                                  : 'bg-white/[0.02] text-white/60 border-white/10 hover:bg-white/5 hover:text-white'
                              }`}
                              title={ev.filename}
                            >
                              <Paperclip size={12} className="inline mr-2" />
                              {ev.filename.slice(0, 10)}
                            </button>
                          ))}
                        </div>

                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all"
                          disabled={!replyBody.trim()}
                        >
                          <Send size={14} /> Send reply
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4 flex items-start gap-3">
            <Mail size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white/80 text-sm font-medium">Email for attachments</p>
              <p className="text-white/50 text-sm mt-1">
                For bureau letters or large files, email{' '}
                <a href="mailto:partnersupport@finelycred.com" className="text-amber-400 underline">partnersupport@finelycred.com</a>
                {' '}and reference your partner account. Upload docs to Documents Vault when possible.
              </p>
            </div>
          </div>
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
