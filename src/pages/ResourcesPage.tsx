import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Calendar, Film, FileText, Library, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { captureLeadAttributionFromUrl } from '../lib/leadAttribution';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { buildOrganizationSchema, buildWebPageSchema, injectJsonLd } from '../lib/seoSchema';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyNowDoThisStrip } from '../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../components/tours/FinelyNoticedStrip';
import { buildResourcesNoticedItems } from '../lib/finelyProactiveSignals';
import { PublicLaneTitle } from '../components/public/PublicLaneTitle';
import { DedicatedSheetLinkStrip } from '../components/resources/DedicatedSheetLinkStrip';
import { PUBLIC_RESOURCES_HUB_CARDS } from '../config/publicResourcesHub';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsLandingContrastSection,
  finelyOsSolidIconChip,
} from '../features/os/finelyOsLightUi';
import { LandingSellAtmosphere } from '../components/landing/LandingSellAtmosphere';
import { TOUR_MANIFEST } from '../config/tourManifest';
import { FinelyTourPlayer } from '../components/tours/FinelyTourPlayer';
import type { SiteTourDefinition } from '../domain/siteTourVideos';
import { PUBLIC_DEMO_VIDEOS_ENABLED } from '../config/publicMediaPolicy';
import { LaunchPresenterDemoSection } from '../components/resources/LaunchPresenterDemoSection';

const CARD_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  guides: BookOpen,
  onesheets: FileText,
  bookstore: Library,
  monitoring: ShieldCheck,
  videos: Film,
  references: Sparkles,
  stories: Trophy,
  events: Calendar,
};

const HASH_REDIRECTS: Record<string, string> = {
  guides: '/resources/guides',
  monitoring: '/resources/credit-monitoring',
  references: '/resources/references',
  videos: '/resources/videos',
};

export default function ResourcesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [previewTour, setPreviewTour] = useState<SiteTourDefinition | null>(null);

  const hubCards = useMemo(
    () =>
      PUBLIC_DEMO_VIDEOS_ENABLED
        ? PUBLIC_RESOURCES_HUB_CARDS
        : PUBLIC_RESOURCES_HUB_CARDS.filter((c) => c.id !== 'videos'),
    [],
  );

  usePublicSeoMeta({
    title: 'Resources & tools',
    description: 'Free guides, one-sheets, bookstore titles, and monitoring partners — the Finely Cred library for restore and funding work.',
    path: '/resources',
  });

  const redirectTo = useMemo(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (hash && HASH_REDIRECTS[hash]) return HASH_REDIRECTS[hash];
    if (searchParams.get('from') === 'blog' || searchParams.get('guide')) {
      const qs = searchParams.toString();
      return `/resources/guides${qs ? `?${qs}` : ''}`;
    }
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (redirectTo) return;
    captureLeadAttributionFromUrl(window.location.search, window.location.pathname);
    const origin = window.location.origin;
    injectJsonLd('finely-org-schema', buildOrganizationSchema(origin));
    injectJsonLd(
      'finely-resources-schema',
      buildWebPageSchema({
        origin,
        path: '/resources',
        name: 'Resources & Tools — Finely Cred',
        description: 'Free guides, one-sheets, and education for credit restore and business funding.',
      }),
    );
  }, [redirectTo]);

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <PageShell
      badge="Public"
      title="Resource hub"
      subtitle="Free guides, monitoring partners, and partner education — pick a library or book a session."
      hideHero
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple space-y-0`}>
        <div className="space-y-4 pb-4">
          <FinelyNoticedStrip items={buildResourcesNoticedItems({ section: 'guides' })} />
          <FinelyNowDoThisStrip currentIndex={0} />
        </div>

        <section
          className={`fc-sell relative overflow-hidden -mx-4 px-4 py-12 sm:-mx-6 sm:px-6 sm:py-14 lg:-mx-8 lg:px-8 2xl:-mx-10 2xl:px-10 ${finelyOsLandingContrastSection('fc-band-violet')}`}
          data-fc-contrast-band="1"
        >
          <LandingSellAtmosphere tone="platinum" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end">
            <PublicLaneTitle
              lane="resources"
              eyebrow="Resource hub"
              text="Guides, sheets, and partner tools."
              highlight="partner tools."
              speedMs={36}
              subtitle={
                <p className="fc-light-contrast-body max-w-2xl text-base sm:text-lg">
                  Start with a free guide if you are new. Open a one-sheet, the bookstore, or monitoring when you already know the work.
                </p>
              }
            />
            <div className="grid gap-3 sm:grid-cols-3 content-start">
              {[
                { value: String(hubCards.length), label: 'Libraries', accent: 'emerald' as const },
                { value: 'Free', label: 'Guide library', accent: 'violet' as const },
                { value: 'Open', label: 'Read without signup', accent: 'sky' as const },
              ].map((kpi) => (
                <div key={kpi.label} className={`${finelyOsCatalogCard(kpi.accent)} !p-5 text-center sm:text-left`} data-fc-accent={kpi.accent}>
                  <div className={`text-2xl sm:text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{kpi.value}</div>
                  <div className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{kpi.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-6 py-8">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Resource library</div>
            <h2 className={`mt-1 text-2xl sm:text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
              Choose a library
            </h2>
            <p className={`mt-2 max-w-2xl text-base ${FINELY_OS_ENTITY_BODY}`}>
              Guides, one-sheets, the bookstore, monitoring, videos, stories, and events each open their own page.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            {hubCards.map((card) => {
              const Icon = CARD_ICONS[card.id] ?? BookOpen;
              const isFeatured = card.id === 'guides';
              const spanClass = isFeatured ? 'lg:col-span-6' : 'lg:col-span-3';
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => navigate(card.path)}
                  className={`${finelyOsCatalogCard(card.accent)} ${spanClass} text-left transition-all hover:brightness-110 ${
                    isFeatured ? '!p-6 lg:!p-8' : '!p-5'
                  }`}
                  data-fc-accent={card.accent}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={finelyOsSolidIconChip(card.accent, isFeatured ? 'lg' : 'md')}>
                      <Icon size={isFeatured ? 22 : 18} />
                    </div>
                    {card.badge ? <span className={FINELY_OS_ENTITY_SUBLABEL}>{card.badge}</span> : null}
                  </div>
                  <div className={`mt-4 font-extrabold ${isFeatured ? 'text-xl' : 'text-base'} ${FINELY_OS_ENTITY_VALUE}`}>
                    {card.title}
                  </div>
                  <p className={`mt-2 leading-relaxed ${isFeatured ? 'text-base' : 'text-sm'} ${FINELY_OS_ENTITY_BODY}`}>
                    {card.desc}
                  </p>
                  <span className={`${FINELY_OS_SECONDARY_BTN} mt-4 inline-flex !px-4 !py-2.5 !text-sm`}>
                    Open <ArrowRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`flex flex-wrap items-center gap-4 ${finelyOsCatalogCard('sky')}`} data-fc-accent="sky">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/resources/guides')}>
              All free guides <ArrowRight size={14} />
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/free-guide')}>
              Dispute letter guide
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/start-here')}>
              Start here
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/enlightenment-session')}>
              Book a session
            </button>
          </div>

          <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>
            Results vary · not legal advice · funding subject to underwriting
          </p>
        </div>

        <DedicatedSheetLinkStrip className="mb-4" />

        <div className="space-y-8 pb-6">
          <section id="guides" className={`${finelyOsCatalogCard('emerald')} fc-scroll-section space-y-3`} data-fc-accent="emerald">
            <h2 className={`fc-launch-lane-header text-xl sm:text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Free guides, credit monitoring, and one-sheets</h2>
            <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
              Start with a free guide if you are new. Need a person? Book a session when you are ready.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources/guides')}>
                Open guides <ArrowRight size={14} />
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/enlightenment-session')}>
                Book a session
              </button>
            </div>
          </section>

          <section id="monitoring" className={`${finelyOsCatalogCard('sky')} fc-scroll-section space-y-3`} data-fc-accent="sky">
            <h2 className={`text-xl sm:text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Credit monitoring partners</h2>
            <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
              Compare monitoring partners and pick the lane that fits your restore plan.
            </p>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources/credit-monitoring')}>
              Monitoring partners <ArrowRight size={14} />
            </button>
          </section>

          <section id="references" className={`${finelyOsCatalogCard('violet')} fc-scroll-section space-y-3`} data-fc-accent="violet">
            <h2 className={`text-xl sm:text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>References &amp; bookstore</h2>
            <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
              Statutes, templates, and bookstore titles — educational only, not legal advice.
            </p>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources/references')}>
              Open references <ArrowRight size={14} />
            </button>
          </section>

          <LaunchPresenterDemoSection showAdminTools={false} />

          {PUBLIC_DEMO_VIDEOS_ENABLED ? (
          <section id="videos" className={`${finelyOsCatalogCard('rose')} fc-scroll-section space-y-3`} data-fc-accent="rose">
            <h2 className={`text-xl sm:text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Short walkthroughs</h2>
            <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
              Short videos that show how the public and portal screens work.
            </p>
            <div className="flex flex-wrap gap-2">
              {TOUR_MANIFEST.slice(0, 4).map((tour) => (
                <button
                  key={tour.id}
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => setPreviewTour(tour)}
                >
                  {tour.title}
                </button>
              ))}
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources/videos')}>
                Full video library <ArrowRight size={14} />
              </button>
            </div>
          </section>
          ) : null}
        </div>

        {PUBLIC_DEMO_VIDEOS_ENABLED ? (
        <FinelyTourPlayer tour={previewTour} open={Boolean(previewTour)} onClose={() => setPreviewTour(null)} allowVoice />
        ) : null}

        <MarketingStaffChatStrip
          roleId="nurture_concierge"
          goal="personal"
          roleLabel="welcome concierge"
          subline="Need help choosing a guide, a one-sheet, or a bookstore title?"
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
