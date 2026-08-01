import React, { useEffect, useMemo } from 'react';
import { ArrowRight, BookOpen, Calendar, Film, FileText, Library, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { useAuth } from '../auth/AuthProvider';
import { isAdminEmail } from '../auth/admin';
import { captureLeadAttributionFromUrl } from '../lib/leadAttribution';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { buildOrganizationSchema, buildWebPageSchema, injectJsonLd } from '../lib/seoSchema';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../components/tours/FinelyNoticedStrip';
import { buildResourcesNoticedItems } from '../lib/finelyProactiveSignals';
import { PublicLaneTitle } from '../components/public/PublicLaneTitle';
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
} from '../features/os/finelyOsLightUi';
import { LandingSellAtmosphere } from '../components/landing/LandingSellAtmosphere';

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
  const auth = useAuth();
  const isAdmin = isAdminEmail(auth.user?.email);

  usePublicSeoMeta({
    title: 'Resources & tools',
    description: 'Free guides, one-sheets, bookstore, monitoring partners, and partner education — curated Finely Cred resource hub.',
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
        description: 'Free guides, calculators, videos, and education for credit restore and business funding.',
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
      subtitle="Pick a lane — each card opens a dedicated page. No long scroll puzzle."
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
          <PublicLaneTitle
            lane="resources"
            eyebrow="Resource hub"
            text="Guides, packs, and partner tools."
            highlight="partner tools."
            speedMs={36}
            subtitle={
              <p className="fc-light-contrast-body max-w-2xl text-base sm:text-lg">
                Start with free guides if you&apos;re new — jump to one-sheets, bookstore, or monitoring when you know your lane.
              </p>
            }
          />
        </section>

        <div className="space-y-4 py-6">
          <FinelyUnifiedHubLayout
            eyebrow="Resource library"
            title="Pick a dedicated page"
            subtitle="Each card opens its own route — guides, one-sheets, bookstore, monitoring, videos, stories, and events."
            accent="violet"
            kpis={[
              { label: 'Lanes', value: String(PUBLIC_RESOURCES_HUB_CARDS.length), accent: 'violet' },
              { label: 'Start', value: 'Guides', accent: 'emerald' },
            ]}
            primaryAction={{ label: 'All free guides', onClick: () => navigate('/resources/guides') }}
            secondaryAction={{ label: 'Dispute letter guide', onClick: () => navigate('/free-guide') }}
            detailSlot={
              <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Educational only — not legal advice. Prefer HTML bureau exports for best parse quality in the portal.
              </p>
            }
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Curated hub for restore, business build, and funding prep.
              </div>
              {isAdmin ? (
                <button type="button" onClick={() => navigate('/admin/resources')} className={FINELY_OS_SECONDARY_BTN}>
                  Admin editor <ArrowRight size={14} />
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {PUBLIC_RESOURCES_HUB_CARDS.map((card) => {
                const Icon = CARD_ICONS[card.id] ?? BookOpen;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => navigate(card.path)}
                    className={`${finelyOsCatalogCard(card.accent)} !p-4 text-left transition-all hover:brightness-110`}
                    data-fc-accent={card.accent}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-black/25">
                        <Icon size={18} />
                      </div>
                      {card.badge ? <span className={FINELY_OS_ENTITY_SUBLABEL}>{card.badge}</span> : null}
                    </div>
                    <div className={`mt-3 font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{card.title}</div>
                    <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{card.desc}</p>
                    <span className={`${FINELY_OS_PRIMARY_BTN} mt-3 !px-3 !py-2 text-[10px]`}>
                      Open <ArrowRight size={12} />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`mt-4 flex flex-wrap gap-3 ${finelyOsCatalogCard('amber')} !p-4`} data-fc-accent="amber">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/start-here')}>
                Start here <ArrowRight size={14} />
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/fundability-readiness')}>
                Fundability hub
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/enlightenment-session')}>
                Book a session
              </button>
            </div>

            <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>
              Results vary · not legal advice · educational dispute workflow only.
            </p>
          </FinelyUnifiedHubLayout>
        </div>

        <MarketingStaffChatStrip
          roleId="nurture_concierge"
          goal="personal"
          roleLabel="welcome concierge"
          subline="Need help picking a guide, one-sheet, or bookstore title?"
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
