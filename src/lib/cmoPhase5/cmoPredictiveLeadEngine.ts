import { CmoChannelModel, CmoGrowthEvent, CmoScaleChannel } from '../../domain/cmoPhase5';

const CHANNELS: CmoScaleChannel[] = ['shorts', 'reels', 'tiktok', 'linkedin', 'email', 'sms', 'affiliate', 'press', 'seo', 'webinar', 'partner', 'paid'];

function count(events: CmoGrowthEvent[], channel: CmoScaleChannel, type: CmoGrowthEvent['eventType']): number {
  return events.filter((event) => event.channel === channel && event.eventType === type).length;
}

function sum(events: CmoGrowthEvent[], channel: CmoScaleChannel, type: CmoGrowthEvent['eventType']): number {
  return events
    .filter((event) => event.channel === channel && event.eventType === type)
    .reduce((total, event) => total + (event.value ?? 0), 0);
}

function safeRate(numerator: number, denominator: number): number {
  return denominator <= 0 ? 0 : Number((numerator / denominator).toFixed(4));
}

export function buildCmoChannelModels(events: CmoGrowthEvent[]): CmoChannelModel[] {
  const now = new Date().toISOString();
  return CHANNELS.map((channel) => {
    const impressions = count(events, channel, 'impression');
    const clicks = count(events, channel, 'click');
    const leads = count(events, channel, 'lead');
    const qualifiedLeads = count(events, channel, 'qualified_lead');
    const bookedCalls = count(events, channel, 'booked_call');
    const sales = count(events, channel, 'sale');
    const revenue = sum(events, channel, 'sale');
    const cost = events.filter((event) => event.channel === channel).reduce((total, event) => total + Number(event.metadata?.cost ?? 0), 0);
    const sample = impressions + clicks + leads + qualifiedLeads + bookedCalls + sales;
    const leadRate = safeRate(leads, Math.max(clicks, impressions || 1));
    const qualifiedRate = safeRate(qualifiedLeads, Math.max(leads, 1));
    const bookingRate = safeRate(bookedCalls, Math.max(qualifiedLeads || leads, 1));
    const closeRate = safeRate(sales, Math.max(bookedCalls, 1));
    const revenuePerLead = safeRate(revenue, Math.max(leads, 1));
    const costPerLead = cost > 0 ? safeRate(cost, Math.max(leads, 1)) : 0;
    const confidence = Math.min(1, sample / 250);
    const decision = leads === 0 && sample > 20 ? 'fix' : confidence < 0.25 ? 'test_more' : revenuePerLead > costPerLead * 3 && leads > 2 ? 'scale' : leads > 0 ? 'hold' : 'test_more';
    const reason = decision === 'scale'
      ? 'Channel is showing leverage. Scale while compliance and lead quality stay healthy.'
      : decision === 'fix'
        ? 'Traffic exists but lead capture is weak. Fix CTA, offer, page, or follow-up.'
        : decision === 'hold'
          ? 'Channel is working but needs more proof before aggressive scaling.'
          : 'Not enough evidence yet. Keep testing.';
    return { channel, impressions, clicks, leads, qualifiedLeads, bookedCalls, sales, revenue, cost, leadRate, qualifiedRate, bookingRate, closeRate, costPerLead, revenuePerLead, confidence, decision, reason, updatedAt: now };
  });
}

export function generateDemoCmoGrowthEvents(): CmoGrowthEvent[] {
  const now = new Date().toISOString();
  const events: CmoGrowthEvent[] = [];
  let id = 0;
  const seed = (channel: CmoScaleChannel, type: CmoGrowthEvent['eventType'], n: number, value = 0) => {
    for (let i = 0; i < n; i += 1) {
      events.push({ id: `demo_${id++}`, occurredAt: now, channel, eventType: type, value });
    }
  };
  seed('shorts', 'impression', 80); seed('shorts', 'click', 20); seed('shorts', 'lead', 12); seed('shorts', 'qualified_lead', 6); seed('shorts', 'booked_call', 3);
  seed('affiliate', 'impression', 40); seed('affiliate', 'click', 15); seed('affiliate', 'lead', 10); seed('affiliate', 'qualified_lead', 7); seed('affiliate', 'booked_call', 4); seed('affiliate', 'sale', 2, 2500);
  seed('linkedin', 'impression', 60); seed('linkedin', 'click', 12); seed('linkedin', 'lead', 5); seed('linkedin', 'qualified_lead', 3);
  seed('email', 'click', 35); seed('email', 'lead', 14); seed('email', 'qualified_lead', 6); seed('email', 'booked_call', 4);
  return events;
}
