import React, { useEffect, useState } from 'react';
import { Camera, Mic, Sparkles, Video, Zap } from 'lucide-react';
import { useMeetingLocalPreview } from '../../hooks/useMeetingLocalPreview';
import type { MeetingVideoPrefs, VirtualBackgroundId } from '../../lib/meetingVideoQuality';
import { VIRTUAL_BACKGROUNDS } from '../../lib/meetingVideoQuality';
import { getMeetingVideoPrefs, saveMeetingVideoPrefs, type MeetingHostContext } from '../../lib/meetingVideoPrefs';
import { virtualBackgroundLabel } from '../../lib/meetingBeautyPipeline';
import { hasLobbyVisualEffects } from '../../lib/meetingVideoQuality';

export function MeetingPreJoinLobby({
  lang,
  hostContext,
  displayName,
  onDisplayNameChange,
  onJoin,
  joinLabel,
}: {
  lang: 'en' | 'ht';
  hostContext: MeetingHostContext;
  displayName: string;
  onDisplayNameChange: (n: string) => void;
  onJoin: (prefs: MeetingVideoPrefs, outboundStream: MediaStream | null) => void;
  joinLabel?: string;
}) {
  const [prefs, setPrefs] = useState<MeetingVideoPrefs>(() => getMeetingVideoPrefs(hostContext));
  const { videoRef, canvasRef, start, error, ready, gpuNote, getOutboundStream } = useMeetingLocalPreview(prefs);
  const effectsOn = hasLobbyVisualEffects(prefs);

  useEffect(() => {
    void start();
  }, [start, prefs.videoMode, prefs.beautyEnabled, prefs.beautyStrength, prefs.virtualBackground]);

  const setBg = (id: VirtualBackgroundId) => setPrefs((p) => ({ ...p, virtualBackground: id }));
  const setMode = (mode: MeetingVideoPrefs['videoMode']) => setPrefs((p) => ({ ...p, videoMode: mode }));

  const canJoin = displayName.trim().length >= 2;

  return (
    <div className="grid md:grid-cols-[1fr_340px] gap-6 items-start">
      <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden aspect-video relative">
        <video ref={videoRef} className="hidden" playsInline />
        <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-cover" />
        {!ready && !error ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">Starting camera…</div>
        ) : null}
        {error ? <div className="absolute inset-0 flex items-center justify-center text-rose-200 text-sm p-4">{error}</div> : null}
        {effectsOn ? (
          <div className="absolute top-3 left-3 right-3 text-[10px] text-amber-100/90 bg-black/70 border border-amber-500/30 rounded-lg px-2 py-1">
            {lang === 'ht'
              ? 'Preview touch-up — lè w antre, videyo voye soti nan canvas (pa kamera brit).'
              : 'Touch-up preview — when you join, outbound video uses the processed canvas stream (not raw camera).'}
          </div>
        ) : null}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest font-bold">
          <span className="px-2 py-1 rounded-lg bg-black/60 text-emerald-200 border border-emerald-500/30">
            {prefs.videoMode === 'hd' ? 'HD' : 'Smooth'}
          </span>
          {prefs.beautyEnabled ? (
            <span className="px-2 py-1 rounded-lg bg-black/60 text-amber-200 border border-amber-500/30 inline-flex items-center gap-1">
              <Sparkles size={10} /> Touch-up
            </span>
          ) : null}
          <span className="px-2 py-1 rounded-lg bg-black/60 text-sky-200 border border-sky-500/30">
            {virtualBackgroundLabel(prefs.virtualBackground, lang)}
          </span>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5">
        <div>
          <label className="text-white/50 text-xs uppercase tracking-widest font-bold">Display name</label>
          <input
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm"
            placeholder={lang === 'ht' ? 'Non ou' : 'Your name'}
          />
        </div>

        <div>
          <div className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2">
            {lang === 'ht' ? 'Kalite videyo' : 'Video quality'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('hd')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border ${prefs.videoMode === 'hd' ? 'bg-sky-500/20 border-sky-400 text-sky-100' : 'border-white/10 text-white/60'}`}
            >
              <Zap size={12} className="inline mr-1" /> HD
            </button>
            <button
              type="button"
              onClick={() => setMode('smooth')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border ${prefs.videoMode === 'smooth' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'border-white/10 text-white/60'}`}
            >
              Smooth
            </button>
          </div>
        </div>

        <div>
          <div className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
            <Sparkles size={12} /> {lang === 'ht' ? 'Belte (subtil)' : 'Touch-up (subtle)'}
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={prefs.beautyEnabled}
              onChange={(e) => setPrefs((p) => ({ ...p, beautyEnabled: e.target.checked }))}
            />
            Soft light (touch-up v1 — not AI beauty)
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={prefs.beautyStrength}
            disabled={!prefs.beautyEnabled}
            onChange={(e) => setPrefs((p) => ({ ...p, beautyStrength: Number(e.target.value) }))}
            className="w-full mt-2"
          />
        </div>

        <div>
          <div className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2">
            {lang === 'ht' ? 'Fon vityèl' : 'Virtual background'}
          </div>
          <div className="flex flex-wrap gap-2">
            {VIRTUAL_BACKGROUNDS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBg(b.id)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border ${
                  prefs.virtualBackground === b.id ? 'border-amber-400 bg-amber-500/15 text-amber-100' : 'border-white/10 text-white/55'
                }`}
              >
                {lang === 'ht' ? b.labelHt : b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-white/45 text-[11px] leading-relaxed space-y-1">
          <div className="flex items-center gap-1"><Mic size={10} /> Echo cancel + noise suppression on by default.</div>
          <div className="flex items-center gap-1"><Camera size={10} /> Simulcast + adaptive layers in Jitsi room.</div>
          {gpuNote ? <div>{gpuNote}</div> : null}
        </div>

        <button
          type="button"
          disabled={!canJoin}
          onClick={() => {
            saveMeetingVideoPrefs(prefs);
            requestAnimationFrame(() => {
              onJoin(prefs, hasLobbyVisualEffects(prefs) ? getOutboundStream() : null);
            });
          }}
          className="w-full py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-xs disabled:opacity-40 inline-flex items-center justify-center gap-2"
        >
          <Video size={14} /> {joinLabel ?? (lang === 'ht' ? 'Antre reyinyon' : 'Join meeting')}
        </button>
      </div>
    </div>
  );
}
