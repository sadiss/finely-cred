import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Lock,
  MapPin,
  Sparkles,
  Star,
} from 'lucide-react';
import { FlashyIcon } from '../ui';
import type { FreeGuide } from '../../resources/freeGuides';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { LEAD_MAGNET_TRIAL_DAYS } from '../../lib/leadMagnetTrial';
import { getLeadAttribution } from '../../lib/leadAttribution';
import { normalizeOvernightCity } from '../../lib/overnight50Bridge';
import { DEFAULT_OVERNIGHT50_CITIES } from '../../features/overnight50/queryExpander';
import { getLeadMagnetPremiumProfile } from './leadMagnetPremiumProfiles';
import { getLeadMagnetVisualTheme } from './leadMagnetVisualThemes';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { finelyOsCatalogCard } from '../../features/os/finelyOsLightUi';

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

function HeroSection({
  theme,
  config,
  guide,
  headlineOverride,
  ctaOverride,
  profile,
  trustLabel,
  staffName,
  staffTitle,
  onGoForm,
  totalValue,
}: {
  theme: ReturnType<typeof getLeadMagnetVisualTheme>;
  config: LeadMagnetFunnelConfig;
  guide: FreeGuide;
  headlineOverride?: string;
  ctaOverride?: string;
  profile: NonNullable<ReturnType<typeof getLeadMagnetPremiumProfile>>;
  trustLabel: string;
  staffName: string;
  staffTitle: string;
  onGoForm: () => void;
  totalValue: number;
}) {
  const headline = (
    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.02] tracking-tight">
      {headlineOverride ?? (
        <>
          {config.heroHeadline}{' '}
          <span className={theme.headlineGradient}>{config.heroHighlight}</span>{' '}
          <span className="text-white/90">{config.heroSub}</span>
        </>
      )}
    </h1>
  );

  const proof = (
    <ul className="space-y-2.5 mt-6">
      {profile.heroProof.map((line) => (
        <li key={line} className="flex items-start gap-2.5 text-sm sm:text-base text-white/85">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          {line}
        </li>
      ))}
    </ul>
  );

  const cta = (
  <button
    type="button"
    onClick={onGoForm}
    className={`${theme.ctaClass} text-base sm:text-lg font-black py-4 px-8 rounded-2xl inline-flex items-center gap-3 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
  >
    {ctaOverride ?? profile.captureHeadline}
    <ArrowRight className="w-5 h-5" />
  </button>
  );

  if (theme.heroLayout === 'full-bleed') {
    return (
      <header className="relative min-h-[72vh] flex items-end overflow-hidden">
        <img src={theme.heroImage} alt={theme.heroImageAlt} className="absolute inset-0 h-full w-full object-cover" loading="eager" />
        <div className={`absolute inset-0 bg-gradient-to-t ${theme.heroOverlay}`} />
        <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 pb-12 pt-32 w-full">
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-widest mb-6 ${theme.kickerClass}`}>
            <span className="text-lg">{theme.decorativeEmoji}</span> {theme.badge}
          </div>
          {headline}
          <p className="mt-4 text-lg text-white/75 max-w-2xl">{theme.tagline}</p>
          <p className="mt-2 text-white/55 max-w-xl">{guide.desc}</p>
          {proof}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {cta}
            <span className="text-xs text-white/45 inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> {trustLabel} partners · ${totalValue}+ stack
            </span>
          </div>
        </div>
      </header>
    );
  }

  const imageCol = (
    <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl min-h-[320px] lg:min-h-[480px]">
      <img src={theme.heroImage} alt={theme.heroImageAlt} className="absolute inset-0 h-full w-full object-cover" loading="eager" />
      <div className={`absolute inset-0 bg-gradient-to-tr ${theme.heroOverlay}`} />
      <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md p-4">
        <div className="text-[10px] uppercase tracking-widest text-white/50">Included</div>
        <div className="font-black text-white mt-1">{guide.title}</div>
        <div className="text-emerald-300 text-sm font-bold mt-1">${totalValue}+ value · Free</div>
      </div>
    </div>
  );

  const copyCol = (
    <div className={`rounded-[2rem] border border-white/10 bg-black/35 backdrop-blur-sm p-6 sm:p-10 ${theme.cardGlow}`}>
      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest mb-5 ${theme.kickerClass}`}>
        <span>{theme.decorativeEmoji}</span> {theme.badge}
      </div>
      {headline}
      <p className="mt-4 text-white/65 text-lg">{theme.tagline}</p>
      {proof}
      <div className="mt-8">{cta}</div>
      <p className="mt-3 text-xs text-white/45">
        {staffName}, {staffTitle} · No card required
      </p>
    </div>
  );

  return (
    <header className="container mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-4">
      <div className={`grid lg:grid-cols-2 gap-8 items-center ${theme.heroLayout === 'split-photo-left' ? '' : ''}`}>
        {theme.heroLayout === 'split-photo-left' ? (
          <>
            {imageCol}
            {copyCol}
          </>
        ) : (
          <>
            {copyCol}
            {imageCol}
          </>
        )}
      </div>
    </header>
  );
}

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
  const [trackId, setTrackId] = useState(profile?.tracks[0]?.id ?? '');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const geoCity = useMemo(() => normalizeOvernightCity(getLeadAttribution()?.geoCity), []);
  const selectedTrack = profile?.tracks.find((t) => t.id === trackId) ?? profile?.tracks[0];

  if (!profile) return null;

  return (
    <div className={`min-h-screen pb-16 ${theme.meshClass}`}>
      <nav className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#070b10]/92 backdrop-blur-xl">
        <div className="container mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className={`text-[11px] font-black uppercase tracking-[0.22em] ${theme.navAccent}`}>
            {theme.decorativeEmoji} Finely Cred · {theme.badge}
          </span>
          <button type="button" onClick={onGoForm} className={`${theme.ctaClass} text-xs sm:text-sm py-2.5 px-5 rounded-xl inline-flex items-center gap-2 font-bold`}>
            {ctaOverride ?? 'Get access'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <div className="fg-urgency-bar text-white text-center py-2.5 px-4 font-bold text-xs tracking-wider">
        <span className="inline-flex items-center justify-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
          {config.urgencyText}
        </span>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-4">
        {geoCity ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs text-white/80">
            <MapPin className="w-3.5 h-3.5" /> Serving <strong className="text-white">{geoCity}</strong> metro
          </div>
        ) : (
          <div className="text-[10px] uppercase tracking-widest text-white/35">
            Live in {DEFAULT_OVERNIGHT50_CITIES.slice(0, 3).join(' · ')} + nationwide
          </div>
        )}
      </div>

      <HeroSection
        theme={theme}
        config={config}
        guide={guide}
        headlineOverride={headlineOverride}
        ctaOverride={ctaOverride}
        profile={profile}
        trustLabel={trustLabel}
        staffName={staffName}
        staffTitle={staffTitle}
        onGoForm={onGoForm}
        totalValue={totalValue}
      />

      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className={`rounded-[2rem] border border-white/10 bg-black/40 p-8 sm:p-10 ${theme.cardGlow}`}>
          <h2 className="text-2xl sm:text-4xl font-black text-white">{profile.problemTitle}</h2>
          <p className="mt-4 text-white/65 text-lg max-w-3xl">{profile.problemBody}</p>
          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            {profile.painPoints.map((p) => (
              <div key={p} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80">
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-8">Inside the kit</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {profile.chapters.map((ch, i) => (
            <article key={ch.title} className={`rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6 ${theme.cardGlow}`}>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-2">Chapter {i + 1}</div>
              <h3 className="font-black text-xl text-white mb-3">{ch.title}</h3>
              <ul className="space-y-2 text-sm text-white/70">
                {ch.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <h2 className="text-2xl font-black text-white mb-2">Choose your path</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTrackId(t.id)}
              className={
                'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider border transition ' +
                (trackId === t.id ? 'border-white/40 bg-white/15 text-white' : 'border-white/10 text-white/50 hover:bg-white/5')
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        {selectedTrack ? (
          <div className={`rounded-2xl border border-white/10 p-6 sm:p-8 ${theme.cardGlow} bg-black/30`}>
            <h3 className="text-xl sm:text-2xl font-black text-white">{selectedTrack.promise}</h3>
            <p className="mt-2 text-white/60">Best for: {selectedTrack.bestFor}</p>
            <ol className="mt-6 grid sm:grid-cols-3 gap-4">
              {selectedTrack.plan.map((step, i) => (
                <li key={step} className="rounded-xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/80">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Step {i + 1}</span>
                  <div className="mt-2 font-medium">{step}</div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-black text-white mb-6">{LEAD_MAGNET_TRIAL_DAYS}-day portal preview</h2>
            <ul className="space-y-3 mb-8">
              {profile.portalHighlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-white/75">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {h}
                </li>
              ))}
            </ul>
            <FinelyOsPaginatedStack
              items={[...config.features]}
              pageSize={4}
              itemSpacingClassName="grid sm:grid-cols-2 gap-3"
              renderItem={(f) => (
                <div key={f.title} className={`${finelyOsCatalogCard(profile.accent)} !p-4`} data-fc-accent={profile.accent}>
                  <FlashyIcon icon={f.icon} color={profile.accent} size="xs" className="!w-8 !h-8 mb-2" />
                  <div className="font-bold text-sm mb-1">{f.title}</div>
                  <div className="text-xs opacity-75">{f.desc}</div>
                </div>
              )}
            />
          </div>
          <div id="fg-capture" className={`rounded-[2rem] border border-white/15 bg-black/45 p-6 sm:p-8 scroll-mt-28 ${theme.cardGlow}`}>
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-2">Instant unlock</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{profile.captureHeadline}</h2>
            <p className="text-sm text-white/60 mb-6">{profile.captureSub}</p>
            {captureForm}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <h2 className="text-xl font-black text-white mb-4">FAQ</h2>
        <div className="space-y-2 max-w-3xl">
          {profile.faqs.map((faq, i) => (
            <div key={faq.q} className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-3 p-4 text-left font-semibold text-white text-sm">
                {faq.q}
                <ChevronDown className={`w-5 h-5 shrink-0 transition ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i ? <p className="px-4 pb-4 text-sm text-white/65">{faq.a}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 sm:px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          {config.trustCerts.map((c) => (
            <span key={c} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-widest text-white/45">
              {c}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
