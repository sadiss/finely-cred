import React, { useEffect, useMemo, useState } from 'react';
import { Mic2, Music2, Pause, Play, Search, Volume2 } from 'lucide-react';
import {
  EXPANDED_VOICE_COUNT,
  listExpandedVoices,
  type ExpandedVoiceGender,
  type ExpandedVoiceUseCase,
} from '../../data/expandedVoiceCatalog';
import {
  listSoundEffects,
  SOUND_EFFECTS_COUNT,
  soundCategoryLabel,
  type SoundEffectCategory,
} from '../../data/soundEffectsCatalog';
import { playSoundPreview, playVoicePreview, stopMediaPreview } from '../../lib/mediaPreviewPlayer';
import { resolveVoicePreview } from '../../lib/voicePreviewEngine';
import { StudioKpiCards, StudioSection } from './StudioKpiCards';

type Tab = 'voices' | 'sounds';

export function VoiceSoundLibraryPanel({
  selectedVoiceId,
  onSelectVoice,
  selectedSoundIds = [],
  onToggleSound,
}: {
  selectedVoiceId?: string;
  onSelectVoice?: (id: string) => void;
  selectedSoundIds?: string[];
  onToggleSound?: (id: string) => void;
}) {
  const [tab, setTab] = useState<Tab>('voices');
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<ExpandedVoiceGender | 'all'>('all');
  const [useCase, setUseCase] = useState<ExpandedVoiceUseCase | 'all'>('all');
  const [soundCategory, setSoundCategory] = useState<SoundEffectCategory | 'all'>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);

  useEffect(() => () => stopMediaPreview(), []);

  const voices = useMemo(
    () =>
      listExpandedVoices({
        query,
        gender: gender === 'all' ? undefined : gender,
        useCase: useCase === 'all' ? undefined : useCase,
      }),
    [query, gender, useCase],
  );

  const sounds = useMemo(
    () =>
      listSoundEffects({
        query,
        category: soundCategory === 'all' ? undefined : soundCategory,
      }),
    [query, soundCategory],
  );

  const kpis = useMemo(
    () => [
      { label: 'Voice personas', value: EXPANDED_VOICE_COUNT, hint: 'Course, ad, testimonial, funding', tone: 'violet' as const },
      { label: 'Sound library', value: SOUND_EFFECTS_COUNT, hint: 'SFX, beds, cinematic, UI', tone: 'sky' as const },
      { label: 'Active tab', value: tab === 'voices' ? 'Voices' : 'Sounds', hint: 'Click any item to preview audio', tone: 'amber' as const },
      { label: 'Selected', value: tab === 'voices' ? (selectedVoiceId ? 1 : 0) : selectedSoundIds.length, hint: 'Applied to render plan', tone: 'emerald' as const },
    ],
    [tab, selectedVoiceId, selectedSoundIds.length],
  );

  const previewVoice = (voiceId: string) => {
    setPreviewErr(null);
    const preview = resolveVoicePreview(voiceId);
    if (!preview) {
      setPreviewErr('Voice preview unavailable.');
      return;
    }
    setPlayingId(voiceId);
    void playVoicePreview({
      voiceId,
      text: preview.text,
      pitch: preview.pitch,
      rate: preview.rate,
      gender: preview.gender,
      onEnd: () => setPlayingId((id) => (id === voiceId ? null : id)),
    }).then((mode) => {
      if (mode === 'none') setPreviewErr('Voice preview unavailable in this browser.');
    });
  };

  const previewSound = async (soundId: string, url: string) => {
    setPreviewErr(null);
    try {
      setPlayingId(soundId);
      await playSoundPreview(url);
    } catch {
      setPreviewErr('Could not play this sound. Regenerate assets or check browser autoplay settings.');
    } finally {
      setPlayingId((id) => (id === soundId ? null : id));
    }
  };

  return (
    <div className="space-y-6">
      <StudioKpiCards items={kpis} />

      {previewErr ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">{previewErr}</div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(['voices', 'sounds'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ' +
              (tab === t
                ? 'border-violet-400/50 bg-violet-500/20 text-violet-100'
                : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10')
            }
          >
            {t === 'voices' ? <Mic2 size={16} /> : <Music2 size={16} />}
            {t === 'voices' ? 'Voices' : 'Sounds'}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === 'voices' ? 'Search 100+ voice personas…' : 'Search 300+ sounds…'}
          className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white/85 placeholder:text-white/30 outline-none focus:border-violet-500/40"
        />
      </div>

      {tab === 'voices' ? (
        <>
          <div className="flex flex-wrap gap-2">
            {(['all', 'masculine', 'feminine', 'neutral'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                  gender === g ? 'border-violet-400/40 bg-violet-500/15 text-violet-200' : 'border-white/10 text-white/50'
                }`}
              >
                {g}
              </button>
            ))}
            {(['all', 'course', 'commercial', 'testimonial', 'funding'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUseCase(u)}
                className={`rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                  useCase === u ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : 'border-white/10 text-white/50'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          <StudioSection eyebrow="Voice catalog" title={`Showing ${voices.length} of ${EXPANDED_VOICE_COUNT}`}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[420px] overflow-y-auto pr-1">
              {voices.map((v) => {
                const selected = selectedVoiceId === v.id;
                const playing = playingId === v.id;
                return (
                  <div
                    key={v.id}
                    className={
                      'rounded-2xl border p-3 transition-all ' +
                      (selected
                        ? 'border-violet-400/50 bg-violet-500/15 ring-1 ring-violet-400/30'
                        : 'border-white/[0.08] bg-white/[0.03] hover:border-violet-500/25')
                    }
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => previewVoice(v.id)}
                        className={`shrink-0 rounded-lg border p-2 transition-colors ${
                          playing ? 'border-violet-300/50 bg-violet-500/25 text-violet-100' : 'border-white/10 bg-black/20 text-white/60 hover:text-violet-200'
                        }`}
                        title="Play voice preview"
                      >
                        {playing ? <Pause size={14} /> : <Volume2 size={14} />}
                      </button>
                      <button type="button" onClick={() => previewVoice(v.id)} className="min-w-0 flex-1 text-left">
                        <span className="text-sm font-semibold text-white truncate block">{v.label}</span>
                        <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                          {v.tone} · {v.region.replace(/_/g, ' ')} · {v.energy}
                        </p>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectVoice?.(v.id)}
                      className={`mt-3 w-full rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        selected ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : 'border-white/10 text-white/50 hover:bg-white/5'
                      }`}
                    >
                      {selected ? 'Assigned' : 'Assign to project'}
                    </button>
                  </div>
                );
              })}
            </div>
          </StudioSection>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {(['all', 'ui', 'whoosh', 'cinematic', 'corporate', 'music_bed', 'testimonial'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSoundCategory(c)}
                className={`rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                  soundCategory === c ? 'border-sky-400/40 bg-sky-500/15 text-sky-200' : 'border-white/10 text-white/50'
                }`}
              >
                {c === 'all' ? 'all' : soundCategoryLabel(c)}
              </button>
            ))}
          </div>
          <StudioSection eyebrow="Sound effects & beds" title={`Showing ${sounds.length} of ${SOUND_EFFECTS_COUNT}`}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[420px] overflow-y-auto pr-1">
              {sounds.map((s) => {
                const selected = selectedSoundIds.includes(s.id);
                const playing = playingId === s.id;
                return (
                  <div
                    key={s.id}
                    className={
                      'rounded-2xl border p-3 transition-all ' +
                      (selected
                        ? 'border-sky-400/50 bg-sky-500/15 ring-1 ring-sky-400/30'
                        : 'border-white/[0.08] bg-white/[0.03] hover:border-sky-500/25')
                    }
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => void previewSound(s.id, s.previewUrl)}
                        className={`shrink-0 rounded-lg border p-2 transition-colors ${
                          playing ? 'border-sky-300/50 bg-sky-500/25 text-sky-100' : 'border-white/10 bg-black/20 text-white/60 hover:text-sky-200'
                        }`}
                        title="Play sound preview"
                      >
                        {playing ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button type="button" onClick={() => void previewSound(s.id, s.previewUrl)} className="min-w-0 flex-1 text-left">
                        <p className="text-sm font-semibold text-white truncate">{s.label}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                          {soundCategoryLabel(s.category)} · {(s.durationMs / 1000).toFixed(1)}s · {s.intensity}
                        </p>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleSound?.(s.id)}
                      className={`mt-3 w-full rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        selected ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : 'border-white/10 text-white/50 hover:bg-white/5'
                      }`}
                    >
                      {selected ? 'In project' : 'Add to project'}
                    </button>
                  </div>
                );
              })}
            </div>
          </StudioSection>
        </>
      )}
    </div>
  );
}
