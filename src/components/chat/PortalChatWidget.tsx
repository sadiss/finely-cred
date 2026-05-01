import React, { useMemo, useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { callAiGateway, type AiGatewayMessage } from '../../lib/aiClient';
import { isFeatureEnabled } from '../../data/settingsRepo';

export function PortalChatWidget(args: { partnerId?: string; lane?: string; journeyStage?: string }) {
  const enabled = isFeatureEnabled('portalChat') && isFeatureEnabled('aiGateway');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiGatewayMessage[]>([
    {
      role: 'assistant' as const,
      content:
        'I can help you decide what to do next: uploads, evidence, letter rounds, and timelines. Ask me what your next best action is.',
    },
  ]);

  const ctx = useMemo(
    () => ({ partnerId: args.partnerId, lane: args.lane, journeyStage: args.journeyStage }),
    [args.partnerId, args.lane, args.journeyStage],
  );

  if (!enabled) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setErr(null);
    setBusy(true);
    setInput('');
    const next: AiGatewayMessage[] = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    try {
      const system = `You are Finely Cred's in-portal coach. Be concise, actionable, and specific. Ask 1 clarifying question when needed. Provide step-by-step next actions. If user asks legal advice, disclaim and focus on process.`;
      const res = await callAiGateway({
        taskType: 'portal_chat',
        messages: [{ role: 'system', content: system }, ...next],
        context: ctx,
        providerHint: 'openai',
      });
      setMessages((prev) => [...prev, { role: 'assistant' as const, content: res.text || '—' }]);
    } catch (e: any) {
      setErr(e?.message || 'Chat failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-fc-portal-chat-widget="1" className="fixed bottom-5 right-5 z-[150]">
      {open ? (
        <div className="w-[460px] max-w-[calc(100vw-40px)] rounded-[28px] border border-amber-500/30 bg-[#070b09]/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div
            className="p-4 border-b border-amber-500/20 flex items-center justify-between gap-3"
            style={{
              backgroundImage: [
                'linear-gradient(145deg, rgba(245,158,11,0.26) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.62) 100%)',
                'radial-gradient(260px 180px at 82% 18%, rgba(255,255,255,0.12), transparent 62%)',
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 28px)',
              ].join(', '),
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/25 flex items-center justify-center">
                <Sparkles size={16} className="text-amber-200" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.34em] text-black/70 font-black">Finely Chat</div>
                <div className="text-[11px] text-white/70 truncate">Ask for next actions, uploads, disputes, timelines</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2.5 rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.06] text-white/80"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'text-black'
                      : 'bg-white/[0.05] text-white/85 border border-white/10'
                  }`}
                  style={
                    m.role === 'user'
                      ? {
                          backgroundImage: [
                            'linear-gradient(145deg, rgba(251,191,36,0.95) 0%, rgba(245,158,11,0.95) 45%, rgba(217,119,6,0.95) 100%)',
                            'radial-gradient(220px 140px at 18% 22%, rgba(255,255,255,0.25), transparent 60%)',
                          ].join(', '),
                          boxShadow: '0 18px 44px -26px rgba(245,158,11,0.70)',
                        }
                      : undefined
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {err ? <div className="text-[11px] text-red-200/90">{err}</div> : null}
          </div>

          <div className="p-4 border-t border-white/10 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask what to do next…"
              className="flex-1 bg-black/40 border border-amber-500/20 rounded-2xl px-4 py-3 text-white/85 placeholder:text-white/35 focus:outline-none focus:border-amber-500 transition-colors text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void send();
              }}
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy || !input.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-black font-black uppercase tracking-widest text-[10px] disabled:opacity-60 disabled:cursor-not-allowed"
              title="Send"
              style={{
                backgroundImage: [
                  'linear-gradient(145deg, rgba(251,191,36,0.98) 0%, rgba(245,158,11,0.98) 45%, rgba(217,119,6,0.98) 100%)',
                  'radial-gradient(220px 140px at 18% 22%, rgba(255,255,255,0.25), transparent 60%)',
                  'repeating-linear-gradient(90deg, rgba(255,255,255,0.09) 0 1px, transparent 1px 28px)',
                ].join(', '),
                boxShadow: '0 20px 52px -30px rgba(245,158,11,0.75), inset 0 1px 0 rgba(255,255,255,0.22)',
              }}
            >
              <Send size={14} /> {busy ? '…' : 'Send'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group rounded-[26px] border border-amber-500/35 px-6 py-5 shadow-2xl transition-all hover:border-amber-500/55"
          title="Open portal assistant"
          style={{
            backgroundImage: [
              'linear-gradient(145deg, rgba(251,191,36,0.22) 0%, rgba(0,0,0,0.62) 44%, rgba(0,0,0,0.72) 100%)',
              'radial-gradient(260px 180px at 84% 18%, rgba(255,255,255,0.12), transparent 62%)',
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 28px)',
            ].join(', '),
            backdropFilter: 'blur(18px)',
            boxShadow: '0 26px 70px -40px rgba(245,158,11,0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center border border-amber-500/30 bg-amber-500/10">
              <MessageCircle size={20} className="text-amber-200" />
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(245,158,11,0.18)]" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-[0.34em] text-amber-200 font-black">Chat assistant</div>
              <div className="text-white/90 text-sm font-semibold">Ask anything • get next actions</div>
              <div className="mt-0.5 text-[11px] text-white/55">Uploads • disputes • letters • timelines</div>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}

