import type { CmoExperiment, CmoExperimentVariant, CmoGrowthChannel } from '../../domain/cmoPhase3';
import { makeCmoId, saveCmoExperiment, updateCmoChannelModel } from '../../data/cmoPhase3Repo';

const stamp = () => new Date().toISOString();

export function createHookExperiment(input: {
  name: string;
  campaignId?: string;
  channel: CmoGrowthChannel;
  audience: string;
  offer: string;
  hooks: string[];
}): CmoExperiment {
  const now = stamp();
  const variants: CmoExperimentVariant[] = input.hooks.slice(0, 8).map((hook, index) => ({
    id: makeCmoId('variant'),
    label: `Variant ${String.fromCharCode(65 + index)}`,
    hook,
    angle: inferAngle(hook),
    cta: 'Book the readiness review',
    channel: input.channel,
    impressions: 0,
    clicks: 0,
    leads: 0,
    bookedCalls: 0,
    revenue: 0,
    score150: scoreVariantText(hook),
  }));
  return saveCmoExperiment({
    id: makeCmoId('experiment'),
    name: input.name,
    status: 'draft',
    campaignId: input.campaignId,
    hypothesis: `For ${input.audience}, one of these hooks will make ${input.offer} feel urgent, credible, and easy to act on.`,
    successMetric: 'leads',
    variants,
    recommendation: 'Start with the highest-scoring two hooks and one wild-card hook. Do not marry a weak hook. Date the data.',
    createdAt: now,
    updatedAt: now,
  });
}

export function updateExperimentResults(experiment: CmoExperiment, results: Array<Partial<CmoExperimentVariant> & { id: string }>): CmoExperiment {
  const variants = experiment.variants.map((variant) => {
    const patch = results.find((item) => item.id === variant.id);
    return patch ? { ...variant, ...patch } : variant;
  });
  variants.forEach((variant) => {
    const nonLeads = Math.max(0, variant.clicks - variant.leads);
    updateCmoChannelModel(variant.channel, variant.leads, nonLeads, variant.revenue && variant.leads ? variant.revenue / variant.leads : undefined);
  });
  const winner = pickExperimentWinner(variants);
  return saveCmoExperiment({
    ...experiment,
    variants,
    status: winner ? 'winner_found' : experiment.status === 'draft' ? 'running' : 'inconclusive',
    winnerVariantId: winner?.id,
    recommendation: winner
      ? `Scale ${winner.label}: "${winner.hook}". It is the current winner; give it more distribution and build 3 sibling variants.`
      : 'Keep testing. The data is not loud enough yet.',
    updatedAt: stamp(),
  });
}

export function pickExperimentWinner(variants: CmoExperimentVariant[]): CmoExperimentVariant | undefined {
  const ranked = variants
    .map((variant) => {
      const leadRate = variant.clicks ? variant.leads / variant.clicks : 0;
      const bookedRate = variant.leads ? variant.bookedCalls / variant.leads : 0;
      const revenueSignal = variant.revenue / 1000;
      const confidence = variant.impressions >= 100 || variant.clicks >= 20 ? 1 : 0.45;
      return { variant, score: confidence * (leadRate * 70 + bookedRate * 40 + revenueSignal + variant.score150 / 30) };
    })
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < 3) return undefined;
  return ranked[0].variant;
}

function inferAngle(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('funding')) return 'Funding readiness';
  if (lower.includes('credit')) return 'Credit comeback';
  if (lower.includes('business')) return 'Business owner urgency';
  if (lower.includes('mistake') || lower.includes('wrong')) return 'Mistake avoidance';
  if (lower.includes('secret') || lower.includes('nobody')) return 'Curiosity';
  return 'Direct response education';
}

function scoreVariantText(text: string): number {
  let score = 70;
  const lower = text.toLowerCase();
  ['you', 'mistake', 'stop', 'before', 'roadmap', 'ready', 'business', 'funding', 'credit', 'book'].forEach((word) => {
    if (lower.includes(word)) score += 6;
  });
  ['guaranteed', 'instant approval', 'wipe', 'hack'].forEach((word) => {
    if (lower.includes(word)) score -= 20;
  });
  if (text.length < 35) score += 8;
  if (text.length > 120) score -= 8;
  return Math.max(0, Math.min(150, score));
}
