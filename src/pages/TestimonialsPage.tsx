import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, PlayCircle, Trophy, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { TestimonialDossier } from '../components/landing';
import { getActiveTenantId } from '../tenancy/activeTenant';
import { listPublishedTestimonialsByTenant } from '../data/testimonialsRepo';
import type { TextTestimonial, VideoTestimonial } from '../domain/testimonials';
import { getBlobUrl } from '../storage/getBlobUrl';

function withStart(embedUrl: string, startAtSeconds?: number) {
  const base = (embedUrl || '').trim();
  const s = Math.max(0, Math.round(startAtSeconds || 0));
  if (!base || s <= 0) return base;
  if (base.includes('start=')) return base;
  return base.includes('?') ? `${base}&start=${s}` : `${base}?start=${s}`;
}

export default function TestimonialsPage() {
  const navigate = useNavigate();
  const tenantId = getActiveTenantId();
  const published = listPublishedTestimonialsByTenant(tenantId);
  const videos = published.filter((t) => t.kind === 'video') as VideoTestimonial[];
  const texts = published.filter((t) => t.kind === 'text') as TextTestimonial[];

  const [blobVideoUrls, setBlobVideoUrls] = useState<Record<string, { url: string; revoke?: () => void }>>({});
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
      <div className="space-y-10">
        {/* Video section */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-amber-500/10 backdrop-blur-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Video size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Video stories</span>
              </div>
              <p className="mt-2 text-white/60 text-sm max-w-3xl">
                This section is ready for your recorded testimonials. Drop in YouTube/Vimeo embed URLs and these cards will render as video players.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/resources')}
              className="hidden sm:inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              title="Get a free guide + enlightenment session"
            >
              Get free guide + session <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {videos.length === 0 ? (
              <div className="md:col-span-3 rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">
                No published video testimonials yet. (Admins can add them in <span className="font-mono">/admin/testimonials</span>.)
              </div>
            ) : (
              videos.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 hover:bg-white/[0.09] transition-colors"
              >
                <div className="text-white font-semibold">{v.title}</div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">{v.service}</div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                  {v.videoSrc ? (
                    <video
                      className="w-full aspect-video bg-black"
                      controls
                      playsInline
                      preload="metadata"
                      src={v.videoSrc}
                      poster={v.posterSrc}
                    />
                  ) : v.blobRef && blobVideoUrls[v.id]?.url ? (
                    <video
                      className="w-full aspect-video bg-black"
                      controls
                      playsInline
                      preload="metadata"
                      src={blobVideoUrls[v.id]!.url}
                      poster={v.posterSrc}
                    />
                  ) : v.embedUrl ? (
                    <iframe
                      src={withStart(v.embedUrl, v.startAtSeconds)}
                      title={v.title}
                      className="w-full aspect-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="aspect-video flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-black/60 via-black/40 to-black/30">
                      <PlayCircle size={44} className="text-amber-400/90" />
                      <div className="mt-3 text-white/70 text-sm">Video coming soon</div>
                      <div className="mt-1 text-white/40 text-xs">This story is approved, but the video link hasn’t been attached yet.</div>
                    </div>
                  )}
                </div>
                {v.caption ? <div className="mt-3 text-white/60 text-xs">{v.caption}</div> : null}
              </div>
              ))
            )}
          </div>

          <div className="sm:hidden">
            <button
              type="button"
              onClick={() => navigate('/resources')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Get free guide + session <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Testimonial grid */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/5 via-white/[0.03] to-white/[0.05] backdrop-blur-xl p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <Trophy size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Client success stories</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {texts.length === 0 ? (
              <div className="md:col-span-3 rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">
                No published text testimonials yet.
              </div>
            ) : (
              texts.slice(0, 18).map((t) => (
                <TestimonialDossier
                  key={t.id}
                  id={t.id}
                  service={t.service}
                  name={t.name}
                  review={t.review}
                  milestone={t.milestone ?? 'Client win'}
                  amount={t.amount ?? ''}
                />
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <Trophy size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Want to share yours?</span>
          </div>
          <p className="mt-2 text-white/60 text-sm">
            If you want to record a video testimonial, message us and we’ll send a simple prompt + upload instructions.
          </p>
          <button
            type="button"
            onClick={() => navigate('/portal/messages')}
            className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.09] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            title="Message support"
          >
            Message support <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </PageShell>
  );
}

