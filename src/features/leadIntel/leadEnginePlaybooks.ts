/**
 * Marketing Lead Engine 3× playbooks — hunt lanes, modifiers, nurture, objections, offer packs.
 * Partner terminology only in public-facing copy.
 */

export type LeadEngineLane =
  | 'business_credit'
  | 'credit_restore'
  | 'debt'
  | 'agency_affiliates'
  | 'local_service'
  | 'funded_business';

export type GeoModifier = 'national' | 'metro' | 'state' | 'custom';
export type NicheModifier = 'general' | 'llc_owners' | 'contractors' | 'ecommerce' | 'professionals' | 'haitian_community';
export type IntentModifier = 'awareness' | 'consideration' | 'high_intent' | 'funded_signal';

export type HuntLanePreset = {
  id: LeadEngineLane;
  label: string;
  shortLabel: string;
  description: string;
  target: 'clients' | 'affiliates' | 'agents' | 'b2b_partners';
  queries: string[];
  tags: string[];
  book: string;
  offer: string;
  nurture: string;
  freeGuide: string;
};

export const HUNT_LANE_PRESETS: HuntLanePreset[] = [
  {
    id: 'business_credit',
    label: 'Business credit buyers',
    shortLabel: 'BC buyers',
    description: 'LLC / SMB owners seeking vendor + revolving business credit paths.',
    target: 'clients',
    queries: [
      'small business owners need business credit funding',
      'LLC owners looking for business credit cards',
      'startup fundability business credit build',
      'net 30 vendor accounts for new LLC',
    ],
    tags: ['business_credit', 'bc_buyer'],
    book: '/consultation?lane=Business+Credit',
    offer: '/pricing/business-credit',
    nurture: '/resources/business-credit-one-sheets',
    freeGuide: '/free-business-guide',
  },
  {
    id: 'credit_restore',
    label: 'Credit restore seekers',
    shortLabel: 'Restore',
    description: 'Partners needing evidence-first dispute discipline and score recovery.',
    target: 'clients',
    queries: [
      'credit repair help near me',
      'dispute inaccurate credit report',
      'raise credit score for mortgage',
      'remove collections from credit report help',
    ],
    tags: ['credit_restore', 'dispute'],
    book: '/consultation?lane=Personal+Credit',
    offer: '/pricing',
    nurture: '/resources',
    freeGuide: '/free-guide',
  },
  {
    id: 'debt',
    label: 'Debt / litigation',
    shortLabel: 'Debt',
    description: 'Validation-first help for collections and lawsuit pressure (educational).',
    target: 'clients',
    queries: [
      'sued by debt collector help',
      'debt validation letter help',
      'collection lawsuit defense',
      'FDCPA validation before settle',
    ],
    tags: ['debt', 'litigation'],
    book: '/consultation?lane=' + encodeURIComponent('Debt Kill (Debt & Legal)'),
    offer: '/pricing/debt-legal',
    nurture: '/free-debt-guide',
    freeGuide: '/free-debt-guide',
  },
  {
    id: 'agency_affiliates',
    label: 'Agency / affiliates',
    shortLabel: 'Agency',
    description: 'Credit agencies, affiliates, and specialists who can refer partners.',
    target: 'affiliates',
    queries: [
      'credit repair agency partnership program',
      'affiliate program credit repair business',
      'credit specialist white label software',
      'referral partner credit restoration',
    ],
    tags: ['agency_affiliates', 'affiliate'],
    book: '/consultation?lane=Business+Credit',
    offer: '/affiliate',
    nurture: '/resources',
    freeGuide: '/free-guide',
  },
  {
    id: 'local_service',
    label: 'Local service operators',
    shortLabel: 'Local ops',
    description: 'Contractors, salons, clinics, and local SMBs needing fundability.',
    target: 'clients',
    queries: [
      'local contractor business funding credit',
      'salon owner business credit cards',
      'small business owner working capital credit',
      'trades business credit building',
    ],
    tags: ['local_service', 'smb'],
    book: '/consultation?lane=Business+Credit',
    offer: '/pricing/business-credit',
    nurture: '/resources/business-credit-one-sheets',
    freeGuide: '/free-business-guide',
  },
  {
    id: 'funded_business',
    label: 'Funded-business intent',
    shortLabel: 'Funded',
    description: 'Signals of recent funding / expansion — warm for BC sequencing.',
    target: 'clients',
    queries: [
      'recently funded startup business credit',
      'series seed company vendor accounts',
      'business expansion credit cards LLC',
      'fundability after business loan',
    ],
    tags: ['funded_business', 'high_intent'],
    book: '/consultation?lane=Business+Credit',
    offer: '/pricing/business-credit',
    nurture: '/resources/business-credit-one-sheets',
    freeGuide: '/free-business-guide',
  },
];

export const GEO_MODIFIERS: { id: GeoModifier; label: string; hint: string }[] = [
  { id: 'national', label: 'National (US)', hint: 'United States' },
  { id: 'metro', label: 'Metro focus', hint: 'Append metro to queries' },
  { id: 'state', label: 'State focus', hint: 'Append state to queries' },
  { id: 'custom', label: 'Custom geo', hint: 'Use location field as-is' },
];

export const NICHE_MODIFIERS: { id: NicheModifier; label: string; queryBoost: string }[] = [
  { id: 'general', label: 'General ICP', queryBoost: '' },
  { id: 'llc_owners', label: 'LLC owners', queryBoost: 'LLC owner' },
  { id: 'contractors', label: 'Contractors / trades', queryBoost: 'contractor trades' },
  { id: 'ecommerce', label: 'Ecommerce', queryBoost: 'ecommerce online store' },
  { id: 'professionals', label: 'Professionals', queryBoost: 'professional practice' },
  { id: 'haitian_community', label: 'Haitian-American community', queryBoost: 'Haitian American business owner' },
];

export const INTENT_MODIFIERS: { id: IntentModifier; label: string; queryBoost: string; scoreBoost: number }[] = [
  { id: 'awareness', label: 'Awareness', queryBoost: 'how to learn', scoreBoost: 0 },
  { id: 'consideration', label: 'Consideration', queryBoost: 'best options compare', scoreBoost: 5 },
  { id: 'high_intent', label: 'High intent', queryBoost: 'consultation help apply', scoreBoost: 12 },
  { id: 'funded_signal', label: 'Funded signal', queryBoost: 'recently funded expansion', scoreBoost: 15 },
];

/** Daily pack = 3–5 hunts that cover the growth stack. */
export const DAILY_HUNT_PACK: LeadEngineLane[] = [
  'business_credit',
  'credit_restore',
  'local_service',
  'agency_affiliates',
  'funded_business',
];

export function getHuntLane(lane: LeadEngineLane): HuntLanePreset {
  return HUNT_LANE_PRESETS.find((p) => p.id === lane) ?? HUNT_LANE_PRESETS[0]!;
}

export function buildHuntQueries(args: {
  lane: LeadEngineLane;
  location?: string;
  niche?: NicheModifier;
  intent?: IntentModifier;
  geo?: GeoModifier;
}): string[] {
  const preset = getHuntLane(args.lane);
  const nicheBoost = NICHE_MODIFIERS.find((n) => n.id === (args.niche ?? 'general'))?.queryBoost ?? '';
  const intentBoost = INTENT_MODIFIERS.find((i) => i.id === (args.intent ?? 'high_intent'))?.queryBoost ?? '';
  const loc = (args.location || 'United States').trim();
  const geo = args.geo ?? 'custom';
  const locSuffix =
    geo === 'national' ? 'United States'
    : geo === 'metro' || geo === 'state' || geo === 'custom' ? loc
    : loc;

  return preset.queries.slice(0, 4).map((q) => {
    const parts = [q, nicheBoost, intentBoost, locSuffix].filter(Boolean);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  });
}

export type OfferPackItem = {
  id: string;
  label: string;
  href: string;
  laneHint?: LeadEngineLane[];
};

export const OFFER_PACK: OfferPackItem[] = [
  { id: 'bc_foundation', label: 'BC Foundation tier (~$2,997)', href: '/pricing/business-credit', laneHint: ['business_credit', 'local_service', 'funded_business'] },
  { id: 'bc_builder', label: 'BC Builder tier (~$5,997)', href: '/pricing/business-credit', laneHint: ['business_credit', 'funded_business'] },
  { id: 'bc_elite', label: 'BC Elite tier (~$12,997)', href: '/pricing/business-credit', laneHint: ['business_credit', 'funded_business'] },
  { id: 'bc_empire', label: 'BC Empire tier (~$24,997)', href: '/pricing/business-credit', laneHint: ['business_credit', 'funded_business'] },
  { id: 'one_sheets', label: 'Business credit one-sheets', href: '/resources/business-credit-one-sheets', laneHint: ['business_credit', 'local_service', 'funded_business', 'agency_affiliates'] },
  { id: 'free_guide', label: 'Free dispute guide', href: '/free-guide', laneHint: ['credit_restore'] },
  { id: 'free_bc', label: 'Free business credit guide', href: '/free-business-guide', laneHint: ['business_credit', 'local_service', 'funded_business'] },
  { id: 'free_debt', label: 'Free debt validation guide', href: '/free-debt-guide', laneHint: ['debt'] },
  { id: 'book', label: 'Book strategy session', href: '/consultation', laneHint: undefined },
  { id: 'affiliate', label: 'Affiliate hub', href: '/affiliate', laneHint: ['agency_affiliates'] },
];

export function offerPackForLane(lane: LeadEngineLane): OfferPackItem[] {
  return OFFER_PACK.filter((o) => !o.laneHint || o.laneHint.includes(lane) || o.id === 'book');
}

export type ObjectionReply = {
  id: string;
  objection: string;
  reply: string;
  ctaHref: string;
  lanes: LeadEngineLane[] | 'all';
};

export const OBJECTION_LIBRARY: ObjectionReply[] = [
  {
    id: 'too_expensive',
    objection: 'Too expensive / I can DIY',
    reply:
      'Fair — DIY works when you have hours and process discipline. Our BC tiers price specialist hours + sequencing (vendors → revolving → named products). Start with a free guide or one-sheets, then book a session if the path is clearer. Results vary · funding subject to underwriting.',
    ctaHref: '/resources/business-credit-one-sheets',
    lanes: ['business_credit', 'local_service', 'funded_business'],
  },
  {
    id: 'one_card',
    objection: 'I just need one card',
    reply:
      'One named product is often the goal — the durable path is entity hygiene + vendor history first so inquiries do not burn the file. Happy to map a short ladder on a complimentary session. No approval guarantees.',
    ctaHref: '/consultation?lane=Business+Credit',
    lanes: ['business_credit', 'funded_business'],
  },
  {
    id: 'already_open',
    objection: 'Business has been open for years',
    reply:
      'Established entities often need cleanup (inquiries, thin tradelines, mismatched profiles) before new products. We calibrate Foundation → Empire by work hours, not pressure. Book a session or skim BC one-sheets.',
    ctaHref: '/pricing/business-credit',
    lanes: ['business_credit', 'local_service', 'funded_business'],
  },
  {
    id: 'guarantees',
    objection: 'Can you guarantee deletions / funding?',
    reply:
      'No — and anyone who promises outcomes is a red flag. Finely Cred is educational + process-driven: evidence-first disputes, validation-first debt steps, fundability sequencing. Results vary · not legal advice · funding subject to underwriting.',
    ctaHref: '/consultation',
    lanes: 'all',
  },
  {
    id: 'not_now',
    objection: 'Not ready / just looking',
    reply:
      'Perfect — grab the free guide that matches your lane and keep the door open. When timing is right, book a complimentary strategy session. No pressure.',
    ctaHref: '/resources',
    lanes: 'all',
  },
  {
    id: 'lawsuit_scared',
    objection: 'I was sued / collector is calling',
    reply:
      'Stay calm and documentation-first. Validation before settlement is the educational path we teach — not legal advice. Start with the free debt guide, then book a session if you want a human walkthrough.',
    ctaHref: '/free-debt-guide',
    lanes: ['debt'],
  },
  {
    id: 'affiliate_roi',
    objection: 'Why partner / affiliate with Finely?',
    reply:
      'Affiliates get compliant promo paths into free guides, resources, and /consultation — partner terminology, no income promises. Open the affiliate hub for links and kits.',
    ctaHref: '/affiliate',
    lanes: ['agency_affiliates'],
  },
];

export function objectionsForLane(lane: LeadEngineLane): ObjectionReply[] {
  return OBJECTION_LIBRARY.filter((o) => o.lanes === 'all' || o.lanes.includes(lane));
}

export type NurtureTouch = {
  day: 0 | 2 | 5 | 7;
  title: string;
  channel: 'email_manual' | 'sms_manual' | 'crm_task';
  subject: string;
  body: string;
};

export function buildNurtureSequence(args: {
  lane: LeadEngineLane;
  companyName?: string;
  website?: string;
}): NurtureTouch[] {
  const preset = getHuntLane(args.lane);
  const name = args.companyName?.trim() || 'there';
  const src = args.website ? `\n(Signal: ${args.website})` : '';
  return [
    {
      day: 0,
      title: 'Day 0 · Open + value',
      channel: 'email_manual',
      subject: `${name}: quick path for ${preset.shortLabel.toLowerCase()}`,
      body: [
        `Hi ${name},`,
        '',
        `Saw a signal around ${preset.label.toLowerCase()}. Finely Cred helps partners move with clear next steps — no hype.`,
        `Start here: ${preset.freeGuide}`,
        `One-sheets / resources: ${preset.nurture}`,
        `Book a complimentary strategy session: ${preset.book}`,
        src,
        '',
        'Results vary · not legal advice · funding subject to underwriting',
        '— Finely Cred',
      ]
        .filter(Boolean)
        .join('\n'),
    },
    {
      day: 2,
      title: 'Day 2 · Proof / education',
      channel: 'email_manual',
      subject: `${name}: one useful resource (no pressure)`,
      body: [
        `Hi ${name},`,
        '',
        `Sharing one practical resource for ${preset.shortLabel}: ${preset.nurture}`,
        `Offer overview: ${preset.offer}`,
        `If a short call helps, book here: ${preset.book}`,
        '',
        'Results vary · not legal advice · funding subject to underwriting',
        '— Finely Cred',
      ].join('\n'),
    },
    {
      day: 5,
      title: 'Day 5 · Soft CTA',
      channel: 'crm_task',
      subject: `${name}: ready for a strategy session?`,
      body: [
        `Hi ${name},`,
        '',
        'Checking in — if timing is better now, book a complimentary session and we will map one clear next step.',
        preset.book,
        `Still exploring? ${preset.freeGuide}`,
        '',
        'Results vary · not legal advice · funding subject to underwriting',
        '— Finely Cred',
      ].join('\n'),
    },
    {
      day: 7,
      title: 'Day 7 · Close or park',
      channel: 'sms_manual',
      subject: `${name}: last soft nudge`,
      body: [
        `Hi ${name} — last note from Finely Cred. Session: ${preset.book} · Resources: ${preset.nurture}. Happy to park this until you are ready.`,
        'Results vary · not legal advice.',
      ].join('\n'),
    },
  ];
}

export type WhyLeadReason = {
  code: string;
  label: string;
  weight: number;
};

export function scoreLeadReasons(args: {
  lane: LeadEngineLane;
  score: number;
  intentTier?: string;
  hasEmail: boolean;
  hasPhone: boolean;
  snippet?: string;
  industry?: string;
  niche?: NicheModifier;
  intent?: IntentModifier;
}): { score: number; reasons: WhyLeadReason[] } {
  const reasons: WhyLeadReason[] = [];
  let score = args.score;

  if (args.intentTier === 'hot') {
    reasons.push({ code: 'intent_hot', label: 'Hot intent tier from Lead Intel', weight: 20 });
    score += 8;
  } else if (args.intentTier === 'warm') {
    reasons.push({ code: 'intent_warm', label: 'Warm intent signal', weight: 12 });
    score += 4;
  }

  if (args.hasEmail) {
    reasons.push({ code: 'has_email', label: 'Email available for manual outreach', weight: 15 });
    score += 6;
  }
  if (args.hasPhone) {
    reasons.push({ code: 'has_phone', label: 'Phone available for call / SMS (consented)', weight: 10 });
    score += 4;
  }

  const intentBoost = INTENT_MODIFIERS.find((i) => i.id === (args.intent ?? 'high_intent'))?.scoreBoost ?? 0;
  if (intentBoost) {
    reasons.push({ code: 'intent_mod', label: `Intent modifier boost (+${intentBoost})`, weight: intentBoost });
    score += intentBoost;
  }

  const snip = (args.snippet || '').toLowerCase();
  const laneKeywords: Record<LeadEngineLane, string[]> = {
    business_credit: ['business credit', 'llc', 'funding', 'vendor', 'fundability'],
    credit_restore: ['credit repair', 'dispute', 'score', 'bureau'],
    debt: ['collection', 'lawsuit', 'validation', 'debt'],
    agency_affiliates: ['affiliate', 'agency', 'partner', 'referral'],
    local_service: ['contractor', 'salon', 'local', 'trades'],
    funded_business: ['funded', 'seed', 'expansion', 'raise'],
  };
  const hits = (laneKeywords[args.lane] || []).filter((k) => snip.includes(k));
  if (hits.length) {
    reasons.push({
      code: 'snippet_fit',
      label: `Snippet matches lane keywords (${hits.slice(0, 3).join(', ')})`,
      weight: 10 + hits.length * 2,
    });
    score += 5 + hits.length;
  }

  if (args.niche && args.niche !== 'general') {
    reasons.push({ code: 'niche', label: `Niche filter: ${args.niche.replaceAll('_', ' ')}`, weight: 8 });
  }

  if (args.score >= 60) {
    reasons.push({ code: 'base_score', label: 'Strong base Lead Intel score (≥60)', weight: 18 });
  } else if (args.score >= 40) {
    reasons.push({ code: 'base_score', label: 'Solid base Lead Intel score (≥40)', weight: 10 });
  } else {
    reasons.push({ code: 'base_score', label: 'Lower base score — nurture before hard ask', weight: 4 });
  }

  reasons.push({
    code: 'lane',
    label: `Lane fit: ${getHuntLane(args.lane).label}`,
    weight: 10,
  });

  return {
    score: Math.min(99, Math.round(score)),
    reasons: reasons.sort((a, b) => b.weight - a.weight).slice(0, 6),
  };
}

export type NextBestAction = {
  id: 'book' | 'offer' | 'nurture' | 'enrich' | 'objection' | 'sequence';
  label: string;
  href?: string;
  detail: string;
  priority: number;
};

export function nextBestActionsForLead(args: {
  lane: LeadEngineLane;
  score: number;
  intentTier?: string;
  hasEmail: boolean;
  stage?: string;
  tags?: string[];
}): NextBestAction[] {
  const preset = getHuntLane(args.lane);
  const actions: NextBestAction[] = [];
  const hot = args.score >= 60 || args.intentTier === 'hot';

  if (hot) {
    actions.push({
      id: 'book',
      label: 'Book session',
      href: preset.book,
      detail: 'High score / hot intent — prioritize complimentary strategy session.',
      priority: 100,
    });
  }
  if (args.hasEmail) {
    actions.push({
      id: 'offer',
      label: 'Send offer pack (manual)',
      href: preset.offer,
      detail: 'Paste 3 outreach variants + pricing/one-sheets. No email blast infra.',
      priority: hot ? 80 : 90,
    });
  } else {
    actions.push({
      id: 'enrich',
      label: 'Enrich contact',
      detail: 'No email yet — find a contact or use phone if consented before outreach.',
      priority: 85,
    });
  }
  actions.push({
    id: 'sequence',
    label: 'Queue Day 0/2/5/7 nurture tasks',
    detail: 'Creates CRM admin tasks with copy packs (manual send).',
    priority: 70,
  });
  actions.push({
    id: 'nurture',
    label: 'Share free guide / one-sheets',
    href: preset.nurture,
    detail: `Soft educate via ${preset.freeGuide} and resources.`,
    priority: 60,
  });
  if ((args.tags ?? []).includes('objection')) {
    actions.push({
      id: 'objection',
      label: 'Use objection reply',
      detail: 'Pull lane objection library reply + CTA.',
      priority: 75,
    });
  }

  return actions.sort((a, b) => b.priority - a.priority);
}

export function buildOutreachVariants(args: {
  lane: LeadEngineLane;
  companyName?: string;
  website?: string;
}): { id: string; angle: string; subject: string; body: string }[] {
  const preset = getHuntLane(args.lane);
  const name = args.companyName?.trim() || 'there';
  const src = args.website ? `\n(Signal: ${args.website})` : '';
  const compliance = '\n\nResults vary · not legal advice · funding subject to underwriting\n— Finely Cred';

  return [
    {
      id: 'value',
      angle: 'Value-first',
      subject: `${name}: useful next step for ${preset.shortLabel}`,
      body: `Hi ${name},\n\nQuick note from Finely Cred — if ${preset.label.toLowerCase()} is on your radar, start with ${preset.freeGuide} then book a complimentary session when ready: ${preset.book}${src}${compliance}`,
    },
    {
      id: 'direct',
      angle: 'Direct book',
      subject: `${name}: complimentary strategy session?`,
      body: `Hi ${name},\n\nWe help partners sequence clear next steps in ${preset.shortLabel.toLowerCase()} (no guaranteed outcomes). Book here: ${preset.book}\nOffer overview: ${preset.offer}\nResources: ${preset.nurture}${src}${compliance}`,
    },
    {
      id: 'soft',
      angle: 'Soft nurture',
      subject: `${name}: one-sheets / free guide (no pressure)`,
      body: `Hi ${name},\n\nSharing educational resources only — ${preset.nurture} and ${preset.freeGuide}. If a short call helps later: ${preset.book}${src}${compliance}`,
    },
  ];
}

export function channelPlanForLane(lane: LeadEngineLane): string[] {
  const base = [
    'Live Lead Engine hunt (Serper) → CRM lead-engine tags',
    'Manual outreach pack (email/SMS) — no blast',
    'CRM nurture tasks Day 0/2/5/7',
    'Book session CTA → /consultation',
  ];
  if (lane === 'agency_affiliates') {
    return [...base, 'Affiliate hub + compliant promo copy', 'One-sheets for partner-facing education'];
  }
  if (lane === 'debt') {
    return [...base, 'Free debt guide first', 'Validation-first talk track (educational)'];
  }
  if (lane === 'business_credit' || lane === 'funded_business' || lane === 'local_service') {
    return [...base, 'BC pricing tiers + one-sheets', 'Inquiry discipline talk track'];
  }
  return [...base, 'Free dispute guide + resources library'];
}

export function talkTracksForLane(lane: LeadEngineLane): string[] {
  const preset = getHuntLane(lane);
  return [
    `Open: "Saw a signal around ${preset.label.toLowerCase()} — happy to share a free resource or book a short session."`,
    'Qualify: goal · timeline · entity/status · pressure (lawsuit/collector/funding urgency).',
    'Educate: one clear process step (never guarantees).',
    `Close soft: book ${preset.book} or park on ${preset.freeGuide}.`,
  ];
}
