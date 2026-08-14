import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Clapperboard, FileText, Image as ImageIcon, Mic2 } from 'lucide-react';
import {
  getImageTechniquesByCategory,
  getScriptFrameworksByCategory,
  getVideoTechniquesByCategory,
  getVoiceTechniquesByCategory,
  type CopywritingScriptFramework,
  type ImageProductionTechnique,
  type ImageTechniqueCategory,
  type ScriptFrameworkCategory,
  type VideoProductionTechnique,
  type VideoTechniqueCategory,
  type VoiceAudioTechnique,
  type VoiceTechniqueCategory,
} from '../../data/contentStudioMediaEngineRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  finelyOsCatalogCardCompact,
  finelyOsGlowTile,
} from '../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';

/**
 * TECHNIQUE & FRAMEWORK LIBRARY PANEL
 *
 * Deliverable of Phase 13 (Deep Marketing & Proof Intelligence Sprint):
 * a compact reference browser over `contentStudioMediaEngineRepo` so
 * creators can look up real production techniques and copywriting
 * frameworks while working a Content Studio job, without leaving the page.
 * Chip-based pickers only (no native dropdowns) per compact-luxury UI rules.
 */

type MediaKind = 'video' | 'image' | 'voice' | 'script';

type LibraryItem = VideoProductionTechnique | ImageProductionTechnique | VoiceAudioTechnique | CopywritingScriptFramework;

function isScriptFramework(item: LibraryItem): item is CopywritingScriptFramework {
  return 'template' in item && 'exampleFilled' in item;
}

const MEDIA_TYPE_OPTIONS: Array<{ id: MediaKind; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; glow: 'violet' | 'emerald' | 'fuchsia' | 'sky' | 'amber' | 'rose' }> = [
  { id: 'video', label: 'Video', icon: Clapperboard, glow: 'amber' },
  { id: 'image', label: 'Image', icon: ImageIcon, glow: 'violet' },
  { id: 'voice', label: 'Voice/Audio', icon: Mic2, glow: 'emerald' },
  { id: 'script', label: 'Copywriting', icon: FileText, glow: 'sky' },
];

const VIDEO_CATEGORIES: VideoTechniqueCategory[] = [
  'hook_pattern',
  'pacing_editing',
  'b_roll_strategy',
  'caption_style',
  'thumbnail_design',
  'aspect_ratio_format',
  'color_grading',
  'audio_mixing',
];

const IMAGE_CATEGORIES: ImageTechniqueCategory[] = [
  'layered_composite',
  'background_removal',
  'brand_template',
  'text_overlay',
  'carousel_design',
  'infographic',
  'before_after_comparison',
  'thumbnail_composition',
];

const VOICE_CATEGORIES: VoiceTechniqueCategory[] = [
  'voice_cloning',
  'text_to_speech',
  'voice_isolation',
  'background_music_licensing',
  'sound_effect_layering',
  'podcast_mastering',
  'multilingual_dubbing',
];

const SCRIPT_CATEGORIES: ScriptFrameworkCategory[] = [
  'hook_formula',
  'ad_script_structure',
  'email_sequence_arc',
  'landing_page_copy',
  'video_script_beat_sheet',
  'caption_cta_formula',
];

function categoriesForMediaKind(kind: MediaKind): string[] {
  if (kind === 'video') return VIDEO_CATEGORIES;
  if (kind === 'image') return IMAGE_CATEGORIES;
  if (kind === 'voice') return VOICE_CATEGORIES;
  return SCRIPT_CATEGORIES;
}

function categoryLabel(id: string): string {
  return id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function itemsForSelection(kind: MediaKind, category: string): LibraryItem[] {
  if (kind === 'video') return getVideoTechniquesByCategory(category as VideoTechniqueCategory);
  if (kind === 'image') return getImageTechniquesByCategory(category as ImageTechniqueCategory);
  if (kind === 'voice') return getVoiceTechniquesByCategory(category as VoiceTechniqueCategory);
  return getScriptFrameworksByCategory(category as ScriptFrameworkCategory);
}

export function MediaTechniqueLibraryPanel() {
  const [mediaKind, setMediaKind] = useState<MediaKind>('video');
  const [category, setCategory] = useState<string>(VIDEO_CATEGORIES[0]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const categoryOptions = useMemo(() => categoriesForMediaKind(mediaKind), [mediaKind]);

  useEffect(() => {
    if (!categoryOptions.includes(category)) setCategory(categoryOptions[0]);
  }, [categoryOptions, category]);

  const items = useMemo(() => itemsForSelection(mediaKind, category), [mediaKind, category]);
  const activeMediaType = MEDIA_TYPE_OPTIONS.find((m) => m.id === mediaKind) ?? MEDIA_TYPE_OPTIONS[0]!;

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderCard = (item: LibraryItem) => {
    const script = isScriptFramework(item) ? item : null;
    const expanded = expandedIds.has(item.id);
    return (
      <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-[9px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>{categoryLabel(item.category)}</p>
            <h4 className="text-sm font-bold text-white leading-snug">{item.title}</h4>
          </div>
        </div>
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY} leading-relaxed`}>{item.description}</p>
        {!script ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(item as VideoProductionTechnique | ImageProductionTechnique | VoiceAudioTechnique).toolsThatDoThisWell.map((tool) => (
              <span key={tool} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/55">
                {tool}
              </span>
            ))}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {script.bestForPersona.map((persona) => (
                <span key={persona} className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-100">
                  {persona}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => toggleExpanded(item.id)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-200 hover:text-sky-100"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Hide template & example' : 'Show template & example'}
            </button>
            {expanded ? (
              <div className="space-y-2 pt-1">
                <div className="rounded-xl border border-white/10 bg-black/35 p-2.5">
                  <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Template</p>
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-white/70 font-sans">{script.template}</pre>
                </div>
                <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06] p-2.5">
                  <p className="text-[9px] uppercase tracking-widest text-emerald-200/70 mb-1">Example (Finely Cred)</p>
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-white/70 font-sans">{script.exampleFilled}</pre>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`${finelyOsCatalogCardCompact('sky')} space-y-3`}>
      <div>
        <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>Technique & framework library</p>
        <h3 className={FINELY_OS_ENTITY_TITLE}>Real production techniques, ready to apply</h3>
        <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY} max-w-2xl`}>
          Browse mainstream video, image, voice, and copywriting techniques by category — with real tool names and
          fill-in-the-blank frameworks you can apply to this job.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>Media type</div>
        <div className="flex flex-wrap gap-2">
          {MEDIA_TYPE_OPTIONS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMediaKind(m.id)}
                className={`${finelyOsGlowTile(m.glow, mediaKind === m.id)} inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white/85`}
              >
                <Icon size={13} /> {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>Category</div>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`${finelyOsGlowTile(activeMediaType.glow, category === c)} px-3 py-1.5 text-[11px] font-semibold text-white/80`}
            >
              {categoryLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-1">
        <FinelyOsPaginatedStack
          items={items}
          pageSize={10}
          itemSpacingClassName="space-y-2"
          emptyMessage="No techniques in this category yet."
          renderItem={(item) => renderCard(item)}
        />
      </div>
    </div>
  );
}
