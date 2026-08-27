import React, { useMemo, useState } from 'react';
import { ExternalLink, Inbox, Mail, MessageSquare, Search, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listCommsSends } from '../../data/commsRepo';
import { listInboxMessages } from '../../data/socialHubRepo';
import type { CommsChannel } from '../../domain/comms';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';
import { StudioSection } from './StudioKpiCards';

const CHANNEL_ICON: Record<CommsChannel, React.ComponentType<{ size?: number; className?: string }>> = {
  email: Mail,
  sms: MessageSquare,
  portal: Inbox,
};

const PAGE_SIZE = 40;

export function CommsStudioInboxPanel() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState<CommsChannel | 'all' | 'meta'>('all');
  const [page, setPage] = useState(0);
  const sends = useMemo(() => {
    void version;
    return listCommsSends(500);
  }, [version]);
  const metaInbox = useMemo(() => {
    void version;
    return listInboxMessages();
  }, [version]);

  const unified = useMemo(() => {
    const metaRows = metaInbox.map((m) => ({
      id: `meta-${m.id}`,
      kind: 'meta' as const,
      channel: m.channel,
      subject: m.channel === 'instagram' ? 'Instagram DM' : 'Messenger thread',
      body: m.text,
      status: m.direction === 'inbound' ? 'inbound' : 'sent',
      createdAt: m.createdAt,
      partnerId: undefined as string | undefined,
      error: undefined as string | undefined,
      to: m.direction === 'inbound' ? 'Finely inbox' : m.pageId,
    }));
    const sendRows = sends.map((s) => ({
      id: s.id,
      kind: 'send' as const,
      channel: s.channel,
      subject: s.subject,
      body: s.body,
      status: s.status,
      createdAt: s.createdAt,
      partnerId: s.partnerId,
      error: s.error,
      to: s.to,
    }));
    return [...metaRows, ...sendRows].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [sends, metaInbox]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return unified.filter((s) => {
      if (channel === 'meta' && s.kind !== 'meta') return false;
      if (channel !== 'all' && channel !== 'meta' && (s.kind !== 'send' || s.channel !== channel)) return false;
      if (!q) return true;
      return [s.subject, s.body, s.to, s.partnerId, s.status].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [unified, query, channel]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Send log</div>
          <div className="mt-1 text-2xl font-black text-white">{sends.length}</div>
          <div className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>Portal · email · SMS</div>
        </div>
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
          <div className="text-[10px] uppercase tracking-widest text-sky-200/70">Meta inbox</div>
          <div className="mt-1 text-2xl font-black text-white">{metaInbox.filter((m) => m.direction === 'inbound').length}</div>
          <div className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>Inbound DMs & comments bridge</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-200/70">Partner support</div>
            <div className={`text-xs mt-2 ${FINELY_OS_ENTITY_BODY}`}>Live partner threads — full inbox workspace</div>
          </div>
          <button type="button" className={`${FINELY_OS_SECONDARY_BTN} mt-3 w-fit`} onClick={() => navigate('/admin/support')}>
            Open partner conversations <ExternalLink size={12} />
          </button>
        </div>
      </div>

      <StudioSection eyebrow="unified inbox" title="Portal, email, SMS, Meta — full delivery history (paginated)">
        <div className="flex flex-wrap gap-2 mb-3">
          {(['all', 'portal', 'email', 'sms', 'meta'] as const).map((c) => (
            <button
              key={c}
              type="button"
              className={channel === c ? 'fc-button-brand' : 'fc-button-soft'}
              onClick={() => {
                setChannel(c);
                setPage(0);
              }}
            >
              {c === 'all' ? 'All' : c === 'meta' ? 'Meta' : c.toUpperCase()}
            </button>
          ))}
          <button type="button" className="fc-button-soft ml-auto" onClick={() => setVersion((v) => v + 1)}>
            Refresh
          </button>
          <button type="button" className="fc-button-soft" onClick={() => navigate('/admin/social-hub?tab=inbox')}>
            <Share2 size={14} /> Social Hub inbox
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-4 mb-3">
          <Search size={16} className="text-white/35" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search subject, partner, status, Meta text…"
            className="w-full bg-transparent py-3 text-sm text-white/80 outline-none"
          />
        </div>
        <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
          {paged.length === 0 ? (
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY} p-4`}>No messages yet — compose a message, connect Meta, or run a nurture sequence.</p>
          ) : (
            paged.map((s) => {
              const Icon = s.kind === 'meta' ? Share2 : CHANNEL_ICON[s.channel as CommsChannel] ?? Inbox;
              return (
                <div key={s.id} className="rounded-xl border border-white/10 bg-black/30 p-4 flex gap-3">
                  <Icon size={18} className={s.kind === 'meta' ? 'text-sky-300 shrink-0 mt-0.5' : 'text-violet-300 shrink-0 mt-0.5'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{s.subject || '(no subject)'}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          s.status === 'sent' || s.status === 'inbound'
                            ? 'border-emerald-500/30 text-emerald-200'
                            : s.status === 'dry_run'
                              ? 'border-rose-500/30 text-rose-200'
                              : 'border-rose-500/30 text-rose-200'
                        }`}
                      >
                        {s.status}
                      </span>
                      {s.kind === 'meta' ? (
                        <span className="text-[9px] uppercase tracking-wider text-sky-300/80">meta bridge</span>
                      ) : null}
                    </div>
                    <div className={`text-xs mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      {(s.kind === 'meta' ? s.channel : s.channel.toUpperCase())} · {new Date(s.createdAt).toLocaleString()}
                      {s.partnerId ? ` · partner ${s.partnerId.slice(0, 8)}` : ''}
                      {s.to ? ` · ${s.to}` : ''}
                    </div>
                    {s.body ? <p className={`text-xs mt-2 line-clamp-2 ${FINELY_OS_ENTITY_BODY}`}>{s.body}</p> : null}
                    {s.error ? <p className="text-xs text-rose-300 mt-1">{s.error}</p> : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {pageCount > 1 ? (
          <div className="flex items-center justify-between gap-2 mt-3">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="text-xs text-white/50">
              Page {page + 1} of {pageCount} · {filtered.length} messages
            </span>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        ) : null}
      </StudioSection>
    </div>
  );
}
