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
import './landingSellBands.css';

const BENEFITS = [
  { Icon: Megaphone, title: 'Done-for-you buyer marketing', text: 'We list inventory, run intake, and route orders — no ads or DMs.' },
  { Icon: CreditCard, title: 'You supply the cards', text: 'Seasoned revolving accounts with clean history and clear bureau limits.' },
  { Icon: Users, title: 'Marketplace placement', text: 'Your slots reach partners already browsing AU profiles.' },
  { Icon: Wallet, title: 'Payouts per placement', text: 'Track earnings tied to fulfilled contracts in your seller hub.' },
  { Icon: RefreshCw, title: '60-day listing seasons', text: 'Rotate cards each season to protect issuer risk and stay fresh.' },
  { Icon: ShieldCheck, title: 'Compliance-first education', text: 'Marketplace rules, rotation guidance, and AU specialty training.' },
] as const;

/** Illustrative AU tradeline listings — finishes/limits are examples, never a live inventory feed. */
const AU_CARDS = [
  { finish: 'platinum', tier: 'Platinum Revolving', limit: '$25,000', age: '11 yrs', pan: '5412', slots: '3 slots', caption: 'High limit, long history — the profile buyers ask for first.' },
  { finish: 'gold', tier: 'Gold Signature', limit: '$15,000', age: '8 yrs', pan: '4118', slots: '2 slots', caption: 'Mid-tier workhorse that seasons well across a 60-day cycle.' },
  { finish: 'obsidian', tier: 'Obsidian Reserve', limit: '$40,000', age: '14 yrs', pan: '3706', slots: '1 slot', caption: 'Premium inventory — the strongest age and limit combination.' },
  { finish: 'emerald', tier: 'Emerald Rewards', limit: '$10,000', age: '6 yrs', pan: '6011', slots: '4 slots', caption: 'Entry listing for sellers starting their first season.' },
  { finish: 'sapphire', tier: 'Sapphire Preferred', limit: '$20,000', age: '9 yrs', pan: '4929', slots: '2 slots', caption: 'Balanced utilization and age for broader restore plans.' },
  { finish: 'titanium', tier: 'Titanium Everyday', limit: '$12,500', age: '7 yrs', pan: '5310', slots: '3 slots', caption: 'Steady reporter with clean payment history each cycle.' },
] as const;

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

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <Reveal>
            <p className="fc-sell-kicker mb-5">Authorized User program</p>
            <LandingTypewriterTitle
              text="We market your tradelines. "
              accentText="You supply the cards."
              accentClassName="text-[#a3e635] italic"
            />
            <p className="mt-5 text-base sm:text-lg text-white/55 leading-relaxed">
              {AU_SELLER_MARKETING_HEADLINE} One-time {AU_SELLER.startupFeeLabel} unlocks your first{' '}
              {AU_SELLER.listingSeasonDays}-day marketing season.
            </p>
          </Reveal>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-8 items-stretch">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-[1.5rem] border border-[#e0b24a]/28 bg-gradient-to-br from-[#0a1a14]/90 via-[#06120c]/88 to-[#040a08]/95 p-7 sm:p-9">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_100%_0%,rgba(163,230,53,0.12),transparent_55%)] pointer-events-none" />
              <div className="relative">
                <h3 className="fc-sell-serif text-2xl sm:text-3xl font-semibold text-white">What AU selling is</h3>
                <div className="mt-4 space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-white/58">
                  <p>
                    Authorized User tradelines let a buyer appear on a seasoned revolving account with strong limits and
                    clean payment history — a profile signal that can support age, mix, and utilization when structured
                    inside a broader restore plan.
                  </p>
                  <p>
                    As a seller, you do not run dispute files. You supply verified inventory. Finely markets to partners,
                    handles intake, and routes orders to your seller workspace. You fulfill, rotate on schedule, and earn
                    per placement.
                  </p>
                  <p>
                    The <span className="text-[#ffd993] font-semibold">$50 get-in fee</span> covers profile verification,
                    marketplace listing, and your first managed season. Buyers pay separately. Earnings and inventory
                    availability vary.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative h-full overflow-hidden rounded-[1.5rem] border border-[#e0b24a]/45 bg-gradient-to-b from-[#1a160e]/95 via-[#12100c]/92 to-[#0a0e0c]/96 p-7 sm:p-9 flex flex-col items-center text-center shadow-[0_0_60px_-20px_rgba(224,178,74,0.45)]">
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
            Six example listings. Every card stays with its owner — buyers are added as an authorized user for one
            marketing season, then rotated off.
          </p>
          <div className="fc-au-card-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {AU_CARDS.map((card, i) => (
              <Reveal key={card.tier} delay={70 + i * 60}>
                <div>
                  <article className={`fc-au-card fc-au-card--${card.finish}`}>
                    <div className="fc-au-card__top">
                      <div className="min-w-0">
                        <p className="fc-au-card__issuer">Finely marketplace</p>
                        <p className="fc-au-card__tier mt-1">{card.tier}</p>
                      </div>
                      <span className="fc-au-card__badge">Authorized user</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="fc-au-card__chip" aria-hidden />
                      <span className="fc-au-card__pan">•••• •••• •••• {card.pan}</span>
                    </div>

                    <div className="fc-au-card__bottom">
                      <div className="flex gap-5">
                        <div>
                          <p className="fc-au-card__stat-label">Reported limit</p>
                          <p className="fc-au-card__stat-value">{card.limit}</p>
                        </div>
                        <div>
                          <p className="fc-au-card__stat-label">Seasoned</p>
                          <p className="fc-au-card__stat-value">{card.age}</p>
                        </div>
                        <div>
                          <p className="fc-au-card__stat-label">Open</p>
                          <p className="fc-au-card__stat-value">{card.slots}</p>
                        </div>
                      </div>
                      <span className="fc-au-card__network" aria-hidden>
                        <span />
                        <span />
                      </span>
                    </div>
                  </article>
                  <p className="fc-au-card-caption">{card.caption}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="fc-sell-compliance text-center mt-6">
            Illustrative listings for demonstration · not live inventory · limits, age, and availability vary by seller
          </p>

          <div className="mt-8 mx-auto max-w-3xl rounded-2xl border border-[#e0b24a]/28 bg-black/30 p-5 text-center">
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

        <div className="mt-12">
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
        </div>

        <p className="fc-sell-compliance text-center mt-8">
          Results vary · not a credit score guarantee · issuer risk applies · follow marketplace rotation rules
        </p>
      </div>
    </section>
  );
}
