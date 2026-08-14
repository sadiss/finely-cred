import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clapperboard,
  Download,
  Megaphone,
  Sparkles,
  Star,
  Wand2,
} from 'lucide-react';
import { callAiGateway } from '../../lib/aiClient';
import { downloadBlob } from '../../lib/mediaExport';
import { renderScene, renderVoice, stitchProject } from '../../lib/mediaProviderRouter';
import type { MediaProject } from '../../domain/mediaStudio';
import {
  addAudioTrack,
  addRenderHistory,
  createMediaProject,
  getMediaProject,
  patchScene,
  upsertMediaProject,
} from '../../data/mediaStudioRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { upsertResourceVideo } from '../../data/resourceVideosRepo';
import { HUNT_LANE_PRESETS } from '../leadIntel/leadEnginePlaybooks';
import { getMarketingFindGeo } from '../marketingDesk/marketingDeskHunt';
import { buildVideoCommandPromoteUrl } from '../../lib/videoCommandService';
import { getVideoCommandRecord } from '../../data/videoCommandRecordRepo';
import {
  FINELY_OS_COMPACT_TEXTAREA,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_HEADER,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsDeckTile,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../os/FinelyOsModalCloseButton';
import {
  buildAiStoryboardPrompt,
  buildFallbackVideoPlan,
  convertPlanToMediaProject,
  normalizeVideoRequest,
  summarizePlan,
} from './mediaCommandBrain';
import { scriptFromVideoPlan } from './contentStudioVoice';
import { saveVideoCommandPlan } from './studioCommandRepo';
import { saveContentStudioAsset } from './contentStudioRepo';
import { exportToPresenterReference, runAutoProductionPipeline } from '../../lib/presenterVideoQualityBridge';
import { ContentStudioVideoPreview } from './ContentStudioVideoPreview';
import { VideoCreationCopilotPanel } from './VideoCreationCopilotPanel';
import { mergeVideoCopilotBrief } from './videoCreationCopilotBrain';
import {
  assignTransitionForScene,
  buildScenePrompt,
  getVideoStylePreset,
  VIDEO_STYLE_PRESETS,
} from '../../domain/videoStylePresets';
import { VideoTimelineEditor } from './VideoTimelineEditor';
import type { VideoCommandPlan, VideoCommandRequest, VideoScenePlan } from './types';
import type { LeadEngineLane } from '../leadIntel/leadEngineAutonomy';

export type VideoCreateWizardPresetId = 'reel_28' | 'ad_60' | 'guide_promo' | 'city_spotlight';

const WIZARD_PRESETS: Array<{
  id: VideoCreateWizardPresetId;
  label: string;
  hint: string;
  request: Partial<VideoCommandRequest>;
}> = [
  {
    id: 'reel_28',
    label: '28s Reel',
    hint: 'Shorts · TikTok · Reels',
    request: { durationSec: 28, aspect: '9:16', intent: 'lead_magnet_ad' },
  },
  {
    id: 'ad_60',
    label: '60s Ad',
    hint: 'Meta · YouTube pre-roll',
    request: { durationSec: 60, aspect: '16:9', intent: 'business_credit_education' },
  },
  {
    id: 'guide_promo',
    label: 'Guide promo',
    hint: 'Lead magnet hero clip',
    request: { durationSec: 45, aspect: '9:16', intent: 'funding_readiness', offer: 'Free credit guide' },
  },
  {
    id: 'city_spotlight',
    label: 'City spotlight',
    hint: 'Local metro + lane CTA',
    request: { durationSec: 30, aspect: '9:16', intent: 'authority_clip' },
  },
];

const WIZARD_STEPS = [
  { id: 1, label: 'Plan' },
  { id: 2, label: 'Format' },
  { id: 3, label: 'Scenes' },
  { id: 4, label: 'Edit & Style' },
  { id: 5, label: 'Export' },
] as const;

type WizardStep = (typeof WIZARD_STEPS)[number]['id'];

function parsePlanJson(raw: unknown, request: VideoCommandRequest): VideoCommandPlan | null {
  const data = raw as { scenes?: unknown[]; title?: string; hook?: string; cta?: string };
  if (!data?.scenes?.length) return null;
  const fallback = buildFallbackVideoPlan(request);
  const sceneCount = Math.min(18, data.scenes.length);
  const scenes = data.scenes.slice(0, sceneCount).map((s: any, idx: number) => ({
    id: `scene_${idx + 1}`,
    beat: String(s.beat || s.title || fallback.scenes[idx]?.beat || `Scene ${idx + 1}`),
    durationSec: Math.max(2, Math.min(10, Math.round(Number(s.durationSec || fallback.scenes[idx]?.durationSec || 4)))),
    visualPrompt: buildScenePrompt(
      String(s.visualPrompt || s.imagePrompt || fallback.scenes[idx]?.visualPrompt || request.prompt),
      request.visualStyle,
    ),
    motionPrompt: String(s.motionPrompt || fallback.scenes[idx]?.motionPrompt || getVideoStylePreset(request.visualStyle).motionHint),
    caption: String(s.caption || fallback.scenes[idx]?.caption || ''),
    voiceover: String(s.voiceover || fallback.scenes[idx]?.voiceover || ''),
    callout: s.callout ? String(s.callout) : fallback.scenes[idx]?.callout,
    complianceNote: s.complianceNote ? String(s.complianceNote) : fallback.scenes[idx]?.complianceNote,
    transition: assignTransitionForScene(request.visualStyle, idx, sceneCount),
  }));
  return {
    ...fallback,
    id: `video_plan_${Date.now().toString(16)}`,
    title: String(data.title || fallback.title).slice(0, 120),
    hook: String(data.hook || fallback.hook),
    cta: String(data.cta || fallback.cta),
    scenes,
    totalDurationSec: scenes.reduce((a, b) => a + b.durationSec, 0),
  };
}

export type VideoCreateWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetId?: VideoCreateWizardPresetId;
  initialRequest?: Partial<VideoCommandRequest>;
  promoteVideoId?: string;
  onExported?: () => void;
  /** Fired after blob is stored — use to attach course lesson videos. */
  onExportComplete?: (args: { blobRef: string; filename: string }) => void;
};

export function VideoCreateWizard({
  open,
  onOpenChange,
  presetId,
  initialRequest,
  promoteVideoId,
  onExported,
  onExportComplete,
}: VideoCreateWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);
  const [visualsReady, setVisualsReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lane, setLane] = useState<LeadEngineLane>('credit_restore');
  const [plan, setPlan] = useState<VideoCommandPlan | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [exportBlobRef, setExportBlobRef] = useState<string | null>(null);
  const [exportFilename, setExportFilename] = useState<string | null>(null);
  const [exportAssetId, setExportAssetId] = useState<string | null>(null);
  const [autoProductionDone, setAutoProductionDone] = useState(false);
  const [request, setRequest] = useState<VideoCommandRequest>(() =>
    normalizeVideoRequest({
      prompt: 'Create a premium Finely Cred video that educates partners without overpromising outcomes.',
      durationSec: 28,
      aspect: '9:16',
      intent: 'lead_magnet_ad',
      audience: 'credit-focused partners',
      offer: 'Finely Cred guide',
      city: getMarketingFindGeo(),
      includeCaptions: true,
      complianceStrict: true,
      ...initialRequest,
    }),
  );

  const activePreset = presetId ?? 'reel_28';
  const lanePreset = useMemo(() => HUNT_LANE_PRESETS.find((p) => p.id === lane), [lane]);

  useEffect(() => {
    if (!open) return;
    const preset = WIZARD_PRESETS.find((p) => p.id === activePreset);
    if (preset) {
      setRequest((r) =>
        normalizeVideoRequest({
          ...r,
          ...preset.request,
          ...initialRequest,
          city: initialRequest?.city ?? r.city ?? getMarketingFindGeo(),
        }),
      );
    } else if (initialRequest) {
      setRequest((r) => normalizeVideoRequest({ ...r, ...initialRequest }));
    }
    setStep(1);
    setPlan(null);
    setProjectId(null);
    setExportBlobRef(null);
    setExportAssetId(null);
    setAutoProductionDone(false);
    setVisualsReady(false);
    setErr(null);
    setNotice(null);
  }, [open, activePreset, initialRequest]);

  const applyPreset = (id: VideoCreateWizardPresetId) => {
    const preset = WIZARD_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setRequest((r) => normalizeVideoRequest({ ...r, ...preset.request }));
  };

  const applyCopilotBrief = useCallback((patch: Partial<VideoCommandRequest>, suggestedPreset?: VideoCreateWizardPresetId) => {
    setRequest((r) => normalizeVideoRequest({ ...r, ...mergeVideoCopilotBrief(patch, suggestedPreset) }));
    setNotice('Copilot plan applied — review the brief, then generate scenes.');
  }, []);

  const patchSceneInPlan = useCallback((sceneId: string, patch: Partial<VideoScenePlan>) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const scenes = prev.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s));
      return { ...prev, scenes, totalDurationSec: scenes.reduce((a, b) => a + b.durationSec, 0) };
    });
    if (projectId && patch.durationSec != null) {
      patchScene(projectId, sceneId, { durationSec: patch.durationSec });
    }
  }, [projectId]);

  const reorderSceneInPlan = useCallback((sceneId: string, direction: 'up' | 'down') => {
    setPlan((prev) => {
      if (!prev) return prev;
      const idx = prev.scenes.findIndex((s) => s.id === sceneId);
      if (idx < 0) return prev;
      const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (nextIdx < 0 || nextIdx >= prev.scenes.length) return prev;
      const scenes = [...prev.scenes];
      [scenes[idx], scenes[nextIdx]] = [scenes[nextIdx]!, scenes[idx]!];
      const withTransitions = scenes.map((s, i) => ({
        ...s,
        transition: assignTransitionForScene(prev.request.visualStyle, i, scenes.length),
      }));
      return { ...prev, scenes: withTransitions, totalDurationSec: withTransitions.reduce((a, b) => a + b.durationSec, 0) };
    });
  }, []);

  const regenStill = useCallback(
    async (sceneId: string) => {
      if (!plan || !projectId) return;
      const scene = plan.scenes.find((s) => s.id === sceneId);
      if (!scene) return;
      setBusy(true);
      setErr(null);
      try {
        const project = getMediaProject(projectId);
        if (!project) throw new Error('Project not found.');
        const mediaScene = project.scenes.find((s) => s.prompt === scene.visualPrompt || s.caption === scene.caption);
        const rendered = await renderScene({
          projectId: project.id,
          sceneId: mediaScene?.id ?? sceneId,
          prompt: scene.visualPrompt,
          aspect: project.aspect,
          onProgress: (msg) => setNotice(msg),
        });
        if (rendered.imageDataUrl) {
          patchSceneInPlan(sceneId, { imageDataUrl: rendered.imageDataUrl });
          if (mediaScene) patchScene(project.id, mediaScene.id, { imageDataUrl: rendered.imageDataUrl });
        }
        setNotice('Scene still regenerated.');
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Regen failed.');
      } finally {
        setBusy(false);
      }
    },
    [plan, projectId, patchSceneInPlan],
  );

  const swapSceneStyle = useCallback(
    (sceneId: string) => {
      const cycle = VIDEO_STYLE_PRESETS.filter((p) => !['modern', 'bold'].includes(p.id)).map((p) => p.id);
      setPlan((prev) => {
        if (!prev) return prev;
        const idx = prev.scenes.findIndex((s) => s.id === sceneId);
        if (idx < 0) return prev;
        const currentIdx = cycle.indexOf(prev.request.visualStyle as (typeof cycle)[number]);
        const nextStyle = cycle[(currentIdx + 1) % cycle.length]!;
        const preset = getVideoStylePreset(nextStyle);
        const scenes = prev.scenes.map((s, i) =>
          s.id === sceneId
            ? {
                ...s,
                visualPrompt: buildScenePrompt(s.visualPrompt.split('. Premium')[0] || s.visualPrompt, nextStyle),
                motionPrompt: preset.motionHint,
                transition: assignTransitionForScene(nextStyle, i, prev.scenes.length),
              }
            : s,
        );
        return { ...prev, scenes };
      });
      setNotice('Scene style swapped — transitions updated for this shot.');
    },
    [],
  );

  async function generatePlan() {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      const normalized = normalizeVideoRequest({
        ...request,
        prompt:
          request.prompt +
          (lanePreset ? `\n\nLane: ${lanePreset.label}. Offer path: ${lanePreset.freeGuide}.` : ''),
      });
      let nextPlan: VideoCommandPlan | null = null;
      try {
        const ai = buildAiStoryboardPrompt(normalized);
        const out = await callAiGateway({
          taskType: ai.taskType,
          responseFormat: 'json',
          messages: [
            { role: 'system', content: ai.system },
            { role: 'user', content: ai.user },
          ],
        });
        const start = out.text.indexOf('{');
        const end = out.text.lastIndexOf('}');
        const parsed = start >= 0 && end >= start ? JSON.parse(out.text.slice(start, end + 1)) : null;
        nextPlan = parsed ? parsePlanJson(parsed, normalized) : null;
      } catch {
        nextPlan = null;
      }
      if (!nextPlan) nextPlan = buildFallbackVideoPlan(normalized);
      saveVideoCommandPlan(nextPlan);
      setPlan(nextPlan);
      setRequest(normalized);
      setStep(3);
      setNotice(summarizePlan(nextPlan));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Plan generation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function buildProjectAndVisuals() {
    if (!plan) return;
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      let project: MediaProject;
      if (projectId) {
        project = getMediaProject(projectId)!;
        project = convertPlanToMediaProject(plan, project);
        upsertMediaProject(project);
      } else {
        project = createMediaProject({
          title: plan.title,
          aspect: plan.request.aspect,
          stylePreset: plan.request.visualStyle,
        });
        project = convertPlanToMediaProject(plan, project);
        upsertMediaProject(project);
        setProjectId(project.id);
      }

      const missing = project.scenes.filter((s) => !s.imageDataUrl);
      for (let i = 0; i < missing.length; i += 1) {
        const s = missing[i]!;
        setNotice(`Generating visual ${i + 1}/${missing.length}…`);
        // eslint-disable-next-line no-await-in-loop
        const scene = await renderScene({
          projectId: project.id,
          sceneId: s.id,
          prompt: s.prompt,
          aspect: project.aspect,
          onProgress: (msg) => setNotice(msg),
        });
        if (scene.imageDataUrl) {
          patchScene(project.id, s.id, { imageDataUrl: scene.imageDataUrl });
          const planScene = plan.scenes[i];
          if (planScene) patchSceneInPlan(planScene.id, { imageDataUrl: scene.imageDataUrl });
        }
      }

      try {
        const script = scriptFromVideoPlan(plan);
        const voiced = await renderVoice({
          contentId: plan.id,
          title: plan.title,
          script,
          voicePersonaId: plan.request.voicePersonaId,
          voiceDirection: 'Premium Finely Cred narration — warm authority, compliance-safe.',
        });
        addAudioTrack(project.id, {
          kind: 'voiceover',
          title: `${plan.title} narration`,
          blobRef: voiced.blobRef,
          volume: 0.9,
        });
      } catch {
        /* voice optional offline */
      }

      setVisualsReady(true);
      setStep(4);
      setNotice('Visuals ready — tweak timeline, then export.');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Visual generation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function continueToExport() {
    if (!plan || !projectId) return;
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      const result = await runAutoProductionPipeline({
        plan,
        projectId,
        onProgress: (msg) => setNotice(msg),
      });
      setPlan(result.plan);
      setAutoProductionDone(true);
      setNotice(result.notice);
      setStep(5);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Auto production failed.');
    } finally {
      setBusy(false);
    }
  }

  async function exportVideo() {
    if (!plan || !projectId) return;
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      let activePlan = plan;
      if (!autoProductionDone) {
        const result = await runAutoProductionPipeline({
          plan,
          projectId,
          onProgress: (msg) => setNotice(msg),
        });
        activePlan = result.plan;
        setPlan(result.plan);
        setAutoProductionDone(true);
        if (result.notice) setNotice(result.notice);
      }

      const project = getMediaProject(projectId);
      if (!project) throw new Error('Project not found.');
      const stitched = await stitchProject({ project, plan: activePlan });
      const { blob, filename, presetId } = stitched;
      downloadBlob(blob, filename);
      const store = getBlobStore();
      const { ref } = await store.put(blob, { kind: 'content_studio_video', source: 'wizard', title: activePlan.title });
      upsertResourceVideo({
        title: `${activePlan.title} (Content Studio)`,
        desc: 'Generated via video wizard. Review before publishing publicly.',
        blobRef: ref,
        mimeType: blob.type || 'video/webm',
        tags: ['content-studio', 'wizard', project.aspect],
        isPublic: false,
      });
      const asset = saveContentStudioAsset({
        title: activePlan.title,
        assetType: 'video',
        status: 'needs_review',
        provider: 'ffmpeg',
        blobRef: ref,
        summary: `Wizard export · ${project.scenes.filter((s) => s.imageDataUrl).length} scene(s) · ${filename}`,
        publishTargets: ['resources', 'download_only'],
        complianceNotes: ['Review claims before public publish. Results vary · not legal advice.'],
      });
      addRenderHistory(project.id, { presetId, filename, blobRef: ref, note: 'Video wizard export' });
      setExportBlobRef(ref);
      setExportFilename(filename);
      setExportAssetId(asset.id);
      setNotice('Video exported — download started. Publish or send to Hannah when ready.');
      onExported?.();
      onExportComplete?.({ blobRef: ref, filename });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  }

  const hannahUrl = useMemo(() => {
    const id = promoteVideoId?.trim();
    if (!id) return '/admin/growth-agents/capture-links';
    const record = getVideoCommandRecord(id);
    if (record) return buildVideoCommandPromoteUrl(record);
    return `/admin/growth-agents/capture-links?videoId=${encodeURIComponent(id)}`;
  }, [promoteVideoId]);

  if (!open) return null;

  return (
    <div className={`${FINELY_OS_FIXED_OVERLAY} flex items-start justify-center overflow-y-auto p-4 md:p-8`}>
      <div className={`${FINELY_OS_MODAL_SHELL} relative w-full max-w-4xl !max-h-[min(94vh,920px)]`}>
        <div className={FINELY_OS_MODAL_HEADER}>
          <div>
            <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-300`}>Video wizard · step {step} of 5</p>
            <h2 className={FINELY_OS_ENTITY_TITLE}>Create your video</h2>
          </div>
          <FinelyOsModalCloseButton onClick={() => onOpenChange(false)} aria-label="Close wizard" />
        </div>

        <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-white/10">
          {WIZARD_STEPS.map((s) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <span
                key={s.id}
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                  active
                    ? 'border-amber-400/40 bg-amber-500/15 text-amber-100'
                    : done
                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                      : 'border-white/10 text-white/40'
                }`}
              >
                {s.label}
              </span>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {err ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">{err}</div> : null}
          {notice ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100 inline-flex gap-2">
              <CheckCircle2 size={16} /> {notice}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <VideoCreationCopilotPanel compact onApplyBrief={applyCopilotBrief} />
              <textarea
                value={request.prompt}
                onChange={(e) => setRequest((r) => ({ ...r, prompt: e.target.value }))}
                rows={4}
                className={`${FINELY_OS_COMPACT_TEXTAREA} w-full`}
                placeholder="Describe the video: audience, hook, offer, compliance-safe tone…"
              />
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Next: pick format, aspect, and visual style preset.
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {WIZARD_PRESETS.map((p) => {
                  const active =
                    request.durationSec === p.request.durationSec && request.aspect === p.request.aspect && p.id === activePreset;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      className={`${finelyOsDeckTile('amber', active)} !w-auto px-3 py-2 text-left`}
                    >
                      <div className="text-sm font-bold text-white">{p.label}</div>
                      <div className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{p.hint}</div>
                    </button>
                  );
                })}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Duration (sec)</span>
                  <input
                    type="number"
                    min={6}
                    max={180}
                    value={request.durationSec}
                    onChange={(e) => setRequest((r) => ({ ...r, durationSec: Number(e.target.value) || 28 }))}
                    className="fc-input mt-1"
                  />
                </label>
                <label className="block">
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Aspect</span>
                  <select
                    value={request.aspect}
                    onChange={(e) => setRequest((r) => ({ ...r, aspect: e.target.value as VideoCommandRequest['aspect'] }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/80"
                  >
                    <option value="9:16">9:16 Reels</option>
                    <option value="16:9">16:9 YouTube</option>
                    <option value="1:1">1:1 Square</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Visual style preset</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {VIDEO_STYLE_PRESETS.filter((p) => !['modern', 'bold'].includes(p.id)).map((p) => {
                    const active = request.visualStyle === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setRequest((r) => ({ ...r, visualStyle: p.id as VideoCommandRequest['visualStyle'] }))}
                        className={`${finelyOsDeckTile('violet', active)} !w-auto px-3 py-2 text-left`}
                      >
                        <div className="text-sm font-bold text-white">{p.label}</div>
                        <div className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{p.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>City / metro</span>
                  <input
                    value={request.city ?? ''}
                    onChange={(e) => setRequest((r) => ({ ...r, city: e.target.value }))}
                    className="fc-input mt-1"
                    placeholder={getMarketingFindGeo()}
                  />
                </label>
                <label className="block">
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Lane</span>
                  <select
                    value={lane}
                    onChange={(e) => setLane(e.target.value as LeadEngineLane)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/80"
                  >
                    {HUNT_LANE_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.shortLabel}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                {lanePreset?.description} · Offer: {lanePreset?.freeGuide} · Style drives transitions + caption chrome
              </p>
            </div>
          ) : null}

          {step === 3 && plan ? (
            <div className="space-y-4">
              <div className={`${finelyOsCatalogCardCompact('amber')} !p-3`}>
                <div className="text-white font-bold">{plan.title}</div>
                <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  {plan.totalDurationSec}s · {plan.scenes.length} scenes · {plan.request.aspect} · {plan.request.visualStyle}
                </div>
                <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>{plan.hook}</p>
              </div>
              <VideoTimelineEditor
                scenes={plan.scenes}
                stylePresetId={plan.request.visualStyle}
                onSceneChange={patchSceneInPlan}
                onReorder={reorderSceneInPlan}
                editable
                showEnhancements={false}
              />
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Reorder shots, trim duration, edit beats — then build visuals.
              </p>
            </div>
          ) : null}

          {step === 4 && plan ? (
            <div className="space-y-4">
              <div className={`${finelyOsCatalogCardCompact('violet')} !p-3`}>
                <div className="text-white font-bold">Edit &amp; style</div>
                <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  {getVideoStylePreset(plan.request.visualStyle).label} · {visualsReady ? 'Visuals generated' : 'Build visuals to preview stills'}
                </div>
              </div>
              <VideoTimelineEditor
                scenes={plan.scenes}
                stylePresetId={plan.request.visualStyle}
                onSceneChange={patchSceneInPlan}
                onReorder={reorderSceneInPlan}
                onRegenStill={visualsReady ? (id) => void regenStill(id) : undefined}
                onSwapStyle={swapSceneStyle}
                editable
                showEnhancements
              />
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Punchier captions, trim hints, regen stills, swap per-scene style — then continue to export.
              </p>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              {exportBlobRef ? <ContentStudioVideoPreview blobRef={exportBlobRef} /> : null}
              {autoProductionDone ? (
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">
                  Auto production applied — voice, captions, and transitions ready for export.
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {['Auto VO', 'Captions', 'Transitions', 'Draft', 'Review', 'Resources', 'Hannah'].map((chip) => (
                  <span key={chip} className={finelyOsMicroStat(chip === 'Hannah' ? 'amber' : 'violet')}>
                    {chip}
                  </span>
                ))}
              </div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Results vary · not legal advice · funding subject to underwriting
              </p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {step > 1 ? (
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s))}
              >
                Back
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {step === 1 ? (
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setStep(2)}>
                Format <ArrowRight size={14} />
              </button>
            ) : null}
            {step === 2 ? (
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => void generatePlan()} disabled={busy}>
                <Wand2 size={15} /> Generate scenes <ArrowRight size={14} />
              </button>
            ) : null}
            {step === 3 ? (
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => void buildProjectAndVisuals()} disabled={busy || !plan}>
                <Sparkles size={15} /> Build visuals &amp; voice
              </button>
            ) : null}
            {step === 4 ? (
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => void continueToExport()} disabled={!visualsReady || busy}>
                Continue to export <ArrowRight size={14} />
              </button>
            ) : null}
            {step === 5 ? (
              <>
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  disabled={!exportBlobRef || !exportFilename}
                  onClick={() => {
                    if (!exportBlobRef || !exportFilename) return;
                    void getBlobStore().get(exportBlobRef).then((b) => b && downloadBlob(b, exportFilename));
                  }}
                >
                  <Download size={14} /> Download
                </button>
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  disabled={!exportBlobRef}
                  onClick={() => {
                    if (!exportBlobRef || !plan) return;
                    exportToPresenterReference({
                      blobRef: exportBlobRef,
                      assetId: exportAssetId ?? undefined,
                      title: plan.title,
                      plan,
                      project: projectId ? getMediaProject(projectId) ?? undefined : undefined,
                    });
                    setNotice('Saved as presenter quality reference — Resources admin banner updated.');
                  }}
                >
                  <Star size={14} /> Set quality reference
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(hannahUrl)}>
                  <Megaphone size={14} /> Send to Hannah
                </button>
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => void exportVideo()} disabled={busy}>
                  <Clapperboard size={15} /> {exportBlobRef ? 'Re-export' : 'Export WebM'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

type VideoCreateWizardEntryProps = {
  onStart: (presetId?: VideoCreateWizardPresetId) => void;
  activePreset?: VideoCreateWizardPresetId;
};

/** Landing card — one gold CTA opens the wizard. */
export function VideoCreateWizardEntry({ onStart, activePreset = 'reel_28' }: VideoCreateWizardEntryProps) {
  return (
    <div className={`${finelyOsCatalogCardCompact('amber')} space-y-3`}>
      <div>
        <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-300`}>Easy mode</p>
        <h2 className={FINELY_OS_ENTITY_TITLE}>5-step video wizard</h2>
        <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY} max-w-2xl`}>
          Plan → format → scenes → edit &amp; style → export WebM — then publish to Resources or send to Hannah for tracked links.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {WIZARD_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onStart(p.id)}
            className={`${finelyOsDeckTile('amber', p.id === activePreset)} !w-auto px-3 py-2 text-left`}
          >
            <div className="text-sm font-bold text-white">{p.label}</div>
            <div className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{p.hint}</div>
          </button>
        ))}
      </div>
      <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => onStart(activePreset)}>
        <Clapperboard size={16} /> Create video
      </button>
    </div>
  );
}

export function contentStudioWizardUrl(opts?: {
  preset?: VideoCreateWizardPresetId;
  videoId?: string;
  fromPillar?: boolean;
}): string {
  const params = new URLSearchParams({ wizard: 'open' });
  if (opts?.preset) params.set('preset', opts.preset);
  if (opts?.videoId) params.set('videoId', opts.videoId);
  if (opts?.fromPillar) params.set('from', 'pillar');
  return `/admin/content-studio?${params.toString()}`;
}
