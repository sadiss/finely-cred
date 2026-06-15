import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Headphones, Loader2, Pause, Play, Sparkles, Square, Wand2 } from 'lucide-react';
import type { GuideNarration } from '../../resources/guideNarration';
import { narrationToPerformanceScript, narrationToPlainText, narrationToProducerNotes, narrationToSsml } from '../../resources/guideNarration';
import { downloadText } from '../../utils/download';
import { emitGuideAudioPlayed } from '../../domain/platformEvents';
import {
  ensureGuideSpeechVoices,
  isGuideSpeechActive,
  isGuideSpeechPaused,
  pauseGuideSpeech,
  resumeGuideSpeech,
  speakGuideNaturalText,
  stopGuideSpeech,
} from '../../lib/guideBrowserSpeech';
import {
  getPublicVoiceProfile,
  getVoiceStudioStatus,
  renderVoiceAsset,
  resolveVoiceAsset,
  voiceProfileLabel,
  voiceProfilesForTenant,
  type VoiceProfile,
} from '../../lib/voiceStudioClient';
import { getAudioProgress, saveAudioProgress, clearAudioProgress } from '../../lib/audioProgressRepo';
import type { FinelyAudioContentType } from '../audio/FinelyAudioPlayer.types';

type Props = {
  narration: GuideNarration;
  /** Auto-play studio master when panel opens (never browser robot voice). */
  autoPlayPreview?: boolean;
  tenantId?: 'finely_cred' | 'nora_capital';
  /** Public pages: one site preset voice, no picker (change in Admin → Voice Studio). */
  presetOnly?: boolean;
  /** Progress memory key — defaults to guide content type. */
  contentType?: FinelyAudioContentType;
};

const ALLOW_BROWSER_PREVIEW = import.meta.env.VITE_VOICE_ALLOW_BROWSER_PREVIEW === 'true';
/** Local dev: auto-play narration without Supabase / Voice Studio (production uses studio masters only). */
const LOCAL_AUDIO_FALLBACK = import.meta.env.DEV || ALLOW_BROWSER_PREVIEW;

export function GuideAudioPlayer({
  narration,
  autoPlayPreview = false,
  tenantId = 'finely_cred',
  presetOnly = true,
  contentType = 'guide',
}: Props) {
  const [settingsTick, setSettingsTick] = useState(0);
  const presetVoice = getPublicVoiceProfile(tenantId);
  const [pickedVoice, setPickedVoice] = useState<VoiceProfile>(presetVoice);
  const voiceProfile = presetOnly ? presetVoice : pickedVoice;

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [studioErr, setStudioErr] = useState<string | null>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const revokeRef = useRef<(() => void) | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const signalRef = useRef({ cancelled: false });
  const autoPlayedRef = useRef(false);
  const lastProgressSaveRef = useRef(0);
  const studioStatus = getVoiceStudioStatus();
  const progressKey = narration.guideId;

  useEffect(() => {
    const onStore = () => setSettingsTick((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (presetOnly) setPickedVoice(getPublicVoiceProfile(tenantId));
  }, [presetOnly, tenantId, settingsTick]);

  const clearAudioUrl = useCallback(() => {
    try {
      revokeRef.current?.();
    } catch {
      // ignore
    }
    revokeRef.current = null;
    setAudioUrl(null);
  }, []);

  const loadStudioAsset = useCallback(
    async (opts?: { renderIfMissing?: boolean; force?: boolean }) => {
      if (opts?.renderIfMissing) setRendering(true);
      else setLoading(true);
      setStudioErr(null);
      clearAudioUrl();
      try {
        if (opts?.renderIfMissing) {
          const rendered = await renderVoiceAsset({
            tenantId,
            contentType,
            contentId: narration.guideId,
            title: narration.title,
            narration,
            voiceProfile,
            force: opts.force,
          });
          revokeRef.current = rendered.revoke ?? null;
          setAudioUrl(rendered.url);
          setProvider(rendered.asset.provider ?? null);
          return rendered.url;
        }
        const resolved = await resolveVoiceAsset({
          tenantId,
          contentType,
          contentId: narration.guideId,
          title: narration.title,
          narration,
          voiceProfile,
        });
        if (resolved) {
          revokeRef.current = resolved.revoke ?? null;
          setAudioUrl(resolved.url);
          setProvider(resolved.asset.provider ?? null);
          return resolved.url;
        }
        return null;
      } catch (err: unknown) {
        setStudioErr(err instanceof Error ? err.message : 'Could not load studio audio.');
        return null;
      } finally {
        setLoading(false);
        setRendering(false);
      }
    },
    [clearAudioUrl, contentType, narration, tenantId, voiceProfile],
  );

  const startBrowserPreview = useCallback(async () => {
    if (!LOCAL_AUDIO_FALLBACK) {
      setPreviewErr('Browser preview is disabled. Use studio render for human-quality audio.');
      return;
    }
    setPreviewErr(null);
    signalRef.current = { cancelled: false };
    setPlaying(true);
    setPaused(false);
    emitGuideAudioPlayed({ tenantId, guideId: narration.guideId, source: 'browser_preview' });
    try {
      const speechVoice = await ensureGuideSpeechVoices();
      if (!speechVoice) {
        setPreviewErr('Voice pack still loading. Try again.');
        setPlaying(false);
        return;
      }
      await speakGuideNaturalText({
        narration,
        voice: speechVoice,
        signal: signalRef.current,
      });
      if (!signalRef.current.cancelled) {
        setPlaying(false);
        setPaused(false);
      }
    } catch (err: unknown) {
      setPreviewErr(err instanceof Error ? err.message : 'Preview failed.');
      setPlaying(false);
      setPaused(false);
    }
  }, [narration, tenantId]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(el.paused && !el.ended);
    const onLoaded = () => {
      const saved = getAudioProgress(contentType, progressKey);
      if (saved?.seconds && saved.seconds > 2 && el.duration > saved.seconds + 5) {
        el.currentTime = saved.seconds;
      }
    };
    const onTimeUpdate = () => {
      const now = Date.now();
      if (now - lastProgressSaveRef.current < 4000) return;
      lastProgressSaveRef.current = now;
      if (el.currentTime > 1) {
        saveAudioProgress({
          contentType,
          contentId: progressKey,
          seconds: el.currentTime,
          duration: Number.isFinite(el.duration) ? el.duration : undefined,
        });
      }
    };
    const onEnded = () => clearAudioProgress(contentType, progressKey);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('ended', onEnded);
    };
  }, [audioUrl, contentType, progressKey]);

  useEffect(() => {
    autoPlayedRef.current = false;
    // Public pages: auto-generate the studio master on first open (visitors never click Render).
    if (presetOnly && studioStatus.available) {
      void loadStudioAsset({ renderIfMissing: true });
      return;
    }
    void loadStudioAsset();
  }, [loadStudioAsset, presetOnly, studioStatus.available]);

  useEffect(() => {
    return () => {
      signalRef.current.cancelled = true;
      stopGuideSpeech();
      clearAudioUrl();
    };
  }, [clearAudioUrl]);

  useEffect(() => {
    if (!autoPlayPreview || autoPlayedRef.current || loading || rendering) return;

    if (audioUrl) {
      autoPlayedRef.current = true;
      emitGuideAudioPlayed({ tenantId, guideId: narration.guideId, source: 'studio' });
      window.setTimeout(() => {
        audioRef.current?.play().catch(() => {
          // autoplay blocked — user can press play
        });
      }, 200);
      return;
    }

    if (LOCAL_AUDIO_FALLBACK && !studioStatus.available) {
      autoPlayedRef.current = true;
      void startBrowserPreview();
    }
  }, [autoPlayPreview, audioUrl, loading, narration.guideId, rendering, startBrowserPreview, studioStatus.available, tenantId]);

  const renderStudio = async (force = false) => {
    setRendering(true);
    setStudioErr(null);
    stopGuideSpeech();
    try {
      await loadStudioAsset({ renderIfMissing: true, force });
    } catch (err: unknown) {
      setStudioErr(err instanceof Error ? err.message : 'Studio render failed.');
    } finally {
      setRendering(false);
    }
  };

  const stopBrowserPreview = () => {
    signalRef.current.cancelled = true;
    stopGuideSpeech();
    setPlaying(false);
    setPaused(false);
  };

  const toggleBrowserPause = () => {
    if (isGuideSpeechPaused()) {
      resumeGuideSpeech();
      setPaused(false);
    } else if (isGuideSpeechActive()) {
      pauseGuideSpeech();
      setPaused(true);
    }
  };

  const toggleStudioPause = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPaused(false);
    } else {
      el.pause();
      setPaused(true);
    }
  };

  const playStudio = () => {
    emitGuideAudioPlayed({ tenantId, guideId: narration.guideId, source: 'studio' });
    void audioRef.current?.play();
    setPaused(false);
  };

  const downloadScript = () => {
    downloadText({ filename: `${narration.guideId}-narration.txt`, text: narrationToPlainText(narration) });
  };

  const adminProfiles = voiceProfilesForTenant(tenantId);

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 space-y-4">
      <div className="flex items-center gap-2 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
        <Headphones size={14} /> Finely Voice Studio
      </div>
      <p className="text-sm text-white/70 leading-relaxed">{narration.voiceDirection ?? narration.intro}</p>

      {presetOnly ? (
        <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2 text-sm text-white/75">
          Narrator: <span className="font-semibold text-emerald-200">{voiceProfileLabel(voiceProfile)}</span>
          <span className="block text-[10px] text-white/45 mt-1 uppercase tracking-wider">
            Site preset · change in Admin → Voice Studio
          </span>
        </div>
      ) : (
        <div className="grid gap-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/50">Voice profile</label>
          <select
            value={pickedVoice}
            onChange={(e) => setPickedVoice(e.target.value as VoiceProfile)}
            className="w-full rounded-xl border border-white/[0.08] bg-[#0f1412] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40 [&>option]:bg-[#0f1412] [&>option]:text-white"
          >
            {adminProfiles.map((p) => (
              <option key={p} value={p}>
                {voiceProfileLabel(p)}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading || rendering ? (
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={16} className="animate-spin" />
          {rendering ? 'Preparing studio narration…' : 'Loading studio master…'}
        </div>
      ) : audioUrl ? (
        <div className="space-y-2 fc-light-glass-panel fc-light-chrome-panel p-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-200">
            <Sparkles size={13} /> Studio master ready {provider ? `· ${provider}` : ''}
          </div>
          <audio ref={audioRef} controls src={audioUrl} className="w-full" preload="metadata" />
        </div>
      ) : playing ? (
        <div className="space-y-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] p-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-200">
            {paused ? <Pause size={13} /> : <Play size={13} className="animate-pulse" />}
            {paused ? 'Paused' : 'Now playing'}
            {LOCAL_AUDIO_FALLBACK && !audioUrl ? ' · local preview' : ''}
          </div>
        </div>
      ) : !studioStatus.available && LOCAL_AUDIO_FALLBACK ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-sm text-emerald-50/90">
          Local preview mode — narration starts automatically when you open audio. Connect Supabase + Voice Studio for
          production-quality masters.
        </div>
      ) : !studioStatus.available ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-sm text-amber-50/85">
          Audio is not connected yet. Add <span className="font-semibold">VITE_SUPABASE_URL</span> and{' '}
          <span className="font-semibold">VITE_SUPABASE_ANON_KEY</span> to <span className="font-semibold">.env.local</span>, deploy{' '}
          <span className="font-semibold">voice-studio</span>, then render from Admin → Voice Studio.
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-sm text-amber-50/85">
          {presetOnly
            ? 'Studio narration could not be prepared. Check Admin → Voice Studio or try again shortly.'
            : 'No studio master yet. Click Render studio audio for neural quality (not browser robot voice).'}
        </div>
      )}

      {studioErr ? <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-sm text-rose-100">{studioErr}</div> : null}
      {previewErr ? <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-50">{previewErr}</div> : null}

      <div className="flex flex-wrap items-center gap-2">
        {!presetOnly ? (
          <>
            <button
              type="button"
              onClick={() => void renderStudio(Boolean(audioUrl))}
              disabled={rendering || loading || !studioStatus.available}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              title={studioStatus.reason}
            >
              {rendering ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              {audioUrl ? 'Re-render studio audio' : 'Render studio audio'}
            </button>

            {LOCAL_AUDIO_FALLBACK ? (
              !playing ? (
                <button
                  type="button"
                  onClick={() => void startBrowserPreview()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/[0.06] text-white text-[10px] font-black uppercase tracking-widest"
                >
                  <Play size={14} /> Dev browser preview
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopBrowserPreview}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/[0.06] text-white text-[10px] font-black uppercase tracking-widest"
                >
                  <Square size={14} /> Stop preview
                </button>
              )
            ) : null}

            <button
              type="button"
              onClick={() => downloadText({ filename: `${narration.guideId}-performance-script.txt`, text: narrationToPerformanceScript(narration) })}
              className="inline-flex items-center gap-2 px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white"
            >
              <Download size={12} /> Performance script
            </button>
            <button
              type="button"
              onClick={() => downloadText({ filename: `${narration.guideId}-producer-notes.txt`, text: narrationToProducerNotes(narration) })}
              className="inline-flex items-center gap-2 px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white"
            >
              <Download size={12} /> Producer notes
            </button>
            <button
              type="button"
              onClick={downloadScript}
              className="inline-flex items-center gap-2 px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white"
            >
              <Download size={12} /> Plain script
            </button>
            <button
              type="button"
              onClick={() => downloadText({ filename: `${narration.guideId}-narration.ssml`, text: narrationToSsml(narration), mimeType: 'application/ssml+xml' })}
              className="inline-flex items-center gap-2 px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white"
            >
              <Download size={12} /> SSML
            </button>
          </>
        ) : playing ? (
          <>
            <button
              type="button"
              onClick={toggleBrowserPause}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={stopBrowserPreview}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/[0.06] text-white text-[10px] font-black uppercase tracking-widest"
            >
              <Square size={14} /> Stop
            </button>
          </>
        ) : audioUrl ? (
          <button
            type="button"
            onClick={() => (paused ? playStudio() : toggleStudioPause())}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
        ) : LOCAL_AUDIO_FALLBACK ? (
          <button
            type="button"
            onClick={() => void startBrowserPreview()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Play size={14} /> Play narration
          </button>
        ) : null}
      </div>

      {LOCAL_AUDIO_FALLBACK && playing ? (
        <div className="text-[10px] text-white/45 uppercase tracking-wider">
          Natural read mode · use pause anytime
        </div>
      ) : null}
    </div>
  );
}
