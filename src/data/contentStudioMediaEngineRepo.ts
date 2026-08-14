/**
 * CONTENT STUDIO MEDIA ENGINE REPOSITORY
 *
 * Deep, well-researched reference data covering mainstream content-production
 * tooling and technique categories: video, image, voice/audio, and
 * copywriting/script frameworks. This is a *knowledge base*, not an
 * integration — `toolsThatDoThisWell` names real, well-known apps for
 * inspiration/reference only (no API claims, no vendor endorsement).
 *
 * Intended consumer: the Content Studio copilot brain (see
 * `src/features/studioCommandOs/videoCreationCopilotBrain.ts` and
 * `mediaCommandBrain.ts`) so it can eventually recognize production gaps
 * ("no caption-burn-in plan yet", "no before/after proof format selected")
 * and suggest a concrete next technique instead of a generic prompt.
 *
 * Compliance: examples avoid guaranteed-outcome language and use the
 * "results vary" framing established across the codebase (see
 * `src/data/caseStudiesRepo.ts`).
 */

export type VideoTechniqueCategory =
  | 'hook_pattern'
  | 'pacing_editing'
  | 'b_roll_strategy'
  | 'caption_style'
  | 'thumbnail_design'
  | 'aspect_ratio_format'
  | 'color_grading'
  | 'audio_mixing';

export interface VideoProductionTechnique {
  id: string;
  category: VideoTechniqueCategory;
  title: string;
  description: string;
  whenToUse: string[];
  /** Real, well-known tools/apps commonly used for this — for reference/inspiration, not integration claims. */
  toolsThatDoThisWell: string[];
  platformFit: string[];
}

export type ImageTechniqueCategory =
  | 'layered_composite'
  | 'background_removal'
  | 'brand_template'
  | 'text_overlay'
  | 'carousel_design'
  | 'infographic'
  | 'before_after_comparison'
  | 'thumbnail_composition';

export interface ImageProductionTechnique {
  id: string;
  category: ImageTechniqueCategory;
  title: string;
  description: string;
  whenToUse: string[];
  toolsThatDoThisWell: string[];
  outputFormats: string[];
}

export type VoiceTechniqueCategory =
  | 'voice_cloning'
  | 'text_to_speech'
  | 'voice_isolation'
  | 'background_music_licensing'
  | 'sound_effect_layering'
  | 'podcast_mastering'
  | 'multilingual_dubbing';

export interface VoiceAudioTechnique {
  id: string;
  category: VoiceTechniqueCategory;
  title: string;
  description: string;
  whenToUse: string[];
  toolsThatDoThisWell: string[];
  /** e.g. voice cloning consent/disclosure requirements. */
  complianceNotes?: string;
}

export type ScriptFrameworkCategory =
  | 'hook_formula'
  | 'ad_script_structure'
  | 'email_sequence_arc'
  | 'landing_page_copy'
  | 'video_script_beat_sheet'
  | 'caption_cta_formula';

export interface CopywritingScriptFramework {
  id: string;
  category: ScriptFrameworkCategory;
  title: string;
  description: string;
  /** A fill-in-the-blank template/skeleton. */
  template: string;
  /** One worked example using Finely Cred credit-restore/business-funding context. */
  exampleFilled: string;
  /** Which growth agent/persona would use this. */
  bestForPersona: string[];
}

// ─────────────────────────────────────────────────────────────────────────
// VIDEO PRODUCTION TECHNIQUES
// ─────────────────────────────────────────────────────────────────────────

export const VIDEO_PRODUCTION_TECHNIQUES: VideoProductionTechnique[] = [
  {
    id: 'vid_hook_3sec_rule',
    category: 'hook_pattern',
    title: 'The 3-second hook rule',
    description:
      'The first 3 seconds must deliver a visual or verbal reason to keep watching — a face, a number, or a question — before any logo, intro, or brand setup. Short-form platforms measure retention at the 3s mark and suppress distribution when it craters.',
    whenToUse: [
      'Any vertical short (Reels, TikTok, Shorts) meant for cold/algorithmic distribution',
      'Paid ad creative where the first frame is the only guaranteed impression',
      'Re-cuts of long-form content into clips',
    ],
    toolsThatDoThisWell: ['CapCut', 'Opus Clip', 'Descript', 'VEED.IO'],
    platformFit: ['tiktok', 'instagram_reels', 'youtube_shorts'],
  },
  {
    id: 'vid_hook_pattern_interrupt',
    category: 'hook_pattern',
    title: 'Pattern-interrupt open',
    description:
      'Open mid-action, mid-sentence, or with an unexpected visual (e.g. starting on the "after" result, or a jarring zoom) instead of a slow scene-setting intro. Breaks the scroll autopilot by refusing to look like a normal video opener.',
    whenToUse: [
      'Feeds saturated with polished, similar-looking content',
      'Educational clips that risk feeling like a lecture',
      'Recruiting or affiliate ads competing against generic opportunity pitches',
    ],
    toolsThatDoThisWell: ['CapCut', 'Adobe Premiere Pro', 'Final Cut Pro'],
    platformFit: ['tiktok', 'instagram_reels', 'youtube_shorts', 'linkedin'],
  },
  {
    id: 'vid_hook_curiosity_gap',
    category: 'hook_pattern',
    title: 'Curiosity-gap hook',
    description:
      'State a specific, concrete outcome without revealing the mechanism yet ("here is the exact letter that got this account corrected") so the viewer has an open loop that only the rest of the video closes.',
    whenToUse: [
      'Explainer or how-to content where the payoff is a specific tactic',
      'Case-study style clips built from case study repo entries',
      'Email subject lines and video titles paired with the same hook',
    ],
    toolsThatDoThisWell: ['Descript', 'CapCut', 'Google Docs (script drafting)'],
    platformFit: ['tiktok', 'instagram_reels', 'youtube_long', 'youtube_shorts'],
  },
  {
    id: 'vid_hook_bold_claim',
    category: 'hook_pattern',
    title: 'Bold claim / stat hook',
    description:
      'Lead with the single most compelling, verifiable number from the piece (a point delta, a funding amount, a timeframe) stated plainly on screen and in voiceover simultaneously. Must be paired with a "results vary" disclaimer per compliance requirements.',
    whenToUse: [
      'Proof-driven ads and case-study recaps',
      'Any clip quoting a score change, funding amount, or timeframe',
      'Thumbnail/first-frame text pairing',
    ],
    toolsThatDoThisWell: ['CapCut', 'Canva', 'Adobe Premiere Pro'],
    platformFit: ['tiktok', 'instagram_reels', 'youtube_shorts', 'youtube_long'],
  },
  {
    id: 'vid_pacing_jump_cut',
    category: 'pacing_editing',
    title: 'Jump-cut pacing',
    description:
      'Remove pauses, filler words, and dead air between phrases so cuts land roughly every 1.5–3 seconds, keeping visual novelty high without changing the shot. The dominant pacing style for talking-head short-form content since the 2019–2020 YouTube/podcast-clip era.',
    whenToUse: [
      'Single-camera talking-head recordings',
      'Repurposing long podcast/interview footage into short clips',
      'Any script with natural verbal pauses that read slow on camera',
    ],
    toolsThatDoThisWell: ['Descript', 'CapCut', 'Premiere Pro (Auto Reframe + cut)'],
    platformFit: ['tiktok', 'instagram_reels', 'youtube_shorts', 'youtube_long'],
  },
  {
    id: 'vid_pacing_zoom_punch',
    category: 'pacing_editing',
    title: 'Zoom punch-in on key line',
    description:
      'A subtle 5–10% scale push on the single most important sentence in a scene (the number, the CTA, the twist) to add visual emphasis without changing footage, mimicking a camera operator reacting to what matters.',
    whenToUse: [
      'Emphasizing the exact line that states the outcome or CTA',
      'Static single-camera setups without B-roll coverage',
      'Testimonial-style clips',
    ],
    toolsThatDoThisWell: ['CapCut', 'Premiere Pro', 'DaVinci Resolve'],
    platformFit: ['tiktok', 'instagram_reels', 'youtube_shorts', 'linkedin'],
  },
  {
    id: 'vid_broll_ratio',
    category: 'b_roll_strategy',
    title: '60/40 talking-head to B-roll ratio',
    description:
      'Keep roughly 60% of runtime on the presenter for trust and connection, and cut in 40% supporting B-roll (screen recordings, document close-ups, stock inserts) to illustrate claims and reset visual attention every 4–6 seconds.',
    whenToUse: [
      'Educational or authority-building clips longer than 20 seconds',
      'Any claim that benefits from visual proof (a document, a dashboard, a letter)',
      'Content that risks feeling like a static "talking at camera" video',
    ],
    toolsThatDoThisWell: ['DaVinci Resolve', 'Premiere Pro', 'Storyblocks', 'Envato Elements'],
    platformFit: ['youtube_long', 'youtube_shorts', 'instagram_reels', 'linkedin'],
  },
  {
    id: 'vid_broll_screen_capture',
    category: 'b_roll_strategy',
    title: 'Screen-capture B-roll for proof',
    description:
      'Record the actual product/portal/dashboard being discussed (a checklist completing, a letter generating, a dispute status updating) as B-roll instead of generic stock footage — dramatically increases perceived credibility for SaaS/finance content.',
    whenToUse: [
      'Any claim about a workflow, tool, or portal feature',
      'Walkthrough and demo-style content',
      'Ads that need to substantiate "here is exactly what you get"',
    ],
    toolsThatDoThisWell: ['OBS Studio', 'CapCut', 'Descript', 'Loom'],
    platformFit: ['youtube_long', 'youtube_shorts', 'linkedin', 'instagram_reels'],
  },
  {
    id: 'vid_caption_burn_in',
    category: 'caption_style',
    title: 'Burned-in captions for accessibility and sound-off viewing',
    description:
      'Hard-coded (burned-in) captions covering 85%+ of speech, sized for mobile legibility, positioned in the safe zone away from platform UI overlays. The majority of social video is watched muted, so captions are functionally required, not optional.',
    whenToUse: [
      'Every short-form video without exception',
      'Any ad creative, since platforms auto-play muted by default',
      'Compliance-sensitive content where exact wording must be visible, not just heard',
    ],
    toolsThatDoThisWell: ['CapCut', 'Submagic', 'VEED.IO', 'Descript'],
    platformFit: ['tiktok', 'instagram_reels', 'youtube_shorts', 'linkedin', 'youtube_long'],
  },
  {
    id: 'vid_caption_keyword_highlight',
    category: 'caption_style',
    title: 'Keyword-highlight captions',
    description:
      'Style captions so the single emphasis word per line (a number, "free," "removed," a city name) pops in a bold accent color or larger size while the rest stays neutral — draws the eye without needing to read every word.',
    whenToUse: [
      'Numbers, dollar amounts, or outcome words that should register even on a quick scroll-by',
      'Ad creative competing for attention against dozens of other ads',
      'Brand-consistent caption styling across a content series',
    ],
    toolsThatDoThisWell: ['CapCut', 'Submagic', 'Opus Clip'],
    platformFit: ['tiktok', 'instagram_reels', 'youtube_shorts'],
  },
  {
    id: 'vid_thumb_face_text',
    category: 'thumbnail_design',
    title: 'High-contrast face + text thumbnail',
    description:
      'A clear, emotionally legible facial expression paired with 3–5 bold words in a high-contrast color against a simplified background — the long-running YouTube thumbnail formula because it reads at postage-stamp size on a feed.',
    whenToUse: [
      'YouTube long-form uploads where the thumbnail is a primary click driver',
      'Resource library or course cover art needing quick recognizability',
      'Any thumbnail meant to be scanned in a grid alongside competitors',
    ],
    toolsThatDoThisWell: ['Photoshop', 'Canva', 'Figma', 'Placeit'],
    platformFit: ['youtube_long', 'youtube_shorts'],
  },
  {
    id: 'vid_thumb_before_after',
    category: 'thumbnail_design',
    title: 'Before/after split thumbnail',
    description:
      'A vertical or diagonal split showing the "before" state on one side and the "after" state on the other (score numbers, a messy vs. organized document, a red vs. green status) — one of the highest-performing thumbnail patterns for transformation content.',
    whenToUse: [
      'Case-study or results-recap videos',
      'Any content built from case study repo entries with a starting/ending score',
      'Comparison-driven educational content (before vs. after a dispute round)',
    ],
    toolsThatDoThisWell: ['Photoshop', 'Canva', 'Figma'],
    platformFit: ['youtube_long', 'youtube_shorts', 'instagram_reels'],
  },
  {
    id: 'vid_aspect_vertical_safezone',
    category: 'aspect_ratio_format',
    title: 'Vertical 9:16 safe-zone framing',
    description:
      'Keep all essential text, faces, and CTAs inside the central ~80% of a 1080×1920 frame so nothing is obscured by platform UI (captions bar, like/share buttons, username overlay) which varies slightly across TikTok, Reels, and Shorts.',
    whenToUse: [
      'Any vertical export destined for multiple short-form platforms at once',
      'Templates meant to be reused across a content calendar',
      'Content with on-screen text or lower-thirds',
    ],
    toolsThatDoThisWell: ['CapCut', 'Premiere Pro', 'Canva'],
    platformFit: ['tiktok', 'instagram_reels', 'youtube_shorts'],
  },
  {
    id: 'vid_aspect_cutdown_matrix',
    category: 'aspect_ratio_format',
    title: 'Platform-native cutdown matrix',
    description:
      'Produce one master edit, then generate platform-specific cutdowns (a 28s 9:16 reel, a 60s 16:9 pre-roll, a 15s 1:1 feed post) rather than force-cropping a single master into every slot — each cutdown re-times the hook and CTA for that platform\'s attention pattern.',
    whenToUse: [
      'Campaign launches that need simultaneous multi-platform distribution',
      'Repurposing a single long-form asset into a week of shorter posts',
      'Ad testing across Meta, YouTube, and TikTok simultaneously',
    ],
    toolsThatDoThisWell: ['Premiere Pro', 'DaVinci Resolve', 'Opus Clip', 'Pictory'],
    platformFit: ['tiktok', 'instagram_reels', 'youtube_shorts', 'youtube_long', 'linkedin'],
  },
  {
    id: 'vid_color_warm_trust',
    category: 'color_grading',
    title: 'Warm, trust-building grade',
    description:
      'A gentle warm-tone grade (lifted shadows, slight amber/gold push, softened contrast) that reads as approachable and premium rather than cold or corporate — appropriate for finance/credit education content where trust is the primary emotional target.',
    whenToUse: [
      'Educational and authority-building content',
      'Testimonial-style or presenter-led clips',
      'Any content meant to feel personal rather than transactional',
    ],
    toolsThatDoThisWell: ['DaVinci Resolve', 'Premiere Pro (Lumetri)', 'Adobe Photoshop (still frames)'],
    platformFit: ['youtube_long', 'linkedin', 'instagram_reels', 'youtube_shorts'],
  },
  {
    id: 'vid_color_documentary_authority',
    category: 'color_grading',
    title: 'Desaturated documentary grade for authority clips',
    description:
      'A slightly desaturated, higher-contrast grade with cooler shadows conveys seriousness and factual authority — well suited to legal/compliance-adjacent explainer content (debt validation, FDCPA rights) where credibility matters more than warmth.',
    whenToUse: [
      'Debt validation, legal-rights, or statutory-citation explainer clips',
      'Authority/education content aimed at a skeptical audience',
      'Content quoting statutes or case-study statutory basis',
    ],
    toolsThatDoThisWell: ['DaVinci Resolve', 'Premiere Pro (Lumetri)'],
    platformFit: ['youtube_long', 'linkedin', 'youtube_shorts'],
  },
  {
    id: 'vid_audio_ducking',
    category: 'audio_mixing',
    title: 'Automatic music ducking under voice',
    description:
      'Sidechain or auto-duck background music to drop 8–12dB whenever voiceover is present, then rise back to full level in silent B-roll stretches — prevents the single most common amateur mistake of music fighting with narration.',
    whenToUse: ['Every video with both voiceover and a music bed', 'Multi-scene edits with varying dialogue density'],
    toolsThatDoThisWell: ['Descript', 'Premiere Pro', 'DaVinci Resolve (Fairlight)', 'Auphonic'],
    platformFit: ['tiktok', 'instagram_reels', 'youtube_shorts', 'youtube_long', 'linkedin'],
  },
  {
    id: 'vid_audio_voice_eq_deess',
    category: 'audio_mixing',
    title: 'Voice EQ + de-essing for clarity',
    description:
      'Apply a light high-pass filter to remove rumble, a presence boost around 3–5kHz for clarity on phone speakers, and de-essing to tame harsh "s" sounds — the baseline chain that makes narration sound professionally mixed rather than raw.',
    whenToUse: [
      'Any voiceover recorded outside a treated studio space',
      'Narration destined for mobile playback on small phone speakers',
      'Voice cloned or TTS output that needs a final polish pass',
    ],
    toolsThatDoThisWell: ['Adobe Podcast (Enhance Speech)', 'Descript', 'iZotope RX', 'Auphonic'],
    platformFit: ['youtube_long', 'youtube_shorts', 'tiktok', 'instagram_reels', 'linkedin'],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// IMAGE PRODUCTION TECHNIQUES
// ─────────────────────────────────────────────────────────────────────────

export const IMAGE_PRODUCTION_TECHNIQUES: ImageProductionTechnique[] = [
  {
    id: 'img_layered_depth_composite',
    category: 'layered_composite',
    title: 'Multi-layer compositing for depth',
    description:
      'Stack a background, mid-ground subject, and foreground accent element (a badge, a floating card, a light streak) on separate layers with subtle drop shadows so a flat graphic reads as dimensional rather than pasted-together.',
    whenToUse: [
      'Hero graphics and cover art meant to feel premium rather than templated',
      'Social proof cards combining a photo, a stat, and a brand badge',
    ],
    toolsThatDoThisWell: ['Photoshop', 'Figma', 'Canva (Pro layers)'],
    outputFormats: ['png', 'jpg', 'webp'],
  },
  {
    id: 'img_layered_duotone_brand',
    category: 'layered_composite',
    title: 'Duotone brand-overlay composite',
    description:
      'Apply a two-color duotone treatment (brand accent + near-black) over a photo layer, then composite brand-colored text and iconography on top — creates instant visual brand consistency across a large batch of otherwise unrelated photos.',
    whenToUse: [
      'Batch-producing a week of social posts from a stock or user-submitted photo pool',
      'Unifying visual identity across a campaign with mixed source imagery',
    ],
    toolsThatDoThisWell: ['Photoshop', 'Canva', 'Figma'],
    outputFormats: ['png', 'jpg'],
  },
  {
    id: 'img_bg_removal_cutout',
    category: 'background_removal',
    title: 'Clean cutout for product/portrait isolation',
    description:
      'Remove the background from a portrait or product shot with edge-aware AI segmentation (preserving hair/fine detail) so the subject can be recomposed onto any brand background without a green screen.',
    whenToUse: [
      'Staff/team headshots reused across multiple brand backgrounds',
      'Product or document photos placed into templated layouts',
    ],
    toolsThatDoThisWell: ['remove.bg', 'Photoshop (Select Subject)', 'Canva (Background Remover)'],
    outputFormats: ['png (transparent)'],
  },
  {
    id: 'img_bg_removal_greenscreen_free',
    category: 'background_removal',
    title: 'Green-screen-free subject extraction',
    description:
      'Use AI matting to extract a presenter or object from a normal (non-green-screen) recording or photo, enabling background swaps without needing dedicated studio lighting or a physical screen.',
    whenToUse: [
      'Remote or on-location recordings without studio equipment',
      'Quick-turnaround social assets shot on a phone',
    ],
    toolsThatDoThisWell: ['remove.bg', 'Photoshop', 'Canva'],
    outputFormats: ['png (transparent)', 'webp'],
  },
  {
    id: 'img_brand_locked_kit',
    category: 'brand_template',
    title: 'Locked brand-kit template system',
    description:
      'Build a small set of master templates with locked fonts, colors, logo placement, and grid, exposing only the content fields (headline, image, stat) for editing — keeps every output on-brand even when produced quickly by different team members.',
    whenToUse: [
      'Any recurring content series (weekly tips, testimonial cards, city spotlights)',
      'Teams where non-designers need to produce on-brand graphics',
    ],
    toolsThatDoThisWell: ['Canva (Brand Kit)', 'Figma (component libraries)', 'Adobe Express'],
    outputFormats: ['png', 'jpg', 'pdf'],
  },
  {
    id: 'img_brand_resizable_master',
    category: 'brand_template',
    title: 'Resizable master template (one design, all sizes)',
    description:
      'Design once at the largest target size, then use responsive resize tooling to auto-generate the square, story, and landscape variants while preserving hierarchy — avoids re-designing the same asset five times for five aspect ratios.',
    whenToUse: [
      'Cross-platform campaign launches needing feed, story, and banner variants',
      'Lead magnet cover art needing a hero crop and a thumbnail crop',
    ],
    toolsThatDoThisWell: ['Canva (Magic Resize)', 'Figma', 'Adobe Express'],
    outputFormats: ['png', 'jpg'],
  },
  {
    id: 'img_text_contrast_safe',
    category: 'text_overlay',
    title: 'Contrast-safe text overlay on photos',
    description:
      'Place a semi-opaque gradient or solid scrim behind overlay text so it stays legible over any photo, and verify a minimum contrast ratio rather than eyeballing it — the single most common reason marketing graphics fail accessibility/legibility checks.',
    whenToUse: ['Any quote card, stat card, or headline placed over a photo background'],
    toolsThatDoThisWell: ['Canva', 'Photoshop', 'Figma'],
    outputFormats: ['png', 'jpg'],
  },
  {
    id: 'img_text_kinetic_statement',
    category: 'text_overlay',
    title: 'Kinetic-style bold statement overlay',
    description:
      'Use oversized, tightly-tracked bold type with one or two accent-colored words to make a static image feel like a frozen frame from a kinetic-typography video — high scroll-stop value for feed posts.',
    whenToUse: ['Single-statement quote or stat posts', 'Ad creative competing for attention in a crowded feed'],
    toolsThatDoThisWell: ['Canva', 'Figma', 'Photoshop'],
    outputFormats: ['png', 'jpg'],
  },
  {
    id: 'img_carousel_swipe_arc',
    category: 'carousel_design',
    title: 'Swipe-through story-arc carousel',
    description:
      'Structure a multi-slide carousel like a mini story: slide 1 is a hook/question, middle slides build the case, final slide is the payoff + CTA — each slide must work as a still but the sequence rewards swiping through.',
    whenToUse: ['Instagram/LinkedIn carousel posts', 'Turning a single long-form article into a bite-sized swipe series'],
    toolsThatDoThisWell: ['Canva', 'Figma', 'Adobe Express'],
    outputFormats: ['png (multi-slide)', 'pdf'],
  },
  {
    id: 'img_carousel_numbered_checklist',
    category: 'carousel_design',
    title: 'Numbered checklist carousel',
    description:
      'Present a process (e.g. "5 steps before you dispute anything") as one numbered step per slide with consistent iconography — highly saveable/shareable format because each slide is independently useful.',
    whenToUse: ['Educational how-to content', 'Repurposing an SOP or checklist into a social-native format'],
    toolsThatDoThisWell: ['Canva', 'Figma'],
    outputFormats: ['png (multi-slide)', 'pdf'],
  },
  {
    id: 'img_infographic_process',
    category: 'infographic',
    title: 'Step-by-step process infographic',
    description:
      'A single-image vertical flow (numbered nodes connected by a line or arrow) showing a multi-stage process end to end — ideal for explaining a workflow (dispute round 1→2→3, vendor tier 1→4) in one shareable image.',
    whenToUse: ['Explaining a sequenced program (Business Foundation → Builder → Elite)', 'Resource library reference graphics'],
    toolsThatDoThisWell: ['Canva', 'Figma', 'Adobe Illustrator'],
    outputFormats: ['png', 'pdf', 'svg'],
  },
  {
    id: 'img_infographic_comparison_table',
    category: 'infographic',
    title: 'Comparison-table infographic',
    description:
      'A clean two/three-column visual table (e.g. DIY vs. guided vs. full-service) with checkmarks and short labels — converts a dense pricing/feature comparison into something scannable in a few seconds.',
    whenToUse: ['Pricing/package comparison graphics', 'Objection-handling content ("what makes this different")'],
    toolsThatDoThisWell: ['Canva', 'Figma'],
    outputFormats: ['png', 'pdf'],
  },
  {
    id: 'img_before_after_split_score',
    category: 'before_after_comparison',
    title: 'Split-screen score comparison graphic',
    description:
      'Side-by-side or split-panel layout showing a "before" number/state on the left and "after" number/state on the right, with a clear delta callout and an alias/timeframe caption — the canonical format for credit-score or funding-amount proof content, always paired with a results-vary disclaimer.',
    whenToUse: [
      'Any case-study recap built from case-study repo data (starting/ending score, funding secured)',
      'Social proof strips and testimonial-adjacent graphics',
    ],
    toolsThatDoThisWell: ['Canva', 'Photoshop', 'Figma'],
    outputFormats: ['png', 'jpg'],
  },
  {
    id: 'img_before_after_slider_reveal',
    category: 'before_after_comparison',
    title: 'Slider-style before/after reveal',
    description:
      'A single composited image split by a diagonal or vertical divider so both states appear in one frame at once (rather than two separate images), mimicking the interactive "drag to reveal" pattern popularized by photo-editing apps.',
    whenToUse: ['Static feed posts and thumbnails where only one image slot is available', 'Print-adjacent or PDF proof pages'],
    toolsThatDoThisWell: ['Photoshop', 'Canva'],
    outputFormats: ['png', 'jpg'],
  },
  {
    id: 'img_thumb_rule_of_thirds',
    category: 'thumbnail_composition',
    title: 'Rule-of-thirds subject placement',
    description:
      'Position the primary subject (face, product, key stat) on a rule-of-thirds intersection rather than dead-center, leaving negative space for a headline — a foundational compositional habit that makes even simple graphics feel intentional.',
    whenToUse: ['Any thumbnail, cover, or hero image with one dominant subject'],
    toolsThatDoThisWell: ['Photoshop', 'Canva', 'Figma'],
    outputFormats: ['png', 'jpg'],
  },
  {
    id: 'img_thumb_color_blocked_scrollstop',
    category: 'thumbnail_composition',
    title: 'Color-blocked background for feed scroll-stop',
    description:
      'Use one saturated, on-brand background color (not a busy photo) behind bold text and a small supporting graphic — outperforms photo-heavy thumbnails in cluttered feeds because the flat color reads instantly at a glance.',
    whenToUse: ['Feed posts competing against photo-heavy content', 'Quote cards and stat call-outs'],
    toolsThatDoThisWell: ['Canva', 'Figma'],
    outputFormats: ['png', 'jpg'],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// VOICE / AUDIO TECHNIQUES
// ─────────────────────────────────────────────────────────────────────────

export const VOICE_AUDIO_TECHNIQUES: VoiceAudioTechnique[] = [
  {
    id: 'voice_clone_consent_gated',
    category: 'voice_cloning',
    title: 'Consent-gated voice clone for brand narration',
    description:
      'Clone an approved speaker\'s voice from a licensed sample set to produce consistent narration at scale without re-recording every script, while keeping a signed consent/usage record on file for that specific speaker.',
    whenToUse: [
      'A recurring on-brand narrator voice across dozens of videos',
      'Scaling narration production without booking studio time for every script',
    ],
    toolsThatDoThisWell: ['ElevenLabs (Voice Cloning)', 'Descript Overdub', 'Resemble AI'],
    complianceNotes:
      'Require explicit written consent from the real person before cloning their voice; disclose AI-voice usage where required; never clone a voice without the speaker\'s knowledge and agreement.',
  },
  {
    id: 'voice_clone_instant_sample',
    category: 'voice_cloning',
    title: 'Instant voice clone from a short sample',
    description:
      'Generate a usable clone from as little as 60–120 seconds of clean source audio for rapid one-off needs (e.g. a single testimonial re-voice for accessibility), rather than the longer sample sets needed for a permanent brand voice.',
    whenToUse: ['One-off accessibility dubs or language variants of existing approved recordings'],
    toolsThatDoThisWell: ['ElevenLabs', 'Resemble AI'],
    complianceNotes: 'Same consent requirement applies even for short/one-off clones — no exceptions for "just a quick test".',
  },
  {
    id: 'voice_tts_neural_iteration',
    category: 'text_to_speech',
    title: 'Neural TTS for rapid script iteration',
    description:
      'Generate a draft narration track directly from the script text in seconds so editors can time cuts and B-roll against real pacing before committing to a final voice pass — dramatically speeds up the edit-review loop.',
    whenToUse: ['Early-draft video assembly before final voice approval', 'Storyboard/animatic pacing checks'],
    toolsThatDoThisWell: ['ElevenLabs', 'Murf.ai', 'Play.ht', 'WellSaid Labs'],
  },
  {
    id: 'voice_tts_emotion_tuned',
    category: 'text_to_speech',
    title: 'Emotion-tuned TTS for ad reads',
    description:
      'Adjust stability/style-exaggeration parameters on a neural TTS voice to sound warmer, more urgent, or more confident depending on ad intent, rather than using one flat default setting for every script.',
    whenToUse: ['Paid ad voiceover where tone must match the offer (urgency vs. reassurance)'],
    toolsThatDoThisWell: ['ElevenLabs', 'LOVO', 'Murf.ai'],
  },
  {
    id: 'voice_isolation_noise_removal',
    category: 'voice_isolation',
    title: 'AI noise / room-tone removal',
    description:
      'Strip background hum, HVAC noise, and room reverb from a raw recording using spectral AI processing so a phone-mic recording can approach studio clarity without re-recording.',
    whenToUse: ['User-generated or field-recorded voice content', 'Salvaging usable audio from imperfect recording conditions'],
    toolsThatDoThisWell: ['Adobe Podcast (Enhance Speech)', 'Krisp', 'iZotope RX', 'Descript'],
  },
  {
    id: 'voice_isolation_call_testimonial',
    category: 'voice_isolation',
    title: 'Vocal isolation from recorded calls/testimonials',
    description:
      'Separate a speaker\'s voice from phone-line compression artifacts, call-hold music, or double-talk on a recorded call so a testimonial clip sounds clean enough for public use — always confirm recording consent/disclosure per applicable law before publishing.',
    whenToUse: ['Turning a recorded coaching call or testimonial call into a shareable clip'],
    toolsThatDoThisWell: ['iZotope RX', 'Descript', 'Adobe Podcast'],
    complianceNotes: 'Confirm two-party/one-party call-recording consent per state law and get explicit permission before any public use.',
  },
  {
    id: 'voice_music_royalty_free_licensing',
    category: 'background_music_licensing',
    title: 'Royalty-free music-bed licensing',
    description:
      'Source background music from a licensed subscription library with clear commercial-use terms rather than unlicensed tracks, avoiding copyright strikes/demonetization on ad and organic content alike.',
    whenToUse: ['Every video with a music bed intended for public distribution'],
    toolsThatDoThisWell: ['Epidemic Sound', 'Artlist', 'Storyblocks Audio', 'Envato Elements'],
  },
  {
    id: 'voice_music_stem_ducking',
    category: 'background_music_licensing',
    title: 'Stem-based music for custom ducking',
    description:
      'License tracks with separated stems (drums, melody, bass) so the mix can duck just the melodic layer under voice while keeping rhythm present, producing a tighter mix than ducking the full mixed track.',
    whenToUse: ['Higher-production ads and hero videos where mix quality is a priority'],
    toolsThatDoThisWell: ['Artlist', 'Epidemic Sound (stems on select tracks)'],
  },
  {
    id: 'voice_sfx_transition_whoosh',
    category: 'sound_effect_layering',
    title: 'Whoosh/impact SFX for transitions',
    description:
      'Layer a short whoosh, impact, or riser sound under hard cuts and zoom punches so transitions feel intentional and energetic rather than abrupt — a near-universal short-form editing convention.',
    whenToUse: ['Fast-paced jump-cut edits', 'Emphasizing a punch-in on a key stat or CTA'],
    toolsThatDoThisWell: ['CapCut (built-in SFX library)', 'Artlist SFX', 'Storyblocks Audio'],
  },
  {
    id: 'voice_sfx_ui_notification',
    category: 'sound_effect_layering',
    title: 'UI/notification SFX for screen recordings',
    description:
      'Add subtle click, ding, or checkmark sounds synced to on-screen UI actions (a checklist item completing, a status changing to approved) in product-demo B-roll to make static screen capture feel alive.',
    whenToUse: ['Product/portal walkthroughs and demo B-roll'],
    toolsThatDoThisWell: ['CapCut', 'Artlist SFX', 'Epidemic Sound SFX'],
  },
  {
    id: 'voice_podcast_loudness_master',
    category: 'podcast_mastering',
    title: 'Loudness-normalized podcast master (~-16 LUFS)',
    description:
      'Master the final mix to a consistent integrated loudness target (commonly around -16 LUFS for podcasts, -14 LUFS for streaming video) so episodes don\'t force listeners to constantly adjust volume across platforms.',
    whenToUse: ['Any podcast or long-form audio episode before distribution'],
    toolsThatDoThisWell: ['Auphonic', 'Adobe Podcast', 'Descript', 'iZotope RX'],
  },
  {
    id: 'voice_podcast_multitrack_cleanup',
    category: 'podcast_mastering',
    title: 'Multi-track cleanup for remote interviews',
    description:
      'Record each remote speaker on an isolated local track (rather than a single mixed call recording) so noise removal, leveling, and EQ can be tuned per speaker before the final mixdown — avoids one loud/noisy guest ruining the whole mix.',
    whenToUse: ['Remote interview or panel-style content'],
    toolsThatDoThisWell: ['Riverside.fm', 'Descript', 'Auphonic'],
  },
  {
    id: 'voice_dub_ai_lipsync',
    category: 'multilingual_dubbing',
    title: 'AI dubbing with lip-sync matching',
    description:
      'Translate and re-voice a video into another language while time-stretching the dub to approximately match the original speaker\'s mouth movements, producing a far more natural result than a flat translated voiceover laid over the original cut.',
    whenToUse: ['Expanding proven content into a Spanish-language or other secondary-language audience'],
    toolsThatDoThisWell: ['ElevenLabs Dubbing', 'HeyGen', 'Synthesia'],
    complianceNotes: 'Disclose AI-dubbed/translated content where required and have a native speaker review translated compliance language before publishing.',
  },
  {
    id: 'voice_dub_subtitle_first',
    category: 'multilingual_dubbing',
    title: 'Subtitle-first localization workflow',
    description:
      'Localize by translating and burning in subtitles before committing to full re-dubbing, letting a market/language be tested cheaply before investing in a full dub pass once demand is confirmed.',
    whenToUse: ['Testing a new-language audience before committing to full dubbing production'],
    toolsThatDoThisWell: ['CapCut', 'VEED.IO', 'Descript'],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// COPYWRITING / SCRIPT FRAMEWORKS
// ─────────────────────────────────────────────────────────────────────────

export const COPYWRITING_SCRIPT_FRAMEWORKS: CopywritingScriptFramework[] = [
  {
    id: 'script_hook_aida',
    category: 'hook_formula',
    title: 'AIDA (Attention, Interest, Desire, Action)',
    description:
      'The classic four-stage direct-response arc: grab Attention, build Interest with specifics, create Desire by showing the outcome, then prompt Action with one clear next step. Works for ads, emails, and landing pages alike.',
    template:
      'ATTENTION: [specific, scroll-stopping opener]\nINTEREST: [one relevant fact/problem for this audience]\nDESIRE: [what life/finances look like after the outcome]\nACTION: [one specific next step, one CTA]',
    exampleFilled:
      'ATTENTION: "528 to 671 in four months — no shortcuts, just a plan."\nINTEREST: Three charged-off accounts were quietly capping every application Marcus submitted.\nDESIRE: Imagine applying for a car loan and getting a standard rate instead of a decline.\nACTION: Start your free credit guide — results vary, no guarantees.',
    bestForPersona: ['Miriam', 'Esther'],
  },
  {
    id: 'script_hook_pas',
    category: 'hook_formula',
    title: 'PAS (Problem, Agitate, Solution)',
    description:
      'Name the reader\'s specific problem, agitate it by showing the cost of leaving it unresolved, then present the solution as the natural next step — one of the most durable short-copy formulas because it mirrors how people actually think through a decision.',
    template:
      'PROBLEM: [the exact pain point in the reader\'s words]\nAGITATE: [what it costs them to keep living with it]\nSOLUTION: [the specific path that resolves it + CTA]',
    exampleFilled:
      'PROBLEM: A collector is calling daily about a debt you\'re not sure is even valid.\nAGITATE: Every unanswered call raises your stress — and paying without validating could mean paying twice.\nSOLUTION: Send a validation letter today with the Debt Kill workflow — free guide inside.',
    bestForPersona: ['Miriam', 'Alex'],
  },
  {
    id: 'script_hook_4us',
    category: 'hook_formula',
    title: 'The 4 U\'s headline formula',
    description:
      'A checklist for any hook or headline: is it Useful, Urgent, Unique, and Ultra-specific? Headlines missing 2+ of these tend to underperform; hitting 3–4 reliably lifts click-through and watch-through.',
    template: '[Ultra-specific number/timeframe] + [Unique mechanism] + [Useful outcome] + [Urgency/reason to act now]',
    exampleFilled:
      '"3 vendor accounts in 8 weeks — no personal guarantee, no store cards. Applications open this week only."',
    bestForPersona: ['Miriam', 'Jordan'],
  },
  {
    id: 'script_ad_hook_retention_cta',
    category: 'ad_script_structure',
    title: 'Hook-Retention-CTA beat sheet',
    description:
      'A three-act structure purpose-built for short paid/organic video ads: a Hook (0–3s) to stop the scroll, a Retention block (middle) that delivers real value or proof so the algorithm rewards watch-time, then a single clear CTA at the end — never buried mid-video.',
    template:
      'HOOK (0-3s): [pattern interrupt / bold claim]\nRETENTION (middle): [one proof point + one mechanism explanation]\nCTA (final 3-5s): [one action, one link/next step]',
    exampleFilled:
      'HOOK: "This LLC had zero trade lines eight weeks ago."\nRETENTION: We ran the Foundation sequence — entity hygiene, D-U-N-S alignment, then three Tier-1 vendor accounts chosen for fast reporting.\nCTA: "Book a free business credit session — link below."',
    bestForPersona: ['Jordan', 'Miriam'],
  },
  {
    id: 'script_ad_bab',
    category: 'ad_script_structure',
    title: 'Before-After-Bridge (BAB) ad script',
    description:
      'Show the Before state, paint the After state as vividly as compliance allows, then present the Bridge (your offer) as the only thing standing between them — compact and highly adaptable across every ad length.',
    template: 'BEFORE: [current painful state]\nAFTER: [desired state, results-vary framed]\nBRIDGE: [the specific offer that connects the two]',
    exampleFilled:
      'BEFORE: Five medical collections, eleven inquiries, constant declines.\nAFTER: A clean file that qualifies for standard-rate offers (results vary).\nBRIDGE: The Credit Restore program — start with a free guide.',
    bestForPersona: ['Miriam', 'Esther'],
  },
  {
    id: 'script_ad_direct_response',
    category: 'ad_script_structure',
    title: 'Problem-Solution-CTA direct response script',
    description:
      'A no-frills three-line structure for fast-turnaround ad testing: state the problem in one line, the solution mechanism in one line, and one CTA — deliberately stripped down so multiple hook variants can be tested against the same body/CTA.',
    template: 'PROBLEM: [one sentence]\nSOLUTION: [one sentence, one mechanism]\nCTA: [one link, one action]',
    exampleFilled:
      'PROBLEM: A repossession balance is still showing after the deficiency was resolved.\nSOLUTION: We dispute the balance directly with documentation of the resolution.\nCTA: "Start your free dispute guide today."',
    bestForPersona: ['Miriam', 'Caleb'],
  },
  {
    id: 'script_email_5part_nurture',
    category: 'email_sequence_arc',
    title: '5-email nurture arc (Welcome → Proof → Objection → Offer → Urgency)',
    description:
      'A five-touch sequence that moves a new lead from cold to ready: Welcome (set expectations), Proof (a case study), Objection (address the #1 hesitation), Offer (the specific next step), Urgency (a reason to act this week).',
    template:
      'EMAIL 1 — WELCOME: [what to expect, set the relationship]\nEMAIL 2 — PROOF: [one case study, results-vary framed]\nEMAIL 3 — OBJECTION: [address cost/time/trust concern]\nEMAIL 4 — OFFER: [the specific next step]\nEMAIL 5 — URGENCY: [deadline or capacity-based reason to act now]',
    exampleFilled:
      'EMAIL 2 — PROOF: "Renee had four fraudulent accounts still reporting years after an identity theft report. Here\'s the exact fraud-packet approach that got them blocked." (Results vary.)',
    bestForPersona: ['Esther', 'Rebecca'],
  },
  {
    id: 'script_email_reengagement',
    category: 'email_sequence_arc',
    title: 'Abandoned-action re-engagement sequence',
    description:
      'A short 2–3 email sequence triggered when a lead starts but doesn\'t finish an action (starts an application, books then no-shows) — acknowledges the interruption, removes friction, and offers a lower-commitment next step.',
    template:
      'EMAIL 1: [acknowledge the interruption, no guilt]\nEMAIL 2: [remove the likely friction point]\nEMAIL 3: [offer a smaller/easier next step or a deadline]',
    exampleFilled:
      'EMAIL 1: "Looks like your session got interrupted — no worries, here\'s a new link to pick a time that works."\nEMAIL 3: "Prefer to start with the free guide first? Here\'s the download — book whenever you\'re ready."',
    bestForPersona: ['Alex', 'Esther'],
  },
  {
    id: 'script_landing_pas_longform',
    category: 'landing_page_copy',
    title: 'PAS-driven long-form landing page',
    description:
      'Structure a long-form landing page as an extended PAS arc: open on the Problem, spend the middle sections Agitating with specifics and objections, then present the Solution as a structured program with a single primary CTA repeated at natural scroll-stop points.',
    template:
      'HERO: [Problem stated as a headline]\nSECTION 1: [Agitate — specifics, cost of inaction]\nSECTION 2: [Solution mechanism]\nSECTION 3: [Proof / case studies]\nSECTION 4: [Objection handling]\nCTA (repeated): [one primary action]',
    exampleFilled:
      'HERO: "Stuck under a credit file that doesn\'t reflect the real you?"\nSECTION 2: "Our round-one dispute process targets the exact field-level errors bureaus are required to fix."',
    bestForPersona: ['Esther', 'Miriam'],
  },
  {
    id: 'script_landing_fbp_stack',
    category: 'landing_page_copy',
    title: 'Feature-Benefit-Proof stack landing section',
    description:
      'For each program feature, stack three lines: the Feature (what it is), the Benefit (what it means for the reader), and Proof (a stat, case study line, or statutory citation) — prevents landing pages from listing features without explaining why they matter.',
    template: 'FEATURE: [what it is]\nBENEFIT: [what it means for the reader]\nPROOF: [stat / case study / citation]',
    exampleFilled:
      'FEATURE: Round-one factual disputes citing exact field-level mismatches.\nBENEFIT: Furnishers must reasonably reinvestigate specific, evidence-backed claims.\nPROOF: FCRA 15 U.S.C. § 1681i — reasonable reinvestigation requirement.',
    bestForPersona: ['Esther', 'Caleb'],
  },
  {
    id: 'script_video_beatsheet_28s',
    category: 'video_script_beat_sheet',
    title: '28-second reel beat sheet (Hook-Value-CTA)',
    description:
      'A tight three-beat structure sized for the dominant short-form reel length: Hook (0–3s), one clear Value beat (5–20s) delivering a single idea or proof point, and a CTA (20–28s) — deliberately avoids trying to cram in more than one idea.',
    template: 'HOOK (0-3s): [pattern interrupt]\nVALUE (5-20s): [one idea, one proof point]\nCTA (20-28s): [one action]',
    exampleFilled:
      'HOOK: "This is the exact letter that got a $18,400 collection removed."\nVALUE: A validation request went unanswered — the collector had to stop reporting.\nCTA: "Grab the free validation letter template — link in bio."',
    bestForPersona: ['Miriam', 'Jordan'],
  },
  {
    id: 'script_video_beatsheet_60s_ad',
    category: 'video_script_beat_sheet',
    title: '60-second ad beat sheet (Hook-Problem-Solution-Proof-CTA)',
    description:
      'A five-beat structure for longer horizontal ads (Meta feed, YouTube pre-roll): Hook, then a fuller Problem statement, the Solution mechanism, a Proof point, and a CTA — the extra runtime allows one full case-study reference instead of just a claim.',
    template:
      'HOOK (0-5s): [claim or question]\nPROBLEM (5-20s): [the audience\'s specific situation]\nSOLUTION (20-40s): [mechanism / program]\nPROOF (40-52s): [one case study line, results-vary framed]\nCTA (52-60s): [one action]',
    exampleFilled:
      'PROOF: "Jordan\'s six-week-old LLC went from zero fundability signals to roughly $22,000 in reporting vendor lines in eight weeks. Results vary."',
    bestForPersona: ['Jordan', 'Miriam'],
  },
  {
    id: 'script_caption_curiosity_cta',
    category: 'caption_cta_formula',
    title: 'Curiosity-caption-CTA formula',
    description:
      'A three-line caption structure: an open-loop curiosity line, one supporting sentence of context, and one explicit CTA with a clear action verb — avoids the common mistake of a caption that repeats the video instead of extending it.',
    template: '[Curiosity line — open loop]\n[One line of context]\n[Explicit CTA: verb + destination]',
    exampleFilled:
      '"The one document most people forget before disputing a medical bill.\nIt cost David five collections and eleven inquiries before he found it.\nDownload the free itemized-billing checklist — link in bio."',
    bestForPersona: ['Miriam', 'Hannah'],
  },
  {
    id: 'script_caption_social_proof',
    category: 'caption_cta_formula',
    title: 'Social-proof caption formula',
    description:
      'Lead the caption with a specific, attributable result (alias, delta, timeframe) rather than a generic claim, then close with a low-friction CTA — pairs naturally with before/after graphics and case-study clips.',
    template: '[Alias] + [specific before -> after result] + [timeframe]\n[One line: how it was done]\n[Low-friction CTA]',
    exampleFilled:
      '"Marcus T. — Miami, FL: 528 → 671 in 16 weeks.\nThree rounds of factual, evidence-based disputes.\nSee if you qualify — free guide, no cost to start." (Results vary.)',
    bestForPersona: ['Miriam', 'Hannah'],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// ACCESSORS
// ─────────────────────────────────────────────────────────────────────────

export function getAllVideoTechniques(): VideoProductionTechnique[] {
  return VIDEO_PRODUCTION_TECHNIQUES;
}

export function getVideoTechniquesByCategory(category: VideoTechniqueCategory): VideoProductionTechnique[] {
  return VIDEO_PRODUCTION_TECHNIQUES.filter((t) => t.category === category);
}

export function getAllImageTechniques(): ImageProductionTechnique[] {
  return IMAGE_PRODUCTION_TECHNIQUES;
}

export function getImageTechniquesByCategory(category: ImageTechniqueCategory): ImageProductionTechnique[] {
  return IMAGE_PRODUCTION_TECHNIQUES.filter((t) => t.category === category);
}

export function getAllVoiceTechniques(): VoiceAudioTechnique[] {
  return VOICE_AUDIO_TECHNIQUES;
}

export function getVoiceTechniquesByCategory(category: VoiceTechniqueCategory): VoiceAudioTechnique[] {
  return VOICE_AUDIO_TECHNIQUES.filter((t) => t.category === category);
}

export function getAllScriptFrameworks(): CopywritingScriptFramework[] {
  return COPYWRITING_SCRIPT_FRAMEWORKS;
}

export function getScriptFrameworksByCategory(category: ScriptFrameworkCategory): CopywritingScriptFramework[] {
  return COPYWRITING_SCRIPT_FRAMEWORKS.filter((f) => f.category === category);
}
