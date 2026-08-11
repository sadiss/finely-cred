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
import { finelyOsLandingContrastSection } from '../../features/os/finelyOsLightUi';
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
  const sellerSignupUrl = signupUrlForRole('au_seller', { next: AU_SELLER.hubPath }) ?? '/onboarding?lane=au_seller';

  return (
    <section
      id="authorized-user-program"
      className={`fc-sell py-20 sm:py-24 relative overflow-hidden ${finelyOsLandingContrastSection('fc-band-emerald')}`}
      data-fc-contrast-band="1"
    >
      <LandingSellAtmosphere tone="emerald" />

      <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative z-10">
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
            <div className="relative overflow-hidden rounded-[1.5rem] border border-[#e0b24a]/28 bg-gradient-to-br from-[#0a1a14]/90 via-[#06120c]/88 to-[#040a08]/95 p-7 sm:p-9">
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
                  <span className="mt-0.5 shrink-0 text-[#ffd993]">
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
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ffd993]/90">{item.kicker}</p>
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
            <div className="relative mx-auto max-w-md overflow-hidden rounded-[1.5rem] border border-[#e0b24a]/45 bg-gradient-to-b from-[#1a160e]/95 via-[#12100c]/92 to-[#0a0e0c]/96 p-7 sm:p-9 flex flex-col items-center text-center shadow-[0_0_60px_-20px_rgba(224,178,74,0.45)]">
              <div className="fc-sell-champagne-card__sheen opacity-50" />
              <p className="relative text-[10px] font-black uppercase tracking-[0.3em] text-[#ffd993]/90">Start · get-in fee</p>
              <div className="relative mt-5 fc-sell-price-jewel">
                <span className="fc-sell-price-jewel__amount">$50</span>
                <span className="fc-sell-price-jewel__label">one-time</span>
              </div>
              <p className="relative mt-4 text-sm text-white/55 max-w-xs">
                First {AU_SELLER.listingSeasonDays}-day marketing season included · ~{AU_SELLER.defaultCommissionPct}%
                typical seller share
              </p>
              <button
                type="button"
                onClick={() => navigate(sellerSignupUrl)}
                className="relative fc-sell-cta-gold mt-7 w-full max-w-sm"
              >
                Start AU seller signup <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate(AU_SELLER.publicPath)}
                className="relative mt-3 text-xs text-white/40 hover:text-[#ffd993] transition-colors underline-offset-4 hover:underline"
              >
                Full program details
              </button>
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

          <div className="mt-8 rounded-2xl border border-[#e0b24a]/28 bg-black/30 p-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ffd993]/90">
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
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#e0b24a]/45 bg-[#e0b24a]/10 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#ffd993] transition-colors hover:bg-[#e0b24a]/20"
            >
              Open the 2-sheet AU &amp; teen kit <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
