import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowDown, ArrowUp, BookOpen, Download, ExternalLink, Paperclip, Save, RotateCcw, Plus, Trash2, UploadCloud, X, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { FreeGuide } from '../../resources/freeGuides';
import { FREE_GUIDES } from '../../resources/freeGuides';
import {
  deleteFreeGuideOverride,
  getFreeGuideOverride,
  listFreeGuidesEffective,
  upsertFreeGuideOverride,
} from '../../data/freeGuidesRepo';
import { downloadText } from '../../utils/download';
import { deleteResourceVideo, listResourceVideos, upsertResourceVideo } from '../../data/resourceVideosRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { createVideoTestimonial, upsertTestimonial } from '../../data/testimonialsRepo';
import { captureVideoPoster } from '../../utils/captureVideoPoster';
import { ResourceVideoThumb } from '../../components/resources/ResourceVideoThumb';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import { FinelyOsCatalogBrowser, type FinelyOsCatalogItem } from '../../features/os/FinelyOsCatalogBrowser';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_ACTIVE_CHIP,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_TOOLBAR,
  FINELY_OS_VIEW_TABS,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

type ResourcesAdminTab = 'guides' | 'videos' | 'preview';

const blobStore = getBlobStore();

function cloneGuide(g: FreeGuide): FreeGuide {
  return JSON.parse(JSON.stringify(g)) as FreeGuide;
}

export default function AdminResourcesPage() {
  const navigate = useNavigate();
  const [storeVersion, setStoreVersion] = useState(0);
  const guides = useMemo(() => listFreeGuidesEffective(), [storeVersion]);
  const videos = useMemo(() => listResourceVideos(), [storeVersion]);
  const [selectedId, setSelectedId] = useState<string>(() => guides[0]?.id ?? '');
  const selected = useMemo(() => guides.find((g) => g.id === selectedId) ?? null, [guides, selectedId]);

  const guideCatalogItems = useMemo((): FinelyOsCatalogItem[] => {
    return guides.map((g) => {
      const defaultGuide = FREE_GUIDES.find((x) => x.id === g.id) ?? null;
      const isEdited = defaultGuide ? JSON.stringify(defaultGuide) !== JSON.stringify(g) : false;
      return {
        id: g.id,
        title: g.title,
        subtitle: g.id,
        icon: BookOpen,
        iconAccent: 'fuchsia',
        badges: isEdited
          ? [{ label: 'edited', className: FINELY_OS_ACTIVE_CHIP }]
          : undefined,
      };
    });
  }, [guides]);

  const [draft, setDraft] = useState<FreeGuide | null>(selected ? cloneGuide(selected) : null);
  const [notice, setNotice] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErr, setImportErr] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPosterFile, setVideoPosterFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoPublic, setVideoPublic] = useState(true);
  const [videoSaveTo, setVideoSaveTo] = useState<'resource_video' | 'testimonial_draft' | 'testimonial_published'>('resource_video');
  const [videoErr, setVideoErr] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [preview, setPreview] = useState<null | { id: string; title: string; url: string; revoke?: () => void }>(null);
  const [adminTab, setAdminTab] = useState<ResourcesAdminTab>('guides');

  useEffect(() => {
    return () => {
      try {
        preview?.revoke?.();
      } catch {
        // ignore
      }
    };
  }, [preview]);

  useEffect(() => {
    if (!selected) return;
    setDraft(cloneGuide(selected));
  }, [selected?.id]);

  const hasOverride = useMemo(() => {
    if (!selected) return false;
    return Boolean(getFreeGuideOverride(selected.id));
  }, [selected?.id, storeVersion]);

  const editedCount = useMemo(() => {
    let n = 0;
    for (const g of guides) {
      const def = FREE_GUIDES.find((x) => x.id === g.id) ?? null;
      const isEdited = def ? JSON.stringify(def) !== JSON.stringify(g) : false;
      if (isEdited) n++;
    }
    return n;
  }, [guides]);

  const sectionCount = draft?.sections?.length ?? 0;
  const bulletCount = useMemo(() => {
    if (!draft) return 0;
    return (draft.sections ?? []).reduce((acc, s) => acc + (s.bullets ?? []).filter(Boolean).length, 0);
  }, [draft]);

  const setAndNudge = (next: FreeGuide) => setDraft(next);

  const uploadSectionAttachment = async (sectionIdx: number, file: File) => {
    if (!draft) return;
    const tenantId = getActiveTenantId();
    const { ref } = await blobStore.put(file, { tenantId, kind: 'resource_section', guideId: draft.id, sectionIdx });
    const next = cloneGuide(draft);
    next.sections[sectionIdx] = {
      ...next.sections[sectionIdx]!,
      attachmentBlobRef: ref,
      attachmentFilename: file.name,
      attachmentMimeType: file.type || 'application/octet-stream',
    };
    setAndNudge(next);
    setNotice(`Attached ${file.name} to section.`);
    window.setTimeout(() => setNotice(null), 2000);
  };

  const clearSectionAttachment = (sectionIdx: number) => {
    if (!draft) return;
    const next = cloneGuide(draft);
    const sec = { ...next.sections[sectionIdx]! };
    delete sec.attachmentBlobRef;
    delete sec.attachmentFilename;
    delete sec.attachmentMimeType;
    next.sections[sectionIdx] = sec;
    setAndNudge(next);
  };

  const save = () => {
    if (!draft) return;
    // Minimal validation: keep structure safe for PDF generator.
    const cleaned: FreeGuide = {
      ...draft,
      title: (draft.title ?? '').trim() || 'Untitled guide',
      desc: (draft.desc ?? '').trim(),
      sections: (draft.sections ?? [])
        .map((s) => ({
          heading: (s.heading ?? '').trim() || 'Section',
          bullets: (s.bullets ?? []).map((b) => (b ?? '').trim()).filter(Boolean),
          ...(s.attachmentBlobRef ? { attachmentBlobRef: s.attachmentBlobRef } : {}),
          ...(s.attachmentFilename ? { attachmentFilename: s.attachmentFilename } : {}),
          ...(s.attachmentMimeType ? { attachmentMimeType: s.attachmentMimeType } : {}),
        }))
        .filter((s) => s.heading || s.bullets.length > 0),
    };
    upsertFreeGuideOverride(cleaned);
    setNotice('Saved.');
    setStoreVersion((v) => v + 1);
    window.dispatchEvent(new CustomEvent('finely:store'));
    window.setTimeout(() => setNotice(null), 2000);
  };

  const resetToDefault = () => {
    if (!selected) return;
    deleteFreeGuideOverride(selected.id);
    setNotice('Reset to default.');
    setStoreVersion((v) => v + 1);
    window.dispatchEvent(new CustomEvent('finely:store'));
    window.setTimeout(() => setNotice(null), 2000);
  };

  const exportJson = () => {
    if (!draft) return;
    downloadText({
      text: JSON.stringify(draft, null, 2),
      filename: `${draft.id}.json`,
      mimeType: 'application/json',
    });
  };

  const openImport = () => {
    setImportErr(null);
    setImportText(draft ? JSON.stringify(draft, null, 2) : '');
    setImportOpen(true);
  };

  const applyImport = () => {
    setImportErr(null);
    if (!draft) return;
    try {
      const obj = JSON.parse(importText || '{}') as any;
      if (!obj || typeof obj !== 'object') throw new Error('Invalid JSON.');
      if (obj.id !== draft.id) throw new Error(`Guide id mismatch. Expected "${draft.id}".`);
      const next: FreeGuide = {
        id: draft.id,
        title: String(obj.title ?? draft.title),
        desc: String(obj.desc ?? draft.desc),
        sections: Array.isArray(obj.sections)
          ? obj.sections.map((s: any) => ({
              heading: String(s?.heading ?? 'Section'),
              bullets: Array.isArray(s?.bullets) ? s.bullets.map((b: any) => String(b)).filter(Boolean) : [],
              ...(s?.attachmentBlobRef ? { attachmentBlobRef: String(s.attachmentBlobRef) } : {}),
              ...(s?.attachmentFilename ? { attachmentFilename: String(s.attachmentFilename) } : {}),
              ...(s?.attachmentMimeType ? { attachmentMimeType: String(s.attachmentMimeType) } : {}),
            }))
          : draft.sections,
      };
      setDraft(next);
      setImportOpen(false);
    } catch (e: any) {
      setImportErr(e?.message || 'Import failed.');
    }
  };

  const uploadVideo = async () => {
    setVideoErr(null);
    if (!videoFile) {
      setVideoErr('Choose a video file (MP4/WebM).');
      return;
    }
    if (!videoTitle.trim()) {
      setVideoErr('Add a title.');
      return;
    }
    setVideoBusy(true);
    try {
      const store = getBlobStore();
      const put = await store.put(videoFile, { kind: 'resource_video', title: videoTitle.trim() });
      let posterBlobRef: string | undefined;
      const posterSource = videoPosterFile ?? (await captureVideoPoster(videoFile).then((b) => (b ? new File([b], `${videoTitle.trim() || 'poster'}.jpg`, { type: 'image/jpeg' }) : null)));
      if (posterSource) {
        const posterPut = await store.put(posterSource, { kind: 'resource_video_poster', title: `${videoTitle.trim()} poster` });
        posterBlobRef = posterPut.ref;
      }
      if (videoSaveTo === 'resource_video') {
        upsertResourceVideo({
          title: videoTitle.trim(),
          desc: videoDesc.trim() || undefined,
          blobRef: put.ref,
          posterBlobRef,
          mimeType: videoFile.type || 'video/mp4',
          isPublic: videoPublic,
        });
      } else {
        const tenantId = getActiveTenantId();
        const t = createVideoTestimonial(tenantId);
        upsertTestimonial({
          ...t,
          title: videoTitle.trim() || t.title,
          service: 'Resources',
          visibility: videoSaveTo === 'testimonial_published' ? 'published' : 'draft',
          blobRef: put.ref,
          blobMimeType: videoFile.type || 'video/mp4',
          caption: videoDesc.trim() || undefined,
          embedUrl: undefined,
          videoSrc: undefined,
        } as any);
      }
      setVideoFile(null);
      setVideoPosterFile(null);
      setVideoTitle('');
      setVideoDesc('');
      setVideoPublic(true);
      setVideoSaveTo('resource_video');
      setNotice(videoSaveTo === 'resource_video' ? 'Video uploaded.' : 'Video uploaded to Testimonials.');
      setStoreVersion((v) => v + 1);
      window.dispatchEvent(new CustomEvent('finely:store'));
      window.setTimeout(() => setNotice(null), 2000);
    } catch (e: any) {
      setVideoErr(e?.message || 'Upload failed.');
    } finally {
      setVideoBusy(false);
    }
  };

  const regeneratePoster = async (id: string) => {
    const v = videos.find((x) => x.id === id);
    if (!v) return;
    setVideoErr(null);
    setVideoBusy(true);
    try {
      const res = await getBlobUrl(v.blobRef, { mimeType: v.mimeType, preferSigned: true, signedTtlSeconds: 60 * 20 });
      if (!res?.url) throw new Error('Could not load video for thumbnail capture.');
      const posterBlob = await new Promise<Blob | null>((resolve) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.onloadeddata = () => {
          try {
            video.currentTime = Math.min(0.8, Math.max(0.1, (video.duration || 1) * 0.08));
          } catch {
            resolve(null);
          }
        };
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.86);
        };
        video.onerror = () => resolve(null);
        video.src = res.url;
      });
      res.revoke?.();
      if (!posterBlob) throw new Error('Could not capture a frame from this video.');
      const store = getBlobStore();
      const posterPut = await store.put(new File([posterBlob], `${v.title}-poster.jpg`, { type: 'image/jpeg' }), {
        kind: 'resource_video_poster',
        title: `${v.title} poster`,
      });
      upsertResourceVideo({ ...v, posterBlobRef: posterPut.ref });
      setStoreVersion((vv) => vv + 1);
      window.dispatchEvent(new CustomEvent('finely:store'));
      setNotice('Thumbnail captured.');
      window.setTimeout(() => setNotice(null), 2000);
    } catch (e: any) {
      setVideoErr(e?.message || 'Thumbnail capture failed.');
    } finally {
      setVideoBusy(false);
    }
  };

  const openPreview = async (id: string) => {
    setVideoErr(null);
    const v = videos.find((x) => x.id === id);
    if (!v) return;
    try {
      preview?.revoke?.();
    } catch {
      // ignore
    }
    const res = await getBlobUrl(v.blobRef, { mimeType: v.mimeType, preferSigned: true, signedTtlSeconds: 60 * 20 });
    if (!res?.url) {
      setVideoErr('Could not load video.');
      return;
    }
    setPreview({ id: v.id, title: v.title, url: res.url, revoke: res.revoke });
  };

  const removeVideo = async (id: string) => {
    const v = videos.find((x) => x.id === id);
    if (!v) return;
    try {
      if (preview?.id === id) {
        try {
          preview.revoke?.();
        } catch {
          // ignore
        }
        setPreview(null);
      }
      const store = getBlobStore();
      await store.delete(v.blobRef);
    } catch {
      // best-effort delete; still remove metadata
    }
    deleteResourceVideo(id);
    setStoreVersion((vv) => vv + 1);
    window.dispatchEvent(new CustomEvent('finely:store'));
  };

  return (
    <PageShell
      badge="Admin"
      title="Resources • Free Guides"
      subtitle="Edit the public Resource Library guides. Changes apply immediately."
    >
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Admin Dashboard
        </button>

        {notice && <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div>}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <FinelyOsOverviewStatTile icon={BookOpen} label="Guides" value={guides.length} accent="fuchsia" iconAccent="fuchsia" hint="Built-in library" />
          <FinelyOsOverviewStatTile icon={Save} label="Edited" value={editedCount} accent="emerald" iconAccent="emerald" hint="Overrides active" />
          <FinelyOsOverviewStatTile icon={Paperclip} label="Sections" value={sectionCount} accent="sky" iconAccent="sky" hint={draft ? draft.title || 'Selected' : 'Select a guide'} />
          <FinelyOsOverviewStatTile icon={Film} label="Videos" value={videos.length} accent="violet" iconAccent="violet" hint="Public library" />
        </div>

        <div className={FINELY_OS_VIEW_TABS} role="tablist">
          <button type="button" role="tab" aria-selected={adminTab === 'guides'} onClick={() => setAdminTab('guides')} className={finelyOsViewTab(adminTab === 'guides', 'fuchsia')}>
            Guide editor
          </button>
          <button type="button" role="tab" aria-selected={adminTab === 'videos'} onClick={() => setAdminTab('videos')} className={finelyOsViewTab(adminTab === 'videos', 'violet')}>
            Video library
          </button>
          <button type="button" role="tab" aria-selected={adminTab === 'preview'} onClick={() => setAdminTab('preview')} className={finelyOsViewTab(adminTab === 'preview', 'emerald')}>
            Public preview
          </button>
        </div>

        <div className={`${FINELY_OS_TOOLBAR} flex-wrap justify-between`}>
          <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>Manage the public Resource Library — guides, videos, and lead magnets.</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/resources')} className={FINELY_OS_SECONDARY_BTN}>
              <ExternalLink size={14} /> View public page
            </button>
            <button type="button" onClick={() => navigate('/free-guide')} className={FINELY_OS_SECONDARY_BTN}>
              Lead magnet funnel
            </button>
          </div>
        </div>

        {adminTab === 'guides' ? (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-3 ${finelyOsCatalogCard('amber')} !p-5`} data-fc-accent="amber">
            <FinelyOsCatalogBrowser
              items={guideCatalogItems}
              pageSize={16}
              searchPlaceholder="Search guides by title or id…"
              emptyMessage="No guides match your search."
              initialView="grid"
              selectedIds={new Set(selectedId ? [selectedId] : [])}
              onItemClick={setSelectedId}
            />
          </div>

          <div className={`lg:col-span-9 space-y-5 ${finelyOsCatalogCard('violet')} !p-5`}>
            {!draft ? (
              <div className={FINELY_OS_ENTITY_BODY}>Select a guide to edit.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>Editor</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{draft.id}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={exportJson} className={FINELY_OS_SECONDARY_BTN} title="Download this guide as JSON">
                      <Download size={14} /> Export
                    </button>
                    <button type="button" onClick={openImport} className={FINELY_OS_SECONDARY_BTN} title="Paste JSON to import changes">
                      <UploadCloud size={14} /> Import
                    </button>
                    <button type="button" onClick={save} className={FINELY_OS_PRIMARY_BTN}>
                      <Save size={14} /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => selected && setDraft(cloneGuide(selected))}
                      className={FINELY_OS_SECONDARY_BTN}
                      title="Discard unsaved changes"
                    >
                      <RotateCcw size={14} /> Revert
                    </button>
                    <button
                      type="button"
                      disabled={!hasOverride}
                      onClick={resetToDefault}
                      className={hasOverride ? FINELY_OS_DANGER_BTN : `${FINELY_OS_SECONDARY_BTN} opacity-40`}
                      title="Reset this guide back to the built-in default"
                    >
                      <Trash2 size={14} /> Reset
                    </button>
                  </div>
                </div>

                {importOpen && (
                  <div className={`space-y-3 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>Import guide JSON</div>
                        <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                          Paste JSON for this guide id: <span className="font-mono">{draft.id}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImportOpen(false)}
                        className={FINELY_OS_SECONDARY_BTN}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {importErr && <div className={FINELY_OS_NOTICE_ERROR}>{importErr}</div>}

                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className={`${FINELY_OS_ENTITY_INPUT} min-h-[220px] font-mono text-[12px]`}
                    />
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={applyImport} className={FINELY_OS_SUCCESS_BTN}>
                        Apply import
                      </button>
                      <button type="button" onClick={() => setImportOpen(false)} className={FINELY_OS_SECONDARY_BTN}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block md:col-span-2">
                    <div className={FINELY_OS_ENTITY_LABEL}>Title</div>
                    <input
                      value={draft.title}
                      onChange={(e) => setAndNudge({ ...draft, title: e.target.value })}
                      className={FINELY_OS_ENTITY_INPUT}
                      placeholder="Guide title"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <div className={FINELY_OS_ENTITY_LABEL}>Description</div>
                    <textarea
                      value={draft.desc}
                      onChange={(e) => setAndNudge({ ...draft, desc: e.target.value })}
                      className={`${FINELY_OS_ENTITY_INPUT} min-h-[90px]`}
                      placeholder="Short description shown on the Resource Library page."
                    />
                  </label>
                </div>

                <div className={`space-y-4 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>Sections</div>
                    <button
                      type="button"
                      onClick={() =>
                        setAndNudge({
                          ...draft,
                          sections: [...draft.sections, { heading: 'New section', bullets: [''] }],
                        })
                      }
                      className={FINELY_OS_PRIMARY_BTN}
                    >
                      <Plus size={14} /> Add section
                    </button>
                  </div>

                  {/* Modern: collapsible section cards (page scroll, not giant always-open boxes) */}
                  <div className="grid lg:grid-cols-2 gap-4">
                    {draft.sections.map((sec, idx) => {
                      const bulletLen = (sec.bullets ?? []).filter(Boolean).length;
                      return (
                        <details key={idx} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                          <summary className="cursor-pointer select-none">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold truncate`}>{sec.heading || `Section ${idx + 1}`}</div>
                                <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                                  {bulletLen} bullet(s)
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const next = cloneGuide(draft);
                                    if (idx <= 0) return;
                                    const tmp = next.sections[idx - 1]!;
                                    next.sections[idx - 1] = next.sections[idx]!;
                                    next.sections[idx] = tmp;
                                    setAndNudge(next);
                                  }}
                                  className={`${FINELY_OS_SECONDARY_BTN} !w-10 !h-10 !p-0 disabled:opacity-40`}
                                  title="Move section up"
                                >
                                  <ArrowUp size={16} />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx >= draft.sections.length - 1}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const next = cloneGuide(draft);
                                    if (idx >= next.sections.length - 1) return;
                                    const tmp = next.sections[idx + 1]!;
                                    next.sections[idx + 1] = next.sections[idx]!;
                                    next.sections[idx] = tmp;
                                    setAndNudge(next);
                                  }}
                                  className={`${FINELY_OS_SECONDARY_BTN} !w-10 !h-10 !p-0 disabled:opacity-40`}
                                  title="Move section down"
                                >
                                  <ArrowDown size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const next = cloneGuide(draft);
                                    next.sections.splice(idx, 1);
                                    setAndNudge(next);
                                  }}
                                  className={`${FINELY_OS_DANGER_BTN} !w-10 !h-10 !p-0`}
                                  title="Remove section"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </summary>

                          <div className="mt-4 space-y-3">
                            <label className="block">
                              <div className={FINELY_OS_ENTITY_LABEL}>Heading</div>
                              <input
                                value={sec.heading}
                                onChange={(e) => {
                                  const next = cloneGuide(draft);
                                  next.sections[idx] = { ...next.sections[idx]!, heading: e.target.value };
                                  setAndNudge(next);
                                }}
                                className={FINELY_OS_ENTITY_INPUT}
                              />
                            </label>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className={FINELY_OS_ENTITY_LABEL}>Bullets (one per line)</div>
                                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                                  {bulletLen} bullet(s)
                                </div>
                              </div>
                              <textarea
                                value={(sec.bullets ?? []).join('\n')}
                                onChange={(e) => {
                                  const next = cloneGuide(draft);
                                  const lines = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean);
                                  next.sections[idx] = { ...next.sections[idx]!, bullets: lines };
                                  setAndNudge(next);
                                }}
                                className={`${FINELY_OS_ENTITY_INPUT} min-h-[140px]`}
                                placeholder="Bullet 1&#10;Bullet 2&#10;Bullet 3"
                              />
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = cloneGuide(draft);
                                    next.sections[idx] = { ...next.sections[idx]!, bullets: [...(next.sections[idx]?.bullets ?? []), 'New bullet'] };
                                    setAndNudge(next);
                                  }}
                                  className={FINELY_OS_SECONDARY_BTN}
                                >
                                  <Plus size={14} /> Add bullet
                                </button>
                              </div>
                            </div>

                            <div className={`rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-2 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                              <div className={`${FINELY_OS_ENTITY_LABEL} inline-flex items-center gap-1.5 text-violet-300`}>
                                <Paperclip size={12} /> Section attachment
                              </div>
                              {sec.attachmentFilename ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`${FINELY_OS_ENTITY_BODY} truncate`}>{sec.attachmentFilename}</span>
                                  <button
                                    type="button"
                                    onClick={() => clearSectionAttachment(idx)}
                                    className={`${FINELY_OS_ENTITY_SUBLABEL} text-rose-300 hover:text-rose-200`}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>PDF, image, or worksheet for this section.</p>
                              )}
                              <label className={`${FINELY_OS_SECONDARY_BTN} cursor-pointer`}>
                                <UploadCloud size={14} /> Upload file
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) void uploadSectionAttachment(idx, f);
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        ) : null}

        {adminTab === 'videos' ? (
        <div className={`space-y-5 ${finelyOsCatalogCard('violet')} !p-5`}>
            <div className="flex items-center justify-between gap-4">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
                <Film size={18} />
                <span>Resource videos</span>
              </div>
              <div className={`text-[10px] uppercase tracking-widest font-mono ${FINELY_OS_ENTITY_SUBLABEL}`}>{videos.length} video(s)</div>
            </div>
            <div className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
              Upload MP4/WebM videos for the public Resources page (and future knowledge base).
            </div>

          <div className="mt-5 space-y-5">
            {videoErr && <div className={FINELY_OS_NOTICE_ERROR}>{videoErr}</div>}

            {preview && (
              <div className={`space-y-3 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold truncate`}>{preview.title}</div>
                    <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Preview</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        preview.revoke?.();
                      } catch {
                        // ignore
                      }
                      setPreview(null);
                    }}
                    className={FINELY_OS_SECONDARY_BTN}
                    title="Close preview"
                  >
                    <X size={16} />
                  </button>
                </div>
                <video src={preview.url} controls className="w-full rounded-xl border border-violet-500/20 bg-fc-input" />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Video file</div>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  className={FINELY_OS_ENTITY_SELECT}
                />
                <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>MP4 preferred. WebM supported.</div>
              </label>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Thumbnail (optional)</div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setVideoPosterFile(e.target.files?.[0] ?? null)}
                  className={FINELY_OS_ENTITY_SELECT}
                />
                <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>Leave empty to auto-capture a frame from the video.</div>
              </label>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Title</div>
                <input
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className={FINELY_OS_ENTITY_INPUT}
                  placeholder="Video title"
                />
              </label>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Save to</div>
                <select
                  value={videoSaveTo}
                  onChange={(e) => setVideoSaveTo(e.target.value as any)}
                  className={FINELY_OS_ENTITY_INPUT}
                >
                  <option value="resource_video">Resources • Video Library</option>
                  <option value="testimonial_draft">Testimonials • Draft</option>
                  <option value="testimonial_published">Testimonials • Published</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <div className={FINELY_OS_ENTITY_LABEL}>Description</div>
                <textarea
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                  className={`${FINELY_OS_ENTITY_INPUT} min-h-[90px]`}
                  placeholder="Short description shown on the Resources page."
                />
              </label>
              <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_BODY}`}>
                <input
                  type="checkbox"
                  checked={videoPublic}
                  onChange={(e) => setVideoPublic(e.target.checked)}
                  disabled={videoSaveTo !== 'resource_video'}
                  title={videoSaveTo !== 'resource_video' ? 'Public/private applies to Resource videos only.' : undefined}
                />
                Public on Resources page
              </label>
              <div className="flex items-center justify-end">
                <button type="button" disabled={videoBusy} onClick={() => void uploadVideo()} className={FINELY_OS_SUCCESS_BTN}>
                  <UploadCloud size={14} /> Upload video
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {videos.length === 0 ? (
                <div className={`${FINELY_OS_LUXURY_EMPTY} lg:col-span-2`}>No videos yet.</div>
              ) : (
                videos.map((v) => (
                  <div key={v.id} className={`rounded-2xl border border-violet-500/20 bg-violet-500/5 overflow-hidden shadow-sm ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                    <ResourceVideoThumb video={v} onClick={() => void openPreview(v.id)} />
                    <div className="p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold truncate`}>{v.title}</div>
                        {v.desc ? <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{v.desc}</div> : null}
                        <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{v.mimeType}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                          {v.isPublic ? 'public' : 'private'} • {v.posterBlobRef ? 'thumbnail ✓' : 'no thumbnail'} •{' '}
                          {new Date(v.updatedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={videoBusy}
                          onClick={() => void regeneratePoster(v.id)}
                          className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-50`}
                        >
                          Thumbnail
                        </button>
                        <button type="button" onClick={() => void openPreview(v.id)} className={FINELY_OS_SECONDARY_BTN}>
                          Preview
                        </button>
                        <button type="button" onClick={() => void removeVideo(v.id)} className={FINELY_OS_DANGER_BTN}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        ) : null}

        {adminTab === 'preview' ? (
          <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-5`}>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
              <BookOpen size={18} />
              <span>Public preview — {draft?.title || 'Select a guide'}</span>
            </div>
            {!draft ? (
              <div className={FINELY_OS_LUXURY_EMPTY}>Select a guide in the Guide editor tab to preview content.</div>
            ) : (
              <>
                <div className={`${FINELY_OS_ENTITY_VALUE} text-2xl font-semibold`}>{draft.title}</div>
                <div className={FINELY_OS_ENTITY_BODY}>{draft.desc}</div>
                <div className="space-y-4">
                  {(draft.sections ?? []).map((sec, idx) => (
                    <div key={idx} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} data-fc-accent="sky">
                      <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{sec.heading}</div>
                      <ul className={`mt-2 list-disc pl-5 ${FINELY_OS_ENTITY_BODY} space-y-1`}>
                        {(sec.bullets ?? []).filter(Boolean).map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => navigate('/resources')} className={FINELY_OS_PRIMARY_BTN}>
                  <ExternalLink size={14} /> Open live Resources page
                </button>
              </>
            )}
          </div>
        ) : null}

        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}

