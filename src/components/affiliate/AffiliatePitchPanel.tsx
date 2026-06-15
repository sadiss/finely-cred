import React, { useMemo, useState } from 'react';
import { Copy, Sparkles } from 'lucide-react';
import { AF } from '../../config/affiliateProgram';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type PitchTone = 'friendly' | 'professional' | 'social';

const TONE_LABELS: Record<PitchTone, string> = {
  friendly: 'Friendly',
  professional: 'Professional',
  social: 'Short social post',
};

function buildPitch(args: { tone: PitchTone; referralUrl: string; audience?: string }): string {
  const url = args.referralUrl || AF.publicPath;
  const audience = args.audience?.trim() || 'people who want to fix their credit';
  if (args.tone === 'social') {
    return `Ready to take control of your credit? Finely Cred walks you step-by-step — monitoring, disputes, and letters. Start here: ${url}`;
  }
  if (args.tone === 'professional') {
    return `I partner with Finely Cred to help ${audience} improve credit profiles with a clear, guided workflow. If you want a structured path — not guesswork — book through my link: ${url}`;
  }
  return `Hey! If credit has been stressing you out, Finely Cred makes it simple — pick a monitoring service, upload your report, and follow plain steps to dispute errors. I use their tools for ${audience}. My link: ${url}`;
}

export function AffiliatePitchPanel({ referralUrl }: { referralUrl?: string }) {
  const [tone, setTone] = useState<PitchTone>('friendly');
  const [audience, setAudience] = useState('');
  const [copied, setCopied] = useState(false);

  const pitch = useMemo(
    () => buildPitch({ tone, referralUrl: referralUrl ?? AF.publicPath, audience }),
    [tone, referralUrl, audience],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pitch);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`fc-senior-simple space-y-4 ${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-violet-400" />
        <div>
          <div className="font-semibold">AI pitch helper</div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Compliance-friendly copy — edit before you post</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TONE_LABELS) as PitchTone[]).map((t) => (
          <button
            key={t}
            type="button"
            className={tone === t ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            onClick={() => setTone(t)}
          >
            {TONE_LABELS[t]}
          </button>
        ))}
      </div>

      <label className="block space-y-1">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Who is this for?</span>
        <input
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. my Instagram followers, small business owners"
          className={`${FINELY_OS_ENTITY_INPUT} w-full !py-3 !text-base`}
        />
      </label>

      <div className={`${FINELY_OS_ENTITY_BODY} rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 whitespace-pre-wrap`}>
        {pitch}
      </div>

      <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => void copy()}>
        <Copy size={16} /> {copied ? 'Copied!' : 'Copy pitch'}
      </button>
    </div>
  );
}
