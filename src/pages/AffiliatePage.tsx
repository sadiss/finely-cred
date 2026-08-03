import React, { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, DollarSign, ShieldAlert, Users, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareersQuickNav } from '../components/careers/CareersQuickNav';
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
import { AF, AFFILIATE_OFFERINGS } from '../config/affiliateProgram';
import { AffiliateCommissionCalculator } from '../components/calculators/AffiliateCommissionCalculator';
import { DigitalInviteShareBand } from '../components/digitalCards';
import { BackToSiteButton } from '../components/navigation/BackToSiteButton';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,

  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');
const formSelect = FINELY_OS_ENTITY_SELECT;

export default function AffiliatePage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Affiliate program',
    description: 'Earn payouts referring partners to Finely Cred restore, funding, and specialist programs.',
    path: '/affiliate',
  });
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [promoLink, setPromoLink] = useState('');
  const [niche, setNiche] = useState('');
  const [payoutPreference, setPayoutPreference] = useState<'stripe' | 'paypal' | 'zelle' | 'cash_app' | 'other'>('stripe');
  const [payoutHandle, setPayoutHandle] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [laneTab, setLaneTab] = useState<'program' | 'apply'>('program');
  const [cardEligibility, setCardEligibility] = useState(() => getDigitalInviteCardEligibilityForRole('affiliate'));

  useEffect(() => {
    captureDigitalInviteCardFromUrl(window.location.search, window.location.pathname);
    setCardEligibility(getDigitalInviteCardEligibilityForRole('affiliate'));
  }, []);

  const cardBonus = getDigitalInviteCardDef('affiliate')?.bonus;

  const canSubmit = fullName.trim().length > 1 && email.trim().includes('@') && status !== 'sending';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('sending');
    setStatusMsg(null);
    try {
      const app = createProgramApplication({
        kind: 'affiliate',
        fullName,
        email,
        phone,
        website: promoLink,
        socials: promoLink ? { other: promoLink } : {},
        niche,
        payoutPreference,
        payoutHandle,
      });
      window.dispatchEvent(new Event('finely:store'));

      const lead = await submitLeadCapture({
        source: 'affiliate',
        offer: 'affiliate_application',
        interest: niche.trim() || 'affiliate_program',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
        funnelPath: '/affiliate-toolkit',
        ...(cardEligibility ? digitalInviteCardLeadAttributionFields(cardEligibility) : {}),
        giveawayStack: cardEligibility && cardBonus ? [cardBonus.label] : undefined,
      });
      addLeadNote(lead.lead.id, `Affiliate application submitted: ${app.id}\nPromo link: ${promoLink || '—'}`);
      if (cardEligibility) {
        addLeadTags(lead.lead.id, ['priority-review', ...digitalInviteCardLeadTags(cardEligibility)]);
        addLeadNote(lead.lead.id, formatDigitalInviteCardNote(cardEligibility));
        markDigitalInviteCardRedeemed(lead.lead.id);
      }

      setStatus('sent');
      setStatusMsg(
        cardEligibility && cardBonus
          ? `Application received — ${cardBonus.label.toLowerCase()} is applied. Our team will reach out with next steps.`
          : 'Application received. Our team will reach out with next steps.',
      );
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(err?.message || 'Could not submit application.');
    }
  };

  return (
    <PageShell badge="Public" title={AF.programName} subtitle="Partner with Finely Cred — model payouts, share your link, and grow residual income.">
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center gap-4">
          <BackToSiteButton variant="ghost" label="Back to home" />
          <button type="button" onClick={() => navigate('/onboarding?lane=affiliate')} className={FINELY_OS_SUCCESS_BTN}>
            Start affiliate signup
          </button>
          <button type="button" onClick={() => navigate(AF.hubPath)} className={FINELY_OS_PRIMARY_BTN}>
            Open {AF.hubName}
          </button>
        </div>

        <CareersQuickNav active="affiliates" className="mt-6" />

        {cardEligibility && cardBonus ? (
          <FinelyOsAlertBanner tone="success" message={cardBonus.description} />
        ) : null}

        <FinelyUnifiedHubLayout
          eyebrow={AF.programName}
          title="Affiliate partnership"
          subtitle="Model payouts, share your link, and grow residual income."
          accent="sky"
          tabs={[
            { id: 'program', label: 'Program' },
            { id: 'apply', label: 'Apply' },
          ]}
          activeTab={laneTab}
          onTabChange={(id) => setLaneTab(id as typeof laneTab)}
          primaryAction={{ label: 'Open affiliate hub', onClick: () => navigate(AF.hubPath) }}
          secondaryAction={{ label: 'Start signup', onClick: () => navigate('/onboarding?lane=affiliate') }}
        >

        {laneTab === 'program' && (
        <>
        <DigitalInviteShareBand role="affiliate" />

        <AffiliateCommissionCalculator />

        <FinelyOsPaginatedStack
          items={[...AFFILIATE_OFFERINGS]}
          pageSize={4}
          itemSpacingClassName="grid md:grid-cols-2 gap-4"
          renderItem={(item, idx) => (
            <div
              key={item.title}
              className={`space-y-2 ${finelyOsCatalogCard((['sky', 'emerald', 'violet', 'amber'] as const)[idx % 4])} !p-5`}
              data-fc-accent={(['sky', 'emerald', 'violet', 'amber'] as const)[idx % 4]}
            >
              <div className={FINELY_OS_ENTITY_VALUE}>{item.title}</div>
              <p className={FINELY_OS_ENTITY_BODY}>{item.description}</p>
            </div>
          )}
        />

        <div className={`space-y-6 ${finelyOsCatalogCard('amber')} !p-6`} data-fc-accent="amber">
          <blockquote className={`text-xl italic leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>
            &ldquo;The day I realized that residual income is far more profitable than chasing the next check,
            was the day my mentality shifted towards wealth.&rdquo;
          </blockquote>
          <p className={`${FINELY_OS_ENTITY_VALUE} font-semibold text-fuchsia-700`}>— Sanz St Louis</p>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Income Built Different</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Share2, title: 'Share & earn', body: 'Refer partners to Finely Cred with your unique link. When they sign up and engage with our services, you earn.' },
            { icon: DollarSign, title: 'Payout structure', body: 'Competitive payouts on qualified referrals. Details and tiers are provided when you join the program.' },
            { icon: Users, title: 'Who can join', body: 'Coaches, brokers, and anyone with an audience that benefits from credit education and funding readiness.' },
          ].map(({ icon: Icon, title, body }, idx) => (
            <div
              key={title}
              className={`space-y-3 ${finelyOsCatalogCard((['violet', 'sky', 'emerald'] as const)[idx % 3])} !p-5`}
              data-fc-accent={(['violet', 'sky', 'emerald'] as const)[idx % 3]}
            >
              <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>
                <Icon size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>{title}</span>
              </div>
              <p className={FINELY_OS_ENTITY_BODY}>{body}</p>
            </div>
          ))}
        </div>
        </>
        )}

        {laneTab === 'apply' && (
        <div className={`space-y-4 ${finelyOsCatalogCard('sky')} !p-6`} data-fc-accent="sky">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className={FINELY_OS_ENTITY_VALUE}>Affiliate application</p>
            <button type="button" onClick={() => navigate('/')} className={FINELY_OS_SECONDARY_BTN}>
              Back to Home
            </button>
          </div>

          {statusMsg ? (
            <div className={status === 'sent' ? FINELY_OS_NOTICE_SUCCESS : status === 'error' ? FINELY_OS_NOTICE_ERROR : `${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
              <div className="inline-flex items-center gap-2 font-semibold">
                {status === 'sent' ? <BadgeCheck size={16} /> : <ShieldAlert size={16} />}
                <span>{statusMsg}</span>
              </div>
            </div>
          ) : null}

          <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
            Short and quick — we&apos;ll follow up with your referral link, marketing kit, and payout setup.
          </p>

          <form className="space-y-4" onSubmit={submit}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={formLabel}>Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={formInput} required />
              </div>
              <div>
                <label className={formLabel}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={formInput} required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={formLabel}>Phone (optional)</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={formInput} />
              </div>
              <div>
                <label className={formLabel}>Where you&apos;ll promote (optional)</label>
                <input value={promoLink} onChange={(e) => setPromoLink(e.target.value)} className={formInput} placeholder="Website, Instagram, TikTok…" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={formLabel}>Niche (optional)</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)} className={formInput} placeholder="Credit, funding, real estate…" />
              </div>
              <div>
                <label className={formLabel}>Payout preference</label>
                <select value={payoutPreference} onChange={(e) => setPayoutPreference(e.target.value as any)} className={formSelect}>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="zelle">Zelle</option>
                  <option value="cash_app">Cash App</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className={formLabel}>Payout handle (optional)</label>
              <input value={payoutHandle} onChange={(e) => setPayoutHandle(e.target.value)} className={formInput} placeholder="Email / $cashtag / PayPal.me…" />
            </div>

            <button type="submit" disabled={!canSubmit} className={`w-full justify-center ${FINELY_OS_PRIMARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}>
              {status === 'sending' ? 'Submitting…' : 'Submit application'} <ArrowRight size={14} />
            </button>
          </form>
        </div>
        )}

        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="affiliate_specialist"
          goal="not_sure"
          roleLabel="affiliate success specialist"
          subline="Ask about referral links, payout structure, or co-marketing before you apply."
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
