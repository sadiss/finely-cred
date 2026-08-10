import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clapperboard,
  FileVideo,
  Library,
  Loader2,
  Megaphone,
  Scissors,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  analyzeUploadedVideo,
  contentClassLabel,
  suggestedUseLabel,
  type VideoContentClass,
  type VideoImportance,
  type VideoUploadAnalysis,
} from '../../lib/videoUploadIntelligence';
import {
  deleteVideoUploadAnalysis,
  listVideoUploadAnalyses,
  saveVideoUploadAnalysis,
} from '../../data/videoUploadAnalysisRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { ContentStudioVideoPreview } from './ContentStudioVideoPreview';
import { StudioSection } from './StudioKpiCards';
import type { VideoCommandWorkflowStep } from '../../domain/videoCommandRecord';
import { videoCommandWorkflowLabel } from '../../domain/videoCommandRecord';
import { getVideoCommandRecord } from '../../data/videoCommandRecordRepo';
import {
  advanceVideoCommandWorkflow,
  advanceVideoCommandWorkflowNext,
  buildVideoCommandPromoteUrl,
  ensureVideoCommandRecordForAnalysis,
  routeUploadAnalysisToProduction,
} from '../../lib/videoCommandService';
import { FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';

const CLASS_TONE: Record<VideoContentClass, string> = {
  educational: 'text-sky-300 bg-sky-500/15 border-sky-500/30',
  testimonial: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  commercial: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
  entertainment: 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/30',
  course_raw: 'text-violet-300 bg-violet-500/15 border-violet-500/30',
  internal: 'text-slate-300 bg-slate-500/15 border-slate-500/30',
  archive: 'text-white/50 bg-white/5 border-white/10',
  unknown: 'text-white/40 bg-white/5 border-white/10',
};

const IMPORTANCE_TONE: Record<VideoImportance, string> = {
  high: 'text-amber-200',
  medium: 'text-white/70',
  low: 'text-white/45',
};

type VideoUploadIntelligencePanelProps = {
  workflowStep?: VideoCommandWorkflowStep;
  commandRecordId?: string;
  onWorkflowStepChange?: (step: VideoCommandWorkflowStep) => void;
  onRecordChange?: (recordId: string) => void;
};

export function VideoUploadIntelligencePanel({
  workflowStep,
  commandRecordId,
  onWorkflowStepChange,
  onRecordChange,
}: VideoUploadIntelligencePanelProps = {}) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [latest, setLatest] = useState<VideoUploadAnalysis | null>(null);

  const inWorkflow = Boolean(workflowStep && onWorkflowStepChange);
  const activeStep = workflowStep ?? 'import';
  const commandRecord = commandRecordId ? getVideoCommandRecord(commandRecordId) : null;

  const history = useMemo(() => listVideoUploadAnalyses(), [version]);

  const displayAnalysis = latest ?? history[0] ?? null;

  function bumpRecord(recordId: string) {
    onRecordChange?.(recordId);
    setVersion((v) => v + 1);
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (!file.type.startsWith('video/') && !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
      setErr('Upload a video file (MP4, WebM, MOV).');
      return;
    }
    setBusy(true);
    setErr(null);
    setSuccess(null);
    const analysisId = `vua_${Date.now().toString(16)}`;
    try {
      setPhase('Saving footage to secure storage…');
      const store = getBlobStore();
      const { ref: blobRef } = await store.put(file, {
        kind: 'content_studio_upload',
        source: 'video_upload_intelligence',
        fileName: file.name,
      });

      setPhase('Reading metadata, classifying content, building scrape plan…');
      const analysis = await analyzeUploadedVideo(file, { useAi: true, id: analysisId, blobRef });
      saveVideoUploadAnalysis(analysis);
      setLatest(analysis);
      setVersion((v) => v + 1);

      if (inWorkflow) {
        const record = ensureVideoCommandRecordForAnalysis(analysis);
        bumpRecord(record.id);
        advanceVideoCommandWorkflow(record.id, 'understand');
        onWorkflowStepChange!('understand');
        setSuccess(`Analyzed ${file.name} — review the read, then choose destinations.`);
      } else {
        setSuccess(`Analyzed ${file.name} — ${analysis.durationSec}s · ${contentClassLabel(analysis.contentClass)}. Scroll down for preview and next steps.`);
      }
      if (inputRef.current) inputRef.current.value = '';
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload analysis failed.');
    } finally {
      setBusy(false);
      setPhase(null);
    }
  }

  async function routeToProduction(analysis: VideoUploadAnalysis, mode: 'course' | 'resources' | 'testimonial') {
    setBusy(true);
    setErr(null);
    try {
      const result = await routeUploadAnalysisToProduction({
        analysis,
        mode,
        recordId: commandRecordId,
        skipNavigate: inWorkflow,
        navigate: inWorkflow ? undefined : navigate,
      });
      setLatest(result.analysis);
      bumpRecord(result.record.id);
      if (inWorkflow) {
        onWorkflowStepChange!('publish');
        setSuccess(`Routed to production — asset and resource saved. Continue to publish review or promote.`);
      } else {
        setSuccess(`Routed to production — saved as asset + private resource.`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Routing failed.');
    } finally {
      setBusy(false);
    }
  }

  function primaryWorkflowAdvance() {
    if (!inWorkflow || !onWorkflowStepChange) return;
    if (activeStep === 'understand') {
      if (commandRecordId) advanceVideoCommandWorkflow(commandRecordId, 'destinations');
      onWorkflowStepChange('destinations');
      return;
    }
    if (activeStep === 'publish') {
      if (commandRecordId) advanceVideoCommandWorkflow(commandRecordId, 'promote');
      onWorkflowStepChange('promote');
      return;
    }
    if (activeStep === 'import' && commandRecordId) {
      const next = advanceVideoCommandWorkflowNext(commandRecordId);
      if (next) onWorkflowStepChange(next.lifecycle);
    }
  }

  const primaryCtaLabel =
    activeStep === 'understand'
      ? 'Choose destinations'
      : activeStep === 'publish'
        ? 'Build capture links'
        : activeStep === 'promote'
          ? 'Open Hannah — capture links'
          : null;

  const showUploadZone = !inWorkflow || activeStep === 'import';
  const showUnderstand = !inWorkflow || activeStep === 'understand' || activeStep === 'destinations';
  const showDestinations = !inWorkflow || activeStep === 'destinations';
  const showPublish = inWorkflow && activeStep === 'publish';
  const showPromote = inWorkflow && activeStep === 'promote';
  const showHistory = !inWorkflow;

  return (
    <div className="space-y-4">
      {showUploadZone ? (
        <StudioSection eyebrow="Upload intelligence" title="Read any footage before you edit">
          <div
            className={`relative rounded-2xl border border-dashed p-6 text-center transition-all ${
              busy
                ? 'border-violet-400/60 bg-violet-500/10'
                : 'border-violet-500/35 bg-gradient-to-br from-violet-500/[0.08] via-transparent to-fuchsia-500/[0.06]'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void onFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/*,.mp4,.webm,.mov,.m4v"
              className="hidden"
              onChange={(e) => void onFiles(e.target.files)}
            />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
              {busy ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
            </div>
            <p className="mt-3 text-base font-semibold text-white">{busy ? 'Processing your upload…' : 'Drop a video or browse'}</p>
            <p className="mt-2 text-sm text-white/55 max-w-xl mx-auto">
              Footage is stored, previewed, and analyzed for course scrape chapters, testimonial pulls, commercial cutdowns, and resource routing.
            </p>
            {phase ? <p className="mt-3 text-sm font-medium text-violet-200">{phase}</p> : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/30 disabled:opacity-50"
            >
              <FileVideo size={16} /> Select video
            </button>
          </div>
        </StudioSection>
      ) : null}

      {err ? (
        <p className="flex items-center gap-2 text-sm text-rose-300">
          <AlertCircle size={14} /> {err}
        </p>
      ) : null}
      {success ? (
        <p className="flex items-center gap-2 text-sm text-emerald-300">
          <CheckCircle2 size={14} /> {success}
        </p>
      ) : null}

      {displayAnalysis && showUnderstand ? (
        <AnalysisCard
          analysis={displayAnalysis}
          onRoute={routeToProduction}
          busy={busy}
          showRouteButtons={showDestinations}
        />
      ) : null}

      {showPublish && commandRecord ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-emerald-100">Ready for publish review</p>
          <p className="text-sm text-white/70">
            Asset and private resource are saved. Open Content Studio to approve captions and claims before going live.
          </p>
          <div className="flex flex-wrap gap-2">
            {commandRecord.contentStudioAssetId ? (
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() =>
                  navigate(
                    commandRecord.destinationMode === 'course'
                      ? `/admin/content-studio?room=course_videos&assetId=${commandRecord.contentStudioAssetId}`
                      : `/admin/content-studio?room=assets&assetId=${commandRecord.contentStudioAssetId}`,
                  )
                }
              >
                Open in Content Studio
              </button>
            ) : null}
            {commandRecord.resourceVideoId ? (
              <span className="text-xs text-white/45">Resource id: {commandRecord.resourceVideoId}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {showPromote && commandRecord ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-100 flex items-center gap-2">
            <Megaphone size={16} /> Promote with tracked links
          </p>
          <p className="text-sm text-white/70">
            Hannah builds UTM-tagged acquisition URLs for directories and social syndication.
          </p>
          <p className="text-xs text-white/45 font-mono break-all">
            utm_source={commandRecord.utmSource ?? 'video_studio'} · utm_medium={commandRecord.utmMedium ?? 'upload_workflow'} ·
            utm_campaign={commandRecord.utmCampaign ?? '—'} · utm_content={commandRecord.utmContent ?? '—'}
          </p>
          <Link to={buildVideoCommandPromoteUrl(commandRecord)} className={`${FINELY_OS_PRIMARY_BTN} inline-flex`}>
            <Megaphone size={16} /> Open capture links
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : null}

      {inWorkflow && primaryCtaLabel && activeStep !== 'destinations' && activeStep !== 'promote' ? (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            disabled={busy || (activeStep === 'understand' && !displayAnalysis)}
            onClick={primaryWorkflowAdvance}
            className={FINELY_OS_PRIMARY_BTN}
          >
            {primaryCtaLabel}
            <ArrowRight size={14} />
          </button>
          <span className="text-xs text-white/40">Step: {videoCommandWorkflowLabel(activeStep)}</span>
        </div>
      ) : null}

      {showHistory && history.length > 0 ? (
        <StudioSection eyebrow="Recent analyses" title={`${history.length} saved upload reads`}>
          <div className="grid gap-3 md:grid-cols-2">
            {history.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3 hover:border-violet-500/25 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white truncate">{row.fileName}</p>
                    <p className="text-xs text-white/45 mt-0.5">
                      {row.durationSec}s · {row.aspectRatio} · {(row.fileSizeBytes / 1_000_000).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      deleteVideoUploadAnalysis(row.id);
                      if (latest?.id === row.id) setLatest(null);
                      setVersion((v) => v + 1);
                    }}
                    className="text-white/30 hover:text-rose-300"
                    aria-label="Delete analysis"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {row.blobRef ? (
                  <ContentStudioVideoPreview blobRef={row.blobRef} mimeType={row.mimeType} className="!aspect-[16/9] !max-h-32" />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${CLASS_TONE[row.contentClass]}`}>
                    {contentClassLabel(row.contentClass)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLatest(row)}
                  className="text-[10px] uppercase tracking-widest text-violet-300 hover:text-violet-200"
                >
                  View full read
                </button>
              </div>
            ))}
          </div>
        </StudioSection>
      ) : null}
    </div>
  );
}

function AnalysisCard({
  analysis,
  onRoute,
  busy,
  showRouteButtons,
}: {
  analysis: VideoUploadAnalysis;
  onRoute: (a: VideoUploadAnalysis, mode: 'course' | 'resources' | 'testimonial') => void;
  busy: boolean;
  showRouteButtons?: boolean;
}) {
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!analysis.blobRef) return;
    let revoke: (() => void) | undefined;
    void getBlobUrl(analysis.blobRef, { mimeType: analysis.mimeType }).then((res) => {
      if (res?.url) {
        revoke = res.revoke;
        setLocalUrl(res.url);
      }
    });
    return () => revoke?.();
  }, [analysis.blobRef, analysis.mimeType]);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-slate-900/80 via-violet-950/20 to-slate-900/80 p-4 space-y-4 shadow-xl shadow-violet-950/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300 font-black">Latest analysis</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{analysis.fileName}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${CLASS_TONE[analysis.contentClass]}`}>
            <Clapperboard size={10} className="inline mr-1" />
            {contentClassLabel(analysis.contentClass)}
          </span>
          <span className={`rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest ${IMPORTANCE_TONE[analysis.importance]}`}>
            <Star size={10} className="inline mr-1" />
            {analysis.importance} priority
          </span>
        </div>
      </div>

      {analysis.blobRef ? (
        <ContentStudioVideoPreview blobRef={analysis.blobRef} mimeType={analysis.mimeType} />
      ) : localUrl ? (
        <video src={localUrl} controls playsInline className="w-full rounded-2xl border border-white/10 aspect-video bg-black" />
      ) : null}

      <p className="text-sm leading-relaxed text-white/75">{analysis.highLevelSummary}</p>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold flex items-center gap-1">
            <BookOpen size={12} /> Suggested uses
          </p>
          <ul className="mt-2 space-y-1.5">
            {analysis.suggestedUses.map((u) => (
              <li key={u} className="text-sm text-white/70 flex items-center gap-2">
                <Sparkles size={12} className="text-emerald-400 shrink-0" />
                {suggestedUseLabel(u)}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-widest text-sky-300 font-bold">Scrape & production hints</p>
          <ul className="mt-2 space-y-1.5">
            {analysis.scrapeHints.map((h) => (
              <li key={h} className="text-sm text-white/70">• {h}</li>
            ))}
          </ul>
        </div>
      </div>

      {showRouteButtons ? (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            disabled={busy || !analysis.blobRef}
            onClick={() => void onRoute(analysis, 'course')}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-400/35 bg-violet-500/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-violet-100 disabled:opacity-50"
          >
            <Scissors size={14} /> Scrape for course
          </button>
          <button
            type="button"
            disabled={busy || !analysis.blobRef}
            onClick={() => void onRoute(analysis, 'testimonial')}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-100 disabled:opacity-50"
          >
            <Sparkles size={14} /> Testimonial reel
          </button>
          <button
            type="button"
            disabled={busy || !analysis.blobRef}
            onClick={() => void onRoute(analysis, 'resources')}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-400/35 bg-sky-500/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-sky-100 disabled:opacity-50"
          >
            <Library size={14} /> Resource library
            <ArrowRight size={12} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
