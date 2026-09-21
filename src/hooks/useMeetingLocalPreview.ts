import { useCallback, useEffect, useRef, useState } from 'react';
import { drawBeautyFrame } from '../lib/meetingBeautyPipeline';
import type { MeetingVideoPrefs } from '../lib/meetingVideoQuality';
import { buildAudioConstraints, buildVideoConstraints } from '../lib/meetingVideoQuality';

export function useMeetingLocalPreview(prefs: MeetingVideoPrefs) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [gpuNote, setGpuNote] = useState<string | null>(null);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  const start = useCallback(async () => {
    stop();
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: buildVideoConstraints(prefs.videoMode),
        audio: buildAudioConstraints(prefs),
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      setReady(true);
      setGpuNote(
        prefs.beautyEnabled || prefs.virtualBackground !== 'none'
          ? 'Touch-up v1 uses GPU canvas (~1–3 ms/frame at 720p). Not AI segmentation — use Smooth on low-power devices.'
          : null,
      );

      const tick = () => {
        const canvas = canvasRef.current;
        const v = videoRef.current;
        if (!canvas || !v || v.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        const w = canvas.width;
        const h = canvas.height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) drawBeautyFrame(ctx, v, prefs, w, h);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Camera/mic permission denied.');
    }
  }, [prefs, stop]);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, canvasRef, start, stop, error, ready, streamRef, gpuNote, prefs };
}
