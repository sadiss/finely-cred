import React, { useState } from 'react';
import { Mic2, X } from 'lucide-react';
import type { VideoScenePlan } from './types';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_MODAL_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsDeckTile,
} from '../os/finelyOsLightUi';

export type VideoSceneDeckProps = {
  scenes: VideoScenePlan[];
  onSceneChange?: (sceneId: string, patch: Partial<VideoScenePlan>) => void;
  editable?: boolean;
};

export function VideoSceneDeck({ scenes, onSceneChange, editable = true }: VideoSceneDeckProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const editing = scenes.find((s) => s.id === editId) ?? null;

  if (!scenes.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
        Generate a plan to see scenes here.
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
        {scenes.map((s, idx) => {
          const active = editId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!editable}
              onClick={() => editable && setEditId(s.id)}
              className={`${finelyOsDeckTile('amber', active)} shrink-0 snap-start !w-[min(220px,72vw)] px-3 py-3 text-left`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">Shot {idx + 1}</span>
                <span className="text-[10px] font-mono text-white/40">{s.durationSec}s</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-white line-clamp-2">{s.beat}</div>
              {s.caption ? <div className="mt-1 text-[10px] text-white/45 line-clamp-2">{s.caption}</div> : null}
            </button>
          );
        })}
      </div>

      {editing && editable ? (
        <div className={FINELY_OS_MODAL_OVERLAY} onClick={() => setEditId(null)}>
          <div
            className={`${FINELY_OS_MODAL_SHELL} relative mx-auto mt-[min(8vh,4rem)] max-w-lg w-[calc(100%-2rem)] !p-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Edit scene</p>
                <h3 className="text-lg font-bold text-white">{editing.beat}</h3>
              </div>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setEditId(null)} aria-label="Close">
                <X size={16} />
              </button>
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
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Duration (sec)</span>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={editing.durationSec}
                  onChange={(e) =>
                    onSceneChange?.(editing.id, { durationSec: Math.max(2, Math.min(12, Number(e.target.value) || 4)) })
                  }
                  className="fc-input mt-1"
                />
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
