import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, FileText, Sparkles, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { useAuth } from '../auth/AuthProvider';
import { CommsWorkspaceActions } from '../components/comms/CommsWorkspaceActions';
import { MarketingConsentBlock } from '../components/fields/MarketingConsentBlock';
import { submitLeadCapture } from '../data/leadsRepo';
import {
  findFreeGuideBySlugOrIdEffective,
  findFreeGuideByTitleEffective,
  listFreeGuidesEffective,
} from '../data/freeGuidesRepo';
import { downloadFreeGuidePdf } from '../resources/downloadGuidePdf';
import { captureLeadAttributionFromUrl } from '../lib/leadAttribution';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { PublicLaneTitle } from '../components/public/PublicLaneTitle';
import { PUBLIC_FEATURED_FREE_GUIDES } from '../config/publicResourcesHub';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsLeadMagnetPanel,
} from '../features/os/finelyOsLightUi';

export default function ResourcesGuidesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useAuth();
  const [storeVersion, setStoreVersion] = useState(0);

  usePublicSeoMeta({
    title: 'Free guides index',
    description: 'All Finely Cred free guides — dispute, debt, business credit, tradelines, score roadmap, and PDF field guides.',
    path: '/resources/guides',
  });

  useEffect(() => {
    captureLeadAttributionFromUrl(window.location.search, window.location.pathname);
  }, []);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const freeGuides = useMemo(() => listFreeGuidesEffective(), [storeVersion]);
  const blogFrom = searchParams.get('from') === 'blog';
  const blogSlug = searchParams.get('slug');
  const blogGuide = useMemo(() => findFreeGuideBySlugOrIdEffective(blogSlug), [blogSlug, storeVersion]);

  useEffect(() => {
    if (!blogGuide) return;
    const t = window.setTimeout(() => {
      document.getElementById(`guide-card-${blogGuide.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [blogGuide]);

  useEffect(() => {
    if (searchParams.get('guide') === 'credit-dispute-letter-guide') {
      navigate(`/free-guide?${searchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const [leadOpen, setLeadOpen] = useState(false);
  const [leadInterest, setLeadInterest] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState({ email: false, sms: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [remoteStatus, setRemoteStatus] = useState<'ok' | 'failed' | 'not_configured' | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const phoneDigits = useMemo(() => phone.replace(/\D/g, ''), [phone]);
  const phoneOk = useMemo(() => phoneDigits.length >= 10 && phoneDigits.length <= 15, [phoneDigits]);

  const openLead = (interest: string) => {
    setLeadInterest(interest);
    setLeadOpen(true);
    setSubmitErr(null);
    setSubmittedId(null);
    setRemoteStatus(null);
    setRemoteError(null);
  };

  const closeLead = () => {
    setLeadOpen(false);
    setSubmitting(false);
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setConsent(false);
    setMarketingConsent({ email: false, sms: false });
    setSubmitErr(null);
    setSubmittedId(null);
    setRemoteStatus(null);
    setRemoteError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    if (!fullName.trim()) return setSubmitErr('Please enter your name.');
    if (!emailOk) return setSubmitErr('Please enter a valid email.');
    if (!phoneOk) return setSubmitErr('Please enter a valid phone number (10–15 digits).');
    if (!consent) return setSubmitErr('Consent is required to request your free strategy call.');

    setSubmitting(true);
    try {
      const result = await submitLeadCapture({
        source: 'resources',
        offer: 'free_1h_consult',
        interest: leadInterest ?? undefined,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
        funnelPath: '/resources/guides',
        consentEmailMarketing: marketingConsent.email,
        consentSmsMarketing: marketingConsent.sms,
      });
      setSubmittedId(result.lead.id);
      setRemoteStatus(result.remote);
      setRemoteError(result.remoteError ?? null);
    } catch (err: unknown) {
      setSubmitErr(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const qs = searchParams.toString();

  return (
    <PageShell
      badge="Public"
      title="Free guides"
      subtitle="Featured lead magnets plus PDF field guides — pick one path, then take the next step."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        <PublicLaneTitle
          lane="resources"
          eyebrow="Guides index"
          text="Every free guide, one lane each."
          highlight="one lane each."
        />
        <FinelyUnifiedHubLayout
          eyebrow="Guides index"
          title="All free guides"
          subtitle="Start with a featured funnel, or request a PDF field guide with a complimentary strategy call."
          accent="emerald"
          kpis={[
            { label: 'Featured', value: String(PUBLIC_FEATURED_FREE_GUIDES.length), accent: 'emerald' },
            { label: 'Field guides', value: String(freeGuides.length), accent: 'violet' },
          ]}
          primaryAction={{ label: 'Dispute letter guide', onClick: () => navigate(qs ? `/free-guide?${qs}` : '/free-guide') }}
          secondaryAction={{ label: 'Resource hub', onClick: () => navigate('/resources') }}
        >
          {blogFrom ? (
            <div className={`${FINELY_OS_NOTICE_WARN} mb-4 flex flex-wrap items-center justify-between gap-3`}>
              <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                {blogGuide ? (
                  <>
                    Moved from blog — showing <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{blogGuide.title}</span>.
                  </>
                ) : (
                  <>This page moved from our blog — browse free guides below{blogSlug ? ` (legacy slug: ${blogSlug})` : ''}.</>
                )}
              </div>
              <button type="button" onClick={() => navigate('/resources/guides')} className={FINELY_OS_SECONDARY_BTN}>
                Clear blog link
              </button>
            </div>
          ) : null}

          <div className={`${finelyOsLeadMagnetPanel('emerald')} mb-4`} data-fc-accent="emerald">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-600/25 bg-emerald-500/15 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Free guide</span>
                </div>
                <h2 className="text-xl font-black leading-tight sm:text-2xl">
                  Credit Dispute Letter Guide — <span className="text-emerald-700">5-step playbook</span>
                </h2>
                <p className="mt-2 max-w-xl text-sm opacity-80">
                  Instant PDF, referral tracking, and a path into your secure Finely dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(qs ? `/free-guide?${qs}` : '/free-guide')}
                className={FINELY_OS_PRIMARY_BTN}
              >
                Claim free guide <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {auth.user ? <CommsWorkspaceActions calendarLabel="Schedule strategy call" /> : null}

          <section className="mb-6 space-y-3">
            <h2 className="fc-launch-lane-header">Featured funnels</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PUBLIC_FEATURED_FREE_GUIDES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => navigate(g.path)}
                  className={`${finelyOsCatalogCard(g.accent === 'amber' || g.accent === 'fuchsia' ? 'rose' : g.accent)} text-left transition-all hover:brightness-110`}
                  data-fc-accent={g.accent === 'amber' || g.accent === 'fuchsia' ? 'rose' : g.accent}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={FINELY_OS_ENTITY_SUBLABEL}>{g.badge || 'Free guide'}</span>
                    <FileText size={16} className="shrink-0 opacity-70" />
                  </div>
                  <div className={`mt-2 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{g.title}</div>
                  <p className={`mt-1 text-base ${FINELY_OS_ENTITY_BODY}`}>{g.desc}</p>
                  <span className={`${FINELY_OS_SECONDARY_BTN} mt-3`}>
                    Open guide <ArrowRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className={`space-y-4 ${finelyOsCatalogCard('emerald')}`} data-fc-accent="emerald">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/35 bg-emerald-500/15">
                <BookOpen size={18} className="text-emerald-300" />
              </div>
              <div>
                <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Free PDF guides</span>
                <div className={`text-xs font-semibold uppercase tracking-wider ${FINELY_OS_ENTITY_BODY}`}>Field guides</div>
              </div>
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-base max-w-3xl`}>
              High-signal field guides for clean execution. Request access and you&apos;ll also receive a complimentary 60‑minute
              strategy call.
            </p>
            <FinelyOsPaginatedStack
              items={freeGuides}
              pageSize={9}
              itemSpacingClassName="grid md:grid-cols-2 lg:grid-cols-3 gap-3"
              renderItem={(x, idx) => (
                <div
                  key={x.id}
                  id={`guide-card-${x.id}`}
                  className={`space-y-3 ${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} ${
                    blogGuide?.id === x.id ? 'ring-2 ring-violet-400/60' : ''
                  }`}
                  data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-200">
                      PDF guide
                    </span>
                    <FileText size={16} className="text-emerald-300" />
                  </div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{x.title}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-sm leading-relaxed`}>{x.desc}</div>
                  <button type="button" onClick={() => openLead(x.title)} className={`${FINELY_OS_SUCCESS_BTN} w-full justify-center`}>
                    Request guide + session <ArrowRight size={14} />
                  </button>
                </div>
              )}
            />
          </section>

          <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>
            Results vary · not legal advice · educational dispute workflow only.
          </p>
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="nurture_concierge"
          goal="personal"
          roleLabel="welcome concierge"
          subline="Need help picking a guide or booking your free strategy call after a download?"
        />
        <FinelyOsPageFooter />
      </div>

      {leadOpen ? (
        <div className="fixed inset-0 z-[300]">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={closeLead} />
          <div className="absolute inset-x-0 top-10 px-4">
            <div className={`mx-auto max-w-xl overflow-hidden shadow-2xl ${finelyOsCatalogCard('violet')}`}>
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-4">
                <div className="min-w-0">
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-bold text-fuchsia-300`}>Free guide + 60‑minute strategy call</div>
                  <div className={`mt-2 text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Request your guide and schedule your strategy call</div>
                  <div className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                    {leadInterest ? (
                      <>
                        Requested guide: <span className={`font-medium ${FINELY_OS_ENTITY_VALUE}`}>{leadInterest}</span>
                      </>
                    ) : (
                      <>Guide request</>
                    )}
                  </div>
                </div>
                <button type="button" onClick={closeLead} className={FINELY_OS_SECONDARY_BTN} title="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4">
                {submittedId ? (
                  <div className="space-y-4">
                    <div className={FINELY_OS_NOTICE_SUCCESS}>
                      <div className="inline-flex items-center gap-2 text-emerald-300">
                        <CheckCircle2 size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Request received</span>
                      </div>
                      <p className={`mt-2 font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                        You&apos;re in. We&apos;ll contact you to schedule your 60‑minute strategy call.
                      </p>
                      <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                        Reference ID: <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>{submittedId}</span>
                      </p>
                      {remoteStatus === 'ok' ? (
                        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-emerald-300`}>
                          Saved to our system. You&apos;ll receive scheduling outreach shortly.
                        </p>
                      ) : null}
                      {remoteStatus === 'not_configured' ? (
                        <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                          Saved locally in this browser. To enable live capture in your backend, connect Supabase.
                        </p>
                      ) : null}
                      {remoteStatus === 'failed' ? (
                        <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                          Saved locally, but couldn&apos;t reach Supabase right now. {remoteError ? `(${remoteError})` : ''}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          const guide = findFreeGuideByTitleEffective(leadInterest) ?? freeGuides[0]!;
                          void downloadFreeGuidePdf({ guide, leadId: submittedId, fullName: fullName.trim() || undefined });
                        }}
                        className={FINELY_OS_SECONDARY_BTN}
                      >
                        Download guide PDF <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          closeLead();
                          resetForm();
                        }}
                        className={FINELY_OS_PRIMARY_BTN}
                      >
                        Done <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={FINELY_OS_ENTITY_LABEL}>Name</label>
                        <input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={FINELY_OS_ENTITY_INPUT}
                          placeholder="Your full name"
                          autoComplete="name"
                          required
                        />
                      </div>
                      <div>
                        <label className={FINELY_OS_ENTITY_LABEL}>Email</label>
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={FINELY_OS_ENTITY_INPUT}
                          placeholder="you@email.com"
                          type="email"
                          autoComplete="email"
                          required
                        />
                      </div>
                      <div>
                        <label className={FINELY_OS_ENTITY_LABEL}>Phone</label>
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={FINELY_OS_ENTITY_INPUT}
                          placeholder="(555) 555-5555"
                          type="tel"
                          autoComplete="tel"
                          required
                        />
                      </div>
                    </div>

                    <label className={`flex cursor-pointer items-start gap-3 ${finelyOsCatalogCard('sky')}`}>
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <span className={FINELY_OS_ENTITY_BODY}>
                        I consent to be contacted by Finely Cred about this guide request and the complimentary strategy call.
                      </span>
                    </label>

                    <MarketingConsentBlock value={marketingConsent} onChange={setMarketingConsent} phone={phone} />
                    {submitErr ? <div className={FINELY_OS_NOTICE_ERROR}>{submitErr}</div> : null}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button type="submit" disabled={submitting} className={`${FINELY_OS_PRIMARY_BTN} disabled:cursor-not-allowed disabled:opacity-60`}>
                        {submitting ? 'Submitting…' : 'Request guide + session'} <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          closeLead();
                          resetForm();
                        }}
                        className={FINELY_OS_SECONDARY_BTN}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
