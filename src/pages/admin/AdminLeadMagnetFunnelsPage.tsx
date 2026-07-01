import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText, Film, Save, Sparkles, UploadCloud, Video } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';
import { LEAD_MAGNET_FUNNELS } from '../../domain/leadMagnetFunnels';
import { listAllPersonas } from '../../data/agentPersonasRepo';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import {
  clearFunnelOverride,
  getFunnelOverride,
  loadFunnelOverrides,
  saveFunnelOverride,
} from '../../data/leadMagnetFunnelsRepo';
import { clearFunnelMedia, getFunnelMedia, upsertFunnelMedia } from '../../data/leadMagnetFunnelMediaRepo';
import { listResourceVideos } from '../../data/resourceVideosRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { captureVideoPoster } from '../../utils/captureVideoPoster';
import { LeadMagnetFunnelHeroVideo } from '../../components/leadmagnet/LeadMagnetFunnelHeroVideo';
import { getLeadMagnetVisualTheme, resolveLeadMagnetHeroImage } from '../../components/leadmagnet/leadMagnetVisualThemes';

export default function AdminLeadMagnetFunnelsPage() {
  const [selectedId, setSelectedId] = useState(LEAD_MAGNET_FUNNELS[0]!.id);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const base = LEAD_MAGNET_FUNNELS.find((f) => f.id === selectedId) ?? LEAD_MAGNET_FUNNELS[0]!;
  const override = useMemo(() => getFunnelOverride(base.funnelId) ?? getFunnelOverride(base.id), [selectedId, version]);
  const media = useMemo(() => getFunnelMedia(base.funnelId) ?? getFunnelMedia(base.id), [selectedId, version]);
  const personas = useMemo(() => listAllPersonas(), []);
  const resourceVideos = useMemo(() => listResourceVideos(), [version]);
  const theme = useMemo(() => getLeadMagnetVisualTheme(base), [base]);
  const heroPreview = useMemo(() => resolveLeadMagnetHeroImage(base, theme), [base, theme]);

  const [urgencyText, setUrgencyText] = useState('');
  const [heroHeadline, setHeroHeadline] = useState('');
  const [heroHighlight, setHeroHighlight] = useState('');
  const [heroSub, setHeroSub] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [offer, setOffer] = useState('');
  const [agentPersonaId, setAgentPersonaId] = useState<AgentPersonaId>('finely_advisor');

  const [heroImageOverride, setHeroImageOverride] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [staticVideoSrc, setStaticVideoSrc] = useState('');
  const [resourceVideoId, setResourceVideoId] = useState('');
  const [urgencySlots, setUrgencySlots] = useState('');
  const [countdownEnd, setCountdownEnd] = useState('');
  const [showLivePulse, setShowLivePulse] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPosterFile, setVideoPosterFile] = useState<File | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoErr, setVideoErr] = useState<string | null>(null);

  useEffect(() => {
    setUrgencyText(override?.urgencyText ?? base.urgencyText);
    setHeroHeadline(override?.heroHeadline ?? base.heroHeadline);
    setHeroHighlight(override?.heroHighlight ?? base.heroHighlight);
    setHeroSub(override?.heroSub ?? base.heroSub);
    setMetaTitle(override?.metaTitle ?? base.metaTitle);
    setMetaDesc(override?.metaDesc ?? base.metaDesc);
    setOffer(override?.offer ?? base.offer);
    setAgentPersonaId(override?.agentPersonaId ?? base.agentPersonaId);

    setHeroImageOverride(media?.heroImageOverride ?? '');
    setVideoTitle(media?.videoTitle ?? `Watch the ${theme.badge.toLowerCase()}`);
    setStaticVideoSrc(media?.staticVideoSrc ?? '');
    setResourceVideoId(media?.resourceVideoId ?? '');
    setUrgencySlots(media?.urgencySlotsRemaining != null ? String(media.urgencySlotsRemaining) : '');
    setCountdownEnd(media?.urgencyCountdownEnd ? media.urgencyCountdownEnd.slice(0, 16) : '');
    setShowLivePulse(media?.showLivePulse !== false);
  }, [selectedId, version, base, override, media, theme.badge]);

  const save = () => {
    saveFunnelOverride(base.funnelId, {
      urgencyText,
      heroHeadline,
      heroHighlight,
      heroSub,
      metaTitle,
      metaDesc,
      offer,
      agentPersonaId,
    });
    upsertFunnelMedia(base.funnelId, {
      heroImageOverride: heroImageOverride.trim() || undefined,
      videoTitle: videoTitle.trim() || undefined,
      staticVideoSrc: staticVideoSrc.trim() || undefined,
      resourceVideoId: resourceVideoId.trim() || undefined,
      urgencySlotsRemaining: urgencySlots.trim() ? Number(urgencySlots) : undefined,
      urgencyCountdownEnd: countdownEnd.trim() ? new Date(countdownEnd).toISOString() : undefined,
      showLivePulse,
    });
    setNotice('Funnel copy + media saved — live on next page load.');
    setVersion((v) => v + 1);
  };

  const uploadFunnelVideo = async () => {
    setVideoErr(null);
    if (!videoFile) {
      setVideoErr('Choose a video file (MP4/WebM).');
      return;
    }
    setVideoBusy(true);
    try {
      const store = getBlobStore();
      const put = await store.put(videoFile, { kind: 'funnel_hero_video', funnelId: base.funnelId });
      let posterBlobRef = media?.heroVideoPosterBlobRef;
      const posterSource =
        videoPosterFile ??
        (await captureVideoPoster(videoFile).then((b) =>
          b ? new File([b], `${base.funnelId}-poster.jpg`, { type: 'image/jpeg' }) : null,
        ));
      if (posterSource) {
        const posterPut = await store.put(posterSource, { kind: 'funnel_hero_poster', funnelId: base.funnelId });
        posterBlobRef = posterPut.ref;
      }
      upsertFunnelMedia(base.funnelId, {
        heroVideoBlobRef: put.ref,
        heroVideoPosterBlobRef: posterBlobRef,
        heroVideoMimeType: videoFile.type || 'video/mp4',
        videoTitle: videoTitle.trim() || undefined,
        resourceVideoId: undefined,
      });
      setVideoFile(null);
      setVideoPosterFile(null);
      setNotice('Hero video uploaded for this funnel.');
      setVersion((v) => v + 1);
    } catch (e: unknown) {
      setVideoErr((e as Error)?.message || 'Upload failed.');
    } finally {
      setVideoBusy(false);
    }
  };

  const reset = () => {
    clearFunnelOverride(base.funnelId);
    clearFunnelOverride(base.id);
    clearFunnelMedia(base.funnelId);
    clearFunnelMedia(base.id);
    setNotice('Reset to code defaults.');
    setVersion((v) => v + 1);
  };

  const overrideCount = Object.keys(loadFunnelOverrides()).length;

  return (
    <PageShell title="Lead magnet funnels" subtitle="Edit copy, hero imagery, urgency, and funnel videos — same control model as Resources">
      <div className="space-y-6">
        {notice ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>
        ) : null}
        {videoErr ? (
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{videoErr}</div>
        ) : null}

        <FinelyOsGlassPanel icon={Sparkles} title="Funnel catalog" accent="emerald">
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm mb-4`}>
            {LEAD_MAGNET_FUNNELS.length} funnels · {overrideCount} with admin overrides · upload hero videos per funnel or link a Resources library video.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {LEAD_MAGNET_FUNNELS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedId(f.id)}
                className={`w-full text-left ${finelyOsListItem(selectedId === f.id, 'emerald')}`}
              >
                <div className={`${FINELY_OS_ENTITY_BODY} font-semibold text-sm`}>{f.metaTitle}</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{f.path}</div>
              </button>
            ))}
          </div>
        </FinelyOsGlassPanel>

        <FinelyOsGlassPanel icon={FileText} title={`Edit · ${base.metaTitle}`} accent="violet">
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Urgency bar</label>
              <input value={urgencyText} onChange={(e) => setUrgencyText(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Offer slug</label>
              <input value={offer} onChange={(e) => setOffer(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Hero headline</label>
              <input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Hero highlight</label>
              <input value={heroHighlight} onChange={(e) => setHeroHighlight(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Hero sub</label>
              <input value={heroSub} onChange={(e) => setHeroSub(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Assigned role</label>
              <select value={agentPersonaId} onChange={(e) => setAgentPersonaId(e.target.value as AgentPersonaId)} className={FINELY_OS_ENTITY_SELECT}>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayTitle ?? p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>SEO title</label>
              <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div className="md:col-span-2">
              <label className={FINELY_OS_ENTITY_SUBLABEL}>SEO description</label>
              <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={2} className={`${FINELY_OS_ENTITY_INPUT} w-full`} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            <button type="button" onClick={save} className={FINELY_OS_SUCCESS_BTN}>
              <Save size={14} /> Save funnel
            </button>
            <button type="button" onClick={reset} className={FINELY_OS_SECONDARY_BTN}>
              Reset to defaults
            </button>
            <a href={base.path} target="_blank" rel="noreferrer" className={FINELY_OS_PRIMARY_BTN}>
              Preview <ExternalLink size={14} />
            </a>
            <a href="/admin/funnel-experiments" className={FINELY_OS_SECONDARY_BTN}>
              A/B experiments →
            </a>
          </div>
        </FinelyOsGlassPanel>

        <FinelyOsGlassPanel icon={Film} title="Hero media · video + imagery" accent="sky">
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm mb-4 max-w-3xl`}>
            Upload a funnel hero video (like Resources), link an existing library video, or set a static MP4 path. Generate tours in{' '}
            <a href="/admin/media-studio" className="text-sky-300 underline">Media Studio</a> or{' '}
            <a href="/admin/tour-studio" className="text-sky-300 underline">Tour Studio</a>, then upload here.
          </p>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/30">
              <LeadMagnetFunnelHeroVideo config={base} theme={theme} posterUrl={heroPreview} className="!rounded-none" />
            </div>
            <div className="space-y-3 text-sm text-white/65">
              <p>Live preview uses saved media. Pages show video + floating e-guide mockup on every premium funnel.</p>
              <p className="text-xs text-white/45">Default hero image: {theme.heroImage.slice(0, 48)}…</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
            <div className="md:col-span-2">
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Hero image URL override</label>
              <input value={heroImageOverride} onChange={(e) => setHeroImageOverride(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="https://…" />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Video title (on-page badge)</label>
              <input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Link Resources video</label>
              <select value={resourceVideoId} onChange={(e) => setResourceVideoId(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
                <option value="">— None —</option>
                {resourceVideos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} {v.isPublic ? '(public)' : '(private)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Static video path (optional)</label>
              <input value={staticVideoSrc} onChange={(e) => setStaticVideoSrc(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="/media/your-funnel.mp4" />
            </div>
            <label className="block">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Upload funnel hero video</div>
              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} className={FINELY_OS_ENTITY_SELECT} />
            </label>
            <label className="block">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Thumbnail (optional)</div>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setVideoPosterFile(e.target.files?.[0] ?? null)} className={FINELY_OS_ENTITY_SELECT} />
            </label>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <button type="button" disabled={videoBusy} onClick={() => void uploadFunnelVideo()} className={FINELY_OS_SUCCESS_BTN}>
                <UploadCloud size={14} /> Upload hero video
              </button>
              <a href="/admin/resources" className={FINELY_OS_SECONDARY_BTN}>
                <Video size={14} /> Resources video library
              </a>
            </div>
          </div>
        </FinelyOsGlassPanel>

        <FinelyOsGlassPanel icon={Sparkles} title="Urgency controls" accent="amber">
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl">
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Kits remaining (scarcity)</label>
              <input value={urgencySlots} onChange={(e) => setUrgencySlots(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Auto if empty" />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Countdown end (local)</label>
              <input type="datetime-local" value={countdownEnd} onChange={(e) => setCountdownEnd(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <label className={`flex items-end gap-2 pb-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
              <input type="checkbox" checked={showLivePulse} onChange={(e) => setShowLivePulse(e.target.checked)} />
              Show “Specialists online” pulse
            </label>
          </div>
          <button type="button" onClick={save} className={`${FINELY_OS_SUCCESS_BTN} mt-4`}>
            <Save size={14} /> Save urgency + media
          </button>
        </FinelyOsGlassPanel>
      </div>
    </PageShell>
  );
}
