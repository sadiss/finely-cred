import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Calculator, ArrowRight, DollarSign, ShieldAlert, Share2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareerOtherTracksLink } from '../components/careers/CareerOtherTracksLink';
import { CareerTierChooser, type CareerChoiceOption } from '../components/careers/CareerTierChooser';
import { CareerPackagePanel } from '../components/careers/CareerPackagePanel';
import { CareerChoiceApply } from '../components/careers/CareerChoiceApply';
import { CareerTierStickySummary } from '../components/careers/CareerTierStickySummary';
import { careerAccentText } from '../components/careers/careerUi';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote, addLeadTags } from '../data/leadOpsRepo';
import {
  captureDigitalInviteCardFromUrl,
  digitalInviteCardLeadAttributionFields,
  digitalInviteCardLeadTags,
  formatDigitalInviteCardNote,
  getDigitalInviteCardEligibilityForRole,
  markDigitalInviteCardRedeemed,
} from '../lib/digitalInviteCardAttribution';
import { getDigitalInviteCardDef } from '../config/digitalInviteCards';
import { FinelyOsAlertBanner } from '../features/os/FinelyOsAlertBanner';
import { AF, AFFILIATE_PATHS, AFFILIATE_STACKING_NOTE, getAffiliatePathById } from '../config/affiliateProgram';
import { signupUrlForRole } from '../lib/onboardingRoleRouting';
import { AffiliateCommissionCalculator } from '../components/calculators/AffiliateCommissionCalculator';
import { DigitalInviteShareBand } from '../components/digitalCards';
import { BackToSiteButton } from '../components/navigation/BackToSiteButton';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import {
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
} from '../features/os/finelyOsLightUi';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');
const APPLY_SECTION_ID = 'affiliate-apply';

export default function AffiliatePage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Affiliate program',
    description: 'Earn payouts referring partners to Finely Cred restore, funding, and specialist programs.',
    path: AF.publicPath,
  });

  const [selectedPathId, setSelectedPathId] = useState<string>(AFFILIATE_PATHS[0]?.id ?? '');
  const selectedPath = getAffiliatePathById(selectedPathId) ?? AFFILIATE_PATHS[0] ?? null;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [cardEligibility, setCardEligibility] = useState(() => getDigitalInviteCardEligibilityForRole('affiliate'));

  useEffect(() => {
    captureDigitalInviteCardFromUrl(window.location.search, window.location.pathname);
    setCardEligibility(getDigitalInviteCardEligibilityForRole('affiliate'));
  }, []);

  const cardBonus = getDigitalInviteCardDef('affiliate')?.bonus;

  const pathOptions: CareerChoiceOption[] = useMemo(
    () =>
      AFFILIATE_PATHS.map((p) => ({
        id: p.id,
        name: p.name,
        badge: p.ladderLabel.split(' · ')[0],
        description: p.description,
        priceLabel: p.tagline,
        accent: p.accent,
      })),
    [],
  );

  const canSubmit = fullName.trim().length > 1 && email.trim().includes('@') && status !== 'sending';

  const scrollToApply = () => document.getElementById(APPLY_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedPath) return;
    setStatus('sending');
    setStatusMsg(null);
    try {
      const app = createProgramApplication({
        kind: 'affiliate',
        fullName,
        email,
        phone,
        niche: selectedPath.name,
      });
      window.dispatchEvent(new Event('finely:store'));

      const lead = await submitLeadCapture({
        source: 'affiliate',
        offer: 'affiliate_application',
        interest: selectedPath.name,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
        funnelPath: '/affiliate-toolkit',
        ...(cardEligibility ? digitalInviteCardLeadAttributionFields(cardEligibility) : {}),
        giveawayStack: cardEligibility && cardBonus ? [cardBonus.label] : undefined,
      });
      addLeadNote(lead.lead.id, `Affiliate application submitted: ${app.id}\nPath: ${selectedPath.name}`);
      if (cardEligibility) {
        addLeadTags(lead.lead.id, ['priority-review', ...digitalInviteCardLeadTags(cardEligibility)]);
        addLeadNote(lead.lead.id, formatDigitalInviteCardNote(cardEligibility));
        markDigitalInviteCardRedeemed(lead.lead.id);
      }

      setStatus('sent');
      setStatusMsg(
        cardEligibility && cardBonus
          ? `Application received — ${cardBonus.label.toLowerCase()} is applied. Taking you to signup…`
          : 'Application received. Taking you to signup…',
      );
      navigate(signupUrlForRole('affiliate', { path: selectedPath.id }));
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(err?.message || 'Could not submit application.');
    }
  };

  return (
    <PageShell badge="Public" title={AF.programName} subtitle="Model payouts, share your link, and grow residual income." hideHero>
      <div className={`${FINELY_OS_PAGE} max-w-5xl mx-auto pb-20`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BackToSiteButton variant="ghost" label="Back to home" />
          <div className="flex flex-wrap items-center gap-3">
            <CareerOtherTracksLink currentId="affiliates" />
            <button type="button" onClick={() => navigate(AF.hubPath)} className={FINELY_OS_PRIMARY_BTN}>
              Open {AF.hubName}
            </button>
          </div>
        </div>

        {cardEligibility && cardBonus ? <FinelyOsAlertBanner tone="success" message={cardBonus.description} /> : null}

        {/* One calm hero — no stacked PageShell + hub-layout hero */}
        <section className="rounded-3xl border-2 border-sky-200 bg-white p-6 sm:p-10 space-y-4">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-700">{AF.programName}</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.08] text-slate-900">
            Refer partners. Get paid on real payouts.
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-slate-600">
            Share your link and earn {AF.defaultCommissionPct}% on every package sale — restore, business credit,
            dispute letters. Choose a path to unlock the toolkit, priority, and bonuses built for how you'll
            promote. No dispute files to run, no software to buy.
          </p>
        </section>

        {/* The universal payout rule — same for every path, stated once, unmistakably additive */}
        <section className="rounded-2xl border-2 border-rose-200 bg-rose-50 px-6 py-4 sm:px-8 sm:py-5">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-rose-700">Not percentage OR profit share — it stacks</p>
          <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-slate-700">{AFFILIATE_STACKING_NOTE}</p>
        </section>

        {/* Top panel — affiliate paths ONLY */}
        <section className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-6 sm:p-8">
          <CareerTierChooser
            title="Choose your path"
            subtitle="Referrer, recurring partner, or Denefit-focused partner — every path earns package % plus Denefit stacking. Picking a path unlocks the toolkit, priority, and bonuses built for how you'll promote."
            options={pathOptions}
            selectedId={selectedPathId}
            onSelect={setSelectedPathId}
            columns={3}
          />
        </section>

        {/* What you get for the selected path — ladder buckets, not a flat checklist */}
        {selectedPath ? (
          <section className="space-y-3">
            <div className="max-w-2xl space-y-1.5">
              <p className={`text-[11px] font-black uppercase tracking-[0.24em] ${careerAccentText(selectedPath.accent)}`}>
                {selectedPath.ladderLabel} · What you get
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{selectedPath.payoutLabel}</h2>
            </div>
            <CareerPackagePanel blocks={selectedPath.blocks} accent={selectedPath.accent} />
          </section>
        ) : null}

        {/* Quote — its own band, generous margin, not cramped */}
        <section className="rounded-3xl border-2 border-violet-200 bg-white p-8 sm:p-12">
          <blockquote className="text-xl sm:text-2xl italic leading-relaxed text-slate-800">
            &ldquo;The day I realized that residual income is far more profitable than chasing the next check, was the
            day my mentality shifted towards wealth.&rdquo;
          </blockquote>
          <p className="mt-6 text-base font-bold text-violet-700">— Sanz St Louis</p>
          <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-slate-400">Income Built Different</p>
        </section>

        {/* Share & earn / Payout / Who can join — spaced white cards */}
        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Share2,
              title: 'Share & earn',
              body: 'Refer partners to Finely Cred with your unique link. When they sign up and engage with our services, you earn.',
              tone: 'text-sky-700 bg-sky-50 border-sky-200',
            },
            {
              icon: DollarSign,
              title: 'Payout structure',
              body: `Package % on every sale, plus the Denefit share stacking on top whenever a referral finances in-house. Your path sets the toolkit and priority — the stack itself never changes.`,
              tone: 'text-emerald-700 bg-emerald-50 border-emerald-200',
            },
            {
              icon: Users,
              title: 'Who can join',
              body: 'Coaches, brokers, and anyone with an audience that benefits from credit education and funding readiness.',
              tone: 'text-rose-700 bg-rose-50 border-rose-200',
            },
          ].map(({ icon: Icon, title, body, tone }) => (
            <div key={title} className="rounded-2xl border-2 border-slate-200 bg-white p-7 space-y-3">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${tone}`}>
                <Icon size={14} /> {title}
              </span>
              <p className="text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </section>

        {/* Apply — choice-first: path already picked above, now a short form */}
        <section id={APPLY_SECTION_ID} className="scroll-mt-24">
          <CareerChoiceApply
            kicker="Apply"
            title="Get your referral link."
            selectedLabel={selectedPath ? `Path: ${selectedPath.name} (${selectedPath.ladderLabel})` : 'Pick a path above'}
            description="Short and quick — we'll follow up with your referral link, marketing kit, and payout setup."
            ctaLabel={status === 'sending' ? 'Submitting…' : 'Submit application'}
            onSubmit={submit}
            submitDisabled={!canSubmit}
            accent={selectedPath?.accent ?? 'emerald'}
          >
            {statusMsg ? (
              <div className={status === 'sent' ? FINELY_OS_NOTICE_SUCCESS : status === 'error' ? FINELY_OS_NOTICE_ERROR : ''}>
                <div className="inline-flex items-center gap-2 font-semibold">
                  {status === 'sent' ? <BadgeCheck size={16} /> : <ShieldAlert size={16} />}
                  <span>{statusMsg}</span>
                </div>
              </div>
            ) : null}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={formLabel}>Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={formInput} required />
              </div>
              <div>
                <label className={formLabel}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={formInput} required />
              </div>
            </div>
            <div>
              <label className={formLabel}>Phone (optional)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${formInput} sm:max-w-xs`} />
            </div>
          </CareerChoiceApply>
        </section>

        {/* Calculator / toolkit — secondary, below the apply flow */}
        <section className="rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Model your payout</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Commission calculator</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/affiliate-toolkit')}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-slate-300"
            >
              <Calculator size={15} /> Open affiliate toolkit <ArrowRight size={14} />
            </button>
          </div>
          <AffiliateCommissionCalculator />
        </section>

        <DigitalInviteShareBand role="affiliate" />

        <p className="text-xs text-slate-400">Results vary · not legal advice · affiliates are independent partners, not employees.</p>

        <MarketingStaffChatStrip
          roleId="affiliate_specialist"
          goal="not_sure"
          roleLabel="affiliate success specialist"
          subline="Ask about referral links, payout structure, or co-marketing before you apply."
        />

        <FinelyOsPageFooter />
      </div>

      <CareerTierStickySummary
        roleLabel="Affiliate"
        tierName={selectedPath?.name}
        economics={{ commissionLabel: selectedPath?.tagline }}
        ctaLabel="Submit application"
        onCta={scrollToApply}
        accent={selectedPath?.accent ?? 'emerald'}
        visible={Boolean(selectedPath)}
      />
    </PageShell>
  );
}
