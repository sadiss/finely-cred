import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  GitBranch,
  Headphones,
  Landmark,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Film,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { useAuth } from '../auth/AuthProvider';
import { CommsWorkspaceActions } from '../components/comms/CommsWorkspaceActions';
import { isAdminEmail } from '../auth/admin';
import { submitLeadCapture } from '../data/leadsRepo';
import { MarketingConsentBlock } from '../components/fields/MarketingConsentBlock';
import { findFreeGuideByTitleEffective, findFreeGuideBySlugOrIdEffective, listFreeGuidesEffective } from '../data/freeGuidesRepo';
import { listPublicResourceVideos } from '../data/resourceVideosRepo';
import { GuideAudioPlayer } from '../components/resources/GuideAudioPlayer';
import { getGuideNarration } from '../resources/guideNarration';
import { downloadFreeGuidePdf } from '../resources/downloadGuidePdf';
import { getBlobUrl } from '../storage/getBlobUrl';
import { ResourceVideoThumb } from '../components/resources/ResourceVideoThumb';
import { captureLeadAttributionFromUrl } from '../lib/leadAttribution';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { buildOrganizationSchema, buildWebPageSchema, injectJsonLd } from '../lib/seoSchema';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../components/tours/FinelyNoticedStrip';
import { FinelyTourPlayer } from '../components/tours/FinelyTourPlayer';
import { TourVideoStatusBadge } from '../components/tours/TourVideoStatusBadge';
import { TOUR_MANIFEST } from '../config/tourManifest';
import { getTourPosterPublicUrl } from '../domain/tourPlayback';
import { buildResourcesNoticedItems } from '../lib/finelyProactiveSignals';
import { PUBLIC_DEMO_VIDEOS_ENABLED } from '../config/publicMediaPolicy';
import { CreditMonitoringPartnerGrid, CREDIT_MONITORING_PARTNERS } from '../components/resources/CreditMonitoringPartnerGrid';
import { listBookstoreProducts } from '../data/bookstoreRepo';
import { formatPrice } from '../config/pricingCatalog';
import { splitBookIntoChapters } from '../domain/libraryEntitlements';
import {
  FINELY_OS_PAGE,


  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsLeadMagnetPanel,
  finelyOsInlineListItem,
  FINELY_OS_VIEW_TABS,
  FINELY_OS_TOOLBAR,
  finelyOsViewTab,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
} from '../features/os/finelyOsLightUi';

type ResourcesSection = 'guides' | 'monitoring' | 'references' | 'videos';

export default function ResourcesPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Resources & tools',
    description: 'Free guides, calculators, videos, and education for credit restore and business funding.',
    path: '/resources',
  });
  const [searchParams] = useSearchParams();
  const auth = useAuth();
  const isAdmin = isAdminEmail(auth.user?.email);
  const [storeVersion, setStoreVersion] = useState(0);
  const [activeSection, setActiveSection] = useState<ResourcesSection>('guides');

  const jumpToSection = (id: ResourcesSection) => {
    setActiveSection(id);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  useEffect(() => {
    const hash = (window.location.hash.replace('#', '') || '') as ResourcesSection;
    if (hash === 'guides' || hash === 'monitoring' || hash === 'references' || (hash === 'videos' && PUBLIC_DEMO_VIDEOS_ENABLED)) {
      const t = window.setTimeout(() => jumpToSection(hash), 120);
      return () => window.clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    captureLeadAttributionFromUrl(window.location.search, window.location.pathname);
    const origin = window.location.origin;
    injectJsonLd('finely-org-schema', buildOrganizationSchema(origin));
    injectJsonLd('finely-resources-schema', buildWebPageSchema({
      origin,
      path: '/resources',
      name: 'Resources & Tools — Finely Cred',
      description: 'Free guides, calculators, videos, and education for credit restore and business funding.',
    }));
    const guideId = searchParams.get('guide');
    if (guideId === 'credit-dispute-letter-guide') {
      navigate('/free-guide?' + searchParams.toString(), { replace: true });
    }
    if (searchParams.get('from') === 'blog') {
      jumpToSection('guides');
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const businessCreditMaxLinks = [
    { label: 'Link A', href: 'https://www.myscoreiq.com/business-credit-max.aspx?offercode=432133WW' },
    { label: 'Link B', href: 'https://www.myscoreiq.com/business-credit-max.aspx?offercode=432133WX' },
    { label: 'Link C', href: 'https://www.myscoreiq.com/business-credit-max.aspx?offercode=432133X3' },
  ] as const;
  const [businessLinkIdx, setBusinessLinkIdx] = useState<0 | 1 | 2>(0);

  const quickRefs = [
    {
      title: 'Dispute workflow overview',
      desc: 'How evidence, reasons, letters, rounds, and follow-ups connect.',
      icon: Scale,
      badge: 'Workflow',
      tone: 'border-violet-500/30 bg-gradient-to-br from-violet-500/15 to-black/40 hover:border-violet-400/50',
      iconTone: 'text-violet-300 bg-violet-500/15 border-violet-500/30',
    },
    {
      title: 'Document discipline',
      desc: 'What to upload, when, and how to label it for clean execution.',
      icon: FileText,
      badge: 'Vault',
      tone: 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/12 to-black/40 hover:border-emerald-400/50',
      iconTone: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    },
    {
      title: 'Score model cheat sheet',
      desc: 'FICO vs VantageScore, and why lenders differ by product.',
      icon: TrendingUp,
      badge: 'Scores',
      tone: 'border-amber-500/30 bg-gradient-to-br from-amber-500/12 to-black/40 hover:border-amber-400/50',
      iconTone: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
    },
    {
      title: 'Funding readiness sequencing',
      desc: 'Avoidable denials: timing, utilization, and profile structure.',
      icon: Target,
      badge: 'Funding',
      tone: 'border-sky-500/30 bg-gradient-to-br from-sky-500/12 to-black/40 hover:border-sky-400/50',
      iconTone: 'text-sky-300 bg-sky-500/15 border-sky-500/30',
    },
  ] as const;
  const freeGuides = useMemo(() => listFreeGuidesEffective(), [storeVersion]);
  const bookstoreFeatured = useMemo(
    () =>
      listBookstoreProducts()
        .filter((p) => p.published)
        .slice(0, 6),
    [storeVersion],
  );
  const resourceVideos = useMemo(() => listPublicResourceVideos(), [storeVersion]);
  const showPublicVideos = PUBLIC_DEMO_VIDEOS_ENABLED;
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

  const [videoPreview, setVideoPreview] = useState<null | { title: string; url: string; revoke?: () => void }>(null);
  const [previewTourId, setPreviewTourId] = useState<string | null>(null);
  const previewTour = useMemo(() => TOUR_MANIFEST.find((t) => t.id === previewTourId) ?? null, [previewTourId]);

  const openVideo = async (id: string) => {
    const v = resourceVideos.find((x) => x.id === id);
    if (!v) return;
    try {
      videoPreview?.revoke?.();
    } catch {
      // ignore
    }
    const res = await getBlobUrl(v.blobRef, { mimeType: v.mimeType, preferSigned: true, signedTtlSeconds: 60 * 20 });
    if (!res?.url) return;
    setVideoPreview({ title: v.title, url: res.url, revoke: res.revoke });
  };

  const closeVideo = () => {
    try {
      videoPreview?.revoke?.();
    } catch {
      // ignore
    }
    setVideoPreview(null);
  };

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

  const [previewGuideId, setPreviewGuideId] = useState<string | null>(null);
  const previewGuide = useMemo(() => freeGuides.find((g) => g.id === previewGuideId) ?? null, [freeGuides, previewGuideId]);
  const previewNarration = useMemo(
    () => (previewGuide ? getGuideNarration(previewGuide.id, previewGuide.title, previewGuide.sections) : null),
    [previewGuide],
  );

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
        funnelPath: '/resources',
        consentEmailMarketing: marketingConsent.email,
        consentSmsMarketing: marketingConsent.sms,
      });
      setSubmittedId(result.lead.id);
      setRemoteStatus(result.remote);
      setRemoteError(result.remoteError ?? null);
    } catch (err: any) {
      setSubmitErr(err?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      badge="Public"
      title="Resource Library"
      subtitle="Free guides, credit monitoring links, and playbooks — all on one page."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        <FinelyNoticedStrip items={buildResourcesNoticedItems({ section: activeSection })} />
        <FinelyNowDoThisStrip currentIndex={activeSection === 'monitoring' ? 1 : activeSection === 'videos' ? 2 : 0} />
        <FinelyUnifiedHubLayout
          eyebrow="Resource library"
          title="Guides, monitoring, and references — scroll or jump"
          subtitle="Everything stays visible on one page. Use the lane buttons to jump — nothing is hidden behind tabs."
          accent="violet"
          kpis={[
            { label: 'Free guides', value: String(freeGuides.length), accent: 'emerald' },
            ...(showPublicVideos
              ? [{ label: 'Videos', value: String(resourceVideos.length + TOUR_MANIFEST.length), accent: 'sky' as const }]
              : []),
            { label: 'Monitoring', value: String(CREDIT_MONITORING_PARTNERS.length), hint: 'Partners', accent: 'violet' },
            { label: 'References', value: String(quickRefs.length), accent: 'fuchsia' },
          ]}
          tabs={[
            { id: 'guides', label: 'Guides & playbooks' },
            { id: 'monitoring', label: 'Credit monitoring' },
            { id: 'references', label: 'Quick references' },
            ...(showPublicVideos ? [{ id: 'videos', label: 'Video library' }] : []),
          ]}
          activeTab={activeSection}
          onTabChange={(id) => jumpToSection(id as ResourcesSection)}
          primaryAction={{ label: 'Fundability hub', onClick: () => navigate('/fundability-readiness') }}
          secondaryAction={{ label: 'Free dispute guide', onClick: () => navigate('/free-guide') }}
          detailSlot={
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Educational only — not legal advice. Prefer HTML bureau exports for best parse quality in the portal.
            </p>
          }
        >
        <div className={`${FINELY_OS_TOOLBAR} flex-wrap justify-between mb-4`}>
          <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>Execution-ready resources for restore, business build, and funding prep.</div>
          {isAdmin ? (
            <button type="button" onClick={() => navigate('/admin/resources')} className={FINELY_OS_SECONDARY_BTN}>
              Admin editor <ArrowRight size={14} />
            </button>
          ) : null}
        </div>

        <section id="guides" className="fc-scroll-section space-y-6">
        <h2 className="fc-launch-lane-header">Guides &amp; playbooks</h2>
        {blogFrom ? (
          <div className={`${FINELY_OS_NOTICE_WARN} flex flex-wrap items-center justify-between gap-3`}>
            <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
              {blogGuide
                ? <>Moved from blog — showing <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{blogGuide.title}</span>.</>
                : <>This page moved from our blog — browse free guides below{blogSlug ? ` (legacy slug: ${blogSlug})` : ''}.</>}
            </div>
            <button type="button" onClick={() => navigate('/resources')} className={FINELY_OS_SECONDARY_BTN}>
              Clear blog link
            </button>
          </div>
        ) : null}
        <div className={`${finelyOsLeadMagnetPanel('emerald')} p-6 sm:p-8`} data-fc-accent="emerald">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-600/25 bg-emerald-500/15 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-[10px] uppercase tracking-widest text-emerald-800 font-black">Free guide</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                Credit Dispute Letter Guide — <span className="text-emerald-700">5-step playbook</span>
              </h2>
              <p className="mt-3 text-sm sm:text-base max-w-xl opacity-80">
                Glow-up funnel with instant PDF, referral tracking, and a path into your secure Finely dashboard.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/free-guide' + (searchParams.toString() ? `?${searchParams.toString()}` : ''))}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black uppercase tracking-widest text-[10px] sm:text-xs hover:brightness-110 shrink-0 shadow-lg shadow-amber-500/25"
            >
              Claim free guide <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {auth.user ? <CommsWorkspaceActions calendarLabel="Schedule strategy call" /> : null}

        <div className={`space-y-4 ${finelyOsCatalogCard('fuchsia')} !p-6`} data-fc-accent="fuchsia">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl border border-fuchsia-500/35 bg-fuchsia-500/15 flex items-center justify-center">
              <Landmark size={18} className="text-fuchsia-300" />
            </div>
            <div>
              <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>Premium</span>
              <div className={`text-xs font-semibold uppercase tracking-wider ${FINELY_OS_ENTITY_BODY}`}>Playbooks & bookstore</div>
            </div>
          </div>
          <div className={`space-y-3 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 text-[9px] font-black uppercase tracking-widest text-fuchsia-200">
              Paid ebooks · {bookstoreFeatured.length}+ titles
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm leading-relaxed`}>
              Deep operator playbooks — Metro2 forensics, e-OSCAR protocols, business bureau gaps, and funding sequences. Read + listen in My Library.
            </p>
            <FinelyOsPaginatedStack
              items={bookstoreFeatured}
              pageSize={3}
              itemSpacingClassName="space-y-2"
              emptyMessage="Browse the bookstore for premium playbooks."
              renderItem={(book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => navigate(`/bookstore/${book.slug}`)}
                  className={`${finelyOsInlineListItem()} w-full text-left px-3 py-3`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={`${FINELY_OS_ENTITY_VALUE} text-sm font-semibold truncate`}>{book.title}</div>
                      <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1 line-clamp-2`}>{book.desc}</div>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px] mt-1`}>
                        {splitBookIntoChapters(book.contentMarkdown ?? '', book.slug).length} chapters · {book.sub}
                      </div>
                    </div>
                    <div className="shrink-0 text-amber-700 font-bold text-sm">{formatPrice(book.priceAmount)}</div>
                  </div>
                </button>
              )}
            />
          </div>
          <button
            onClick={() => navigate('/bookstore')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all w-full justify-center"
          >
            Open bookstore <ArrowRight size={14} />
          </button>
        </div>

        <div className={`space-y-4 ${finelyOsCatalogCard('emerald')} !p-6`} data-fc-accent="emerald">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl border border-emerald-500/35 bg-emerald-500/15 flex items-center justify-center">
              <BookOpen size={18} className="text-emerald-300" />
            </div>
            <div>
              <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Free PDF guides</span>
              <div className={`text-xs font-semibold uppercase tracking-wider ${FINELY_OS_ENTITY_BODY}`}>Field guides</div>
            </div>
          </div>
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm max-w-3xl`}>
            High-signal field guides designed for clean execution. Request access and you’ll also receive a complimentary 60‑minute strategy call to
            map your next moves.
          </p>
          <FinelyOsPaginatedStack
              items={freeGuides}
              pageSize={9}
              itemSpacingClassName="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              renderItem={(x, idx) => (
              <div
                key={x.id}
                id={`guide-card-${x.id}`}
                className={`space-y-3 ${finelyOsCatalogCard((['emerald', 'sky', 'violet'] as const)[idx % 3])} !p-5 hover:border-emerald-400/40 transition-all ${blogGuide?.id === x.id ? 'ring-2 ring-amber-400/60' : ''}`}
                data-fc-accent={(['emerald', 'sky', 'violet'] as const)[idx % 3]}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] px-2 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 uppercase tracking-widest font-bold">
                    PDF guide
                  </span>
                  <FileText size={16} className="text-emerald-300" />
                </div>
                <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{x.title}</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-sm leading-relaxed`}>{x.desc}</div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewGuideId(previewGuideId === x.id ? null : x.id)}
                    className={`w-full justify-center ${FINELY_OS_SECONDARY_BTN}`}
                  >
                    <Headphones size={14} /> {previewGuideId === x.id ? 'Hide audio' : 'Preview audio'}
                  </button>
                  <button
                    onClick={() => openLead(x.title)}
                    className={`${FINELY_OS_SUCCESS_BTN} w-full justify-center`}
                    title="Unlock via quick form"
                    type="button"
                  >
                    Request guide + session <ArrowRight size={14} />
                  </button>
                </div>
                {previewGuideId === x.id && previewNarration ? (
                  <GuideAudioPlayer narration={previewNarration} autoPlayPreview />
                ) : null}
              </div>
              )}
            />
        </div>
        </section>

        <section id="monitoring" className="fc-scroll-section space-y-6">
        <h2 className="fc-launch-lane-header">Credit monitoring</h2>
        <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-6`} data-fc-accent="violet">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>
                <ShieldCheck size={18} />
                <span>Credit monitoring tools</span>
              </div>
              <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm max-w-3xl`}>
                Prefer an <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>HTML export</span> for best parse quality in the portal.
              </p>
            </div>
          </div>
          <CreditMonitoringPartnerGrid variant="resources" />
        </div>
        </section>

        <section id="references" className="fc-scroll-section space-y-6">
        <h2 className="fc-launch-lane-header">Quick references</h2>
        <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-6`} data-fc-accent="violet">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl border border-violet-500/30 bg-violet-500/15 flex items-center justify-center">
              <GitBranch size={18} className="text-violet-700" />
            </div>
            <div>
              <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>Reference cards</span>
              <div className={`text-xs font-semibold uppercase tracking-wider ${FINELY_OS_ENTITY_BODY}`}>Quick references</div>
            </div>
          </div>
          <FinelyOsPaginatedStack
            items={[...quickRefs]}
            pageSize={6}
            itemSpacingClassName="grid md:grid-cols-2 gap-4"
            renderItem={(x, idx) => {
              const Icon = x.icon;
              const accent = (['emerald', 'amber', 'sky', 'violet'] as const)[idx % 4];
              return (
                <div key={x.title} className={`${finelyOsCatalogCard(accent)} !p-5 transition-all`} data-fc-accent={accent}>
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${x.iconTone}`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-[9px] px-2 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-800 uppercase tracking-widest font-bold">
                      {x.badge}
                    </span>
                  </div>
                  <div className={`mt-4 ${FINELY_OS_ENTITY_VALUE} font-semibold`}>{x.title}</div>
                  <div className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm leading-relaxed`}>{x.desc}</div>
                </div>
              );
            }}
          />
        </div>
        </section>

        {showPublicVideos ? (
        <section id="videos" className="fc-scroll-section space-y-6">
        <h2 className="fc-launch-lane-header">Video library</h2>
          <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-6`} data-fc-accent="violet">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl border border-violet-500/30 bg-violet-500/15 flex items-center justify-center">
                <Film size={18} className="text-violet-700" />
              </div>
              <div>
                <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>Step-by-step tours</span>
                <div className={`text-xs font-semibold uppercase tracking-wider ${FINELY_OS_ENTITY_BODY}`}>Watch how — plain English</div>
              </div>
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm max-w-3xl`}>
              Slow walkthrough videos for every major screen. No account needed — tap Watch on any tour below.
            </p>
            <FinelyOsPaginatedStack
              items={TOUR_MANIFEST}
              pageSize={6}
              itemSpacingClassName="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              renderItem={(tour, idx) => (
                <div
                  key={tour.id}
                  className={`overflow-hidden ${finelyOsCatalogCard((['violet', 'sky', 'emerald'] as const)[idx % 3])} !p-0`}
                  data-fc-accent={(['violet', 'sky', 'emerald'] as const)[idx % 3]}
                >
                  <div className="aspect-video bg-black/20 border-b border-white/[0.08]">
                    <img
                      src={getTourPosterPublicUrl(tour.id)}
                      alt=""
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{tour.title}</div>
                    <TourVideoStatusBadge tourId={tour.id} />
                    <button
                      type="button"
                      onClick={() => setPreviewTourId(tour.id)}
                      className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center`}
                    >
                      Watch tour <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            />
          </div>

          {resourceVideos.length ? (
          <div className={`space-y-4 ${finelyOsCatalogCard('sky')} !p-6`} data-fc-accent="sky">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl border border-sky-500/30 bg-sky-500/15 flex items-center justify-center">
                <Film size={18} className="text-sky-700" />
              </div>
              <div>
                <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-700`}>Video library</span>
                <div className={`text-xs font-semibold uppercase tracking-wider ${FINELY_OS_ENTITY_BODY}`}>Watch & learn</div>
              </div>
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm max-w-3xl`}>
              Short, high-signal video lessons from the Finely Cred library — each with a preview thumbnail.
            </p>
            <FinelyOsPaginatedStack
              items={resourceVideos}
              pageSize={6}
              itemSpacingClassName="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              renderItem={(v, idx) => (
                <div
                  key={v.id}
                  className={`overflow-hidden group ${finelyOsCatalogCard((['sky', 'emerald', 'violet'] as const)[idx % 3])} hover:border-sky-300/70 !p-0`}
                  data-fc-accent={(['sky', 'emerald', 'violet'] as const)[idx % 3]}
                >
                  <ResourceVideoThumb video={v} onClick={() => void openVideo(v.id)} />
                  <div className="p-4 space-y-3">
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold group-hover:text-sky-700 transition-colors`}>{v.title}</div>
                    {v.desc ? <div className={`${FINELY_OS_ENTITY_BODY} text-sm line-clamp-3`}>{v.desc}</div> : null}
                    <button
                      onClick={() => void openVideo(v.id)}
                      className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center !from-sky-600 !to-cyan-600`}
                      type="button"
                    >
                      Watch video <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
          ) : (
          <div className={`${FINELY_OS_LUXURY_EMPTY} ${finelyOsCatalogCard('sky')} !p-6`} data-fc-accent="sky">
            No extra uploaded videos yet — the tour library above covers every major workflow.
          </div>
          )}
        </section>
        ) : isAdmin ? (
          <div className={`${finelyOsCatalogCard('sky')} !p-6`} data-fc-accent="sky">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-700`}>Video demos — admin only</div>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
              Walkthrough and promo videos are hidden from the public site until they are polished. Preview and record drafts in Tour Studio.
            </p>
            <button type="button" className={`${FINELY_OS_PRIMARY_BTN} mt-4`} onClick={() => navigate('/admin/tour-studio')}>
              Open Tour Studio <ArrowRight size={14} />
            </button>
          </div>
        ) : null}

        </FinelyUnifiedHubLayout>

        <div className={`space-y-3 ${finelyOsCatalogCard('violet')} !p-6`} data-fc-accent="violet">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl border border-violet-500/30 bg-violet-500/15 flex items-center justify-center">
              <Shield size={18} className="text-violet-700" />
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${FINELY_OS_ENTITY_SUBLABEL}`}>Legal / compliance</span>
          </div>
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
            This library is educational. Dispute workflows and letter generation features are tools to organize information and execution —
            not legal advice.
          </p>
          <div className={`text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>We continuously harden privacy, audit depth, and access control across the platform.</div>
        </div>

        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>Results vary · not legal advice · educational dispute workflow only.</p>

        <MarketingStaffChatStrip
          roleId="nurture_concierge"
          goal="personal"
          roleLabel="welcome concierge"
          subline="Need help picking a guide or booking your free strategy call after a download?"
        />

        <FinelyOsPageFooter />
      </div>

      {/* Lead capture modal */}
      {leadOpen && (
        <div className="fixed inset-0 z-[300]">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={closeLead} />
          <div className="absolute inset-x-0 top-10 px-4">
            <div className={`mx-auto max-w-xl shadow-2xl overflow-hidden ${finelyOsCatalogCard('violet')} !p-5`}>
              <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300 font-bold`}>Free guide + 60‑minute strategy call</div>
                  <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE} font-semibold text-lg`}>Request your guide and schedule your strategy call</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                    {leadInterest ? (
                      <>Requested guide: <span className={`${FINELY_OS_ENTITY_VALUE} font-medium`}>{leadInterest}</span></>
                    ) : (
                      <>Guide request</>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeLead}
                  className={FINELY_OS_SECONDARY_BTN}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                {submittedId ? (
                  <div className="space-y-4">
                    <div className={FINELY_OS_NOTICE_SUCCESS}>
                      <div className="inline-flex items-center gap-2 text-emerald-300">
                        <CheckCircle2 size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Request received</span>
                      </div>
                      <p className={`mt-2 ${FINELY_OS_ENTITY_VALUE} font-semibold`}>You’re in. We’ll contact you to schedule your 60‑minute strategy call.</p>
                      <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                        Reference ID: <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>{submittedId}</span>
                      </p>
                      {remoteStatus === 'ok' && (
                        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-emerald-300`}>
                          Saved to our system. You’ll receive scheduling outreach shortly.
                        </p>
                      )}
                      {remoteStatus === 'not_configured' && (
                        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                          Saved locally in this browser. To enable live capture in your backend, connect Supabase.
                        </p>
                      )}
                      {remoteStatus === 'failed' && (
                        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                          Saved locally, but couldn’t reach Supabase right now. {remoteError ? `(${remoteError})` : ''}
                        </p>
                      )}
                      <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                        Next: watch your inbox and phone. If you want to reach us immediately, email <span className={`${FINELY_OS_ENTITY_VALUE} font-medium`}>info@finelycred.com</span>.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const guide = findFreeGuideByTitleEffective(leadInterest) ?? freeGuides[0]!;
                          void downloadFreeGuidePdf({ guide, leadId: submittedId, fullName: fullName.trim() || undefined });
                        }}
                        className={FINELY_OS_SECONDARY_BTN}
                        title="Download the guide PDF now"
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
                      <button
                        type="button"
                        onClick={() => navigate('/contact')}
                        className={FINELY_OS_SECONDARY_BTN}
                        title="Contact our team to schedule or ask questions"
                      >
                        Contact our team <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
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
                        <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal font-normal`}>
                          We’ll use this to schedule your 60‑minute strategy call.
                        </div>
                      </div>
                    </div>

                    <label className={`flex items-start gap-3 cursor-pointer ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
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

                    {submitErr && <div className={FINELY_OS_NOTICE_ERROR}>{submitErr}</div>}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
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

                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal font-normal`}>
                      This is saved locally (offline-safe). If Supabase is connected, it’s also sent to `lead_captures` for real-time capture.
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video modal */}
      {videoPreview && (
        <div className="fixed inset-0 z-[310]">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={closeVideo} />
          <div className="absolute inset-x-0 top-10 px-4">
            <div className={`mx-auto max-w-3xl shadow-2xl overflow-hidden ${finelyOsCatalogCard('violet')} !p-5`}>
              <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-300 font-bold`}>Video</div>
                  <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE} font-semibold text-lg truncate`}>{videoPreview.title}</div>
                </div>
                <button type="button" onClick={closeVideo} className={FINELY_OS_SECONDARY_BTN} title="Close">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <video src={videoPreview.url} controls className="w-full rounded-2xl border border-violet-100/80 bg-slate-900" />
              </div>
            </div>
          </div>
        </div>
      )}
      {showPublicVideos ? (
      <FinelyTourPlayer tour={previewTour} open={Boolean(previewTour)} onClose={() => setPreviewTourId(null)} />
      ) : null}
    </PageShell>
  );
}
