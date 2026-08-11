import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { PC_RESTORE_BTN } from './personalCreditRestoreButtons';

type Props = {
  onStartFreeGuide: () => void;
  onBookSession: () => void;
};

export function PersonalCreditHeroShell({ onStartFreeGuide, onBookSession }: Props) {
  const [heroUrl, setHeroUrl] = useState('/marketing/personal-credit-hero.webp');

  useEffect(() => {
    const tryUrls = [
      '/marketing/personal-credit-hero.webp',
      '/marketing/personal-credit-hero.png',
      '/marketing/personal-credit-restore-hero-reference.png',
    ];
    let i = 0;
    const probe = () => {
      if (i >= tryUrls.length) return;
      const img = new Image();
      img.onload = () => setHeroUrl(tryUrls[i]);
      img.onerror = () => {
        i += 1;
        probe();
      };
      img.src = tryUrls[i];
    };
    probe();
  }, []);

  return (
    <header className="pc-restore-hero pc-restore-hero--bleed">
      <div className="pc-restore-hero-nav-band" aria-hidden />
      <div className="pc-restore-hero-bg" style={{ backgroundImage: `url(${heroUrl})` }} aria-hidden />
      <div className="pc-restore-hero-overlay" aria-hidden />
      <div className="pc-restore-hero-overlay-bottom" aria-hidden />

      <div className="pc-restore-hero-inner pc-restore-hero-inner--copy-only">
        <div className="space-y-4 min-w-0 max-w-xl">
          <p className="pc-restore-kicker">Solutions · Personal credit restoration</p>
          <h1 className="pc-restore-title">Restore your credit. Reclaim your future.</h1>
          <p className="pc-restore-lede">
            Professional dispute letters, three-bureau coverage, and step-by-step tracking — powered by the Finely Cred OS
            behind every step.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" className={PC_RESTORE_BTN.gold} onClick={onStartFreeGuide}>
              Start free guide <ArrowRight size={14} />
            </button>
            <button type="button" className={PC_RESTORE_BTN.platinum} onClick={onBookSession}>
              Book a session <ArrowRight size={14} />
            </button>
          </div>
          <p className="pc-restore-hero-compliance">
            Results vary · not legal advice · educational dispute workflow only
          </p>
        </div>
      </div>
    </header>
  );
}

export function PersonalCreditRestoreSpectrum() {
  const segs = [
    { bg: 'linear-gradient(90deg,#9b2d4a,#c45c2a)', label: 'Stabilize' },
    { bg: 'linear-gradient(90deg,#c45c2a,#b8860b)', label: 'Dispute' },
    { bg: 'linear-gradient(90deg,#b8860b,#1f7a5c)', label: 'Monitor' },
    { bg: 'linear-gradient(90deg,#1f7a5c,#3db896)', label: 'Build' },
    { bg: 'linear-gradient(90deg,#3db896,#d4af37)', label: 'Fund-ready' },
  ];

  return (
    <div className="min-w-0">
      <div className="pc-restore-spectrum" role="img" aria-label="Restore path from stabilize to fund-ready">
        {segs.map((s) => (
          <div key={s.label} className="pc-restore-spectrum-seg" style={{ background: s.bg }} />
        ))}
      </div>
      <div className="pc-restore-spectrum-labels">
        {segs.map((s) => (
          <span key={s.label}>{s.label}</span>
        ))}
      </div>
    </div>
  );
}

export function PersonalCreditCommandStrip({ onStartIntake }: { onStartIntake: () => void }) {
  return (
    <div className="pc-restore-command">
      <div className="min-w-0">
        <p className="pc-restore-hub-eyebrow">What to do next</p>
        <p className="pc-restore-hub-sub text-sm font-medium">
          Scroll for packages, how it works, and platform tools — or start intake now.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <button type="button" className={PC_RESTORE_BTN.emerald} onClick={onStartIntake}>
          Start intake
        </button>
      </div>
    </div>
  );
}
