import React, { useMemo, useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, Clapperboard, Download, Film, Image as ImageIcon, Mic2, Play, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { callAiGateway } from '../../lib/aiClient';
import { generateImages } from '../../lib/imageGenClient';
import { downloadBlob, exportScenesToWebm } from '../../lib/mediaExport';
import { aspectToSize, MEDIA_RENDER_PRESETS, type Aspect, type MediaProject } from '../../domain/mediaStudio';
import { addAudioTrack, addRenderHistory, createMediaProject, deleteAudioTrack, deleteMediaProject, getMediaProject, listMediaProjects, patchScene, upsertMediaProject } from '../../data/mediaStudioRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { renderContentStudioNarration, scriptFromVideoPlan } from './contentStudioVoice';
import { upsertResourceVideo } from '../../data/resourceVideosRepo';
import { buildAiStoryboardPrompt, buildFallbackVideoPlan, convertPlanToMediaProject, normalizeVideoRequest, summarizePlan } from './mediaCommandBrain';
import { CONTENT_STUDIO_CAPABILITIES, SUPER_VIDEO_TIERS } from './contentStudioPresets';
import { deleteVideoCommandPlan, listMediaPromptHistory, listVideoCommandPlans, saveVideoCommandPlan } from './studioCommandRepo';
import type { VideoCommandPlan, VideoCommandRequest } from './types';
import { StudioActionDeck, StudioKpiCards, StudioSection } from './StudioKpiCards';
import { saveContentStudioAsset, listContentStudioAssets, deleteContentStudioAsset } from './contentStudioRepo';
import { ContentStudioVideoPreview } from './ContentStudioVideoPreview';

function parseJson<T>(text: string): T | null {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const slice = start >= 0 && end >= start ? text.slice(start, end + 1) : text;
    return JSON.parse(slice) as T;
  } catch {
    return null;
  }
}

function cleanFilename(s: string) {
  return (s || 'finely-video').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'finely-video';
}

function planFromAiJson(raw: any, request: VideoCommandRequest): VideoCommandPlan | null {
  if (!raw || !Array.isArray(raw.scenes)) return null;
  const fallback = buildFallbackVideoPlan(request);
  const scenes = raw.scenes.slice(0, 18).map((s: any, idx: number) => ({
    id: `scene_${idx + 1}`,
    beat: String(s.beat || s.title || fallback.scenes[idx]?.beat || `Scene ${idx + 1}`),
    durationSec: Math.max(2, Math.min(10, Math.round(Number(s.durationSec || fallback.scenes[idx]?.durationSec || 4)))),
    visualPrompt: String(s.visualPrompt || s.imagePrompt || fallback.scenes[idx]?.visualPrompt || request.prompt),
    motionPrompt: String(s.motionPrompt || fallback.scenes[idx]?.motionPrompt || 'Subtle cinematic motion, polished and professional.'),
    caption: String(s.caption || fallback.scenes[idx]?.caption || ''),
    voiceover: String(s.voiceover || fallback.scenes[idx]?.voiceover || ''),
    callout: s.callout ? String(s.callout) : fallback.scenes[idx]?.callout,
    complianceNote: s.complianceNote ? String(s.complianceNote) : fallback.scenes[idx]?.complianceNote,
  }));
  return {
    ...fallback,
    id: `video_plan_${Date.now().toString(16)}`,
    title: String(raw.title || fallback.title).slice(0, 120),
    hook: String(raw.hook || fallback.hook),
    cta: String(raw.cta || fallback.cta),
    scenes,
    totalDurationSec: scenes.reduce((a: number, b: any) => a + b.durationSec, 0),
    platformCutdowns: Array.isArray(raw.platformCutdowns) ? raw.platformCutdowns.slice(0, 8) : fallback.platformCutdowns,
    renderChecklist: Array.isArray(raw.renderChecklist) ? raw.renderChecklist.slice(0, 12).map(String) : fallback.renderChecklist,
    complianceFlags: Array.isArray(raw.complianceFlags) ? raw.complianceFlags.slice(0, 12).map(String) : fallback.complianceFlags,
  };
}

export function GeminiStyleVideoCommand({ initialRequest }: { initialRequest?: Partial<VideoCommandRequest> }) {
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<{
    blobRef: string;
    filename: string;
    title: string;
    assetId?: string;
    projectId: string;
  } | null>(null);
  const [request, setRequest] = useState<VideoCommandRequest>(() =>
    normalizeVideoRequest({
      prompt: 'Make a 28-second Finely Cred commercial for business credit readiness in Dallas. It should feel premium, direct, and make people want to download the guide or book a consultation.',
      durationSec: 28,
      aspect: '9:16',
      intent: 'business_credit_education',
      offer: 'Business Credit E-Guide',
      audience: 'business owners who want funding readiness',
      city: 'Dallas',
      ...initialRequest,
    }),
  );

  const plans = useMemo(() => listVideoCommandPlans(), [version]);
  const promptHistory = useMemo(() => listMediaPromptHistory(), [version]);
  const projects = useMemo(() => listMediaProjects(), [version]);
  const videoAssets = useMemo(
    () => listContentStudioAssets().filter((a) => a.assetType === 'video' && a.blobRef),
    [version, lastExport?.assetId],
  );
  const activePlan = useMemo(() => plans.find((p) => p.id === activePlanId) ?? plans[0] ?? null, [plans, activePlanId]);
  const activeProject = useMemo(() => (activeProjectId ? getMediaProject(activeProjectId) : projects[0]), [activeProjectId, projects, version]);

  const kpis = useMemo(() => [
    { label: 'Prompt-to-video', value: 'Primary', hint: 'Type once, generate scenes, VO, captions, render plan', tone: 'amber' as const },
    { label: 'Target clip', value: `${request.durationSec}s`, hint: `${request.aspect} • ${request.visualStyle} • ${request.intent}`, tone: 'sky' as const },
    { label: 'Saved plans', value: plans.length, hint: 'Reusable briefs and storyboards', tone: 'violet' as const },
    { label: 'Projects', value: projects.length, hint: 'Scene/image/export workspace', tone: 'emerald' as const },
  ], [request, plans.length, projects.length]);

  async function generatePlan(mode: 'ai' | 'fallback' = 'ai') {
    setBusy(true); setErr(null); setNotice(null);
    try {
      const normalized = normalizeVideoRequest(request);
      let plan: VideoCommandPlan | null = null;
      if (mode === 'ai') {
        const ai = buildAiStoryboardPrompt(normalized);
        try {
          const out = await callAiGateway({
            taskType: ai.taskType,
            responseFormat: 'json',
            messages: [
              { role: 'system', content: ai.system },
              { role: 'user', content: ai.user },
            ],
          });
          const parsed = parseJson<any>(out.text);
          plan = parsed ? planFromAiJson(parsed, normalized) : null;
        } catch (e: any) {
          plan = null;
          setNotice(`AI plan fell back to local planner: ${e?.message || 'gateway unavailable'}`);
        }
      }
      if (!plan) plan = buildFallbackVideoPlan(normalized);
      saveVideoCommandPlan(plan);
      setActivePlanId(plan.id);
      setRequest(normalized);
      setVersion((v) => v + 1);
      setNotice(`Video command generated: ${summarizePlan(plan)}`);
    } catch (e: any) {
      setErr(e?.message || 'Video plan failed.');
    } finally { setBusy(false); }
  }

  function createProjectFromPlan(plan: VideoCommandPlan) {
    const p = createMediaProject({ title: plan.title, aspect: plan.request.aspect, stylePreset: plan.request.visualStyle as any });
    const next = convertPlanToMediaProject(plan, p);
    upsertMediaProject(next);
    setActiveProjectId(next.id);
    setVersion((v) => v + 1);
    setNotice('Project created from plan. Generate scene visuals next.');
  }

  async function generateSceneVisuals(project: MediaProject) {
    setBusy(true); setErr(null); setNotice(null);
    try {
      const size = aspectToSize(project.aspect);
      const missing = project.scenes.filter((s) => !s.imageDataUrl);
      if (!missing.length) { setNotice('All scenes already have visuals.'); return; }
      for (let i = 0; i < missing.length; i += 1) {
        const s = missing[i];
        setNotice(`Generating scene visual ${i + 1}/${missing.length}…`);
        // eslint-disable-next-line no-await-in-loop
        const gen = await generateImages({
          prompt: `${s.prompt}\nNo logos, no watermarks, no text overlays. Premium Finely Cred cinematic style.`,
          size: size.imageSize,
          quality: 'high',
          style: 'vivid',
          n: 1,
          idempotencyKey: `studio-command:${project.id}:${s.id}:${s.prompt.slice(0, 70)}`,
        });
        const img = gen.images[0];
        if (img?.dataUrl) patchScene(project.id, s.id, { imageDataUrl: img.dataUrl });
      }
      setVersion((v) => v + 1);
      setNotice(`Generated visuals for ${missing.length} scene(s).`);
    } catch (e: any) {
      setErr(e?.message || 'Scene visual generation failed.');
    } finally { setBusy(false); }
  }

  async function generateNarrationFromPlan(plan: VideoCommandPlan) {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      const script = scriptFromVideoPlan(plan);
      const rendered = await renderContentStudioNarration({
        contentId: plan.id,
        title: plan.title,
        script,
        voiceDirection: 'Premium Finely Cred video narration — warm authority, compliance-safe.',
      });
      if (activeProject) {
        addAudioTrack(activeProject.id, {
          kind: 'voiceover',
          title: `${plan.title} narration`,
          blobRef: rendered.blobRef,
          volume: 0.9,
        });
        setVersion((v) => v + 1);
      }
      setNotice('Narration rendered and saved. Attach to a media project or export with voiceover mixed in.');
    } catch (e: any) {
      setErr(e?.message || 'Narration render failed.');
    } finally {
      setBusy(false);
    }
  }

  async function exportProject(project: MediaProject) {
    setBusy(true); setErr(null); setNotice(null);
    try {
      const preset = MEDIA_RENDER_PRESETS.find((p) => p.id === project.renderPresetId) ?? MEDIA_RENDER_PRESETS.find((p) => project.aspect === '9:16' ? p.id.includes('1080x1920') : p.id.includes('1080p')) ?? MEDIA_RENDER_PRESETS[0];
      const scenes = project.scenes.filter((s) => s.imageDataUrl).map((s) => ({ id: s.id, imageDataUrl: s.imageDataUrl!, caption: s.caption, durationSec: s.durationSec, transition: s.transition }));
      if (!scenes.length) throw new Error('Generate visuals before exporting video.');
      const store = getBlobStore();
      const audioBlobs: Array<{ blob: Blob; volume?: number; startSec?: number; endSec?: number }> = [];
      for (const t of (project.audioTracks ?? []).slice(0, 6)) {
        // eslint-disable-next-line no-await-in-loop
        const audio = await store.get(t.blobRef);
        if (audio) audioBlobs.push({ blob: audio, volume: t.volume, startSec: t.startSec, endSec: t.endSec });
      }
      const blob = await exportScenesToWebm({
        scenes,
        width: preset.width,
        height: preset.height,
        fps: preset.fps,
        captionStyle: project.captionStyle,
        audioTracks: audioBlobs.length ? audioBlobs : undefined,
      });
      const filename = `${cleanFilename(project.title)}.webm`;
      downloadBlob(blob, filename);
      const { ref } = await store.put(blob, { kind: 'content_studio_video', source: 'content_studio', projectId: project.id, title: project.title });
      const resource = upsertResourceVideo({
        title: `${project.title} (Content Studio)`,
        desc: 'Generated and exported from Content Studio. Review before making public.',
        blobRef: ref,
        mimeType: blob.type || 'video/webm',
        tags: ['content-studio', project.aspect, project.stylePreset],
        isPublic: false,
      });
      const asset = saveContentStudioAsset({
        title: project.title,
        assetType: 'video',
        status: 'needs_review',
        provider: 'ffmpeg',
        blobRef: ref,
        summary: `Rendered ${project.scenes.length} scene(s) as ${filename}. Saved to Resources as ${resource.title}.`,
        publishTargets: ['resources', 'download_only'],
        complianceNotes: ['Resource video is private by default. Review copy, claims, captions, and target page before publishing.'],
      });
      addRenderHistory(project.id, { presetId: preset.id, filename, blobRef: ref, note: 'Content Studio export + private Resource video' });
      setLastExport({ blobRef: ref, filename, title: project.title, assetId: asset.id, projectId: project.id });
      setVersion((v) => v + 1);
      setNotice('Video rendered — preview below. Approve, publish, or delete from your library.');
    } catch (e: any) { setErr(e?.message || 'Export failed.'); }
    finally { setBusy(false); }
  }

  async function uploadProjectAudio(project: MediaProject, file: File, kind: 'music' | 'voiceover') {
    setBusy(true); setErr(null); setNotice(null);
    try {
      const store = getBlobStore();
      const { ref } = await store.put(file, { kind: 'content_studio_audio', source: 'content_studio', projectId: project.id, title: file.name, trackKind: kind });
      addAudioTrack(project.id, {
        kind,
        title: file.name,
        blobRef: ref,
        volume: kind === 'voiceover' ? 0.9 : 0.25,
      });
      setVersion((v) => v + 1);
      setNotice(`${kind === 'voiceover' ? 'Voiceover' : 'Music'} track added. It will be mixed into the next export.`);
    } catch (e: any) {
      setErr(e?.message || 'Audio upload failed.');
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      {lastExport ? (
        <div className="rounded-[2rem] border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-black/40 to-violet-500/10 p-5 md:p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300 font-black">Just rendered</div>
              <h3 className="mt-1 text-xl font-black text-white">{lastExport.title}</h3>
              <p className="mt-1 text-sm text-white/55">{lastExport.filename} · saved to assets + private resources</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="fc-button-soft"
                onClick={() => {
                  void (async () => {
                    const b = await getBlobStore().get(lastExport.blobRef);
                    if (b) downloadBlob(b, lastExport.filename);
                  })();
                }}
              >
                <Download size={14} /> Download again
              </button>
              <button
                type="button"
                className="fc-button-soft"
                onClick={() => {
                  if (lastExport.assetId) deleteContentStudioAsset(lastExport.assetId);
                  setLastExport(null);
                  setVersion((v) => v + 1);
                  setNotice('Removed from Content Studio assets.');
                }}
              >
                <Trash2 size={14} /> Delete asset
              </button>
            </div>
          </div>
          <ContentStudioVideoPreview blobRef={lastExport.blobRef} />
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-white/45">
            <span className="rounded-full border border-white/10 px-3 py-1">Next: approve in Assets workroom</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Publish to Resources</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Attach to course or lead magnet</span>
          </div>
        </div>
      ) : null}

      {videoAssets.length > 0 ? (
        <StudioSection eyebrow="Your videos" title={`${videoAssets.length} rendered video(s)`}>
          <div className="grid gap-4 md:grid-cols-2">
            {videoAssets.slice(0, 6).map((a) => (
              <div key={a.id} className="rounded-3xl border border-white/10 bg-black/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-white font-bold truncate">{a.title}</div>
                  <button
                    type="button"
                    className="text-white/35 hover:text-rose-300"
                    onClick={() => {
                      deleteContentStudioAsset(a.id);
                      if (lastExport?.assetId === a.id) setLastExport(null);
                      setVersion((v) => v + 1);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {a.blobRef ? <ContentStudioVideoPreview blobRef={a.blobRef} /> : null}
                <div className="text-[10px] uppercase tracking-widest text-white/40">{a.status} · {a.provider || 'render'}</div>
              </div>
            ))}
          </div>
        </StudioSection>
      ) : null}

      <div className="rounded-[2rem] border border-amber-400/25 bg-gradient-to-br from-amber-500/14 via-violet-500/8 to-black/40 p-5 md:p-7 space-y-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-amber-200 font-black">Super video generator</div>
          <h2 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">Type once — storyboard, scenes, visuals, voice, captions, export</h2>
          <p className="mt-2 text-sm text-white/60 max-w-3xl">Gemini-style planning, image scene generation, ElevenLabs voice upload path, and WebM export. Pick a tier or customize duration up to 3 minutes.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SUPER_VIDEO_TIERS.map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() =>
                setRequest((r) =>
                  normalizeVideoRequest({
                    ...r,
                    durationSec: tier.durationSec,
                    aspect: tier.aspect,
                    intent: tier.intent,
                  }),
                )
              }
              className={`rounded-2xl border p-4 text-left transition ${
                request.durationSec === tier.durationSec && request.aspect === tier.aspect
                  ? 'border-amber-400/50 bg-amber-500/12'
                  : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
              }`}
            >
              <div className="text-white font-black">{tier.label}</div>
              <div className="mt-1 text-xs text-white/45">{tier.hint}</div>
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONTENT_STUDIO_CAPABILITIES.map((cap) => (
            <div key={cap.label} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <div className="text-xs font-black uppercase tracking-widest text-amber-200">{cap.label}</div>
              <div className="mt-1 text-xs text-white/50">{cap.hint}</div>
            </div>
          ))}
        </div>
      </div>

      <StudioKpiCards items={kpis} />
      {err && <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-100 text-sm">{err}</div>}
      {notice && <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100 text-sm inline-flex gap-3"><CheckCircle2 size={18} />{notice}</div>}

      <StudioSection
        eyebrow="Gemini-style video command"
        title="Type the video you want. The system builds the plan, scenes, captions, voiceover, and render path."
        right={<button type="button" className="fc-button-brand" onClick={() => void generatePlan('ai')} disabled={busy}><Wand2 size={15} /> Generate video plan</button>}
      >
        <div className="rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-amber-500/12 via-white/[0.04] to-black/30 p-5 md:p-7 space-y-5">
          <textarea
            value={request.prompt}
            onChange={(e) => setRequest((r) => ({ ...r, prompt: e.target.value }))}
            className="w-full min-h-[160px] md:min-h-[220px] rounded-[1.75rem] border border-white/10 bg-black/45 px-5 py-4 text-white/90 placeholder:text-white/25 text-base md:text-lg leading-relaxed focus:outline-none focus:border-amber-400/60"
            placeholder="Example: Create a 28-second business credit guide video for Houston business owners. Make it premium, urgent but compliant, with a strong CTA to download the e-guide."
          />
          <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-3">
            <label className="block"><div className="text-[10px] uppercase tracking-widest text-white/40">Duration</div><input type="number" value={request.durationSec} min={6} max={180} onChange={(e) => setRequest((r) => ({ ...r, durationSec: Number(e.target.value) || 28 }))} className="fc-input mt-2" /></label>
            <label className="block"><div className="text-[10px] uppercase tracking-widest text-white/40">Aspect</div><select value={request.aspect} onChange={(e) => setRequest((r) => ({ ...r, aspect: e.target.value as Aspect }))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"><option value="9:16">9:16 Reels/Shorts</option><option value="16:9">16:9 YouTube</option><option value="1:1">1:1 Square</option></select></label>
            <label className="block"><div className="text-[10px] uppercase tracking-widest text-white/40">Intent</div><select value={request.intent} onChange={(e) => setRequest((r) => ({ ...r, intent: e.target.value as any }))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"><option value="lead_magnet_ad">Lead magnet ad</option><option value="business_credit_education">Business credit education</option><option value="tradeline_explainer">Tradeline explainer</option><option value="funding_readiness">Funding readiness</option><option value="recruiting_ad">Recruiting ad</option><option value="authority_clip">Authority clip</option><option value="event_promo">Event promo</option></select></label>
            <label className="block"><div className="text-[10px] uppercase tracking-widest text-white/40">Visual style</div><select value={request.visualStyle} onChange={(e) => setRequest((r) => ({ ...r, visualStyle: e.target.value as any }))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"><option value="luxury">Luxury</option><option value="cinematic">Cinematic</option><option value="modern">Modern</option><option value="bold">Bold</option><option value="minimal">Minimal</option></select></label>
            <label className="block"><div className="text-[10px] uppercase tracking-widest text-white/40">Voice</div><select value={request.voiceStyle} onChange={(e) => setRequest((r) => ({ ...r, voiceStyle: e.target.value as any }))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"><option value="none">No voice</option><option value="warm_authority">Warm authority</option><option value="luxury_confident">Luxury confident</option><option value="direct_operator">Direct operator</option><option value="friendly_educator">Friendly educator</option></select></label>
            <label className="block"><div className="text-[10px] uppercase tracking-widest text-white/40">City</div><input value={request.city ?? ''} onChange={(e) => setRequest((r) => ({ ...r, city: e.target.value }))} className="fc-input mt-2" placeholder="Dallas" /></label>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input value={request.audience} onChange={(e) => setRequest((r) => ({ ...r, audience: e.target.value }))} className="fc-input" placeholder="Audience" />
            <input value={request.offer} onChange={(e) => setRequest((r) => ({ ...r, offer: e.target.value }))} className="fc-input" placeholder="Offer / funnel" />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="fc-button-brand" onClick={() => void generatePlan('ai')} disabled={busy}><Sparkles size={15} /> Create 28-sec clip plan</button>
            <button type="button" className="fc-button-soft" onClick={() => void generatePlan('fallback')} disabled={busy}><Bot size={15} /> Local planner</button>
          </div>
          {promptHistory.length ? <div className="flex gap-2 overflow-x-auto pb-1">{promptHistory.slice(0, 8).map((p) => <button key={p} className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 hover:text-white" onClick={() => setRequest((r) => ({ ...r, prompt: p }))}>{p.slice(0, 52)}…</button>)}</div> : null}
        </div>
      </StudioSection>

      <StudioSection eyebrow="storyboard deck" title="Generated video plans" right={<div className="text-[10px] uppercase tracking-widest text-white/40">{plans.length} saved</div>}>
        {!plans.length ? <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/55">Generate a plan to see storyboards here.</div> : (
          <StudioActionDeck items={plans.map((p) => ({ id: p.id, title: p.title, summary: `${p.totalDurationSec}s • ${p.scenes.length} scenes • ${p.cta}` }))} activeId={activePlan?.id} onSelect={(x) => setActivePlanId(x.id)} renderMeta={(x) => <div className="text-[10px] uppercase tracking-widest text-white/40">Open storyboard</div>} />
        )}
      </StudioSection>

      {activePlan ? (
        <StudioSection eyebrow="active storyboard" title={activePlan.title} right={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="fc-button-soft" onClick={() => void generateNarrationFromPlan(activePlan)} disabled={busy}><Mic2 size={14} /> Render narration</button>
            <button className="fc-button-brand" type="button" onClick={() => createProjectFromPlan(activePlan)}><Plus size={14} /> Build media project</button>
          </div>
        }>
          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="text-[10px] uppercase tracking-widest text-white/40">Hook</div><div className="mt-3 text-white font-semibold leading-relaxed">{activePlan.hook}</div></div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="text-[10px] uppercase tracking-widest text-white/40">CTA</div><div className="mt-3 text-white font-semibold leading-relaxed">{activePlan.cta}</div></div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="text-[10px] uppercase tracking-widest text-white/40">Safety</div><div className="mt-3 text-white font-semibold leading-relaxed">{activePlan.complianceFlags.join(', ') || 'Review required'}</div></div>
          </div>
          <div className="space-y-4">
            {activePlan.scenes.map((s, idx) => (
              <div key={s.id} className="rounded-3xl border border-white/10 bg-black/35 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3"><div className="text-amber-200 font-black">Scene {idx + 1}</div><div className="text-white/40 text-xs font-mono">{s.durationSec}s</div></div>
                <div className="text-white font-semibold">{s.beat}</div>
                <div className="text-sm text-white/60 leading-relaxed">{s.visualPrompt}</div>
                {s.caption ? <div className="rounded-2xl border border-amber-400/15 bg-amber-500/10 p-3 text-amber-100 text-sm">Caption: {s.caption}</div> : null}
                {s.voiceover ? <div className="rounded-2xl border border-sky-400/15 bg-sky-500/10 p-3 text-sky-100 text-sm inline-flex gap-2"><Mic2 size={15} /> {s.voiceover}</div> : null}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">{activePlan.renderChecklist.map((c) => <span key={c} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60">{c}</span>)}</div>
          <button type="button" className="fc-button-soft" onClick={() => { deleteVideoCommandPlan(activePlan.id); setActivePlanId(null); setVersion((v) => v + 1); }}><Trash2 size={14} /> Delete plan</button>
        </StudioSection>
      ) : null}

      <StudioSection eyebrow="project rendering" title="Media projects without the cramped side rail" right={activeProject ? <button type="button" className="fc-button-brand" onClick={() => void generateSceneVisuals(activeProject)} disabled={busy}><ImageIcon size={14} /> Generate missing visuals</button> : null}>
        <div className="grid md:grid-cols-3 gap-4">
          {projects.slice(0, 9).map((p) => <button key={p.id} type="button" onClick={() => setActiveProjectId(p.id)} className={`rounded-3xl border p-5 text-left ${activeProject?.id === p.id ? 'border-amber-400/40 bg-amber-500/10' : 'border-white/10 bg-white/[0.035]'}`}><div className="text-white font-bold truncate">{p.title}</div><div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">{p.aspect} • {p.scenes.length} scene(s)</div></button>)}
          {!projects.length ? <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-white/55">No projects yet. Build one from a video plan.</div> : null}
        </div>
        {activeProject ? <div className="rounded-[2rem] border border-white/10 bg-black/30 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-white font-black text-xl">{activeProject.title}</div><div className="mt-1 text-white/45 text-xs uppercase tracking-widest">{activeProject.scenes.filter((s) => s.imageDataUrl).length}/{activeProject.scenes.length} visuals ready</div></div><div className="flex flex-wrap gap-2"><button type="button" className="fc-button-brand" onClick={() => void exportProject(activeProject)} disabled={busy}><Download size={14} /> Export WebM</button><button type="button" className="fc-button-soft" onClick={() => { deleteMediaProject(activeProject.id); setActiveProjectId(null); setVersion((v) => v + 1); }}><Trash2 size={14} /> Delete</button></div></div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-white font-bold">Audio tracks</div>
                <div className="mt-1 text-xs text-white/45">Upload narration or music; export will mix up to 6 tracks.</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="fc-button-soft cursor-pointer">
                  <Mic2 size={14} /> Voiceover
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.currentTarget.files?.[0];
                      e.currentTarget.value = '';
                      if (f) void uploadProjectAudio(activeProject, f, 'voiceover');
                    }}
                  />
                </label>
                <label className="fc-button-soft cursor-pointer">
                  <Film size={14} /> Music bed
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.currentTarget.files?.[0];
                      e.currentTarget.value = '';
                      if (f) void uploadProjectAudio(activeProject, f, 'music');
                    }}
                  />
                </label>
              </div>
            </div>
            {(activeProject.audioTracks ?? []).length ? (
              <div className="grid md:grid-cols-2 gap-2">
                {(activeProject.audioTracks ?? []).map((t) => (
                  <div key={t.id} className="rounded-2xl border border-white/10 bg-black/25 p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white text-sm font-semibold truncate">{t.title}</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40">{t.kind} • volume {Math.round(t.volume * 100)}%</div>
                    </div>
                    <button type="button" className="fc-button-soft" onClick={() => { deleteAudioTrack(activeProject.id, t.id); setVersion((v) => v + 1); }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : <div className="text-sm text-white/45">No audio yet.</div>}
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{activeProject.scenes.map((s, idx) => <div key={s.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 space-y-3">{s.imageDataUrl ? <img src={s.imageDataUrl} className="w-full rounded-2xl border border-white/10 aspect-video object-cover" /> : <div className="rounded-2xl border border-white/10 bg-black/40 aspect-video grid place-items-center text-white/40 text-sm">No visual</div>}<div className="text-white font-semibold">Scene {idx + 1}</div><div className="text-sm text-white/60 line-clamp-3">{s.caption || s.prompt}</div></div>)}</div>
        </div> : null}
      </StudioSection>
    </div>
  );
}
