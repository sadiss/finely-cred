import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Lock } from 'lucide-react';
import type { FreeGuide } from '../../resources/freeGuides';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { LEAD_MAGNET_TRIAL_DAYS } from '../../lib/leadMagnetTrial';
import { getLeadMagnetPremiumProfile } from './leadMagnetPremiumProfiles';
import {
  getLeadMagnetVisualTheme,
  resolveLeadMagnetHeroImage,
  resolveLeadMagnetVideoPoster,
} from './leadMagnetVisualThemes';
import { LeadMagnetMediaStage } from './LeadMagnetMediaStage';
import { LeadMagnetNavUrgency } from './LeadMagnetUrgencyRail';

type Props = {
  config: LeadMagnetFunnelConfig;
  guide: FreeGuide;
  onGoForm: () => void;
  headlineOverride?: string;
  ctaOverride?: string;
  trustLabel?: string;
  totalValue?: number;
  captureForm?: React.ReactNode;
  staffName: string;
  staffTitle: string;
};

export function UniversalPremiumLeadMagnetLanding({
  config,
  guide,
  onGoForm,
  headlineOverride,
  ctaOverride,
  trustLabel = '10k+',
  totalValue = 197,
  captureForm,
  staffName,
  staffTitle,
}: Props) {
  const profile = getLeadMagnetPremiumProfile(config);
  const theme = getLeadMagnetVisualTheme(config);
  const heroImage = useMemo(() => resolveLeadMagnetHeroImage(config, theme), [config, theme]);
  const videoPoster = useMemo(() => resolveLeadMagnetVideoPoster(config, theme), [config, theme]);
  const [trackId, setTrackId] = useState(profile?.tracks[0]?.id ?? '');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const selectedTrack = profile?.tracks.find((t) => t.id === trackId) ?? profile?.tracks[0];

  if (!profile) return null;

  const cta = ctaOverride ?? profile.captureHeadline;

  return (
    <div className={`lm-page min-h-screen pb-12 ${theme.meshClass}`}>
      <nav className="lm-nav sticky top-0 z-40">
        <div className="container mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <span className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${theme.navAccent}`}>
              Finely Cred · {theme.badge}
            </span>
            <LeadMagnetNavUrgency config={config} accentRgb={theme.accentRgb} />
          </div>
          <button type="button" onClick={onGoForm} className={`${theme.ctaClass} text-[11px] py-2 px-4 shrink-0`}>
            {ctaOverride ?? 'Get access'}
          </button>
        </div>
      </nav>

      <header className="lm-hero-pro">
        <div className="lm-hero-pro-bg" aria-hidden>
          <img src={heroImage} alt="" loading="eager" />
        </div>
        <div className={`lm-hero-pro-veil bg-gradient-to-b ${theme.heroOverlay}`} aria-hidden />

        <div className="container mx-auto max-w-3xl px-4 sm:px-6 relative z-10 pt-10 pb-6 text-center">
          <p className={`text-[11px] font-medium uppercase tracking-[0.2em] mb-4 ${theme.accentMuted}`}>
            {config.urgencyText}
          </p>

          <h1 className="text-[clamp(1.75rem,5vw,2.75rem)] font-semibold leading-[1.12] tracking-tight text-white">
            {headlineOverride ?? (
              <>
                {config.heroHeadline}{' '}
                <span className={`block mt-1.5 font-semibold ${theme.headlineGradient}`}>{config.heroHighlight}</span>
              </>
            )}
          </h1>

          <p className="mt-4 text-base text-white/55 max-w-lg mx-auto leading-relaxed">
            {config.heroSub || theme.tagline}
          </p>
        </div>
      </header>

      <LeadMagnetMediaStage
        config={config}
        guide={guide}
        theme={theme}
        totalValue={totalValue}
        videoPoster={videoPoster}
      />

      <div className="container mx-auto max-w-3xl px-4 sm:px-6 mt-8 text-center">
        <button type="button" onClick={onGoForm} className={`${theme.ctaClass} text-sm py-3.5 px-8`}>
          {cta}
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="mt-3 text-xs text-white/40">
          <Lock className="w-3 h-3 inline mr-1 -mt-0.5" />
          ${totalValue}+ value · {LEAD_MAGNET_TRIAL_DAYS}-day portal · {trustLabel} partners · {staffName}
        </p>
      </div>

      <section className="container mx-auto max-w-3xl px-4 sm:px-6 mt-12 lm-section">
        <h2 className="lm-section-title">{profile.problemTitle}</h2>
        <p className="lm-section-body">{profile.problemBody}</p>
      </section>

      <section className="container mx-auto max-w-3xl px-4 sm:px-6 mt-10 lm-section">
        <h2 className="lm-section-title">What&apos;s in the kit</h2>
        <ul className="lm-pro-list mt-5">
          {profile.chapters.map((ch) => (
            <li key={ch.title}>
              <span className="lm-pro-list-title">{ch.title}</span>
              <span className="lm-pro-list-desc">{ch.bullets[0]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="container mx-auto max-w-3xl px-4 sm:px-6 mt-10 lm-section">
        <h2 className="lm-section-title">Your path</h2>
        <div className="flex flex-wrap gap-x-1 gap-y-1 mt-4 border-b border-white/[0.08]">
          {profile.tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTrackId(t.id)}
              className={`lm-tab ${trackId === t.id ? 'is-active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {selectedTrack ? (
          <div className="mt-5">
            <p className="text-lg font-medium text-white leading-snug">{selectedTrack.promise}</p>
            <p className="mt-2 text-sm text-white/45">{selectedTrack.bestFor}</p>
          </div>
        ) : null}
      </section>

      <section id="fg-capture" className="container mx-auto max-w-md px-4 sm:px-6 mt-12 scroll-mt-20 lm-section">
        <h2 className="lm-section-title text-center">{profile.captureHeadline}</h2>
        <p className="lm-section-body text-center mt-2">{profile.captureSub}</p>
        <div className="lm-capture-pro mt-6">
          <p className="text-center text-xs text-white/40 mb-5 pb-5 border-b border-white/[0.06]">
            {staffName} · {staffTitle}
          </p>
          {captureForm}
        </div>
      </section>

      {profile.faqs.length > 0 ? (
        <section className="container mx-auto max-w-3xl px-4 sm:px-6 mt-10 mb-8">
          <h2 className="lm-section-title mb-4">Questions</h2>
          <div className="divide-y divide-white/[0.08] border-t border-b border-white/[0.08]">
            {profile.faqs.map((faq, i) => (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-sm font-medium text-white/90"
                >
                  {faq.q}
                  <ChevronDown className={`w-4 h-4 shrink-0 text-white/35 transition ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i ? <p className="pb-3.5 text-sm text-white/50 leading-relaxed">{faq.a}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="container mx-auto max-w-3xl px-4 sm:px-6 py-6 border-t border-white/[0.06]">
        <p className="text-[10px] text-white/30 text-center leading-relaxed">
          {config.trustCerts.join(' · ')}
        </p>
      </footer>
    </div>
  );
}
