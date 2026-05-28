import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, MessageSquareText, Search, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listAllThreads, listMessagesByThread, addThreadMessage, setThreadStatus } from '../../data/supportRepo';
import { listPartnersByTenant, getPartner } from '../../data/partnersRepo';
import { createTask } from '../../data/tasksRepo';
import type { SupportThreadStatus, SupportTopic } from '../../domain/support';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';

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
                <img src={u} className="max-w-[360px] w-full rounded-xl border border-white/10 bg-black/30" loading="lazy" />
              </a>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminSupportInboxPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const [partnerIndex, setPartnerIndex] = useState<Map<string, import('../../domain/partners').Partner>>(new Map());
  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) { setPartnerIndex(new Map()); return; }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId })
      .then((allowed) => listPartnersByTenant(tenantId).then((all) => new Map(all.filter((p) => allowed.has(p.id)).map((p) => [p.id, p]))))
      .then(setPartnerIndex);
  }, [auth.user, version]);
  const partnerIds = useMemo(() => new Set(Array.from(partnerIndex.keys())), [partnerIndex]);

  const threads = useMemo(() => {
    const all = listAllThreads();
    const query = q.trim().toLowerCase();
    const scoped = all.filter((t) => partnerIds.has(t.partnerId));
    if (!query) return scoped;
    return scoped.filter((t) => {
      const p = partnerIndex.get(t.partnerId);
      const hay = `${t.subject} ${t.topic} ${t.status} ${p?.profile.fullName ?? ''} ${p?.profile.email ?? ''}`.toLowerCase();
      return hay.includes(query);
    });
  }, [partnerIds, partnerIndex, q]);

  const selected = useMemo(
    () => (selectedId ? threads.find((t) => t.id === selectedId) ?? null : threads[0] ?? null),
    [selectedId, threads],
  );

  const messages = useMemo(() => (selected ? listMessagesByThread(selected.id) : []), [selected]);

  const [partner, setPartner] = useState<import('../../domain/partners').Partner | null>(null);
  useEffect(() => {
    if (!selected) { setPartner(null); return; }
    getPartner(selected.partnerId).then(setPartner);
  }, [selected?.id]);

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !partner) return;
    if (!reply.trim()) return;
    addThreadMessage({
      threadId: selected.id,
      partnerId: partner.id,
      topic: selected.topic as SupportTopic,
      fromPartner: false,
      body: reply.trim(),
    });
    setReply('');
  };

  const createTaskFromThread = () => {
    if (!selected || !partner) return;
    const kind = selected.topic === 'documents' ? 'upload_document' : selected.topic === 'disputes' ? 'follow_up' : 'general';
    createTask({
      partnerId: partner.id,
      title: `Support workflow: ${selected.subject}`,
      kind,
      status: 'pending',
      notes: `Created from Support thread ${selected.id}.`,
    });
  };

  return (
    <PageShell badge="Admin" title="Support Inbox" subtitle="All partner support threads. Reply, triage, and convert into tasks.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">support_inbox</div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5">
            <div className="flex items-center gap-2 text-white/70">
              <Search size={16} className="text-white/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search partner, subject, status…"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="mt-4 space-y-2">
              {threads.length === 0 ? (
                <div className="text-white/60 text-sm">No threads yet.</div>
              ) : (
                threads.map((t) => {
                  const active = selected?.id === t.id;
                  const p = partnerIndex.get(t.partnerId);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        active ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="text-white font-semibold truncate">{t.subject}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 truncate">
                        {(p?.profile.fullName ?? t.partnerId)} • {t.topic} • {t.status}
                      </div>
                      <div className="mt-1 text-[10px] text-white/40 font-mono">{fmtWhen(t.lastMessageAt)}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            {!selected ? (
              <div className="text-white/60 text-sm">Select a thread to view.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 text-amber-400">
                      <MessageSquareText size={18} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Thread</span>
                    </div>
                    <div className="mt-2 text-white font-semibold truncate">{selected.subject}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                      partner:{' '}
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/partners/${selected.partnerId}`)}
                        className="text-amber-300 underline"
                      >
                        {partner?.profile.fullName ?? selected.partnerId}
                      </button>{' '}
                      • topic: {selected.topic} • id: <span className="font-mono">{selected.id}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selected.status}
                      onChange={(e) => setThreadStatus(selected.id, e.target.value as SupportThreadStatus)}
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
                      onClick={createTaskFromThread}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all"
                    >
                      Create task <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 max-h-[340px] overflow-y-auto space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">
                        {m.fromPartner ? 'Partner' : 'Support'} • {fmtWhen(m.createdAt)}
                      </div>
                      <div className="mt-2">
                        <MessageBody text={m.body} />
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendReply} className="space-y-3">
                  <label className="block text-[10px] uppercase tracking-widest text-white/50">Reply</label>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
                    placeholder="Write a reply (internal support)…"
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send size={14} /> Send reply
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

