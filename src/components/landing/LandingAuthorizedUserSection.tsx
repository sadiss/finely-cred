/** Homepage — Authorized User seller program ($50) — premium package presentation. */
import React from 'react';
import {
  ArrowRight,
  CreditCard,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Reveal } from '../ui';
import { AU_SELLER, AU_SELLER_MARKETING_HEADLINE } from '../../config/auSellerProgram';
import { signupUrlForRole } from '../../lib/onboardingRoleRouting';
import { resolveFinelyCtaPath } from '../../lib/finelyCtaIntent';
import { finelyOsCatalogCard, finelyOsLandingContrastSection } from '../../features/os/finelyOsLightUi';
import { LandingTypewriterTitle } from './LandingTypewriterTitle';
import { LandingSellAtmosphere } from './LandingSellAtmosphere';
import { AuMarketplaceCard, networkFromPan, type AuCardFinish } from './AuMarketplaceCard';
import './landingSellBands.css';

const BENEFITS = [
  { Icon: Megaphone, title: 'Done-for-you buyer marketing', text: 'We list inventory, run intake, and route orders — no ads or DMs.' },
  { Icon: CreditCard, title: 'You supply the cards', text: 'Seasoned revolving accounts with clean history and clear bureau limits.' },
  { Icon: Users, title: 'Marketplace placement', text: 'Your slots reach partners already browsing AU profiles.' },
  { Icon: Wallet, title: 'Payouts per placement', text: 'Track earnings tied to fulfilled contracts in your seller hub.' },
  { Icon: RefreshCw, title: '60-day listing seasons', text: 'Rotate cards each season to protect issuer risk and stay fresh.' },
  { Icon: ShieldCheck, title: 'Compliance-first education', text: 'Marketplace rules, rotation guidance, and AU specialty training.' },
] as const;

const LAW_MARKETPLACE = [
  {
    kicker: 'AU reporting relationship',
    text: 'When a partner is added as an authorized user on your revolving account, the issuer may report that tradeline on their credit file — age, limit, and payment history can appear as profile signals inside a broader restore plan.',
  },
  {
    kicker: 'What allows marketplace selling',
    text: 'Cardholders who own verified, seasoned inventory may list AU slots on Finely\'s marketplace. We verify seller profiles, publish listings, run buyer intake, and route qualified orders — you fulfill placements under our marketplace rules.',
  },
  {
    kicker: 'What the $50 get-in covers',
    text: `One-time seller activation: profile verification, marketplace listing setup, and your first ${AU_SELLER.listingSeasonDays}-day managed marketing season. Partners browsing the marketplace pay separately for placements.`,
  },
  {
    kicker: 'Rotation rules',
    text: `Remove buyers from each card at the end of every ~${AU_SELLER.listingSeasonDays}-day season. Rotation protects issuer risk, keeps inventory eligible for the next cycle, and is required before re-listing.`,
  },
] as const;

/** Illustrative AU tradeline listings — finishes/limits are examples, never a live inventory feed. */
const AU_CARDS: {
  finish: AuCardFinish;
  tier: string;
  limit: string;
  age: string;
  pan: string;
  slots: string;
  caption: string;
}[] = [
  { finish: 'platinum', tier: 'Platinum Revolving', limit: '$25,000', age: '11 yrs', pan: '3706', slots: '3 slots', caption: 'High limit, long history — the profile buyers ask for first.' },
  { finish: 'gold', tier: 'Gold Signature', limit: '$15,000', age: '8 yrs', pan: '4118', slots: '2 slots', caption: 'Mid-tier workhorse that seasons well across a 60-day cycle.' },
  { finish: 'obsidian', tier: 'Obsidian Reserve', limit: '$40,000', age: '14 yrs', pan: '5412', slots: '1 slot', caption: 'Premium inventory — the strongest age and limit combination.' },
  { finish: 'emerald', tier: 'Emerald Rewards', limit: '$10,000', age: '6 yrs', pan: '6011', slots: '4 slots', caption: 'Entry listing for sellers starting their first season.' },
  { finish: 'sapphire', tier: 'Sapphire Preferred', limit: '$20,000', age: '9 yrs', pan: '4929', slots: '2 slots', caption: 'Balanced utilization and age for broader restore plans.' },
  { finish: 'titanium', tier: 'Titanium Everyday', limit: '$12,500', age: '7 yrs', pan: '5310', slots: '3 slots', caption: 'Steady reporter with clean payment history each cycle.' },
];

export function LandingAuthorizedUserSection() {
  const navigate = useNavigate();
  const sellerSignupUrl = signupUrlForRole('au_seller', { next: AU_SELLER.hubPath }) ?? resolveFinelyCtaPath('au_seller_intake');

  return (
    <section
      id="authorized-user-program"
      className={`fc-sell py-20 sm:py-24 relative overflow-hidden ${finelyOsLandingContrastSection('fc-band-emerald')}`}
      data-fc-contrast-band="1"
    >
      <LandingSellAtmosphere tone="emerald" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        <div className="text-center mb-12">
          <Reveal>
            <p className="fc-sell-kicker mb-5">Authorized User program</p>
            <LandingTypewriterTitle
              text="We market your tradelines. "
              accentText="You supply the cards."
              accentClassName="text-[#a3e635] italic"
              speedMs={44}
              delayMs={120}
            />
            <p className="mt-5 text-base sm:text-lg text-white/55 leading-relaxed">
              {AU_SELLER_MARKETING_HEADLINE} One-time {AU_SELLER.startupFeeLabel} unlocks your first{' '}
              {AU_SELLER.listingSeasonDays}-day marketing season.
            </p>
          </Reveal>
        </div>

        <div className="space-y-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-400/28 bg-gradient-to-br from-[#0a1a14]/90 via-[#06120c]/88 to-[#040a08]/95 p-7 sm:p-9">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_100%_0%,rgba(163,230,53,0.12),transparent_55%)] pointer-events-none" />
              <div className="relative">
                <h3 className="fc-sell-serif text-2xl sm:text-3xl font-semibold text-white text-center">What AU selling is</h3>
                <div className="mt-4 space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-white/58">
                  <p>
                    Authorized User tradelines let a partner appear on a seasoned revolving account with strong limits and
                    clean payment history — a profile signal that can support age, mix, and utilization when structured
                    inside a broader restore plan.
                  </p>
                  <p>
                    As a seller, you do not run dispute files. You supply verified inventory. Finely markets to partners,
                    handles intake, and routes orders to your seller workspace. You fulfill, rotate on schedule, and earn
                    per placement.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <p className="fc-sell-kicker text-center mb-5">Six reasons partners list with us</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BENEFITS.map((b) => (
                <div key={b.title} className="fc-sell-benefit-chip">
                  <span className="mt-0.5 shrink-0 text-emerald-300">
                    <b.Icon size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-white/88">{b.title}</span>
                    <span className="block text-[11px] leading-relaxed text-white/48">{b.text}</span>
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/12 bg-black/25 p-7 sm:p-9">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(163,230,53,0.08),transparent_60%)] pointer-events-none" />
              <div className="relative">
                <h3 className="fc-sell-serif text-xl sm:text-2xl font-semibold text-white text-center">Law &amp; marketplace</h3>
                <p className="mt-3 text-center text-sm text-white/50 max-w-2xl mx-auto">
                  How authorized-user reporting works, what Finely&apos;s marketplace covers, and the rules every seller follows.
                </p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                  {LAW_MARKETPLACE.map((item) => (
                    <div key={item.kicker} className="rounded-xl border border-white/8 bg-black/20 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-300/90">{item.kicker}</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/58">{item.text}</p>
                    </div>
                  ))}
                </div>
                <p className="fc-sell-compliance text-center mt-6">
                  Results vary · not legal advice · educational overview only · issuer policies and bureau reporting differ
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="grid gap-4 lg:grid-cols-[1fr_minmax(240px,280px)_1fr] lg:items-stretch max-w-5xl mx-auto">
              {/* Left — why AUs matter */}
              <div className="relative overflow-hidden rounded-[1.25rem] border border-emerald-400/30 bg-gradient-to-br from-emerald-950/50 via-black/40 to-black/60 p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200/90">Why AUs matter</p>
                  <h4 className="mt-2 text-lg font-semibold text-white leading-snug">Profile signals partners pay for</h4>
                  <p className="mt-2 text-sm text-white/55 leading-relaxed">
                    Seasoned revolving lines can add age, limit, and clean payment history to a partner file — when structured inside a broader restore plan, not as a magic score jump.
                  </p>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-white/50">
                  <li>· Issuer-reported tradeline history</li>
                  <li>· Utilization and mix support</li>
                  <li>· Finely handles buyer marketing &amp; intake</li>
                </ul>
              </div>

              {/* Center — $50 for life activation */}
              <div className={`relative overflow-hidden ${finelyOsCatalogCard('violet')} !p-6 sm:!p-7 flex flex-col items-center text-center`} data-fc-accent="violet">
                <p className="relative text-[10px] font-black uppercase tracking-[0.3em] text-violet-200">For life · one-time</p>
                <div className="relative mt-4 flex flex-col items-center justify-center rounded-full border-2 border-violet-400/50 bg-violet-500/15 px-8 py-6 min-w-[9.5rem] shadow-[0_0_48px_-12px_rgba(139,92,246,0.55)]">
                  <span className="fc-sell-serif text-4xl sm:text-5xl font-bold text-white leading-none">$50</span>
                  <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.22em] text-violet-200/80">activation</span>
                </div>
                <p className="relative mt-3 text-xs font-semibold uppercase tracking-widest text-violet-200/85">
                  Residual income · money while you sleep
                </p>
                <p className="relative mt-2 text-sm text-white/55 max-w-[220px]">
                  First {AU_SELLER.listingSeasonDays}-day season included · marketplace listing · seller hub for life
                </p>
                <button
                  type="button"
                  onClick={() => navigate(sellerSignupUrl)}
                  className="relative fc-sell-cta-gold mt-5 w-full"
                >
                  Start AU seller signup <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(AU_SELLER.publicPath)}
                  className="relative mt-2 text-[11px] text-white/40 hover:text-violet-200 transition-colors underline-offset-4 hover:underline"
                >
                  Full program details
                </button>
              </div>

              {/* Right — potential earnings */}
              <div className="relative overflow-hidden rounded-[1.25rem] border border-sky-400/30 bg-gradient-to-br from-sky-950/40 via-black/40 to-black/60 p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-200/90">Potential earnings</p>
                  <h4 className="mt-2 text-lg font-semibold text-white leading-snug">Realistic placement math</h4>
                  <p className="mt-2 text-sm text-white/55 leading-relaxed">
                    Illustrative only — your inventory, limits, and seasons drive actual payouts. We help you build card depth so listings stay eligible cycle after cycle.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-center">
                    <div className="text-lg font-light text-sky-100">2</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/45">Partners per card / ~60 days</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-center">
                    <div className="text-lg font-light text-emerald-200">~{AU_SELLER.defaultCommissionPct}%</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/45">Typical seller share</div>
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-white/40 leading-relaxed">
                  Results vary · not a guarantee · issuer and marketplace rules apply
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-14">
          <p className="fc-sell-kicker text-center mb-2">The cards partners list</p>
          <p className="text-center text-sm text-white/50 mb-7 max-w-2xl mx-auto">
            Six example listings. Every card stays with its owner — partners are added as an authorized user for one
            marketing season, then rotated off.
          </p>
          <div className="fc-au-card-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {AU_CARDS.map((card, i) => (
              <Reveal key={card.tier} delay={70 + i * 60}>
                <AuMarketplaceCard
                  finish={card.finish}
                  issuer="Finely marketplace"
                  tier={card.tier}
                  limit={card.limit}
                  age={card.age}
                  slots={card.slots}
                  pan={card.pan}
                  network={networkFromPan(card.pan)}
                  caption={card.caption}
                />
              </Reveal>
            ))}
          </div>
          <p className="fc-sell-compliance text-center mt-6">
            Illustrative listings for demonstration · not live inventory · limits, age, and availability vary by seller
          </p>

          <div className="mt-8 rounded-2xl border border-sky-500/28 bg-black/30 p-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-300/90">
              Adding a teen as an authorized user?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/58">
              Amex and U.S. Bank allow authorized users from around 13, Capital One commonly reports regardless of age,
              and Chase and Amex often do not report a minor at all. Our free 2-sheet parent kit lays out every issuer
              policy, the four gates an AU line must clear, and the 18th-birthday handoff.
            </p>
            <button
              type="button"
              onClick={() => navigate('/resources/au-teen-credit-sheet')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-sky-500/45 bg-sky-500/10 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-sky-200 transition-colors hover:bg-sky-500/20"
            >
              Open the 2-sheet AU &amp; teen kit <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
