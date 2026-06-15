import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  isMetaThreadUiId,
  listMetaInboxThreadSummaries,
  listMetaMessagesByThreadId,
  replyMetaInboxThread,
} from '../../lib/socialHubCommsBridge';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

/** Compact Meta inbox for admin comms surfaces (Phase 7). */
export function AdminMetaInboxWidget() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const threads = useMemo(() => listMetaInboxThreadSummaries(), [version]);
  const selected = useMemo(
    () => (selectedId ? threads.find((t) => t.id === selectedId) ?? null : threads[0] ?? null),
    [threads, selectedId],
  );
  const messages = useMemo(
    () => (selected ? listMetaMessagesByThreadId(selected.threadId) : []),
    [selected, version],
  );

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    replyMetaInboxThread({
      threadId: selected.threadId,
      text: reply.trim(),
      pageId: selected.pageId,
      channel: selected.channel,
    });
    setReply('');
    setVersion((v) => v + 1);
  };

  return (
    <div className={`${finelyOsGlassShell('panel', 'fuchsia')} p-5 space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
          <Share2 size={14} /> Meta inbox
        </div>
        <button type="button" onClick={() => navigate('/admin/support?source=meta')} className={FINELY_OS_SECONDARY_BTN}>
          Full omnichannel inbox
        </button>
      </div>
      {threads.length === 0 ? (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>No Meta threads yet — connect Social Hub or simulate a lead.</p>
      ) : (
        <div className="grid md:grid-cols-5 gap-3">
          <div className="md:col-span-2 space-y-1 max-h-48 overflow-y-auto">
            {threads.slice(0, 8).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left rounded-lg border px-2 py-2 text-xs transition-all ${
                  selected?.id === t.id ? 'border-fuchsia-500/40 bg-fuchsia-500/10' : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                <div className={FINELY_OS_ENTITY_VALUE}>{t.subject}</div>
                <div className={`${FINELY_OS_ENTITY_BODY} truncate`}>{t.preview}</div>
              </button>
            ))}
          </div>
          <div className="md:col-span-3 space-y-2">
            {selected ? (
              <>
                <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <MessageSquare size={12} className="inline mr-1" />
                  {selected.threadId}
                </div>
                <div className="max-h-32 overflow-y-auto space-y-2 text-xs">
                  {messages.slice(-6).map((m) => (
                    <div key={m.id} className={`rounded-lg border border-white/[0.08] p-2 ${FINELY_OS_ENTITY_BODY}`}>
                      <span className={FINELY_OS_ENTITY_SUBLABEL}>{m.direction === 'inbound' ? 'In' : 'Out'} · </span>
                      {m.text}
                    </div>
                  ))}
                </div>
                <form onSubmit={sendReply} className="flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Queue Meta reply…"
                    className={`flex-1 ${FINELY_OS_ENTITY_INPUT} !py-1.5 !text-xs`}
                  />
                  <button type="submit" disabled={!reply.trim()} className={FINELY_OS_PRIMARY_BTN}>
                    <Send size={12} />
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
