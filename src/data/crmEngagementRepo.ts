import type { ProspectHeatEventType } from '../lib/prospectHeat';
import { resolveProspectHeat, type ProspectHeatResult } from '../lib/prospectHeat';
import { HEAT_VERSION, nextOutreachStage, stageFromHeatState, type ProspectOutreachStage } from '../lib/prospectOutreach';
import { isColdDirectoryProspect, isPublicOrganizationRoleInbox } from '../lib/coldDirectory';
import { getProspect, patchProspect } from './crmProspectsRepo';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { nowIso } from '../domain/crmProspects';

const KEY = 'finely.crm.engagement.v1';
const SERVER_TENANT_ID = 'finely_cred';

export type CrmEngagementEvent = {
  id: string;
  prospectId: string;
  eventType: ProspectHeatEventType;
  source?: string;
  campaignId?: string;
  materialId?: string;
  actor?: string;
  consentSnapshot?: Record<string, unknown>;
  dedupeKey: string;
  createdAt: string;
};

type Store = { events: CrmEngagementEvent[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { events: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listEngagementEvents(prospectId?: string): CrmEngagementEvent[] {
  const events = loadStore().events;
  const filtered = prospectId ? events.filter((e) => e.prospectId === prospectId) : events;
  return filtered.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function heatForProspect(prospectId: string): ProspectHeatResult | null {
  const prospect = getProspect(prospectId);
  if (!prospect) return null;
  const events = listEngagementEvents(prospectId).map((e) => e.eventType);
  const email = prospect.contact.emails?.[0];
  return resolveProspectHeat({
    isColdDirectory: isColdDirectoryProspect(prospect),
    events,
    publicOrgInbox: isPublicOrganizationRoleInbox(email).ok,
    hasWebsite: Boolean(prospect.company.website || prospect.company.domain),
    laneMatched: (prospect.tags ?? []).some((t) => /haitian|affiliate|specialist|jobs/i.test(t)),
    consent: prospect.emailMarketingAllowed === true || prospect.consentBasis === 'lead_capture_opt_in' || prospect.consentBasis === 'inbound_form_opt_in',
  });
}

function persistHeat(prospectId: string, heat: ProspectHeatResult, outreachStage: ProspectOutreachStage) {
  patchProspect(prospectId, {
    outreachStage,
    heatState: heat.state,
    heatSummary: {
      fit: heat.fit,
      intent: heat.intent,
      recency: heat.recency,
      total: heat.total,
      reasons: heat.reasons,
      version: HEAT_VERSION,
      allowedChannels: heat.allowedChannels,
      consent: heat.consent,
    },
    score: heat.total,
  });
}

function syncEventToSupabase(event: CrmEngagementEvent) {
  if (!isSupabaseConfigured) return;
  void supabase.from('crm_engagement_events').upsert(
    {
      id: event.id,
      tenant_id: SERVER_TENANT_ID,
      prospect_id: event.prospectId,
      event_type: event.eventType,
      source: event.source ?? null,
      campaign_id: event.campaignId ?? null,
      material_id: event.materialId ?? null,
      actor: event.actor ?? null,
      consent_snapshot: event.consentSnapshot ?? {},
      dedupe_key: event.dedupeKey,
      created_at: event.createdAt,
    },
    { onConflict: 'id' },
  );
}

export function recordEngagementEvent(args: {
  prospectId: string;
  eventType: ProspectHeatEventType;
  source?: string;
  campaignId?: string;
  materialId?: string;
  actor?: string;
  consentSnapshot?: Record<string, unknown>;
  dedupeKey?: string;
}): { recorded: boolean; duplicate: boolean; heat: ProspectHeatResult | null; outreachStage?: ProspectOutreachStage } {
  const prospect = getProspect(args.prospectId);
  if (!prospect) return { recorded: false, duplicate: false, heat: null };

  const dedupeKey =
    args.dedupeKey ??
    `${args.prospectId}:${args.eventType}:${args.campaignId ?? ''}:${args.materialId ?? ''}:${args.source ?? ''}`;
  const store = loadStore();
  if (store.events.some((e) => e.dedupeKey === dedupeKey)) {
    return { recorded: false, duplicate: true, heat: heatForProspect(args.prospectId), outreachStage: prospect.outreachStage };
  }

  const event: CrmEngagementEvent = {
    id: newId('eng'),
    prospectId: args.prospectId,
    eventType: args.eventType,
    source: args.source,
    campaignId: args.campaignId,
    materialId: args.materialId,
    actor: args.actor ?? 'system',
    consentSnapshot: args.consentSnapshot,
    dedupeKey,
    createdAt: nowIso(),
  };
  store.events.push(event);
  saveStore(store);
  syncEventToSupabase(event);

  const nextStage = nextOutreachStage(prospect.outreachStage, args.eventType);
  const heat = heatForProspect(args.prospectId);
  if (heat) persistHeat(args.prospectId, heat, stageFromHeatState(heat.state, nextStage));
  return { recorded: true, duplicate: false, heat, outreachStage: nextStage };
}

export function recomputeProspectHeat(prospectId: string): ProspectHeatResult | null {
  const prospect = getProspect(prospectId);
  const heat = heatForProspect(prospectId);
  if (!prospect || !heat) return null;
  persistHeat(prospectId, heat, stageFromHeatState(heat.state, prospect.outreachStage));
  return heat;
}
