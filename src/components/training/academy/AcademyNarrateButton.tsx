import React, { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import {
  academyNarrateConfigured,
  academySpeechSynthesisAvailable,
  narrateViaBrowser,
  narrateViaProvider,
  stopAcademySpeech,
} from '../../../lib/academyNarrateClient';

export function AcademyNarrateButton({
  text,
  lang,
  label,
}: {
  text: string;
  lang: 'en' | 'ht';
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'idle' | 'playing'>('idle');
  const hasProvider = academyNarrateConfigured();
  const hasBrowser = academySpeechSynthesisAvailable();

  if (!text.trim()) return null;

  const play = async (useBrowser: boolean) => {
    setBusy(true);
    stopAcademySpeech();
    try {
      if (!useBrowser && hasProvider) {
        const url = await narrateViaProvider(text, lang);
        if (url) {
          const audio = new Audio(url);
          setMode('playing');
          audio.onended = () => {
            setMode('idle');
            URL.revokeObjectURL(url);
          };
          await audio.play();
          return;
        }
      }
      if (useBrowser && hasBrowser) {
        narrateViaBrowser(text, lang);
        setMode('playing');
        setTimeout(() => setMode('idle'), Math.min(120000, text.length * 45));
        return;
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      {hasProvider ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void play(false)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-100 text-xs font-semibold hover:bg-emerald-500/15 transition-all"
        >
          <Volume2 size={14} /> {label ?? (lang === 'ht' ? 'Koute (pwofesyonèl)' : 'Listen (narration)')}
        </button>
      ) : (
        <span className="text-white/45 text-xs px-2 py-1 rounded-lg border border-white/10 bg-black/20">
          {lang === 'ht' ? 'Vwa ap vini — li tèks la' : 'Voice coming — use read mode'}
        </span>
      )}
      {hasBrowser && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (mode === 'playing') {
              stopAcademySpeech();
              setMode('idle');
            } else void play(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-white/50 text-[11px] hover:text-white/70 border border-transparent hover:border-white/10"
          title={lang === 'ht' ? 'Vwa navigatè (robotik)' : 'Browser voice (often robotic)'}
        >
          {mode === 'playing' ? <MicOff size={12} /> : <Mic size={12} />}
          {lang === 'ht' ? 'Vwa debaz' : 'Basic voice'}
        </button>
      )}
    </div>
  );
}
