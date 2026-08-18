import React, { useCallback, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FINELY_PUBLIC_COMPLIANCE_LINE,
  finelyPublicAnswer,
  type FinelyPublicTopic,
} from '../../lib/finelyBrain/finelyPublicAnswer';
import { FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';
import { PUBLIC_DEMO_VIDEOS_ENABLED } from '../../config/publicMediaPolicy';

const TEXT_PROMPTS = [
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

function FinelyStripAnswer({
  reply,
  topic,
  ivory = false,
}: {
  reply: string;
  topic: FinelyPublicTopic | 'general';
  ivory?: boolean;
}) {
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
      className={`fc-launch-help-answer mt-3 overflow-hidden rounded-xl border ${
        ivory
          ? 'border-[#0a1628]/10 bg-[#f8fafc]'
          : `${accentBorder} bg-gradient-to-br ${accentGlow} to-black/40`
      }`}
      role="status"
      aria-live="polite"
    >
      <div className={`border-b px-3 py-2 ${ivory ? 'border-[#0a1628]/8' : 'border-white/[0.06]'}`}>
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${ivory ? 'text-[#0a1628]/45' : 'text-white/45'}`}>
          Finely&apos;s reply
        </p>
      </div>
      <div className="space-y-2.5 px-3.5 py-3">
        {lead ? (
          <p className={`text-[15px] font-semibold leading-snug tracking-tight ${ivory ? 'text-[#0a1628]' : 'text-white/95'}`}>
            {lead}
          </p>
        ) : null}
        {body.map((block, i) => {
          const isStep = /^\d+\.\s/.test(block);
          return (
            <p
              key={i}
              className={
                isStep
                  ? ivory
                    ? 'rounded-lg border border-[#0a1628]/10 bg-white px-2.5 py-2 text-[13px] leading-relaxed text-[#0a1628]/80'
                    : 'rounded-lg border border-white/[0.06] bg-black/25 px-2.5 py-2 text-[13px] leading-relaxed text-white/82'
                  : ivory
                    ? 'text-[13px] leading-[1.65] text-[#0a1628]/72'
                    : 'text-[13px] leading-[1.65] text-white/78'
              }
            >
              {block}
            </p>
          );
        })}
        {compliance ? (
          <p className={`border-t pt-2 text-[11px] italic leading-relaxed ${ivory ? 'border-[#0a1628]/8 text-[#0a1628]/50' : 'border-white/[0.06] text-white/42'}`}>
            {compliance}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Compact Ask Finely strip mounted from PageShell on public and portal routes — text only. */
export function FinelyLaunchHelpStrip({
  tone = 'dark',
  className = '',
  showWatchHow = true,
}: {
  tone?: 'dark' | 'ivory';
  className?: string;
  /** Hide Watch how CTA (e.g. restore page places strip mid-page). */
  showWatchHow?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [reply, setReply] = useState('');
  const [topic, setTopic] = useState<FinelyPublicTopic | 'general'>('general');
  const [busy, setBusy] = useState(false);

  const ask = useCallback(
    (userMessage: string) => {
      const trimmed = userMessage.trim();
      if (!trimmed) return;
      setBusy(true);
      try {
        const res = finelyPublicAnswer({
          pathname: location.pathname,
          message: trimmed,
          channel: 'strip',
          seniorMode: true,
        });
        setReply(res.reply);
        setTopic(res.topic);
      } finally {
        setBusy(false);
      }
    },
    [location.pathname],
  );

  const isIvory = tone === 'ivory';

  return (
    <div
      className={`fc-senior-simple fc-senior-tap-target mb-3 rounded-2xl p-3 ${
        isIvory
          ? 'border border-[#0a1628]/10 bg-white shadow-[0_12px_36px_-24px_rgba(0,0,0,0.12)]'
          : 'border border-white/[0.08] bg-black/30'
      } ${className}`.trim()}
      data-fc-launch-help-strip="1"
      data-fc-launch-help-tone={tone}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span
          className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
            isIvory ? 'text-[#0a1628]' : 'text-white/90'
          }`}
        >
          <Sparkles size={14} className={isIvory ? 'text-emerald-600' : 'text-amber-300/90'} aria-hidden />
          Ask Finely
        </span>
      </div>
      <p className={`mt-1 max-w-xl text-xs leading-relaxed ${isIvory ? 'text-[#0a1628]/65' : 'text-white/62'}`}>
        Tap a prompt below for a plain-English answer about restore packages and next steps.
      </p>

      {showWatchHow && PUBLIC_DEMO_VIDEOS_ENABLED ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`${FINELY_OS_SECONDARY_BTN} !text-xs !py-1.5 !px-3 opacity-80`}
            onClick={() => navigate('/resources/videos')}
          >
            Watch how
          </button>
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${isIvory ? 'text-[#0a1628]/40' : 'text-white/35'}`}>
          Try
        </span>
        {TEXT_PROMPTS.map((item) => (
          <button
            key={item.label}
            type="button"
            className={
              isIvory
                ? 'rounded-full border border-[#0a1628]/12 bg-[#f8fafc] px-2 py-0.5 text-[11px] font-medium text-[#0a1628]/70 transition-colors hover:border-emerald-400/35 hover:bg-emerald-50 hover:text-[#0a1628] disabled:opacity-40'
                : 'rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/55 transition-colors hover:border-amber-400/25 hover:bg-amber-500/[0.06] hover:text-white/85 disabled:opacity-40'
            }
            disabled={busy}
            onClick={() => ask(item.prompt)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {busy ? (
        <p className={`mt-2.5 text-[11px] tracking-wide ${isIvory ? 'text-emerald-700/60' : 'text-amber-200/50'}`}>
          One moment…
        </p>
      ) : null}
      {reply && !busy ? <FinelyStripAnswer reply={reply} topic={topic} ivory={isIvory} /> : null}
    </div>
  );
}
