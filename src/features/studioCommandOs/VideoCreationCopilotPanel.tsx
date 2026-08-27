import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, Mic, MicOff, Send, Sparkles } from 'lucide-react';
import { useFinelyVoiceInput } from '../../hooks/useFinelyVoiceInput';
import {
  FINELY_OS_COMPACT_TEXTAREA,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMessageBubble,
} from '../os/finelyOsLightUi';
import {
  runVideoCreationCopilotTurn,
  VIDEO_COPILOT_STARTER_CHIPS,
  type VideoCopilotMessage,
} from './videoCreationCopilotBrain';
import type { VideoCommandRequest } from './types';
import type { VideoCreateWizardPresetId } from './VideoCreateWizard';

function msgId() {
  return `vc_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const GREETING =
  'Tell me what this clip should accomplish — or tap a starter below. I will draft a compliance-safe plan before you pick duration and aspect.';

export type VideoCreationCopilotPanelProps = {
  compact?: boolean;
  onApplyBrief: (patch: Partial<VideoCommandRequest>, suggestedPreset?: VideoCreateWizardPresetId) => void;
  /** When set, show a primary CTA to continue into the wizard after applying a brief. */
  onContinue?: () => void;
};

export function VideoCreationCopilotPanel({ compact, onApplyBrief, onContinue }: VideoCreationCopilotPanelProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<VideoCopilotMessage[]>([
    { id: msgId(), role: 'assistant', text: GREETING },
  ]);
  const [lastPatch, setLastPatch] = useState<Partial<VideoCommandRequest> | null>(null);
  const [lastPreset, setLastPreset] = useState<VideoCreateWizardPresetId | undefined>();

  const appendVoiceText = useCallback((text: string) => {
    setDraft((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
  }, []);

  const voice = useFinelyVoiceInput({
    onResult: appendVoiceText,
  });

  const displayDraft = useMemo(() => {
    if (!voice.listening || !voice.interimTranscript) return draft;
    const base = draft.trim();
    const interim = voice.interimTranscript.trim();
    if (!base) return interim;
    return `${base} ${interim}`;
  }, [draft, voice.listening, voice.interimTranscript]);

  const scrollToBottom = () => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const sendTurn = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setErr(null);
      setBusy(true);
      setDraft('');
      voice.stop();

      const userMsg: VideoCopilotMessage = { id: msgId(), role: 'user', text: trimmed };
      const history = [...messages, userMsg];
      setMessages(history);

      try {
        const result = await runVideoCreationCopilotTurn({ userText: trimmed, history: messages });
        setMessages((prev) => [...prev, { id: msgId(), role: 'assistant', text: result.reply }]);
        setLastPatch(result.requestPatch);
        setLastPreset(result.suggestedPreset);
        window.requestAnimationFrame(scrollToBottom);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Copilot unavailable.');
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, voice],
  );

  const applyBrief = () => {
    if (!lastPatch || !Object.keys(lastPatch).length) return;
    onApplyBrief(lastPatch, lastPreset);
  };

  const starterChips = VIDEO_COPILOT_STARTER_CHIPS;

  return (
    <div className={`${finelyOsCatalogCardCompact('amber')} space-y-3`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300 inline-flex items-center gap-1.5`}>
            <Sparkles size={12} /> Video copilot
          </p>
          <h3 className="text-lg font-black text-white tracking-tight">Plan your clip — one tap or one sentence</h3>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY} max-w-2xl`}>
            No typing required: pick a starter chip. I draft hook, beats, and a compliance-safe CTA before format and scenes.
          </p>
        </div>
        {lastPatch?.prompt ? (
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={applyBrief}>
            <CheckCircle2 size={14} /> Apply plan
          </button>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className={`overflow-y-auto space-y-2 rounded-xl border border-white/10 bg-black/25 ${compact ? 'max-h-[180px] p-2.5' : 'max-h-[240px] p-3'}`}
      >
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[92%] text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'rounded-2xl px-3 py-2 bg-violet-500/20 text-violet-50' : finelyOsMessageBubble('assistant')
              }`}
            >
              {m.role === 'assistant' ? (
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-200/80 mb-1">
                  <Bot size={11} /> Copilot
                </div>
              ) : null}
              {m.text}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="flex justify-start">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/50 inline-flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:120ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:240ms]" />
            </div>
          </div>
        ) : null}
      </div>

      {err ? <div className="text-xs text-rose-200/90">{err}</div> : null}

      <div className="space-y-2">
        <textarea
          aria-label="Describe the video you want to create"
          value={displayDraft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          className={`${FINELY_OS_COMPACT_TEXTAREA} w-full ${voice.listening ? 'border-violet-400/40 shadow-[0_0_0_1px_rgba(167,139,250,0.25)]' : ''}`}
          placeholder="Describe audience, hook, offer, tone… or tap a starter below"
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void sendTurn(draft.trim() ? draft : displayDraft);
            }
          }}
        />
        {voice.listening ? (
          <p className="text-[10px] text-violet-200/80 animate-pulse">Listening — speak naturally, transcript fills the box…</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {voice.supported ? (
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => (voice.listening ? voice.stop() : voice.start())}
              disabled={busy}
              title={voice.listening ? 'Stop dictation' : 'Dictate your brief'}
            >
              {voice.listening ? <MicOff size={14} /> : <Mic size={14} />}
              {voice.listening ? 'Stop' : 'Mic'}
            </button>
          ) : null}
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            disabled={busy || !(draft.trim() || displayDraft.trim())}
            onClick={() => void sendTurn(draft.trim() ? draft : displayDraft)}
          >
            <Send size={14} /> {busy ? 'Planning…' : 'Plan clip'}
          </button>
          {lastPatch?.prompt && onContinue ? (
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => {
                applyBrief();
                onContinue();
              }}
            >
              Continue to format <ArrowRight size={14} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5 pt-1 border-t border-white/10">
        <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>One-click starters</div>
        <div className="flex flex-wrap gap-2">
          {starterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              disabled={busy}
              onClick={() => void sendTurn(chip.prompt)}
              className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-left text-xs font-semibold text-violet-50 hover:bg-violet-500/15 transition"
              title={chip.prompt}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
