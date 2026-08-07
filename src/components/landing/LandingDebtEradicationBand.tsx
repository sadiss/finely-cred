/** Homepage — cinematic debt & summons highlight band. */
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Reveal } from '../ui';
import { finelyOsLandingContrastSection } from '../../features/os/finelyOsLightUi';
import { LandingTypewriterTitle } from './LandingTypewriterTitle';
import { LandingSellAtmosphere } from './LandingSellAtmosphere';
import './landingSellBands.css';

import { DEBT_GUIDE_MOCKUP_STANDUP_SRC } from '../../pages/leadmagnet/debtGuideMockupAssets';

export function LandingDebtEradicationBand() {
  const navigate = useNavigate();

  return (
    <section
      id="debt-eradication"
      className={`fc-sell py-16 sm:py-20 relative overflow-hidden ${finelyOsLandingContrastSection('fc-band-dark')}`}
      data-fc-contrast-band="1"
    >
      <LandingSellAtmosphere tone="navy" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#e0b24a]/30 bg-gradient-to-br from-[#060c2f]/90 via-[#0a1628]/85 to-[#020618]/95 px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.75)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_90%_10%,rgba(224,178,74,0.16),transparent_60%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_0%_100%,rgba(163,230,53,0.08),transparent_55%)] pointer-events-none" />
            <div className="fc-sell-champagne-card__sheen opacity-40" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 xl:gap-14">
              {/* Copy — left */}
              <div className="min-w-0 text-center lg:text-left">
                <p className="fc-sell-kicker mb-5">Debt &amp; summons</p>
                <LandingTypewriterTitle
                  text="Collections stacking? "
                  accentText="Take the playbook."
                  className="fc-sell-serif text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold leading-[1.08] text-white"
                  accentClassName="text-[#ffd993] italic"
                  speedMs={46}
                  delayMs={140}
                />
                <Reveal delay={220}>
                  <p className="mt-5 text-base sm:text-lg text-white/58 leading-relaxed max-w-xl mx-auto lg:mx-0">
                    When collectors call, summons arrive, or foreclosure pressure builds — you need a clear sequence, not
                    guesswork. The free debt &amp; summons guide maps validation, defense posture, and rebuild steps for
                    partners ready to move.
                  </p>
                </Reveal>
                <Reveal delay={360}>
                  <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/free-debt-guide')}
                      className="fc-sell-cta-gold w-full sm:w-auto"
                    >
                      Get free debt guide <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/free-debt-guide/read')}
                      className="fc-sell-cta-ghost w-full sm:w-auto"
                    >
                      Read all 9 pages free
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/enlightenment-session')}
                      className="fc-sell-cta-ghost w-full sm:w-auto"
                    >
                      Book a session
                    </button>
                  </div>
                  <p className="fc-sell-compliance mt-5">Results vary · not legal advice · not outcome guarantees</p>
                </Reveal>
              </div>

              {/* Mockup — right, beside writing */}
              <Reveal delay={180}>
                <div className="fc-sell-debt-mockup relative mx-auto w-full max-w-[28rem] lg:max-w-none">
                  <div className="fc-sell-debt-mockup__glow" aria-hidden />
                  <div className="fc-sell-debt-mockup__halo" aria-hidden />
                  <img
                    src={DEBT_GUIDE_MOCKUP_STANDUP_SRC}
                    alt="Debt & summons free e-guide — Summons Snapshot and Response Path"
                    className="fc-sell-debt-mockup__img relative z-[1] w-full h-auto drop-shadow-[0_28px_60px_rgba(0,0,0,0.55)]"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="fc-sell-debt-mockup__pedestal" aria-hidden />
                </div>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
