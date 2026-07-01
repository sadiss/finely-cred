import { CmoChannelModel, CmoForecastAction, CmoLeadForecast } from '../../domain/cmoPhase5';

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const DEFAULT_ACTIONS: Record<string, { action: string; dailyVolume: number; expectedLeads: number; owner: CmoForecastAction['owner'] }> = {
  shorts: { action: 'Publish Shorts/Reels/TikTok clips with direct CTA and pinned comment.', dailyVolume: 9, expectedLeads: 45, owner: 'cmo' },
  affiliate: { action: 'Recruit, activate, and follow up with affiliate/partner prospects.', dailyVolume: 80, expectedLeads: 40, owner: 'automation' },
  linkedin: { action: 'Run founder authority posts, B2B outreach, and interview hooks.', dailyVolume: 35, expectedLeads: 25, owner: 'team' },
  email: { action: 'Send segmented value + offer sequence to warm leads.', dailyVolume: 500, expectedLeads: 30, owner: 'automation' },
  sms: { action: 'Send consent-based appointment and reactivation nudges.', dailyVolume: 150, expectedLeads: 20, owner: 'automation' },
  press: { action: 'Pitch interviews, podcasts, and local/niche media authority angles.', dailyVolume: 20, expectedLeads: 15, owner: 'cmo' },
  partner: { action: 'Open partner conversations with real estate, trucking, funding, tax, and startup groups.', dailyVolume: 30, expectedLeads: 25, owner: 'team' },
};

export function buildCmoLeadForecast(models: CmoChannelModel[], targetDailyLeads = 200): CmoLeadForecast {
  const ranked = [...models].sort((a, b) => {
    const aPower = a.leads + a.qualifiedLeads * 2 + a.bookedCalls * 4 + a.sales * 8;
    const bPower = b.leads + b.qualifiedLeads * 2 + b.bookedCalls * 4 + b.sales * 8;
    return bPower - aPower;
  });
  const top = ranked.filter((model) => model.decision !== 'kill').slice(0, 7);
  const requiredActions: CmoForecastAction[] = top.map((model) => {
    const fallback = DEFAULT_ACTIONS[model.channel] ?? { action: `Run focused ${model.channel} growth actions.`, dailyVolume: 20, expectedLeads: 10, owner: 'cmo' as const };
    const multiplier = model.decision === 'scale' ? 1.25 : model.decision === 'fix' ? 0.85 : 1;
    return {
      channel: model.channel,
      action: fallback.action,
      dailyVolume: Math.ceil(fallback.dailyVolume * multiplier),
      expectedLeads: Math.ceil(fallback.expectedLeads * multiplier),
      owner: fallback.owner,
    };
  });
  const projectedDailyLeads = requiredActions.reduce((total, action) => total + action.expectedLeads, 0);
  const projectedQualifiedLeads = Math.round(projectedDailyLeads * 0.32);
  const projectedBookedCalls = Math.round(projectedQualifiedLeads * 0.28);
  const projectedRevenue = Math.round(projectedBookedCalls * 350);
  const bottlenecks: string[] = [];
  if (projectedDailyLeads < targetDailyLeads) bottlenecks.push('Lead math is short. Increase channel volume, add affiliates, or improve page conversion.');
  if (!requiredActions.some((action) => action.channel === 'affiliate')) bottlenecks.push('Affiliate loop is missing from today’s plan.');
  if (!requiredActions.some((action) => ['shorts', 'reels', 'tiktok'].includes(action.channel))) bottlenecks.push('Short-form video loop is missing from today’s plan.');

  return {
    id: id('forecast'),
    targetDailyLeads,
    projectedDailyLeads,
    projectedQualifiedLeads,
    projectedBookedCalls,
    projectedRevenue,
    requiredActions,
    bottlenecks,
    confidence: Math.min(0.92, Math.max(0.35, top.reduce((total, model) => total + model.confidence, 0) / Math.max(top.length, 1))),
    generatedAt: new Date().toISOString(),
  };
}
