import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Building2, Check, Handshake, Scale, Sparkles } from 'lucide-react';
import { CreditSpecialistGuideBookMockup } from '../../components/creditSpecialist/CreditSpecialistGuideBookMockup';
import { LandingTypewriterTitle } from '../../components/landing/LandingTypewriterTitle';
import { openPublicChat } from '../../lib/publicChatEvents';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import '../../components/leadmagnet/leadMagnetLuxuryStage.css';
import {
  RE_CAREERS_PATH,
  RE_GUIDE_CHAPTERS,
  RE_GUIDE_META,
  RE_GUIDE_PATH,
  RE_GUIDE_READ_PATH,
  RE_SCORE_ROADMAP_PATH,
} from './realEstateGuideContent';
import './realEstateGuideLanding.css';

function GuideBookMockup({ onOpen, tall }: { onOpen: () => void; tall?: boolean }) {
  return (
    <CreditSpecialistGuideBookMockup
      title={RE_GUIDE_META.title}
      edition={RE_GUIDE_META.edition}
      tagline={RE_GUIDE_META.tagline}
      valueLabel={RE_GUIDE_META.valueLabel}
      onOpen={onOpen}
      tall={tall}
      ariaLabel="Open Real Estate Operator Guide in the reader"
    />
  );
}

function MiniCheck({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[15px] leading-relaxed text-white/80">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4a447] text-[#06101f]">
        <Check size={12} strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

const PILLARS = [
  {
    icon: Handshake,
    title: 'You refer',
    desc: 'Spot the blocked buyer or seller, hand a tracked link, stay on milestones.',
  },
  {
    icon: Scale,
    title: 'Finely runs credit',
    desc: 'Disputes, AU optics, paydown proof — specialists operate the file.',
  },
  {
    icon: Building2,
    title: 'You keep the closing',
    desc: 'Contracts get a real lane instead of “come back next year.”',
  },
];

export default function RealEstateGuideLandingPage() {
  const navigate = useNavigate();

  usePublicSeoMeta({
    title: `${RE_GUIDE_META.title} — Free e-guide for agents & brokers`,
    description: RE_GUIDE_META.description,
    path: RE_GUIDE_PATH,
  });

  const openGuide = (chapterId?: string) => {
    const path = chapterId ? `${RE_GUIDE_READ_PATH}?chapter=${encodeURIComponent(chapterId)}` : RE_GUIDE_READ_PATH;
    navigate(path);
  };

  return (
    <main className="reg-page lm-lux-theme--navy relative min-h-screen overflow-x-hidden selection:bg-[#d4a447]/30">
      <div className="reg-atmosphere pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="lm-lux-grain lm-lux-grain--fixed pointer-events-none" aria-hidden />

      <section className="relative z-10 pt-20 md:pt-24">
        <div className="relative z-[2] mx-auto grid max-w-[88rem] items-center gap-8 px-5 pb-10 pt-6 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-12 lg:pt-8">
          <div className="reg-fade-up">
            <p className="reg-hero-kicker text-[11px] font-bold uppercase">Free e-guide · no signup to read</p>
            <h1 className="reg-serif reg-hero-title mt-3 text-white">
              <LandingTypewriterTitle as="span" text="You refer." className="block" speedMs={40} delayMs={80} caret />
              <LandingTypewriterTitle
                as="span"
                text="We run the credit work."
                className="reg-hero-title-gold mt-1 block"
                speedMs={42}
                delayMs={720}
                caret
              />
            </h1>
            <div className="lm-lux-rule--short lm-lux-rule--draw mt-4" aria-hidden />
            <p className="reg-hero-lede mt-5 max-w-xl">
              The Real Estate Operator Guide — WIIFM, question scripts, Fannie AU/DTI summaries, seven readiness levers,
              and lender rescore prep. Read free in-app. Join the affiliation path when you are ready.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button type="button" className="reg-primary-btn" onClick={() => openGuide()}>
                <BookOpen size={14} /> Read the Operator Guide <ArrowRight size={14} />
              </button>
              <Link to={RE_CAREERS_PATH} className="reg-ghost-btn inline-flex h-11 items-center rounded-lg px-5 text-[11px] font-black uppercase tracking-[0.14em]">
                Join real estate path
              </Link>
              <button
                type="button"
                className="reg-ghost-btn inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[11px] font-black uppercase tracking-[0.14em]"
                onClick={() => openPublicChat({ goal: 'personal', personaId: 'funding_strategist' })}
              >
                <Sparkles size={14} /> Ask Finely
              </button>
            </div>
            <p className="reg-compliance mt-3">{RE_GUIDE_META.compliance}</p>
          </div>

          <div className="relative flex flex-col items-center reg-fade-up" style={{ animationDelay: '0.12s' }}>
            <GuideBookMockup tall onOpen={() => openGuide()} />
            <p className="mt-1 max-w-xs text-center text-sm text-white/50">
              Book-first — click the cover to open the in-app reader. No unlock gate.
            </p>
          </div>
        </div>
      </section>

      <section id="pages" className="relative z-10 scroll-mt-28 border-y border-white/8 py-12 md:py-14">
        <div className="mx-auto max-w-[88rem] px-5 md:px-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="reg-kicker">
                <BookOpen size={14} /> Page preview
              </div>
              <h2 className="reg-serif mt-3 text-3xl font-semibold md:text-4xl">
                {RE_GUIDE_CHAPTERS.length} chapters · tap any to read
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/55 md:text-base">
                Built from the real-estate partner playbook, Fannie summaries, and field scripts agents can say out loud.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openGuide('wiifm')}
              className="reg-ghost-btn inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg px-5 text-[11px] font-black uppercase tracking-[0.14em] md:self-auto"
            >
              Start chapter 1 <ArrowRight size={14} />
            </button>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {RE_GUIDE_CHAPTERS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => openGuide(ch.id)}
                className="reg-chapter-card"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/70">
                    Ch {ch.number}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">{ch.kicker}</span>
                </div>
                <h3 className="reg-serif mt-2 text-xl font-semibold text-white">{ch.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">{ch.teaser}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="inside" className="relative z-10 py-12 md:py-14">
        <div className="mx-auto max-w-[88rem] px-5 md:px-10">
          <div className="reg-kicker">Inside the guide</div>
          <h2 className="reg-serif mt-3 text-3xl font-semibold md:text-4xl">Clear WIIFM. Real scripts. Accurate underwriting language.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-400/10 text-amber-200">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{p.desc}</p>
                </div>
              );
            })}
          </div>
          <ul className="mt-8 max-w-2xl space-y-3">
            <MiniCheck>Seven readiness levers with Finely routes — AU, DTI, util, inquiries, collections, disputes, rescore.</MiniCheck>
            <MiniCheck>Fannie B3-5.3 / B3-6 themes in plain English — AU may help optics; AU ≠ automatic DTI relief.</MiniCheck>
            <MiniCheck>Question-script chips you can say at the kitchen table without overpromising.</MiniCheck>
          </ul>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/8 py-12 md:py-16">
        <div className="mx-auto flex max-w-[88rem] flex-col items-start gap-6 px-5 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <h2 className="reg-serif text-3xl font-semibold md:text-4xl">Ready to operate?</h2>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              Read the guide free. Join the real estate path for your tracked link. The Score Roadmap stays available as
              a secondary buyer checklist.
            </p>
            <p className="reg-compliance mt-3">{RE_GUIDE_META.compliance}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="reg-primary-btn" onClick={() => openGuide()}>
              Open reader <ArrowRight size={14} />
            </button>
            <Link to={RE_CAREERS_PATH} className="reg-ghost-btn inline-flex h-11 items-center rounded-lg px-5 text-[11px] font-black uppercase tracking-[0.14em]">
              Careers / apply
            </Link>
            <Link to={RE_SCORE_ROADMAP_PATH} className="reg-ghost-btn inline-flex h-11 items-center rounded-lg px-5 text-[11px] font-black uppercase tracking-[0.14em]">
              Score roadmap (secondary)
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
