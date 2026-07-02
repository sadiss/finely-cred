import type { SovereignMarketingAssetPlan, SovereignMediaType, SovereignChannelId } from './types';
import { buildDefaultMediaPlans } from './marketingIntelligenceVault';

export type VideoVoiceBrief = {
  id: string;
  title: string;
  mediaType: SovereignMediaType;
  channel: SovereignChannelId;
  script: string;
  shotList: string[];
  voiceDirection: string;
  visualDirection: string;
  caption: string;
  thumbnailPrompt: string;
  complianceRewrite: string;
  nextProductionStep: string;
};

function normalize(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

export function createVideoVoiceBrief(plan: SovereignMarketingAssetPlan): VideoVoiceBrief {
  const hook = plan.hookBank[0] ?? 'Before you take the next step, check this first.';
  const beats = plan.storyBeats.length ? plan.storyBeats : ['Problem', 'Insight', 'Checklist', 'CTA'];
  const script = normalize([
    hook,
    `Here is the truth: ${plan.angle}`,
    beats.map((beat, idx) => `${idx + 1}. ${beat}.`).join(' '),
    `Take the next clean step: ${plan.cta}.`,
    'This is education, not a guaranteed outcome. Your details, documentation, and eligibility matter.',
  ].join(' '));
  return {
    id: `brief-${plan.id}`,
    title: `${plan.title} - production brief`,
    mediaType: plan.mediaType,
    channel: plan.channel,
    script,
    shotList: [
      'First frame: bold text hook on premium dark/gold background.',
      'Cut 1: face-to-camera or branded avatar delivering the core problem.',
      'Cut 2: checklist overlay with three clean bullets.',
      'Cut 3: landing page or guide mockup with tracked CTA.',
      'Final frame: CTA and compliance-safe footer.',
    ],
    voiceDirection: plan.voiceDirection ?? 'Calm, confident, premium, helpful, 140-155 words per minute.',
    visualDirection: plan.videoDirection ?? 'Premium Finely Cred dark/gold visual language, no hype graphics, clear captions.',
    caption: `${hook} ${plan.cta}`,
    thumbnailPrompt: `Premium dark/gold thumbnail. Big readable text: ${hook.slice(0, 52)}. Visual cue: guide/checklist/consultation path.`,
    complianceRewrite: plan.complianceFlags.length ? `Avoid: ${plan.complianceFlags.join('; ')}.` : 'Avoid guarantees, legal advice, and credit outcome promises.',
    nextProductionStep: 'Send this brief to Media Studio, an editor, or an approved AI video/voice tool. Publish only after approval gate passes.',
  };
}

export function createBatchVideoVoiceBriefs(limit = 12): VideoVoiceBrief[] {
  return buildDefaultMediaPlans().slice(0, limit).map(createVideoVoiceBrief);
}

export function buildMetaCreativeMatrix() {
  const plans = buildDefaultMediaPlans().filter((plan) => ['meta', 'instagram', 'facebook', 'tiktok'].includes(plan.channel));
  return plans.slice(0, 12).map((plan, idx) => ({
    cellId: `creative-cell-${idx + 1}`,
    channel: plan.channel,
    offer: plan.title,
    hookA: plan.hookBank[0] ?? 'Check this before your next step.',
    hookB: plan.hookBank[1] ?? 'Most people skip this part.',
    hookC: plan.hookBank[2] ?? 'Here is the cleaner way to start.',
    format: idx % 3 === 0 ? 'face-to-camera reel' : idx % 3 === 1 ? 'checklist carousel' : 'story sequence',
    cta: plan.cta,
    owner: plan.ownerAgentIds.join(', '),
    risk: plan.complianceFlags.length ? 'review required' : 'low risk draft',
  }));
}
