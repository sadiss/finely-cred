import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, ShieldAlert, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareersQuickNav } from '../components/careers/CareersQuickNav';
import { CreditSpecialistOfferingsPanel } from '../components/creditSpecialist/CreditSpecialistOfferingsPanel';
import { CreditSpecialistCareerGuide } from '../components/creditSpecialist/CreditSpecialistCareerGuide';
import { CS_PUBLIC } from '../components/creditSpecialist/creditSpecialistPublicUi';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';
import { CS, CREDIT_SPECIALIST_COMMS_CHANNELS } from '../config/creditSpecialistProgram';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,

  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  finelyOsCatalogCard,
  finelyOsLeadMagnetPanel,
} from '../features/os/finelyOsLightUi';

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');
const formSelect = FINELY_OS_ENTITY_SELECT;

export default function AgentsPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Credit specialists',
    description:
      'Revenue-share partnership: run partner credit files on Finely operating stack with training, white-label portal, and dispute studio.',
    path: '/credit-specialists',
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [linkedin, setLinkedin] = useState('');
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
  const [laneTab, setLaneTab] = useState<'program' | 'economics' | 'apply'>('program');

  const canSubmit = fullName.trim().length > 1 && email.trim().includes('@') && status !== 'sending';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('sending');
    setStatusMsg(null);
    try {
      const app = createProgramApplication({
        kind: 'agent',
        fullName,
        email,
        phone,
        companyName,
        roleTitle,
        website,
        socials: { instagram, tiktok, youtube, linkedin },
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
        source: 'agent',
        offer: 'agent_application',
        interest: niche.trim() || 'agent_program',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
        funnelPath: '/credit-specialist-apply',
      });
      addLeadNote(lead.lead.id, `Credit Specialist application submitted: ${app.id}\nCompany: ${companyName || '—'}\nWebsite: ${website || '—'}`);

      setStatus('sent');
      setStatusMsg(
        'Application received. Our team will reply via email and, once your account is live, your dedicated partnership line opens in portal messages.',
      );
      setNotes('');
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(err?.message || 'Could not submit application.');
    }
  };

  return (
    <PageShell
      badge="Public"
      title={CS.programName}
      subtitle="Percentage-based partnership — your keep grows as you graduate training and run more of the file yourself."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Back
          </button>
          <a href="/" className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Home
          </a>
          <button type="button" onClick={() => navigate('/onboarding')} className={FINELY_OS_SUCCESS_BTN}>
            Start specialist signup
          </button>
        </div>

        <CareersQuickNav active="credit_specialists" className="mt-6" />

        <FinelyUnifiedHubLayout
          eyebrow={CS.programName}
          title="Credit specialist program"
          subtitle="Program & stack = tools · Tiers & pay = your percentage · Apply = join"
          accent="violet"
          tabs={[
            { id: 'program', label: '① Tools & platform' },
            { id: 'economics', label: '② Tiers & pay' },
            { id: 'apply', label: '③ Apply' },
          ]}
          activeTab={laneTab}
          onTabChange={(id) => setLaneTab(id as typeof laneTab)}
          primaryAction={{ label: 'Apply to program', onClick: () => navigate('/onboarding?goal=agent') }}
          secondaryAction={{ label: CS.hubName, onClick: () => navigate(CS.hubPath) }}
        >

        {laneTab === 'program' && (
        <>
        <div className={`space-y-5 ${finelyOsCatalogCard('violet')} !p-8 sm:!p-10 border-2`} data-fc-accent="violet">
          <p className={CS_PUBLIC.pageKicker}>Credit specialist program</p>
          <h2 className={CS_PUBLIC.pageTitle}>Run client files on Finely</h2>
          <p className={CS_PUBLIC.pageLead}>
            <strong className="text-slate-900">Credit specialist</strong> = you run restore, build, business, and debt files.
            Pay starts around <strong className="text-emerald-700">30%</strong> per file — not 80%. Certified partner is the top step.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 text-center">
            {[
              { n: '30%', label: 'Apprentice start', sub: 'typical keep' },
              { n: 'Tools', label: 'Platform included', sub: 'every level' },
              { n: '80%', label: 'Certified max', sub: 'top per-file keep' },
            ].map((x) => (
              <div key={x.label} className="rounded-xl border-2 border-violet-200 bg-white px-4 py-5">
                <div className="text-3xl sm:text-4xl font-black text-violet-700">{x.n}</div>
                <div className="mt-1 text-base font-bold text-slate-900">{x.label}</div>
                <div className="text-sm text-slate-500">{x.sub}</div>
              </div>
            ))}
          </div>
          <p className={`${CS_PUBLIC.bodySm} max-w-3xl`}>
            Building a company with team seats? See{' '}
            <button type="button" className="underline font-semibold text-violet-700" onClick={() => navigate('/agency-partners')}>
              Agency partners
            </button>
            {' '}— a separate track from solo specialists.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setLaneTab('economics')} className={FINELY_OS_PRIMARY_BTN}>
              See tiers &amp; pay <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => navigate('/onboarding?goal=agent')} className={FINELY_OS_SECONDARY_BTN}>
              Apply now
            </button>
          </div>
        </div>

        <CreditSpecialistOfferingsPanel />

        <div className="space-y-5">
          <div>
            <p className={CS_PUBLIC.sectionKicker}>Stay connected</p>
            <h3 className={`mt-2 ${CS_PUBLIC.sectionTitle}`}>How specialists work with Finely</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {CREDIT_SPECIALIST_COMMS_CHANNELS.map((ch) => (
              <div key={ch.title} className={`${finelyOsCatalogCard('sky')} !p-6 sm:!p-8 border-2 space-y-3`}>
                <h4 className={CS_PUBLIC.cardTitle}>{ch.title}</h4>
                <p className={CS_PUBLIC.body}>{ch.description}</p>
                <button type="button" onClick={() => navigate(ch.path)} className={FINELY_OS_SECONDARY_BTN}>
                  {ch.action} <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        </>
        )}

        {laneTab === 'economics' && <CreditSpecialistCareerGuide />}

        {laneTab === 'apply' && (
        <>
        <header className="mb-8 space-y-3">
          <p className={CS_PUBLIC.sectionKicker}>Step 3</p>
          <h2 className={CS_PUBLIC.sectionTitle}>Apply to the program</h2>
          <p className={CS_PUBLIC.sectionLead}>We review applications and reply by email with next steps.</p>
        </header>
        {statusMsg ? (
          <div className={status === 'sent' ? FINELY_OS_NOTICE_SUCCESS : status === 'error' ? FINELY_OS_NOTICE_ERROR : `${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
            <div className="inline-flex items-center gap-2 font-semibold">
              {status === 'sent' ? <BadgeCheck size={16} /> : <ShieldAlert size={16} />}
              <span>{statusMsg}</span>
            </div>
          </div>
        ) : null}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-7 min-w-0 space-y-4 ${finelyOsCatalogCard('violet')} !p-5`}>
            <div className="inline-flex items-center gap-2 text-fuchsia-400">
              <Users size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Application</span>
            </div>

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
                  <label className={formLabel}>Role title</label>
                  <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} className={formInput} placeholder="Credit Specialist, Broker, Coach…" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={formLabel}>Company</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={formInput} />
                </div>
                <div>
                  <label className={formLabel}>Website</label>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} className={formInput} placeholder="https://…" />
                </div>
              </div>

              <details className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} open>
                <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>Socials + reach</summary>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className={formInput} placeholder="Instagram" />
                  <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} className={formInput} placeholder="TikTok" />
                  <input value={youtube} onChange={(e) => setYoutube(e.target.value)} className={formInput} placeholder="YouTube" />
                  <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={formInput} placeholder="LinkedIn" />
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
                <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>Referral + payout</summary>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className={formInput} placeholder="Referral code (optional)" />
                  <select value={payoutPreference} onChange={(e) => setPayoutPreference(e.target.value as any)} className={formSelect}>
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="zelle">Zelle</option>
                    <option value="cash_app">Cash App</option>
                    <option value="other">Other</option>
                  </select>
                  <input value={payoutHandle} onChange={(e) => setPayoutHandle(e.target.value)} className={`${formInput} md:col-span-2`} placeholder="Payout handle (email/$cashtag/etc.)" />
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

          <div className="lg:col-span-5 min-w-0 space-y-6">
            <div className={`space-y-3 ${finelyOsCatalogCard('violet')} !p-5`}>
              <div className="inline-flex items-center gap-2 text-fuchsia-400">
                <Building2 size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>What happens next</span>
              </div>
              <ul className={`${FINELY_OS_ENTITY_BODY} space-y-2 list-disc pl-5`}>
                <li>We review your application and confirm specialty tracks (restore, build, business credit, etc.).</li>
                <li>We align your training phase and revenue-share levers — software, marketing, fulfillment, mentoring.</li>
                <li>You get {CS.hubName} access, academy modules, a Finely partnership line, and workspace provisioning.</li>
              </ul>
            </div>
          </div>
        </div>
        </>
        )}

        </FinelyUnifiedHubLayout>

        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>Results vary · not legal advice · specialists are independent partners, not employees.</p>

        <MarketingStaffChatStrip
          roleId="lead_converter"
          goal="business"
          roleLabel="partner activation specialist"
          subline="Questions about revenue share, training phases, or white-label setup before you apply?"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
