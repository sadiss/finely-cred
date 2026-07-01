import type { CmoChannel, CmoEvent, CmoModelState, CmoObjective, CmoRiskLevel } from '../../domain/cmoPhase2';
import { cmoNowIso } from '../../domain/cmoPhase2';
import { getCmoModelState, listCmoEvents, saveCmoModelState, upsertCmoMemory } from '../../data/cmoPhase2Repo';
import { newId } from '../../utils/ids';

const POSITIVE_WORDS = [
  'book',
  'consultation',
  'roadmap',
  'custom',
  'strategy',
  'funding readiness',
  'business credit',
  'limited',
  'today',
  'proof',
  'case study',
  'before',
  'after',
  'results vary',
  'learn',
  'qualify',
  'apply',
  'audit',
  'diagnose',
  'plan',
  'step-by-step',
  'free',
  'private',
  'exclusive',
  'founder',
  'interview',
  'press',
  'partner',
  'affiliate',
];

const WEAK_WORDS = [
  'unlock your potential',
  'game changer',
  'life changing',
  'amazing opportunity',
  'learn more',
  'click here',
  'we help',
  'best in class',
  'empower',
  'innovative solution',
];

const BLOCKED_CLAIMS = [
  'guaranteed approval',
  'guaranteed deletion',
  '100% approval',
  'wipe your credit clean',
  'remove anything',
  'instant funding',
  'legal loophole',
  'raise your score by',
  'delete all negatives',
  'no denial',
];

const HOOK_PATTERNS = [
  /\bmost people\b/i,
  /\byou are (probably )?making\b/i,
  /\bstop\b/i,
  /\bhere'?s why\b/i,
  /\bthe truth\b/i,
  /\bwatch this before\b/i,
  /\bif you own a business\b/i,
  /\bcredit repair is not\b/i,
  /\bfunding readiness\b/i,
  /\bwhat nobody tells you\b/i,
  /\bexpensive mistake\b/i,
];

export function scoreConversionCopy150(text: string): {
  score: number;
  riskLevel: CmoRiskLevel;
  complianceFlags: string[];
  strengths: string[];
  fixes: string[];
} {
  const body = String(text || '').trim();
  const lower = body.toLowerCase();
  let score = 55;
  const strengths: string[] = [];
  const fixes: string[] = [];
  const complianceFlags = BLOCKED_CLAIMS.filter((claim) => lower.includes(claim));

  const words = body.split(/\s+/).filter(Boolean).length;
  if (words >= 18 && words <= 180) {
    score += 12;
    strengths.push('Clear length for a conversion asset.');
  } else if (words < 10) {
    score -= 14;
    fixes.push('Too thin. Add the pain, promise, proof, and CTA.');
  } else if (words > 240) {
    score -= 8;
    fixes.push('Likely too long. Cut the fog and make the CTA easier to see.');
  }

  const positiveHits = POSITIVE_WORDS.filter((w) => lower.includes(w));
  score += Math.min(28, positiveHits.length * 4);
  if (positiveHits.length >= 4) strengths.push('Uses strong conversion language tied to action and outcomes.');

  const weakHits = WEAK_WORDS.filter((w) => lower.includes(w));
  score -= Math.min(25, weakHits.length * 5);
  if (weakHits.length) fixes.push(`Replace vague phrases: ${weakHits.slice(0, 4).join(', ')}.`);

  const hookHits = HOOK_PATTERNS.filter((r) => r.test(body)).length;
  score += Math.min(18, hookHits * 6);
  if (hookHits) strengths.push('Has a scroll-stopping hook pattern.');

  const hasCta = /\b(book|apply|call|dm|comment|reply|download|join|schedule|get started|start|claim|reserve)\b/i.test(body);
  if (hasCta) {
    score += 16;
    strengths.push('CTA is visible.');
  } else {
    score -= 18;
    fixes.push('Add one direct CTA. The reader should never have to guess the next move.');
  }

  const hasProof = /\b(case study|testimonial|client|proof|result|before|after|review|press|featured|interview|seen in)\b/i.test(body);
  if (hasProof) {
    score += 12;
    strengths.push('Includes credibility/proof language.');
  } else {
    fixes.push('Add proof: testimonial, press angle, case-style story, or specific authority marker.');
  }

  const hasAudience = /\b(owner|founder|agent|affiliate|specialist|business|trucking|real estate|client|consumer|entrepreneur)\b/i.test(body);
  if (hasAudience) score += 8;
  else fixes.push('Name the audience directly so the right person self-identifies.');

  if (/[!?]{2,}/.test(body)) {
    score -= 6;
    fixes.push('Reduce hype punctuation. Premium brands do not scream unless the building is actually on fire.');
  }

  if (complianceFlags.length) {
    score -= 50;
    fixes.push('Remove risky credit/funding claims before publishing.');
  }

  score = Math.max(0, Math.min(150, Math.round(score)));
  const riskLevel: CmoRiskLevel = complianceFlags.length >= 2 ? 'blocked' : complianceFlags.length === 1 ? 'high' : score < 55 ? 'medium' : 'low';
  return { score, riskLevel, complianceFlags, strengths, fixes };
}

export function classifyGrowthIntent(text: string): {
  intent: 'hot_lead' | 'pricing_question' | 'objection' | 'support' | 'spam' | 'testimonial' | 'partner' | 'recruitment' | 'complaint' | 'general';
  confidence: number;
  suggestedReply: string;
  suggestedAction: string;
} {
  const t = String(text || '').toLowerCase();
  const rules: Array<[ReturnType<typeof classifyGrowthIntent>['intent'], RegExp, string, string, number]> = [
    ['hot_lead', /\b(book|call me|consultation|need help|sign me up|ready|start today|dm me|info please)\b/i, 'Absolutely — I can help you find the right next step. Book a private consultation and we will map the cleanest route for your profile.', 'Create hot lead, route to booking CTA, and add same-day follow-up.', 0.92],
    ['pricing_question', /\b(price|cost|how much|payment|deposit|fee|package)\b/i, 'Pricing depends on the path. The smart move is to review your situation first so you are not buying the wrong thing with confidence. Painfully common. Book a consult.', 'Send pricing-safe reply and pricing/consultation link.', 0.88],
    ['objection', /\b(scam|does this work|prove|guarantee|too expensive|not sure|already tried)\b/i, 'Fair question. Results vary, but the process should never be vague. We start with a review, identify the real blockers, and build the strategy before making promises.', 'Create objection follow-up and send proof/education asset.', 0.84],
    ['partner', /\b(partner|affiliate|referral|collab|joint venture|wholesale|network)\b/i, 'Partnerships are exactly the kind of conversation we like — clean value, clear terms, no messy nonsense. Send your details and we will review fit.', 'Route to affiliate/partner pipeline.', 0.9],
    ['recruitment', /\b(job|hiring|agent|specialist|work with you|position|career|recruit)\b/i, 'We are building with serious operators. If you can bring discipline, follow-up, and integrity, start with the specialist path here.', 'Route to agent recruitment campaign.', 0.88],
    ['testimonial', /\b(thank you|worked|amazing|helped me|got approved|great service|love this)\b/i, 'We appreciate that. Stories like this matter — and yes, we are absolutely saving this one before it gets shy and runs away.', 'Ask for permission to use as testimonial.', 0.82],
    ['complaint', /\b(angry|upset|refund|bad service|complaint|unhappy|terrible)\b/i, 'I hear you. Let us take this seriously and review what happened. Please send the details so the team can look into it directly.', 'Create support escalation. Do not auto-reply publicly beyond acknowledgment.', 0.9],
    ['support', /\b(login|portal|document|upload|status|case|letter|account|report)\b/i, 'That sounds like a support item. Send the account details through the proper channel so the team can review it without guessing.', 'Route to support inbox.', 0.8],
    ['spam', /\b(crypto|forex|adult|loan shark|whatsapp only|guaranteed profit)\b/i, 'No reply recommended.', 'Mark as spam.', 0.93],
  ];
  const hit = rules.find(([, rx]) => rx.test(t));
  if (hit) return { intent: hit[0], confidence: hit[4], suggestedReply: hit[2], suggestedAction: hit[3] };
  return {
    intent: 'general',
    confidence: 0.55,
    suggestedReply: 'Good question — the best next move depends on the goal. Book a quick consultation and we will point you in the cleanest direction.',
    suggestedAction: 'Review manually and route if interest is real.',
  };
}

function ensureChannel(state: CmoModelState, channel: string) {
  if (!state.channelStats[channel]) {
    state.channelStats[channel] = {
      impressions: 0,
      clicks: 0,
      leads: 0,
      qualifiedLeads: 0,
      bookedCalls: 0,
      conversions: 0,
      revenue: 0,
      alpha: 1,
      beta: 1,
      confidence: 0.5,
    };
  }
  return state.channelStats[channel];
}

export function trainCmoModelFromEvents(events: CmoEvent[] = listCmoEvents(5000)): CmoModelState {
  const state = getCmoModelState();
  for (const event of events.slice().reverse()) {
    if (!event.channel) continue;
    const s = ensureChannel(state, event.channel);
    s.lastEventAt = event.createdAt;
    if (event.type === 'post_published') s.impressions += Math.max(0, Number(event.meta?.impressions) || 0);
    if (event.type === 'lead_created') {
      s.leads += 1;
      s.alpha += 1;
    }
    if (event.type === 'lead_qualified') s.qualifiedLeads += 1;
    if (event.type === 'call_booked') s.bookedCalls += 1;
    if (event.type === 'deal_closed') s.conversions += 1;
    if (event.type === 'revenue_recorded') s.revenue += Math.max(0, Number(event.value) || 0);
    if (event.type === 'ui_regression_flagged' || event.type === 'compliance_flagged') s.beta += 1;
    s.confidence = s.alpha / Math.max(1, s.alpha + s.beta);

    const labels = event.labels ?? [];
    labels.forEach((label) => {
      const key = label.trim().toLowerCase();
      if (!key) return;
      if (event.type === 'lead_created' || event.type === 'call_booked' || event.type === 'deal_closed') {
        state.hookWeights[key] = (state.hookWeights[key] ?? 0) + 1;
      }
      if (event.type === 'compliance_flagged') {
        state.hookWeights[key] = (state.hookWeights[key] ?? 0) - 2;
      }
    });
  }
  state.lastTrainingAt = cmoNowIso();
  return saveCmoModelState(state);
}

export function recommendChannels(args?: { objective?: CmoObjective; limit?: number }): Array<{ channel: CmoChannel; score: number; reason: string }> {
  const state = trainCmoModelFromEvents();
  const base: Record<CmoChannel, number> = {
    shorts: 72,
    instagram_reels: 70,
    tiktok: 68,
    youtube: 64,
    linkedin: 66,
    facebook: 58,
    email: 75,
    sms: 78,
    press: 62,
    affiliate: 73,
    seo: 58,
    webinar: 60,
    podcast: 56,
    referral: 76,
    manual_outreach: 70,
  };
  if (args?.objective === 'get_interviews' || args?.objective === 'build_authority') {
    base.press += 18;
    base.podcast += 14;
    base.linkedin += 10;
    base.youtube += 8;
  }
  if (args?.objective === 'book_consultations' || args?.objective === 'generate_leads') {
    base.sms += 10;
    base.email += 8;
    base.shorts += 8;
    base.instagram_reels += 6;
  }
  if (args?.objective === 'enroll_affiliates') {
    base.affiliate += 20;
    base.linkedin += 12;
    base.email += 8;
  }
  const out = Object.keys(base).map((key) => {
    const channel = key as CmoChannel;
    const learned = state.channelStats[channel]?.confidence ?? 0.5;
    const volume = Math.log10(1 + (state.channelStats[channel]?.leads ?? 0) + (state.channelStats[channel]?.bookedCalls ?? 0));
    return {
      channel,
      score: Math.round(base[channel] + learned * 30 + volume * 8),
      reason: learned > 0.62 ? 'learned lift from real events' : 'strategic default until more data lands',
    };
  });
  return out.sort((a, b) => b.score - a.score).slice(0, args?.limit ?? 6);
}

export function captureCreativeMemory(args: {
  kind: 'hook' | 'cta' | 'offer_angle' | 'objection_reply' | 'visual_pattern' | 'email_subject' | 'shorts_script' | 'press_angle';
  text: string;
  sourceCampaignId?: string;
  channel?: CmoChannel;
  objective?: CmoObjective;
  tags?: string[];
}) {
  const scored = scoreConversionCopy150(args.text);
  return upsertCmoMemory({
    id: newId('cmomem'),
    createdAt: cmoNowIso(),
    updatedAt: cmoNowIso(),
    kind: args.kind,
    text: args.text,
    sourceCampaignId: args.sourceCampaignId,
    channel: args.channel,
    objective: args.objective,
    score150: scored.score,
    tags: args.tags ?? [],
    keep: scored.score >= 80 && scored.riskLevel !== 'blocked',
  });
}
