import type { SovereignChannelId, SovereignLeadCaptureRoute, SovereignMarketingAssetPlan, SovereignGeoCell } from './types';

export type SovereignChannelCapability = {
  id: SovereignChannelId;
  name: string;
  purpose: string;
  strongestFor: string[];
  contentTypes: string[];
  requiredSetup: string[];
  riskNotes: string[];
  ownerAgentIds: string[];
  metrics: string[];
};

export const channelCapabilities: SovereignChannelCapability[] = [
  {
    id: 'meta',
    name: 'Meta Growth Cell',
    purpose: 'Retarget warm audiences, run local lead forms, and promote the best proven creative.',
    strongestFor: ['retargeting', 'instant forms', 'local awareness', 'lookalike testing after enough leads'],
    contentTypes: ['short video', 'lead form ad', 'story ad', 'retargeting carousel'],
    requiredSetup: ['Meta Business Manager', 'Pixel or Conversion API', 'ad account', 'page/IG connection'],
    riskNotes: ['No exaggerated credit outcomes', 'Avoid personal attribute targeting copy', 'Use clear disclaimers'],
    ownerAgentIds: ['social-commander', 'paid-micro-operator', 'velvet-hammer'],
    metrics: ['CPL', 'lead form completion rate', 'qualified rate', 'appointment rate'],
  },
  {
    id: 'instagram',
    name: 'Instagram Reels and Stories',
    purpose: 'Create human-feeling educational content with tracked CTAs and premium visual consistency.',
    strongestFor: ['short-form trust', 'credit education', 'business owner hooks', 'recruiting visibility'],
    contentTypes: ['reel', 'story sequence', 'carousel', 'DM-safe reply draft'],
    requiredSetup: ['IG business account', 'Meta connection', 'approved posting workflow'],
    riskNotes: ['Do not imply guaranteed results', 'Avoid before/after score promises'],
    ownerAgentIds: ['social-commander', 'media-alchemist', 'hook-mutator'],
    metrics: ['watch time', 'profile clicks', 'link clicks', 'DM intent'],
  },
  {
    id: 'tiktok',
    name: 'TikTok Short-Form Intelligence',
    purpose: 'Test high-variety hooks and education-first short videos that route to lead magnets.',
    strongestFor: ['hook testing', 'education clips', 'local trend adaptation'],
    contentTypes: ['short video', 'creator brief', 'caption bank', 'comment reply draft'],
    requiredSetup: ['TikTok business account', 'posting approval workflow', 'tracked link'],
    riskNotes: ['Keep financial claims conservative', 'Do not present legal advice'],
    ownerAgentIds: ['social-commander', 'media-alchemist', 'velvet-hammer'],
    metrics: ['3-second hold', 'completion rate', 'saves', 'tracked clicks'],
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts Authority',
    purpose: 'Turn FAQs, myths, and local credit/funding education into durable short videos.',
    strongestFor: ['evergreen education', 'authority', 'search-adjacent discovery'],
    contentTypes: ['shorts script', 'voiceover brief', 'thumbnail prompt', 'description with link'],
    requiredSetup: ['YouTube channel', 'upload workflow', 'link tracking'],
    riskNotes: ['Disclaim educational content', 'Avoid legal/financial guarantees'],
    ownerAgentIds: ['media-alchemist', 'content-director', 'pr-sentinel'],
    metrics: ['views', 'retention', 'clicks', 'subscribers', 'lead source'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn B2B Authority',
    purpose: 'Recruit partners, business owners, and local professionals with authority posts and outreach drafts.',
    strongestFor: ['B2B partners', 'agency recruiting', 'business credit clients', 'PR credibility'],
    contentTypes: ['authority post', 'partner pitch', 'comment draft', 'case-study style post'],
    requiredSetup: ['LinkedIn account/page', 'approval workflow', 'safe outreach rules'],
    riskNotes: ['No scraped mass outreach', 'Keep claims business-safe'],
    ownerAgentIds: ['partner-wrangler', 'pr-sentinel', 'velvet-hammer'],
    metrics: ['profile visits', 'partner replies', 'booked partner calls'],
  },
  {
    id: 'seo',
    name: 'Geo SEO Pages',
    purpose: 'Create local pages that capture inbound demand and route to the right funnel.',
    strongestFor: ['city landing pages', 'lead magnet downloads', 'local authority'],
    contentTypes: ['city page', 'FAQ page', 'guide page', 'schema brief'],
    requiredSetup: ['routing', 'sitemap', 'tracked CTA links'],
    riskNotes: ['Avoid doorway spam', 'Each page needs unique local value'],
    ownerAgentIds: ['seo-sentinel', 'geo-commander', 'capture-architect'],
    metrics: ['impressions', 'clicks', 'form starts', 'qualified leads'],
  },
  {
    id: 'email',
    name: 'Email Nurture',
    purpose: 'Move consented leads through education, reminder, objection, and booking flows.',
    strongestFor: ['lead magnet follow-up', 'reactivation', 'partner activation', 'appointment prep'],
    contentTypes: ['email sequence', 'one-off campaign', 'booking reminder', 'newsletter'],
    requiredSetup: ['Resend or SendGrid', 'verified domain', 'unsubscribe path', 'consent status'],
    riskNotes: ['CAN-SPAM compliance required', 'No high-risk claims'],
    ownerAgentIds: ['liora-lifecycle', 'velvet-hammer', 'capture-architect'],
    metrics: ['open rate', 'click rate', 'reply rate', 'booking rate', 'unsubscribe rate'],
  },
  {
    id: 'sms',
    name: 'SMS Concierge',
    purpose: 'Send concise consent-based reminders and reactivation messages.',
    strongestFor: ['appointment reminders', 'lead magnet follow-up', 'reactivation with prior consent'],
    contentTypes: ['SMS draft', 'two-way reply prompt', 'reminder', 'confirmation'],
    requiredSetup: ['Twilio', 'consent proof', 'STOP handling'],
    riskNotes: ['TCPA consent required', 'Do not cold text unknown leads'],
    ownerAgentIds: ['liora-lifecycle', 'appointment-architect', 'velvet-hammer'],
    metrics: ['reply rate', 'booking rate', 'opt-out rate'],
  },
  {
    id: 'partners',
    name: 'Partner Referral Loop',
    purpose: 'Activate affiliates, agencies, credit specialists, and local partners to produce referrals.',
    strongestFor: ['qualified referrals', 'local trust', 'role recruiting'],
    contentTypes: ['partner kit', 'referral link', 'activation email', 'leaderboard brief'],
    requiredSetup: ['partner tracking links', 'payout rules', 'onboarding flow'],
    riskNotes: ['Clear compensation terms', 'No misleading income promises'],
    ownerAgentIds: ['partner-wrangler', 'revenue-captain', 'velvet-hammer'],
    metrics: ['partner signups', 'active partners', 'referred leads', 'converted referrals'],
  },
  {
    id: 'pr',
    name: 'PR Authority Engine',
    purpose: 'Build credible external authority with local angles, interviews, and educational leadership.',
    strongestFor: ['trust', 'brand authority', 'local news', 'expert positioning'],
    contentTypes: ['pitch', 'talking points', 'interview prep', 'press recap'],
    requiredSetup: ['media list', 'approved bio', 'safe claims sheet'],
    riskNotes: ['Do not imply certification or outcomes that are not documented'],
    ownerAgentIds: ['pr-sentinel', 'cmo-prime', 'velvet-hammer'],
    metrics: ['pitches sent', 'responses', 'interviews', 'authority assets'],
  },
];

export const defaultLeadCaptureRoutes: SovereignLeadCaptureRoute[] = [
  {
    id: 'route-business-credit-guide',
    name: 'Business Credit E-Guide Route',
    offer: 'Business Credit E-Guide',
    audience: 'business owners who need profile readiness before funding',
    sourceChannels: ['meta', 'instagram', 'tiktok', 'seo', 'email'],
    shortLinkSlug: 'bc-guide',
    destinationPath: '/l/business-credit/guide',
    conversationPrompt: 'Ask what stage their business is in, then route to guide, checklist, or consultation prep.',
    ownerAgentIds: ['capture-architect', 'geo-commander', 'liora-lifecycle'],
    requiredFields: ['name', 'email', 'phone_optional', 'business_stage', 'city'],
    followUpSequence: 'business_credit_guide_to_consultation',
    complianceNotes: ['No funding guarantee', 'Education-first', 'Explain readiness depends on profile and documentation'],
    intelligenceScore: 92,
  },
  {
    id: 'route-tradeline-guide',
    name: 'Tradeline Education Guide Route',
    offer: 'Tradeline Education Guide',
    audience: 'consumers trying to understand authorized users and credit education safely',
    sourceChannels: ['instagram', 'tiktok', 'youtube', 'seo', 'email'],
    shortLinkSlug: 'tradeline-guide',
    destinationPath: '/l/tradelines/guide',
    conversationPrompt: 'Clarify education vs promise. Ask their goal and route to safe consultation or resource.',
    ownerAgentIds: ['capture-architect', 'velvet-hammer', 'liora-lifecycle'],
    requiredFields: ['name', 'email', 'phone_optional', 'credit_goal', 'consent'],
    followUpSequence: 'tradeline_education_safe_nurture',
    complianceNotes: ['No score increase promises', 'No guarantee language', 'No advice to misrepresent credit profile'],
    intelligenceScore: 88,
  },
  {
    id: 'route-credit-repair-guide',
    name: 'Credit Repair Readiness Guide Route',
    offer: 'Credit Repair Readiness Guide',
    audience: 'people who want to understand credit report review and dispute readiness',
    sourceChannels: ['meta', 'instagram', 'seo', 'sms', 'email'],
    shortLinkSlug: 'repair-guide',
    destinationPath: '/l/personal-credit/guide',
    conversationPrompt: 'Ask if they have recent reports, then route to evidence checklist or consultation.',
    ownerAgentIds: ['capture-architect', 'liora-lifecycle', 'appointment-architect'],
    requiredFields: ['name', 'email', 'phone_optional', 'report_status', 'consent'],
    followUpSequence: 'credit_restore_guide_to_booking',
    complianceNotes: ['No deletion guarantees', 'No outcome promises', 'Results depend on profile and documentation'],
    intelligenceScore: 90,
  },
  {
    id: 'route-credit-specialist-career',
    name: 'Credit Specialist Career Route',
    offer: 'Credit Specialist Career Path',
    audience: 'people interested in credit specialist roles, remote sales, or financial education careers',
    sourceChannels: ['linkedin', 'instagram', 'tiktok', 'partners', 'email'],
    shortLinkSlug: 'credit-specialist',
    destinationPath: '/l/careers/credit-specialist',
    conversationPrompt: 'Ask about sales comfort, availability, and training interest. Route to application or info session.',
    ownerAgentIds: ['partner-wrangler', 'appointment-architect', 'revenue-captain'],
    requiredFields: ['name', 'email', 'phone', 'experience', 'availability'],
    followUpSequence: 'credit_specialist_recruiting_sequence',
    complianceNotes: ['No income promises', 'Explain role requirements and performance-based nature'],
    intelligenceScore: 91,
  },
  {
    id: 'route-agency-affiliate',
    name: 'Agency and Affiliate Growth Route',
    offer: 'Partner/Affiliate Growth Kit',
    audience: 'agencies, creators, finance professionals, and referral partners',
    sourceChannels: ['linkedin', 'partners', 'email', 'pr', 'meta'],
    shortLinkSlug: 'partner-kit',
    destinationPath: '/l/partners/growth-kit',
    conversationPrompt: 'Ask their audience, referral fit, and desired partner model.',
    ownerAgentIds: ['partner-wrangler', 'cmo-prime', 'liora-lifecycle'],
    requiredFields: ['name', 'email', 'phone_optional', 'audience_type', 'partner_type'],
    followUpSequence: 'partner_activation_sequence',
    complianceNotes: ['Transparent compensation terms', 'No misleading claims about approvals or earnings'],
    intelligenceScore: 89,
  },
  {
    id: 'route-funding-readiness',
    name: 'Funding Readiness Route',
    offer: 'Funding Readiness Checklist',
    audience: 'business owners exploring funding but not ready for random applications',
    sourceChannels: ['google', 'linkedin', 'seo', 'meta', 'email'],
    shortLinkSlug: 'funding-ready',
    destinationPath: '/l/funding/readiness',
    conversationPrompt: 'Ask revenue stage, time in business, documentation status, and funding use case.',
    ownerAgentIds: ['capture-architect', 'revenue-captain', 'appointment-architect'],
    requiredFields: ['name', 'email', 'phone', 'business_age', 'monthly_revenue_range', 'funding_goal'],
    followUpSequence: 'funding_readiness_to_call',
    complianceNotes: ['No approval guarantee', 'Eligibility depends on lender criteria and documentation'],
    intelligenceScore: 93,
  },
];

export const defaultGeoCells: SovereignGeoCell[] = [
  {
    id: 'geo-dallas', city: 'Dallas', state: 'TX', priority: 'critical',
    focusOffers: ['Business Credit E-Guide', 'Credit Specialist Career Path', 'Funding Readiness Checklist'],
    sourceMix: ['meta', 'seo', 'instagram', 'partners', 'email'],
    leadTargetOvernight: 14, readinessScore: 84,
    blockers: ['Needs final tracked short links on two guide pages'],
    assignedAgentIds: ['geo-commander', 'capture-architect', 'scout-supreme'],
    nextMoves: ['Launch Dallas guide route', 'Build three Dallas reels', 'Activate partner micro-list'],
  },
  {
    id: 'geo-houston', city: 'Houston', state: 'TX', priority: 'high',
    focusOffers: ['Funding Readiness Checklist', 'Business Credit E-Guide', 'Agency Partner Kit'],
    sourceMix: ['linkedin', 'meta', 'seo', 'pr', 'partners'],
    leadTargetOvernight: 11, readinessScore: 78,
    blockers: ['Funding page needs stronger proof and booking CTA'],
    assignedAgentIds: ['geo-commander', 'revenue-captain', 'pr-sentinel'],
    nextMoves: ['Local business funding angle', 'LinkedIn B2B post batch', 'Funding readiness short link'],
  },
  {
    id: 'geo-atlanta', city: 'Atlanta', state: 'GA', priority: 'high',
    focusOffers: ['Credit Specialist Career Path', 'Partner/Affiliate Growth Kit', 'Credit Repair Readiness Guide'],
    sourceMix: ['instagram', 'tiktok', 'partners', 'seo', 'email'],
    leadTargetOvernight: 10, readinessScore: 81,
    blockers: ['Recruiting page needs role clarity and no-income-promise language'],
    assignedAgentIds: ['partner-wrangler', 'social-commander', 'velvet-hammer'],
    nextMoves: ['Recruiting carousel', 'Career info session link', 'Affiliate activation email'],
  },
  {
    id: 'geo-phoenix', city: 'Phoenix', state: 'AZ', priority: 'normal',
    focusOffers: ['Tradeline Education Guide', 'Credit Repair Readiness Guide', 'Consultation Prep'],
    sourceMix: ['seo', 'youtube', 'instagram', 'email'],
    leadTargetOvernight: 8, readinessScore: 72,
    blockers: ['Needs city-specific guide page copy'],
    assignedAgentIds: ['seo-sentinel', 'media-alchemist', 'liora-lifecycle'],
    nextMoves: ['Build Phoenix education video briefs', 'Publish safe tradeline FAQ page', 'Route guide leads to nurture'],
  },
  {
    id: 'geo-charlotte', city: 'Charlotte', state: 'NC', priority: 'normal',
    focusOffers: ['Business Credit E-Guide', 'Funding Readiness Checklist', 'PR Authority'],
    sourceMix: ['linkedin', 'seo', 'pr', 'meta'],
    leadTargetOvernight: 7, readinessScore: 75,
    blockers: ['Need local authority angle and partner list'],
    assignedAgentIds: ['pr-sentinel', 'geo-commander', 'partner-wrangler'],
    nextMoves: ['Charlotte business owner angle', 'Local partner list', 'LinkedIn authority post'],
  },
];

export function buildDefaultMediaPlans(): SovereignMarketingAssetPlan[] {
  const offers = defaultLeadCaptureRoutes;
  const plans: SovereignMarketingAssetPlan[] = [];
  for (const route of offers) {
    plans.push({
      id: `video-${route.id}`,
      mediaType: 'short_video',
      channel: route.sourceChannels.includes('tiktok') ? 'tiktok' : 'instagram',
      title: `${route.offer} - 3-video short-form pack`,
      angle: `Turn ${route.audience} into a simple educational reason to click ${route.shortLinkSlug}.`,
      hookBank: [
        `Before you chase ${route.offer.toLowerCase()}, check this first.`,
        `Most people skip the step that makes this work cleaner.`,
        `This is the calm way to understand ${route.offer.toLowerCase()}.`,
        `If you are in ${route.audience.split(' ')[0]} mode, this guide saves guessing.`,
      ],
      storyBeats: ['Problem in plain English', 'Why random action creates waste', 'Simple checklist', 'Invite to guide or consultation'],
      cta: `Get the guide: /go/${route.shortLinkSlug}`,
      videoDirection: 'Premium dark/gold visuals, calm confident voice, one clear visual checklist, no guaranteed outcome language.',
      voiceDirection: 'Warm, serious, helpful, low-hype, authoritative. 145 words per minute. End with one clear CTA.',
      ownerAgentIds: ['media-alchemist', 'social-commander', 'velvet-hammer'],
      approvalLevel: 3,
      complianceFlags: route.complianceNotes,
    });
    plans.push({
      id: `email-${route.id}`,
      mediaType: 'email',
      channel: 'email',
      title: `${route.offer} - guide delivery and booking bridge`,
      angle: `Deliver the resource, then move the reader to the cleanest next step without pressure.`,
      hookBank: [`Your ${route.offer} is ready`, `Here is the checklist I would start with`, `Use this before guessing your next step`],
      storyBeats: ['Resource delivery', 'What to look for first', 'Common mistake', 'Invite to reply or book'],
      cta: `Open the guide: /go/${route.shortLinkSlug}`,
      ownerAgentIds: ['liora-lifecycle', 'capture-architect', 'velvet-hammer'],
      approvalLevel: 2,
      complianceFlags: route.complianceNotes,
    });
  }
  return plans;
}

export function scoreRouteReadiness(route: SovereignLeadCaptureRoute): number {
  let score = route.intelligenceScore;
  if (route.requiredFields.length < 3) score -= 8;
  if (!route.shortLinkSlug) score -= 20;
  if (!route.destinationPath.startsWith('/l/')) score -= 7;
  if (!route.followUpSequence) score -= 10;
  if (route.complianceNotes.length < 2) score -= 10;
  return Math.max(0, Math.min(100, score));
}
