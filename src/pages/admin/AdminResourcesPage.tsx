import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowDown, ArrowUp, BookOpen, Download, Save, RotateCcw, Plus, Trash2, UploadCloud, X, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { KpiCard } from '../../components/ui/KpiCards';
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

function cloneGuide(g: FreeGuide): FreeGuide {
  return JSON.parse(JSON.stringify(g)) as FreeGuide;
}

export default function AdminResourcesPage() {
  const navigate = useNavigate();
  const [storeVersion, setStoreVersion] = useState(0);
  const guides = useMemo(() => listFreeGuidesEffective(), [storeVersion]);
  const videos = useMemo(() => listResourceVideos(), [storeVersion]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(() => guides[0]?.id ?? '');
  const selected = useMemo(() => guides.find((g) => g.id === selectedId) ?? null, [guides, selectedId]);

  const [draft, setDraft] = useState<FreeGuide | null>(selected ? cloneGuide(selected) : null);
  const [notice, setNotice] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErr, setImportErr] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoPublic, setVideoPublic] = useState(true);
  const [videoSaveTo, setVideoSaveTo] = useState<'resource_video' | 'testimonial_draft' | 'testimonial_published'>('resource_video');
  const [videoErr, setVideoErr] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [preview, setPreview] = useState<null | { id: string; title: string; url: string; revoke?: () => void }>(null);

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

  const filteredGuides = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return guides;
    return guides.filter((g) => `${g.title} ${g.id}`.toLowerCase().includes(q));
  }, [guides, query]);

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
      if (videoSaveTo === 'resource_video') {
        upsertResourceVideo({
          title: videoTitle.trim(),
          desc: videoDesc.trim() || undefined,
          blobRef: put.ref,
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
      <div className="space-y-6">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Admin Dashboard
        </button>

        {notice && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            {notice}
          </div>
        )}

        {/* KPI row (modern + high-signal) */}
        <div className="grid md:grid-cols-4 gap-4">
          <KpiCard label="Guides" value={guides.length} hint="Built-in library" tone="amber" />
          <KpiCard label="Edited" value={editedCount} hint="Overrides active" tone="emerald" />
          <KpiCard label="Sections" value={sectionCount} hint={draft ? (draft.title || 'Selected') : 'Select a guide'} tone="sky" />
          <KpiCard label="Bullets" value={bulletCount} hint={draft ? 'In selected guide' : '—'} tone="violet" />
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <BookOpen size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Guides</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                {filteredGuides.length}/{guides.length}
              </div>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides…"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white/80 placeholder:text-white/25 focus:outline-none focus:border-amber-500 transition-colors text-sm"
            />

            <div className="space-y-2">
              {filteredGuides.map((g) => {
                const active = g.id === selectedId;
                const defaultGuide = FREE_GUIDES.find((x) => x.id === g.id) ?? null;
                const isEdited = defaultGuide ? JSON.stringify(defaultGuide) !== JSON.stringify(g) : false;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedId(g.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                      active ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{g.title}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest font-mono text-white/40">{g.id}</div>
                      </div>
                      {isEdited && (
                        <span className="px-2 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[9px] font-black uppercase tracking-widest text-emerald-200">
                          edited
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {filteredGuides.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-white/55 text-sm">
                  No matches.
                </div>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-9 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-5">
            {!draft ? (
              <div className="text-white/60">Select a guide to edit.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-white font-semibold">Editor</div>
                    <div className="text-[10px] uppercase tracking-widest font-mono text-white/40">{draft.id}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={exportJson}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-white/70 font-black uppercase tracking-widest text-[10px] transition-all"
                      title="Download this guide as JSON"
                    >
                      <Download size={14} /> Export
                    </button>
                    <button
                      type="button"
                      onClick={openImport}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-white/70 font-black uppercase tracking-widest text-[10px] transition-all"
                      title="Paste JSON to import changes"
                    >
                      <UploadCloud size={14} /> Import
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => selected && setDraft(cloneGuide(selected))}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-white/70 font-black uppercase tracking-widest text-[10px] transition-all"
                      title="Discard unsaved changes"
                    >
                      <RotateCcw size={14} /> Revert
                    </button>
                    <button
                      type="button"
                      disabled={!hasOverride}
                      onClick={resetToDefault}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        hasOverride ? 'border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15' : 'border-white/10 bg-white/[0.02] text-white/35'
                      }`}
                      title="Reset this guide back to the built-in default"
                    >
                      <Trash2 size={14} /> Reset
                    </button>
                  </div>
                </div>

                {importOpen && (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-white font-semibold">Import guide JSON</div>
                        <div className="text-white/50 text-xs">
                          Paste JSON for this guide id: <span className="font-mono">{draft.id}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImportOpen(false)}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {importErr && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-100 text-sm">{importErr}</div>
                    )}

                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className="w-full min-h-[220px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-mono text-[12px] focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={applyImport}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                      >
                        Apply import
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportOpen(false)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 font-black uppercase tracking-widest text-[10px] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block md:col-span-2">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Title</div>
                    <input
                      value={draft.title}
                      onChange={(e) => setAndNudge({ ...draft, title: e.target.value })}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Guide title"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Description</div>
                    <textarea
                      value={draft.desc}
                      onChange={(e) => setAndNudge({ ...draft, desc: e.target.value })}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors min-h-[90px]"
                      placeholder="Short description shown on the Resource Library page."
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-white font-semibold">Sections</div>
                    <button
                      type="button"
                      onClick={() =>
                        setAndNudge({
                          ...draft,
                          sections: [...draft.sections, { heading: 'New section', bullets: [''] }],
                        })
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/15 transition-all"
                    >
                      <Plus size={14} /> Add section
                    </button>
                  </div>

                  {/* Modern: collapsible section cards (page scroll, not giant always-open boxes) */}
                  <div className="grid lg:grid-cols-2 gap-4">
                    {draft.sections.map((sec, idx) => {
                      const bulletLen = (sec.bullets ?? []).filter(Boolean).length;
                      return (
                        <details key={idx} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                          <summary className="cursor-pointer select-none">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-white font-semibold truncate">{sec.heading || `Section ${idx + 1}`}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
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
                                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-white/70 transition-all disabled:opacity-40"
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
                                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-white/70 transition-all disabled:opacity-40"
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
                                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 transition-all"
                                  title="Remove section"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </summary>

                          <div className="mt-4 space-y-3">
                            <label className="block">
                              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Heading</div>
                              <input
                                value={sec.heading}
                                onChange={(e) => {
                                  const next = cloneGuide(draft);
                                  next.sections[idx] = { ...next.sections[idx]!, heading: e.target.value };
                                  setAndNudge(next);
                                }}
                                className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                              />
                            </label>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bullets (one per line)</div>
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
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
                                className="w-full min-h-[140px] bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors text-sm"
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
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-white/70 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                  <Plus size={14} /> Add bullet
                                </button>
                              </div>
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

        {/* Resource Videos (MP4/WebM) */}
        <details className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
          <summary className="cursor-pointer select-none">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Film size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Resource videos</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{videos.length} video(s)</div>
            </div>
            <div className="mt-2 text-white/55 text-sm">
              Upload MP4/WebM videos for the public Resources page (and future knowledge base).
            </div>
          </summary>

          <div className="mt-5 space-y-5">
            {videoErr && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">{videoErr}</div>
            )}

            {preview && (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">{preview.title}</div>
                    <div className="text-white/50 text-xs">Preview</div>
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
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    title="Close preview"
                  >
                    <X size={16} />
                  </button>
                </div>
                <video src={preview.url} controls className="w-full rounded-xl border border-white/10 bg-black" />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Video file</div>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white/70"
                />
                <div className="mt-1 text-xs text-white/45">MP4 preferred. WebM supported.</div>
              </label>
              <label className="block">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Title</div>
                <input
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Video title"
                />
              </label>
              <label className="block">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Save to</div>
                <select
                  value={videoSaveTo}
                  onChange={(e) => setVideoSaveTo(e.target.value as any)}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="resource_video">Resources • Video Library</option>
                  <option value="testimonial_draft">Testimonials • Draft</option>
                  <option value="testimonial_published">Testimonials • Published</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Description</div>
                <textarea
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors min-h-[90px]"
                  placeholder="Short description shown on the Resources page."
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-white/70">
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
                <button
                  type="button"
                  disabled={videoBusy}
                  onClick={() => void uploadVideo()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  <UploadCloud size={14} /> Upload video
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {videos.map((v) => (
                <div key={v.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{v.title}</div>
                      {v.desc ? <div className="mt-1 text-white/55 text-sm line-clamp-2">{v.desc}</div> : null}
                      <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">{v.mimeType}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {v.isPublic ? 'public' : 'private'} • {new Date(v.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void openPreview(v.id)}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-white/70 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeVideo(v.id)}
                        className="px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {videos.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-white/55 text-sm">
                  No videos yet.
                </div>
              ) : null}
            </div>
          </div>
        </details>
      </div>
    </PageShell>
  );
}

