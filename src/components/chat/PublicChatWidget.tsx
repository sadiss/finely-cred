import React, { useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, X, Sparkles, ShieldCheck } from 'lucide-react';
import { submitLeadCapture } from '../../data/leadsRepo';

type ChatRole = 'bot' | 'user';
type ChatMsg = { id: string; role: ChatRole; text: string };

type Goal = 'personal' | 'business' | 'tradelines' | 'debt' | 'not_sure';

function newId() {
  return crypto?.randomUUID ? crypto.randomUUID() : `${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function sanitize(s: string) {
  return (s || '').trim();
}

export function PublicChatWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [sending, setSending] = useState(false);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [submitted, setSubmitted] = useState<null | { remote: string; ref: string }>(null);

  const [draft, setDraft] = useState('');

  const initialMsgs = useMemo<ChatMsg[]>(
    () => [
      {
        id: 'm1',
        role: 'bot',
        text: `Welcome to Finely Cred. I can route you to the right workflow in under 60 seconds.`,
      },
      {
        id: 'm2',
        role: 'bot',
        text: `What are you trying to accomplish right now?`,
      },
    ],
    [],
  );
  const [messages, setMessages] = useState<ChatMsg[]>(initialMsgs);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    const el = scrollerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  };

  const push = (role: ChatRole, text: string) => {
    setMessages((prev) => [...prev, { id: newId(), role, text }]);
  };

  const setGoalAndAdvance = (g: Goal) => {
    setGoal(g);
    const label =
      g === 'personal'
        ? 'Personal credit restore'
        : g === 'business'
          ? 'Business credit'
          : g === 'tradelines'
            ? 'Authorized user tradelines'
            : g === 'debt'
              ? 'Debt / summons'
              : 'Not sure';
    push('user', label);
    push(
      'bot',
      `Perfect. If you want, I can reserve a free 1‑hour enlightenment session and have a specialist reach out.`,
    );
    push('bot', `Drop your name, email, and phone below. (You’ll get a confirmation reference.)`);
    scrollToBottom();
  };

  const handleSend = async () => {
    const text = sanitize(draft);
    if (!text) return;

    setDraft('');
    push('user', text);
    scrollToBottom();

    // Lightweight “assistant” handling: if user types something before goal, nudge.
    if (!goal) {
      push('bot', `Got it. First—pick one of the options below so I route you correctly.`);
      scrollToBottom();
      return;
    }

    push('bot', `Thanks. Use the form fields above to submit your session request.`);
    scrollToBottom();
  };

  const canSubmit = goal && sanitize(fullName) && sanitize(email) && sanitize(phone) && consent;

  const handleSubmit = async () => {
    if (!canSubmit || sending) return;
    setSending(true);
    try {
      const interest =
        goal === 'personal'
          ? 'Personal credit restore'
          : goal === 'business'
            ? 'Business credit'
            : goal === 'tradelines'
              ? 'Tradelines'
              : goal === 'debt'
                ? 'Debt & summons'
                : 'Not sure';

      const res = await submitLeadCapture({
        source: 'chat',
        offer: 'free_1h_consult',
        interest,
        fullName: sanitize(fullName),
        email: sanitize(email),
        phone: sanitize(phone),
        consentToContact: Boolean(consent),
      });
      setSubmitted({ remote: res.remote, ref: res.lead.id });
      push('bot', `You’re in. Reference: ${res.lead.id}`);
      push(
        'bot',
        res.remote === 'ok'
          ? `Confirmed in our system. A specialist will contact you shortly.`
          : res.remote === 'not_configured'
            ? `Saved locally (Supabase not connected yet). We can still contact you from the information provided.`
            : `Saved locally. Remote sync failed (${res.remoteError || 'unknown'}). We’ll still follow up.`,
      );
      scrollToBottom();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="finely-public-chat-widget" data-fc-public-chat-widget="1">
      {/* Launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            scrollToBottom();
          }}
          className="fixed bottom-5 right-5 z-[120] inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-[#0d1512]/95 backdrop-blur-xl px-4 py-3 shadow-2xl hover:shadow-[0_18px_50px_-18px_rgba(245,158,11,0.35)] transition-all"
          title="Chat with Finely AI"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <MessageCircle size={18} className="text-amber-300" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/70">FINELY AI</div>
            <div className="text-xs text-white/60">Get routed fast</div>
          </div>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[120] w-[360px] max-w-[calc(100vw-40px)]">
          <div className="rounded-3xl border border-white/10 bg-[#0d1512]/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/70">Finely AI</div>
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Guided routing • Session capture • Workflow suggestions
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Goal buttons */}
            <div className="px-5 pt-4">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Route me to</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  { id: 'personal' as const, label: 'Personal restore' },
                  { id: 'business' as const, label: 'Business credit' },
                  { id: 'tradelines' as const, label: 'Tradelines' },
                  { id: 'debt' as const, label: 'Debt / summons' },
                ].map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => setGoalAndAdvance(x.id)}
                    className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      goal === x.id
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-white/[0.02] border-white/10 text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {x.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setGoalAndAdvance('not_sure')}
                  className={`col-span-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    goal === 'not_sure'
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-white/[0.02] border-white/10 text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  Not sure — guide me
                </button>
              </div>
            </div>

            {/* Lead form */}
            <div className="px-5 pt-4">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} className="text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-semibold">Free 1-hour enlightenment session</div>
                    <div className="text-xs text-white/60 mt-1">
                      We’ll review your situation and map the fastest next steps.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-white/60">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                  I consent to be contacted by Finely Cred regarding this request.
                </label>

                <button
                  type="button"
                  disabled={!canSubmit || sending}
                  onClick={handleSubmit}
                  className="w-full fc-button-brand disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Submitting…' : 'Reserve my session'}
                </button>

                {submitted && (
                  <div className="text-[11px] text-white/70">
                    Saved. Ref: <span className="font-mono text-white/90">{submitted.ref}</span>{' '}
                    <span className="text-white/40">(remote: {submitted.remote})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollerRef} className="px-5 pt-4 pb-2 max-h-[240px] overflow-y-auto space-y-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`text-sm leading-relaxed ${
                    m.role === 'bot' ? 'text-white/80' : 'text-amber-200'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-widest text-white/30 mr-2">
                    {m.role === 'bot' ? 'Finely' : 'You'}
                  </span>
                  {m.text}
                </div>
              ))}
            </div>

            {/* Composer */}
            <div className="px-5 py-4 border-t border-white/10 flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask a question…"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
                title="Send"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

