import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Award, Calendar, Check, Download, Loader2, Lock, MessageCircle, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FreeGuideFunnelStyles } from './FreeGuideFunnelStyles';
import { FlashyIcon } from '../ui';
import { findFreeGuideById } from '../../resources/freeGuides';
import { submitLeadCapture } from '../../data/leadsRepo';
import { downloadFreeGuidePdf } from '../../resources/downloadGuidePdf';
import { downloadScoreRoadmapPdf } from '../../resources/buildScoreRoadmapPdf';
import { captureLeadAttributionFromUrl, getLeadAttribution } from '../../lib/leadAttribution';
import { addLeadNote } from '../../data/leadOpsRepo';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { getLeadMagnetTrial, LEAD_MAGNET_TRIAL_DAYS, startLeadMagnetTrial } from '../../lib/leadMagnetTrial';
import { emitFunnelStepCompleted } from '../../domain/platformEvents';
import { saveAgentHandoff } from '../../lib/agentHandoffBridge';
import { resolveStaffOnDuty } from '../../data/staffRoster';
import { staffMemberFullName } from '../../domain/staffMember';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import { getAgentPersona } from '../../domain/agentPersonas';
import { goalFromFunnelConfig, openPublicChat } from '../../lib/publicChatEvents';
import { assignFunnelVariant, ensureDefaultExperiments, recordFunnelConversion, getExperimentForFunnel } from '../../data/funnelExperimentsRepo';
import type { LeadOffer, LeadGoal } from '../../domain/leads';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { FunnelUpgradeStack } from './FunnelUpgradeStack';
import { FunnelExitIntentModal } from './FunnelExitIntentModal';
import { FunnelInlineSessionBook } from './FunnelInlineSessionBook';
import { PublicInquiryBudgetCalculator } from '../funding/PublicInquiryBudgetCalculator';
import { loadSettings } from '../../data/settingsRepo';
import { resolveLeadMagnetConfig } from '../../data/leadMagnetFunnelsRepo';
import { CreditGuidePremiumDownload, CreditGuidePremiumLanding } from './CreditGuidePremiumSections';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_PANEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsInlineListItem,
  finelyOsCatalogCard,
  finelyOsLeadMagnetPanel,
} from '../../features/os/finelyOsLightUi';

type Step = 'landing' | 'form' | 'success' | 'download';

export function LeadMagnetFunnelShell({
  config,
  variant = 'standard',
}: {
  config: LeadMagnetFunnelConfig;
  variant?: 'standard' | 'premium';
}) {
  const navigate = useNavigate();
  const [overrideTick, setOverrideTick] = useState(0);
  useEffect(() => {
    const onStore = () => setOverrideTick((t) => t + 1);
    window.addEventListener('finely:store', onStore);
    return () => window.removeEventListener('finely:store', onStore);
  }, []);
  const activeConfig = useMemo(() => resolveLeadMagnetConfig(config), [config, overrideTick]);
  usePublicSeoMeta({
    title: activeConfig.metaTitle,
    description: activeConfig.metaDesc,
    path: activeConfig.path,
  });
  const [searchParams] = useSearchParams();
  const guideId = searchParams.get('guide') ?? activeConfig.guideId;
  const guide = useMemo(() => findFreeGuideById(guideId) ?? findFreeGuideById(activeConfig.guideId)!, [guideId, activeConfig.guideId]);

  const initialStep = searchParams.get('step') === 'download' ? 'download' : 'landing';
  const [step, setStep] = useState<Step>(initialStep);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadErr, setDownloadErr] = useState<string | null>(null);
  const [roadmapBusy, setRoadmapBusy] = useState(false);
  const [autoDownloaded, setAutoDownloaded] = useState(false);

  useEffect(() => {
    captureLeadAttributionFromUrl(window.location.search, window.location.pathname);
    ensureDefaultExperiments();
  }, []);

  const abVariant = useMemo(() => assignFunnelVariant(activeConfig.funnelId), [activeConfig.funnelId]);
  const experiment = useMemo(() => getExperimentForFunnel(activeConfig.funnelId), [activeConfig.funnelId]);
  const headlineOverride = experiment?.headlines?.[abVariant];
  const ctaOverride = experiment?.ctaLabels?.[abVariant];
  const trustCount = loadSettings().site.funnelTrustClientCount ?? 10000;
  const trustLabel = trustCount >= 1000 ? `${Math.floor(trustCount / 1000)}k+` : `${trustCount}+`;

  useEffect(() => {
    if (step !== 'download') return;
    const t = setTimeout(() => setGenerating(false), 2200);
    return () => clearTimeout(t);
  }, [step]);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const goalForConfig = useMemo((): LeadGoal => {
    if (activeConfig.id === 'debt') return 'debt';
    if (activeConfig.id === 'business' || activeConfig.id === 'agency') return 'business';
    if (activeConfig.id === 'tradeline') return 'tradelines';
    if (activeConfig.id === 'affiliate') return 'credit';
    return 'credit';
  }, [activeConfig.id]);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!firstName.trim() || !lastName.trim()) return setErr('Enter your first and last name.');
    if (!email.trim() || !email.includes('@')) return setErr('Enter a valid email.');
    if (!phone.trim()) return setErr('Enter your phone number.');
    if (!consent) return setErr('Consent is required to receive the guide.');

    setBusy(true);
    try {
      const attr = getLeadAttribution();
      const result = await submitLeadCapture({
        source: 'lead_magnet',
        offer: activeConfig.offer as LeadOffer,
        interest: guide.title,
        fullName,
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
        consentEmailMarketing: marketing,
        referralCode: attr?.referralCode,
        utmSource: attr?.utmSource,
        utmMedium: attr?.utmMedium,
        utmCampaign: attr?.utmCampaign,
        funnelPath: activeConfig.path,
        guideId: guide.id,
        guideTitle: guide.title,
        funnelId: activeConfig.funnelId,
        goal: goalForConfig,
        giveawayStack: activeConfig.valueStack.map((v) => v.label),
      });
      setLeadId(result.lead.id);
      saveAgentHandoff({
        personaId: activeConfig.agentPersonaId,
        goal: activeConfig.onboardingLane,
        leadId: result.lead.id,
        email: email.trim(),
        surface: 'lead_magnet',
      });
      startLeadMagnetTrial({ leadId: result.lead.id, email: email.trim() });
      emitFunnelStepCompleted({
        tenantId: 'finely_cred',
        funnelId: activeConfig.funnelId,
        step: 'form_submitted',
        leadId: result.lead.id,
        payload: { guideId: guide.id, agentPersonaId: activeConfig.agentPersonaId },
      });
      if (attr?.referralCode) {
        addLeadNote(result.lead.id, `Referral: ${attr.referralCode}`);
      }
      recordFunnelConversion(activeConfig.funnelId, abVariant);
      setStep('success');
    } catch (ex: unknown) {
      setErr((ex as Error)?.message || 'Could not submit. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const downloadGuide = async () => {
    setDownloadBusy(true);
    setDownloadErr(null);
    try {
      await downloadFreeGuidePdf({ guide, leadId: leadId ?? undefined, fullName, email: email.trim() });
    } catch (ex: unknown) {
      setDownloadErr((ex as Error)?.message || 'Download failed.');
    } finally {
      setDownloadBusy(false);
    }
  };

  const downloadRoadmap = async () => {
    setRoadmapBusy(true);
    try {
      await downloadScoreRoadmapPdf({ fullName, leadId: leadId ?? undefined, email: email.trim() });
    } finally {
      setRoadmapBusy(false);
    }
  };

  const bookingPath = activeConfig.bookingPath ?? '/enlightenment-session';

  const bookingUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (email.trim()) params.set('email', email.trim());
    if (fullName.trim()) params.set('name', fullName.trim());
    if (phone.trim()) params.set('phone', phone.trim());
    if (leadId) params.set('leadId', leadId);
    if (activeConfig.id === 'debt') params.set('focus', 'debt');
    else if (activeConfig.id === 'business') params.set('focus', 'business');
    else if (activeConfig.id === 'tradeline') params.set('focus', 'tradelines');
    else params.set('focus', 'personal');
    const qs = params.toString();
    return qs ? `${bookingPath}?${qs}` : bookingPath;
  }, [bookingPath, activeConfig.id, email, fullName, leadId, phone]);

  useEffect(() => {
    if (step !== 'download' || generating || autoDownloaded) return;
    void downloadGuide().then(() => setAutoDownloaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, generating, autoDownloaded]);

  const onboardingUrl = useMemo(() => {
    const attr = getLeadAttribution();
    const params = new URLSearchParams();
    params.set('lane', activeConfig.onboardingLane);
    if (attr?.referralCode) params.set('ref', attr.referralCode);
    params.set('next', '/portal/dashboard');
    return `/onboarding?${params.toString()}`;
  }, [activeConfig.onboardingLane]);

  const totalValue = activeConfig.valueStack.reduce((sum, v) => sum + parseInt(v.value.replace(/\D/g, ''), 10), 0);
  const trialActive = Boolean(getLeadMagnetTrial()?.leadId);

  const assignedStaff = useMemo(() => resolveStaffOnDuty(activeConfig.agentPersonaId), [activeConfig.agentPersonaId]);
  const staffName = assignedStaff ? staffMemberFullName(assignedStaff) : activeConfig.agentDisplayName;
  const staffTitle = getAgentPersona(activeConfig.agentPersonaId)?.displayTitle ?? activeConfig.agentRole;

  return (
    <div className="fg-funnel min-h-screen text-white overflow-x-hidden">
      <FreeGuideFunnelStyles />
      <div className="fg-urgency-bar text-white text-center py-3 px-4 font-bold text-xs sm:text-sm tracking-wider">
        <span className="inline-flex items-center justify-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
          {activeConfig.urgencyText}
          <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
        </span>
      </div>

      {step === 'landing' && (
        variant === 'premium' && activeConfig.id === 'credit' ? (
          <CreditGuidePremiumLanding
            config={activeConfig}
            guide={guide}
            onGoForm={() => setStep('form')}
            headlineOverride={headlineOverride}
            ctaOverride={ctaOverride}
          />
        ) : (
        <div className="bg-mesh min-h-screen">
          <FinelyUnifiedHubLayout
            eyebrow="Free lead magnet"
            title={activeConfig.heroHeadline}
            subtitle={guide.desc}
            accent="emerald"
            tabs={[{ id: 'landing', label: 'Overview' }]}
            activeTab="landing"
            primaryAction={{ label: ctaOverride ?? 'Get free access now', onClick: () => setStep('form') }}
          >
          <header className="container mx-auto px-4 sm:px-6 pt-4 pb-8 max-w-5xl">
            <div className={`${finelyOsLeadMagnetPanel('emerald')} p-6 sm:p-10`} data-fc-accent="emerald">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fg-kicker-pill mb-6">
                <span className="h-2 w-2 rounded-full bg-[#39ff14] animate-pulse" />
                <span className="text-[10px] font-bold text-[#39ff14] uppercase tracking-widest">Free lead magnet</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
                {headlineOverride ?? (
                  <>
                    {activeConfig.heroHeadline} <span className="text-gradient-green">{activeConfig.heroHighlight}</span> {activeConfig.heroSub}
                  </>
                )}
              </h1>
              <p className="text-white/70 text-lg mb-8 max-w-2xl">{guide.desc}</p>

              <FinelyOsPaginatedStack
                items={[...activeConfig.features]}
                pageSize={4}
                itemSpacingClassName="grid sm:grid-cols-2 gap-3"
                renderItem={(f) => (
                  <div key={f.title} className={`${finelyOsCatalogCard('emerald')} !p-4`} data-fc-accent="emerald">
                    <FlashyIcon icon={f.icon} color="emerald" size="xs" className="!w-8 !h-8 mb-2" />
                    <div className="font-bold text-sm mb-1">{f.title}</div>
                    <div className="text-xs opacity-75 leading-relaxed">{f.desc}</div>
                  </div>
                )}
              />

              <div className={`${finelyOsCatalogCard('emerald')} !p-4 mb-8`} data-fc-accent="emerald">
                <div className="text-[10px] uppercase tracking-widest text-emerald-700 mb-3">Total value ${totalValue}+ — yours free</div>
                <FinelyOsPaginatedStack
                  items={[...activeConfig.valueStack]}
                  pageSize={5}
                  itemSpacingClassName="space-y-2 text-sm"
                  renderItem={(v) => (
                    <div key={v.label} className="flex justify-between gap-2">
                      <span>{v.label}</span>
                      <span className="text-emerald-700 font-bold">{v.value}</span>
                    </div>
                  )}
                />
              </div>

              <button type="button" onClick={() => setStep('form')} className="fg-cta-primary text-lg py-4 px-10 rounded-xl inline-flex items-center gap-3">
                {ctaOverride ?? 'Get free access now'} <ArrowRight className="w-5 h-5" />
              </button>
              <p className="mt-3 text-xs text-white/45 inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Join {trustLabel} partners · No card · Instant PDF · {staffName} will follow up
              </p>
            </div>
          </header>
          </FinelyUnifiedHubLayout>
        </div>
        )
      )}

      {step === 'form' && (
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <div className={`${finelyOsCatalogCard('violet')} !p-6 sm:p-8`}>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>Step 1 of 2</div>
            <h2 className="text-2xl font-black mb-2">Unlock your free stack</h2>
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY} mb-6`}>Your guide + bonuses unlock instantly. {staffName}, your {staffTitle}, may reach out to help.</p>
            <form id="funnel-unlock-form" onSubmit={submitForm} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={FINELY_OS_ENTITY_INPUT} />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className={FINELY_OS_ENTITY_INPUT} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={FINELY_OS_ENTITY_INPUT} />
              <label className="flex items-start gap-2 text-xs text-white/60">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                I consent to be contacted about my request (required).
              </label>
              <label className="flex items-start gap-2 text-xs text-white/60">
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1" />
                Send me educational tips and offers by email (optional).
              </label>
              {err ? <div className="text-sm text-rose-300">{err}</div> : null}
              <button type="submit" disabled={busy} className="w-full fg-cta-primary py-3 rounded-xl font-black uppercase tracking-widest text-sm disabled:opacity-50">
                {busy ? 'Submitting…' : 'Unlock my free stack'}
              </button>
            </form>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 space-y-6">
            <div className="text-center">
              <Check className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl font-black mb-2">You're in!</h2>
              <p className="text-white/70">
                Reference {leadId}. {staffName}, your {staffTitle}, is on your team and will follow up by email.
                {trialActive ? ` Your ${LEAD_MAGNET_TRIAL_DAYS}-day portal preview is active.` : ''}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/25 bg-black/25 p-4 flex items-center gap-4">
              {assignedStaff ? (
                <StaffPortraitImg staff={assignedStaff} className="w-14 h-14 rounded-full border-2 border-emerald-400/40" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-200 font-bold">
                  {staffName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-left flex-1 min-w-0">
                <div className="font-bold text-white">{staffName}</div>
                <div className="text-sm text-emerald-200/90">{staffTitle}</div>
                <div className="text-[10px] uppercase tracking-widest text-emerald-400/80 mt-1 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active now
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (leadId) {
                    saveAgentHandoff({
                      leadId,
                      personaId: activeConfig.agentPersonaId,
                      surface: 'funnel',
                      goal: activeConfig.onboardingLane,
                    });
                  }
                  openPublicChat({
                    goal: goalFromFunnelConfig(config),
                    personaId: activeConfig.agentPersonaId,
                    leadId: leadId ?? undefined,
                  });
                }}
                className="shrink-0 py-2 px-4 rounded-xl border border-emerald-400/40 bg-emerald-500/15 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
              >
                <MessageCircle size={14} /> Chat now
              </button>
            </div>

            <div className={`${finelyOsInlineListItem()} p-4 text-left`}>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300 mb-3`}>Your free stack (${totalValue}+ value)</div>
              <FinelyOsPaginatedStack
                items={[...activeConfig.valueStack]}
                pageSize={5}
                itemSpacingClassName={`space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}
                renderItem={(v) => (
                  <div key={v.label} className="flex justify-between gap-2">
                    <span>{v.label}</span>
                    <span className="text-emerald-300 font-bold shrink-0">{v.value}</span>
                  </div>
                )}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => setStep('download')} className="fg-cta-primary py-3 px-6 rounded-xl inline-flex items-center justify-center gap-2">
                <Download className="w-5 h-5" /> Download PDF
              </button>
              <button type="button" onClick={() => navigate(bookingUrl)} className="py-3 px-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 inline-flex items-center justify-center gap-2 font-bold text-sm">
                <Calendar className="w-5 h-5" /> Full booking page
              </button>
            </div>

            {activeConfig.id === 'credit' ? (
              <button
                type="button"
                disabled={roadmapBusy}
                onClick={() => void downloadRoadmap()}
                className="w-full py-3 px-6 rounded-xl border border-white/15 bg-white/[0.04] inline-flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest"
              >
                {roadmapBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download 5-step score roadmap
              </button>
            ) : null}

            {activeConfig.id === 'tradeline' ? <PublicInquiryBudgetCalculator /> : null}

            {leadId ? (
              <FunnelInlineSessionBook
                config={activeConfig}
                leadId={leadId}
                fullName={fullName}
                email={email.trim()}
                phone={phone.trim() || undefined}
              />
            ) : null}

            <div className={`${finelyOsInlineListItem()} p-4 flex flex-wrap items-center justify-between gap-3`}>
              <div className="text-left">
                <div className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE}`}>{staffName} · {staffTitle}</div>
                <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Questions while you wait? Open chat — same specialist.</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (leadId) {
                    saveAgentHandoff({
                      leadId,
                      personaId: activeConfig.agentPersonaId,
                      surface: 'funnel',
                      goal: activeConfig.onboardingLane,
                    });
                  }
                  openPublicChat({
                    goal: goalFromFunnelConfig(config),
                    personaId: activeConfig.agentPersonaId,
                    leadId: leadId ?? undefined,
                  });
                }}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-300"
              >
                <MessageCircle size={14} /> Chat with {staffName.split(' ')[0]}
              </button>
            </div>
            <FunnelUpgradeStack current={activeConfig} />
          </div>
        </div>
      )}

      {step === 'download' && (
        variant === 'premium' && activeConfig.id === 'credit' ? (
          <CreditGuidePremiumDownload
            guide={guide}
            fullName={fullName}
            generating={generating}
            downloadBusy={downloadBusy}
            downloadErr={downloadErr}
            autoDownloaded={autoDownloaded}
            onboardingUrl={onboardingUrl}
            onDownload={() => void downloadGuide()}
          />
        ) : (
        <div className="container mx-auto px-4 py-12 max-w-lg text-center">
          <div className={`${finelyOsCatalogCard('violet')} !p-5 p-8 text-center`}>
            {generating || downloadBusy ? (
              <>
                <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-4" />
                <p className="text-white/70">Preparing your secure PDF…</p>
              </>
            ) : (
              <>
                <Award className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-xl font-black mb-4">Download ready</h2>
                <button type="button" onClick={() => void downloadGuide()} className="fg-cta-primary py-3 px-8 rounded-xl mb-4">
                  Download again
                </button>
                {activeConfig.id === 'credit' ? (
                  <button
                    type="button"
                    disabled={roadmapBusy}
                    onClick={() => void downloadRoadmap()}
                    className="block w-full py-3 rounded-xl border border-white/15 text-sm font-bold uppercase tracking-widest mb-4"
                  >
                    {roadmapBusy ? 'Preparing roadmap…' : 'Download score roadmap PDF'}
                  </button>
                ) : null}
                <button type="button" onClick={() => navigate(onboardingUrl)} className="block w-full py-3 rounded-xl border border-white/15 text-sm font-bold uppercase tracking-widest">
                  Open portal preview
                </button>
                <div className="mt-6 text-left">
                  <FunnelUpgradeStack current={activeConfig} />
                </div>
              </>
            )}
          </div>
        </div>
        )
      )}

      <FunnelExitIntentModal
        active={step === 'landing'}
        headline={`Get your free ${activeConfig.heroHighlight.trim() || 'guide'}`}
        ctaLabel={ctaOverride ?? 'Get free access now'}
        onAccept={() => setStep('form')}
      />

      <div className="fixed bottom-0 inset-x-0 sm:hidden border-t border-white/[0.08] bg-fc-section/95 p-3 z-50">
        {step === 'landing' ? (
          <button type="button" onClick={() => setStep('form')} className="w-full fg-cta-primary py-3 rounded-xl text-sm font-black uppercase">
            Get free access
          </button>
        ) : step === 'form' ? (
          <button
            type="button"
            onClick={() => (document.getElementById('funnel-unlock-form') as HTMLFormElement | null)?.requestSubmit()}
            className="w-full fg-cta-primary py-3 rounded-xl text-sm font-black uppercase"
          >
            Unlock my free stack
          </button>
        ) : null}
      </div>
    </div>
  );
}
