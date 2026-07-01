import type { CmoChannel, CmoEvent, CmoEventType } from '../../domain/cmoPhase2';
import { addCmoEvent, listCmoEvents } from '../../data/cmoPhase2Repo';
import { trainCmoModelFromEvents } from './cmoLearningEngine';

type Listener = (event: CmoEvent) => void;
const listeners = new Set<Listener>();

export function onCmoEvent(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitCmoEvent(args: Omit<CmoEvent, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): CmoEvent {
  const event = addCmoEvent(args);
  for (const listener of Array.from(listeners)) {
    try {
      listener(event);
    } catch {
      // keep the bus resilient; one bad listener should not break growth telemetry
    }
  }
  try {
    if (['lead_created', 'lead_qualified', 'call_booked', 'deal_closed', 'revenue_recorded', 'compliance_flagged'].includes(event.type)) {
      trainCmoModelFromEvents(listCmoEvents(5000));
    }
  } catch {
    // best-effort local training
  }
  return event;
}

export function emitLeadEvent(args: { type?: CmoEventType; leadId?: string; prospectId?: string; campaignId?: string; channel?: CmoChannel; value?: number; meta?: Record<string, unknown> }) {
  return emitCmoEvent({
    type: args.type ?? 'lead_created',
    source: 'crm',
    leadId: args.leadId,
    prospectId: args.prospectId,
    campaignId: args.campaignId,
    channel: args.channel,
    value: args.value,
    meta: args.meta,
  });
}

export function emitCommsEvent(args: { type?: CmoEventType; campaignId?: string; prospectId?: string; partnerId?: string; channel?: CmoChannel; assetId?: string; meta?: Record<string, unknown> }) {
  return emitCmoEvent({
    type: args.type ?? 'outreach_sent',
    source: 'comms',
    campaignId: args.campaignId,
    prospectId: args.prospectId,
    partnerId: args.partnerId,
    channel: args.channel,
    assetId: args.assetId,
    meta: args.meta,
  });
}

export function emitMediaEvent(args: { type?: CmoEventType; campaignId?: string; assetId?: string; channel?: CmoChannel; meta?: Record<string, unknown> }) {
  return emitCmoEvent({
    type: args.type ?? 'asset_created',
    source: 'media',
    campaignId: args.campaignId,
    assetId: args.assetId,
    channel: args.channel,
    meta: args.meta,
  });
}

export function emitSiteWatchEvent(args: { pagePath: string; score?: number; labels?: string[]; meta?: Record<string, unknown> }) {
  return emitCmoEvent({
    type: 'site_changed',
    source: 'site_watch',
    pagePath: args.pagePath,
    score: args.score,
    labels: args.labels,
    meta: args.meta,
  });
}
