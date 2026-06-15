import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, MessageSquare, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CS, CREDIT_SPECIALIST_COMMS_CHANNELS } from '../../config/creditSpecialistProgram';
import { onboardCreditSpecialistCommunication } from '../../lib/creditSpecialistComms';
import { listMessagesByThread } from '../../data/supportRepo';
import type { SupportMessage } from '../../domain/support';

type Props = {
  partnerId: string;
  specialistName?: string;
  tierName?: string;
};

export function CreditSpecialistCommsPanel({ partnerId, specialistName, tierName }: Props) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (!partnerId) return;
    const { thread } = onboardCreditSpecialistCommunication({ partnerId, specialistName, tierName });
    setThreadId(thread.id);
    setMessages(listMessagesByThread(thread.id));
  }, [partnerId, specialistName, tierName]);

  const latest = useMemo(() => messages.filter((m) => !m.fromPartner).slice(-1)[0], [messages]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-emerald-300">
              <Radio size={18} />
              <span className="text-sm font-semibold">Partnership line with Finely</span>
            </div>
            <p className="text-white/65 text-sm leading-relaxed">
              This is your direct channel for program support — not client comms. Finely replies here; your client messages
              stay in separate threads. Live chat lives in the Communication Hub; Comms Studio (admin) sends template updates into these same threads.
            </p>
            {latest ? (
              <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4 text-sm text-white/70">
                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Latest from Finely</div>
                <p className="line-clamp-4 whitespace-pre-wrap">{latest.body}</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(
                threadId
                  ? `/portal/messages?hub=team&thread=${encodeURIComponent(threadId)}`
                  : CS.messagesDeepLink,
              )
            }
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 shrink-0"
          >
            Open partnership line <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CREDIT_SPECIALIST_COMMS_CHANNELS.map((ch) => (
          <button
            key={ch.title}
            type="button"
            onClick={() => navigate(ch.path)}
            className="text-left fc-light-glass-panel fc-light-chrome-panel p-4 hover:bg-white/[0.04] transition-all"
          >
            <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <MessageSquare size={14} />
              {ch.action}
            </div>
            <div className="text-white font-semibold mt-2 text-sm">{ch.title}</div>
            <p className="text-white/50 text-xs mt-1 leading-relaxed">{ch.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
