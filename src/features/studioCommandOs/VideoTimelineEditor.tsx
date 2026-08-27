import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Clock,
  ImagePlus,
  Mic2,
  Palette,
  Scissors,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { MediaTransitionType } from '../../domain/mediaStudio';
import { assignTransitionForScene } from '../../domain/videoStylePresets';
import type { VideoScenePlan } from './types';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_MODAL_HEADER,
  FINELY_OS_MODAL_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsDeckTile,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../os/FinelyOsModalCloseButton';

export type VideoTimelineEditorProps = {
  scenes: VideoScenePlan[];
  stylePresetId?: string;
  onSceneChange?: (sceneId: string, patch: Partial<VideoScenePlan>) => void;
  onReorder?: (sceneId: string, direction: 'up' | 'down') => void;
  onRegenStill?: (sceneId: string) => void;
  onSwapStyle?: (sceneId: string) => void;
  editable?: boolean;
  showEnhancements?: boolean;
};

const TRANSITION_LABEL: Record<MediaTransitionType, string> = {
  cut: 'Cut',
  fade: 'Fade',
  dissolve: 'Dissolve',
  wipe: 'Wipe',
  zoom: 'Zoom',
  ken_burns: 'Ken Burns',
};

function trimHint(durationSec: number): string {
  if (durationSec <= 3) return 'Very short — hook only';
  if (durationSec <= 5) return 'Snappy — good for reels';
  if (durationSec <= 8) return 'Standard scene length';
  return 'Long — consider trimming for reels';
}

function punchierCaption(caption: string): string {
  const t = caption.trim();
  if (!t) return 'Your next move should feel clear.';
  const stripped = t.replace(/\.$/, '');
  return stripped.length > 48 ? `${stripped.slice(0, 45)}…` : `${stripped}!`;
}

export function VideoTimelineEditor({
  scenes,
  stylePresetId,
  onSceneChange,
  onReorder,
  onRegenStill,
  onSwapStyle,
  editable = true,
  showEnhancements = true,
}: VideoTimelineEditorProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const editing = scenes.find((s) => s.id === editId) ?? null;
  const totalSec = scenes.reduce((a, s) => a + s.durationSec, 0);

  if (!scenes.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
        Generate a plan to see the timeline here.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          {scenes.length} scene(s) · {totalSec}s total · reorder with arrows
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
        {scenes.map((s, idx) => {
          const active = editId === s.id;
          const transition =
            s.transition ?? assignTransitionForScene(stylePresetId, idx, scenes.length);
          const transLabel = TRANSITION_LABEL[transition.type] ?? transition.type;
          return (
            <div
              key={s.id}
              className={`${finelyOsDeckTile('amber', active)} shrink-0 snap-start !w-[min(240px,78vw)] px-3 py-3`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-200">Shot {idx + 1}</span>
                <span className="text-[10px] font-mono text-white/40 inline-flex items-center gap-1">
                  <Clock size={10} /> {s.durationSec}s
                </span>
              </div>

              {s.imageDataUrl ? (
                <div className="mt-2 overflow-hidden rounded-lg border border-white/10 aspect-video bg-black/40">
                  <img src={s.imageDataUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}

              <button
                type="button"
                disabled={!editable}
                onClick={() => editable && setEditId(s.id)}
                className="mt-2 w-full text-left"
              >
                <div className="text-sm font-semibold text-white line-clamp-2">{s.beat}</div>
                {s.caption ? <div className="mt-1 text-[10px] text-white/45 line-clamp-2">{s.caption}</div> : null}
              </button>

              <div className="mt-2 flex flex-wrap gap-1">
                <span className={finelyOsMicroStat('violet')}>{transLabel}</span>
                <span className={finelyOsMicroStat('sky')}>{trimHint(s.durationSec)}</span>
              </div>

              {editable && showEnhancements ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  <button
                    type="button"
                    title="Punchier caption"
                    className={FINELY_OS_SECONDARY_BTN}
                    onClick={() =>
                      onSceneChange?.(s.id, {
                        caption: punchierCaption(s.caption),
                        beat: s.beat.endsWith('!') ? s.beat : `${s.beat.replace(/\.$/, '')}!`,
                      })
                    }
                  >
                    <Zap size={12} /> Punchier
                  </button>
                  <button
                    type="button"
                    title="Shorter duration"
                    className={FINELY_OS_SECONDARY_BTN}
                    onClick={() =>
                      onSceneChange?.(s.id, {
                        durationSec: Math.max(2, s.durationSec - 1),
                      })
                    }
                  >
                    <Scissors size={12} /> Shorter
                  </button>
                  {onRegenStill ? (
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onRegenStill(s.id)}>
                      <ImagePlus size={12} /> Regen
                    </button>
                  ) : null}
                  {onSwapStyle ? (
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onSwapStyle(s.id)}>
                      <Palette size={12} /> Style
                    </button>
                  ) : null}
                </div>
              ) : null}

              {editable ? (
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    className={FINELY_OS_SECONDARY_BTN}
                    onClick={() => onReorder?.(s.id, 'up')}
                    aria-label="Move earlier"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === scenes.length - 1}
                    className={FINELY_OS_SECONDARY_BTN}
                    onClick={() => onReorder?.(s.id, 'down')}
                    aria-label="Move later"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {editing && editable ? (
        <div className={FINELY_OS_MODAL_OVERLAY} onClick={() => setEditId(null)}>
          <div
            className={`${FINELY_OS_MODAL_SHELL} relative mx-auto mt-[min(8vh,4rem)] max-w-lg w-[calc(100%-2rem)] !p-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={FINELY_OS_MODAL_HEADER}>
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Edit scene</p>
                <h3 className="text-lg font-bold text-white">{editing.beat}</h3>
                <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{trimHint(editing.durationSec)}</p>
              </div>
              <FinelyOsModalCloseButton onClick={() => setEditId(null)} />
            </div>
            <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto">
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Beat</span>
                <input
                  value={editing.beat}
                  onChange={(e) => onSceneChange?.(editing.id, { beat: e.target.value })}
                  className="fc-input mt-1"
                />
              </label>
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Duration (sec) · trim hint</span>
                <input
                  type="range"
                  min={2}
                  max={12}
                  value={editing.durationSec}
                  onChange={(e) =>
                    onSceneChange?.(editing.id, {
                      durationSec: Math.max(2, Math.min(12, Number(e.target.value) || 4)),
                    })
                  }
                  className="mt-2 w-full"
                />
                <div className="mt-1 flex justify-between text-[10px] text-white/45">
                  <span>2s snappy</span>
                  <span className="font-mono text-sky-200">{editing.durationSec}s</span>
                  <span>12s long</span>
                </div>
              </label>
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Visual prompt</span>
                <textarea
                  rows={3}
                  value={editing.visualPrompt}
                  onChange={(e) => onSceneChange?.(editing.id, { visualPrompt: e.target.value })}
                  className="fc-input mt-1 min-h-0"
                />
              </label>
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Caption</span>
                <input
                  value={editing.caption}
                  onChange={(e) => onSceneChange?.(editing.id, { caption: e.target.value })}
                  className="fc-input mt-1"
                />
              </label>
              <label className="block">
                <span className={`${FINELY_OS_ENTITY_SUBLABEL} inline-flex items-center gap-1`}>
                  <Mic2 size={12} /> Voiceover
                </span>
                <textarea
                  rows={2}
                  value={editing.voiceover}
                  onChange={(e) => onSceneChange?.(editing.id, { voiceover: e.target.value })}
                  className="fc-input mt-1 min-h-0"
                />
              </label>
              {showEnhancements ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className={FINELY_OS_SECONDARY_BTN}
                    onClick={() =>
                      onSceneChange?.(editing.id, {
                        caption: punchierCaption(editing.caption),
                        beat: editing.beat.endsWith('!') ? editing.beat : `${editing.beat.replace(/\.$/, '')}!`,
                      })
                    }
                  >
                    <Sparkles size={12} /> Make punchier
                  </button>
                  <button
                    type="button"
                    className={FINELY_OS_SECONDARY_BTN}
                    onClick={() =>
                      onSceneChange?.(editing.id, {
                        durationSec: Math.max(2, editing.durationSec - 1),
                      })
                    }
                  >
                    <Scissors size={12} /> Trim 1s
                  </button>
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setEditId(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
