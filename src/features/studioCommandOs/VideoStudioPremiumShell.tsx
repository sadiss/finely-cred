import React, { useEffect, useState } from 'react';
import {
  Clapperboard,
  Film,
  Library,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import { GeminiStyleVideoCommand } from './GeminiStyleVideoCommand';
import { VideoUploadIntelligencePanel } from './VideoUploadIntelligencePanel';
import { VoiceSoundLibraryPanel } from './VoiceSoundLibraryPanel';
import { EXPANDED_VOICE_COUNT } from '../../data/expandedVoiceCatalog';
import { SOUND_EFFECTS_COUNT } from '../../data/soundEffectsCatalog';
import { listVideoProviderStatuses, videoProviderReadinessScore } from '../../lib/videoProviderRenderPlan';
import type { VideoCommandRequest } from './types';

type StudioTab = 'create' | 'upload' | 'library' | 'quality';

const TABS: Array<{ id: StudioTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; hint: string }> = [
  { id: 'create', label: 'Create', icon: Wand2, hint: 'Prompt-to-video, storyboard, render' },
  { id: 'upload', label: 'Upload & analyze', icon: Upload, hint: 'Read any footage for courses, ads, testimonials' },
  { id: 'library', label: 'Voices & sounds', icon: Library, hint: `${EXPANDED_VOICE_COUNT}+ voices · ${SOUND_EFFECTS_COUNT}+ SFX` },
  { id: 'quality', label: 'Pro pipeline', icon: Sparkles, hint: 'Next-gen generation checklist' },
];

const QUALITY_CHECKLIST = [
  'Multi-scene storyboard with compliance flags and platform cutdowns',
  'Scene-level image gen + motion prompts + caption overlays',
  'Expanded voice persona routing to ElevenLabs / brand clone fallbacks',
  'Layer SFX and music beds from the 300+ sound catalog',
  'WebM export with render history + resource library publish',
  'Upload intelligence routes footage to course scrape, testimonial reel, or commercial cut',
  'Provider hooks ready: Kling, Runway, avatar, and B-roll lanes',
];

export function VideoStudioPremiumShell({ initialRequest }: { initialRequest?: Partial<VideoCommandRequest> }) {
  const [tab, setTab] = useState<StudioTab>('create');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>();
  const [selectedSounds, setSelectedSounds] = useState<string[]>([]);
  const providerStatuses = listVideoProviderStatuses();
  const providerScore = videoProviderReadinessScore();

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get('tab');
    if (t === 'upload' || t === 'library' || t === 'quality' || t === 'create') {
      setTab(t);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-[#0f0a1a] via-[#12101f] to-[#0a1628] p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300/90">Video command OS</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-white tracking-tight">
              Create, analyze, and ship — one studio
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/55 leading-relaxed">
              Generate commercials and course clips, read uploaded footage at a high level, and pick from {EXPANDED_VOICE_COUNT}+ voices and {SOUND_EFFECTS_COUNT}+ sounds — without leaving Content Studio.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2">
            <Film size={18} className="text-emerald-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">Pro render lane</span>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                title={t.hint}
                className={
                  'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all ' +
                  (active
                    ? 'border-violet-400/50 bg-violet-500/25 text-white shadow-lg shadow-violet-900/30'
                    : 'border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white/80')
                }
              >
                <Icon size={16} className={active ? 'text-violet-200' : undefined} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'create' ? (
        <GeminiStyleVideoCommand
          key={JSON.stringify(initialRequest ?? {})}
          initialRequest={{
            ...initialRequest,
            voicePersonaId: selectedVoiceId ?? initialRequest?.voicePersonaId,
            soundEffectIds: selectedSounds.length ? selectedSounds : initialRequest?.soundEffectIds,
          }}
        />
      ) : null}

      {tab === 'upload' ? <VideoUploadIntelligencePanel /> : null}

      {tab === 'library' ? (
        <VoiceSoundLibraryPanel
          selectedVoiceId={selectedVoiceId}
          onSelectVoice={setSelectedVoiceId}
          selectedSoundIds={selectedSounds}
          onToggleSound={(id) =>
            setSelectedSounds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          }
        />
      ) : null}

      {tab === 'quality' ? (
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
              <Clapperboard size={22} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Next-level generation pipeline</p>
              <p className="text-sm text-white/50">Everything wired for enterprise video factory — create tab runs the full stack.</p>
            </div>
          </div>
          <ul className="grid md:grid-cols-2 gap-3">
            {QUALITY_CHECKLIST.map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-black/20 p-4 text-sm text-white/70"
              >
                <Sparkles size={14} className="text-amber-400 mt-0.5 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-emerald-100">Live provider readiness — {providerScore}%</p>
              <span className="text-[10px] uppercase tracking-widest text-emerald-300/80">Phase 21 lane</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {providerStatuses.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-xl border px-3 py-2 text-xs ${
                    p.ready ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-black/20 text-white/55'
                  }`}
                >
                  <div className="font-semibold">{p.label}</div>
                  <div className="mt-0.5 text-[10px] opacity-80">{p.hint}</div>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTab('create')}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-5 py-2.5 text-sm font-semibold text-amber-100 hover:bg-amber-500/25"
          >
            <Wand2 size={16} /> Open create workroom
          </button>
        </div>
      ) : null}
    </div>
  );
}
