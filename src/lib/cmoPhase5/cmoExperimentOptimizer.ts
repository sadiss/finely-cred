import { CmoGrowthEvent, CmoScaleExperiment } from '../../domain/cmoPhase5';

function metricToEventType(metric: CmoScaleExperiment['metric']): CmoGrowthEvent['eventType'] {
  switch (metric) {
    case 'leads':
      return 'lead';
    case 'qualified_leads':
      return 'qualified_lead';
    case 'booked_calls':
      return 'booked_call';
    case 'sales':
    case 'revenue':
      return 'sale';
    default:
      return 'lead';
  }
}

export function decideCmoExperimentWinner(experiment: CmoScaleExperiment, events: CmoGrowthEvent[]): CmoScaleExperiment {
  const eventType = metricToEventType(experiment.metric);
  const a = events.filter((event) => event.campaignId === `${experiment.id}:A` && event.eventType === eventType).length;
  const b = events.filter((event) => event.campaignId === `${experiment.id}:B` && event.eventType === eventType).length;
  const total = a + b;
  if (total < experiment.minSampleSize) {
    return { ...experiment, status: 'running', notes: [...experiment.notes, `Needs more sample: ${total}/${experiment.minSampleSize}.`], updatedAt: new Date().toISOString() };
  }
  if (Math.abs(a - b) < Math.max(2, total * 0.1)) {
    return { ...experiment, status: 'inconclusive', notes: [...experiment.notes, `No strong winner: A ${a}, B ${b}.`], updatedAt: new Date().toISOString() };
  }
  return { ...experiment, status: 'winner_found', winner: a > b ? 'A' : 'B', notes: [...experiment.notes, `Winner selected from ${total} events.`], updatedAt: new Date().toISOString() };
}
