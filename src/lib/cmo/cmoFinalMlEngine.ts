import {
  CmoChannel,
  CmoFeatureCapability,
  CmoGrowthEvent,
  CmoLeadGrowthPlan,
  CmoMlModelState,
  CmoPageSignal,
  CmoPersonalitySettings,
  CmoSiteArea,
  CmoStaffMessage,
} from '../../domain/cmoFinal';
import { cmoId, cmoNow } from '../../data/cmoFinalRepo';

const strongWords = [
  'book',
  'apply',
  'start',
  'claim',
  'join',
  'watch',
  'download',
  'schedule',
  'strategy',
  'roadmap',
  'proof',
  'case study',
  'funding readiness',
  'business credit',
  'affiliate',
  'consultation',
  'today',
  'limited',
  'step-by-step',
];

const weakWords = [
  'unlock your potential',
  'we help people',
  'transform your future',
  'best solution',
  'amazing service',
  'click here',
  'learn more',
  'get started',
];

const riskyClaims = [
  'guaranteed approval',
  'guaranteed deletion',
  'delete anything',
  'remove anything',
  '100% approval',
  'instant funding',
  'wipe your credit',
  'raise your score by',
  'legal loophole',
  'no denial',
  'guaranteed tradeline',
];

export function scoreConversionCopy150(copy: string): {
  score: number;
  strengths: string[];
  issues: string[];
  recommendedRewriteAngle: string;
} {
  const lower = copy.toLowerCase();
  const strengths: string[] = [];
  const issues: string[] = [];
  let score = 72;

  const strongHits = strongWords.filter((word) => lower.includes(word));
  score += Math.min(30, strongHits.length * 4);
  if (strongHits.length > 0) strengths.push(`Conversion signals found: ${strongHits.slice(0, 6).join(', ')}.`);

  const weakHits = weakWords.filter((word) => lower.includes(word));
  score -= Math.min(28, weakHits.length * 7);
  if (weakHits.length > 0) issues.push(`Generic language detected: ${weakHits.join(', ')}.`);

  const riskHits = riskyClaims.filter((word) => lower.includes(word));
  score -= Math.min(45, riskHits.length * 15);
  if (riskHits.length > 0) issues.push(`Compliance-risk wording detected: ${riskHits.join(', ')}.`);

  if (/[?]/.test(copy)) score += 3;
  if (/\b(you|your)\b/i.test(copy)) score += 5;
  if (/\b(book|schedule|apply|join|watch|download|text|call)\b/i.test(copy)) score += 10;
  if (copy.length < 60) issues.push('Copy may be too thin to sell the offer.');
  if (copy.length > 900) issues.push('Copy may be too heavy for social or short-form placement.');

  const clamped = Math.max(0, Math.min(150, Math.round(score)));
  return {
    score: clamped,
    strengths: strengths.length ? strengths : ['Clear enough to work, but it needs stronger proof and sharper urgency.'],
    issues: issues.length ? issues : ['No major red flags. Still tighten the hook, CTA, and proof stack.'],
    recommendedRewriteAngle:
      clamped >= 120
        ? 'Keep the core angle and create A/B variants for urgency, proof, and social status.'
        : 'Rewrite with a sharper pain point, proof-backed promise, safe CTA, and one obvious next step.',
  };
}

export function classifyGrowthIntent(text: string): {
  intent: 'hot_lead' | 'pricing_question' | 'objection' | 'support' | 'partnership' | 'recruitment' | 'testimonial' | 'spam' | 'neutral';
  confidence: number;
  recommendedReply: string;
  recommendedCrmAction: string;
} {
  const lower = text.toLowerCase();
  const contains = (terms: string[]) => terms.some((term) => lower.includes(term));

  if (contains(['price', 'cost', 'how much', 'payment', 'financing'])) {
    return {
      intent: 'pricing_question',
      confidence: 0.88,
      recommendedReply: 'Great question — the right option depends on your goal. Want the consultation link so we can point you to the best path?',
      recommendedCrmAction: 'Create hot pricing-interest task and send consultation CTA.',
    };
  }
  if (contains(['book', 'call', 'consultation', 'ready', 'sign me up', 'dm me', 'info'])) {
    return {
      intent: 'hot_lead',
      confidence: 0.93,
      recommendedReply: 'Absolutely — I can send the next step. Are you looking for personal credit, business credit, funding, or partner info?',
      recommendedCrmAction: 'Create prospect, tag hot_lead, route to follow-up sequence.',
    };
  }
  if (contains(['scam', 'fake', 'does this work', 'proof', 'guarantee'])) {
    return {
      intent: 'objection',
      confidence: 0.84,
      recommendedReply: 'Fair question. Results depend on the profile, but the process is built around review, strategy, education, and documented next steps — not magic tricks in a trench coat.',
      recommendedCrmAction: 'Tag objection_proof_needed and send proof/FAQ asset.',
    };
  }
  if (contains(['partner', 'affiliate', 'referral', 'collab', 'collaborate'])) {
    return {
      intent: 'partnership',
      confidence: 0.87,
      recommendedReply: 'Love that. We have partner paths depending on audience and fit. Want the affiliate/partner details?',
      recommendedCrmAction: 'Route to affiliate campaign and partner pipeline.',
    };
  }
  if (contains(['job', 'hiring', 'agent', 'specialist', 'work with you'])) {
    return {
      intent: 'recruitment',
      confidence: 0.82,
      recommendedReply: 'We may have a path for the right person. Tell me your experience with credit, sales, or client support.',
      recommendedCrmAction: 'Tag recruitment_interest and send credit specialist sequence.',
    };
  }
  if (contains(['thank you', 'helped me', 'amazing', 'worked', 'great team'])) {
    return {
      intent: 'testimonial',
      confidence: 0.77,
      recommendedReply: 'That means a lot — thank you. Would you be open to us featuring your feedback? We will keep it respectful and compliant.',
      recommendedCrmAction: 'Create testimonial permission task.',
    };
  }
  if (contains(['http://', 'https://', 'crypto', 'forex', 'adult', 'casino'])) {
    return {
      intent: 'spam',
      confidence: 0.8,
      recommendedReply: 'Do not reply. Hide/report if needed.',
      recommendedCrmAction: 'Ignore or mark as spam.',
    };
  }
  return {
    intent: 'neutral',
    confidence: 0.58,
    recommendedReply: 'Appreciate you being here. What are you working on right now — personal credit, business credit, funding, or learning?',
    recommendedCrmAction: 'Monitor for buying intent.',
  };
}

export function trainLightweightCmoModel(events: CmoGrowthEvent[], currentModel: CmoMlModelState): CmoMlModelState {
  const channels = currentModel.channels.map((channelState) => ({ ...channelState }));
  for (const event of events) {
    if (!event.channel) continue;
    const channel = channels.find((item) => item.channel === event.channel);
    if (!channel) continue;
    if (event.type === 'post_published') channel.impressions += Number(event.value ?? 100);
    if (event.type === 'lead_created') {
      channel.leads += 1;
      channel.alpha += 1.25;
    }
    if (event.type === 'call_booked') {
      channel.bookedCalls += 1;
      channel.alpha += 2;
    }
    if (event.type === 'conversion_recorded') {
      channel.conversions += 1;
      channel.alpha += 3;
    }
    if (event.type === 'revenue_recorded') channel.revenue += Number(event.value ?? 0);
    if (event.type === 'asset_scored' && Number(event.value ?? 0) < 85) channel.beta += 0.8;
    channel.lastUpdatedAt = cmoNow();
  }
  const sorted = [...channels].sort((a, b) => b.alpha / (b.alpha + b.beta) - a.alpha / (a.alpha + a.beta));
  return {
    ...currentModel,
    channels,
    winningSignals: sorted.slice(0, 4).map((item) => `${item.channel}: ${Math.round((item.alpha / (item.alpha + item.beta)) * 100)}% modeled conversion confidence`),
    weakSignals: sorted.slice(-4).map((item) => `${item.channel}: needs better creative, targeting, or follow-up`),
    recommendedExperiments: sorted.slice(0, 6).map((item) => `Double-test ${item.channel} with one proof angle and one objection-handling angle.`),
    lastTrainedAt: cmoNow(),
  };
}

export function recommendNextChannels(model: CmoMlModelState, count = 5): Array<{ channel: CmoChannel; score: number; reason: string }> {
  return [...model.channels]
    .map((item) => ({
      channel: item.channel,
      score: Math.round((item.alpha / (item.alpha + item.beta)) * 100),
      reason: item.leads > 0 ? `${item.leads} tracked leads with ${item.bookedCalls} booked calls.` : 'Seed channel. Needs controlled experiment data.',
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

export function buildTwoHundredLeadPlan(settings: CmoPersonalitySettings): CmoLeadGrowthPlan {
  const daily = Math.max(50, settings.dailyLeadTarget);
  const channelTargets: Array<[CmoChannel, number, number, string, string, string]> = [
    ['shorts', 0.22, 6, 'Credit + funding education clips', 'Shorts -> lead magnet -> consultation', 'Label AI/sponsored content where required.'],
    ['instagram_reels', 0.16, 4, 'Proof + lifestyle authority', 'Reel -> DM keyword -> CRM follow-up', 'Avoid earnings or credit guarantees.'],
    ['tiktok', 0.12, 4, 'Fast myth-busting clips', 'TikTok -> bio link -> application', 'Respect platform posting and content rules.'],
    ['linkedin', 0.1, 3, 'Business credit authority', 'Post -> partner DM -> booked call', 'Keep professional and proof-backed.'],
    ['email', 0.12, 2, 'Warm lead nurture', 'Email -> consultation booking', 'Only send to opted-in lists.'],
    ['sms', 0.08, 2, 'High-intent follow-up', 'SMS -> reply -> booked call', 'Consent-only. Keep opt-out language.'],
    ['affiliate', 0.1, 2, 'Partner/referral engine', 'Affiliate asset -> referral lead', 'Use approved claims and tracking links.'],
    ['press', 0.04, 1, 'Authority/interviews', 'Press -> site -> booking', 'No inflated claims.'],
    ['webinar', 0.04, 1, 'Education event funnel', 'Webinar -> offer -> consultation', 'Make disclosures clear.'],
    ['seo', 0.02, 1, 'Evergreen search capture', 'Article -> guide -> booking', 'Slow build, high trust.'],
  ];

  return {
    id: cmoId('leadplan'),
    dailyLeadTarget: daily,
    qualifiedLeadTarget: settings.qualifiedLeadTarget,
    bookedCallTarget: settings.bookedCallTarget,
    channelPlan: channelTargets.map(([channel, pct, quota, offer, path, risk]) => ({
      channel,
      dailyLeadTarget: Math.max(1, Math.round(daily * pct)),
      contentQuota: quota,
      primaryOffer: offer,
      conversionPath: path,
      riskNote: risk,
    })),
    campaignSeasons: [
      {
        month: 1,
        theme: 'Authority + interviews',
        objective: 'Make Finely Cred look undeniable and interview-worthy.',
        deliverables: ['press release', 'founder story campaign', 'podcast pitch kit', '20 Shorts', 'affiliate invite page audit'],
        proofNeeded: ['client-safe testimonials', 'process screenshots', 'case-study-style education'],
      },
      {
        month: 2,
        theme: 'Product + offer expansion',
        objective: 'Push book/course/resources while feeding consultation demand.',
        deliverables: ['book/course launch sequence', 'webinar funnel', 'email nurture', 'SMS follow-up', 'Reels proof series'],
        proofNeeded: ['curriculum outcomes', 'founder authority', 'FAQs'],
      },
      {
        month: 3,
        theme: 'Affiliate + partner machine',
        objective: 'Recruit referral partners and high-quality affiliates.',
        deliverables: ['affiliate landing copy', 'partner DM scripts', 'B2B LinkedIn campaign', 'referral tracking plan'],
        proofNeeded: ['partner benefits', 'approved payout language', 'compliance-safe terms'],
      },
      {
        month: 4,
        theme: 'Scale + optimize',
        objective: 'Shift budget and attention toward the channels creating booked calls and revenue.',
        deliverables: ['performance report', 'campaign cuts', 'winner scaling plan', 'new angle tests'],
        proofNeeded: ['tracked conversions', 'lead source quality', 'booked-call outcomes'],
      },
    ],
    createdAt: cmoNow(),
  };
}

export function generateCmoCapabilityMatrix(): CmoFeatureCapability[] {
  const categories = [
    'site intelligence',
    'layout beauty',
    'copywriting',
    'offer strategy',
    'short-form video',
    'affiliate growth',
    'lead generation',
    'crm routing',
    'email automation',
    'sms automation',
    'media production',
    'press and interviews',
    'seo content',
    'webinars',
    'analytics',
    'machine learning',
    'comment replies',
    'dm triage',
    'compliance',
    'technical growth',
    'conversion optimization',
    'retargeting',
    'recruitment campaigns',
    'partner campaigns',
    'product launches',
  ];
  const verbs = ['detect', 'score', 'rewrite', 'route', 'prioritize', 'forecast', 'test', 'launch', 'audit', 'optimize', 'summarize', 'protect'];
  const modules = ['Growth OS', 'Lead Intel', 'CRM', 'Comms Studio', 'Media Studio', 'Scheduler', 'Inbox', 'Analytics', 'CMO Prime'];
  const features: CmoFeatureCapability[] = [];
  for (const category of categories) {
    for (const verb of verbs) {
      for (let i = 1; i <= 5; i += 1) {
        features.push({
          id: `cmo_${category.replace(/\s+/g, '_')}_${verb}_${i}`,
          category,
          title: `${capitalize(verb)} ${category} signal ${i}`,
          description: `CMO Prime can ${verb} ${category} opportunities, turn them into staff-style directives, and connect the next action across Finely Cred modules.`,
          requiredData: ['campaign data', 'site signals', 'growth events', 'approved brand rules'],
          connectedModules: modules.slice((i - 1) % modules.length, ((i - 1) % modules.length) + 4),
          automationLevel: i % 3 === 0 ? 'approve_then_execute' : 'draft_only',
          riskMode: category === 'compliance' || category === 'sms automation' ? 'conservative' : 'aggressive_safe',
        });
      }
    }
  }
  return features;
}

export function buildStaffReply(input: string, settings: CmoPersonalitySettings, signal?: CmoPageSignal): Omit<CmoStaffMessage, 'id' | 'createdAt'> {
  const lower = input.toLowerCase();
  const actionItems = [];
  const route = signal?.route;
  const area = signal?.area ?? 'unknown';

  if (lower.includes('lead') || lower.includes('200')) {
    actionItems.push({
      id: cmoId('dir'),
      title: 'Build 200-lead daily operating plan',
      owner: 'marketing' as const,
      priority: 'critical' as const,
      status: 'new' as const,
      dueWindow: 'today' as const,
      expectedImpact: 'Clarifies the daily channel quotas needed to hit lead volume without sloppy outreach.',
      nextStep: 'Create channel quotas, lead magnets, follow-up sequences, and tracked CTAs.',
      linkedRoute: '/admin/marketing-agent',
      createdAt: cmoNow(),
    });
  }
  if (lower.includes('site') || lower.includes('layout') || lower.includes('beautiful')) {
    actionItems.push({
      id: cmoId('dir'),
      title: 'Run site-change and beauty audit',
      owner: 'analytics' as const,
      priority: 'high' as const,
      status: 'new' as const,
      dueWindow: 'today' as const,
      expectedImpact: 'Catches confusing layout, weak CTAs, broken links, and brand drift before customers see the mess.',
      nextStep: 'Scan current page, compare snapshot history, then fix top three leaks.',
      linkedRoute: route,
      createdAt: cmoNow(),
    });
  }

  const funny = settings.humorMode === 'minimal' ? '' : ' Translation: no more sleepy buttons hiding in the bushes.';
  const body = [
    `Staff note from ${settings.name}: I hear you. The move is to make me watch the site, score the money paths, and report changes like an actual CMO with caffeine and standards.`,
    signal ? `Current page read: ${signal.title || signal.route} in ${area}. I see ${signal.ctas.length} CTA candidates and ${signal.links.length} tracked link candidates.` : 'Give me a page scan and I will call out weak CTAs, missing Shorts links, affiliate gaps, and layout drift.',
    `Lead target stays ${settings.dailyLeadTarget}/day, with ${settings.qualifiedLeadTarget} qualified and ${settings.bookedCallTarget} booked-call targets. That requires daily channel quotas, not vibes in a blazer.${funny}`,
    'Next action: run the Site Watch scan, generate the lead plan, then push the top directives into the Growth Work Queue.',
  ].join('\n\n');

  return {
    role: 'cmo',
    body,
    contextTags: ['cmo_staff', 'growth_os', 'site_watch', 'ml'],
    actionItems,
  };
}

export function inferSiteArea(route: string): CmoSiteArea {
  if (route.startsWith('/admin/lead-intel')) return 'lead_intel';
  if (route.startsWith('/admin/marketing') || route.startsWith('/admin/growth')) return 'marketing';
  if (route.startsWith('/admin/comms')) return 'comms';
  if (route.startsWith('/admin/media')) return 'media';
  if (route.startsWith('/admin/crm')) return 'crm';
  if (route.startsWith('/admin')) return 'admin';
  if (route.startsWith('/portal')) return 'portal';
  if (route.startsWith('/seller')) return 'seller';
  if (route.includes('book')) return 'bookstore';
  if (route.includes('pricing')) return 'pricing';
  if (route.includes('affiliate')) return 'affiliate';
  if (route === '/' || route === '') return 'landing';
  return 'unknown';
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
