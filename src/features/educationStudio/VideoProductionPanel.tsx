import React, { useState } from 'react';
import { Clapperboard, Film, Sparkles } from 'lucide-react';
import type { CourseLesson } from '../../domain/courses';
import { FinelyOsGlassPanel } from '../os/FinelyOsGlassPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_ENTITY_VALUE,
  finelyOsInlineListItem,
} from '../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import { VIDEO_PROVIDERS, VIDEO_STYLES, type VideoProductionStyle, type VideoProviderId, type VideoScenePlan } from './educationStudioModel';
import { generateVideoScenePlan } from './educationStudioPipeline';
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
  const [err, setErr] = useState<string | null>(null);

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
      onScenesChange(
        raw.map((s) => ({
          ...s,
          id: newId('scene'),
          lessonId: lesson.id,
        })),
      );
    } catch (e: any) {
      setErr(e?.message || 'Scene generation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <FinelyOsGlassPanel
      icon={Clapperboard}
      title="Video Production Engine"
      subtitle="AI movie studio — storyboards, scenes, narration, and provider prompts (Kling, Runway, Veo, Pika, Luma)."
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
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Production style</div>
              <select value={style} onChange={(e) => onStyleChange(e.target.value as VideoProductionStyle)} className={FINELY_OS_ENTITY_SELECT}>
                {VIDEO_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Video provider</div>
              <select value={provider} onChange={(e) => onProviderChange(e.target.value as VideoProviderId)} className={FINELY_OS_ENTITY_SELECT}>
                {VIDEO_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label} — {p.hint}</option>
                ))}
              </select>
            </label>
          </div>

          {err ? <div className="text-sm text-rose-700">{err}</div> : null}

          <FinelyOsPaginatedStack
            items={scenes}
            pageSize={4}
            emptyMessage="Generate scenes to build a storyboard and provider-ready prompts."
            renderItem={(s) => (
              <div key={s.id} className={`space-y-2 ${finelyOsInlineListItem()}`}>
                <div className="flex items-center gap-2">
                  <Film size={14} className="text-fuchsia-400" />
                  <span className={FINELY_OS_ENTITY_VALUE}>
                    Scene {s.sceneNumber}: {s.title}
                  </span>
                  <span className={`ml-auto ${FINELY_OS_ENTITY_SUBLABEL}`}>{s.status}</span>
                </div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Visual prompt</div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{s.visualPrompt || '—'}</p>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Voiceover</div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-xs whitespace-pre-wrap`}>{s.voiceover || '—'}</p>
                {s.onScreenText ? (
                  <>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>On-screen text</div>
                    <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{s.onScreenText}</p>
                  </>
                ) : null}
              </div>
            )}
          />

          <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
            Provider API rendering is queued for a future integration. Today the studio exports production-ready scene plans and prompts for Kling, Runway, Veo, Pika, or Luma workflows.
          </p>
          {scenes.length > 0 ? (
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => {
                const payload = JSON.stringify(scenes, null, 2);
                void navigator.clipboard?.writeText(payload);
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
