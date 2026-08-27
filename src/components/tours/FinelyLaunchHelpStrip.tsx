import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Languages, Mic, Send, Sparkles, Square, Volume2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FINELY_PUBLIC_COMPLIANCE_LINE,
  finelyPublicAnswer,
  type FinelyPublicTopic,
} from '../../lib/finelyBrain/finelyPublicAnswer';
import { finelyBrainOrchestrate } from '../../lib/finelyBrain/finelyBrainOrchestrate';
import { speakFinelyText, useFinelyVoiceInput } from '../../hooks/useFinelyVoiceInput';
import {
  CHAT_LOCALE_LABELS,
  CHAT_LOCALE_ORDER,
  detectLocaleFromText,
  isRtlLocale,
  t,
  type ChatLocale,
} from '../../lib/publicChatI18n';
import { FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';
import { PUBLIC_DEMO_VIDEOS_ENABLED } from '../../config/publicMediaPolicy';

export type FinelyLaunchPrompt = {
  label: string;
  prompt: string;
  hint?: string;
};

const DEFAULT_TEXT_PROMPTS: readonly FinelyLaunchPrompt[] = [
  { label: 'What is Finely?', prompt: 'What is Finely Cred?' },
  { label: 'Restore credit', prompt: 'How do I restore my credit?' },
  { label: 'Free guide', prompt: 'start free guide' },
] as const;

const SPEECH_LOCALE: Record<ChatLocale, string> = {
  en: 'en-US',
  es: 'es-US',
  ht: 'ht-HT',
  fr: 'fr-FR',
  pt: 'pt-BR',
  zh: 'zh-CN',
  vi: 'vi-VN',
  ar: 'ar-SA',
};

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

/** Compact, multilingual Ask Finely strip mounted from PageShell on public and portal routes. */
export function FinelyLaunchHelpStrip({
  tone = 'dark',
  className = '',
  showWatchHow = true,
  prompts = DEFAULT_TEXT_PROMPTS,
  description = 'Ask by typing or speaking. Choose Kreyòl, English, or another supported language.',
}: {
  tone?: 'dark' | 'ivory';
  className?: string;
  /** Hide Watch how CTA (e.g. restore page places strip mid-page). */
  showWatchHow?: boolean;
  prompts?: readonly FinelyLaunchPrompt[];
  description?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [reply, setReply] = useState('');
  const [topic, setTopic] = useState<FinelyPublicTopic | 'general'>('general');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [locale, setLocale] = useState<ChatLocale>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const saved = window.localStorage.getItem('fc_hub_locale') as ChatLocale | null;
      return saved && CHAT_LOCALE_ORDER.includes(saved) ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const voice = useFinelyVoiceInput({
    lang: SPEECH_LOCALE[locale],
    onResult: (text) => {
      const detected = detectLocaleFromText(text);
      if (detected) setLocale(detected);
      setDraft((current) => (current.trim() ? `${current.trim()} ${text}` : text));
    },
  });

  const composerText = useMemo(() => {
    if (!voice.listening || !voice.interimTranscript) return draft;
    const base = draft.trim();
    return base ? `${base} ${voice.interimTranscript.trim()}` : voice.interimTranscript.trim();
  }, [draft, voice.interimTranscript, voice.listening]);

  useEffect(() => {
    try {
      window.localStorage.setItem('fc_hub_locale', locale);
    } catch {
      // Language persistence is optional.
    }
  }, [locale]);

  const ask = useCallback(
    (userMessage: string) => {
      const trimmed = userMessage.trim();
      if (!trimmed) return;
      if (voice.listening) voice.stop();
      setBusy(true);
      try {
        const publicResult = finelyPublicAnswer({
          pathname: location.pathname,
          message: trimmed,
          channel: 'strip',
          seniorMode: true,
        });
        const result = finelyBrainOrchestrate({
          pathname: location.pathname,
          userMessage: trimmed,
          seniorMode: true,
        });
        setReply(result.reply || publicResult.reply);
        setTopic(publicResult.topic);
        setDraft('');
      } finally {
        setBusy(false);
      }
    },
    [location.pathname, voice],
  );

  const isIvory = tone === 'ivory';

  return (
    <div
      className={`fc-senior-simple mb-3 w-full rounded-2xl p-3 ${
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
        {description}
      </p>

      <div className="mt-2.5 flex flex-wrap items-end gap-2">
        <label
          className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold ${
            isIvory
              ? 'border-violet-300/45 bg-violet-50 text-violet-900'
              : 'border-violet-400/30 bg-violet-500/10 text-violet-100'
          }`}
        >
          <Languages size={14} aria-hidden />
          <span className="sr-only">Ask Finely language</span>
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as ChatLocale)}
            className="max-w-[9rem] bg-transparent text-inherit outline-none"
            aria-label="Ask Finely language"
          >
            {CHAT_LOCALE_ORDER.map((option) => (
              <option key={option} value={option} className="bg-white text-slate-950">
                {CHAT_LOCALE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>

        <div
          className={`flex min-w-[14rem] flex-1 items-end gap-2 rounded-xl border p-2 ${
            isIvory ? 'border-[#0a1628]/12 bg-[#f8fafc]' : 'border-white/10 bg-black/25'
          }`}
        >
          <textarea
            value={composerText}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                ask(draft);
              }
            }}
            rows={2}
            dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
            placeholder={t(locale, 'sendPlaceholder')}
            className={`min-h-10 flex-1 resize-none bg-transparent px-1 py-1 text-sm outline-none ${
              isIvory ? 'text-[#0a1628] placeholder:text-[#0a1628]/40' : 'text-white placeholder:text-white/35'
            }`}
          />
          {voice.supported ? (
            <button
              type="button"
              onClick={voice.listening ? voice.stop : voice.start}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                voice.listening
                  ? 'border-rose-400/50 bg-rose-500/15 text-rose-600'
                  : isIvory
                    ? 'border-sky-300/50 bg-sky-50 text-sky-700'
                    : 'border-sky-400/30 bg-sky-500/10 text-sky-200'
              }`}
              aria-label={voice.listening ? 'Stop listening' : 'Speak to Ask Finely'}
              title={voice.listening ? 'Stop listening' : 'Speak to Ask Finely'}
            >
              {voice.listening ? <Square size={15} fill="currentColor" /> : <Mic size={16} />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => ask(draft)}
            disabled={busy || !draft.trim()}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border disabled:opacity-40 ${
              isIvory
                ? 'border-emerald-300/55 bg-emerald-50 text-emerald-700'
                : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
            }`}
            aria-label="Send to Ask Finely"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      {voice.listening ? (
        <p className={`mt-1.5 text-[11px] ${isIvory ? 'text-sky-700' : 'text-sky-200/80'}`}>
          Listening — your words will appear above.
        </p>
      ) : null}

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
        {prompts.map((item) => (
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
            onMouseEnter={() => setActiveHint(item.hint ?? null)}
            onMouseLeave={() => setActiveHint(null)}
            onFocus={() => setActiveHint(item.hint ?? null)}
            onBlur={() => setActiveHint(null)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {activeHint ? (
        <div
          className={`mt-2 rounded-xl border px-3 py-2 text-xs leading-relaxed ${
            isIvory
              ? 'border-violet-300/35 bg-violet-50/70 text-violet-950/80'
              : 'border-violet-400/25 bg-violet-500/[0.08] text-violet-100/80'
          }`}
          role="status"
          aria-live="polite"
          data-fc-ask-finely-hover-hint="1"
        >
          {activeHint}
        </div>
      ) : null}

      {busy ? (
        <p className={`mt-2.5 text-[11px] tracking-wide ${isIvory ? 'text-emerald-700/60' : 'text-amber-200/50'}`}>
          One moment…
        </p>
      ) : null}
      {reply && !busy ? (
        <>
          <FinelyStripAnswer reply={reply} topic={topic} ivory={isIvory} />
          <button
            type="button"
            onClick={() => speakFinelyText(reply, SPEECH_LOCALE[locale])}
            className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${
              isIvory ? 'text-sky-700' : 'text-sky-200/80'
            }`}
          >
            <Volume2 size={14} /> Read aloud
          </button>
        </>
      ) : null}
    </div>
  );
}
