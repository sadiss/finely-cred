import React, { useCallback, useMemo, useState } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FINELY_PUBLIC_COMPLIANCE_LINE,
  finelyPublicAnswer,
  type FinelyPublicTopic,
} from '../../lib/finelyBrain/finelyPublicAnswer';
import { speakFinelyText, useFinelyVoiceInput } from '../../hooks/useFinelyVoiceInput';
import { guardVoiceScript } from '../../lib/complianceEngine';
import { FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';
import { PUBLIC_DEMO_VIDEOS_ENABLED } from '../../config/publicMediaPolicy';

const VOICE_PROMPTS = [
  { label: 'What is Finely?', prompt: 'What is Finely Cred?' },
  { label: 'Restore credit', prompt: 'How do I restore my credit?' },
  { label: 'Free guide', prompt: 'start free guide' },
] as const;

function topicAccent(topic: FinelyPublicTopic | 'general'): string {
  switch (topic) {
    case 'credit_restore':
      return 'emerald';
    case 'dispute_vs_debt':
      return 'violet';
    case 'pricing_funding':
      return 'amber';
    case 'page_help':
      return 'sky';
    default:
      return 'amber';
  }
}

function FinelyStripAnswer({ reply, topic }: { reply: string; topic: FinelyPublicTopic | 'general' }) {
  const accent = topicAccent(topic);
  const accentBorder =
    accent === 'emerald'
      ? 'border-emerald-400/35'
      : accent === 'violet'
        ? 'border-violet-400/35'
        : accent === 'sky'
          ? 'border-sky-400/35'
          : 'border-amber-400/35';
  const accentGlow =
    accent === 'emerald'
      ? 'from-emerald-500/10'
      : accent === 'violet'
        ? 'from-violet-500/10'
        : accent === 'sky'
          ? 'from-sky-500/10'
          : 'from-amber-500/10';

  const { lead, body, compliance } = useMemo(() => {
    let text = reply.trim();
    let complianceLine: string | null = null;
    if (text.includes(FINELY_PUBLIC_COMPLIANCE_LINE)) {
      complianceLine = FINELY_PUBLIC_COMPLIANCE_LINE;
      text = text.replace(FINELY_PUBLIC_COMPLIANCE_LINE, '').trim();
    }
    const parts = text.split(/\n\n+/).filter(Boolean);
    const first = parts[0] ?? text;
    const rest = parts.length > 1 ? parts.slice(1) : [];
    const numbered = first.match(/^\d+\.\s/m);
    if (numbered && parts.length === 1) {
      const lines = first.split(/\n(?=\d+\.\s)/).filter(Boolean);
      return { lead: null, body: lines, compliance: complianceLine };
    }
    const sentences = first.split(/(?<=[.!?])\s+/).filter(Boolean);
    const leadSentence = sentences.length > 2 ? sentences[0] : null;
    const tail = leadSentence ? sentences.slice(1).join(' ') : first;
    const bodyBlocks = leadSentence ? [tail, ...rest] : rest.length ? rest : first ? [first] : [];
    return { lead: leadSentence, body: bodyBlocks.filter(Boolean), compliance: complianceLine };
  }, [reply]);

  return (
    <div
      className={`fc-launch-help-answer mt-3 overflow-hidden rounded-xl border ${accentBorder} bg-gradient-to-br ${accentGlow} to-black/40`}
      role="status"
      aria-live="polite"
    >
      <div className="border-b border-white/[0.06] px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Finely&apos;s reply</p>
      </div>
      <div className="space-y-2.5 px-3.5 py-3">
        {lead ? (
          <p className="text-[15px] font-semibold leading-snug text-white/95 tracking-tight">{lead}</p>
        ) : null}
        {body.map((block, i) => {
          const isStep = /^\d+\.\s/.test(block);
          return (
            <p
              key={i}
              className={
                isStep
                  ? 'rounded-lg border border-white/[0.06] bg-black/25 px-2.5 py-2 text-[13px] leading-relaxed text-white/82'
                  : 'text-[13px] leading-[1.65] text-white/78'
              }
            >
              {block}
            </p>
          );
        })}
        {compliance ? (
          <p className="border-t border-white/[0.06] pt-2 text-[11px] italic leading-relaxed text-white/42">{compliance}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Compact Ask Finely strip mounted from PageShell on public and portal routes. */
export function FinelyLaunchHelpStrip() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reply, setReply] = useState('');
  const [topic, setTopic] = useState<FinelyPublicTopic | 'general'>('general');
  const [busy, setBusy] = useState(false);

  const ask = useCallback(
    (userMessage: string, channel: 'strip' | 'voice' = 'strip') => {
      const trimmed = userMessage.trim();
      if (!trimmed) return;
      setBusy(true);
      try {
        const res = finelyPublicAnswer({
          pathname: location.pathname,
          message: trimmed,
          channel,
          seniorMode: true,
        });
        setReply(res.reply);
        setTopic(res.topic);
        if (channel === 'voice') {
          speakFinelyText(guardVoiceScript(res.reply));
        }
      } finally {
        setBusy(false);
      }
    },
    [location.pathname],
  );

  const onVoiceResult = useCallback((text: string) => ask(text, 'voice'), [ask]);
  const { supported, listening, start, stop } = useFinelyVoiceInput(onVoiceResult);

  return (
    <div
      className="fc-senior-simple fc-senior-tap-target mb-3 rounded-2xl border border-white/[0.08] bg-black/30 p-3"
      data-fc-launch-help-strip="1"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90">
          <Sparkles size={14} className="text-amber-300/90" aria-hidden />
          Ask Finely
        </span>
      </div>
      <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/52">
        Tap <span className="text-white/70">Voice</span> to ask a quick question about this page — speak naturally. We answer in
        plain English, not a chatbot wall.
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {supported ? (
          <button
            type="button"
            className={`${FINELY_OS_SECONDARY_BTN} !text-xs !py-1.5 !px-3`}
            onClick={() => (listening ? stop() : start())}
            aria-pressed={listening}
          >
            <Mic size={13} aria-hidden /> {listening ? 'Listening…' : 'Voice'}
          </button>
        ) : null}
        {PUBLIC_DEMO_VIDEOS_ENABLED ? (
          <button
            type="button"
            className={`${FINELY_OS_SECONDARY_BTN} !text-xs !py-1.5 !px-3 opacity-80`}
            onClick={() => navigate('/resources/videos')}
          >
            Watch how
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Try</span>
        {VOICE_PROMPTS.map((item) => (
          <button
            key={item.label}
            type="button"
            className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/55 transition-colors hover:border-amber-400/25 hover:bg-amber-500/[0.06] hover:text-white/85 disabled:opacity-40"
            disabled={busy}
            onClick={() => ask(item.prompt)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {busy ? (
        <p className="mt-2.5 text-[11px] tracking-wide text-amber-200/50">One moment…</p>
      ) : null}
      {reply && !busy ? <FinelyStripAnswer reply={reply} topic={topic} /> : null}
    </div>
  );
}
