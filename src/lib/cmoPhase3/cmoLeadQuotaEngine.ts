import type { CmoGrowthChannel, CmoLeadQuota } from '../../domain/cmoPhase3';

const BASE_QUOTAS: Array<Omit<CmoLeadQuota, 'dailyLeadGoal'>> = [
  { channel: 'lead_intel', expectedQualifiedRate: 0.34, expectedBookingRate: 0.14, requiredDailyActions: 240, actionLabel: 'Lead Intel searches, enrichments, and CRM-ready saves', minimumAssetsNeeded: 3, riskNotes: ['Keep targeting narrow; broad searches create junk leads.'] },
  { channel: 'crm_reactivation', expectedQualifiedRate: 0.42, expectedBookingRate: 0.18, requiredDailyActions: 160, actionLabel: 'Warm lead reactivation touches', minimumAssetsNeeded: 4, riskNotes: ['Respect opt-out rules and prior contact history.'] },
  { channel: 'affiliate', expectedQualifiedRate: 0.38, expectedBookingRate: 0.2, requiredDailyActions: 80, actionLabel: 'Affiliate partner outreach and enablement', minimumAssetsNeeded: 5, riskNotes: ['Affiliates need clear rules and compliant claims.'] },
  { channel: 'partner_outreach', expectedQualifiedRate: 0.36, expectedBookingRate: 0.18, requiredDailyActions: 75, actionLabel: 'B2B partner introductions and follow-up', minimumAssetsNeeded: 4, riskNotes: ['Use personalized offers, not generic blasts.'] },
  { channel: 'youtube_shorts', expectedQualifiedRate: 0.22, expectedBookingRate: 0.08, requiredDailyActions: 6, actionLabel: 'Shorts with CTA and lead magnet path', minimumAssetsNeeded: 6, riskNotes: ['Need strong hook in first 2 seconds and clear CTA.'] },
  { channel: 'instagram_reels', expectedQualifiedRate: 0.2, expectedBookingRate: 0.07, requiredDailyActions: 5, actionLabel: 'Reels + story CTA + pinned comment', minimumAssetsNeeded: 5, riskNotes: ['Replies/comments need fast triage.'] },
  { channel: 'tiktok', expectedQualifiedRate: 0.18, expectedBookingRate: 0.06, requiredDailyActions: 5, actionLabel: 'TikTok education/proof content', minimumAssetsNeeded: 5, riskNotes: ['Avoid exaggerated financial claims.'] },
  { channel: 'linkedin', expectedQualifiedRate: 0.32, expectedBookingRate: 0.15, requiredDailyActions: 8, actionLabel: 'Authority posts and warm connection outreach', minimumAssetsNeeded: 4, riskNotes: ['Best for B2B, affiliates, and funding audience.'] },
  { channel: 'email', expectedQualifiedRate: 0.3, expectedBookingRate: 0.12, requiredDailyActions: 220, actionLabel: 'Segmented email sends and replies', minimumAssetsNeeded: 5, riskNotes: ['Must use opt-in/compliance checks.'] },
  { channel: 'sms', expectedQualifiedRate: 0.4, expectedBookingRate: 0.18, requiredDailyActions: 90, actionLabel: 'Permission-based SMS follow-up', minimumAssetsNeeded: 4, riskNotes: ['Use only proper consent.'] },
  { channel: 'press_pr', expectedQualifiedRate: 0.24, expectedBookingRate: 0.1, requiredDailyActions: 20, actionLabel: 'Press pitches and credibility placements', minimumAssetsNeeded: 3, riskNotes: ['PR is authority-heavy, not instant lead magic.'] },
  { channel: 'interviews_podcasts', expectedQualifiedRate: 0.28, expectedBookingRate: 0.12, requiredDailyActions: 25, actionLabel: 'Podcast/interview booking pitches', minimumAssetsNeeded: 3, riskNotes: ['Needs founder story and sharp topics.'] },
  { channel: 'webinar', expectedQualifiedRate: 0.45, expectedBookingRate: 0.22, requiredDailyActions: 1, actionLabel: 'Live or evergreen webinar promotion', minimumAssetsNeeded: 7, riskNotes: ['Needs reminder sequence and replay follow-up.'] },
  { channel: 'seo_content', expectedQualifiedRate: 0.25, expectedBookingRate: 0.08, requiredDailyActions: 2, actionLabel: 'Authority articles and landing pages', minimumAssetsNeeded: 2, riskNotes: ['Slow burn; pair with social distribution.'] },
  { channel: 'referral', expectedQualifiedRate: 0.5, expectedBookingRate: 0.28, requiredDailyActions: 40, actionLabel: 'Referral asks and proof-based follow-up', minimumAssetsNeeded: 3, riskNotes: ['Needs simple reward/thank-you system.'] },
];

export function buildTwoHundredLeadQuotaPlan(target = 200, allowedChannels?: CmoGrowthChannel[]): CmoLeadQuota[] {
  const filtered = allowedChannels?.length ? BASE_QUOTAS.filter((item) => allowedChannels.includes(item.channel)) : BASE_QUOTAS;
  const weights = new Map<CmoGrowthChannel, number>([
    ['lead_intel', 0.18],
    ['crm_reactivation', 0.12],
    ['affiliate', 0.12],
    ['partner_outreach', 0.1],
    ['youtube_shorts', 0.08],
    ['instagram_reels', 0.08],
    ['tiktok', 0.06],
    ['linkedin', 0.06],
    ['email', 0.08],
    ['sms', 0.05],
    ['press_pr', 0.025],
    ['interviews_podcasts', 0.025],
    ['webinar', 0.035],
    ['seo_content', 0.015],
    ['referral', 0.045],
  ]);
  const selectedWeight = filtered.reduce((sum, item) => sum + (weights.get(item.channel) ?? 0.03), 0) || 1;
  let assigned = 0;
  return filtered.map((item, index) => {
    const isLast = index === filtered.length - 1;
    const goal = isLast ? Math.max(0, target - assigned) : Math.max(1, Math.round(target * ((weights.get(item.channel) ?? 0.03) / selectedWeight)));
    assigned += goal;
    return { ...item, dailyLeadGoal: goal };
  }).filter((item) => item.dailyLeadGoal > 0);
}

export function summarizeLeadQuota(plan: CmoLeadQuota[]) {
  const totalLeads = plan.reduce((sum, item) => sum + item.dailyLeadGoal, 0);
  const qualified = plan.reduce((sum, item) => sum + item.dailyLeadGoal * item.expectedQualifiedRate, 0);
  const booked = plan.reduce((sum, item) => sum + item.dailyLeadGoal * item.expectedBookingRate, 0);
  return {
    totalLeads,
    projectedQualifiedLeads: Math.round(qualified),
    projectedBookedCalls: Math.round(booked),
    topChannels: [...plan].sort((a, b) => b.dailyLeadGoal - a.dailyLeadGoal).slice(0, 5),
  };
}
