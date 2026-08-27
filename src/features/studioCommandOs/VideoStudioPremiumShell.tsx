import React, { useEffect, useMemo, useState } from 'react';
import {
  Clapperboard,
  Film,
  Library,
  Mic2,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import { GeminiStyleVideoCommand } from './GeminiStyleVideoCommand';
import { VideoUploadIntelligencePanel } from './VideoUploadIntelligencePanel';
import { VoiceSoundLibraryPanel } from './VoiceSoundLibraryPanel';
import { EXPANDED_VOICE_COUNT } from '../../data/expandedVoiceCatalog';
import { SOUND_EFFECTS_COUNT } from '../../data/soundEffectsCatalog';
import { listVideoProviderStatuses, videoProviderReadinessScore } from '../../lib/videoProviderRenderPlan';
import type { VideoCommandRequest } from './types';
import {
  VIDEO_COMMAND_WORKFLOW_STEPS,
  videoCommandWorkflowLabel,
  type VideoCommandWorkflowStep,
} from '../../domain/videoCommandRecord';
import { getVideoCommandRecord, listVideoCommandRecords } from '../../data/videoCommandRecordRepo';
import { isVideoCommandRecordLive } from '../../lib/videoCommandService';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsDeckTile,
  finelyOsGlowKpi,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';

type StudioTab = 'create' | 'upload' | 'library' | 'quality';
type UploadLibraryFilter = 'all' | 'draft' | 'live';

const UPLOAD_LIBRARY_FILTERS: Array<{ id: UploadLibraryFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'live', label: 'Live' },
];

const TABS: Array<{ id: StudioTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; hint: string }> = [
  { id: 'upload', label: 'Upload', icon: Upload, hint: 'Analyze footage for courses / ads' },
  { id: 'create', label: 'Create', icon: Wand2, hint: 'Presenter Mode plan → stills → VO → WebM' },
  { id: 'library', label: 'Voices & sounds', icon: Mic2, hint: `${EXPANDED_VOICE_COUNT}+ voices · ${SOUND_EFFECTS_COUNT}+ SFX` },
  { id: 'quality', label: 'Pipeline', icon: Sparkles, hint: 'Live vs Planned lanes' },
];

const PIPELINE_TILES = [
  { title: 'Storyboard', hint: 'Beats, captions, compliance', tone: 'amber' as const },
  { title: 'Presenter Mode', hint: 'Stills + VO + WebM — live', tone: 'emerald' as const },
  { title: 'Voice + SFX', hint: 'Voice Studio · sound catalog', tone: 'sky' as const },
  { title: 'Cinematic', hint: 'Kling / Runway / Veo — Planned', tone: 'violet' as const },
];

export function VideoStudioPremiumShell({ initialRequest }: { initialRequest?: Partial<VideoCommandRequest> }) {
  const [tab, setTab] = useState<StudioTab>('upload');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>();
  const [selectedSounds, setSelectedSounds] = useState<string[]>([]);
  const [workflowStep, setWorkflowStep] = useState<VideoCommandWorkflowStep>('import');
  const [commandRecordId, setCommandRecordId] = useState<string | undefined>();
  const [uploadLibraryFilter, setUploadLibraryFilter] = useState<UploadLibraryFilter>('all');
  const [recordsVersion, setRecordsVersion] = useState(0);
  const providerStatuses = listVideoProviderStatuses();
  const providerScore = videoProviderReadinessScore();

  useEffect(() => {
    const onStore = (e: Event) => {
      const key = (e as CustomEvent<{ key?: string }>).detail?.key;
      if (
        key === 'finely.videoCommandRecords.v1' ||
        key === 'finely.resourceVideos.v1' ||
        key === 'finely.videoUploadAnalyses.v1'
      ) {
        setRecordsVersion((v) => v + 1);
      }
    };
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const uploadLibraryRecords = useMemo(() => {
    void recordsVersion;
    const all = listVideoCommandRecords();
    if (uploadLibraryFilter === 'live') return all.filter((r) => isVideoCommandRecordLive(r));
    if (uploadLibraryFilter === 'draft') return all.filter((r) => !isVideoCommandRecordLive(r));
    return all;
  }, [uploadLibraryFilter, recordsVersion]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get('tab');
    if (t === 'upload' || t === 'library' || t === 'quality' || t === 'create') {
      setTab(t);
    }
    const step = q.get('step');
    if (step && (VIDEO_COMMAND_WORKFLOW_STEPS as readonly string[]).includes(step)) {
      setWorkflowStep(step as VideoCommandWorkflowStep);
      setTab('upload');
    }
    const videoId = q.get('videoId')?.trim();
    if (videoId) {
      const record =
        getVideoCommandRecord(videoId) ??
        listVideoCommandRecords().find((r) => r.resourceVideoId === videoId || r.id === videoId);
      if (record) setCommandRecordId(record.id);
    }
  }, []);

  return (
    <div className={FINELY_OS_COMPACT_PAGE}>
      <div className={`${finelyOsCatalogCardCompact('violet')} space-y-3`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>Finely Course Flow · Video</p>
            <h2 className={`${FINELY_OS_ENTITY_TITLE} mt-1`}>One studio — create, analyze, ship</h2>
            <p className={`${FINELY_OS_ENTITY_BODY} mt-1 max-w-2xl`}>
              Presenter Mode is live. Cinematic motion providers stay Planned until a real adapter returns playable media.
            </p>
          </div>
          <span className={finelyOsMicroStat('emerald')}>Live lanes {providerScore}%</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                title={t.hint}
                className={`${finelyOsDeckTile('violet', active)} !w-auto px-3 py-2 inline-flex items-center gap-2 text-sm font-semibold`}
              >
                <Icon size={15} className={active ? 'text-violet-200' : 'text-white/45'} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'upload' ? (
        <div className={`${finelyOsCatalogCardCompact('violet')} space-y-3`}>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Upload workflow</p>
          <div className="flex flex-wrap gap-1.5">
            {VIDEO_COMMAND_WORKFLOW_STEPS.map((step, idx) => {
              const active = workflowStep === step;
              const done = VIDEO_COMMAND_WORKFLOW_STEPS.indexOf(workflowStep) > idx;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setWorkflowStep(step)}
                  className={`${finelyOsDeckTile('violet', active)} !w-auto px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                    done && !active ? 'opacity-80' : ''
                  }`}
                >
                  <span className="text-white/35 mr-1">{idx + 1}.</span>
                  {videoCommandWorkflowLabel(step)}
                </button>
              );
            })}
          </div>
          <VideoUploadIntelligencePanel
            workflowStep={workflowStep}
            commandRecordId={commandRecordId}
            onWorkflowStepChange={setWorkflowStep}
            onRecordChange={setCommandRecordId}
          />

          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} inline-flex items-center gap-1.5 normal-case tracking-normal`}>
                <Library size={13} className="text-violet-300" />
                Upload library
              </p>
              <div className="flex flex-wrap gap-1.5">
                {UPLOAD_LIBRARY_FILTERS.map((f) => {
                  const active = uploadLibraryFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUploadLibraryFilter(f.id)}
                      className={`${finelyOsDeckTile('violet', active)} !w-auto px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
              Draft = in workflow or private resource. Live = public resource library.
            </p>
            <FinelyOsPaginatedStack
              items={uploadLibraryRecords}
              pageSize={5}
              emptyMessage="No upload command records yet — drop a file above to start."
              renderItem={(record) => {
                const live = isVideoCommandRecordLive(record);
                const selected = commandRecordId === record.id;
                return (
                  <div
                    className={`rounded-xl border px-3 py-2 flex flex-wrap items-center justify-between gap-2 ${
                      selected ? 'border-violet-400/40 bg-violet-500/10' : 'border-white/10 bg-black/25'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{record.title}</div>
                      <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                        {videoCommandWorkflowLabel(record.lifecycle)}
                        {record.destinationMode ? ` · ${record.destinationMode}` : ''}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span className={finelyOsMicroStat(live ? 'emerald' : 'amber')}>{live ? 'Live' : 'Draft'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCommandRecordId(record.id);
                          setWorkflowStep(record.lifecycle);
                        }}
                        className={`${finelyOsDeckTile('violet', selected)} !w-auto px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest`}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </div>
      ) : null}

      {tab === 'create' ? (
        <GeminiStyleVideoCommand
          key={JSON.stringify(initialRequest ?? {})}
          initialRequest={{
            ...initialRequest,
            voicePersonaId: selectedVoiceId ?? initialRequest?.voicePersonaId,
            soundEffectIds: selectedSounds.length ? selectedSounds : initialRequest?.soundEffectIds,
          }}
        />
      ) : null}

      {tab === 'library' ? (
        <VoiceSoundLibraryPanel
          selectedVoiceId={selectedVoiceId}
          onSelectVoice={setSelectedVoiceId}
          selectedSoundIds={selectedSounds}
          onToggleSound={(id) =>
            setSelectedSounds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          }
        />
      ) : null}

      {tab === 'quality' ? (
        <div className={`${finelyOsCatalogCardCompact('amber')} space-y-3`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <Clapperboard size={18} />
            </div>
            <div>
              <p className={FINELY_OS_ENTITY_TITLE}>Pipeline lanes</p>
              <p className={FINELY_OS_ENTITY_BODY}>Honest status — keys alone do not mean Live.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {PIPELINE_TILES.map((tile) => (
              <div key={tile.title} className={`${finelyOsGlowKpi(tile.tone)} !p-3`}>
                <div className="text-sm font-semibold text-white">{tile.title}</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1 normal-case tracking-normal`}>{tile.hint}</div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {providerStatuses.map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  p.ready && p.lane === 'live'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                    : 'border-white/10 bg-black/20 text-white/55'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{p.label}</span>
                  <span className={finelyOsMicroStat(p.lane === 'live' && p.ready ? 'emerald' : 'violet')}>
                    {p.lane === 'live' && p.ready ? 'Live' : 'Planned'}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] opacity-80">{p.hint}</div>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => setTab('create')} className={FINELY_OS_PRIMARY_BTN}>
            <Wand2 size={16} /> Open Presenter create
          </button>
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs inline-flex items-center gap-2`}>
            <Film size={12} /> Phase 21 cinematic render remains open until a provider returns playable media.
          </p>
        </div>
      ) : null}
    </div>
  );
}
