import React, { useMemo, useState } from 'react';
import { ArrowRight, Sparkles, UserCheck, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareerOtherTracksLink } from '../components/careers/CareerOtherTracksLink';
import { CareerPriceCardGrid, type CareerPriceCardOption } from '../components/careers/CareerPriceCard';
import { CareerPackagePanel, type CareerPackageBlock } from '../components/careers/CareerPackagePanel';
import type { CareerAccent } from '../components/careers/careerUi';
import { CareerQualificationsPanel } from '../components/careers/CareerQualificationsPanel';
import { CareerGuideTwoSheetMedia } from '../components/careers/CareerGuideTwoSheetMedia';
import { CareerTierStickySummary } from '../components/careers/CareerTierStickySummary';
import { CreditSpecialistGuideActions } from '../components/creditSpecialist/CreditSpecialistGuideActions';
import { CreditSpecialistGuideBookMockup } from '../components/creditSpecialist/CreditSpecialistGuideBookMockup';
import { DedicatedSheetLinkStrip } from '../components/resources/DedicatedSheetLinkStrip';
import { BackToSiteButton } from '../components/navigation/BackToSiteButton';
import {
  CS_OFFER,
  CS_OFFER_ENTRY_RULES,
  creditSpecialistAccountSignupUrl,
  getCreditSpecialistOfferTier,
  getCreditSpecialistPlanBullets,
  listPublicCreditSpecialistOfferTiers,
  type CreditSpecialistOfferTierId,
} from '../config/creditSpecialistOffer';
import { CS } from '../config/creditSpecialistProgram';
import { ROLE_COMPLIANCE_FOOTNOTES, ROLE_WORK_SPLIT } from '../config/rolePartnerPrograms';
import {
  isCreditSpecialistJoinReadyForAccountSignup,
  loadCreditSpecialistJoinIntent,
} from '../lib/creditSpecialistJoinIntent';
import { CS_GUIDE_META, CS_GUIDE_READ_PATH } from './leadmagnet/creditSpecialistGuideContent';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { LandingTypewriterTitle } from '../components/landing/LandingTypewriterTitle';
import { FINELY_OS_COMPLIANCE_FOOTNOTE, FINELY_OS_PAGE } from '../features/os/finelyOsLightUi';

const ROLE = 'cs' as const;

/** Distinct, non-purple accent per tier — gold/navy/emerald/sky brand only. */
const TIER_ACCENT: Record<CreditSpecialistOfferTierId, CareerAccent> = {
  cs_foundation: 'sky',
  cs_builder: 'gold',
  cs_pro: 'emerald',
  cs_elite: 'navy',
};

export default function CreditSpecialistPricingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tiers = useMemo(() => listPublicCreditSpecialistOfferTiers(), []);
  const workSplit = ROLE_WORK_SPLIT[ROLE];

  const [selectedTierId, setSelectedTierId] = useState<CreditSpecialistOfferTierId>(() => {
    const fromUrl = (searchParams.get('tier') || '').trim();
    return getCreditSpecialistOfferTier(fromUrl)?.id ?? tiers[1]?.id ?? tiers[0]!.id;
  });

  usePublicSeoMeta({
    title: 'Credit Specialist pricing — run partner files on revenue share',
    description:
      'You run partner files; Finely supplies the method, the OS, and the back office. Transparent tiers, a 3-lead minimum, a 30-day free-leads window, revenue share — no platform fee.',
    path: CS_OFFER.pricingPath,
  });

  const selectedTier = getCreditSpecialistOfferTier(selectedTierId) ?? tiers[0]!;
  const selectedAccent: CareerAccent = TIER_ACCENT[selectedTier.id];
  const canSkipToAccount = isCreditSpecialistJoinReadyForAccountSignup(loadCreditSpecialistJoinIntent());

  const selectTier = (id: string) => {
    setSelectedTierId(id as CreditSpecialistOfferTierId);
    const next = new URLSearchParams(searchParams);
    next.set('tier', id);
    setSearchParams(next, { replace: true });
  };

  const goJoin = (tierId?: string) => {
    const id = tierId || selectedTierId;
    const qs = id ? `?tier=${encodeURIComponent(id)}` : '';
    navigate(`${CS_OFFER.joinPath}${qs}`);
  };

  const tierOptions: CareerPriceCardOption[] = tiers.map((t) => ({
    id: t.id,
    name: t.name,
    tagline: t.tagline,
    badge: t.badge,
    priceLabel: `${t.keepPctLabel} keep`,
    priceSubLabel: 'revenue share · no platform fee',
    bullets: getCreditSpecialistPlanBullets(t),
    accent: TIER_ACCENT[t.id],
  }));

  const qualificationItems = CS_OFFER_ENTRY_RULES.bullets.map((b) => ({ title: b.title, body: b.body }));

  const packageBlocks: CareerPackageBlock[] = [
    { key: 'access', title: 'Access', items: selectedTier.access },
    { key: 'education', title: 'Education', items: selectedTier.education },
    { key: 'methods', title: 'Methods', items: selectedTier.methods },
    { key: 'tools', title: 'Tools', items: selectedTier.tools },
  ];

  return (
    <PageShell badge="Public" title={`${CS.singular} pricing`} subtitle={workSplit.headline} hideHero>
      <div className={FINELY_OS_PAGE}>
        {/* Header — Back · Home · Other careers */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BackToSiteButton variant="ghost" label="Back to home" />
          <CareerOtherTracksLink currentId="credit_specialists" />
        </div>

        {/* Hero — brand, one sell sentence, proof chips, guide book + folio + Read/Download */}
        <section className="relative overflow-hidden rounded-3xl border-2 border-amber-200 bg-white p-6 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-700">
                Finely Cred · {CS.programName}
              </p>
              <LandingTypewriterTitle
                as="h1"
                text="Credit Specialist: you run the files, we supply the method."
                className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.05]"
                highlight="we supply the method."
                highlightClassName="text-amber-700 font-semibold"
                speedMs={30}
              />
              <p className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-600">
                Bring <strong className="text-slate-900">{CS_OFFER.minLeadsRequired} partner leads</strong> in{' '}
                <strong className="text-slate-900">{CS_OFFER.freeLeadsWindowDays} days</strong> and unlock the full
                dispute method, letter studio, evidence vault, and OS access on transparent revenue share — no
                platform fee.
              </p>

              <div className="grid grid-cols-3 gap-2.5 max-w-lg">
                {[
                  { n: String(CS_OFFER.minLeadsRequired), label: 'Leads' },
                  { n: String(CS_OFFER.freeLeadsWindowDays), label: 'Days free' },
                  { n: '$0', label: 'Platform fee' },
                ].map((x) => (
                  <div key={x.label} className="rounded-2xl border border-amber-200/50 bg-amber-50 px-3 py-3.5 text-center">
                    <div className="text-2xl sm:text-3xl font-black tabular-nums text-amber-700">{x.n}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{x.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => goJoin(selectedTierId)}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-[#1c1206] shadow-lg shadow-amber-500/25 transition-all hover:brightness-105"
                >
                  Join as Credit Specialist <ArrowRight size={16} />
                </button>
                <a
                  href="#choose-tier"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-slate-800 transition-all hover:border-slate-400 hover:bg-slate-50"
                >
                  Compare tiers
                </a>
              </div>
            </div>

            <CareerGuideTwoSheetMedia
              theme="light"
              eyebrow="Free · read every chapter first"
              book={
                <CreditSpecialistGuideBookMockup
                  title={CS_GUIDE_META.shortTitle}
                  edition={CS_GUIDE_META.edition}
                  tagline={CS_GUIDE_META.tagline}
                  valueLabel={CS_GUIDE_META.valueLabel}
                  onOpen={() => navigate(CS_GUIDE_READ_PATH)}
                  tall
                />
              }
              folioTitle={CS_GUIDE_META.twoSheetLabel}
              folioPageLabels={['Sheet 1 — The offer', 'Sheet 2 — Operate']}
              actions={<CreditSpecialistGuideActions tone="onLight" size="lg" />}
              helperText="No signup required to read. The 2-sheet PDF covers the offer and your weekly operating rhythm."
            />
          </div>
        </section>

        {/* Who does the work — white/slate cards, no purple */}
        <section className="space-y-4">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Who does the work</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{workSplit.headline}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                <Sparkles size={13} /> You do
              </p>
              <ul className="mt-3 space-y-2">
                {workSplit.youDo.map((l) => (
                  <li key={l} className="text-[13px] leading-relaxed text-slate-600">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                <UserCheck size={13} /> Finely runs
              </p>
              <ul className="mt-3 space-y-2">
                {workSplit.finelyRuns.map((l) => (
                  <li key={l} className="text-[13px] leading-relaxed text-slate-600">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700">
                <XCircle size={13} /> Not on you
              </p>
              <ul className="mt-3 space-y-2">
                {workSplit.notYourJob.map((l) => (
                  <li key={l} className="text-[13px] leading-relaxed text-slate-600">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Choose your tier — large price cards, the primary decision on this page */}
        <section id="choose-tier" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Choose your tier</h2>
            <p className="mt-2 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
              Every tier includes the {CS_OFFER.minLeadsRequired}-lead minimum and {CS_OFFER.freeLeadsWindowDays}-day
              free-leads window. Pick where you're starting — you can graduate later.
            </p>
          </div>
          <CareerPriceCardGrid
            options={tierOptions}
            selectedId={selectedTierId}
            onSelect={selectTier}
            onConfirm={goJoin}
            selectLabel="Join as Credit Specialist"
            confirmLabel={(opt) => `Continue with ${opt.name}`}
            columns={4}
          />
        </section>

        {/* What you get — for the selected tier */}
        <section className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{selectedTier.name}</p>
          <CareerPackagePanel
            heading="Here's what this tier includes"
            subheading={selectedTier.tagline}
            blocks={packageBlocks}
            accent={selectedAccent}
          />
          {selectedTier.support.length ? (
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Support</p>
              <ul className="mt-2 space-y-1.5">
                {selectedTier.support.map((s) => (
                  <li key={s} className="text-sm leading-relaxed text-slate-600">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* Qualifications — plain English */}
        <section>
          <CareerQualificationsPanel
            heading="What it takes to qualify"
            subheading="No hidden fine print — this is the whole gate."
            requirements={qualificationItems}
            accent="emerald"
          />
        </section>

        {/* Partner one-sheets — secondary */}
        <section className="opacity-95">
          <DedicatedSheetLinkStrip
            heading="Partner-facing one-sheets you can send from day one"
            subline="Free · honest page counts · use them to source your lead minimum"
          />
        </section>

        {/* Join CTA */}
        <section className="rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-9 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Next step</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Join {selectedTier.name} — keep {selectedTier.keepPctLabel}
          </h2>
          <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
            Confirm the {CS_OFFER.minLeadsRequired}-lead commitment, your {CS_OFFER.freeLeadsWindowDays}-day window, and
            create your account. You can change tiers any time before you certify.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => goJoin(selectedTierId)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0a1628] px-6 py-3.5 text-[12px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition-all hover:bg-[#132339]"
            >
              Continue with {selectedTier.name} <ArrowRight size={16} />
            </button>
            {canSkipToAccount ? (
              <button
                type="button"
                onClick={() => navigate(creditSpecialistAccountSignupUrl({ tierId: selectedTierId }))}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3.5 text-[12px] font-black uppercase tracking-[0.14em] text-slate-800 transition-all hover:border-slate-400 hover:bg-slate-50"
              >
                Skip to account signup
              </button>
            ) : null}
          </div>
        </section>

        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} pb-16`}>
          {CS_OFFER.complianceFootnote} · {ROLE_COMPLIANCE_FOOTNOTES[ROLE]}
        </p>

        <FinelyOsPageFooter />
      </div>

      <CareerTierStickySummary
        roleLabel="Credit Specialist"
        tierName={selectedTier.name}
        economics={{ keepPctLabel: `${selectedTier.keepPctLabel} keep`, buyInLabel: '$0 platform fee' }}
        ctaLabel={`Continue with ${selectedTier.name}`}
        onCta={() => goJoin(selectedTierId)}
        accent={selectedAccent}
      />
    </PageShell>
  );
}
