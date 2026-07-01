import { CmoBudgetAllocation, CmoChannelModel } from '../../domain/cmoPhase5';

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function buildCmoBudgetAllocation(models: CmoChannelModel[], totalDailyBudget = 0): CmoBudgetAllocation {
  const useful = models.filter((model) => model.decision !== 'kill');
  const weighted = useful.map((model) => {
    const quality = model.leads + model.qualifiedLeads * 2 + model.bookedCalls * 3 + model.sales * 8 + Math.max(0, model.revenuePerLead - model.costPerLead);
    const weight = Math.max(1, quality) * (model.decision === 'scale' ? 1.8 : model.decision === 'fix' ? 0.6 : model.decision === 'test_more' ? 0.8 : 1);
    return { model, weight };
  });
  const totalWeight = weighted.reduce((total, item) => total + item.weight, 0) || 1;
  const allocations = weighted.slice(0, 8).map(({ model, weight }) => ({
    channel: model.channel,
    budget: Number(((weight / totalWeight) * totalDailyBudget).toFixed(2)),
    effortUnits: Math.ceil((weight / totalWeight) * 100),
    reason: model.reason,
    decision: model.decision,
  }));
  return {
    id: id('budget'),
    totalDailyBudget,
    allocations,
    guardrails: [
      'No budget increase above approved autonomy policy.',
      'No spend on campaigns with blocked compliance risk.',
      'Pause channels with weak lead quality even if vanity engagement looks good.',
      'Scale winners gradually; do not let the CMO gamble like it found a casino under the keyboard.',
    ],
    generatedAt: new Date().toISOString(),
  };
}
