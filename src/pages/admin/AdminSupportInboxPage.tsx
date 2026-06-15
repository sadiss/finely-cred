import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, MessageSquareText, Search, Send, Share2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listAllThreads, listMessagesByThread, addThreadMessage, setThreadStatus } from '../../data/supportRepo';
import { computeSupportSlaStatus, defaultPersonaForSupportTopic } from '../../lib/supportInboxOs';
import {
  isMetaThreadUiId,
  listMetaInboxThreadSummaries,
  listMetaMessagesByThreadId,
  replyMetaInboxThread,
  type MetaInboxThreadSummary,
} from '../../lib/socialHubCommsBridge';
import { listPartnersByTenant, getPartner } from '../../data/partnersRepo';
import { createTask } from '../../data/tasksRepo';
import type { SupportThreadStatus, SupportTopic } from '../../domain/support';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_ACCENT_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsInlineListItem,
  finelyOsListItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

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
            <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap break-words`}>
              {parts.map((p, i) => {
                const isUrl = /^https?:\/\//.test(p);
                return isUrl ? (
                  <a key={i} href={p} target="_blank" rel="noreferrer" className={FINELY_OS_ENTITY_ACCENT_LINK}>
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
                <img src={u} className="max-w-[360px] w-full fc-light-glass-panel fc-light-chrome-panel rounded-xl" loading="lazy" />
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
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const sourceFilter = (searchParams.get('source') as 'all' | 'portal' | 'meta' | null) ?? 'all';

  const setSourceFilter = (next: 'all' | 'portal' | 'meta') => {
    const p = new URLSearchParams(searchParams);
    if (next === 'all') p.delete('source');
    else p.set('source', next);
    setSearchParams(p, { replace: true });
  };

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
  }, [partnerIds, partnerIndex, q, version]);

  const metaThreads = useMemo(() => {
    const all = listMetaInboxThreadSummaries();
    const query = q.trim().toLowerCase();
    if (!query) return all;
    return all.filter((t) => `${t.subject} ${t.preview} ${t.channel} ${t.threadId}`.toLowerCase().includes(query));
  }, [q, version]);

  type InboxRow =
    | { kind: 'portal'; id: string; at: string; portal: (typeof threads)[number] }
    | { kind: 'meta'; id: string; at: string; meta: MetaInboxThreadSummary };

  const inboxRows = useMemo((): InboxRow[] => {
    const rows: InboxRow[] = [];
    if (sourceFilter !== 'meta') {
      for (const t of threads) rows.push({ kind: 'portal', id: t.id, at: t.lastMessageAt, portal: t });
    }
    if (sourceFilter !== 'portal') {
      for (const m of metaThreads) rows.push({ kind: 'meta', id: m.id, at: m.lastMessageAt, meta: m });
    }
    return rows.sort((a, b) => b.at.localeCompare(a.at));
  }, [threads, metaThreads, sourceFilter]);

  const selectedMeta = useMemo(() => {
    if (!selectedId || !isMetaThreadUiId(selectedId)) return null;
    return metaThreads.find((t) => t.id === selectedId) ?? null;
  }, [selectedId, metaThreads]);

  const selectedPortal = useMemo(() => {
    if (!selectedId || isMetaThreadUiId(selectedId)) return null;
    return threads.find((t) => t.id === selectedId) ?? null;
  }, [selectedId, threads]);

  const messages = useMemo(() => (selectedPortal ? listMessagesByThread(selectedPortal.id) : []), [selectedPortal, version]);

  const metaMessages = useMemo(() => {
    if (!selectedMeta) return [];
    return listMetaMessagesByThreadId(selectedMeta.threadId);
  }, [selectedMeta, version]);

  useEffect(() => {
    if (selectedId) return;
    const first = inboxRows[0];
    if (first) setSelectedId(first.id);
  }, [inboxRows, selectedId]);

  const [partner, setPartner] = useState<import('../../domain/partners').Partner | null>(null);
  useEffect(() => {
    if (!selectedPortal) { setPartner(null); return; }
    getPartner(selectedPortal.partnerId).then(setPartner);
  }, [selectedPortal?.id]);

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMeta) {
      if (!reply.trim()) return;
      replyMetaInboxThread({
        threadId: selectedMeta.threadId,
        text: reply.trim(),
        pageId: selectedMeta.pageId,
        channel: selectedMeta.channel,
      });
      setReply('');
      setVersion((v) => v + 1);
      return;
    }
    if (!selectedPortal || !partner) return;
    if (!reply.trim()) return;
    addThreadMessage({
      threadId: selectedPortal.id,
      partnerId: partner.id,
      topic: selectedPortal.topic as SupportTopic,
      fromPartner: false,
      body: reply.trim(),
    });
    setReply('');
  };

  const createTaskFromThread = () => {
    if (!selectedPortal || !partner) return;
    const kind = selectedPortal.topic === 'documents' ? 'upload_document' : selectedPortal.topic === 'disputes' ? 'follow_up' : 'general';
    createTask({
      partnerId: partner.id,
      title: `Support workflow: ${selectedPortal.subject}`,
      kind,
      status: 'pending',
      notes: `Created from Support thread ${selectedPortal.id}.`,
    });
  };

  return (
    <PageShell badge="Admin" title="Support Inbox" subtitle="Portal threads + Meta Messenger/Instagram — omnichannel comms hub.">
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>support_inbox</div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-4 ${finelyOsCatalogCard('amber')} !p-5`} data-fc-accent="amber">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-violet-400 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search partner, subject, status…"
                className={`${FINELY_OS_ENTITY_SELECT} text-sm py-2.5`}
              />
            </div>
            <div className={`${FINELY_OS_VIEW_TABS} mt-3`}>
              {(['all', 'portal', 'meta'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSourceFilter(f)}
                  className={finelyOsViewTab(sourceFilter === f, 'violet')}
                >
                  {f === 'all' ? 'All' : f === 'portal' ? 'Portal' : 'Meta'}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {inboxRows.length === 0 ? (
                <div className={FINELY_OS_ENTITY_BODY}>No threads yet.</div>
              ) : (
                inboxRows.map((row) => {
                  const active = selectedId === row.id;
                  if (row.kind === 'portal') {
                    const t = row.portal;
                    const p = partnerIndex.get(t.partnerId);
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setSelectedId(t.id)}
                        className={finelyOsListItem(active, 'amber')}
                      >
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{t.subject}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} truncate normal-case tracking-normal`}>
                          {(p?.profile.fullName ?? t.partnerId)} • {t.topic} • {t.status}
                          {(() => {
                            const sla = computeSupportSlaStatus(t);
                            return sla.tone !== 'ok' ? (
                              <span className={sla.tone === 'breached' ? ' text-rose-300' : ' text-amber-300'}>
                                {' '}
                                · {sla.label}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal text-[10px]`}>{fmtWhen(t.lastMessageAt)}</div>
                      </button>
                    );
                  }
                  const m = row.meta;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setSelectedId(m.id)}
                      className={finelyOsListItem(active, 'fuchsia')}
                    >
                      <div className={`${FINELY_OS_ENTITY_VALUE} truncate inline-flex items-center gap-1.5`}>
                        <Share2 size={12} className="text-sky-300 shrink-0" /> {m.subject}
                      </div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} truncate normal-case tracking-normal`}>
                        {m.preview} • {m.inboundCount} inbound
                      </div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal text-[10px]`}>{fmtWhen(m.lastMessageAt)}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className={`lg:col-span-8 ${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
            {!selectedPortal && !selectedMeta ? (
              <div className={FINELY_OS_ENTITY_BODY}>Select a thread to view.</div>
            ) : selectedMeta ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
                      <Share2 size={18} />
                      <span>Meta {selectedMeta.channel}</span>
                    </div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE} truncate`}>{selectedMeta.subject}</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                      thread: <span className="font-mono">{selectedMeta.threadId}</span> • page: {selectedMeta.pageId}
                    </div>
                  </div>
                  <button type="button" onClick={() => navigate('/admin/social?tab=inbox')} className={FINELY_OS_SECONDARY_BTN}>
                    Social Hub inbox
                  </button>
                </div>

                <FinelyOsPaginatedStack
                  items={metaMessages}
                  pageSize={8}
                  emptyMessage="No Meta messages in this thread yet."
                  renderItem={(m) => (
                    <div key={m.id} className={`${finelyOsInlineListItem()} p-4`}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>
                        {m.direction === 'inbound' ? 'Inbound' : 'Outbound'} • {fmtWhen(m.createdAt)}
                      </div>
                      <div className="mt-2">
                        <MessageBody text={m.text} />
                      </div>
                    </div>
                  )}
                />

                <form onSubmit={sendReply} className="space-y-3">
                  <label className={`block ${FINELY_OS_ENTITY_LABEL}`}>Reply (queued locally — live send via Meta API)</label>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    className={`${FINELY_OS_ENTITY_INPUT} resize-y`}
                    placeholder="Write a Meta reply…"
                  />
                  <button type="submit" disabled={!reply.trim()} className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}>
                    <Send size={14} /> Queue reply
                  </button>
                </form>
              </>
            ) : selectedPortal ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
                      <MessageSquareText size={18} />
                      <span>Thread</span>
                    </div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE} truncate`}>{selectedPortal.subject}</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                      partner:{' '}
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/partners/${selectedPortal.partnerId}`)}
                        className={FINELY_OS_ENTITY_ACCENT_LINK}
                      >
                        {partner?.profile.fullName ?? selectedPortal.partnerId}
                      </button>{' '}
                      • topic: {selectedPortal.topic} • persona:{' '}
                      {selectedPortal.assignedPersonaId ?? defaultPersonaForSupportTopic(selectedPortal.topic as SupportTopic)} • id:{' '}
                      <span className="font-mono">{selectedPortal.id}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedPortal.status}
                      onChange={(e) => setThreadStatus(selectedPortal.id, e.target.value as SupportThreadStatus)}
                      className={`${FINELY_OS_ENTITY_SELECT} text-[11px] py-2`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={createTaskFromThread} className={FINELY_OS_PRIMARY_BTN}>
                      Create task <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                <FinelyOsPaginatedStack
                  items={messages}
                  pageSize={8}
                  emptyMessage="No messages in this thread yet."
                  renderItem={(m) => (
                    <div key={m.id} className={`${finelyOsInlineListItem()} p-4`}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>
                        {m.fromPartner ? 'Partner' : 'Support'} • {fmtWhen(m.createdAt)}
                      </div>
                      <div className="mt-2">
                        <MessageBody text={m.body} />
                      </div>
                    </div>
                  )}
                />

                <form onSubmit={sendReply} className="space-y-3">
                  <label className={`block ${FINELY_OS_ENTITY_LABEL}`}>Reply</label>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    className={`${FINELY_OS_ENTITY_INPUT} resize-y`}
                    placeholder="Write a reply (internal support)…"
                  />
                  <button type="submit" disabled={!reply.trim()} className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}>
                    <Send size={14} /> Send reply
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}

