import type { MicroBudgetPlan, OvernightCity } from '../../features/overnight50/types';

export function buildMicroBudgetPlan(args?: { totalBudgetCents?: number; cities?: OvernightCity[] }): MicroBudgetPlan {
  const total = args?.totalBudgetCents ?? 2500;
  const cities = args?.cities?.length ? args.cities : ['Dallas', 'Houston', 'Atlanta', 'Phoenix', 'Charlotte'];
  const primaryCity = cities[0] ?? 'Dallas';
  const cells = [
    { bucket: 'Meta retargeting only', channel: 'meta', city: primaryCity, amountCents: Math.round(total * 0.48), purpose: 'Higher-intent instant form retargeting, not cold broad spend.', expectedLeadsLow: 1, expectedLeadsHigh: 3, guardrail: 'Pause if CPL > $25 after statistically useful sample.' },
    { bucket: 'Google call-only local', channel: 'google_ads', city: primaryCity, amountCents: Math.round(total * 0.32), purpose: 'One to two exact-match local terms only.', expectedLeadsLow: 0, expectedLeadsHigh: 2, guardrail: 'Exact match only; no broad match creep.' },
    { bucket: 'Boost best organic post', channel: 'social_boost', city: primaryCity, amountCents: Math.round(total * 0.12), purpose: 'Boost proven creative after organic signal.', expectedLeadsLow: 0, expectedLeadsHigh: 1, guardrail: 'Only boost top quartile post.' },
    { bucket: 'API/intel reserve', channel: 'data', city: primaryCity, amountCents: total - Math.round(total * 0.48) - Math.round(total * 0.32) - Math.round(total * 0.12), purpose: 'Serper/news/places query reserve.', expectedLeadsLow: 0, expectedLeadsHigh: 0, guardrail: 'Never exceed daily API cap.' },
  ];
  return {
    totalBudgetCents: total,
    paidLeadEstimate: { low: 1, high: 5, explanation: '$25/day cannot honestly buy 50 leads by itself. Paid is a spark; free/owned/partner/revival does the heavy lifting.' },
    cells,
    freeLeadPlan: [
      { source: 'seo_inbound', targetLeads: 12, action: 'Publish localized guide/offer pages and route CTA attribution.', owner: 'SEO Sentinel' },
      { source: 'revival_conversions', targetLeads: 14, action: 'Revive consented cold leads with geo-windowed email/SMS.', owner: 'Revival Specialist' },
      { source: 'partner_refs', targetLeads: 8, action: 'Push micro-bounty referrals to affiliates/agents.', owner: 'Affiliate Wrangler' },
      { source: 'community_captures', targetLeads: 6, action: 'Draft helpful public replies for approval, never spam.', owner: 'Community Ghost' },
      { source: 'intel_nurture', targetLeads: 10, action: 'Enroll hot Lead Intel prospects into approved nurture.', owner: 'Night Owl Intel' },
    ],
    feasibilityWarnings: ['If overnight lead mix is below 50, add city pages, revive larger consented list, increase partner referrals, or fund more paid traffic. Do not fake numbers.'],
  };
}
