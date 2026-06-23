import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Download,
  Film,
  Image as ImageIcon,
  Mic2,
  Music2,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  Video,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { getFeatureFlags } from '../../data/settingsRepo';
import { callAiGateway } from '../../lib/aiClient';
import { buildCharacterContinuityPrompt } from '../../lib/characterPrompt';
import { generateImages } from '../../lib/imageGenClient';
import { generateVoiceover } from '../../lib/voiceGenClient';
import { downloadDataUrl, downloadBlob, exportScenesToWebm } from '../../lib/mediaExport';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import type { Aspect, MediaProject, VideoProvider, VoiceProvider } from '../../domain/mediaStudio';
import { MEDIA_RENDER_PRESETS, aspectToSize } from '../../domain/mediaStudio';
import { upsertResourceVideo } from '../../data/resourceVideosRepo';
import { createVideoTestimonial, upsertTestimonial } from '../../data/testimonialsRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import {
  addScene,
  addAudioTrack,
  addAsset,
  addRenderHistory,
  createMediaProject,
  deleteAudioTrack,
  deleteMediaProject,
  deleteAsset,
  deleteScene,
  getMediaProject,
  listMediaProjects,
  patchAudioTrack,
  patchScene,
  reorderScene,
  upsertMediaProject,
} from '../../data/mediaStudioRepo';

type Tab = 'video' | 'images';

const STYLE_PRESETS: Array<{ id: MediaProject['stylePreset']; label: string; promptHint: string }> = [
  { id: 'luxury', label: 'Luxury', promptHint: 'ultra-premium, high-end, wealthy, elegant, cinematic lighting' },
  { id: 'cinematic', label: 'Cinematic', promptHint: 'cinematic, anamorphic, dramatic lighting, film grain, high contrast' },
  { id: 'modern', label: 'Modern', promptHint: 'clean, modern, minimalist, premium UI, high detail' },
  { id: 'bold', label: 'Bold', promptHint: 'bold, high-impact, vibrant, powerful, confident, energetic' },
  { id: 'minimal', label: 'Minimal', promptHint: 'minimal, simple composition, crisp, refined, negative space' },
];

function safeJsonParse<T>(raw: string): T {
  const t = (raw || '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  const slice = start >= 0 && end >= start ? t.slice(start, end + 1) : t;
  return JSON.parse(slice) as T;
}

export default function AdminMediaStudioPage() {
  const navigate = useNavigate();
  const features = useMemo(() => getFeatureFlags(), []);

  const [tab, setTab] = useState<Tab>('video');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [exportDestination, setExportDestination] = useState<
    'download' | 'resources_private' | 'resources_public' | 'testimonial_draft' | 'testimonial_published'
  >('download');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');

  const projects = useMemo(() => listMediaProjects(), [version]);
  const [activeId, setActiveId] = useState<string | null>(projects[0]?.id ?? null);
  const active = useMemo(() => (activeId ? getMediaProject(activeId) : undefined), [activeId, version]);

  const [topic, setTopic] = useState('Build business credit to buy a brand-new commercial building');
  const [sceneCount, setSceneCount] = useState(6);

  const [imgPrompt, setImgPrompt] = useState('A luxurious platinum-and-gold credit dashboard UI, ultra-premium, cinematic, high detail');
  const [imgResults, setImgResults] = useState<Array<{ dataUrl: string; mimeType: string }>>([]);

  const canUse = features.aiGateway && features.videoStudio;
  const supabaseOk = isSupabaseConfigured;

  const ensureProject = () => {
    if (active) return active;
    const p = createMediaProject({ title: 'Media Studio Project', aspect: '16:9', stylePreset: 'luxury' });
    setActiveId(p.id);
    setVersion((v) => v + 1);
    return p;
  };

  const patchProject = (patch: Partial<MediaProject>) => {
    const p = ensureProject();
    upsertMediaProject({ ...p, ...patch });
    setVersion((v) => v + 1);
  };

  const addCharacterReference = async (file: File) => {
    const p = ensureProject();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read character image.'));
      reader.readAsDataURL(file);
    });
    const fallbackName = file.name.replace(/\.[^.]+$/, '') || 'Character';
    const name = window.prompt('Character reference name?', fallbackName)?.trim() || fallbackName;
    const notes = window.prompt('Optional character notes (outfit, voice, gesture, identity cues)?')?.trim() || undefined;
    patchProject({
      characterRefs: [
        { id: `char_${Date.now().toString(16)}`, name, notes, imageDataUrl: dataUrl, createdAt: new Date().toISOString() },
        ...((p.characterRefs ?? []) as any),
      ],
    });
    setNotice(`Character reference saved: ${name}`);
  };

  const deleteCharacterReference = (characterId: string) => {
    const p = ensureProject();
    const nextRefs = (p.characterRefs ?? []).filter((c) => c.id !== characterId);
    const scenes = p.scenes.map((s) => ({
      ...s,
      characterRefIds: (s.characterRefIds ?? []).filter((id) => id !== characterId),
    }));
    upsertMediaProject({ ...p, characterRefs: nextRefs, scenes });
    setVersion((v) => v + 1);
  };

  const regenerateStoryboard = async () => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      if (!canUse) throw new Error('Media Studio requires Feature Flags: aiGateway + videoStudio.');
      const p = ensureProject();
      const preset = STYLE_PRESETS.find((s) => s.id === p.stylePreset) ?? STYLE_PRESETS[0];
      const size = aspectToSize(p.aspect);

      const out = await callAiGateway({
        taskType: 'video.storyboard.json',
        responseFormat: 'json',
        messages: [
          {
            role: 'system',
            content:
              'You are a world-class creative director and performance marketer. Return ONLY valid JSON.\n' +
              'Schema:\n' +
              '{ "title": string, "scenes": [ { "prompt": string, "caption": string, "durationSec": number } ] }\n' +
              'Rules:\n' +
              '- scenes length must equal requested count\n' +
              '- durationSec must be 3-8\n' +
              '- prompts must be image-generation friendly, no brand trademarks, no watermarks\n' +
              '- keep captions short, powerful, and premium\n',
          },
          {
            role: 'user',
            content:
              `Topic: ${topic.trim()}\n` +
              `Style: ${preset.label} (${preset.promptHint})\n` +
              `Aspect: ${p.aspect} (video ${size.width}x${size.height})\n` +
              `Scene count: ${Math.max(2, Math.min(12, sceneCount))}\n` +
              `Make it feel like Finely Cred: platinum + gold luxury, high trust, elite.\n`,
          },
        ],
      });

      type Story = { title?: string; scenes: Array<{ prompt: string; caption: string; durationSec: number }> };
      const story = safeJsonParse<Story>(out.text);
      const scenes = (story?.scenes ?? []).slice(0, Math.max(2, Math.min(12, sceneCount)));
      if (!scenes.length) throw new Error('Storyboard returned no scenes.');

      const next: MediaProject = {
        ...p,
        title: (story.title || p.title || 'Media Studio Project').slice(0, 120),
        scenes: scenes.map((s, idx) => ({
          id: `${p.id}_s_${idx}_${Date.now().toString(16)}`,
          prompt: String(s.prompt || '').trim(),
          caption: String(s.caption || '').trim(),
          durationSec: Math.max(3, Math.min(8, Math.round(Number(s.durationSec || 4)))),
          imageDataUrl: undefined,
          motionPrompt: '',
          voiceoverText: '',
          characterRefIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      };
      upsertMediaProject(next);
      setActiveId(next.id);
      setVersion((v) => v + 1);
      setNotice(`Storyboard generated (${scenes.length} scenes) via ${out.provider}/${out.model}. Now generate images per scene.`);
    } catch (e: any) {
      setErr(e?.message || 'Storyboard generation failed.');
    } finally {
      setBusy(false);
    }
  };

  const generateSceneImage = async (sceneId: string) => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      if (!canUse) throw new Error('Media Studio requires Feature Flags: aiGateway + videoStudio.');
      const p = ensureProject();
      const scene = p.scenes.find((s) => s.id === sceneId);
      if (!scene) throw new Error('Scene not found.');
      const preset = STYLE_PRESETS.find((s) => s.id === p.stylePreset) ?? STYLE_PRESETS[0];
      const size = aspectToSize(p.aspect);

      const continuity = buildCharacterContinuityPrompt(p, scene);
      const prompt =
        `${scene.prompt}\n` +
        `Style: ${preset.promptHint}\n` +
        `${continuity}\n` +
        `No text overlays, no watermarks, no logos. Ultra-high quality.\n`;

      const gen = await generateImages({
        prompt,
        size: size.imageSize,
        quality: 'high',
        style: 'vivid',
        n: 1,
        idempotencyKey: `scene:${p.id}:${sceneId}:${prompt.slice(0, 64)}`,
      });
      const img = gen.images[0];
      if (!img?.dataUrl) throw new Error('No image returned.');
      patchScene(p.id, sceneId, { imageDataUrl: img.dataUrl });
      setVersion((v) => v + 1);
      setNotice(`Image generated via ${gen.provider}/${gen.model}.`);
    } catch (e: any) {
      setErr(e?.message || 'Image generation failed.');
    } finally {
      setBusy(false);
    }
  };

  const generateAllMissingSceneImages = async () => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      if (!canUse) throw new Error('Media Studio requires Feature Flags: aiGateway + videoStudio.');
      const p = ensureProject();
      const missing = p.scenes.filter((s) => !s.imageDataUrl);
      if (!missing.length) {
        setNotice('All scenes already have images.');
        return;
      }
      for (let i = 0; i < missing.length; i++) {
        const s = missing[i]!;
        setNotice(`Generating scene images… (${i + 1}/${missing.length})`);
        // eslint-disable-next-line no-await-in-loop
        await generateSceneImage(s.id);
      }
      setNotice(`Generated images for ${missing.length} scenes.`);
    } catch (e: any) {
      setErr(e?.message || 'Batch image generation failed.');
    } finally {
      setBusy(false);
    }
  };

  const generateSceneVideo = (sceneId: string) => {
    const p = ensureProject();
    const provider = p.videoProvider ?? 'browser_slideshow';
    if (provider === 'browser_slideshow') {
      setNotice('Browser slideshow uses the existing Export video path. Generate scene images, then export.');
      return;
    }
    patchScene(p.id, sceneId, {
      videoStatus: 'failed',
      videoError: `Provider '${provider}' is not connected yet. Add API edge function in Phase 2.`,
    } as any);
    setVersion((v) => v + 1);
    setErr(`Provider '${provider}' is not connected yet. Add API edge function in Phase 2.`);
  };

  const generateAllSceneVideos = () => {
    const p = ensureProject();
    const provider = p.videoProvider ?? 'browser_slideshow';
    if (provider === 'browser_slideshow') {
      setNotice('Browser slideshow uses the existing Export video path. Generate scene images, then export.');
      return;
    }
    setErr(`Provider '${provider}' is not connected yet. Add API edge function in Phase 2.`);
  };

  const generateSceneVoiceover = async (sceneId: string) => {
    const p = ensureProject();
    const scene = p.scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    try {
      patchScene(p.id, sceneId, { voiceoverStatus: 'generating' } as any);
      setVersion((v) => v + 1);
      await generateVoiceover({ provider: p.voiceProvider ?? 'manual_upload', text: scene.voiceoverText ?? '' });
      patchScene(p.id, sceneId, { voiceoverStatus: 'complete' } as any);
      setVersion((v) => v + 1);
    } catch (e: any) {
      patchScene(p.id, sceneId, { voiceoverStatus: 'failed' } as any);
      setVersion((v) => v + 1);
      setErr(e?.message || 'Voiceover generation failed.');
    }
  };

  const generateAllVoiceovers = async () => {
    const p = ensureProject();
    if ((p.voiceProvider ?? 'manual_upload') === 'manual_upload') {
      setNotice('Manual upload selected. Upload a voiceover track in Audio tracks.');
      return;
    }
    setErr(`Voice provider '${p.voiceProvider}' is not connected yet. Phase 2 required.`);
  };

  const exportVideo = async () => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    setExportProgress(0);
    setExportStatusText('Preparing export...');
    try {
      const p = ensureProject();
      const preset = MEDIA_RENDER_PRESETS.find((x) => x.id === (p as any).renderPresetId) ?? null;
      const size = preset ? { width: preset.width, height: preset.height, imageSize: aspectToSize(p.aspect).imageSize } : aspectToSize(p.aspect);
      const scenes = p.scenes
        .filter((s) => s.imageDataUrl)
        .map((s) => ({
          id: s.id,
          imageDataUrl: s.imageDataUrl!,
          caption: s.caption,
          durationSec: s.durationSec,
          transition: (s as any).transition,
        }));
      if (!scenes.length) throw new Error('Generate at least one scene image before exporting.');
      const store = getBlobStore();
      const audioTracks = (p.audioTracks ?? [])
        .slice(0, 6)
        .map((t) => t)
        .filter((t) => t && t.blobRef);
      const audioBlobs: Array<{ blob: Blob; volume?: number; startSec?: number; endSec?: number }> = [];
      for (const t of audioTracks) {
        // eslint-disable-next-line no-await-in-loop
        const blob = await store.get(t.blobRef as any);
        if (!blob) continue;
        audioBlobs.push({
          blob,
          volume: t.volume,
          startSec: t.startSec,
          endSec: t.endSec,
        });
      }

      const blob = await exportScenesToWebm({
        scenes,
        width: size.width,
        height: size.height,
        fps: preset?.fps ?? 30,
        captionStyle: (p as any).captionStyle,
        audioTracks: audioBlobs.length ? audioBlobs : undefined,
        onProgress: (progress, statusText) => {
          setExportProgress(progress);
          setExportStatusText(statusText);
        },
      });
      const safe = (p.title || 'finely-video').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      downloadBlob(blob, `${safe || 'finely-video'}.webm`);

      if (exportDestination === 'resources_private' || exportDestination === 'resources_public') {
        const { ref } = await store.put(blob, { kind: 'resource_video', source: 'media_studio', projectId: p.id, title: p.title });
        upsertResourceVideo({
          title: `${(p.title || 'Media Studio Video').trim()} (Media Studio)`,
          desc: 'Exported from Media Studio.',
          blobRef: ref,
          mimeType: blob.type || 'video/webm',
          isPublic: exportDestination === 'resources_public',
        });
        addRenderHistory(p.id, { presetId: preset?.id ?? 'custom', filename: `${safe || 'finely-video'}.webm`, blobRef: ref });
        window.dispatchEvent(new CustomEvent('finely:store'));
        setVersion((v) => v + 1);
        setNotice(
          `Video exported (WebM) and saved to Resource videos (${exportDestination === 'resources_public' ? 'public' : 'private'}).`,
        );
        return;
      }

      if (exportDestination === 'testimonial_draft' || exportDestination === 'testimonial_published') {
        const { ref } = await store.put(blob, { kind: 'testimonial_video', source: 'media_studio', projectId: p.id, title: p.title });
        const tenantId = getActiveTenantId();
        const t = createVideoTestimonial(tenantId);
        upsertTestimonial({
          ...t,
          title: (p.title || 'Media Studio Video').trim() || t.title,
          service: 'Media Studio',
          visibility: exportDestination === 'testimonial_published' ? 'published' : 'draft',
          blobRef: ref,
          blobMimeType: blob.type || 'video/webm',
          embedUrl: undefined,
        } as any);
        addRenderHistory(p.id, {
          presetId: preset?.id ?? 'custom',
          filename: `${safe || 'finely-video'}.webm`,
          blobRef: ref,
          note: 'testimonial',
        });
        window.dispatchEvent(new CustomEvent('finely:store'));
        setVersion((v) => v + 1);
        setNotice(
          `Video exported (WebM) and saved to Testimonials (${exportDestination === 'testimonial_published' ? 'published' : 'draft'}).`,
        );
        return;
      }

      addRenderHistory(p.id, { presetId: preset?.id ?? 'custom', filename: `${safe || 'finely-video'}.webm`, note: 'downloaded' });
      setVersion((v) => v + 1);
      setNotice('Video exported (WebM).');
    } catch (e: any) {
      setErr(e?.message || 'Export failed.');
      setExportStatusText('Export failed.');
    } finally {
      setBusy(false);
    }
  };

  const runImageGen = async () => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      if (!canUse) throw new Error('Media Studio requires Feature Flags: aiGateway + videoStudio.');
      const gen = await generateImages({
        prompt: imgPrompt.trim(),
        size: '1024x1024',
        quality: 'high',
        style: 'vivid',
        n: 2,
        idempotencyKey: `img:${imgPrompt.slice(0, 80)}`,
      });
      setImgResults(gen.images);
      setNotice(`Generated ${gen.images.length} images via ${gen.provider}/${gen.model}.`);
    } catch (e: any) {
      setErr(e?.message || 'Image generation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      badge="Admin"
      title="AI Media Studio"
      subtitle="Heavy ML for images + video storyboards. Generate premium visuals, edit scenes, and export downloadable assets."
      back={{ to: -1 }}
    >
      <div className="space-y-6">
        {!canUse || !supabaseOk ? (
          <div className="fc-panel p-6 text-white/70 text-sm space-y-3">
            <div className="text-white font-semibold">Media Studio setup required</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Feature Flags: enable <span className="text-white/85 font-semibold">AI Gateway</span> and{' '}
                <span className="text-white/85 font-semibold">Video Studio</span> in <span className="text-white/85 font-semibold">Admin Settings → Features</span>.
              </li>
              <li>
                Supabase: configure <span className="font-mono">VITE_SUPABASE_URL</span> + <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> and deploy the{' '}
                <span className="font-mono">ai-gateway</span> edge function.
              </li>
            </ul>
            <div className="text-white/50 text-xs">
              Image generation is admin-allowlisted server-side to prevent abuse/cost spikes (configure <span className="font-mono">EDGE_ADMIN_EMAILS</span> in Supabase).
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button type="button" onClick={() => navigate('/admin/settings')} className="fc-button-brand">
                Open Admin Settings
              </button>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono flex items-center gap-3">
                <span className={canUse ? 'text-emerald-300' : 'text-white/50'}>flags:{canUse ? 'ok' : 'missing'}</span>
                <span className={supabaseOk ? 'text-emerald-300' : 'text-white/50'}>supabase:{supabaseOk ? 'ok' : 'missing'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
              <div className="fc-card p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white font-semibold">Projects</div>
                  <button
                    type="button"
                    className="fc-button-brand"
                    onClick={() => {
                      const p = createMediaProject({ title: 'New Media Project', aspect: '16:9', stylePreset: 'luxury' });
                      setActiveId(p.id);
                      setVersion((v) => v + 1);
                    }}
                  >
                    <Plus size={14} /> New
                  </button>
                </div>

                <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                  {projects.map((p) => {
                    const activeRow = p.id === activeId;
                    return (
                      <div key={p.id} className={`rounded-2xl border p-4 ${activeRow ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-black/30'}`}>
                        <button type="button" className="w-full text-left" onClick={() => setActiveId(p.id)}>
                          <div className="text-white font-semibold truncate">{p.title}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            {p.aspect} • scenes: {p.scenes.length}
                          </div>
                        </button>
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            className="fc-button-soft"
                            onClick={() => {
                              deleteMediaProject(p.id);
                              if (activeId === p.id) setActiveId(null);
                              setVersion((v) => v + 1);
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {!projects.length && <div className="text-white/50 text-sm">No projects yet.</div>}
                </div>
              </div>

              <div className="fc-panel p-5 space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Studio tabs</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('video')}
                    className={tab === 'video' ? 'fc-button-brand' : 'fc-button-soft'}
                  >
                    <Film size={14} /> Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('images')}
                    className={tab === 'images' ? 'fc-button-brand' : 'fc-button-soft'}
                  >
                    <ImageIcon size={14} /> Images
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              {err && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 text-sm">{err}</div>}
              {notice && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100 text-sm">{notice}</div>}

              {tab === 'images' ? (
                <div className="space-y-4">
                  <div className="fc-card p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 text-amber-400">
                        <ImageIcon size={18} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Image Generator</span>
                      </div>
                      <button type="button" className="fc-button-brand" onClick={runImageGen} disabled={busy}>
                        <Sparkles size={14} /> Generate
                      </button>
                    </div>
                    <textarea
                      value={imgPrompt}
                      onChange={(e) => setImgPrompt(e.target.value)}
                      className="w-full min-h-[120px] rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Describe the image you want…"
                    />
                  </div>

                  <div className="fc-panel p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white font-semibold">Results</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{imgResults.length} image(s)</div>
                    </div>
                    {imgResults.length === 0 ? (
                      <div className="text-white/55 text-sm">Generate images to see results here.</div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {imgResults.map((img, idx) => (
                          <div key={idx} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                            <img src={img.dataUrl} className="w-full rounded-xl border border-white/10" />
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                className="fc-button-soft w-full"
                                onClick={() => downloadDataUrl(img.dataUrl, `finely-image-${idx + 1}.png`)}
                              >
                                <Download size={14} /> PNG
                              </button>
                              <button
                                type="button"
                                className="fc-button-brand w-full"
                                onClick={() => {
                                  const p = ensureProject();
                                  addAsset(p.id, { kind: 'image', prompt: imgPrompt.trim(), dataUrl: img.dataUrl, mimeType: img.mimeType });
                                  setVersion((v) => v + 1);
                                  setNotice('Saved to project gallery.');
                                }}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="fc-card p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white font-semibold">Project gallery</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{(active?.assets ?? []).length} asset(s)</div>
                    </div>
                    {!active?.assets?.length ? (
                      <div className="text-white/55 text-sm">No saved assets yet. Save an image result or generate a scene image.</div>
                    ) : (
                      <div className="grid md:grid-cols-3 gap-3">
                        {(active.assets ?? []).slice(0, 12).map((a) => (
                          <div key={a.id} className="rounded-2xl border border-white/10 bg-black/30 p-3 space-y-2">
                            <img src={a.dataUrl} className="w-full rounded-xl border border-white/10" />
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                className="fc-button-soft"
                                onClick={() => downloadDataUrl(a.dataUrl, `asset-${a.id}.png`)}
                              >
                                <Download size={14} />
                              </button>
                              <button
                                type="button"
                                className="fc-button-soft"
                                onClick={() => {
                                  if (!active) return;
                                  deleteAsset(active.id, a.id);
                                  setVersion((v) => v + 1);
                                }}
                                title="Delete asset"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="fc-card p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 text-amber-400">
                        <Bot size={18} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Video Builder</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="fc-button-soft" onClick={() => {
                          const p = ensureProject();
                          addScene(p.id, {});
                          setVersion((v) => v + 1);
                        }}>
                          <Plus size={14} /> Add scene
                        </button>
                        <button
                          type="button"
                          className="fc-button-soft"
                          onClick={() => void generateAllMissingSceneImages()}
                          disabled={busy}
                          title="Generate images for all scenes missing images"
                        >
                          <Sparkles size={14} /> Batch images
                        </button>
                        <select
                          value={exportDestination}
                          onChange={(e) => setExportDestination(e.target.value as any)}
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white/80"
                          title="Save destination"
                        >
                          <option value="download">Download only</option>
                          <option value="resources_private">Save to Resources (private)</option>
                          <option value="resources_public">Save to Resources (public)</option>
                          <option value="testimonial_draft">Save to Testimonials (draft)</option>
                          <option value="testimonial_published">Save to Testimonials (published)</option>
                        </select>
                        <button type="button" className="fc-button-brand" onClick={exportVideo} disabled={busy}>
                          <Download size={14} /> Export video
                        </button>
                      </div>
                    </div>

                    {exportStatusText ? (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <div className="flex items-center justify-between gap-3 text-xs text-emerald-100">
                          <span>{exportStatusText}</span>
                          <span className="font-mono">{exportProgress}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-black/40 overflow-hidden">
                          <div className="h-full bg-emerald-400 transition-all" style={{ width: `${Math.max(0, Math.min(100, exportProgress))}%` }} />
                        </div>
                      </div>
                    ) : null}

                    {!active ? (
                      <div className="text-white/60 text-sm">Create or select a project.</div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        <label className="block">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Project title</div>
                          <input
                            value={active.title}
                            onChange={(e) => {
                              upsertMediaProject({ ...active, title: e.target.value });
                              setVersion((v) => v + 1);
                            }}
                            className="fc-input mt-2"
                          />
                        </label>
                        <label className="block">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Aspect</div>
                          <select
                            value={active.aspect}
                            onChange={(e) => {
                              upsertMediaProject({ ...active, aspect: e.target.value as Aspect });
                              setVersion((v) => v + 1);
                            }}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
                          >
                            <option value="16:9">16:9 (YouTube / widescreen)</option>
                            <option value="9:16">9:16 (Reels / Shorts)</option>
                            <option value="1:1">1:1 (Square)</option>
                          </select>
                        </label>
                        <label className="block md:col-span-2">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Style preset</div>
                          <select
                            value={active.stylePreset}
                            onChange={(e) => {
                              upsertMediaProject({ ...active, stylePreset: e.target.value as any });
                              setVersion((v) => v + 1);
                            }}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
                          >
                            {STYLE_PRESETS.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block md:col-span-2">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Render preset</div>
                          <select
                            value={String((active as any).renderPresetId || MEDIA_RENDER_PRESETS[0]?.id)}
                            onChange={(e) => {
                              upsertMediaProject({ ...active, renderPresetId: e.target.value });
                              setVersion((v) => v + 1);
                            }}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
                          >
                            {MEDIA_RENDER_PRESETS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label} ({p.width}×{p.height})
                              </option>
                            ))}
                          </select>
                          <div className="mt-1 text-white/45 text-xs">Tip: match the preset to your aspect (16:9 vs 9:16).</div>
                        </label>

                        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2 text-white/80">
                              <SlidersHorizontal size={16} className="text-amber-300" />
                              <div className="text-xs font-semibold uppercase tracking-wider">Captions</div>
                            </div>
                            <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
                              <input
                                type="checkbox"
                                checked={Boolean((active as any).captionStyle?.enabled ?? true)}
                                onChange={(e) => {
                                  upsertMediaProject({
                                    ...active,
                                    captionStyle: {
                                      enabled: e.target.checked,
                                      position: (active as any).captionStyle?.position ?? 'bottom',
                                      backgroundOpacity: Number((active as any).captionStyle?.backgroundOpacity ?? 0.55),
                                    },
                                  } as any);
                                  setVersion((v) => v + 1);
                                }}
                                className="accent-amber-500"
                              />
                              Enabled
                            </label>
                          </div>

                          <div className="mt-3 grid md:grid-cols-2 gap-4">
                            <label className="block">
                              <div className="text-[10px] uppercase tracking-widest text-white/40">Position</div>
                              <select
                                value={String((active as any).captionStyle?.position ?? 'bottom')}
                                onChange={(e) => {
                                  upsertMediaProject({
                                    ...active,
                                    captionStyle: {
                                      enabled: Boolean((active as any).captionStyle?.enabled ?? true),
                                      position: e.target.value as any,
                                      backgroundOpacity: Number((active as any).captionStyle?.backgroundOpacity ?? 0.55),
                                    },
                                  } as any);
                                  setVersion((v) => v + 1);
                                }}
                                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
                              >
                                <option value="bottom">bottom</option>
                                <option value="top">top</option>
                              </select>
                            </label>
                            <label className="block">
                              <div className="text-[10px] uppercase tracking-widest text-white/40">Background opacity</div>
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={Number((active as any).captionStyle?.backgroundOpacity ?? 0.55)}
                                onChange={(e) => {
                                  upsertMediaProject({
                                    ...active,
                                    captionStyle: {
                                      enabled: Boolean((active as any).captionStyle?.enabled ?? true),
                                      position: (active as any).captionStyle?.position ?? 'bottom',
                                      backgroundOpacity: Number(e.target.value),
                                    },
                                  } as any);
                                  setVersion((v) => v + 1);
                                }}
                                className="mt-4 w-full"
                              />
                              <div className="mt-1 text-white/45 text-xs font-mono">
                                {Number((active as any).captionStyle?.backgroundOpacity ?? 0.55).toFixed(2)}
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {active ? (
                    <div className="fc-card p-6 space-y-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="inline-flex items-center gap-2 text-amber-400">
                            <Video size={18} />
                            <span className="text-xs font-semibold uppercase tracking-wider">AI Provider Setup</span>
                          </div>
                          <div className="mt-1 text-white/55 text-sm">Phase 1 shell for long-form AI video, voiceover, and character continuity.</div>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">provider-ready</div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <label className="block">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Video provider</div>
                          <select
                            value={active.videoProvider ?? 'browser_slideshow'}
                            onChange={(e) => patchProject({ videoProvider: e.target.value as VideoProvider })}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
                          >
                            <option value="browser_slideshow">Browser slideshow (current exporter)</option>
                            <option value="gemini_veo">Gemini / Veo (Phase 2)</option>
                            <option value="runway">Runway (Phase 2)</option>
                            <option value="luma">Luma (Phase 2)</option>
                            <option value="kling">Kling (Phase 2)</option>
                            <option value="manual">Manual clip upload (Phase 2)</option>
                          </select>
                        </label>
                        <label className="block">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Voice provider</div>
                          <select
                            value={active.voiceProvider ?? 'manual_upload'}
                            onChange={(e) => patchProject({ voiceProvider: e.target.value as VoiceProvider })}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
                          >
                            <option value="manual_upload">Manual upload (current audio flow)</option>
                            <option value="elevenlabs">ElevenLabs (Phase 2)</option>
                            <option value="openai_voice">OpenAI Voice (Phase 2)</option>
                          </select>
                        </label>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 text-white/80">
                            <UserRound size={16} className="text-amber-300" />
                            <div className="text-xs font-semibold uppercase tracking-wider">Character memory</div>
                          </div>
                          <label className="fc-button-soft cursor-pointer">
                            <Plus size={14} /> Upload character
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                e.currentTarget.value = '';
                                if (!f) return;
                                try {
                                  await addCharacterReference(f);
                                } catch (err2: any) {
                                  setErr(err2?.message || 'Failed to add character reference.');
                                }
                              }}
                            />
                          </label>
                        </div>

                        {!(active.characterRefs ?? []).length ? (
                          <div className="text-white/55 text-sm">No character references yet. Upload a face/character image to reuse across scenes.</div>
                        ) : (
                          <div className="grid md:grid-cols-3 gap-3">
                            {(active.characterRefs ?? []).map((c) => (
                              <div key={c.id} className="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-2">
                                <img src={c.imageDataUrl} className="w-full aspect-square object-cover rounded-xl border border-white/10" />
                                <div className="text-white font-semibold text-sm truncate">{c.name}</div>
                                {c.notes ? <div className="text-white/50 text-xs line-clamp-2">{c.notes}</div> : null}
                                <button type="button" className="fc-button-soft w-full" onClick={() => deleteCharacterReference(c.id)}>
                                  <Trash2 size={14} /> Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="fc-panel p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-white font-semibold">AI storyboard</div>
                      <button type="button" className="fc-button-brand" onClick={regenerateStoryboard} disabled={busy}>
                        <Sparkles size={14} /> Generate storyboard
                      </button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <label className="block md:col-span-2">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Topic</div>
                        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="fc-input mt-2" />
                      </label>
                      <label className="block">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Scenes</div>
                        <input
                          type="number"
                          min={2}
                          max={12}
                          value={sceneCount}
                          onChange={(e) => setSceneCount(Math.max(2, Math.min(12, parseInt(e.target.value || '6', 10))))}
                          className="fc-input mt-2"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="fc-card p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 text-amber-400">
                        <Music2 size={18} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Audio tracks</span>
                      </div>
                      <div className="text-white/50 text-xs">Music beds + voiceovers (upload audio files).</div>
                    </div>

                    {!active ? (
                      <div className="text-white/60 text-sm">Select a project.</div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 text-[10px] font-black uppercase tracking-widest text-white/80 hover:bg-white/[0.03] cursor-pointer">
                            <Plus size={14} /> Add music
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                e.currentTarget.value = '';
                                if (!f) return;
                                try {
                                  const store = getBlobStore();
                                  const { ref } = await store.put(f, { kind: 'media_audio', projectId: active.id, title: f.name, trackKind: 'music' });
                                  addAudioTrack(active.id, { kind: 'music', title: f.name, blobRef: ref, volume: 0.28 });
                                  setVersion((v) => v + 1);
                                  setNotice('Music track added.');
                                } catch (err2: any) {
                                  setErr(err2?.message || 'Failed to add audio track.');
                                }
                              }}
                            />
                          </label>
                          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 text-[10px] font-black uppercase tracking-widest text-white/80 hover:bg-white/[0.03] cursor-pointer">
                            <Plus size={14} /> Add voiceover
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                e.currentTarget.value = '';
                                if (!f) return;
                                try {
                                  const store = getBlobStore();
                                  const { ref } = await store.put(f, { kind: 'media_audio', projectId: active.id, title: f.name, trackKind: 'voiceover' });
                                  addAudioTrack(active.id, { kind: 'voiceover', title: f.name, blobRef: ref, volume: 0.9 });
                                  setVersion((v) => v + 1);
                                  setNotice('Voiceover track added.');
                                } catch (err2: any) {
                                  setErr(err2?.message || 'Failed to add audio track.');
                                }
                              }}
                            />
                          </label>
                        </div>

                        {(active.audioTracks ?? []).length === 0 ? (
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60 text-sm">
                            No audio tracks yet. Add a music bed (low volume) or a voiceover track.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(active.audioTracks ?? []).map((t) => (
                              <div key={t.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{t.kind}</div>
                                    <div className="mt-1 text-white font-semibold truncate">{t.title}</div>
                                    <div className="mt-1 text-white/50 text-xs font-mono truncate">{t.blobRef}</div>
                                  </div>
                                  <button
                                    type="button"
                                    className="fc-button-soft"
                                    onClick={() => {
                                      deleteAudioTrack(active.id, t.id);
                                      setVersion((v) => v + 1);
                                    }}
                                    title="Remove track"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>

                                <div className="grid md:grid-cols-3 gap-3">
                                  <label className="block md:col-span-2">
                                    <div className="text-[10px] uppercase tracking-widest text-white/40">Volume</div>
                                    <input
                                      type="range"
                                      min={0}
                                      max={1}
                                      step={0.05}
                                      value={Number(t.volume ?? 0.35)}
                                      onChange={(e) => {
                                        patchAudioTrack(active.id, t.id, { volume: Number(e.target.value) });
                                        setVersion((v) => v + 1);
                                      }}
                                      className="mt-4 w-full"
                                    />
                                  </label>
                                  <div className="text-white/45 text-xs font-mono md:pt-7">{Number(t.volume ?? 0.35).toFixed(2)}</div>
                                  <label className="block">
                                    <div className="text-[10px] uppercase tracking-widest text-white/40">Start (sec)</div>
                                    <input
                                      type="number"
                                      min={0}
                                      value={t.startSec ?? 0}
                                      onChange={(e) => {
                                        patchAudioTrack(active.id, t.id, { startSec: Math.max(0, Number(e.target.value) || 0) });
                                        setVersion((v) => v + 1);
                                      }}
                                      className="fc-input mt-2"
                                    />
                                  </label>
                                  <label className="block">
                                    <div className="text-[10px] uppercase tracking-widest text-white/40">End (sec)</div>
                                    <input
                                      type="number"
                                      min={0}
                                      value={t.endSec ?? ''}
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        patchAudioTrack(active.id, t.id, { endSec: raw === '' ? undefined : Math.max(0, Number(raw) || 0) });
                                        setVersion((v) => v + 1);
                                      }}
                                      className="fc-input mt-2"
                                      placeholder="(optional)"
                                    />
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="fc-panel p-6 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white font-semibold">Render history</div>
                      <div className="text-white/50 text-xs">Last exports for this project</div>
                    </div>
                    {!active?.renderHistory?.length ? (
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60 text-sm">No exports yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {(active.renderHistory ?? []).slice(0, 8).map((r) => (
                          <div key={r.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-white/85 font-semibold text-sm truncate">{r.filename}</div>
                              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                {r.presetId} • {new Date(r.createdAt).toLocaleString()}
                              </div>
                              {r.note ? <div className="mt-1 text-white/50 text-xs">{r.note}</div> : null}
                            </div>
                            {r.blobRef ? <div className="text-white/40 text-xs font-mono truncate">{r.blobRef}</div> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="fc-card p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white font-semibold">Scenes</div>
                      <div className="text-white/50 text-xs">Generate an image per scene, then export.</div>
                    </div>
                    {!active?.scenes?.length ? (
                      <div className="text-white/60 text-sm">No scenes yet. Generate a storyboard or add a scene.</div>
                    ) : (
                      <div className="space-y-4">
                        {active.scenes.map((s, idx) => (
                          <div key={s.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="text-white/60 text-xs font-mono">Scene {idx + 1}</div>
                              <div className="flex flex-wrap gap-2">
                                <button type="button" className="fc-button-soft" onClick={() => {
                                  reorderScene(active.id, s.id, 'up');
                                  setVersion((v) => v + 1);
                                }}>
                                  <ArrowUp size={14} />
                                </button>
                                <button type="button" className="fc-button-soft" onClick={() => {
                                  reorderScene(active.id, s.id, 'down');
                                  setVersion((v) => v + 1);
                                }}>
                                  <ArrowDown size={14} />
                                </button>
                                <button type="button" className="fc-button-soft" onClick={() => deleteScene(active.id, s.id) && setVersion((v) => v + 1)}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 grid lg:grid-cols-12 gap-4">
                              <div className="lg:col-span-5 space-y-3">
                                {s.imageDataUrl ? (
                                  <img src={s.imageDataUrl} className="w-full rounded-2xl border border-white/10" />
                                ) : (
                                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-white/50 text-sm text-center">
                                    No image yet
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                  <button type="button" className="fc-button-brand" onClick={() => generateSceneImage(s.id)} disabled={busy}>
                                    <Sparkles size={14} /> {s.imageDataUrl ? 'Regenerate' : 'Generate'}
                                  </button>
                                  <button
                                    type="button"
                                    className="fc-button-soft"
                                    disabled={!s.imageDataUrl}
                                    onClick={() => s.imageDataUrl && downloadDataUrl(s.imageDataUrl, `scene-${idx + 1}.png`)}
                                  >
                                    <Download size={14} /> PNG
                                  </button>
                                </div>
                              </div>
                              <div className="lg:col-span-7 space-y-4">
                                <label className="block">
                                  <div className="text-[10px] uppercase tracking-widest text-white/40">Image prompt</div>
                                  <textarea
                                    value={s.prompt}
                                    onChange={(e) => {
                                      patchScene(active.id, s.id, { prompt: e.target.value });
                                      setVersion((v) => v + 1);
                                    }}
                                    className="mt-2 w-full min-h-[110px] rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                                  />
                                </label>
                                <div className="grid md:grid-cols-3 gap-3">
                                  <label className="block md:col-span-2">
                                    <div className="text-[10px] uppercase tracking-widest text-white/40">Caption</div>
                                    <input
                                      value={s.caption}
                                      onChange={(e) => {
                                        patchScene(active.id, s.id, { caption: e.target.value });
                                        setVersion((v) => v + 1);
                                      }}
                                      className="fc-input mt-2"
                                    />
                                  </label>
                                  <label className="block">
                                    <div className="text-[10px] uppercase tracking-widest text-white/40">Duration (sec)</div>
                                    <input
                                      type="number"
                                      min={3}
                                      max={10}
                                      value={s.durationSec}
                                      onChange={(e) => {
                                        const v = Math.max(3, Math.min(10, parseInt(e.target.value || '4', 10)));
                                        patchScene(active.id, s.id, { durationSec: v });
                                        setVersion((x) => x + 1);
                                      }}
                                      className="fc-input mt-2"
                                    />
                                  </label>
                                </div>

                                <div className="grid md:grid-cols-3 gap-3">
                                  <label className="block">
                                    <div className="text-[10px] uppercase tracking-widest text-white/40">Transition</div>
                                    <select
                                      value={String((s as any).transition?.type ?? 'cut')}
                                      onChange={(e) => {
                                        const type = e.target.value;
                                        if (type === 'fade') {
                                          patchScene(active.id, s.id, { transition: { type: 'fade', durationSec: (s as any).transition?.durationSec ?? 0.5 } } as any);
                                        } else {
                                          patchScene(active.id, s.id, { transition: { type: 'cut' } } as any);
                                        }
                                        setVersion((v) => v + 1);
                                      }}
                                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
                                    >
                                      <option value="cut">cut</option>
                                      <option value="fade">fade</option>
                                    </select>
                                  </label>
                                  <label className="block">
                                    <div className="text-[10px] uppercase tracking-widest text-white/40">Fade (sec)</div>
                                    <input
                                      type="number"
                                      min={0.1}
                                      max={2}
                                      step={0.1}
                                      value={Number((s as any).transition?.type === 'fade' ? ((s as any).transition?.durationSec ?? 0.5) : 0.5)}
                                      onChange={(e) => {
                                        const v = Math.max(0.1, Math.min(2, Number(e.target.value) || 0.5));
                                        patchScene(active.id, s.id, { transition: { type: 'fade', durationSec: v } } as any);
                                        setVersion((x) => x + 1);
                                      }}
                                      disabled={String((s as any).transition?.type ?? 'cut') !== 'fade'}
                                      className="fc-input mt-2 disabled:opacity-60"
                                    />
                                  </label>
                                  <div className="text-white/45 text-xs md:pt-7">
                                    Fade blends into the next scene (best for smooth reels).
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 space-y-3">
                                  <div className="inline-flex items-center gap-2 text-amber-300">
                                    <Video size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">AI Video & Voice Controls</span>
                                  </div>
                                  <label className="block">
                                    <div className="text-[10px] uppercase tracking-widest text-white/40">Motion prompt</div>
                                    <input
                                      value={s.motionPrompt ?? ''}
                                      onChange={(e) => {
                                        patchScene(active.id, s.id, { motionPrompt: e.target.value });
                                        setVersion((v) => v + 1);
                                      }}
                                      placeholder="Camera pushes in, subject gestures confidently, subtle parallax..."
                                      className="fc-input mt-2"
                                    />
                                  </label>
                                  <label className="block">
                                    <div className="text-[10px] uppercase tracking-widest text-white/40">Voiceover text</div>
                                    <textarea
                                      value={s.voiceoverText ?? ''}
                                      onChange={(e) => {
                                        patchScene(active.id, s.id, { voiceoverText: e.target.value });
                                        setVersion((v) => v + 1);
                                      }}
                                      placeholder="Write the line an AI voice should speak for this scene..."
                                      className="mt-2 w-full min-h-[80px] rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                                    />
                                  </label>
                                  <label className="block">
                                    <div className="text-[10px] uppercase tracking-widest text-white/40">Attached character</div>
                                    <select
                                      value={(s.characterRefIds ?? [])[0] ?? ''}
                                      onChange={(e) => {
                                        patchScene(active.id, s.id, { characterRefIds: e.target.value ? [e.target.value] : [] });
                                        setVersion((v) => v + 1);
                                      }}
                                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
                                    >
                                      <option value="">None</option>
                                      {(active.characterRefs ?? []).map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                      ))}
                                    </select>
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    <button type="button" className="fc-button-soft" onClick={() => generateSceneVideo(s.id)}>
                                      <Video size={14} /> Generate scene video
                                    </button>
                                    <button type="button" className="fc-button-soft" onClick={() => void generateSceneVoiceover(s.id)}>
                                      <Mic2 size={14} /> Generate voiceover
                                    </button>
                                  </div>
                                  {s.videoError ? <div className="text-red-200 text-xs">{s.videoError}</div> : null}
                                  {s.voiceoverStatus ? <div className="text-white/45 text-xs font-mono">voiceover: {s.voiceoverStatus}</div> : null}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button type="button" className="fc-button-soft" onClick={generateAllSceneVideos}>
                        <Video size={14} /> Generate all scene videos
                      </button>
                      <button type="button" className="fc-button-soft" onClick={() => void generateAllVoiceovers()}>
                        <Mic2 size={14} /> Generate all voiceovers
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="text-white/45 text-xs">
                Export format: WebM. For MP4 delivery, we can add a server-side transcode step later (FFmpeg on a worker) without changing the editor UI.
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
