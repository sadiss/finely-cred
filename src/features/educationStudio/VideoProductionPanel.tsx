import React, { useEffect, useState } from 'react';
import { Clapperboard, Film, Sparkles } from 'lucide-react';
import type { CourseLesson } from '../../domain/courses';
import { FinelyOsGlassPanel } from '../os/FinelyOsGlassPanel';
import {
  FINELY_OS_COMPACT_TEXTAREA,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_ENTITY_VALUE,
  finelyOsDeckTile,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import { VIDEO_PROVIDERS, VIDEO_STYLES, type VideoProductionStyle, type VideoProviderId, type VideoScenePlan } from './educationStudioModel';
import { generateVideoScenePlan } from './educationStudioPipeline';
import { getVideoProviderAdapter } from './videoProviders';
import { listVideoJobs } from './videoJobQueue';
import { newId } from '../../utils/ids';

type Props = {
  courseTitle: string;
  lesson: CourseLesson | null;
  lessonMarkdown: string;
  style: VideoProductionStyle;
  provider: VideoProviderId;
  onStyleChange: (s: VideoProductionStyle) => void;
  onProviderChange: (p: VideoProviderId) => void;
  scenes: VideoScenePlan[];
  onScenesChange: (scenes: VideoScenePlan[]) => void;
};

export function VideoProductionPanel({
  courseTitle,
  lesson,
  lessonMarkdown,
  style,
  provider,
  onStyleChange,
  onProviderChange,
  scenes,
  onScenesChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [renderBusy, setRenderBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [jobsTick, setJobsTick] = useState(0);
  const jobs = listVideoJobs(8);
  void jobsTick;

  useEffect(() => {
    if (!scenes.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !scenes.some((s) => s.id === selectedId)) {
      setSelectedId(scenes[0]!.id);
    }
  }, [scenes, selectedId]);

  const selected = scenes.find((s) => s.id === selectedId) ?? scenes[0] ?? null;

  const generate = async () => {
    if (!lesson) return;
    setBusy(true);
    setErr(null);
    try {
      const { scenes: raw } = await generateVideoScenePlan({
        courseTitle,
        lessonTitle: lesson.title,
        lessonContent: lessonMarkdown,
        style,
        provider,
      });
      const next = raw.map((s) => ({
        ...s,
        id: newId('scene'),
        lessonId: lesson.id,
      }));
      onScenesChange(next);
      setSelectedId(next[0]?.id ?? null);
    } catch (e: any) {
      setErr(e?.message || 'Scene generation failed.');
    } finally {
      setBusy(false);
    }
  };

  const patchSelected = (patch: Partial<VideoScenePlan>) => {
    if (!selected) return;
    onScenesChange(scenes.map((s) => (s.id === selected.id ? { ...s, ...patch } : s)));
  };

  const queueRender = async () => {
    if (!selected) return;
    setRenderBusy(true);
    setErr(null);
    try {
      const adapter = getVideoProviderAdapter(provider);
      const job = await adapter.queueScene({ ...selected, provider });
      setJobsTick((t) => t + 1);
      if (job.status === 'failed') setErr(job.error || 'Render failed');
      onScenesChange(
        scenes.map((s) =>
          s.id === selected.id
            ? { ...s, status: job.status === 'completed' ? 'complete' : job.status === 'failed' ? 'prompt_ready' : 'render_queued' }
            : s,
        ),
      );
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Queue render failed');
    } finally {
      setRenderBusy(false);
    }
  };

  return (
    <FinelyOsGlassPanel
      icon={Clapperboard}
      title="Storyboard board"
      subtitle="Grid of shots + one focused edit. Cinematic providers are Planned — Presenter Mode uses stills + VO."
      accent="fuchsia"
      actions={
        <button type="button" disabled={busy || !lesson} onClick={() => void generate()} className={FINELY_OS_PRIMARY_BTN}>
          <Sparkles size={14} /> {busy ? 'Generating…' : 'Generate scenes'}
        </button>
      }
    >
      {!lesson ? (
        <p className={FINELY_OS_ENTITY_BODY}>Select a lesson to plan cinematic video production.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <label>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Production style</div>
              <select value={style} onChange={(e) => onStyleChange(e.target.value as VideoProductionStyle)} className={FINELY_OS_ENTITY_SELECT}>
                {VIDEO_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Video provider (Planned unless Live)</div>
              <select value={provider} onChange={(e) => onProviderChange(e.target.value as VideoProviderId)} className={FINELY_OS_ENTITY_SELECT}>
                {VIDEO_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label} — {p.hint}</option>
                ))}
              </select>
            </label>
          </div>

          {err ? <div className="text-sm text-rose-700">{err}</div> : null}

          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-3">
            <div className="space-y-2">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Shot deck</div>
              <FinelyOsPaginatedStack
                items={scenes}
                pageSize={8}
                emptyMessage="Generate scenes to build a storyboard board."
                itemSpacingClassName="grid sm:grid-cols-2 gap-2"
                renderItem={(s) => {
                  const active = selected?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={`${finelyOsDeckTile('fuchsia', active)} p-3`}
                    >
                      <div className="flex items-center gap-2">
                        <Film size={14} className="text-fuchsia-300 shrink-0" />
                        <span className={`${FINELY_OS_ENTITY_VALUE} truncate`}>
                          {s.sceneNumber}. {s.title}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={finelyOsMicroStat('violet')}>{s.durationSec ?? 4}s</span>
                        <span className={finelyOsMicroStat(s.status === 'complete' ? 'emerald' : 'fuchsia')}>{s.status}</span>
                      </div>
                    </button>
                  );
                }}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-2">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Focus shot</div>
              {selected ? (
                <>
                  <div className={FINELY_OS_ENTITY_VALUE}>
                    Scene {selected.sceneNumber}: {selected.title}
                  </div>
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Visual prompt</div>
                    <textarea
                      rows={2}
                      className={FINELY_OS_COMPACT_TEXTAREA}
                      value={selected.visualPrompt || ''}
                      onChange={(e) => patchSelected({ visualPrompt: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Voiceover</div>
                    <textarea
                      rows={2}
                      className={FINELY_OS_COMPACT_TEXTAREA}
                      value={selected.voiceover || ''}
                      onChange={(e) => patchSelected({ voiceover: e.target.value })}
                    />
                  </label>
                  {selected.onScreenText ? (
                    <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>On-screen: {selected.onScreenText}</p>
                  ) : null}
                  <button
                    type="button"
                    disabled={renderBusy}
                    onClick={() => void queueRender()}
                    className={`${FINELY_OS_PRIMARY_BTN} mt-2`}
                  >
                    {renderBusy ? 'Queuing…' : 'Queue motion render'}
                  </button>
                  <p className={`${FINELY_OS_ENTITY_BODY} text-[11px] mt-1`}>
                    Live path: provider <strong className="text-white/80">luma</strong> → edge <code>video-motion-render</code> (needs FAL_KEY). Others stay Planned. Presenter/manual completes locally for stills+VO export.
                  </p>
                </>
              ) : (
                <p className={FINELY_OS_ENTITY_BODY}>Select a shot tile.</p>
              )}
            </div>
          </div>

          {jobs.length ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-1">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent render jobs</div>
              {jobs.map((j) => (
                <div key={j.id} className={`text-xs ${finelyOsMicroStat(j.status === 'failed' ? 'amber' : 'emerald')} rounded-lg border px-2 py-1`}>
                  {j.provider} · {j.status}
                  {j.error ? ` — ${j.error}` : ''}
                  {j.requestId ? ` · ${j.requestId}` : ''}
                </div>
              ))}
            </div>
          ) : null}

          <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
            Presenter Mode (stills + VO → WebM) remains the reliable course path. Phase 1 live motion uses Fal when FAL_KEY is set on video-motion-render.
          </p>
          {scenes.length > 0 ? (
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => {
                void navigator.clipboard?.writeText(JSON.stringify(scenes, null, 2));
              }}
            >
              Copy scene JSON
            </button>
          ) : null}
        </div>
      )}
    </FinelyOsGlassPanel>
  );
}
