import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Gauge,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareersQuickNav } from '../components/careers/CareersQuickNav';
import { LandingTypewriterTitle } from '../components/landing/LandingTypewriterTitle';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { RealEstatePlaybookPanel } from '../components/realEstate/RealEstatePlaybookPanel';
import {
  REAL_ESTATE_COMPLIANCE_FOOTNOTES,
  REAL_ESTATE_ONBOARDING_STEPS,
  REAL_ESTATE_PLAYBOOK_META,
  listRealEstatePublicToolkitLevers,
  type RealEstatePlaybookLeverId,
} from '../config/realEstatePartnerPlaybook';
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

/**
 * Real estate affiliation career path — agents/brokers helping buyers & sellers
 * with underwriting readiness education (AU optics, DTI, disputes, lender rescore prep).
 */
export default function RealEstateCareersPage() {
  const navigate = useNavigate();
  const onboardingSteps = REAL_ESTATE_ONBOARDING_STEPS;
  const toolkit = useMemo(() => listRealEstatePublicToolkitLevers(), []);
  usePublicSeoMeta({
    title: 'Real estate partners — underwriting readiness affiliation',
    description:
      'Finely Cred real estate affiliation: guide partners through credit restore, AU optics education, dispute speed, and lender rapid-rescore prep. Results vary · not legal advice · underwriting subject to approval.',
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
      subtitle="Affiliation for agents & brokers — underwriting readiness education for buyers, sellers, and partners."
      hideHero
    >
      <div className={`${FINELY_OS_PAGE} max-w-6xl mx-auto space-y-0`}>
        <div className="px-0 py-2 space-y-3">
          <CareersQuickNav active="real_estate" />
          {cardEligibility && cardBonus ? (
            <FinelyOsAlertBanner tone="success" message={cardBonus.description} />
          ) : null}
        </div>

        {/* Hero */}
        <section
          className={`relative overflow-hidden rounded-3xl border border-white/10 px-5 sm:px-8 py-12 sm:py-16 ${finelyOsLandingContrastSection('fc-band-dark')}`}
          data-fc-contrast-band="1"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 70% 55% at 15% 20%, rgba(212,175,55,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(148,163,184,0.12), transparent 50%)',
            }}
          />
          <div className="relative max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center justify-center gap-2 text-amber-300">
              <Building2 size={20} />
              <p className="text-[11px] font-black uppercase tracking-[0.28em]">Real estate affiliation</p>
            </div>
            <LandingTypewriterTitle
              as="h1"
              text="Close more files. Guide underwriting readiness."
              className={`${FINELY_OS_LANDING_PLATINUM_TITLE} font-light`}
              highlight="underwriting readiness."
              highlightClassName="text-amber-400 font-semibold"
              speedMs={36}
            />
            <p className="fc-light-contrast-body text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              A command toolkit for real estate pros: credit restore, AU optics education (not DTI fiction), rapid
              dispute findings, and honest lender-rescore prep — so partners know the next step in plain English.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={goSignup}>
                Join real estate path <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() => document.getElementById('re-apply')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Apply on this page
              </button>
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() => openPublicChat({ goal: 'business', personaId: 'lead_converter' })}
              >
                <Sparkles size={14} /> Ask Finely
              </button>
            </div>
            <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} !text-white/45`}>
              Results vary · not legal advice · funding / underwriting subject to lender approval · not income guarantees
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className={`mt-6 rounded-3xl px-5 sm:px-8 py-12 sm:py-14 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <p className={FINELY_OS_LANDING_IVORY_KICKER}>How it works</p>
              <LandingTypewriterTitle
                as="h2"
                text="Four steps from handshake to portal lanes."
                className={FINELY_OS_LANDING_IVORY_TITLE}
                highlight="portal lanes."
                highlightClassName="fc-landing-ivory-accent"
                delayMs={200}
                speedMs={38}
              />
              <p className={`${FINELY_OS_LANDING_IVORY_BODY} max-w-2xl mx-auto`}>
                Smooth onboarding for partners who need help in all ways — each step is a real Finely route, not a brochure.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {onboardingSteps.map((s) => (
                <div key={s.id} className={`${finelyOsLandingIvoryCard()} space-y-3`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-800/80">
                      {String(s.order).padStart(2, '0')}
                    </span>
                    <h3 className="text-base font-bold text-[#0a1628]">{s.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[#0a1628]/68">{s.body}</p>
                  <button type="button" className={FINELY_OS_SUCCESS_BTN} onClick={() => navigate(s.path)}>
                    {s.cta} <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Command toolkit */}
        <section
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-8 py-12 sm:py-14 ${finelyOsLandingContrastSection('fc-band-violet')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">Command toolkit</p>
              <LandingTypewriterTitle
                as="h2"
                text="What you teach. Where Finely runs it."
                className={`${FINELY_OS_LANDING_PLATINUM_TITLE} !text-3xl sm:!text-4xl`}
                highlight="Finely runs it."
                highlightClassName="text-amber-400 font-semibold"
                delayMs={160}
                speedMs={36}
              />
              <p className="fc-light-contrast-body max-w-2xl mx-auto text-sm sm:text-base">
                Each tile is a usable command — open the workflow, not a wall of theory.
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

        {/* Importable playbook (compact) */}
        <section className="mt-6 px-1">
          <RealEstatePlaybookPanel mode="full" defaultOpen={false} title={REAL_ESTATE_PLAYBOOK_META.title} />
        </section>

        {/* Research caveats */}

        <section className={`mt-6 rounded-3xl px-5 sm:px-8 py-10 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center gap-2 text-amber-900/80">
              <ShieldAlert size={18} />
              <p className={FINELY_OS_LANDING_IVORY_KICKER}>Compliance · research caveats</p>
            </div>
            <h2 className={FINELY_OS_LANDING_IVORY_TITLE}>Say this accurately. Never overpromise.</h2>
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
            <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} !text-[#0a1628]/55`}>
              {REAL_ESTATE_COMPLIANCE_FOOTNOTES.slice(0, 3).join(' · ')}
            </p>
          </div>
        </section>

        {/* Earnings framing */}
        <section
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-8 py-10 ${finelyOsLandingContrastSection('fc-band-emerald')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">Earnings framing</p>
            <h2 className={`${FINELY_OS_LANDING_PLATINUM_TITLE} !text-3xl sm:!text-4xl`}>
              Refer partners. Earn when they engage.
            </h2>
            <p className="fc-light-contrast-body text-sm sm:text-base leading-relaxed">
              Real estate affiliates share tracked links into restore, AU education, and specialist programs. Commission
              details are provided when you join — we do not guarantee income, closings, or loan approvals.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/affiliate')}>
                See affiliate program <ArrowRight size={14} />
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={goSignup}>
                Open affiliate signup
              </button>
            </div>
          </div>
        </section>

        {/* Apply */}
        <section id="re-apply" className={`mt-6 rounded-3xl px-5 sm:px-8 py-12 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <p className={FINELY_OS_LANDING_IVORY_KICKER}>Apply</p>
              <h2 className={FINELY_OS_LANDING_IVORY_TITLE}>Real estate affiliation</h2>
              <p className={FINELY_OS_LANDING_IVORY_BODY}>
                Tell us about your brokerage. We review applications and open affiliate access when approved.
              </p>
            </div>
            <form onSubmit={submit} className={`${finelyOsLandingIvoryCard()} space-y-3`}>
              <label className="block">
                <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Full name</span>
                <input
                  className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Email</span>
                <input
                  type="email"
                  className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Phone</span>
                  <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label className="block">
                  <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Brokerage / company</span>
                  <input
                    className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </label>
              </div>
              <label className="block">
                <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>License # / brokerage details</span>
                <input
                  className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                  value={licenseOrBrokerage}
                  onChange={(e) => setLicenseOrBrokerage(e.target.value)}
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Markets served</span>
                  <input
                    className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                    value={regionsServed}
                    onChange={(e) => setRegionsServed(e.target.value)}
                    placeholder="e.g. Metro Atlanta"
                  />
                </label>
                <label className="block">
                  <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Est. monthly closings</span>
                  <input
                    className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                    value={monthlyClosings}
                    onChange={(e) => setMonthlyClosings(e.target.value)}
                    inputMode="numeric"
                  />
                </label>
              </div>
              <label className="block">
                <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>How you help buyers &amp; sellers</span>
                <textarea
                  rows={2}
                  className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={!canSubmit} className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}>
                  Submit application <ArrowRight size={14} />
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={goSignup}>
                  Skip to signup
                </button>
              </div>
              {status === 'sent' ? (
                <div className="space-y-2">
                  <div className={FINELY_OS_NOTICE_SUCCESS}>{statusMsg}</div>
                  <button type="button" className={FINELY_OS_SUCCESS_BTN} onClick={goSignup}>
                    Continue affiliate onboarding <ArrowRight size={14} />
                  </button>
                </div>
              ) : null}
              {status === 'error' ? <div className={FINELY_OS_NOTICE_ERROR}>{statusMsg}</div> : null}
              <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} !text-[#0a1628]/55`}>
                Educational affiliation · not an offer of employment · results vary · not legal advice · not income
                guarantees · underwriting subject to lender approval
              </p>
            </form>
          </div>
        </section>

        <div className="mt-6 px-1">
          <MarketingStaffChatStrip
            roleId="affiliate_specialist"
            goal="business"
            roleLabel="affiliate"
            subline="Ask about real estate affiliation, partner handoffs, and compliant underwriting-readiness education."
          />
        </div>

        <div className="px-1 py-6">
          <FinelyOsPageFooter />
        </div>
      </div>
    </PageShell>
  );
}
