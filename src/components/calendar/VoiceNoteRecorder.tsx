import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react';
import { getBlobStore } from '../../storage/getBlobStore';

type Props = {
  partnerId?: string;
  value?: { blobRef: string; mimeType: string } | null;
  onChange: (value: { blobRef: string; mimeType: string } | null) => void;
  maxSeconds?: number;
};

export function VoiceNoteRecorder({ partnerId, value, onChange, maxSeconds = 120 }: Props) {
  const blobStore = getBlobStore();
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!value?.blobRef) {
        setPreviewUrl(null);
        return;
      }
      try {
        const blob = await blobStore.get(value.blobRef);
        if (cancelled || !blob) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch {
        if (!cancelled) setPreviewUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value?.blobRef, blobStore]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop();
    }
    setRecording(false);
  };

  const startRecording = async () => {
    setErr(null);
    if (!partnerId) {
      setErr('Partner profile required to save voice notes.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 500) {
          setErr('Recording too short — try again.');
          return;
        }
        setBusy(true);
        try {
          const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: mimeType });
          const { ref } = await blobStore.put(file, {
            partnerId,
            caption: 'Meeting voice note',
            scanMode: false,
            kind: 'evidence',
          });
          onChange({ blobRef: ref, mimeType });
        } catch (e: unknown) {
          setErr((e as Error)?.message || 'Could not save voice note.');
        } finally {
          setBusy(false);
        }
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= maxSeconds) stopRecording();
          return s + 1;
        });
      }, 1000);
    } catch {
      setErr('Microphone access denied or unavailable.');
    }
  };

  const togglePlay = async () => {
    if (!previewUrl) return;
    if (!audioRef.current) audioRef.current = new Audio(previewUrl);
    const audio = audioRef.current;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    audio.onended = () => setPlaying(false);
    await audio.play();
    setPlaying(true);
  };

  const clear = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
    onChange(null);
  };

  return (
    <div className="fc-light-glass-panel fc-light-chrome-panel p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/50 font-black">Voice note (optional)</div>
          <div className="text-xs text-white/45 mt-0.5">Record agenda context — saved securely to your vault.</div>
        </div>
        {recording ? (
          <span className="text-[10px] font-mono text-red-300 animate-pulse">{seconds}s</span>
        ) : value ? (
          <span className="text-[10px] font-mono text-emerald-300">Saved</span>
        ) : null}
      </div>

      {err ? <div className="text-xs text-fuchsia-200">{err}</div> : null}

      <div className="flex flex-wrap gap-2">
        {!recording && !value ? (
          <button
            type="button"
            disabled={busy}
            onClick={startRecording}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
          >
            <Mic size={14} /> {busy ? 'Saving…' : 'Record'}
          </button>
        ) : null}
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-[10px] font-black uppercase tracking-widest"
          >
            <Square size={12} /> Stop
          </button>
        ) : null}
        {value && previewUrl ? (
          <>
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/70"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white"
            >
              <Trash2 size={14} /> Remove
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
