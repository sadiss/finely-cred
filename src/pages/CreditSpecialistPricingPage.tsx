import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles, Target, TrendingUp, UserCheck, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareersQuickNav } from '../components/careers/CareersQuickNav';
import { RoleGuideCta } from '../components/careers/RoleGuideCta';
import { ROLE_ACTION_LEGEND, roleJoinBtn, roleSecondaryBtn } from '../components/careers/roleActionButtons';
import { SpecialistCredentialMock } from '../components/careers/roleProfileMockups';
import { DedicatedSheetLinkStrip } from '../components/resources/DedicatedSheetLinkStrip';
import { CreditSpecialistCareerGuide } from '../components/creditSpecialist/CreditSpecialistCareerGuide';
import { CreditSpecialistGuideActions } from '../components/creditSpecialist/CreditSpecialistGuideActions';
import { CreditSpecialistLeadRulesPanel } from '../components/creditSpecialist/CreditSpecialistLeadRulesPanel';
import { CreditSpecialistOfferingsPanel } from '../components/creditSpecialist/CreditSpecialistOfferingsPanel';
import { CreditSpecialistPricingTiers } from '../components/creditSpecialist/CreditSpecialistPricingTiers';
import {
  CS_OFFER,
  CS_OPPORTUNITY_FRAMING,
  creditSpecialistAccountSignupUrl,
  listPublicCreditSpecialistOfferTiers,
  type CreditSpecialistOfferTier,
} from '../config/creditSpecialistOffer';
import { CS } from '../config/creditSpecialistProgram';
import {
  ROLE_BENEFITS,
  ROLE_COMPLIANCE_FOOTNOTES,
  ROLE_INSIDE_ACCESS,
  ROLE_PROFILE_FEATURES,
  ROLE_UNIQUE_CAPABILITIES,
  ROLE_WORK_SPLIT,
} from '../config/rolePartnerPrograms';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { LandingTypewriterTitle } from '../components/landing/LandingTypewriterTitle';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_LANDING_IVORY_BODY,
  FINELY_OS_LANDING_IVORY_KICKER,
  FINELY_OS_LANDING_IVORY_TITLE,
  FINELY_OS_LANDING_PLATINUM_TITLE,
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

const ROLE = 'cs' as const;

/** Holographic credential language — dark-safe ink so nothing goes dark-on-dark. */
const CRED_KICKER = 'text-[10px] font-black uppercase tracking-[0.3em] text-violet-200/80';
const CRED_TITLE = 'text-2xl sm:text-3xl font-bold tracking-tight text-white';
const CRED_BODY = 'text-sm leading-relaxed text-white/70';
const CRED_PANEL =
  'rounded-2xl border border-violet-300/25 bg-[linear-gradient(150deg,rgba(76,29,149,0.28),rgba(15,23,42,0.6))] p-5 backdrop-blur-sm';

export default function CreditSpecialistPricingPage() {
  const navigate = useNavigate();
  const [laneTab, setLaneTab] = useState<LaneTab>('offer');
  const tiers = listPublicCreditSpecialistOfferTiers();
  const workSplit = ROLE_WORK_SPLIT[ROLE];

  usePublicSeoMeta({
    title: 'Credit Specialist offer — run partner files on revenue share',
    description:
      'You run partner files; Finely supplies the method, the OS, and the back office. Transparent tiers, lead minimum, free-leads window, revenue share — no platform fee.',
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
      hideHero
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Back
          </button>
          <a href="/" className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Home
          </a>
        </div>

        <CareersQuickNav active="credit_specialists" className="mt-4" />

        {/* Credential hero — copy left, portal badge right (portrait mock, unlike any other role page) */}
        <section
          className={`relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-9 ${finelyOsLandingContrastSection('fc-band-violet')}`}
          data-fc-contrast-band="1"
          data-fc-accent="violet"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                'radial-gradient(ellipse 60% 45% at 78% 4%, rgba(217,70,239,0.2), transparent 58%), radial-gradient(ellipse 55% 45% at 6% 90%, rgba(56,189,248,0.14), transparent 55%)',
            }}
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-5">
              <p className={CRED_KICKER}>
                Finely Cred · {CS.programName}
              </p>
              <LandingTypewriterTitle
                as="h1"
                text="You run the files. We supply the method."
                className={`${FINELY_OS_LANDING_PLATINUM_TITLE} !text-4xl sm:!text-5xl`}
                highlight="We supply the method."
                highlightClassName="text-violet-300 font-semibold"
                speedMs={36}
              />
              <p className="text-base sm:text-lg leading-relaxed text-white/75 max-w-xl">
                Bring at least <strong className="text-white">{CS_OFFER.minLeadsRequired} partner leads</strong>. You get{' '}
                <strong className="text-white">{CS_OFFER.freeLeadsWindowDays} days</strong> to source them free with
                Finely capture tools — then the full dispute method, letter studio, evidence vault, and OS access on
                transparent revenue share. No platform fee.
              </p>

              <div className="grid grid-cols-3 gap-2.5 max-w-lg">
                {[
                  { n: String(CS_OFFER.minLeadsRequired), label: 'Leads min' },
                  { n: String(CS_OFFER.freeLeadsWindowDays), label: 'Days free leads' },
                  { n: '$0', label: 'Platform fee' },
                ].map((x) => (
                  <div key={x.label} className="rounded-2xl border border-violet-200/25 bg-black/30 px-3 py-3.5 text-center backdrop-blur">
                    <div className="text-2xl sm:text-3xl font-black tabular-nums text-violet-200">{x.n}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/50">{x.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button type="button" onClick={() => goJoin()} className={roleJoinBtn(ROLE)}>
                  Join the program <ArrowRight size={16} />
                </button>
                <button type="button" onClick={() => setLaneTab('tiers')} className={roleSecondaryBtn(ROLE)}>
                  Compare tiers
                </button>
              </div>

              <div className={`${CRED_PANEL} mt-5`}>
                <p className={CRED_KICKER}>Free — read every chapter before you commit</p>
                <RoleGuideCta role={ROLE} className="mt-3" />
                <p className="mt-3 text-[11px] leading-relaxed text-white/40">{ROLE_ACTION_LEGEND[ROLE]}</p>
              </div>
            </div>

            <SpecialistCredentialMock />
          </div>
        </section>

        {/* Who does the work — split ribbon under the hero */}
        <section
          className={`rounded-3xl border border-white/10 px-5 sm:px-8 py-10 ${finelyOsLandingContrastSection('fc-band-dark')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-5xl mx-auto space-y-7">
            <div className="max-w-2xl space-y-2.5">
              <p className={CRED_KICKER}>Who does the work</p>
              <h2 className={CRED_TITLE}>{workSplit.headline}</h2>
              <p className={CRED_BODY}>
                Specialists are the operator on the partner file — not a referral partner. Finely carries the method,
                the software, and the escalation paths behind you.
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-violet-300/30 bg-violet-500/[0.08] p-5">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-violet-200">
                  <Sparkles size={13} /> You do
                </p>
                <ul className="mt-3 space-y-2">
                  {workSplit.youDo.map((l) => (
                    <li key={l} className="text-[13px] leading-relaxed text-white/72">
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-sky-300/30 bg-sky-500/[0.08] p-5">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-sky-200">
                  <UserCheck size={13} /> Finely runs
                </p>
                <ul className="mt-3 space-y-2">
                  {workSplit.finelyRuns.map((l) => (
                    <li key={l} className="text-[13px] leading-relaxed text-white/72">
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-rose-300/25 bg-rose-500/[0.07] p-5">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-rose-200">
                  <XCircle size={13} /> Not on you
                </p>
                <ul className="mt-3 space-y-2">
                  {workSplit.notYourJob.map((l) => (
                    <li key={l} className="text-[13px] leading-relaxed text-rose-100/70">
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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
            { id: 'economics', label: '③ Payout economics' },
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
                <div className="border-t border-amber-900/15 pt-4">
                  <RoleGuideCta role={ROLE} ink="dark" compact />
                </div>
              </section>

              {/* Benefits ladder */}
              <section className="space-y-4">
                <div className="space-y-2">
                  <p className={CRED_KICKER}>Why specialists stay</p>
                  <h3 className={CRED_TITLE}>Benefits that compound as you certify.</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ROLE_BENEFITS[ROLE].map((b, i) => (
                    <div key={b.label} className={`${CRED_PANEL} flex gap-4`}>
                      <span className="text-lg font-black tabular-nums text-violet-300/50">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-white/92">{b.label}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-white/60">{b.detail}</p>
                      </div>
                    </div>
                  ))}
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
              <div className={`${finelyOsCatalogCard('amber')} !p-5`}>
                <p className="text-sm leading-relaxed text-white/75">{CS_OPPORTUNITY_FRAMING.earningsNote}</p>
              </div>
              <CreditSpecialistCareerGuide />
            </div>
          )}

          {laneTab === 'included' && (
            <div className="space-y-8">
              <CreditSpecialistOfferingsPanel />

              {/* Inside access + unique capabilities + profile features */}
              <section className="grid gap-4 lg:grid-cols-2">
                <div className={CRED_PANEL}>
                  <p className={CRED_KICKER}>Inside access</p>
                  <dl className="mt-3 space-y-3">
                    {ROLE_INSIDE_ACCESS[ROLE].map((r) => (
                      <div key={r.label} className="border-t border-white/10 pt-2.5">
                        <dt className="text-sm font-semibold text-white/90">{r.label}</dt>
                        <dd className="mt-1 text-[13px] leading-relaxed text-white/60">{r.detail}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className={CRED_PANEL}>
                  <p className={CRED_KICKER}>Only a specialist can</p>
                  <dl className="mt-3 space-y-3">
                    {ROLE_UNIQUE_CAPABILITIES[ROLE].map((r) => (
                      <div key={r.label} className="border-t border-white/10 pt-2.5">
                        <dt className="text-sm font-semibold text-white/90">{r.label}</dt>
                        <dd className="mt-1 text-[13px] leading-relaxed text-white/60">{r.detail}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>

              <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <div className="space-y-4">
                  <p className={CRED_KICKER}>Your portal profile</p>
                  <h3 className={CRED_TITLE}>A credential routed partners can read.</h3>
                  <dl className="space-y-3">
                    {ROLE_PROFILE_FEATURES[ROLE].map((f) => (
                      <div key={f.label} className="border-t border-white/10 pt-2.5">
                        <dt className="text-sm font-semibold text-white/90">{f.label}</dt>
                        <dd className="mt-1 text-[13px] leading-relaxed text-white/60">{f.detail}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <SpecialistCredentialMock />
              </section>

              <DedicatedSheetLinkStrip
                heading="Partner-facing kits you can send from day one"
                subline="Free · honest page counts · use them to source your lead minimum"
              />

              <div className={`${finelyOsCatalogCard('sky')} !p-6 space-y-3`}>
                <h3 className="text-xl font-bold text-white">Building a company instead?</h3>
                <p className="text-sm leading-relaxed text-white/70">
                  Agency partners get a tenant, team seats, and a white-label portal — a separate track from solo
                  specialists.
                </p>
                <button type="button" onClick={() => navigate('/agency-partners')} className={FINELY_OS_SECONDARY_BTN}>
                  Agency partners <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {laneTab === 'join' && (
            <div className={`space-y-6 ${finelyOsCatalogCard('emerald')} !p-6 sm:!p-9`}>
              <header className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200/85">Next step</p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Easy, premium onboarding</h2>
                <p className="text-sm sm:text-base leading-relaxed text-white/72 max-w-2xl">
                  Guided steps: understand the {CS_OFFER.minLeadsRequired}-lead rule → confirm your{' '}
                  {CS_OFFER.freeLeadsWindowDays}-day window → pick a tier → create your account.
                </p>
              </header>
              <ol className="space-y-2 list-decimal pl-5 text-sm leading-relaxed text-white/72">
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
                  <li key={line} className="flex gap-2 text-sm leading-relaxed text-white/72">
                    <Check size={17} className="shrink-0 text-emerald-300" />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => goJoin()} className={roleJoinBtn(ROLE)}>
                  Open join / onboarding <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(creditSpecialistAccountSignupUrl())}
                  className={FINELY_OS_SUCCESS_BTN}
                >
                  Skip to account signup
                </button>
              </div>
              <div className="border-t border-white/10 pt-4 space-y-4">
                <RoleGuideCta role={ROLE} compact />
                <CreditSpecialistGuideActions tone="os" size="sm" />
              </div>
            </div>
          )}
        </FinelyUnifiedHubLayout>

        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>
          {CS_OFFER.complianceFootnote} · {ROLE_COMPLIANCE_FOOTNOTES[ROLE]}
        </p>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
