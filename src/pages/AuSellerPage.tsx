import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CreditCard,
  Megaphone,
  RefreshCw,
  ShoppingBag,
  UserCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareersQuickNav } from '../components/careers/CareersQuickNav';
import { RoleGuideCta } from '../components/careers/RoleGuideCta';
import { ROLE_ACTION_LEGEND, roleJoinBtn, roleSecondaryBtn } from '../components/careers/roleActionButtons';
import { AuSellerShelfMock } from '../components/careers/roleProfileMockups';
import { DigitalInviteShareBand } from '../components/digitalCards';
import { DedicatedSheetLinkStrip } from '../components/resources/DedicatedSheetLinkStrip';
import {
  AU_SELLER,
  AU_SELLER_ACTIVATION_BULLETS,
  AU_SELLER_MARKETING_HEADLINE,
  AU_SELLER_OFFERINGS,
} from '../config/auSellerProgram';
import {
  ROLE_BENEFITS,
  ROLE_COMPLIANCE_FOOTNOTES,
  ROLE_INSIDE_ACCESS,
  ROLE_PROFILE_FEATURES,
  ROLE_UNIQUE_CAPABILITIES,
  ROLE_WORK_SPLIT,
} from '../config/rolePartnerPrograms';
import { signupUrlForRole } from '../lib/onboardingRoleRouting';
import { BackToSiteButton } from '../components/navigation/BackToSiteButton';
import { FinelyOsAlertBanner } from '../features/os/FinelyOsAlertBanner';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import {
  captureDigitalInviteCardFromUrl,
  getDigitalInviteCardEligibilityForRole,
} from '../lib/digitalInviteCardAttribution';
import { getDigitalInviteCardDef } from '../config/digitalInviteCards';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_PAGE,
} from '../features/os/finelyOsLightUi';

const ROLE = 'au_seller' as const;

/**
 * Marketplace shelf layout — teal/emerald supply floor, single scroll, no tabs.
 * Deliberately unlike the specialist credential hub, the obsidian agency console,
 * the RE referral ledger, and the parchment case-desk dossier.
 */
const SHELF_PANEL =
  'rounded-2xl border border-emerald-300/20 bg-[linear-gradient(150deg,rgba(6,78,59,0.28),rgba(2,20,26,0.55))] p-5 backdrop-blur-sm';
const SHELF_KICKER = 'text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200/85';
const SHELF_TITLE = 'text-2xl sm:text-3xl font-bold tracking-tight text-white';
const SHELF_BODY = 'text-sm sm:text-[15px] leading-relaxed text-white/70';

export default function AuSellerPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'AU sellers — you supply the cards, Finely brings the buyers',
    description:
      'List authorized-user tradeline inventory on Finely. We market to buyers, verify orders, and route fulfillment — you add users and get payouts per placement.',
    path: AU_SELLER.publicPath,
  });

  const sellerSignupUrl = signupUrlForRole('au_seller', { next: AU_SELLER.hubPath }) ?? '/onboarding?lane=au_seller';
  const [cardEligibility, setCardEligibility] = useState(() => getDigitalInviteCardEligibilityForRole('au_seller'));
  const workSplit = ROLE_WORK_SPLIT[ROLE];

  useEffect(() => {
    captureDigitalInviteCardFromUrl(window.location.search, window.location.pathname);
    setCardEligibility(getDigitalInviteCardEligibilityForRole('au_seller'));
  }, []);

  const cardBonus = getDigitalInviteCardDef('au_seller')?.bonus;

  return (
    <PageShell
      badge="Public"
      title={AU_SELLER.programName}
      subtitle="Supply tradelines — Finely markets to buyers and routes fulfillment."
      hideHero
    >
      <div className={`${FINELY_OS_PAGE} max-w-6xl mx-auto`}>
        <div className="flex flex-wrap items-center gap-4">
          <BackToSiteButton variant="ghost" label="Back to home" />
        </div>

        <CareersQuickNav active="au_sellers" className="mt-4" />
        {cardEligibility && cardBonus ? <FinelyOsAlertBanner tone="success" message={cardBonus.description} /> : null}

        {/* Supply-floor hero — shelf mock leads on the left, copy right (mirrored vs every other role page) */}
        <section
          className="relative overflow-hidden rounded-3xl border border-emerald-300/20 p-6 sm:p-9"
          style={{
            background:
              'linear-gradient(150deg,#02141a 0%,#052e2b 48%,#03181c 100%), radial-gradient(ellipse 55% 45% at 8% 4%, rgba(16,185,129,0.22), transparent 58%)',
          }}
        >
          <div className="relative grid gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="order-2 lg:order-1">
              <AuSellerShelfMock />
            </div>
            <div className="order-1 space-y-5 lg:order-2">
              <p className={SHELF_KICKER}>{AU_SELLER.programName}</p>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.07] text-white">
                {AU_SELLER_MARKETING_HEADLINE}
              </h1>
              <p className={`${SHELF_BODY} max-w-xl`}>
                You list verified inventory and fulfill placements. Finely runs the buyer marketplace, intake,
                verification, and order routing — no ads, no DMs, no chasing buyers. Restore and dispute files are the
                specialist track, not yours.
              </p>

              <div className="grid grid-cols-3 gap-2.5 max-w-lg">
                {[
                  { icon: Megaphone, label: 'Buyer demand', sub: 'Finely markets' },
                  { icon: CreditCard, label: 'Your inventory', sub: 'list & rotate' },
                  { icon: Wallet, label: 'Payouts', sub: 'per placement' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="rounded-xl border border-emerald-300/20 bg-black/35 px-3 py-3.5 text-center">
                    <Icon className="mx-auto mb-1.5 text-emerald-300" size={20} />
                    <div className="text-[12px] font-bold text-white/85">{label}</div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/45">{sub}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => navigate(sellerSignupUrl)} className={roleJoinBtn(ROLE)}>
                  Start AU seller signup <ArrowRight size={15} />
                </button>
                <button type="button" onClick={() => navigate(AU_SELLER.hubPath)} className={roleSecondaryBtn(ROLE)}>
                  Open {AU_SELLER.hubName}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(AU_SELLER.marketplacePath)}
                  className={roleSecondaryBtn(ROLE)}
                >
                  <ShoppingBag size={15} /> Buyer marketplace
                </button>
              </div>

              <div className="rounded-2xl border border-emerald-300/25 bg-black/40 p-5">
                <p className={SHELF_KICKER}>Free — before you list a single card</p>
                <RoleGuideCta role={ROLE} className="mt-3" />
                <p className="mt-3 text-[11px] leading-relaxed text-white/35">{ROLE_ACTION_LEGEND[ROLE]}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Who does the work — two-track conveyor with a red rail underneath */}
        <section className="space-y-4">
          <div className="max-w-2xl space-y-2.5">
            <p className={SHELF_KICKER}>Who does the work</p>
            <h2 className={SHELF_TITLE}>{workSplit.headline}</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className={SHELF_PANEL}>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">
                <CreditCard size={13} /> Your side of the shelf
              </p>
              <ul className="mt-3 space-y-2.5">
                {workSplit.youDo.map((l) => (
                  <li key={l} className="flex gap-2.5 text-[13px] leading-relaxed text-white/70">
                    <Check size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${SHELF_PANEL} !border-sky-300/20`}>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-sky-200">
                <UserCheck size={13} /> Finely’s side
              </p>
              <ul className="mt-3 space-y-2.5">
                {workSplit.finelyRuns.map((l) => (
                  <li key={l} className="flex gap-2.5 text-[13px] leading-relaxed text-white/70">
                    <Check size={14} className="mt-0.5 shrink-0 text-sky-300" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="rounded-2xl border border-rose-300/25 bg-rose-500/[0.06] px-5 py-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-rose-200">
              <XCircle size={13} /> Not the seller’s job
            </p>
            <ul className="mt-2.5 grid gap-2 sm:grid-cols-3">
              {workSplit.notYourJob.map((l) => (
                <li key={l} className="text-[13px] leading-relaxed text-rose-100/70">
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Activation & payouts — receipt strip */}
        <section className="space-y-4">
          <div className="max-w-2xl space-y-2.5">
            <p className={SHELF_KICKER}>Activation &amp; payouts</p>
            <h2 className={SHELF_TITLE}>How AU sellers earn.</h2>
            <p className={SHELF_BODY}>
              One-time activation covers your first marketing season. Ongoing payouts come from fulfilled buyer
              placements — buyers pay placement fees separately.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/[0.1] p-5 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200/85">Activation</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-emerald-100">{AU_SELLER.startupFeeLabel}</p>
              <p className="mt-1.5 text-[12px] text-white/55">
                one-time · first {AU_SELLER.listingSeasonDays}-day season included
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-black/35 p-5 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">Typical payout</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-white/90">{AU_SELLER.defaultCommissionPct}%</p>
              <p className="mt-1.5 text-[12px] text-white/55">of placement fee · varies by listing</p>
            </div>
            <div className="rounded-2xl border border-dashed border-emerald-200/30 bg-black/30 p-5">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200/80">
                <RefreshCw size={12} /> Season terms
              </p>
              <ul className="mt-2.5 space-y-2">
                {AU_SELLER_ACTIVATION_BULLETS.map((b) => (
                  <li key={b} className="flex gap-2 text-[13px] leading-relaxed text-white/65">
                    <Check size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-white/60">
            Running partner restore or build files instead? That is the{' '}
            <button
              type="button"
              className="font-semibold text-emerald-200 underline decoration-emerald-300/40 underline-offset-4 hover:text-emerald-100"
              onClick={() => navigate('/credit-specialist')}
            >
              Credit Specialist
            </button>{' '}
            track — separate from AU supply.
          </p>
        </section>

        {/* Seller operating stack — compact shelf rows */}
        <section className="space-y-4">
          <div className="max-w-2xl space-y-2.5">
            <p className={SHELF_KICKER}>What you get</p>
            <h2 className={SHELF_TITLE}>Seller operating stack.</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {AU_SELLER_OFFERINGS.map((offering) => (
              <div key={offering.title} className={`${SHELF_PANEL} !p-4`}>
                <h3 className="text-base font-bold text-white">{offering.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{offering.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {offering.included.map((item) => (
                    <span
                      key={item}
                      className="rounded-lg border border-emerald-300/20 bg-emerald-400/[0.08] px-2.5 py-1 text-[11px] font-semibold text-emerald-100/85"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits · access · capabilities · profile */}
        <section className="space-y-6">
          <div className="max-w-2xl space-y-2.5">
            <p className={SHELF_KICKER}>Supplier advantages</p>
            <h2 className={SHELF_TITLE}>Benefits, inside access, and supplier-only control.</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {ROLE_BENEFITS[ROLE].map((b) => (
              <div key={b.label} className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-[15px] font-semibold text-white/92">{b.label}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/60">{b.detail}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              { title: 'Inside access', rows: ROLE_INSIDE_ACCESS[ROLE] },
              { title: 'Only a supplier can', rows: ROLE_UNIQUE_CAPABILITIES[ROLE] },
              { title: 'Your seller profile', rows: ROLE_PROFILE_FEATURES[ROLE] },
            ].map((col) => (
              <div key={col.title} className="space-y-3.5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{col.title}</p>
                <dl className="space-y-3">
                  {col.rows.map((r) => (
                    <div key={r.label} className="border-t border-emerald-300/15 pt-2.5">
                      <dt className="text-sm font-semibold text-white/90">{r.label}</dt>
                      <dd className="mt-1 text-[13px] leading-relaxed text-white/55">{r.detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* Get started */}
        <section className={`${SHELF_PANEL} space-y-5`}>
          <div className="space-y-2.5">
            <p className={SHELF_KICKER}>Get started</p>
            <h2 className={SHELF_TITLE}>Join as an AU seller.</h2>
            <p className={SHELF_BODY}>
              Create your account, complete seller onboarding, activate, and publish your first listings.
            </p>
          </div>
          <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              'Sign up with the AU seller role.',
              'Verify your supply-side profile and payout method.',
              `Activate for ${AU_SELLER.startupFeeLabel} — includes your first marketing season.`,
              `Publish listings in ${AU_SELLER.hubName} — Finely routes buyers to you.`,
            ].map((step, i) => (
              <li key={step} className="rounded-xl border border-emerald-300/15 bg-black/30 p-4">
                <span className="font-mono text-sm font-black text-emerald-300/60">{String(i + 1).padStart(2, '0')}</span>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">{step}</p>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate(sellerSignupUrl)} className={roleJoinBtn(ROLE)}>
              Start signup <ArrowRight size={15} />
            </button>
            <button type="button" onClick={() => navigate(AU_SELLER.hubPath)} className={roleSecondaryBtn(ROLE)}>
              Already a seller? Open hub
            </button>
          </div>
          <div className="border-t border-emerald-300/15 pt-4">
            <RoleGuideCta role={ROLE} compact />
          </div>
        </section>

        <DedicatedSheetLinkStrip
          only={['au_teen']}
          heading="Answer the question every buyer asks"
          subline="Free 2-sheet parent kit · issuer ages and reporting reality"
        />

        <DigitalInviteShareBand role="au_seller" />

        <DigitalInviteShareBand
          role="tradelines"
          heading="Buyer invite card — send someone to the marketplace"
          blurb="Sellers supply the lines; buyers need an invite. Hand this card to anyone shopping seasoned authorized-user spots and the visit stays tagged to you."
        />

        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>{ROLE_COMPLIANCE_FOOTNOTES[ROLE]}</p>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
