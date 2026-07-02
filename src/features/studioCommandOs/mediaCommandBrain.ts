import type { Aspect, MediaProject } from '../../domain/mediaStudio';
import { nowIso } from '../../domain/mediaStudio';
import type { VideoCommandPlan, VideoCommandRequest, VideoGenerationIntent, VideoScenePlan } from './types';

const INTENT_CTA: Record<VideoGenerationIntent, string> = {
  lead_magnet_ad: 'Download the free guide',
  recruiting_ad: 'Apply to join Finely Cred',
  business_credit_education: 'Start your business credit plan',
  tradeline_explainer: 'Review tradeline options',
  funding_readiness: 'Book a funding readiness review',
  testimonial_style: 'See how the process works',
  authority_clip: 'Watch the full breakdown',
  event_promo: 'Reserve your seat',
};

const VISUAL_HINTS: Record<VideoCommandRequest['visualStyle'], string> = {
  luxury: 'platinum, gold, premium finance, elegant lighting, cinematic trust',
  cinematic: 'dramatic motion, filmic lighting, high contrast, polished camera language',
  modern: 'clean UI overlays, crisp product shots, fast professional cuts',
  bold: 'energetic, high contrast, punchy transitions, strong headlines',
  minimal: 'spacious negative space, refined typography, calm authority',
};

const VOICE_HINTS: Record<VideoCommandRequest['voiceStyle'], string> = {
  none: '',
  warm_authority: 'Warm, trustworthy, calm expert voice.',
  luxury_confident: 'Confident premium brand voice, direct but polished.',
  direct_operator: 'Straight-to-the-point operator voice, crisp and decisive.',
  friendly_educator: 'Friendly educational voice with simple explanations.',
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(Number(n) || min)));
}

function splitDuration(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  let rest = total - base * count;
  return Array.from({ length: count }, () => {
    const add = rest > 0 ? 1 : 0;
    rest -= add;
    return clamp(base + add, 2, 8);
  });
}

export function recommendSceneCount(durationSec: number): number {
  if (durationSec <= 12) return 4;
  if (durationSec <= 20) return 5;
  if (durationSec <= 35) return 7;
  if (durationSec <= 50) return 9;
  return 12;
}

export function normalizeVideoRequest(input: Partial<VideoCommandRequest>): VideoCommandRequest {
  return {
    prompt: String(input.prompt || '').trim() || 'Create a 28-second Finely Cred video that drives qualified leads to book a consultation.',
    durationSec: clamp(input.durationSec ?? 28, 6, 90),
    aspect: input.aspect ?? '9:16',
    intent: input.intent ?? 'lead_magnet_ad',
    voiceStyle: input.voiceStyle ?? 'luxury_confident',
    visualStyle: input.visualStyle ?? 'luxury',
    audience: String(input.audience || '').trim() || 'credit-aware consumers and business owners',
    offer: String(input.offer || '').trim() || 'Finely Cred consultation or lead magnet',
    city: String(input.city || '').trim() || undefined,
    includeCaptions: input.includeCaptions ?? true,
    complianceStrict: input.complianceStrict ?? true,
  };
}

export function buildAiStoryboardPrompt(req: VideoCommandRequest) {
  return {
    taskType: 'media.video.prompt_to_storyboard.v2',
    system:
      'You are a senior creative director, performance marketer, and compliant financial-services video producer. Return only JSON. Do not promise guaranteed credit, funding, approval, score increases, deletion, or results. Build practical scenes, voiceover, captions, CTA, and image-generation prompts.',
    user:
      `Create a complete video plan.\n` +
      `Prompt: ${req.prompt}\n` +
      `Duration: ${req.durationSec}s\nAspect: ${req.aspect}\nIntent: ${req.intent}\nAudience: ${req.audience}\nOffer: ${req.offer}\nCity: ${req.city || 'not localized'}\n` +
      `Visual style: ${req.visualStyle} (${VISUAL_HINTS[req.visualStyle]})\nVoice: ${req.voiceStyle} (${VOICE_HINTS[req.voiceStyle]})\n` +
      `Return JSON with title, hook, cta, scenes[{beat,durationSec,visualPrompt,motionPrompt,caption,voiceover,callout,complianceNote}], platformCutdowns, renderChecklist, complianceFlags.`,
  };
}

export function buildFallbackVideoPlan(input: Partial<VideoCommandRequest>): VideoCommandPlan {
  const req = normalizeVideoRequest(input);
  const count = recommendSceneCount(req.durationSec);
  const durations = splitDuration(req.durationSec, count);
  const cta = INTENT_CTA[req.intent];
  const city = req.city ? `${req.city} ` : '';
  const visual = VISUAL_HINTS[req.visualStyle];
  const beats = [
    'Hook the pain point immediately',
    'Show the confusing current state',
    'Position Finely Cred as the organized path',
    'Show the first simple next step',
    'Add proof of process without overpromising',
    'Reveal the offer or lead magnet',
    'Make the CTA clear and calm',
    'Reinforce compliance-safe expectations',
    'End with a premium brand frame',
    'Cutdown alternate hook',
    'Objection answer frame',
    'Social proof/process frame',
  ];
  const scenes: VideoScenePlan[] = durations.map((d, idx) => {
    const beat = beats[idx] || `Scene ${idx + 1}`;
    const local = city ? `${city}market, ` : '';
    return {
      id: `scene_${idx + 1}`,
      beat,
      durationSec: d,
      visualPrompt:
        `${local}${visual}, premium Finely Cred style, realistic finance/credit growth imagery, no text, no logos, polished lighting. Scene beat: ${beat}. User prompt: ${req.prompt}`,
      motionPrompt:
        `Slow cinematic push-in, subtle parallax, premium transitions, ${req.aspect} composition, keep movement smooth and professional.`,
      caption: req.includeCaptions ? (idx === 0 ? 'Your credit path should feel organized.' : idx === durations.length - 1 ? cta : beat.replace(/^Show /, '').replace(/^Add /, '')) : '',
      voiceover:
        req.voiceStyle === 'none'
          ? ''
          : `${beat}. Finely Cred helps you understand the next step without pressure, confusion, or unrealistic promises.`,
      callout: idx === durations.length - 1 ? cta : undefined,
      complianceNote: req.complianceStrict ? 'No guaranteed approval, deletion, score increase, or funding claim.' : undefined,
    };
  });
  return {
    id: `video_plan_${Date.now().toString(16)}`,
    createdAt: nowIso(),
    title: `${city}${req.offer} • ${req.durationSec}s ${req.aspect}`.trim(),
    request: req,
    totalDurationSec: durations.reduce((a, b) => a + b, 0),
    hook: 'Your next credit move should feel clear before it feels urgent.',
    cta,
    scenes,
    platformCutdowns: [
      { platform: 'Instagram Reels', lengthSec: Math.min(30, req.durationSec), note: 'Use hook + CTA + captions; export 9:16.' },
      { platform: 'TikTok', lengthSec: Math.min(35, req.durationSec), note: 'Use faster first scene and simpler captions.' },
      { platform: 'YouTube Shorts', lengthSec: Math.min(60, req.durationSec), note: 'Keep education angle; add stronger first 2 seconds.' },
      { platform: 'Facebook/Meta', lengthSec: Math.min(30, req.durationSec), note: 'Use lead form CTA; avoid exaggerated claims.' },
    ],
    renderChecklist: [
      'Generate scene images or video clips.',
      'Review captions for financial/credit compliance.',
      'Generate voiceover or upload voice track.',
      'Export 9:16 for Reels/Shorts/TikTok or 16:9 for YouTube.',
      'Queue post with tracked short link and approval gate.',
    ],
    complianceFlags: req.complianceStrict ? ['credit_safe_claims_required', 'no_guarantees', 'review_before_external_publish'] : ['review_before_external_publish'],
  };
}

export function convertPlanToMediaProject(plan: VideoCommandPlan, project: MediaProject): MediaProject {
  const now = nowIso();
  return {
    ...project,
    title: plan.title.slice(0, 120),
    aspect: plan.request.aspect as Aspect,
    stylePreset: plan.request.visualStyle as any,
    scenes: plan.scenes.map((s, idx) => ({
      id: `${project.id}_cmd_${idx}_${Date.now().toString(16)}`,
      prompt: s.visualPrompt,
      caption: s.caption,
      durationSec: s.durationSec,
      voiceoverText: s.voiceover,
      transition: idx === 0 ? { type: 'cut' } : { type: 'fade', durationSec: 0.35 },
      createdAt: now,
      updatedAt: now,
    })),
  };
}

export function summarizePlan(plan: VideoCommandPlan): string {
  return `${plan.title}: ${plan.scenes.length} scenes, ${plan.totalDurationSec}s, CTA “${plan.cta}”, ${plan.complianceFlags.length} compliance flag(s).`;
}
