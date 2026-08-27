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
import { CareerOtherTracksLink } from '../components/careers/CareerOtherTracksLink';
import { RoleGuideCta } from '../components/careers/RoleGuideCta';
import { ROLE_ACTION_LEGEND, roleJoinBtn, roleSecondaryBtn } from '../components/careers/roleActionButtons';
import { AuSellerShelfMock } from '../components/careers/roleProfileMockups';
import { CareerChoiceApply } from '../components/careers/CareerChoiceApply';
import { CareerTierStickySummary } from '../components/careers/CareerTierStickySummary';
import { DigitalInviteShareBand } from '../components/digitalCards';
import { DedicatedSheetLinkStrip } from '../components/resources/DedicatedSheetLinkStrip';
import {
  AU_SELLER,
  AU_SELLER_ACTIVATION_BULLETS,
  AU_SELLER_MARKETING_HEADLINE,
  AU_SELLER_OFFERINGS,
  AU_SELLER_PAYOUT_TIERS,
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
 * Marketplace shelf layout — emerald supply floor with amber/gold payouts and sky guides.
 * Deliberately unlike the specialist credential hub, the obsidian agency console,
 * the RE referral ledger, and the parchment case-desk dossier.
 */
const SHELF_PANEL =
  'rounded-2xl border border-white/14 bg-[linear-gradient(150deg,rgba(6,78,59,0.28),rgba(2,20,26,0.72))] p-5 backdrop-blur-sm';
const SHELF_KICKER = 'text-[10px] font-black uppercase tracking-[0.3em] text-violet-200';
const SHELF_TITLE = 'text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-[0_1px_12px_rgba(0,0,0,0.55)]';
const SHELF_BODY = 'text-sm sm:text-[15px] leading-relaxed text-white/85';

/** High-contrast payout ladder — % reads as ivory/amber on tinted black, never low-opacity green mush. */
const TIER_ACCENT = [
  {
    border: 'border-emerald-200/55',
    panel: 'bg-[linear-gradient(165deg,rgba(16,185,129,0.22),rgba(2,12,16,0.88))]',
    badge: 'border-emerald-200/70 bg-[#041a14] text-emerald-50',
    label: 'text-emerald-100',
    pct: 'text-white',
  },
  {
    border: 'border-violet-200/60',
    panel: 'bg-[linear-gradient(165deg,rgba(139,92,246,0.24),rgba(12,8,22,0.9))]',
    badge: 'border-violet-100/70 bg-[#14061c] text-violet-50',
    label: 'text-violet-100',
    pct: 'text-violet-50',
  },
  {
    border: 'border-sky-200/55',
    panel: 'bg-[linear-gradient(165deg,rgba(56,189,248,0.22),rgba(4,14,22,0.9))]',
    badge: 'border-sky-200/70 bg-[#061820] text-sky-50',
    label: 'text-sky-100',
    pct: 'text-white',
  },
  {
    border: 'border-rose-200/55',
    panel: 'bg-[linear-gradient(165deg,rgba(244,63,94,0.24),rgba(22,8,12,0.9))]',
    badge: 'border-rose-100/70 bg-[#1c0610] text-rose-50',
    label: 'text-rose-100',
    pct: 'text-rose-50',
  },
] as const;

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

        <div className="mt-2 flex justify-end">
          <div className="inline-block rounded-full bg-white/95 px-3.5 py-1.5 shadow-sm">
            <CareerOtherTracksLink currentId="au_sellers" />
          </div>
        </div>
        {cardEligibility && cardBonus ? <FinelyOsAlertBanner tone="success" message={cardBonus.description} /> : null}

        {/* Supply-floor hero — Seller Hub mock left, copy + CTAs right */}
        <section
          className="relative overflow-hidden rounded-3xl border border-white/12 p-6 sm:p-9"
          style={{
            background:
              'linear-gradient(145deg,#020b10 0%,#041820 38%,#0a1628 72%,#031018 100%), radial-gradient(ellipse 60% 50% at 92% 8%, rgba(251,191,36,0.22), transparent 55%), radial-gradient(ellipse 50% 45% at 6% 90%, rgba(16,185,129,0.18), transparent 52%), radial-gradient(ellipse 40% 35% at 55% 40%, rgba(56,189,248,0.1), transparent 60%)',
          }}
        >
          {/* Atmosphere layers */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
            }}
          />
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl" />

          <div className="relative grid gap-9 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="order-2 lg:order-1">
              <AuSellerShelfMock />
            </div>
            <div className="order-1 space-y-5 lg:order-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className={SHELF_KICKER}>{AU_SELLER.programName}</p>
                <span className="rounded-full border border-emerald-300/40 bg-emerald-400/12 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-100">
                  Supply track
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.07] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
                {AU_SELLER_MARKETING_HEADLINE}
              </h1>
              <p className={`${SHELF_BODY} max-w-xl`}>
                You list verified inventory and fulfill placements. Finely runs the buyer marketplace, intake,
                verification, and order routing — no ads, no DMs, no chasing buyers. Restore and dispute files are the
                specialist track, not yours.
              </p>

              <div className="grid grid-cols-3 gap-2.5 max-w-lg">
                {[
                  { icon: Megaphone, label: 'Buyer demand', sub: 'Finely markets', tone: 'border-sky-300/30 bg-sky-500/[0.1]', iconCls: 'text-sky-300' },
                  { icon: CreditCard, label: 'Your inventory', sub: 'list & rotate', tone: 'border-emerald-300/30 bg-emerald-500/[0.1]', iconCls: 'text-emerald-300' },
                  { icon: Wallet, label: 'Payouts', sub: '35%+ floor', tone: 'border-violet-300/35 bg-violet-500/[0.12]', iconCls: 'text-violet-200' },
                ].map(({ icon: Icon, label, sub, tone, iconCls }) => (
                  <div key={label} className={`rounded-xl border ${tone} px-3 py-3.5 text-center`}>
                    <Icon className={`mx-auto mb-1.5 ${iconCls}`} size={20} />
                    <div className="text-[12px] font-bold text-white">{label}</div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/60">{sub}</div>
                  </div>
                ))}
              </div>

              {/* Primary actions — gold signup vs sky guide vs cool hub */}
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => navigate(sellerSignupUrl)} className={roleJoinBtn(ROLE)}>
                  Start AU seller signup <ArrowRight size={15} />
                </button>
                <button type="button" onClick={() => navigate(AU_SELLER.hubPath)} className={roleSecondaryBtn(ROLE)}>
                  Open {AU_SELLER.hubName}
                </button>
              </div>
              <p className="text-[12px] leading-relaxed text-white/55">
                Looking to buy a tradeline instead of supplying one?{' '}
                <button
                  type="button"
                  className="font-semibold text-sky-300 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-200"
                  onClick={() => navigate('/tradelines')}
                >
                  Browse buyer inventory <ShoppingBag size={12} className="inline -mt-0.5" />
                </button>
              </p>

              <div className="rounded-2xl border border-sky-300/30 bg-[linear-gradient(135deg,rgba(56,189,248,0.12),rgba(139,92,246,0.1))] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-200">Free — before you list a single card</p>
                <RoleGuideCta role={ROLE} className="mt-3" />
                <p className="mt-3 text-[11px] leading-relaxed text-white/50">{ROLE_ACTION_LEGEND[ROLE]}</p>
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
            <div className={`${SHELF_PANEL} !border-emerald-300/25`}>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">
                <CreditCard size={13} /> Your side of the shelf
              </p>
              <ul className="mt-3 space-y-2.5">
                {workSplit.youDo.map((l) => (
                  <li key={l} className="flex gap-2.5 text-[13px] leading-relaxed text-white/85">
                    <Check size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${SHELF_PANEL} !border-sky-300/25`}>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-sky-100">
                <UserCheck size={13} /> Finely’s side
              </p>
              <ul className="mt-3 space-y-2.5">
                {workSplit.finelyRuns.map((l) => (
                  <li key={l} className="flex gap-2.5 text-[13px] leading-relaxed text-white/85">
                    <Check size={14} className="mt-0.5 shrink-0 text-sky-300" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="rounded-2xl border border-rose-300/35 bg-rose-500/[0.1] px-5 py-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-rose-100">
              <XCircle size={13} /> Not the seller’s job
            </p>
            <ul className="mt-2.5 grid gap-2 sm:grid-cols-3">
              {workSplit.notYourJob.map((l) => (
                <li key={l} className="text-[13px] leading-relaxed text-rose-50/90">
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
          <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
            <div className="rounded-2xl border border-violet-200/55 bg-[linear-gradient(160deg,rgba(139,92,246,0.22),rgba(2,20,26,0.65))] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-100">Activation</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[#fff8e7] drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                {AU_SELLER.startupFeeLabel}
              </p>
              <p className="mt-1.5 text-[12px] text-white/80">
                one-time · first {AU_SELLER.listingSeasonDays}-day season included
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-sky-200/40 bg-black/45 p-5">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-sky-100">
                <RefreshCw size={12} /> Season terms
              </p>
              <ul className="mt-2.5 space-y-2">
                {AU_SELLER_ACTIVATION_BULLETS.map((b) => (
                  <li key={b} className="flex gap-2 text-[13px] leading-relaxed text-white/82">
                    <Check size={14} className="mt-0.5 shrink-0 text-sky-300" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payout tier ladder — high-contrast % numbers */}
          <div className="space-y-2.5">
            <p className="text-[13px] leading-relaxed text-white/82">
              Every seller starts at a{' '}
              <strong className="text-violet-100">{AU_SELLER.defaultCommissionPct}% floor</strong> — your share climbs
              automatically as your inventory grows and stays reliable.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {AU_SELLER_PAYOUT_TIERS.map((tier, i) => {
                const accent = TIER_ACCENT[i % TIER_ACCENT.length];
                return (
                  <div
                    key={tier.id}
                    className={`relative rounded-2xl border ${accent.border} ${accent.panel} p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_28px_-20px_rgba(0,0,0,0.8)]`}
                  >
                    {tier.badge ? (
                      <span
                        className={`absolute -top-2.5 right-4 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${accent.badge}`}
                      >
                        {tier.badge}
                      </span>
                    ) : null}
                    <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${accent.label}`}>{tier.name}</p>
                    <p
                      className={`mt-2 text-4xl font-black tracking-tight tabular-nums leading-none ${accent.pct} drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]`}
                    >
                      {tier.payoutPct}
                      <span className="text-2xl">%</span>
                    </p>
                    <p className={`mt-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${accent.label}`}>
                      seller payout
                    </p>
                    <p className="mt-2 text-[12px] leading-relaxed text-white/82">{tier.requirement}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[13px] leading-relaxed text-white/65">
            Running partner restore or build files instead? That is the{' '}
            <button
              type="button"
              className="font-semibold text-violet-200 underline decoration-violet-300/40 underline-offset-4 hover:text-violet-100"
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
            {AU_SELLER_OFFERINGS.map((offering, i) => {
              const chipTone =
                i % 4 === 0
                  ? 'border-emerald-300/25 bg-emerald-400/[0.1] text-emerald-100'
                  : i % 4 === 1
                    ? 'border-violet-300/25 bg-violet-400/[0.1] text-violet-100'
                    : i % 4 === 2
                      ? 'border-sky-300/25 bg-sky-400/[0.1] text-sky-100'
                      : 'border-violet-300/25 bg-violet-400/[0.1] text-violet-100';
              const panelTone =
                i % 4 === 0
                  ? '!border-emerald-300/20'
                  : i % 4 === 1
                    ? '!border-violet-300/25'
                    : i % 4 === 2
                      ? '!border-sky-300/20'
                      : '!border-violet-300/20';
              return (
                <div key={offering.title} className={`${SHELF_PANEL} p-6 ${panelTone}`}>
                  <h3 className="text-base font-bold text-white">{offering.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/82">{offering.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {offering.included.map((item) => (
                      <span key={item} className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${chipTone}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
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
              <div key={b.label} className="rounded-xl border border-white/16 bg-black/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <p className="text-[15px] font-semibold text-white">{b.label}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/80">{b.detail}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              { title: 'Inside access', rows: ROLE_INSIDE_ACCESS[ROLE], accent: 'text-emerald-100' },
              { title: 'Only a supplier can', rows: ROLE_UNIQUE_CAPABILITIES[ROLE], accent: 'text-violet-100' },
              { title: 'Your seller profile', rows: ROLE_PROFILE_FEATURES[ROLE], accent: 'text-sky-100' },
            ].map((col) => (
              <div key={col.title} className="space-y-3.5">
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${col.accent}`}>{col.title}</p>
                <dl className="space-y-3">
                  {col.rows.map((r) => (
                    <div key={r.label} className="border-t border-white/16 pt-2.5">
                      <dt className="text-sm font-semibold text-white">{r.label}</dt>
                      <dd className="mt-1 text-[13px] leading-relaxed text-white/78">{r.detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* Get started — one clear path, choice-card apply (no field wall: signup collects the rest) */}
        <section id="au-seller-apply" className="scroll-mt-24 space-y-4">
          <div className="max-w-2xl space-y-2.5">
            <p className={SHELF_KICKER}>Get started</p>
            <h2 className={SHELF_TITLE}>Join as an AU seller.</h2>
          </div>
          <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: 'Sign up with the AU seller role.', tone: 'text-violet-200/80' },
              { step: 'Verify your supply-side profile and payout method.', tone: 'text-emerald-200/80' },
              {
                step: `Activate for ${AU_SELLER.startupFeeLabel} — includes your first marketing season.`,
                tone: 'text-sky-200/80',
              },
              {
                step: `Publish listings in ${AU_SELLER.hubName} — Finely routes buyers to you.`,
                tone: 'text-violet-200/80',
              },
            ].map((row, i) => (
              <li key={row.step} className="rounded-xl border border-white/16 bg-black/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <span className={`font-mono text-sm font-black ${row.tone}`}>{String(i + 1).padStart(2, '0')}</span>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/82">{row.step}</p>
              </li>
            ))}
          </ol>
          <CareerChoiceApply
            kicker="Your path"
            title="AU Seller — one activation, no tier to pick."
            selectedLabel={`Floor payout ${AU_SELLER.defaultCommissionPct}% · climbs to ${AU_SELLER_PAYOUT_TIERS[AU_SELLER_PAYOUT_TIERS.length - 1]?.payoutPct}%`}
            description={`${AU_SELLER.startupFeeLabel} one-time activation includes your first ${AU_SELLER.listingSeasonDays}-day marketing season. Create your account and Finely walks you through verification and your first listing.`}
            ctaLabel="Start signup"
            onCtaClick={() => navigate(sellerSignupUrl)}
            secondaryLabel="Already a seller? Open hub"
            onSecondaryClick={() => navigate(AU_SELLER.hubPath)}
            accent="rose"
          />
          <div className="rounded-2xl border border-sky-300/25 bg-sky-500/[0.08] p-6">
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

        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} pb-16`}>{ROLE_COMPLIANCE_FOOTNOTES[ROLE]}</p>

        <FinelyOsPageFooter />
      </div>

      <CareerTierStickySummary
        roleLabel="AU Seller"
        economics={{ keepPctLabel: `${AU_SELLER.defaultCommissionPct}%+ payout`, buyInLabel: `${AU_SELLER.startupFeeLabel} to activate` }}
        ctaLabel="Start signup"
        onCta={() => navigate(sellerSignupUrl)}
        accent="rose"
      />
    </PageShell>
  );
}
