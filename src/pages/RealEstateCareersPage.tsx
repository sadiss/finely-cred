import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
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
import { CreditSpecialistGuideBookMockup } from '../components/creditSpecialist/CreditSpecialistGuideBookMockup';
import { DedicatedSheetLinkStrip } from '../components/resources/DedicatedSheetLinkStrip';
import { CreditMonitoringPartnerGrid } from '../components/resources/CreditMonitoringPartnerGrid';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { RealEstatePlaybookPanel } from '../components/realEstate/RealEstatePlaybookPanel';
import { LandingTypewriterTitle } from '../components/landing/LandingTypewriterTitle';
import {
  REAL_ESTATE_COMPLIANCE_FOOTNOTES,
  REAL_ESTATE_ONBOARDING_STEPS,
  REAL_ESTATE_QUESTION_SCRIPTS,
  REAL_ESTATE_RESEARCH_CHIPS,
  REAL_ESTATE_WIIFM,
  listRealEstatePublicToolkitLevers,
  type RealEstatePlaybookLeverId,
} from '../config/realEstatePartnerPlaybook';
import {
  ROLE_BENEFITS,
  ROLE_COMPLIANCE_FOOTNOTES,
  ROLE_GUIDE_CTAS,
  ROLE_INSIDE_ACCESS,
  ROLE_PROFILE_FEATURES,
  ROLE_UNIQUE_CAPABILITIES,
  ROLE_WORK_SPLIT,
} from '../config/rolePartnerPrograms';
import { LAW_REFERENCES, REGULATORY_PORTALS } from '../lib/legalResources';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote, addLeadTags } from '../data/leadOpsRepo';
import { FinelyOsAlertBanner } from '../features/os/FinelyOsAlertBanner';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { openPublicChat } from '../lib/publicChatEvents';
import { RE } from '../config/realEstateProgram';
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
import { RE_GUIDE_META, RE_GUIDE_PATH, RE_GUIDE_READ_PATH } from './leadmagnet/realEstateGuideContent';
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
const LEDGER_RULE = 'border-t border-white/10 pt-5';
const APPLY_FORM_LABEL = `${FINELY_OS_ENTITY_LABEL} !text-[#0a1628]/65`;

const LAW_CHIPS = [
  ...LAW_REFERENCES.filter((l) => l.id.startsWith('fcra') || l.id.startsWith('fdcpa')),
  ...REGULATORY_PORTALS.filter((l) => l.id === 'naag' || l.id === 'cfpb'),
];

const MOTION_FADE =
  'motion-safe:animate-[reCareersFade_0.7s_ease_both] [@keyframes_reCareersFade]{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}';

/**
 * Real estate affiliation career path — agents/brokers refer buyers & sellers into
 * Finely-run restore / AU prep. The agent never processes disputes themselves.
 */
export default function RealEstateCareersPage() {
  const navigate = useNavigate();
  const onboardingSteps = REAL_ESTATE_ONBOARDING_STEPS;
  const toolkit = useMemo(() => listRealEstatePublicToolkitLevers(), []);
  const workSplit = ROLE_WORK_SPLIT[ROLE];
  const guideCta = ROLE_GUIDE_CTAS[ROLE];
  usePublicSeoMeta({
    title: 'Real estate partners — refer buyers, Finely runs the credit work',
    description:
      'Finely Cred real estate affiliation: you refer buyers and sellers, Finely specialists run the restore, dispute, and AU prep work. Open the Real Estate Operator Guide free. Results vary · not legal advice · underwriting subject to approval.',
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
  const [activeScript, setActiveScript] = useState(REAL_ESTATE_QUESTION_SCRIPTS[0]?.id ?? '');
  const [cardEligibility, setCardEligibility] = useState(() => getDigitalInviteCardEligibilityForRole('re'));

  useEffect(() => {
    captureDigitalInviteCardFromUrl(window.location.search, window.location.pathname);
    setCardEligibility(getDigitalInviteCardEligibilityForRole('re'));
  }, []);

  const cardBonus = getDigitalInviteCardDef('re')?.bonus;
  const activeScriptRow = REAL_ESTATE_QUESTION_SCRIPTS.find((s) => s.id === activeScript) ?? REAL_ESTATE_QUESTION_SCRIPTS[0];

  const canSubmit = fullName.trim().length > 1 && email.trim().includes('@') && status !== 'sending';

  const goSignup = () => {
    navigate(RE.signupPath);
  };

  const askFinelyCreditFunding = () => {
    openPublicChat({ goal: 'personal', personaId: 'funding_strategist' });
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
      <style>{`
        @keyframes reCareersFade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes reCareersRail { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) {
          .re-motion-fade, .re-motion-rail { animation: none !important; }
        }
        .re-motion-fade { animation: reCareersFade 0.75s ease both; }
        .re-motion-rail { animation: reCareersRail 0.55s ease both; }
      `}</style>

      <div className={`${FINELY_OS_PAGE} max-w-7xl mx-auto space-y-0`}>
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

        {/* Hero — asymmetric split: ledger copy + wider shareboard */}
        <section
          className={`relative overflow-hidden rounded-3xl border border-white/10 px-5 sm:px-10 py-10 sm:py-14 ${finelyOsLandingContrastSection('fc-band-dark')}`}
          data-fc-contrast-band="1"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 70% 55% at 10% 15%, rgba(212,175,55,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 92% 85%, rgba(148,163,184,0.12), transparent 50%)',
            }}
          />
          <div className="relative grid gap-10 xl:grid-cols-[1fr_1.15fr] xl:items-center">
            <div className="space-y-5 re-motion-fade">
              <div className="inline-flex items-center gap-2 text-amber-300">
                <Building2 size={18} />
                <p className="text-[11px] font-black uppercase tracking-[0.28em]">Real estate affiliation</p>
              </div>
              <LandingTypewriterTitle
                as="h1"
                text="You refer. We run the credit work."
                className={`${FINELY_OS_LANDING_PLATINUM_TITLE} font-light !text-4xl sm:!text-5xl lg:!text-[3.35rem]`}
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
                <button type="button" className={roleSecondaryBtn(ROLE)} onClick={askFinelyCreditFunding}>
                  <Sparkles size={14} /> Ask Finely — credit &amp; funding
                </button>
              </div>

              <div className={`${LEDGER_RULE} mt-6`}>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Read first — free Operator Guide</p>
                <RoleGuideCta role={ROLE} className="mt-3" />
                <p className="mt-3 text-[11px] leading-relaxed text-white/35">{ROLE_ACTION_LEGEND[ROLE]}</p>
              </div>
            </div>

            <div className="xl:pl-2 re-motion-fade" style={{ animationDelay: '0.12s' }}>
              <RealEstateReferralBoardMock />
            </div>
          </div>

          <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} relative mt-8 !text-white/45 !mx-0 !text-left`}>
            {ROLE_COMPLIANCE_FOOTNOTES[ROLE]}
          </p>
        </section>

        {/* Book-first Operator Guide media */}
        <section
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-10 py-12 ${finelyOsLandingContrastSection('fc-band-ember')}`}
          data-fc-contrast-band="1"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="re-motion-fade flex justify-center">
              <CreditSpecialistGuideBookMockup
                title={RE_GUIDE_META.title}
                edition={RE_GUIDE_META.edition}
                tagline={RE_GUIDE_META.tagline}
                valueLabel={RE_GUIDE_META.valueLabel}
                onOpen={() => navigate(RE_GUIDE_READ_PATH)}
                tall
                ariaLabel="Open Real Estate Operator Guide"
              />
            </div>
            <div className="space-y-4 re-motion-fade" style={{ animationDelay: '0.1s' }}>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">Book-first · free to read</p>
              <LandingTypewriterTitle
                as="h2"
                text="Real Estate Operator Guide"
                className={`${FINELY_OS_LANDING_PLATINUM_TITLE} !text-3xl sm:!text-4xl`}
                speedMs={32}
                delayMs={120}
              />
              <p className="fc-light-contrast-body text-base leading-relaxed">
                {guideCta.blurb} Score Roadmap stays available as a secondary buyer checklist — not the primary guide for
                this path.
              </p>
              <ul className="space-y-2.5">
                {guideCta.inside.map((line) => (
                  <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-white/75">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-amber-300" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3 pt-2">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(RE_GUIDE_PATH)}>
                  <BookOpen size={14} /> {guideCta.label} <ArrowRight size={14} />
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(RE_GUIDE_READ_PATH)}>
                  {guideCta.readLabel}
                </button>
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => navigate('/free-score-roadmap')}
                >
                  Score roadmap (secondary)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Clear WIIFM */}
        <section className={`mt-6 rounded-3xl px-5 sm:px-10 py-12 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="max-w-2xl space-y-3">
              <p className={FINELY_OS_LANDING_IVORY_KICKER}>What’s in it for you</p>
              <LandingTypewriterTitle
                as="h2"
                text="You refer. Finely runs credit. You win the closing."
                className={`${FINELY_OS_LANDING_IVORY_TITLE} !text-3xl sm:!text-4xl`}
                highlight="You win the closing."
                highlightClassName="fc-landing-ivory-accent"
                delayMs={160}
                speedMs={34}
              />
              <p className={FINELY_OS_LANDING_IVORY_BODY}>
                No ambiguity: you are a referring partner and a coach on timing — not a credit repair operator.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {[
                { title: 'You refer', icon: Handshake, rows: REAL_ESTATE_WIIFM.youRefer, tone: 'default' as const },
                { title: 'Finely runs credit', icon: UserCheck, rows: REAL_ESTATE_WIIFM.finelyRuns, tone: 'default' as const },
                { title: 'What’s in it for the agent', icon: Target, rows: REAL_ESTATE_WIIFM.agentWins, tone: 'gold' as const },
              ].map((col) => {
                const Icon = col.icon;
                return (
                  <div
                    key={col.title}
                    className={`${finelyOsLandingIvoryCard()} !p-6 space-y-4 ${col.tone === 'gold' ? 'ring-1 ring-amber-700/25' : ''}`}
                  >
                    <div className="flex items-center gap-2 text-[#0a1628]">
                      <Icon size={18} className="text-amber-800/80" />
                      <p className="text-[12px] font-black uppercase tracking-[0.22em]">{col.title}</p>
                    </div>
                    <ul className="space-y-3">
                      {col.rows.map((line) => (
                        <li key={line} className="flex gap-3 text-[15px] sm:text-base leading-relaxed text-[#0a1628]/78">
                          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Question script chips */}
            <div className={`${finelyOsLandingIvoryCard()} !p-6 space-y-4`}>
              <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#0a1628]/55">Question script chips</p>
              <div className="flex flex-wrap gap-2">
                {REAL_ESTATE_QUESTION_SCRIPTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveScript(s.id)}
                    className={`rounded-full border px-3.5 py-2 text-[12px] font-bold transition ${
                      activeScript === s.id
                        ? 'border-amber-800/40 bg-amber-900/10 text-[#0a1628]'
                        : 'border-amber-900/15 bg-white/40 text-[#0a1628]/65 hover:border-amber-800/30'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {activeScriptRow ? (
                <p className="text-base sm:text-lg leading-relaxed text-[#0a1628]/85 italic">{activeScriptRow.script}</p>
              ) : null}
            </div>

            {/* Legacy work-split “not your job” kept for clarity */}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0a1628]/45">Also — you do</p>
                <ul className="space-y-1.5">
                  {workSplit.youDo.map((line) => (
                    <li key={line} className="text-sm text-[#0a1628]/65">{line}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0a1628]/45">Finely also runs</p>
                <ul className="space-y-1.5">
                  {workSplit.finelyRuns.map((line) => (
                    <li key={line} className="text-sm text-[#0a1628]/65">{line}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-rose-900/80">
                  <XCircle size={14} />
                  <p className="text-[11px] font-black uppercase tracking-[0.2em]">Not your job</p>
                </div>
                <ul className="space-y-1.5">
                  {workSplit.notYourJob.map((line) => (
                    <li key={line} className="text-sm text-rose-950/65">{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits with checkmarks — standout */}
        <section
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-10 py-12 ${finelyOsLandingContrastSection('fc-band-dark')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-6xl mx-auto space-y-9">
            <div className="max-w-2xl space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">What you get</p>
              <LandingTypewriterTitle
                as="h2"
                text="Benefits, inside access, and what only you can do."
                className={`${FINELY_OS_LANDING_PLATINUM_TITLE} !text-3xl sm:!text-4xl`}
                highlight="only you can do."
                highlightClassName="text-amber-300"
                delayMs={100}
                speedMs={32}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {[
                { title: 'Benefits', rows: ROLE_BENEFITS[ROLE] },
                { title: 'Inside access', rows: ROLE_INSIDE_ACCESS[ROLE] },
                { title: 'Only the agent can', rows: ROLE_UNIQUE_CAPABILITIES[ROLE] },
              ].map((col, colIdx) => (
                <div
                  key={col.title}
                  className="re-motion-fade rounded-2xl border border-white/12 bg-black/30 p-6 space-y-5"
                  style={{ animationDelay: `${0.08 * colIdx}s` }}
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-200/80">{col.title}</p>
                  <ul className="space-y-5">
                    {col.rows.map((r) => (
                      <li key={r.label} className="flex gap-3">
                        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-400" />
                        <div>
                          <p className="text-base sm:text-lg font-semibold text-white/95 leading-snug">{r.label}</p>
                          <p className="mt-1.5 text-[15px] leading-relaxed text-white/60">{r.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-amber-300/25 bg-black/25 p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-200/80">Your shareboard profile</p>
              <div className="mt-4 grid gap-5 sm:grid-cols-3">
                {ROLE_PROFILE_FEATURES[ROLE].map((f) => (
                  <div key={f.label} className="flex gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-amber-300/90" />
                    <div>
                      <p className="text-base font-semibold text-white/90">{f.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/55">{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Cinematic 5-step rail */}
        <section className={`mt-6 rounded-3xl px-5 sm:px-10 py-12 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="max-w-2xl space-y-3">
              <p className={FINELY_OS_LANDING_IVORY_KICKER}>How it works</p>
              <LandingTypewriterTitle
                as="h2"
                text="Five steps from handshake to lender-ready."
                className={`${FINELY_OS_LANDING_IVORY_TITLE} !text-3xl sm:!text-4xl`}
                highlight="lender-ready."
                highlightClassName="fc-landing-ivory-accent"
                delayMs={80}
                speedMs={34}
              />
              <p className={FINELY_OS_LANDING_IVORY_BODY}>
                Each step is a real Finely route — not a brochure. Steps 2–5 are run by our specialists once you make the
                handoff.
              </p>
            </div>

            <ol className="relative space-y-0">
              <div
                className="pointer-events-none absolute left-[1.65rem] top-4 bottom-4 w-px bg-gradient-to-b from-amber-700/40 via-amber-800/20 to-transparent hidden sm:block"
                aria-hidden
              />
              {onboardingSteps.map((s, i) => (
                <li
                  key={s.id}
                  className={`re-motion-rail relative flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6 py-3`}
                  style={{ animationDelay: `${0.07 * i}s` }}
                >
                  <div className="relative z-[1] flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-800/25 bg-[#0a1628] text-amber-100 shadow-[0_12px_28px_-18px_rgba(10,22,40,0.55)]">
                    <span className="text-lg font-black tabular-nums">{String(s.order).padStart(2, '0')}</span>
                  </div>
                  <div className={`${finelyOsLandingIvoryCard()} flex-1 !p-5 sm:!p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5`}>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-[#0a1628]">{s.title}</h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-[#0a1628]/68">{s.body}</p>
                    </div>
                    <button
                      type="button"
                      className={`${FINELY_OS_SUCCESS_BTN} sm:shrink-0`}
                      onClick={() => navigate(s.path)}
                    >
                      {s.cta} <ArrowRight size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Full toolkit — all 7 levers */}
        <section
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-10 py-12 ${finelyOsLandingContrastSection('fc-band-emerald')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="max-w-2xl space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">Command toolkit · 7 levers</p>
              <h2 className={`${FINELY_OS_LANDING_PLATINUM_TITLE} !text-3xl sm:!text-4xl`}>
                What you explain. Where Finely runs it.
              </h2>
              <p className="fc-light-contrast-body text-sm sm:text-base">
                Full readiness stack — coach the concept, open the Finely route. Prefer may / often / lender-dependent
                language with buyers and loan officers.
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

            <RealEstatePlaybookPanel mode="full" defaultOpen title="Expandable playbook · Fannie rules + onboarding" />
          </div>
        </section>

        {/* Monitoring + law / research chips */}
        <section
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-10 py-12 ${finelyOsLandingContrastSection('fc-band-dark')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="max-w-2xl space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">Resource rail</p>
              <h2 className={`${FINELY_OS_LANDING_PLATINUM_TITLE} !text-3xl`}>Monitoring partners · law links · research chips</h2>
              <p className="fc-light-contrast-body text-sm sm:text-base">
                Hand buyers real monitoring options. Cite FCRA/FDCPA when education comes up. Keep Fannie and AG links
                one click away.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[...REAL_ESTATE_RESEARCH_CHIPS, ...LAW_CHIPS].map((chip) => (
                <a
                  key={chip.id}
                  href={chip.href}
                  target={chip.external !== false && chip.href.startsWith('http') ? '_blank' : undefined}
                  rel={chip.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-100 hover:bg-amber-400/18"
                >
                  {chip.label}
                  {chip.href.startsWith('http') ? <ExternalLink size={12} /> : null}
                </a>
              ))}
            </div>

            <CreditMonitoringPartnerGrid variant="resources" />
          </div>
        </section>

        {/* Expanded dedicated sheets */}
        <section className="mt-6">
          <DedicatedSheetLinkStrip
            heading="Hand these kits to a blocked buyer or seller"
            subline="Restore · build · AU teen — free · honest page counts · your referral link stays attached"
          />
        </section>

        {/* Research caveats */}
        <section className={`mt-6 rounded-3xl px-5 sm:px-10 py-10 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center gap-2 text-amber-900/80">
              <ShieldAlert size={18} />
              <p className={FINELY_OS_LANDING_IVORY_KICKER}>Compliance · research caveats</p>
            </div>
            <h2 className={`${FINELY_OS_LANDING_IVORY_TITLE} !text-3xl`}>Say this accurately. Deliver a real next step.</h2>
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
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-10 py-10 ${finelyOsLandingContrastSection('fc-band-dark')}`}
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

        {/* Staff chat + Ask Finely */}
        <section className="mt-6 space-y-4">
          <MarketingStaffChatStrip
            roleId="finely_advisor"
            goal="personal"
            roleLabel="credit & funding"
            subline="Ask about restore lanes, AU optics, or funding readiness before you refer a buyer."
          />
          <div className="flex flex-wrap gap-3">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={askFinelyCreditFunding}>
              <Sparkles size={14} /> Ask Finely — credit &amp; funding <ArrowRight size={14} />
            </button>
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => openPublicChat({ goal: 'personal', personaId: 'finely_advisor' })}
            >
              Credit advisor chat
            </button>
          </div>
        </section>

        {/* Apply */}
        <section id="re-apply" className={`mt-6 rounded-3xl px-5 sm:px-10 py-12 ${finelyOsLandingWealthyIvorySection()}`}>
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

            <div className="border-t border-amber-900/15 pt-3 space-y-2">
              <RoleGuideCta role={ROLE} ink="dark" compact />
              <button
                type="button"
                className="text-xs font-bold text-slate-500 underline underline-offset-2 hover:text-slate-800"
                onClick={() => navigate('/free-score-roadmap')}
              >
                Secondary: Score roadmap buyer checklist
              </button>
            </div>
            <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} !text-[#0a1628]/55 !mx-0 !text-left`}>
              Educational affiliation · not an offer of employment · {ROLE_COMPLIANCE_FOOTNOTES[ROLE]}
            </p>
          </div>
        </section>

        <section className="px-1 py-6">
          <DigitalInviteShareBand role="re" />
        </section>

        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} px-1 !mx-0 !text-left !text-white/40`}>
          Soft compliance: {ROLE_COMPLIANCE_FOOTNOTES[ROLE]} · Fannie citations are educational — verify the current
          Selling Guide and lender overlays before advising a live file.
        </p>

        <div className="px-1 py-6">
          <FinelyOsPageFooter />
        </div>
      </div>
    </PageShell>
  );
}
