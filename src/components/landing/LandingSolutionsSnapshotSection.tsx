/** Homepage — Done-for-you / Solutions snapshot on platinum champagne band. */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Shield, Trophy, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Reveal } from '../ui';
import { finelyOsLandingPlatinumSection } from '../../features/os/finelyOsLightUi';
import { LandingTypewriterTitle } from './LandingTypewriterTitle';
import { LandingSellAtmosphere } from './LandingSellAtmosphere';
import './landingSellBands.css';

const CARDS = [
  {
    title: 'DIY',
    range: 'Tools + templates',
    note: 'Move fast with letter kits, dispute workflows, and portal access — built for disciplined partners.',
    Icon: Zap,
    featured: false,
    points: ['Letter kits & guides', 'Self-paced portal tools'],
  },
  {
    title: 'Done-For-You',
    range: 'Execution + support',
    note: 'We build the packets, strategy, and tracking — so you stay in command without the busywork.',
    Icon: Shield,
    featured: true,
    points: ['Strategy + dispute packets', 'Round tracking & responses', 'Dedicated specialist support'],
  },
  {
    title: 'Wealth Builder',
    range: 'Funding pathways',
    note: 'From credit stability to capital readiness — sequenced next steps, not guesswork.',
    Icon: Trophy,
    featured: false,
    points: ['Fundability sequencing', 'Tradelines when appropriate'],
  },
] as const;

type Props = {
  onViewPricing: () => void;
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

/** Dual-path spotlight: DIY ↔ Done-For-You — one animated pair per viewport. */
function DiyDfySwitcher() {
  const phrases = ['DIY', 'Done-For-You'] as const;
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || prefersReducedMotion()) return;
    const t = window.setInterval(() => setIdx((n) => (n + 1) % phrases.length), 2600);
    return () => window.clearInterval(t);
  }, [visible, phrases.length]);

  return (
    <div
      ref={ref}
      className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-[#e0b24a]/35 bg-[#0c1228]/55 px-4 py-2 backdrop-blur-sm"
      aria-live="polite"
    >
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Path</span>
      <span className="relative h-[1.35em] min-w-[8.5rem] overflow-hidden text-center">
        {phrases.map((p, i) => (
          <span
            key={p}
            className={`absolute inset-0 flex items-center justify-center fc-sell-serif text-lg sm:text-xl font-semibold transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              i === idx
                ? 'opacity-100 translate-y-0 text-[#ffd993]'
                : 'opacity-0 translate-y-3 text-white/30 pointer-events-none'
            }`}
          >
            {p}
          </span>
        ))}
      </span>
    </div>
  );
}

export function LandingSolutionsSnapshotSection({ onViewPricing }: Props) {
  const navigate = useNavigate();

  return (
    <section
      id="solutions-snapshot"
      className={`fc-sell py-20 sm:py-24 relative overflow-hidden ${finelyOsLandingPlatinumSection()}`}
      data-fc-contrast-band="1"
    >
      <LandingSellAtmosphere tone="platinum" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <Reveal>
            <p className="fc-sell-kicker mb-5">Solutions</p>
            <LandingTypewriterTitle
              text="DIY or Done-For-You — "
              accentText="your choice"
              speedMs={52}
              delayMs={180}
              className="fc-sell-serif text-4xl sm:text-5xl lg:text-[3.35rem] font-semibold leading-[1.08] text-white"
              accentClassName="text-[#ffd993] italic"
            />
            <div className="flex justify-center">
              <DiyDfySwitcher />
            </div>
            <p className="mt-5 text-base sm:text-lg text-white/55 leading-relaxed">
              Personal restore, business credit, debt strategy, tradelines, and wealth builder — one clear path to
              pricing.
            </p>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {CARDS.map((card, i) => (
            <Reveal key={card.title} delay={90 + i * 90}>
              <div
                className={`fc-sell-champagne-card h-full ${card.featured ? 'fc-sell-champagne-card--featured' : ''}`}
              >
                <div className="fc-sell-champagne-card__sheen" />
                {card.featured ? (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#c4803d] via-[#e0b24a] to-[#ffd993]" />
                ) : null}
                <div className="relative p-6 sm:p-7">
                  {card.featured ? (
                    <div className="absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl bg-[#e0b24a] text-[#1a1204] text-[9px] font-black uppercase tracking-widest">
                      Most popular
                    </div>
                  ) : null}
                  <div
                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${
                      card.featured
                        ? 'border-[#e0b24a]/50 bg-[#e0b24a]/15 text-[#9a6b1a]'
                        : 'border-[#0c1228]/12 bg-[#0c1228]/05 text-[#0c1228]/70'
                    }`}
                  >
                    <card.Icon size={20} />
                  </div>
                  <div className="fc-sell-serif text-2xl font-semibold text-[#0c1228]">{card.title}</div>
                  <div className="mt-1 text-[#9a6b1a] text-base font-semibold tracking-wide">{card.range}</div>
                  <p className="mt-3 text-[#3d4558] text-sm leading-relaxed">{card.note}</p>
                  <ul className="mt-4 space-y-2">
                    {card.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-xs text-[#3d4558]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#9a6b1a] shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={380}>
          <div className="mt-10 flex flex-col items-center gap-3">
            <button type="button" onClick={onViewPricing} className="fc-sell-cta-gold">
              See solutions <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/free-guide')}
              className="text-xs text-white/45 hover:text-[#ffd993] transition-colors underline-offset-4 hover:underline"
            >
              Or start with the free guide
            </button>
            <p className="fc-sell-compliance mt-2">Results vary · funding subject to underwriting · not income guarantees</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
