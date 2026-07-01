import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Lock, Rocket, ShieldCheck } from 'lucide-react';
import { FinelyCredLogo } from '../brand/FinelyCredLogo';
import type { FreeGuide } from '../../resources/freeGuides';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { LEAD_MAGNET_TRIAL_DAYS } from '../../lib/leadMagnetTrial';
import { getLeadMagnetPremiumProfile } from './leadMagnetPremiumProfiles';
import { getLeadMagnetFlyerContent } from './leadMagnetFlyerContent';
import {
  getLeadMagnetVisualTheme,
  resolveLeadMagnetHeroImage,
  resolveLeadMagnetVideoPoster,
  themeCssVars,
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
  const flyer = getLeadMagnetFlyerContent(config);
  const heroImage = useMemo(() => resolveLeadMagnetHeroImage(config, theme), [config, theme]);
  const videoPoster = useMemo(() => resolveLeadMagnetVideoPoster(config, theme), [config, theme]);
  const cssVars = useMemo(() => themeCssVars(theme), [theme]);
  const powerLines = useMemo(() => flyer.powerLine.split('. ').filter(Boolean), [flyer.powerLine]);
  const [trackId, setTrackId] = useState(profile?.tracks[0]?.id ?? '');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const selectedTrack = profile?.tracks.find((t) => t.id === trackId) ?? profile?.tracks[0];

  if (!profile) return null;

  const cta = ctaOverride ?? profile.captureHeadline;
  const { accentRgb } = theme.colors;

  return (
    <div
      className={`lm-page lm-flyer-page min-h-screen pb-10 ${theme.meshClass}`}
      data-lm-theme={theme.id}
      style={cssVars}
    >
      <nav className="lm-nav sticky top-0 z-40">
        <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <FinelyCredLogo size="sm" forceLight />
            <LeadMagnetNavUrgency config={config} accentRgb={accentRgb} />
          </div>
          <button type="button" onClick={onGoForm} className="lm-cta-theme shrink-0">
            Get access <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <header className="lm-flyer-hero-band">
        <div className="lm-flyer-hero-band-img">
          <img src={heroImage} alt={theme.heroImageAlt} loading="eager" />
          <div className="lm-flyer-hero-band-overlay" />
        </div>
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 relative z-[2]">
          <div className="lm-flyer-hero-band-grid">
            <div className="lm-flyer-hero-copy">
              <p className="lm-flyer-category">{flyer.categoryLabel}</p>
              <h1 className="lm-flyer-headline">
                {headlineOverride ?? (
                  <>
                    {powerLines.map((line, i) => (
                      <span key={line} className={i === 0 ? 'lm-text-theme-gradient' : ''}>
                        {line}.
                        {i < powerLines.length - 1 ? <br /> : null}
                      </span>
                    ))}
                  </>
                )}
              </h1>
              <div className="lm-flyer-pill">{config.urgencyText}</div>
              <p className="lm-flyer-sub">
                {config.heroHeadline}{' '}
                <strong className="lm-flyer-highlight">{config.heroHighlight}</strong> {config.heroSub}
              </p>
              <p className="lm-flyer-desc">{guide.desc}</p>
            </div>

            <div className="lm-flyer-hero-thumb" aria-hidden>
              <img src={heroImage} alt="" loading="lazy" />
              <div className="lm-flyer-hero-thumb-overlay" />
            </div>
          </div>
        </div>
      </header>

      <LeadMagnetMediaStage
        config={config}
        guide={guide}
        theme={theme}
        profile={profile}
        totalValue={totalValue}
        videoPoster={videoPoster}
        benefitsTitle={flyer.benefitsTitle}
        taglineBar={flyer.taglineBar}
        onGoForm={onGoForm}
      />

      <section className="container mx-auto max-w-6xl px-4 sm:px-6 mt-10">
        <h2 className="lm-flyer-section-title">{flyer.processTitle}</h2>
        <div className="lm-process-rail">
          {flyer.process.map((step, i) => (
            <div key={step.title} className="lm-process-step">
              <div className="lm-process-icon">{step.label}</div>
              <p className="lm-process-label">{step.title}</p>
              {i < flyer.process.length - 1 ? <span className="lm-process-arrow" aria-hidden /> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 sm:px-6 mt-10">
        <div className="lm-dual-panel">
          <div className="lm-results-panel">
            <h3 className="lm-panel-title">{flyer.resultsTitle}</h3>
            <div className="lm-metrics-grid">
              {flyer.metrics.map((m) => (
                <div key={m.label} className="lm-metric">
                  <div className="lm-metric-value lm-metric-value-accent">{m.value}</div>
                  <div className="lm-metric-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lm-access-panel">
            <h3 className="lm-panel-title lm-panel-title-light">{flyer.accessTitle}</h3>
            <div className="lm-access-grid">
              {flyer.access.map((item) => (
                <div key={item.title} className="lm-access-item">
                  <div className="lm-access-icon" />
                  <div className="lm-access-title">{item.title}</div>
                  <div className="lm-access-desc">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 sm:px-6 mt-10">
        <h2 className="lm-flyer-section-title">{flyer.foundationTitle}</h2>
        <div className="lm-foundation-row">
          {flyer.foundation.map((f) => (
            <div key={f.title} className="lm-foundation-item">
              <div className="lm-foundation-icon" />
              <div className="lm-foundation-title">{f.title}</div>
              <p className="lm-foundation-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 sm:px-6 mt-10">
        <h2 className="lm-flyer-section-title">Inside the kit</h2>
        <ul className="lm-kit-grid">
          {profile.chapters.map((ch, i) => (
            <li key={ch.title}>
              <span className="lm-kit-num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="lm-kit-title">{ch.title}</div>
                <div className="lm-kit-desc">{ch.bullets[0]}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="container mx-auto max-w-6xl px-4 sm:px-6 mt-8">
        <h2 className="lm-flyer-section-title">Choose your path</h2>
        <div className="flex flex-wrap gap-2 mt-4">
          {profile.tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTrackId(t.id)}
              className={`lm-track-chip ${trackId === t.id ? 'is-active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {selectedTrack ? (
          <p className="mt-4 text-lg text-white/80 font-medium">{selectedTrack.promise}</p>
        ) : null}
      </section>

      <section className="container mx-auto max-w-6xl px-4 sm:px-6 mt-10">
        <div className="lm-cta-banner">
          <div>
            <h2 className="lm-cta-banner-headline">{flyer.ctaBannerLine}</h2>
            <p className="lm-cta-banner-sub">{flyer.ctaBannerSub}</p>
          </div>
          <button type="button" onClick={onGoForm} className="lm-cta-theme lm-cta-theme-lg lm-cta-banner-btn">
            <Rocket className="w-5 h-5" />
            {cta}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <section id="fg-capture" className="container mx-auto max-w-lg px-4 sm:px-6 mt-10 scroll-mt-24">
        <h2 className="lm-flyer-section-title text-center">{profile.captureHeadline}</h2>
        <p className="text-center text-base text-white/55 mt-2 mb-6">{profile.captureSub}</p>
        <div className="lm-capture-card">
          <p className="text-center text-sm text-white/50 mb-5 pb-5 border-b border-white/10">
            {staffName} · {staffTitle}
          </p>
          {captureForm}
          <p className="mt-4 text-center text-xs text-white/40">
            <Lock className="w-3 h-3 inline mr-1" />
            ${totalValue}+ value · {LEAD_MAGNET_TRIAL_DAYS}-day portal · {trustLabel} partners
          </p>
        </div>
      </section>

      {profile.faqs.length > 0 ? (
        <section className="container mx-auto max-w-3xl px-4 sm:px-6 mt-10">
          <h2 className="lm-flyer-section-title mb-4">Questions</h2>
          <div className="lm-faq-list">
            {profile.faqs.map((faq, i) => (
              <div key={faq.q} className="lm-faq-item">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="lm-faq-trigger"
                >
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 shrink-0 transition ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i ? <p className="lm-faq-answer">{faq.a}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="container mx-auto max-w-6xl px-4 sm:px-6 mt-10 py-8 border-t border-white/10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <ShieldCheck className="w-10 h-10 lm-footer-shield" />
          <div>
            <p className="text-sm font-semibold text-white/80">100% legit · Secure process · Dedicated support</p>
            <p className="text-xs text-white/40 mt-1">{config.trustCerts.join(' · ')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
