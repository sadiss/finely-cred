import React, { useEffect, useRef, useState } from 'react';

import { ExternalLink, Pause, Play, Volume2, X } from 'lucide-react';
import { speakFinelyText } from '../../hooks/useFinelyVoiceInput';

import { useNavigate } from 'react-router-dom';

import type { SiteTourDefinition } from '../../domain/siteTourVideos';

import { getTourStepNarrationMp3Url, getTourStepSnapshotUrl, resolveTourPlaybackSources } from '../../domain/tourPlayback';

import { fetchTourHighlights, type TourStepHighlight } from '../../domain/tourStepHighlights';

import { TourStepHighlightOverlay } from './TourStepHighlightOverlay';

import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_VALUE, FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';



type Props = {
  tour: SiteTourDefinition | null;
  open: boolean;
  onClose: () => void;
  /** When false, hides MP3 narration and browser read-aloud (public site). */
  allowVoice?: boolean;
};

export function FinelyTourPlayer({ tour, open, onClose, allowVoice = false }: Props) {

  const navigate = useNavigate();

  const [stepIdx, setStepIdx] = useState(0);

  const [videoReady, setVideoReady] = useState(false);

  const [videoFailed, setVideoFailed] = useState(false);

  const [snapshotFailed, setSnapshotFailed] = useState<Record<number, boolean>>({});

  const [highlights, setHighlights] = useState<TourStepHighlight[]>([]);
  const [narrationAvailable, setNarrationAvailable] = useState(false);
  const [narrationPlaying, setNarrationPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);



  useEffect(() => {

    if (open) {

      setStepIdx(0);

      setVideoReady(false);

      setVideoFailed(false);

      setSnapshotFailed({});

      setNarrationAvailable(false);

      setNarrationPlaying(false);

    }

  }, [open, tour?.id]);



  useEffect(() => {

    if (!open || !tour?.id || !allowVoice) return;

    setNarrationPlaying(false);

    setNarrationAvailable(false);

    const mp3Url = getTourStepNarrationMp3Url(tour.id, stepIdx);

    const audio = new Audio(mp3Url);

    audioRef.current = audio;

    const onCanPlay = () => setNarrationAvailable(true);

    const onEnded = () => setNarrationPlaying(false);

    const onError = () => {

      setNarrationAvailable(false);

      setNarrationPlaying(false);

    };

    audio.addEventListener('canplaythrough', onCanPlay);

    audio.addEventListener('ended', onEnded);

    audio.addEventListener('error', onError);

    audio.load();

    return () => {

      audio.pause();

      audio.removeEventListener('canplaythrough', onCanPlay);

      audio.removeEventListener('ended', onEnded);

      audio.removeEventListener('error', onError);

      audioRef.current = null;

    };

  }, [open, tour?.id, stepIdx, allowVoice]);



  useEffect(() => {

    if (!open || !tour?.id) return;

    void fetchTourHighlights(tour.id).then((m) => setHighlights(m?.steps ?? []));

  }, [open, tour?.id]);



  if (!open || !tour) return null;



  const step = tour.steps[stepIdx];

  const total = tour.steps.length;

  const { mp4Url, posterUrl } = resolveTourPlaybackSources(tour);

  const showVideo = videoReady && !videoFailed;

  const snapshotUrl = getTourStepSnapshotUrl(tour.id, stepIdx);

  const stepHighlight = highlights.find((h) => h.stepId === step?.id) ?? highlights[stepIdx] ?? null;

  const instructionLines = step?.instructionLines?.length

    ? step.instructionLines

    : step?.narrationPlain

      ? [step.narrationPlain]

      : [];



  return (

    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={tour.title}>

      <div className="fc-senior-simple fc-light-glass-panel fc-light-chrome-panel w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl">

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Watch how — step-by-step</p>

            <h2 className={`mt-1 text-xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>{tour.title}</h2>

            <p className={`text-xs ${FINELY_OS_ENTITY_BODY} mt-1`}>Step {stepIdx + 1} of {total} · highlighted buttons + narration</p>

          </div>

          <button type="button" onClick={onClose} className="fc-senior-tap-target rounded-xl border px-3 py-2" aria-label="Close">

            <X size={18} />

          </button>

        </div>



        {!videoFailed ? (

          <div className="mt-4">

            <video

              key={mp4Url}

              className={`w-full rounded-xl border bg-black/80 max-h-[40vh] ${showVideo ? 'block' : 'hidden'}`}

              controls

              playsInline

              preload="metadata"

              poster={posterUrl}

              src={mp4Url}

              onLoadedData={() => setVideoReady(true)}

              onError={() => setVideoFailed(true)}

            />

            {!showVideo && !videoFailed ? (

              <p className={`text-sm ${FINELY_OS_ENTITY_BODY} opacity-70 py-4 text-center`}>Loading video…</p>

            ) : null}

          </div>

        ) : null}



        {step ? (

          <div className="mt-4 space-y-4">

            <div className="relative rounded-xl border border-white/10 overflow-hidden bg-black/40">

              {!snapshotFailed[stepIdx] ? (

                <img

                  src={snapshotUrl}

                  alt={`Step ${stepIdx + 1}: ${step.label}`}

                  className="w-full max-h-72 object-contain"

                  onError={() => setSnapshotFailed((p) => ({ ...p, [stepIdx]: true }))}

                />

              ) : (

                <div className="p-8 text-center text-sm opacity-60">

                  Screenshot — run <code className="font-mono">npm run tour:capture</code> to generate with button highlights.

                </div>

              )}

              {!snapshotFailed[stepIdx] ? <TourStepHighlightOverlay highlight={stepHighlight} /> : null}

            </div>



            <div className="rounded-xl border bg-black/5 p-4 space-y-3">

              <div className="flex flex-wrap items-center justify-between gap-2">

                <p className="text-sm font-semibold opacity-70">Step {stepIdx + 1}: {step.label}</p>

                {allowVoice && narrationAvailable ? (

                  <button

                    type="button"

                    className={`inline-flex items-center gap-2 ${FINELY_OS_SECONDARY_BTN} !py-2 !px-3 text-xs`}

                    onClick={() => {

                      const audio = audioRef.current;

                      if (!audio) return;

                      if (narrationPlaying) {

                        audio.pause();

                        setNarrationPlaying(false);

                      } else {

                        void audio.play().then(() => setNarrationPlaying(true)).catch(() => setNarrationPlaying(false));

                      }

                    }}

                  >

                    <Volume2 size={14} />

                    {narrationPlaying ? <Pause size={14} /> : <Play size={14} />}

                    {narrationPlaying ? 'Pause MP3' : 'Play MP3'}

                  </button>

                ) : null}

                {allowVoice ? (
                <button

                  type="button"

                  className={`inline-flex items-center gap-2 ${FINELY_OS_SECONDARY_BTN} !py-2 !px-3 text-xs`}

                  onClick={() => speakFinelyText(instructionLines.join('. '))}

                  title="Browser read-aloud when voiced MP3 is not available"

                >

                  <Volume2 size={14} /> Read aloud

                </button>
                ) : null}

              </div>

              <ul className="space-y-2">

                {instructionLines.map((line, i) => (

                  <li key={i} className={`flex gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>

                    <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center">

                      {i + 1}

                    </span>

                    {line}

                  </li>

                ))}

              </ul>

              {step.path ? (

                <button

                  type="button"

                  className={`mt-2 ${FINELY_OS_SECONDARY_BTN}`}

                  onClick={() => {

                    onClose();

                    navigate(step.path!);

                  }}

                >

                  <ExternalLink size={14} /> Do this now — open {step.path}

                </button>

              ) : null}

            </div>



            <div className="flex flex-wrap gap-2">

              <button

                type="button"

                disabled={stepIdx <= 0}

                className="fc-senior-tap-target fc-light-chrome-btn rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-40"

                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}

              >

                Back

              </button>

              <button

                type="button"

                className="fc-senior-tap-target fc-light-chrome-btn rounded-xl px-4 py-3 text-sm font-semibold flex-1"

                onClick={() => {

                  if (stepIdx >= total - 1) onClose();

                  else setStepIdx((i) => i + 1);

                }}

              >

                {stepIdx >= total - 1 ? 'Done' : 'Next step'}

              </button>

            </div>



            <div className="flex gap-1 overflow-x-auto pb-1">

              {tour.steps.map((s, i) => (

                <button

                  key={s.id}

                  type="button"

                  onClick={() => setStepIdx(i)}

                  className={`shrink-0 w-14 h-10 rounded-lg border overflow-hidden ${i === stepIdx ? 'ring-2 ring-sky-400' : 'opacity-60'}`}

                  title={s.label}

                >

                  {/* eslint-disable-next-line jsx-a11y/alt-text */}

                  <img src={getTourStepSnapshotUrl(tour.id, i)} className="w-full h-full object-cover" />

                </button>

              ))}

            </div>

          </div>

        ) : null}

      </div>

    </div>

  );

}


