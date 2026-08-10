import React, { useCallback, useState } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { finelyBrainOrchestrate } from '../../lib/finelyBrain/finelyBrainOrchestrate';
import { useFinelyVoiceInput } from '../../hooks/useFinelyVoiceInput';
import { FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';
import { PUBLIC_DEMO_VIDEOS_ENABLED } from '../../config/publicMediaPolicy';

/** Compact Ask Finely / Watch how strip mounted from PageShell on public and portal routes. */
export function FinelyLaunchHelpStrip() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const ask = useCallback(
    (userMessage: string) => {
      setBusy(true);
      try {
        const res = finelyBrainOrchestrate({ pathname: location.pathname, userMessage, seniorMode: true });
        setReply(res.reply);
      } finally {
        setBusy(false);
      }
    },
    [location.pathname],
  );

  const { supported, listening, start, stop } = useFinelyVoiceInput(ask);

  return (
    <div
      className="fc-senior-simple fc-senior-tap-target mb-3 rounded-2xl border border-white/[0.08] bg-black/30 p-3"
      data-fc-launch-help-strip="1"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90">
          <Sparkles size={14} className="text-amber-300/90" aria-hidden />
          Ask Finely
        </span>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => {
            if (PUBLIC_DEMO_VIDEOS_ENABLED) {
              navigate('/resources/videos');
              return;
            }
            ask('watch how on this page');
          }}
        >
          Watch how
        </button>
        {supported ? (
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => (listening ? stop() : start())}
            aria-pressed={listening}
          >
            <Mic size={14} aria-hidden /> {listening ? 'Listening…' : 'Voice'}
          </button>
        ) : null}
      </div>
      {busy ? <p className="mt-2 text-xs text-white/50">Thinking…</p> : null}
      {reply ? <p className="mt-2 text-sm text-white/75 leading-relaxed">{reply}</p> : null}
    </div>
  );
}
