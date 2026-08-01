import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareersQuickNav } from '../components/careers/CareersQuickNav';
import { CreditSpecialistCareerGuide } from '../components/creditSpecialist/CreditSpecialistCareerGuide';
import { CreditSpecialistLeadRulesPanel } from '../components/creditSpecialist/CreditSpecialistLeadRulesPanel';
import { CreditSpecialistOfferingsPanel } from '../components/creditSpecialist/CreditSpecialistOfferingsPanel';
import { CreditSpecialistPricingTiers } from '../components/creditSpecialist/CreditSpecialistPricingTiers';
import { CS_PUBLIC } from '../components/creditSpecialist/creditSpecialistPublicUi';
import {
  CS_OFFER,
  CS_OPPORTUNITY_FRAMING,
  creditSpecialistAccountSignupUrl,
  listPublicCreditSpecialistOfferTiers,
  type CreditSpecialistOfferTier,
} from '../config/creditSpecialistOffer';
import { CS } from '../config/creditSpecialistProgram';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { LandingTypewriterTitle } from '../components/landing/LandingTypewriterTitle';
import { PublicLaneTitle } from '../components/public/PublicLaneTitle';
import { CS_GUIDE_READ_PATH } from './leadmagnet/creditSpecialistGuideContent';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_LANDING_IVORY_BODY,
  FINELY_OS_LANDING_IVORY_KICKER,
  FINELY_OS_LANDING_IVORY_TITLE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsLandingContrastSection,
  finelyOsLandingIvoryCard,
  finelyOsLandingWealthyIvorySection,
} from '../features/os/finelyOsLightUi';

type LaneTab = 'offer' | 'tiers' | 'economics' | 'included' | 'join';

export default function CreditSpecialistPricingPage() {
  const navigate = useNavigate();
  const [laneTab, setLaneTab] = useState<LaneTab>('offer');
  const tiers = listPublicCreditSpecialistOfferTiers();

  usePublicSeoMeta({
    title: 'Credit Specialist pricing & offer',
    description:
      'Transparent Credit Specialist tiers — 3-lead minimum, 30-day free-leads window, revenue share, education, methods, and full Finely OS access.',
    path: CS_OFFER.pricingPath,
  });

  const goJoin = (tier?: CreditSpecialistOfferTier) => {
    const qs = tier ? `?tier=${encodeURIComponent(tier.id)}` : '';
    navigate(`${CS_OFFER.joinPath}${qs}`);
  };

  return (
    <PageShell
      badge="Public"
      title={`${CS.singular} offer`}
      subtitle={`${CS_OFFER.minLeadsRequired} leads minimum · ${CS_OFFER.freeLeadsWindowDays}-day free-leads window · revenue share, not a platform fee.`}
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Back
          </button>
          <a href="/" className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Home
          </a>
          <button type="button" onClick={() => goJoin()} className={FINELY_OS_SUCCESS_BTN}>
            Start join / onboarding
          </button>
          <button type="button" onClick={() => navigate(CS_OFFER.guidePath)} className={FINELY_OS_SECONDARY_BTN}>
            <BookOpen size={14} /> Free specialist guide
          </button>
        </div>

        <CareersQuickNav active="credit_specialists" className="mt-6" />

        {/* Dark depth hero */}
        <section
          className={`relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-10 lg:p-12 ${finelyOsLandingContrastSection('fc-band-violet')}`}
          data-fc-contrast-band="1"
          data-fc-accent="violet"
        >
          <PublicLaneTitle
            lane="specialist"
            eyebrow={`Finely Cred · ${CS.programName}`}
            text="Clear tiers. Real access. Zero platform fee."
            highlight="Zero platform fee."
            speedMs={36}
            subtitle={
              <p className="text-base sm:text-lg text-white/75 leading-relaxed">
                Bring at least <strong className="text-white">{CS_OFFER.minLeadsRequired} partner leads</strong>. You get{' '}
                <strong className="text-white">{CS_OFFER.freeLeadsWindowDays} days</strong> to source them free with Finely
                capture tools — then full education, methods, and OS access on transparent revenue share.
              </p>
            }
            actions={
              <>
                <button type="button" onClick={() => goJoin()} className={FINELY_OS_PRIMARY_BTN}>
                  Join the program <ArrowRight size={16} />
                </button>
                <button type="button" onClick={() => setLaneTab('tiers')} className={FINELY_OS_SECONDARY_BTN}>
                  Compare tiers
                </button>
                <button type="button" onClick={() => navigate(CS_GUIDE_READ_PATH)} className={FINELY_OS_SECONDARY_BTN}>
                  <BookOpen size={14} /> Read Guide
                </button>
              </>
            }
          />
          <div className="relative mt-8 grid grid-cols-3 gap-3 max-w-2xl">
            {[
              { n: String(CS_OFFER.minLeadsRequired), label: 'Leads min' },
              { n: String(CS_OFFER.freeLeadsWindowDays), label: 'Days free leads' },
              { n: '0$', label: 'Platform fee' },
            ].map((x) => (
              <div key={x.label} className="rounded-2xl border border-white/15 bg-white/5 px-3 py-4 text-center backdrop-blur">
                <div className="text-2xl sm:text-3xl font-black tabular-nums text-amber-300">{x.n}</div>
                <div className="mt-1 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white/60">{x.label}</div>
              </div>
            ))}
          </div>
        </section>

        <FinelyUnifiedHubLayout
          eyebrow={CS.programName}
          title="Credit Specialist offer hub"
          subtitle="Offer rules → tiers → economics → what’s included → join"
          accent="violet"
          kpis={[
            { label: 'Lead minimum', value: String(CS_OFFER.minLeadsRequired), hint: 'To unlock full access', accent: 'amber' },
            { label: 'Free-leads window', value: `${CS_OFFER.freeLeadsWindowDays}d`, hint: 'From signup', accent: 'violet' },
            { label: 'Public tiers', value: String(tiers.length), hint: 'Revenue share', accent: 'emerald' },
            { label: 'Platform fee', value: '$0', hint: 'Share of service fees', accent: 'sky' },
          ]}
          tabs={[
            { id: 'offer', label: '① Offer rules' },
            { id: 'tiers', label: '② Pricing tiers' },
            { id: 'economics', label: '③ Economics' },
            { id: 'included', label: '④ What’s included' },
            { id: 'join', label: '⑤ Join' },
          ]}
          activeTab={laneTab}
          onTabChange={(id) => setLaneTab(id as LaneTab)}
          primaryAction={{ label: 'Start onboarding', onClick: () => goJoin() }}
          secondaryAction={{ label: 'Read free guide', onClick: () => navigate(CS_OFFER.guidePath) }}
          tabDensity="comfortable"
        >
          {laneTab === 'offer' && (
            <div className="space-y-8">
              <CreditSpecialistLeadRulesPanel />

              <section className={`${finelyOsLandingWealthyIvorySection()} rounded-3xl !p-6 sm:!p-10 space-y-6`}>
                <div>
                  <p className={FINELY_OS_LANDING_IVORY_KICKER}>Opportunity</p>
                  <LandingTypewriterTitle
                    as="h2"
                    text={CS_OPPORTUNITY_FRAMING.headline}
                    className={`mt-2 ${FINELY_OS_LANDING_IVORY_TITLE}`}
                    delayMs={200}
                    speedMs={34}
                  />
                  <p className={`mt-3 ${FINELY_OS_LANDING_IVORY_BODY}`}>{CS_OPPORTUNITY_FRAMING.subline}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {CS_OPPORTUNITY_FRAMING.pillars.map((p, i) => {
                    const Icon = i === 0 ? TrendingUp : i === 1 ? Target : Sparkles;
                    return (
                      <div key={p.title} className={`${finelyOsLandingIvoryCard()} space-y-3`}>
                        <Icon className="text-[#0a1628]" size={22} />
                        <h3 className="text-lg font-bold text-[#0a1628]">{p.title}</h3>
                        <p className="text-sm leading-relaxed text-[#0a1628]/68">{p.body}</p>
                      </div>
                    );
                  })}
                </div>
                <p className={`${FINELY_OS_LANDING_IVORY_BODY} rounded-xl border border-amber-800/20 bg-amber-500/10 px-4 py-3`}>
                  {CS_OPPORTUNITY_FRAMING.earningsNote}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setLaneTab('tiers')} className={FINELY_OS_PRIMARY_BTN}>
                    See pricing tiers <ArrowRight size={16} />
                  </button>
                  <button type="button" onClick={() => goJoin()} className={FINELY_OS_SECONDARY_BTN}>
                    Start join flow
                  </button>
                </div>
              </section>
            </div>
          )}

          {laneTab === 'tiers' && (
            <CreditSpecialistPricingTiers
              ctaLabel="Continue with this tier"
              onCta={(tier) => goJoin(tier)}
            />
          )}

          {laneTab === 'economics' && (
            <div className="space-y-6">
              <div className={`${finelyOsCatalogCard('amber')} !p-5 border-2`}>
                <p className={CS_PUBLIC.bodySm}>{CS_OPPORTUNITY_FRAMING.earningsNote}</p>
              </div>
              <CreditSpecialistCareerGuide />
            </div>
          )}

          {laneTab === 'included' && (
            <div className="space-y-8">
              <CreditSpecialistOfferingsPanel />
              <div className={`${finelyOsCatalogCard('sky')} !p-6 sm:!p-8 border-2 space-y-3`}>
                <h3 className={CS_PUBLIC.cardTitle}>Building a company instead?</h3>
                <p className={CS_PUBLIC.body}>
                  Agency partners get a tenant, team seats, and white-label portal — a separate track from solo specialists.
                </p>
                <button type="button" onClick={() => navigate('/agency-partners')} className={FINELY_OS_SECONDARY_BTN}>
                  Agency partners <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {laneTab === 'join' && (
            <div className={`space-y-6 ${finelyOsCatalogCard('emerald')} !p-6 sm:!p-10 border-2`}>
              <header className="space-y-3">
                <p className={CS_PUBLIC.sectionKicker}>Next step</p>
                <h2 className={CS_PUBLIC.sectionTitle}>Easy, premium onboarding</h2>
                <p className={CS_PUBLIC.sectionLead}>
                  Guided steps: understand the {CS_OFFER.minLeadsRequired}-lead rule → confirm your{' '}
                  {CS_OFFER.freeLeadsWindowDays}-day window → pick a tier → create your account.
                </p>
              </header>
              <ol className={`${CS_PUBLIC.body} space-y-2 list-decimal pl-5`}>
                <li>Commit to bringing at least {CS_OFFER.minLeadsRequired} partner leads.</li>
                <li>Confirm you understand the {CS_OFFER.freeLeadsWindowDays}-day free-leads window.</li>
                <li>Choose a Specialist tier (you can graduate later).</li>
                <li>Capture your profile and open the account signup path.</li>
              </ol>
              <ul className="space-y-2">
                {[
                  'Progress steps with one clear next action',
                  'Read Guide help available on every step',
                  'Intent saved into lead notes for Finely ops',
                ].map((line) => (
                  <li key={line} className={`flex gap-2 ${CS_PUBLIC.body}`}>
                    <Check size={18} className="text-emerald-600 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => goJoin()} className={FINELY_OS_PRIMARY_BTN}>
                  Open join / onboarding <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(creditSpecialistAccountSignupUrl())}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  Skip to account signup
                </button>
                <button type="button" onClick={() => navigate(CS_GUIDE_READ_PATH)} className={FINELY_OS_SECONDARY_BTN}>
                  <BookOpen size={14} /> Read Guide
                </button>
              </div>
            </div>
          )}
        </FinelyUnifiedHubLayout>

        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>{CS_OFFER.complianceFootnote}</p>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
