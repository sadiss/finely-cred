/** Homepage — DIY / DFY / Wealth snapshot on platinum band with glass compare cards. */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Shield, Trophy, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Reveal } from '../ui';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsLandingPlatinumSection,
  finelyOsSolidIconChip,
  type FinelyOsPublicAccent,
} from '../../features/os/finelyOsLightUi';
import { LandingTypewriterTitle } from './LandingTypewriterTitle';
import { LandingSellAtmosphere } from './LandingSellAtmosphere';
import './landingSellBands.css';

const CARDS: Array<{
  title: string;
  range: string;
  note: string;
  Icon: typeof Zap;
  featured: boolean;
  points: string[];
  accent: FinelyOsPublicAccent;
}> = [
  {
    title: 'DIY',
    range: 'Tools + templates',
    note: 'Move fast with letter kits, dispute workflows, and portal access — built for disciplined partners.',
    Icon: Zap,
    featured: false,
    points: ['Letter kits & guides', 'Self-paced portal tools'],
    accent: 'emerald',
  },
  {
    title: 'Done-For-You',
    range: 'Execution + support',
    note: 'We build the packets, strategy, and tracking — so you stay in command without the busywork.',
    Icon: Shield,
    featured: true,
    points: ['Strategy + dispute packets', 'Round tracking & responses', 'Dedicated specialist support'],
    accent: 'violet',
  },
  {
    title: 'Wealth Builder',
    range: 'Funding pathways',
    note: 'From credit stability to capital readiness — sequenced next steps, not guesswork.',
    Icon: Trophy,
    featured: false,
    points: ['Fundability sequencing', 'Tradelines when appropriate'],
    accent: 'sky',
  },
];

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
      className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/30 bg-black/35 px-4 py-2 backdrop-blur-sm"
      aria-live="polite"
    >
      <span className={`${FINELY_OS_ENTITY_SUBLABEL} !text-[10px]`}>Path</span>
      <span className="relative h-[1.35em] min-w-[8.5rem] overflow-hidden text-center">
        {phrases.map((p, i) => (
          <span
            key={p}
            className={`absolute inset-0 flex items-center justify-center text-lg sm:text-xl font-extrabold transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              i === idx
                ? 'opacity-100 translate-y-0 text-emerald-300'
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
              className="text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold leading-[1.08] text-white"
              accentClassName="text-emerald-300"
            />
            <div className="flex justify-center">
              <DiyDfySwitcher />
            </div>
            <p className={`mt-5 text-base sm:text-lg leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>
              Personal restore, business credit, debt strategy, tradelines, and wealth builder — one clear path to
              pricing.
            </p>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {CARDS.map((card, i) => (
            <Reveal key={card.title} delay={90 + i * 90}>
              <div
                className={`relative h-full ${finelyOsCatalogCard(card.accent)} ${card.featured ? 'ring-2 ring-white/25 brightness-110' : ''}`}
                data-fc-accent={card.accent}
              >
                {card.featured ? (
                  <div className={`absolute top-4 right-4 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>Most popular</div>
                ) : null}
                <div className="relative">
                  <div className={`mb-4 ${finelyOsSolidIconChip(card.accent)}`}>
                    <card.Icon size={20} />
                  </div>
                  <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{card.title}</div>
                  <div className={`mt-1 text-base font-bold text-emerald-300/90`}>{card.range}</div>
                  <p className={`mt-3 text-base leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{card.note}</p>
                  <ul className="mt-4 space-y-2">
                    {card.points.map((p) => (
                      <li key={p} className={`flex items-center gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
              className="text-sm font-bold text-white/55 hover:text-emerald-300 transition-colors underline-offset-4 hover:underline"
            >
              Or start with the free guide
            </button>
            <p className="fc-sell-compliance mt-2">Results vary · not legal advice · funding subject to underwriting</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
