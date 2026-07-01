import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Handshake,
  Lock,
  MapPin,
  Rocket,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
  BarChart3,
} from 'lucide-react';
import { FlashyIcon } from '../ui';
import type { FreeGuide } from '../../resources/freeGuides';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { LEAD_MAGNET_TRIAL_DAYS } from '../../lib/leadMagnetTrial';
import { getLeadAttribution } from '../../lib/leadAttribution';
import { normalizeOvernightCity } from '../../lib/overnight50Bridge';
import { DEFAULT_OVERNIGHT50_CITIES } from '../../features/overnight50/queryExpander';
import { getLeadMagnetPremiumProfile } from './leadMagnetPremiumProfiles';
import { getLeadMagnetVisualTheme, resolveLeadMagnetHeroImage, type LeadMagnetVisualTheme } from './leadMagnetVisualThemes';
import { LeadMagnetMediaStage } from './LeadMagnetMediaStage';
import { LeadMagnetUrgencyRail } from './LeadMagnetUrgencyRail';

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

const THEME_ICONS = {
  shield: Shield,
  building: Building2,
  chart: BarChart3,
  trending: TrendingUp,
  rocket: Rocket,
  zap: Zap,
  handshake: Handshake,
} as const;

function ThemeIcon({ theme }: { theme: LeadMagnetVisualTheme }) {
  const Icon = THEME_ICONS[theme.icon];
  return <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />;
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
  const heroImage = useMemo(() => resolveLeadMagnetHeroImage(config, theme), [config, theme]);
  const [trackId, setTrackId] = useState(profile?.tracks[0]?.id ?? '');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const geoCity = useMemo(() => normalizeOvernightCity(getLeadAttribution()?.geoCity), []);
  const selectedTrack = profile?.tracks.find((t) => t.id === trackId) ?? profile?.tracks[0];

  if (!profile) return null;

  const bentoSpans = ['col-span-6 sm:col-span-3', 'col-span-3 sm:col-span-2', 'col-span-3 sm:col-span-2', 'col-span-6 sm:col-span-4'];

  return (
    <div className={`lm-page min-h-screen pb-20 ${theme.meshClass}`}>
      <nav className="lm-nav sticky top-0 z-40">
        <div className="container mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <span className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] ${theme.navAccent}`}>
            <ThemeIcon theme={theme} />
            Finely Cred
          </span>
          <button
            type="button"
            onClick={onGoForm}
            className={`${theme.ctaClass} text-[11px] py-2.5 px-5`}
          >
            {ctaOverride ?? 'Get access'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      <LeadMagnetUrgencyRail config={config} trustLabel={trustLabel} accentRgb={theme.accentRgb} />

      <header className="lm-hero lm-hero-compact">
        <div className="lm-hero-bg" aria-hidden>
          <img src={heroImage} alt="" loading="eager" />
        </div>
        <div className={`lm-hero-veil bg-gradient-to-b ${theme.heroOverlay}`} aria-hidden />
        <div
          className="lm-hero-glow"
          style={{ background: `radial-gradient(circle, rgba(${theme.accentRgb},0.35) 0%, transparent 70%)` }}
          aria-hidden
        />

        <div className="lm-value-float hidden sm:block">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">Total value</div>
          <div className={`text-2xl font-black ${theme.headlineGradient}`}>${totalValue}+</div>
          <div className="text-[10px] font-semibold text-emerald-300 mt-0.5">Free · No card</div>
        </div>

        <div className="lm-hero-inner">
          <div className="lm-announce">
            <Sparkles className="w-3.5 h-3.5 text-white/70" />
            {config.urgencyText}
          </div>

          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] mb-5 ${theme.kickerClass}`}>
            <ThemeIcon theme={theme} />
            {theme.badge}
          </div>

          <h1 className="text-[clamp(2rem,6vw,3.75rem)] font-black leading-[1.02] tracking-tight text-white">
            {headlineOverride ?? (
              <>
                {config.heroHeadline}{' '}
                <span className={`block mt-2 ${theme.headlineGradient}`}>{config.heroHighlight}</span>
                <span className="block mt-3 text-[clamp(1rem,2.8vw,1.35rem)] font-semibold text-white/72 leading-snug">
                  {config.heroSub || theme.tagline}
                </span>
              </>
            )}
          </h1>

          <p className="mt-5 mx-auto max-w-xl text-base sm:text-lg text-white/58 leading-relaxed">{guide.desc}</p>

          {geoCity ? (
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-white/50">
              <MapPin className="w-3.5 h-3.5" />
              Serving <span className="text-white/80 font-semibold">{geoCity}</span> metro
            </p>
          ) : (
            <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-white/35">
              {DEFAULT_OVERNIGHT50_CITIES.slice(0, 3).join(' · ')} + nationwide
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto">
            {profile.heroProof.map((line) => (
              <div key={line} className="lm-proof-chip flex-1 min-w-[140px] max-w-[220px]">
                {line}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={onGoForm}
              className={`${theme.ctaClass} text-sm sm:text-base py-4 px-10`}
            >
              {ctaOverride ?? profile.captureHeadline}
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-white/42 inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              {trustLabel} partners · {staffName}, {staffTitle}
            </p>
          </div>

          <div className="lm-value-float sm:hidden">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">Total value</div>
            <div className={`text-xl font-black ${theme.headlineGradient}`}>${totalValue}+ free</div>
          </div>
        </div>
      </header>

      <LeadMagnetMediaStage
        config={config}
        guide={guide}
        theme={theme}
        totalValue={totalValue}
        heroImage={heroImage}
        onGoForm={onGoForm}
      />

      <section className="lm-stat-band py-8 mt-4">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className={`lm-stat-num ${theme.headlineGradient}`}>${totalValue}+</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Kit value</div>
            </div>
            <div>
              <div className={`lm-stat-num ${theme.headlineGradient}`}>{LEAD_MAGNET_TRIAL_DAYS}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Day portal</div>
            </div>
            <div>
              <div className={`lm-stat-num ${theme.headlineGradient}`}>$0</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/40">No card</div>
            </div>
            <div>
              <div className={`lm-stat-num ${theme.headlineGradient}`}>{trustLabel}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Partners</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35 mb-4">The real problem</p>
        <h2 className="text-2xl sm:text-4xl font-black text-white max-w-2xl mx-auto leading-tight">
          {profile.problemTitle}
        </h2>
        <p className="mt-5 text-base sm:text-lg text-white/55 max-w-xl mx-auto leading-relaxed">{profile.problemBody}</p>
        <div className="lm-scroll-row mt-10 justify-start sm:justify-center px-1">
          {profile.painPoints.map((p) => (
            <div key={p} className="lm-scroll-card text-sm text-white/75 font-medium leading-relaxed">
              {p}
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 sm:px-6 pb-14 sm:pb-20">
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35 mb-3">What you unlock</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Inside the kit</h2>
        </div>
        <div className="lm-bento">
          {profile.chapters.map((ch, i) => (
            <article
              key={ch.title}
              className={`lm-bento-card ${bentoSpans[i] ?? 'col-span-3'} ${theme.cardGlow}`}
            >
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">
                0{i + 1}
              </div>
              <h3 className="font-black text-lg sm:text-xl text-white mb-2">{ch.title}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{ch.bullets[0]}</p>
            </article>
          ))}
        </div>
        <div className="lm-scroll-row mt-4">
          {profile.bonusTools.map((tool) => (
            <div key={tool.title} className="lm-scroll-card">
              <div className={`text-xs font-black uppercase tracking-wider mb-2 ${theme.navAccent}`}>Bonus</div>
              <div className="font-bold text-white mb-1">{tool.title}</div>
              <p className="text-xs text-white/55 leading-relaxed">{tool.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 sm:px-6 pb-14 sm:pb-20">
        <div className={`lm-glass-panel p-6 sm:p-10 text-center ${theme.cardGlow}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35 mb-3">Your path</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-6">Choose your starting lane</h2>
          <div className="flex gap-2 overflow-x-auto justify-start sm:justify-center pb-2 -mx-1 px-1">
            {profile.tracks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTrackId(t.id)}
                className={`lm-path-pill ${trackId === t.id ? 'is-active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {selectedTrack ? (
            <div className="mt-8 max-w-2xl mx-auto rounded-2xl border border-white/10 bg-black/25 p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">{selectedTrack.promise}</h3>
              <p className="mt-3 text-sm text-white/50">Best for {selectedTrack.bestFor}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {selectedTrack.plan.map((step) => (
                  <span
                    key={step}
                    className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white/75"
                  >
                    {step}
                  </span>
                ))}
              </div>
              <button type="button" onClick={onGoForm} className={`${theme.ctaClass} mt-8 text-sm py-3.5 px-8`}>
                Start this path <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.28em] text-white/35 mb-6">Your timeline</p>
        <div className="lm-timeline justify-center">
          {profile.timeline.map((item) => (
            <div key={item.step} className="lm-timeline-step">
              <div className={`text-sm font-black mb-2 ${theme.headlineGradient}`}>{item.step}</div>
              <p className="text-xs text-white/60 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fg-capture" className="container mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 scroll-mt-24">
        <div className="lm-capture-urgency mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-orange-100">
            <Sparkles className="w-3.5 h-3.5" />
            Your kit is reserved for this session — unlock before the timer ends
          </span>
        </div>
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-400/90 mb-3">Instant unlock</p>
          <h2 className="text-2xl sm:text-4xl font-black text-white">{profile.captureHeadline}</h2>
          <p className="mt-3 text-sm sm:text-base text-white/55 max-w-md mx-auto">{profile.captureSub}</p>
        </div>
        <div className={`lm-capture-shell ${theme.cardGlow}`}>
          <div className="text-center mb-6 pb-6 border-b border-white/[0.08]">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-sm font-black text-white mb-3">
              {staffName.slice(0, 2).toUpperCase()}
            </div>
            <div className="font-bold text-white">{staffName}</div>
            <div className="text-xs text-white/45">{staffTitle} · assigned on unlock</div>
          </div>
          {captureForm}
          <p className="mt-5 text-center text-[10px] text-white/35 uppercase tracking-wider">
            Secure · Educational only · {LEAD_MAGNET_TRIAL_DAYS}-day portal preview
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.28em] text-white/35 mb-6">Portal preview includes</p>
        <div className="lm-scroll-row lm-feature-rail justify-center">
          {config.features.map((f) => (
            <div key={f.title} className="lm-feature-tile">
              <FlashyIcon icon={f.icon} color={profile.accent} size="xs" className="!w-9 !h-9 mb-3" />
              <div className="font-bold text-sm text-white mb-1">{f.title}</div>
              <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {profile.faqs.length > 0 ? (
        <section className="container mx-auto max-w-6xl px-4 sm:px-6 pb-14">
          <h2 className="text-center text-xl font-black text-white mb-6">Questions</h2>
          <div className="grid sm:grid-cols-2 gap-2 max-w-4xl mx-auto">
            {profile.faqs.map((faq, i) => (
              <div key={faq.q} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-semibold text-white"
                >
                  {faq.q}
                  <ChevronDown className={`w-4 h-4 shrink-0 text-white/40 transition ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i ? <p className="px-4 pb-4 text-xs text-white/55 leading-relaxed">{faq.a}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="overflow-hidden py-6 border-t border-white/[0.06]">
        <div className="lm-cert-marquee px-4">
          {[...config.trustCerts, ...config.trustCerts].map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 whitespace-nowrap"
            >
              {c}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
