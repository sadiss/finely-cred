import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Trophy, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { TestimonialDossier } from '../components/landing';
import { FlashyIcon } from '../components/ui';
import { getActiveTenantId } from '../tenancy/activeTenant';
import { listPublishedTestimonialsByTenant } from '../data/testimonialsRepo';
import type { TextTestimonial, VideoTestimonial } from '../domain/testimonials';
import { getBlobUrl } from '../storage/getBlobUrl';
import { FinelyOsOverviewStatTile } from '../features/os/FinelyOsOverviewStatTile';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_PAGE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsLeadMagnetPanel,
} from '../features/os/finelyOsLightUi';

function withStart(embedUrl: string, startAtSeconds?: number) {
  const base = (embedUrl || '').trim();
  const s = Math.max(0, Math.round(startAtSeconds || 0));
  if (!base || s <= 0) return base;
  if (base.includes('start=')) return base;
  return base.includes('?') ? `${base}&start=${s}` : `${base}?start=${s}`;
}

export default function TestimonialsPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Partner success stories',
    description: 'Real stories from Finely Cred partners — credit restore, funding readiness, and results-driven workflows.',
    path: '/testimonials',
  });
  const tenantId = getActiveTenantId();
  const published = listPublishedTestimonialsByTenant(tenantId);
  const videos = published.filter((t) => t.kind === 'video') as VideoTestimonial[];
  const [blobVideoUrls, setBlobVideoUrls] = useState<Record<string, { url: string; revoke?: () => void }>>({});
  const playableVideos = useMemo(
    () => videos.filter((v) => Boolean(v.videoSrc || v.embedUrl || (v.blobRef && blobVideoUrls[v.id]?.url))),
    [videos, blobVideoUrls],
  );
  const texts = published.filter((t) => t.kind === 'text') as TextTestimonial[];
  const [tab, setTab] = useState<'videos' | 'stories'>('videos');
  const blobRefs = useMemo(() => videos.filter((v) => Boolean(v.blobRef)).map((v) => ({ id: v.id, blobRef: v.blobRef!, mime: v.blobMimeType })), [videos]);

  useEffect(() => {
    let cancelled = false;
    const ensure = async () => {
      for (const x of blobRefs.slice(0, 40)) {
        if (cancelled) return;
        if (blobVideoUrls[x.id]?.url) continue;
        const res = await getBlobUrl(x.blobRef, { mimeType: x.mime, preferSigned: true, signedTtlSeconds: 60 * 30 });
        if (!res?.url) continue;
        if (cancelled) {
          try { res.revoke?.(); } catch {}
          return;
        }
        setBlobVideoUrls((m) => ({ ...m, [x.id]: { url: res.url, revoke: res.revoke } }));
      }
    };
    void ensure();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobRefs.map((x) => x.blobRef).join('|')]);

  useEffect(() => {
    return () => {
      try {
        Object.values(blobVideoUrls).forEach((x) => x.revoke?.());
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <PageShell
      badge="Public"
      title="Testimonials"
      subtitle="Real stories across Personal Restore, Business Foundation, and Debt & Summons."
    >
      <div className={FINELY_OS_PAGE}>
        <FinelyUnifiedHubLayout
          eyebrow="Social proof"
          title="Partner success stories"
          subtitle="Real stories across Personal Restore, Business Foundation, and Debt & Summons."
          accent="amber"
          kpis={[
            { label: 'Videos', value: String(playableVideos.length), accent: 'amber' },
            { label: 'Written', value: String(texts.length), accent: 'emerald' },
            { label: 'Published', value: String(published.length), accent: 'violet' },
          ]}
          tabs={[
            { id: 'videos', label: 'Video stories' },
            { id: 'stories', label: 'Written wins' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as 'videos' | 'stories')}
          primaryAction={{ label: 'Free guide + session', onClick: () => navigate('/resources') }}
          secondaryAction={{ label: 'Contact team', onClick: () => navigate('/contact') }}
        >
        {tab === 'videos' && (
          <>
          <div className={`space-y-4 ${finelyOsCatalogCard('amber')} !p-6`} data-fc-accent="amber">
            <p className={`text-sm max-w-3xl ${FINELY_OS_ENTITY_BODY}`}>
              Recorded testimonials from partners across Personal Restore, Business Foundation, and Debt & Summons.
            </p>
          </div>
          {playableVideos.length === 0 ? (
            <div className={FINELY_OS_LUXURY_EMPTY}>
              No published video stories with playable media yet. Switch to Written wins.
            </div>
          ) : (
            <FinelyOsPaginatedStack
              items={playableVideos}
              pageSize={6}
              itemSpacingClassName="grid md:grid-cols-3 gap-4"
              renderItem={(v, idx) => (
                <div
                  key={v.id}
                  className={`space-y-3 ${finelyOsCatalogCard((['amber', 'emerald', 'violet'] as const)[idx % 3])} !p-5`}
                  data-fc-accent={(['amber', 'emerald', 'violet'] as const)[idx % 3]}
                >
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{v.title}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-700`}>{v.service}</div>
                  <div className="overflow-hidden rounded-xl border border-white/20 !p-0">
                    {v.videoSrc ? (
                      <video className="w-full aspect-video bg-slate-900" controls playsInline preload="metadata" src={v.videoSrc} poster={v.posterSrc} />
                    ) : v.blobRef && blobVideoUrls[v.id]?.url ? (
                      <video className="w-full aspect-video bg-slate-900" controls playsInline preload="metadata" src={blobVideoUrls[v.id]!.url} poster={v.posterSrc} />
                    ) : v.embedUrl ? (
                      <iframe src={withStart(v.embedUrl, v.startAtSeconds)} title={v.title} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    ) : null}
                  </div>
                  {v.caption ? <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{v.caption}</div> : null}
                </div>
              )}
            />
          )}
          </>
        )}

        {tab === 'stories' && (
          texts.length === 0 ? (
            <div className={FINELY_OS_LUXURY_EMPTY}>No published text testimonials yet.</div>
          ) : (
            <FinelyOsPaginatedStack
              items={texts}
              pageSize={9}
              itemSpacingClassName="grid md:grid-cols-3 gap-6"
              renderItem={(t) => (
                <TestimonialDossier
                  key={t.id}
                  id={t.id}
                  service={t.service}
                  name={t.name}
                  review={t.review}
                  milestone={t.milestone ?? 'Partner win'}
                  amount={t.amount ?? ''}
                />
              )}
            />
          )
        )}
        </FinelyUnifiedHubLayout>

        <div className={`${finelyOsLeadMagnetPanel('amber')} !p-6`} data-fc-accent="amber">
          <div className="inline-flex items-center gap-2 text-amber-700">
            <FlashyIcon icon={Trophy} color="amber" size="xs" className="!w-9 !h-9 !rounded-xl" />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Want to share yours?</span>
          </div>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            If you want to record a video testimonial, message us and we’ll send a simple prompt + upload instructions.
          </p>
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className={`mt-4 ${FINELY_OS_SECONDARY_BTN}`}
            title="Contact our team"
          >
            Contact our team <ArrowRight size={14} />
          </button>
        </div>

        <MarketingStaffChatStrip
          roleId="finely_advisor"
          goal="personal"
          roleLabel="credit specialist"
          subline="Wondering if Finely Cred is right for your file? Chat before you commit."
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
