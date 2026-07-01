import React, { useState } from 'react';
import { ArrowRight, BadgeCheck, DollarSign, ShieldAlert, Users, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareersQuickNav } from '../components/careers/CareersQuickNav';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';
import { AF, AFFILIATE_OFFERINGS } from '../config/affiliateProgram';
import { AffiliateCommissionCalculator } from '../components/calculators/AffiliateCommissionCalculator';
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
  finelyOsLeadMagnetPanel,
} from '../features/os/finelyOsLightUi';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');
const formSelect = FINELY_OS_ENTITY_SELECT;

export default function AffiliatePage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Affiliate program',
    description: 'Earn commissions referring partners to Finely Cred restore, funding, and specialist programs.',
    path: '/affiliate',
  });
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [audienceSize, setAudienceSize] = useState('');
  const [monthlyLeadsEstimate, setMonthlyLeadsEstimate] = useState('');
  const [niche, setNiche] = useState('');
  const [regionsServed, setRegionsServed] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [payoutPreference, setPayoutPreference] = useState<'stripe' | 'paypal' | 'zelle' | 'cash_app' | 'other'>('stripe');
  const [payoutHandle, setPayoutHandle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [laneTab, setLaneTab] = useState<'program' | 'apply'>('program');

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
        companyName,
        website,
        socials: { instagram, tiktok, youtube },
        audienceSize: audienceSize.trim() ? Number(audienceSize) : undefined,
        monthlyLeadsEstimate: monthlyLeadsEstimate.trim() ? Number(monthlyLeadsEstimate) : undefined,
        niche,
        regionsServed,
        referralCode,
        payoutPreference,
        payoutHandle,
        notes,
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
      });
      addLeadNote(lead.lead.id, `Affiliate application submitted: ${app.id}\nCompany: ${companyName || '—'}\nWebsite: ${website || '—'}`);

      setStatus('sent');
      setStatusMsg('Application received. Our team will reach out with next steps.');
      setNotes('');
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(err?.message || 'Could not submit application.');
    }
  };

  return (
    <PageShell badge="Public" title={AF.programName} subtitle="Partner with Finely Cred — model commissions, share your link, and grow residual income.">
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center gap-4">
          <BackToSiteButton variant="ghost" label="Back to home" />
          <button type="button" onClick={() => navigate('/onboarding')} className={FINELY_OS_SUCCESS_BTN}>
            Start affiliate signup
          </button>
          <button type="button" onClick={() => navigate(AF.hubPath)} className={FINELY_OS_PRIMARY_BTN}>
            Open {AF.hubName}
          </button>
        </div>

        <CareersQuickNav active="affiliates" className="mt-6" />

        <FinelyUnifiedHubLayout
          eyebrow={AF.programName}
          title="Affiliate partnership"
          subtitle="Model commissions, share your link, and grow residual income."
          accent="sky"
          tabs={[
            { id: 'program', label: 'Program' },
            { id: 'apply', label: 'Apply' },
          ]}
          activeTab={laneTab}
          onTabChange={(id) => setLaneTab(id as typeof laneTab)}
          primaryAction={{ label: 'Open affiliate hub', onClick: () => navigate(AF.hubPath) }}
          secondaryAction={{ label: 'Start signup', onClick: () => navigate('/onboarding') }}
        >

        {laneTab === 'program' && (
        <>
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
            { icon: DollarSign, title: 'Commission structure', body: 'Competitive payouts on qualified referrals. Details and tiers are provided when you join the program.' },
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
                <label className={formLabel}>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={formInput} />
              </div>
              <div>
                <label className={formLabel}>Company (optional)</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={formInput} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={formLabel}>Website (optional)</label>
                <input value={website} onChange={(e) => setWebsite(e.target.value)} className={formInput} placeholder="https://…" />
              </div>
              <div>
                <label className={formLabel}>Referral code (optional)</label>
                <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className={formInput} />
              </div>
            </div>

            <details className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} open>
              <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>Socials + reach</summary>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className={formInput} placeholder="Instagram" />
                <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} className={formInput} placeholder="TikTok" />
                <input value={youtube} onChange={(e) => setYoutube(e.target.value)} className={formInput} placeholder="YouTube" />
                <input value={audienceSize} onChange={(e) => setAudienceSize(e.target.value.replace(/[^\d]/g, ''))} className={formInput} placeholder="Audience size (approx)" />
                <input value={monthlyLeadsEstimate} onChange={(e) => setMonthlyLeadsEstimate(e.target.value.replace(/[^\d]/g, ''))} className={formInput} placeholder="Monthly leads estimate" />
              </div>
            </details>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={formLabel}>Niche</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)} className={formInput} placeholder="Credit, funding, real estate…" />
              </div>
              <div>
                <label className={formLabel}>Regions served</label>
                <input value={regionsServed} onChange={(e) => setRegionsServed(e.target.value)} className={formInput} placeholder="States / cities / remote" />
              </div>
            </div>

            <details className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
              <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>Payout preference</summary>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <select value={payoutPreference} onChange={(e) => setPayoutPreference(e.target.value as any)} className={formSelect}>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="zelle">Zelle</option>
                  <option value="cash_app">Cash App</option>
                  <option value="other">Other</option>
                </select>
                <input value={payoutHandle} onChange={(e) => setPayoutHandle(e.target.value)} className={formInput} placeholder="Payout handle (email/$cashtag/etc.)" />
              </div>
            </details>

            <div>
              <label className={formLabel}>Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className={`${formInput} resize-y`} />
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
          subline="Ask about referral links, commission structure, or co-marketing before you apply."
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
