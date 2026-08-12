import { callAiGateway } from '../../lib/aiClient';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { getMarketingFindGeo } from '../marketingDesk/marketingDeskHunt';
import type { VideoCommandRequest, VideoGenerationIntent } from './types';
import type { VideoCreateWizardPresetId } from './VideoCreateWizard';

export type VideoCopilotMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export type VideoCopilotBriefResult = {
  reply: string;
  requestPatch: Partial<VideoCommandRequest>;
  suggestedPreset?: VideoCreateWizardPresetId;
};

const PRESET_HINTS: Record<VideoCreateWizardPresetId, string> = {
  reel_28: '28s vertical reel for Shorts/TikTok/Reels',
  ad_60: '60s horizontal ad for Meta or YouTube pre-roll',
  guide_promo: '45s guide promo for a lead magnet hero clip',
  city_spotlight: '30s local metro spotlight with lane CTA',
};

function inferPreset(text: string): VideoCreateWizardPresetId | undefined {
  const t = text.toLowerCase();
  if (/60\s*s|pre-?roll|youtube ad|meta ad/.test(t)) return 'ad_60';
  if (/guide|lead magnet|free guide|download/.test(t)) return 'guide_promo';
  if (/city|metro|local|dallas|houston|miami|atlanta/.test(t)) return 'city_spotlight';
  if (/28|reel|short|tiktok|vertical|9:16/.test(t)) return 'reel_28';
  return undefined;
}

function inferIntent(text: string): VideoGenerationIntent {
  const t = text.toLowerCase();
  if (/debt|validation|collections|summons/.test(t)) return 'authority_clip';
  if (/business credit|vendor|entity/.test(t)) return 'business_credit_education';
  if (/tradeline|authorized user|au\b/.test(t)) return 'tradeline_explainer';
  if (/fund|capital|underwriting/.test(t)) return 'funding_readiness';
  if (/recruit|affiliate|partner program/.test(t)) return 'recruiting_ad';
  if (/testimonial|win story|success story/.test(t)) return 'testimonial_style';
  return 'lead_magnet_ad';
}

function localCopilotReply(userText: string, history: VideoCopilotMessage[]): VideoCopilotBriefResult {
  const combined = [...history.filter((m) => m.role === 'user').map((m) => m.text), userText].join('\n');
  const preset = inferPreset(combined);
  const intent = inferIntent(combined);
  const cityMatch = combined.match(/\b(?:in|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  const city = cityMatch?.[1] ?? getMarketingFindGeo();

  return {
    reply: [
      'Got it — here is how I would structure this clip:',
      '',
      `• Hook: open with the partner pain point you described`,
      `• Middle: one clear workflow beat (restore, disputes, or next step)`,
      `• Close: compliance-safe CTA — no guaranteed outcomes`,
      '',
      preset
        ? `Format suggestion: **${PRESET_HINTS[preset]}** — pick or adjust on the next step.`
        : 'Next: choose duration and aspect (28s reel, 60s ad, guide promo, or city spotlight).',
      '',
      'When the plan looks right, continue to **Format** then **Generate scenes**.',
    ].join('\n'),
    requestPatch: {
      prompt: combined.trim(),
      intent,
      city,
      audience: /business|llc|vendor/.test(combined.toLowerCase()) ? 'business credit partners' : 'credit-focused partners',
      offer: /free guide|lead magnet/.test(combined.toLowerCase()) ? 'Free credit guide' : 'Finely Cred partner portal',
      complianceStrict: true,
      includeCaptions: true,
    },
    suggestedPreset: preset,
  };
}

export const VIDEO_COPILOT_PRESET_PATCH: Record<VideoCreateWizardPresetId, Partial<VideoCommandRequest>> = {
  reel_28: { durationSec: 28, aspect: '9:16', intent: 'lead_magnet_ad' },
  ad_60: { durationSec: 60, aspect: '16:9', intent: 'business_credit_education' },
  guide_promo: { durationSec: 45, aspect: '9:16', intent: 'funding_readiness', offer: 'Free credit guide' },
  city_spotlight: { durationSec: 30, aspect: '9:16', intent: 'authority_clip' },
};

/** Merge copilot brief + optional format preset for wizard / command surfaces. */
export function mergeVideoCopilotBrief(
  patch: Partial<VideoCommandRequest>,
  suggestedPreset?: VideoCreateWizardPresetId,
): Partial<VideoCommandRequest> {
  const presetPatch = suggestedPreset ? VIDEO_COPILOT_PRESET_PATCH[suggestedPreset] : undefined;
  return { ...patch, ...presetPatch };
}

export async function runVideoCreationCopilotTurn(args: {
  userText: string;
  history: VideoCopilotMessage[];
}): Promise<VideoCopilotBriefResult> {
  const trimmed = args.userText.trim();
  if (!trimmed) {
    return {
      reply: 'Tell me what the video should accomplish — audience, hook, offer, and tone. I will draft a plan before we pick duration.',
      requestPatch: {},
    };
  }

  if (!isFeatureEnabled('aiGateway')) {
    return localCopilotReply(trimmed, args.history);
  }

  try {
    const transcript = args.history
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'User' : 'Copilot'}: ${m.text}`)
      .join('\n');
    const out = await callAiGateway({
      taskType: 'content.studio.video_copilot.v1',
      responseFormat: 'json',
      messages: [
        {
          role: 'system',
          content:
            'You are Finely Cred Content Studio video copilot. Help admins plan short marketing/education videos. Return JSON only: { "reply": string (markdown-lite, numbered plan), "prompt": string (full production brief), "audience": string, "offer": string, "city": string, "intent": one of lead_magnet_ad|recruiting_ad|business_credit_education|tradeline_explainer|funding_readiness|testimonial_style|authority_clip|event_promo, "suggestedPreset": reel_28|ad_60|guide_promo|city_spotlight|null }. Never promise legal outcomes or guaranteed credit scores. Keep reply under 120 words.',
        },
        {
          role: 'user',
          content: `${transcript ? `${transcript}\n` : ''}User: ${trimmed}`,
        },
      ],
    });
    const start = out.text.indexOf('{');
    const end = out.text.lastIndexOf('}');
    const parsed = start >= 0 && end >= start ? JSON.parse(out.text.slice(start, end + 1)) : null;
    if (!parsed?.reply) return localCopilotReply(trimmed, args.history);
    return {
      reply: String(parsed.reply),
      requestPatch: {
        prompt: String(parsed.prompt || trimmed),
        audience: parsed.audience ? String(parsed.audience) : undefined,
        offer: parsed.offer ? String(parsed.offer) : undefined,
        city: parsed.city ? String(parsed.city) : getMarketingFindGeo(),
        intent: (parsed.intent as VideoGenerationIntent) || inferIntent(trimmed),
        complianceStrict: true,
        includeCaptions: true,
      },
      suggestedPreset: parsed.suggestedPreset || inferPreset(trimmed),
    };
  } catch {
    return localCopilotReply(trimmed, args.history);
  }
}

export const VIDEO_COPILOT_STARTER_CHIPS = [
  {
    id: 'restore_hook',
    label: 'Partner restore walkthrough',
    prompt: 'Plan a warm 28-second reel that shows a partner uploading a report and seeing their restore checklist — compliance-safe, no score guarantees.',
  },
  {
    id: 'guide_promo',
    label: 'Free guide promo clip',
    prompt: 'Plan a vertical guide promo: hook on confusion about bureau letters, middle on the free dispute guide, CTA to start the trial — educational tone.',
  },
  {
    id: 'debt_validation',
    label: 'Debt validation explainer',
    prompt: 'Plan a calm validation letter explainer for collections — FDCPA-aware, partner sending their own letter, no legal advice on screen.',
  },
  {
    id: 'city_spotlight',
    label: 'City spotlight ad',
    prompt: 'Plan a local metro spotlight for credit restore partners — mention the city in the hook and end with book a session CTA.',
  },
  {
    id: 'business_lane',
    label: 'Business credit lane',
    prompt: 'Plan a 60-second horizontal ad for business credit and vendor ladder education — underwriting-aware, realistic timelines.',
  },
  {
    id: 'presenter_reference',
    label: 'Presenter demo quality bar',
    prompt: 'Plan a ~28s presenter-style walkthrough like our admin Resources reference demo: hook, three clear beats (restore, disputes, next step), warm voice, premium but not hypey.',
  },
] as const;
