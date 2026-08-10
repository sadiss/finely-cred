import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { useAuth } from '../auth/AuthProvider';
import { isAdminEmail } from '../auth/admin';
import { listPublicResourceVideos } from '../data/resourceVideosRepo';
import { getBlobUrl } from '../storage/getBlobUrl';
import { ResourceVideoThumb } from '../components/resources/ResourceVideoThumb';
import { PUBLIC_DEMO_VIDEOS_ENABLED } from '../config/publicMediaPolicy';
import { TOUR_MANIFEST } from '../config/tourManifest';
import { listPartnerLessonVideos } from '../lib/publicResourceVideoLibrary';
import { getTourPosterPublicUrl } from '../domain/tourPlayback';
import { FinelyTourPlayer } from '../components/tours/FinelyTourPlayer';
import { TourVideoStatusBadge } from '../components/tours/TourVideoStatusBadge';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { PublicLaneTitle } from '../components/public/PublicLaneTitle';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

export default function ResourcesVideosPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const isAdmin = isAdminEmail(auth.user?.email);
  const [storeVersion, setStoreVersion] = useState(0);
  const [videoPreview, setVideoPreview] = useState<null | { title: string; url: string; revoke?: () => void }>(null);
  const [previewTourId, setPreviewTourId] = useState<string | null>(null);

  usePublicSeoMeta({
    title: 'Video library',
    description: 'Finely Cred watch-how tours and resource videos for credit restore and funding workflows.',
    path: '/resources/videos',
  });

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const resourceVideos = useMemo(() => listPublicResourceVideos(), [storeVersion]);
  const partnerLessons = useMemo(() => listPartnerLessonVideos(resourceVideos, TOUR_MANIFEST), [resourceVideos]);
  const showPublicVideos = PUBLIC_DEMO_VIDEOS_ENABLED;
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

  return (
    <PageShell
      badge="Public"
      title="Video library"
      subtitle="Watch-how tours and partner lessons — two lanes, no duplicate walkthroughs."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        <PublicLaneTitle
          lane="resources"
          eyebrow="Video library"
          text="Factory tours and partner lessons."
          highlight="partner lessons."
        />
        <FinelyUnifiedHubLayout
          eyebrow="Video library"
          title="Watch-how tours & partner lessons"
          subtitle="Tours come from the factory manifest. Partner lessons are studio uploads — we hide any upload that mirrors a tour so you only see it once."
          accent="fuchsia"
          kpis={[
            { label: 'Watch-how tours', value: String(TOUR_MANIFEST.length), accent: 'violet' },
            { label: 'Partner lessons', value: String(partnerLessons.length), accent: 'sky' },
          ]}
          primaryAction={{ label: 'Free guides', onClick: () => navigate('/resources/guides') }}
          secondaryAction={{ label: 'Resource hub', onClick: () => navigate('/resources') }}
        >
          {showPublicVideos ? (
            <div className="space-y-8">
              <section id="watch-how-tours" className="fc-scroll-section space-y-3">
                <h2 className="fc-launch-lane-header">Watch-how tours</h2>
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Factory watch-how tours — short MP4 walkthroughs for portal and public hubs. No account needed.
                </p>
                <div className={`space-y-3 ${finelyOsCatalogCard('violet')} !p-4`} data-fc-accent="violet">
                  <FinelyOsPaginatedStack
                    items={TOUR_MANIFEST}
                    pageSize={6}
                    itemSpacingClassName="grid md:grid-cols-2 lg:grid-cols-3 gap-3"
                    renderItem={(tour, idx) => (
                      <div
                        key={tour.id}
                        className={`overflow-hidden ${finelyOsCatalogCard((['violet', 'sky', 'emerald'] as const)[idx % 3])} !p-0`}
                        data-fc-accent={(['violet', 'sky', 'emerald'] as const)[idx % 3]}
                      >
                        <div className="aspect-video border-b border-white/[0.08] bg-black/20">
                          <img
                            src={getTourPosterPublicUrl(tour.id)}
                            alt=""
                            className="h-full w-full object-cover object-top"
                            loading="lazy"
                          />
                        </div>
                        <div className="space-y-3 p-4">
                          <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{tour.title}</div>
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
              </section>

              <section id="partner-lessons" className="fc-scroll-section space-y-3">
                <h2 className="fc-launch-lane-header">Partner lessons</h2>
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Studio uploads and education clips — not duplicated in the tour lane above.
                </p>
                {partnerLessons.length ? (
                  <div className={`space-y-3 ${finelyOsCatalogCard('sky')} !p-4`} data-fc-accent="sky">
                    <FinelyOsPaginatedStack
                      items={partnerLessons}
                      pageSize={6}
                      itemSpacingClassName="grid md:grid-cols-2 lg:grid-cols-3 gap-3"
                      renderItem={(v, idx) => (
                        <div
                          key={v.id}
                          className={`group overflow-hidden ${finelyOsCatalogCard((['sky', 'emerald', 'violet'] as const)[idx % 3])} !p-0`}
                          data-fc-accent={(['sky', 'emerald', 'violet'] as const)[idx % 3]}
                        >
                          <ResourceVideoThumb video={v} onClick={() => void openVideo(v.id)} />
                          <div className="space-y-3 p-4">
                            <div className={`font-semibold transition-colors group-hover:text-sky-700 ${FINELY_OS_ENTITY_VALUE}`}>
                              {v.title}
                            </div>
                            {v.desc ? <div className={`line-clamp-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>{v.desc}</div> : null}
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => void openVideo(v.id)}
                                className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center !from-sky-600 !to-cyan-600`}
                              >
                                Watch lesson <ArrowRight size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate('/enlightenment-session')}
                                className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`}
                              >
                                Book a strategy call
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                ) : (
                  <div className={`${FINELY_OS_LUXURY_EMPTY} ${finelyOsCatalogCard('sky')} !p-4`} data-fc-accent="sky">
                    No partner lessons published yet — use the watch-how tours above for every major workflow.
                  </div>
                )}
              </section>

              <div className={`flex flex-wrap gap-3 ${finelyOsCatalogCard('amber')} !p-4`} data-fc-accent="amber">
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources/guides')}>
                  All free guides
                </button>
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/enlightenment-session')}>
                  Book a strategy call <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : isAdmin ? (
            <div className={`${finelyOsCatalogCard('sky')} !p-5`} data-fc-accent="sky">
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-700`}>Video demos — admin only</div>
              <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Walkthrough and promo videos are hidden from the public site until they are polished. Preview drafts in Tour Studio.
              </p>
              <button type="button" className={`${FINELY_OS_PRIMARY_BTN} mt-4`} onClick={() => navigate('/admin/tour-studio')}>
                Open Tour Studio <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className={`${FINELY_OS_LUXURY_EMPTY} ${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
              Public video demos are polishing. Meanwhile, open free guides or Ask Finely for step-by-step help.
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/resources/guides')}>
                  Free guides <ArrowRight size={14} />
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/start-here')}>
                  Start here
                </button>
              </div>
            </div>
          )}

          <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>Results vary · not legal advice · educational only.</p>
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="nurture_concierge"
          goal="personal"
          roleLabel="welcome concierge"
          subline="Want a walkthrough for the screen you are stuck on?"
        />
        <FinelyOsPageFooter />
      </div>

      {videoPreview ? (
        <div className="fixed inset-0 z-[310]">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={closeVideo} />
          <div className="absolute inset-x-0 top-10 px-4">
            <div className={`mx-auto max-w-3xl overflow-hidden shadow-2xl ${finelyOsCatalogCard('violet')} !p-5`}>
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-4">
                <div className="min-w-0">
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-bold text-sky-300`}>Video</div>
                  <div className={`mt-2 truncate text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{videoPreview.title}</div>
                </div>
                <button type="button" onClick={closeVideo} className={FINELY_OS_SECONDARY_BTN} title="Close">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4">
                <video src={videoPreview.url} controls className="w-full rounded-2xl border border-violet-100/80 bg-slate-900" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showPublicVideos && previewTour ? (
        <FinelyTourPlayer tour={previewTour} open={Boolean(previewTour)} onClose={() => setPreviewTourId(null)} />
      ) : null}
    </PageShell>
  );
}
