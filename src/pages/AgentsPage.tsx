import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, GraduationCap, Percent, ShieldAlert, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { AgentSplitCalculator } from '../components/agent/AgentSplitCalculator';
import { TogglePillGroup } from '../components/ui/TogglePillGroup';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';
import { AGENT_SPECIALTIES, AGENT_TRAINING_PHASES, defaultAgentOperatingModel, formatAgentMoney, resolvePrimarySpecialty, SPECIALTY_ECONOMICS } from '../domain/agentProgram';
import type { AgentSpecialtyId } from '../domain/agentProgram';
import { CS, CREDIT_SPECIALIST_COMMS_CHANNELS } from '../config/creditSpecialistProgram';
import { agencyTiers } from '../config/pricingCatalog';
import { CreditSpecialistOfferingsPanel } from '../components/creditSpecialist/CreditSpecialistOfferingsPanel';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
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
  const [previewSpecialties, setPreviewSpecialties] = useState<AgentSpecialtyId[]>(['personal_restore', 'business_credit']);
  const [previewPhase, setPreviewPhase] = useState<'apprenticeship' | 'guided' | 'independent' | 'partner'>('apprenticeship');

  const previewModel = useMemo(
    () =>
      defaultAgentOperatingModel({
        specialties: previewSpecialties.length ? previewSpecialties : ['personal_restore'],
        trainingPhase: previewPhase,
        capacityTierId: 'agency_solo',
      }),
    [previewSpecialties, previewPhase],
  );

  const previewLaneLabel = useMemo(() => {
    const primary = resolvePrimarySpecialty(previewSpecialties.length ? previewSpecialties : ['personal_restore']);
    return SPECIALTY_ECONOMICS[primary].feeLabel;
  }, [previewSpecialties]);

  const publicAgencyTiers = useMemo(() => agencyTiers.filter((t) => t.isPublic !== false).slice(0, 4), []);

  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [laneTab, setLaneTab] = useState<'program' | 'apply' | 'tiers'>('program');

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

        <FinelyUnifiedHubLayout
          eyebrow={CS.programName}
          title="Credit specialist partnership"
          subtitle="Revenue-share partnership — run partner credit files on Finely's operating stack."
          accent="violet"
          tabs={[
            { id: 'program', label: 'Program' },
            { id: 'apply', label: 'Apply' },
            { id: 'tiers', label: 'Agency tiers' },
          ]}
          activeTab={laneTab}
          onTabChange={(id) => setLaneTab(id as typeof laneTab)}
          primaryAction={{ label: 'Apply to program', onClick: () => navigate('/onboarding?goal=agent') }}
          secondaryAction={{ label: CS.hubName, onClick: () => navigate(CS.hubPath) }}
        >

        {laneTab === 'program' && (
        <>
        <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-6 lg:!p-8`} data-fc-accent="violet">
          <div className="fc-section-kicker text-violet-700">Revenue-share partnership</div>
          <h2 className="fc-section-title text-3xl md:text-4xl font-light tracking-tight">
            Run partner credit files on Finely&apos;s operating stack
          </h2>
          <p className={`max-w-3xl ${FINELY_OS_ENTITY_BODY} text-base`}>
            Credit Specialists are not employees — they are certified partners with revenue share, Denefit contracts, white-label portal, dispute studio, and a dedicated partnership line with Finely ops.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={() => navigate('/onboarding?goal=agent')} className={FINELY_OS_PRIMARY_BTN}>
              Apply to program <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate('/agency/signup')} className={FINELY_OS_SECONDARY_BTN}>
              Agency signup
            </button>
          </div>
        </div>

        <CreditSpecialistOfferingsPanel />

        <div className="space-y-4">
          <div>
            <div className="fc-section-kicker text-sky-300">Comms & growth</div>
            <h3 className="fc-section-title mt-2 text-xl">How specialists stay connected</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {CREDIT_SPECIALIST_COMMS_CHANNELS.map((ch, idx) => {
              const accents = ['sky', 'emerald', 'violet', 'amber'] as const;
              return (
                <div key={ch.title} className={`${finelyOsCatalogCard(accents[idx % accents.length])} !p-5 space-y-3`}>
                  <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{ch.title}</div>
                  <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>{ch.description}</p>
                  <button type="button" onClick={() => navigate(ch.path)} className={FINELY_OS_SECONDARY_BTN}>
                    {ch.action} <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Percent, title: 'Revenue share', body: 'Not flat SaaS pricing. Your split reflects training phase, specialty lane (restore, build, business credit, debt, etc.), and who runs software, marketing, comms, and fulfillment.', accent: 'emerald' as const },
            { icon: GraduationCap, title: 'Training tracks', body: 'Personal restore, personal build, business credit, debt & legal, tradelines, and funding — each with academy modules and certification checkpoints.', accent: 'amber' as const },
            { icon: Sparkles, title: 'Platform stack', body: 'CRM, partner portal, Comms Studio, lead magnets, free & paid ebooks, AI Media Studio, and dispute workflows — included in the model.', accent: 'fuchsia' as const },
          ].map(({ icon: Icon, title, body, accent }) => (
            <div key={title} className={`space-y-2 ${finelyOsCatalogCard(accent)} !p-5`} data-fc-accent={accent}>
              <div className="inline-flex items-center gap-2 text-fuchsia-400">
                <Icon size={16} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>{title}</span>
              </div>
              <p className={FINELY_OS_ENTITY_BODY}>{body}</p>
            </div>
          ))}
        </div>

        <div className={`space-y-5 ${finelyOsCatalogCard('amber')} !p-6`} data-fc-accent="amber">
          <div>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-300`}>Preview your split</div>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
              Tap a specialty and training phase — example fees and splits change by lane (personal restore vs business credit vs funding, etc.).
            </p>
          </div>
          <TogglePillGroup
            label="Specialty tracks"
            variant="white"
            multiple
            options={AGENT_SPECIALTIES.map((s) => ({
              id: s.id,
              label: s.label,
              hint: `${s.description} · example ${formatAgentMoney(SPECIALTY_ECONOMICS[s.id].sampleClientFeeCents)} partner file`,
            }))}
            value={previewSpecialties}
            onChange={(v) => setPreviewSpecialties(v as AgentSpecialtyId[])}
          />
          <TogglePillGroup
            label="Training phase"
            variant="emerald"
            options={AGENT_TRAINING_PHASES.map((p) => ({ id: p.id, label: p.label, hint: p.description }))}
            value={previewPhase}
            onChange={(v) => setPreviewPhase(v as typeof previewPhase)}
          />
          <AgentSplitCalculator model={previewModel} showLeverControls={false} compact />
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Example based on {previewLaneLabel} — actual splits vary by capacity tier and agreement.</p>
        </div>
        </>
        )}

        {laneTab === 'apply' && (
        <>
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

        {laneTab === 'tiers' && (
        <section className={`relative overflow-hidden ${finelyOsCatalogCard('amber')} !p-6 lg:!p-8`} data-fc-accent="amber">
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 text-amber-300">
                  <Building2 size={18} />
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Agency capacity tiers</span>
                </div>
                <h2 className={`mt-2 ${FINELY_OS_ENTITY_TITLE} text-2xl sm:text-3xl`}>Scale partner files, seats & your keep</h2>
                <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} max-w-2xl`}>
                  Revenue share only — no platform fee. Apprenticeship starts around 28–30% agent keep; certified partners cap at 80% with Finely retaining at least 20% for platform, growth, and support.
                </p>
              </div>
              <button type="button" onClick={() => navigate('/pricing?tab=agency')} className={`shrink-0 ${FINELY_OS_PRIMARY_BTN} !py-4 !px-8`}>
                Compare all agency tiers <ArrowRight size={16} />
              </button>
            </div>
            <FinelyOsPaginatedStack
              items={publicAgencyTiers}
              pageSize={6}
              itemSpacingClassName="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"
              renderItem={(tier, idx) => {
                const accents = ['emerald', 'sky', 'violet', 'amber'] as const;
                const accent = accents[idx % accents.length];
                const topSplit = tier.splitBreakdown?.[0];
                const certifiedSplit = tier.splitBreakdown?.[tier.splitBreakdown.length - 1];
                return (
                  <div key={tier.id} className={`space-y-2 ${finelyOsCatalogCard(accent)} !p-5`} data-fc-accent={accent}>
                    <div className={FINELY_OS_ENTITY_VALUE}>{tier.name}</div>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>
                      {tier.activeClientLimit === -1 ? 'Unlimited' : tier.activeClientLimit} partner files ·{' '}
                      {tier.seatLimit === -1 ? 'Unlimited' : tier.seatLimit} seats
                    </div>
                    {topSplit && certifiedSplit ? (
                      <div className={`${FINELY_OS_ENTITY_BODY} space-y-1 pt-1`}>
                        <div>
                          <span className="text-amber-700 font-medium">{topSplit.label}:</span> you {topSplit.agentKeepPct}%
                        </div>
                        <div>
                          <span className="text-emerald-700 font-medium">{certifiedSplit.label}:</span> you {certifiedSplit.agentKeepPct}%
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              }}
            />
          </div>
        </section>
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
