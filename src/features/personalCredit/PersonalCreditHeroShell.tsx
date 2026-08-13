import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { LandingTypewriterTitle } from '../../components/landing/LandingTypewriterTitle';
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
        <div className="space-y-4 min-w-0 max-w-xl" data-fc-contrast-band="1">
          <p className="pc-restore-kicker">Solutions · Personal credit restoration</p>
          <LandingTypewriterTitle
            as="h1"
            text="Restore your credit. "
            accentText="Reclaim your future."
            className="pc-restore-title pc-restore-title--playfair text-white"
            accentClassName="text-emerald-200 italic"
            speedMs={34}
            caret
          />
          <p className="pc-restore-lede">
            Professional dispute letters, three-bureau coverage, and step-by-step tracking — powered by the Finely Cred OS
            behind every step.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" className={PC_RESTORE_BTN.emerald} onClick={onStartFreeGuide}>
              Start free guide <ArrowRight size={14} />
            </button>
            <button type="button" className={PC_RESTORE_BTN.sky} onClick={onBookSession}>
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
    { cls: 'pc-restore-spectrum-seg--poor', label: 'Stabilize' },
    { cls: 'pc-restore-spectrum-seg--fair', label: 'Dispute' },
    { cls: 'pc-restore-spectrum-seg--good', label: 'Monitor' },
    { cls: 'pc-restore-spectrum-seg--verygood', label: 'Build' },
    { cls: 'pc-restore-spectrum-seg--excellent', label: 'Fund-ready' },
  ];

  return (
    <div className="min-w-0 pc-restore-spectrum-wrap">
      <div className="pc-restore-spectrum pc-restore-spectrum--animated" role="img" aria-label="Restore path from stabilize to fund-ready">
        {segs.map((s) => (
          <div key={s.label} className={`pc-restore-spectrum-seg ${s.cls}`} />
        ))}
        <div className="pc-restore-spectrum-sweep" aria-hidden />
        <div className="pc-restore-spectrum-sweep pc-restore-spectrum-sweep--comet" aria-hidden />
        <div className="pc-restore-spectrum-sweep pc-restore-spectrum-sweep--glow" aria-hidden />
      </div>
      <div className="pc-restore-spectrum-labels">
        {segs.map((s) => (
          <span key={s.label}>{s.label}</span>
        ))}
      </div>
    </div>
  );
}

export function PersonalCreditCommandStrip({
  onComparePackages,
  onStartFreeGuide,
}: {
  onComparePackages: () => void;
  onStartFreeGuide: () => void;
}) {
  return (
    <div className="pc-restore-command">
      <div className="min-w-0">
        <p className="pc-restore-hub-eyebrow">What to do next</p>
        <p className="pc-restore-hub-sub text-sm font-medium">
          New here? Compare restore packages below or start with the free guide — no credit report or dashboard required yet.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <button type="button" className={PC_RESTORE_BTN.emerald} onClick={onComparePackages}>
          Compare packages
        </button>
        <button type="button" className={PC_RESTORE_BTN.ghost} onClick={onStartFreeGuide}>
          Start free guide
        </button>
      </div>
    </div>
  );
}

export type PersonalCreditRestorePath = 'dfy' | 'diy';

export function PersonalCreditPathSwitcher({
  value,
  onChange,
}: {
  value: PersonalCreditRestorePath;
  onChange: (path: PersonalCreditRestorePath) => void;
}) {
  return (
    <div className="pc-restore-path-switch" role="tablist" aria-label="Restore package path">
      <button
        type="button"
        role="tab"
        aria-selected={value === 'dfy'}
        className={`pc-restore-path-switch__btn ${value === 'dfy' ? 'pc-restore-path-switch__btn--active pc-restore-path-switch__btn--dfy' : ''}`}
        onClick={() => onChange('dfy')}
      >
        <span className="pc-restore-path-switch__label">Done for you</span>
        <span className="pc-restore-path-switch__hint">We dispute, track, and escalate on your file</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'diy'}
        className={`pc-restore-path-switch__btn ${value === 'diy' ? 'pc-restore-path-switch__btn--active pc-restore-path-switch__btn--diy' : ''}`}
        onClick={() => onChange('diy')}
      >
        <span className="pc-restore-path-switch__label">Do it yourself</span>
        <span className="pc-restore-path-switch__hint">Templates, letter packs, and platform tools</span>
      </button>
    </div>
  );
}
