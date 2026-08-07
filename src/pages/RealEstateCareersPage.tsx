import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Gauge,
  Handshake,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  Upload,
  UserCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareerOtherTracksLink } from '../components/careers/CareerOtherTracksLink';
import { CareerChoiceApply } from '../components/careers/CareerChoiceApply';
import { DigitalInviteShareBand } from '../components/digitalCards';
import { RoleGuideCta } from '../components/careers/RoleGuideCta';
import { ROLE_ACTION_LEGEND, roleJoinBtn, roleSecondaryBtn } from '../components/careers/roleActionButtons';
import { RealEstateReferralBoardMock } from '../components/careers/roleProfileMockups';
import { DedicatedSheetLinkStrip } from '../components/resources/DedicatedSheetLinkStrip';
import { LandingTypewriterTitle } from '../components/landing/LandingTypewriterTitle';
import {
  REAL_ESTATE_COMPLIANCE_FOOTNOTES,
  REAL_ESTATE_ONBOARDING_STEPS,
  listRealEstatePublicToolkitLevers,
  type RealEstatePlaybookLeverId,
} from '../config/realEstatePartnerPlaybook';
import {
  ROLE_BENEFITS,
  ROLE_COMPLIANCE_FOOTNOTES,
  ROLE_INSIDE_ACCESS,
  ROLE_PROFILE_FEATURES,
  ROLE_UNIQUE_CAPABILITIES,
  ROLE_WORK_SPLIT,
} from '../config/rolePartnerPrograms';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote, addLeadTags } from '../data/leadOpsRepo';
import { FinelyOsAlertBanner } from '../features/os/FinelyOsAlertBanner';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { openPublicChat } from '../lib/publicChatEvents';
import { signupUrlForRole } from '../lib/onboardingRoleRouting';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import {
  captureDigitalInviteCardFromUrl,
  digitalInviteCardLeadAttributionFields,
  digitalInviteCardLeadTags,
  formatDigitalInviteCardNote,
  getDigitalInviteCardEligibilityForRole,
  markDigitalInviteCardRedeemed,
} from '../lib/digitalInviteCardAttribution';
import { getDigitalInviteCardDef } from '../config/digitalInviteCards';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_LANDING_IVORY_BODY,
  FINELY_OS_LANDING_IVORY_KICKER,
  FINELY_OS_LANDING_IVORY_TITLE,
  FINELY_OS_LANDING_PLATINUM_TITLE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsLandingContrastSection,
  finelyOsLandingIvoryCard,
  finelyOsLandingWealthyIvorySection,
} from '../features/os/finelyOsLightUi';

const LEVER_ICONS: Record<RealEstatePlaybookLeverId, LucideIcon> = {
  high_limit_au_util: Gauge,
  dti_income_installments: TrendingDown,
  own_card_utilization: Gauge,
  inquiry_discipline: Target,
  collections_chargeoff_optics: ShieldAlert,
  dispute_factual_findings: Scale,
  report_refresh_vs_rapid_rescore: Clock3,
};

const ROLE = 're' as const;

/** Editorial “ledger” layout — asymmetric split hero, hairline column rules, numbered rail. */
const LEDGER_RULE = 'border-t border-white/10 pt-5';
/** Dark-ink label for the apply form — it sits on `CareerChoiceApply`'s white card, not a dark OS panel. */
const APPLY_FORM_LABEL = `${FINELY_OS_ENTITY_LABEL} !text-[#0a1628]/65`;

/**
 * Real estate affiliation career path — agents/brokers refer buyers & sellers into
 * Finely-run restore / AU prep. The agent never processes disputes themselves.
 */
export default function RealEstateCareersPage() {
  const navigate = useNavigate();
  const onboardingSteps = REAL_ESTATE_ONBOARDING_STEPS;
  const toolkit = useMemo(() => listRealEstatePublicToolkitLevers(), []);
  const workSplit = ROLE_WORK_SPLIT[ROLE];
  usePublicSeoMeta({
    title: 'Real estate partners — refer buyers, Finely runs the credit work',
    description:
      'Finely Cred real estate affiliation: you refer buyers and sellers, Finely specialists run the restore, dispute, and AU prep work. Results vary · not legal advice · underwriting subject to approval.',
    path: '/careers/real-estate',
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [licenseOrBrokerage, setLicenseOrBrokerage] = useState('');
  const [regionsServed, setRegionsServed] = useState('');
  const [monthlyClosings, setMonthlyClosings] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [cardEligibility, setCardEligibility] = useState(() => getDigitalInviteCardEligibilityForRole('re'));

  useEffect(() => {
    captureDigitalInviteCardFromUrl(window.location.search, window.location.pathname);
    setCardEligibility(getDigitalInviteCardEligibilityForRole('re'));
  }, []);

  const cardBonus = getDigitalInviteCardDef('re')?.bonus;

  const canSubmit = fullName.trim().length > 1 && email.trim().includes('@') && status !== 'sending';

  const goSignup = () => {
    navigate(signupUrlForRole('affiliate', { interest: 'real_estate', promoType: 'real_estate_affiliate' }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('sending');
    setStatusMsg(null);
    try {
      const app = createProgramApplication({
        kind: 'real_estate',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        companyName: companyName.trim() || undefined,
        roleTitle: 'Real estate affiliate',
        niche: 'real_estate',
        regionsServed: regionsServed.trim() || undefined,
        monthlyLeadsEstimate: monthlyClosings.trim() ? Number(monthlyClosings) : undefined,
        referralCode: cardEligibility ? `digital-card-${cardEligibility.role}` : undefined,
        notes: [
          licenseOrBrokerage.trim() && `License / brokerage: ${licenseOrBrokerage.trim()}`,
          notes.trim(),
          cardEligibility ? `PRIORITY (digital invite bonus): ${cardBonus?.label ?? 'Priority onboarding call'}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      });
      window.dispatchEvent(new Event('finely:store'));

      const lead = await submitLeadCapture({
        source: 'affiliate',
        offer: 'real_estate_affiliate',
        interest: 'real_estate_affiliation',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
        funnelPath: '/careers/real-estate',
        funnelId: 'real_estate_affiliate',
        goal: 'credit',
        promoterRole: 'real_estate',
        ...(cardEligibility ? digitalInviteCardLeadAttributionFields(cardEligibility) : {}),
        giveawayStack: cardEligibility && cardBonus ? [cardBonus.label] : undefined,
      });
      addLeadNote(
        lead.lead.id,
        `Real estate affiliate application: ${app.id}\nBrokerage: ${companyName || '—'}\nLicense: ${licenseOrBrokerage || '—'}\nRegions: ${regionsServed || '—'}`,
      );
      if (cardEligibility) {
        addLeadTags(lead.lead.id, ['priority-review', ...digitalInviteCardLeadTags(cardEligibility)]);
        addLeadNote(lead.lead.id, formatDigitalInviteCardNote(cardEligibility));
        markDigitalInviteCardRedeemed(lead.lead.id);
      }

      setStatus('sent');
      setStatusMsg(
        cardEligibility
          ? `Application received — priority review is on. ${cardBonus?.description ?? ''}`
          : 'Application received. Continue signup to open your affiliate lane, or wait for our team.',
      );
      setNotes('');
    } catch (err: unknown) {
      setStatus('error');
      setStatusMsg((err as Error)?.message || 'Could not submit. Try again.');
    }
  };

  return (
    <PageShell
      badge="Public"
      title="Real estate partners"
      subtitle="You refer the buyer or seller. Finely specialists run the credit work."
      hideHero
    >
      <div className={`${FINELY_OS_PAGE} max-w-6xl mx-auto space-y-0`}>
        <div className="px-0 py-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a href="/" className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Home
            </a>
            <CareerOtherTracksLink currentId="real_estate" />
          </div>
          {cardEligibility && cardBonus ? (
            <FinelyOsAlertBanner tone="success" message={cardBonus.description} />
          ) : null}
        </div>

        {/* Hero — asymmetric split: left ledger copy, right shareboard mock */}
        <section
          className={`relative overflow-hidden rounded-3xl border border-white/10 px-5 sm:px-8 py-10 sm:py-14 ${finelyOsLandingContrastSection('fc-band-dark')}`}
          data-fc-contrast-band="1"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 70% 55% at 10% 15%, rgba(212,175,55,0.2), transparent 55%), radial-gradient(ellipse 50% 40% at 92% 85%, rgba(148,163,184,0.12), transparent 50%)',
            }}
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 text-amber-300">
                <Building2 size={18} />
                <p className="text-[11px] font-black uppercase tracking-[0.28em]">Real estate affiliation</p>
              </div>
              <LandingTypewriterTitle
                as="h1"
                text="You refer. We run the credit work."
                className={`${FINELY_OS_LANDING_PLATINUM_TITLE} font-light !text-4xl sm:!text-5xl`}
                highlight="We run the credit work."
                highlightClassName="text-amber-400 font-semibold"
                speedMs={36}
              />
              <p className="fc-light-contrast-body text-base sm:text-lg leading-relaxed max-w-xl">
                Agents and brokers hand us the buyer or seller whose credit is blocking the contract. Finely specialists
                pull reports, send findings-based dispute letters, prep AU optics, and package paydown proof for the loan
                officer. You keep the relationship and the closing.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button type="button" className={roleJoinBtn(ROLE)} onClick={goSignup}>
                  Join real estate path <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className={roleSecondaryBtn(ROLE)}
                  onClick={() => document.getElementById('re-apply')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Apply on this page
                </button>
                <button
                  type="button"
                  className={roleSecondaryBtn(ROLE)}
                  onClick={() => openPublicChat({ goal: 'business', personaId: 'lead_converter' })}
                >
                  <Sparkles size={14} /> Ask Finely
                </button>
              </div>

              <div className={`${LEDGER_RULE} mt-6`}>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Read first — free</p>
                <RoleGuideCta role={ROLE} className="mt-3" />
                <p className="mt-3 text-[11px] leading-relaxed text-white/35">{ROLE_ACTION_LEGEND[ROLE]}</p>
              </div>
            </div>

            <div className="lg:pl-2">
              <RealEstateReferralBoardMock />
            </div>
          </div>

          <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} relative mt-8 !text-white/45 !mx-0 !text-left`}>
            {ROLE_COMPLIANCE_FOOTNOTES[ROLE]}
          </p>
        </section>

        {/* Who does the work — three-column ledger split */}
        <section className={`mt-6 rounded-3xl px-5 sm:px-8 py-12 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="max-w-2xl space-y-3">
              <p className={FINELY_OS_LANDING_IVORY_KICKER}>Who does the work</p>
              <LandingTypewriterTitle
                as="h2"
                text={workSplit.headline}
                className={`${FINELY_OS_LANDING_IVORY_TITLE} !text-3xl sm:!text-4xl`}
                highlight="Finely processes the file."
                highlightClassName="fc-landing-ivory-accent"
                delayMs={200}
                speedMs={34}
              />
              <p className={FINELY_OS_LANDING_IVORY_BODY}>
                No ambiguity: you are a referring partner and a coach on timing. You are not a credit repair operator.
              </p>
            </div>

            <div className="grid gap-0 md:grid-cols-3 md:divide-x md:divide-amber-900/15">
              <div className="space-y-3 pb-6 md:pb-0 md:pr-6">
                <div className="flex items-center gap-2 text-[#0a1628]">
                  <Handshake size={16} />
                  <p className="text-[11px] font-black uppercase tracking-[0.22em]">You do</p>
                </div>
                <ul className="space-y-2.5">
                  {workSplit.youDo.map((line) => (
                    <li key={line} className="text-sm leading-relaxed text-[#0a1628]/72">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3 border-t border-amber-900/15 py-6 md:border-t-0 md:px-6 md:py-0">
                <div className="flex items-center gap-2 text-[#0a1628]">
                  <UserCheck size={16} />
                  <p className="text-[11px] font-black uppercase tracking-[0.22em]">Finely runs</p>
                </div>
                <ul className="space-y-2.5">
                  {workSplit.finelyRuns.map((line) => (
                    <li key={line} className="text-sm leading-relaxed text-[#0a1628]/72">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3 border-t border-amber-900/15 pt-6 md:border-t-0 md:pl-6 md:pt-0">
                <div className="flex items-center gap-2 text-rose-900/80">
                  <XCircle size={16} />
                  <p className="text-[11px] font-black uppercase tracking-[0.22em]">Not your job</p>
                </div>
                <ul className="space-y-2.5">
                  {workSplit.notYourJob.map((line) => (
                    <li key={line} className="text-sm leading-relaxed text-rose-950/65">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits · inside access · capabilities — hairline index on dark */}
        <section
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-8 py-12 ${finelyOsLandingContrastSection('fc-band-ember')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-5xl mx-auto space-y-9">
            <div className="max-w-2xl space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">What you get</p>
              <h2 className={`${FINELY_OS_LANDING_PLATINUM_TITLE} !text-3xl sm:!text-4xl`}>
                Benefits, inside access, and what only you can do.
              </h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {[
                { title: 'Benefits', rows: ROLE_BENEFITS[ROLE] },
                { title: 'Inside access', rows: ROLE_INSIDE_ACCESS[ROLE] },
                { title: 'Only the agent can', rows: ROLE_UNIQUE_CAPABILITIES[ROLE] },
              ].map((col) => (
                <div key={col.title} className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{col.title}</p>
                  <dl className="space-y-4">
                    {col.rows.map((r) => (
                      <div key={r.label} className="border-t border-white/10 pt-3">
                        <dt className="text-sm font-semibold text-white/90">{r.label}</dt>
                        <dd className="mt-1 text-[13px] leading-relaxed text-white/55">{r.detail}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-amber-300/25 bg-black/25 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-200/80">
                Your shareboard profile
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                {ROLE_PROFILE_FEATURES[ROLE].map((f) => (
                  <div key={f.label}>
                    <p className="text-sm font-semibold text-white/85">{f.label}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/55">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Numbered onboarding rail */}
        <section className={`mt-6 rounded-3xl px-5 sm:px-8 py-12 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="max-w-2xl space-y-3">
              <p className={FINELY_OS_LANDING_IVORY_KICKER}>How it works</p>
              <h2 className={`${FINELY_OS_LANDING_IVORY_TITLE} !text-3xl sm:!text-4xl`}>
                Five steps from handshake to lender-ready.
              </h2>
              <p className={FINELY_OS_LANDING_IVORY_BODY}>
                Each step is a real Finely route — not a brochure. Steps 2–5 are run by our specialists once you make the
                handoff.
              </p>
            </div>
            <ol className="space-y-3">
              {onboardingSteps.map((s) => (
                <li
                  key={s.id}
                  className={`${finelyOsLandingIvoryCard()} flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5`}
                >
                  <span className="text-3xl font-black tabular-nums text-amber-800/40 sm:w-14 sm:shrink-0">
                    {String(s.order).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[#0a1628]">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#0a1628]/68">{s.body}</p>
                  </div>
                  <button
                    type="button"
                    className={`${FINELY_OS_SUCCESS_BTN} sm:shrink-0`}
                    onClick={() => navigate(s.path)}
                  >
                    {s.cta} <ArrowRight size={14} />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Command toolkit — what you coach, where Finely runs it */}
        <section
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-8 py-12 ${finelyOsLandingContrastSection('fc-band-emerald')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="max-w-2xl space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">Command toolkit</p>
              <h2 className={`${FINELY_OS_LANDING_PLATINUM_TITLE} !text-3xl sm:!text-4xl`}>
                What you explain. Where Finely runs it.
              </h2>
              <p className="fc-light-contrast-body text-sm sm:text-base">
                You do not have to be the technician. Each tile opens the workflow our specialists already operate.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {toolkit.map((t) => {
                const Icon = LEVER_ICONS[t.id] ?? Gauge;
                return (
                  <div
                    key={t.id}
                    className={`${finelyOsCatalogCard(t.accent)} !p-5 space-y-3`}
                    data-fc-accent={t.accent}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl border border-white/15 bg-black/25 p-2 text-amber-300">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-lg font-semibold text-white leading-snug">{t.title}</h3>
                        <p className="text-sm text-white/65 leading-relaxed">{t.howItHelps}</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5 pl-1">
                      {t.bullets.map((b) => (
                        <li key={b} className="flex gap-2 text-xs sm:text-sm text-white/55 leading-relaxed">
                          <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-amber-300/80" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-amber-200/70 leading-relaxed">{t.underwriterCaveat}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(t.finelyCtaPath)}>
                        {t.finelyCtaLabel} <ArrowRight size={14} />
                      </button>
                      {t.secondaryCtaPath && t.secondaryCtaLabel ? (
                        <button
                          type="button"
                          className={FINELY_OS_SECONDARY_BTN}
                          onClick={() => navigate(t.secondaryCtaPath!)}
                        >
                          {t.secondaryCtaLabel}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Free kits the agent can hand a blocked buyer or seller */}
        <section className="mt-6">
          <DedicatedSheetLinkStrip
            only={['restore', 'build']}
            heading="Hand these to a buyer before the lender pulls credit"
            subline="Free · honest page counts · your referral link stays attached"
          />
        </section>

        {/* Research caveats */}
        <section className={`mt-6 rounded-3xl px-5 sm:px-8 py-10 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center gap-2 text-amber-900/80">
              <ShieldAlert size={18} />
              <p className={FINELY_OS_LANDING_IVORY_KICKER}>Compliance · research caveats</p>
            </div>
            <h2 className={`${FINELY_OS_LANDING_IVORY_TITLE} !text-3xl`}>Say this accurately. Never overpromise.</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <div className={`${finelyOsLandingIvoryCard()} space-y-2`}>
                <div className="flex items-center gap-2 font-bold text-[#0a1628]">
                  <Target size={16} /> AU &amp; underwriting
                </div>
                <p className="text-sm text-[#0a1628]/70 leading-relaxed">
                  DU Approve/Eligible may consider AU in risk assessment; no extra lender investigation unless DU says so
                  (SEL-2026-06, B3-5.3-09). Manual UW usually excludes AU except spouse owner / co-borrower owner / 12mo
                  sole-payer docs (B3-5.3-06). AU is not auto in DTI. Overlays vary. No approval guarantees.
                </p>
              </div>
              <div className={`${finelyOsLandingIvoryCard()} space-y-2`}>
                <div className="flex items-center gap-2 font-bold text-[#0a1628]">
                  <Upload size={16} /> Rapid update vs report refresh
                </div>
                <p className="text-sm text-[#0a1628]/70 leading-relaxed">
                  Rapid rescore is lender-initiated with proof; typically 2–5 business days — not a consumer DIY 24-hour
                  product. Finely helps prep paydown proof and dispute findings. An internal report refresh or soft-pull
                  monitoring update is not the same as lender rapid rescore.
                </p>
              </div>
            </div>
            <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} !text-[#0a1628]/55 !mx-0 !text-left`}>
              {REAL_ESTATE_COMPLIANCE_FOOTNOTES.slice(0, 3).join(' · ')}
            </p>
          </div>
        </section>

        {/* Payout framing */}
        <section
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-8 py-10 ${finelyOsLandingContrastSection('fc-band-dark')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">Payout framing</p>
              <h2 className={`${FINELY_OS_LANDING_PLATINUM_TITLE} !text-3xl`}>Refer partners. Earn when they engage.</h2>
              <p className="fc-light-contrast-body text-sm sm:text-base leading-relaxed">
                Real estate affiliates share tracked links into restore, AU education, and specialist programs. Payout
                terms are provided when you join — we do not guarantee income, closings, or loan approvals.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <button type="button" className={roleJoinBtn(ROLE)} onClick={() => navigate('/affiliate')}>
                See payout program <ArrowRight size={14} />
              </button>
              <button type="button" className={roleSecondaryBtn(ROLE)} onClick={goSignup}>
                Open affiliate signup
              </button>
            </div>
          </div>
        </section>

        {/* Apply — choice-first: quick fields up front, brokerage details optional */}
        <section id="re-apply" className={`mt-6 rounded-3xl px-5 sm:px-8 py-12 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-xl mx-auto space-y-4">
            <CareerChoiceApply
              kicker="Apply"
              title="Real estate affiliation"
              selectedLabel="Referral path — you refer, Finely runs the credit work"
              description="Tell us about your brokerage. We review applications and open affiliate access when approved."
              ctaLabel={status === 'sending' ? 'Submitting…' : 'Submit application'}
              onSubmit={submit}
              submitDisabled={!canSubmit}
              secondaryLabel="Skip to signup"
              onSecondaryClick={goSignup}
              accent="gold"
            >
              {statusMsg ? (
                <div className={status === 'sent' ? FINELY_OS_NOTICE_SUCCESS : status === 'error' ? FINELY_OS_NOTICE_ERROR : ''}>
                  {statusMsg}
                  {status === 'sent' ? (
                    <button type="button" className={`${FINELY_OS_SUCCESS_BTN} mt-2`} onClick={goSignup}>
                      Continue affiliate onboarding <ArrowRight size={14} />
                    </button>
                  ) : null}
                </div>
              ) : null}
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={APPLY_FORM_LABEL}>Full name</span>
                  <input
                    className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className={APPLY_FORM_LABEL}>Email</span>
                  <input
                    type="email"
                    className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
              </div>
              <label className="block">
                <span className={APPLY_FORM_LABEL}>Phone (optional)</span>
                <input className={`${FINELY_OS_ENTITY_INPUT} mt-1 sm:max-w-xs`} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>

              <button
                type="button"
                onClick={() => setShowOptionalDetails((v) => !v)}
                className="text-xs font-bold text-slate-500 underline underline-offset-2 hover:text-slate-800"
              >
                {showOptionalDetails ? 'Hide optional details' : 'Add brokerage details (company, license, markets, closings)'}
              </button>

              {showOptionalDetails ? (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className={APPLY_FORM_LABEL}>Brokerage / company</span>
                      <input
                        className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className={APPLY_FORM_LABEL}>License # / brokerage details</span>
                      <input
                        className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                        value={licenseOrBrokerage}
                        onChange={(e) => setLicenseOrBrokerage(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className={APPLY_FORM_LABEL}>Markets served</span>
                      <input
                        className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                        value={regionsServed}
                        onChange={(e) => setRegionsServed(e.target.value)}
                        placeholder="e.g. Metro Atlanta"
                      />
                    </label>
                    <label className="block">
                      <span className={APPLY_FORM_LABEL}>Est. monthly closings</span>
                      <input
                        className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                        value={monthlyClosings}
                        onChange={(e) => setMonthlyClosings(e.target.value)}
                        inputMode="numeric"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className={APPLY_FORM_LABEL}>How you help buyers &amp; sellers</span>
                    <textarea
                      rows={2}
                      className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </label>
                </div>
              ) : null}
            </CareerChoiceApply>

            <div className="border-t border-amber-900/15 pt-3">
              <RoleGuideCta role={ROLE} ink="dark" compact />
            </div>
            <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} !text-[#0a1628]/55 !mx-0 !text-left`}>
              Educational affiliation · not an offer of employment · {ROLE_COMPLIANCE_FOOTNOTES[ROLE]}
            </p>
          </div>
        </section>

        <section className="px-1 py-6">
          <DigitalInviteShareBand role="re" />
        </section>

        <div className="px-1 py-6">
          <FinelyOsPageFooter />
        </div>
      </div>
    </PageShell>
  );
}
