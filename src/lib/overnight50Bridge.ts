import type { LeadCapture } from '../domain/leads';
import type { OvernightLeadSource } from '../features/overnight50/types';
import { recordOvernightLeadAttribution } from '../features/overnight50/leadIntelSwarmRepo';
import { getLeadAttribution } from './leadAttribution';

const CITY_ALIASES: Record<string, string> = {
  dfw: 'Dallas',
  dallas: 'Dallas',
  houston: 'Houston',
  atl: 'Atlanta',
  atlanta: 'Atlanta',
  phx: 'Phoenix',
  phoenix: 'Phoenix',
  clt: 'Charlotte',
  charlotte: 'Charlotte',
};

export function normalizeOvernightCity(raw?: string | null): string | undefined {
  const v = String(raw || '').trim();
  if (!v) return undefined;
  const key = v.toLowerCase().replace(/\s+/g, '_');
  return CITY_ALIASES[key] ?? v.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function inferOvernightLeadSource(lead: LeadCapture): OvernightLeadSource {
  const path = (lead.funnelPath || '').toLowerCase();
  const offer = String(lead.offer || '').toLowerCase();
  const utm = (lead.utmSource || '').toLowerCase();
  const src = String(lead.source || '');

  if (utm.includes('meta') || utm.includes('facebook') || utm.includes('instagram')) return 'paid_forms';
  if (utm.includes('google') || utm.includes('gclid')) return 'paid_forms';
  if (path.includes('affiliate') || offer.includes('affiliate')) return 'partner_refs';
  if (path.includes('agency') || offer.includes('agency') || src === 'agency') return 'partner_refs';
  if (lead.source === 'lead_magnet' || path.includes('free-') || path.includes('guide') || path.includes('toolkit')) return 'seo_inbound';
  if (lead.source === 'affiliate' || lead.source === 'agent') return 'partner_refs';
  if (lead.source === 'chat' || lead.source === 'contact') return 'community_captures';
  if (utm.includes('community') || utm.includes('revival')) return 'revival_conversions';
  return 'seo_inbound';
}

/** Site-wide hook: attribute inbound leads to Overnight50 ledger + live feed. */
export function wireLeadToOvernight50(lead: LeadCapture, args?: { guideId?: string; funnelId?: string }) {
  const attr = getLeadAttribution();
  const city = normalizeOvernightCity(attr?.geoCity) ?? 'National';
  const source = inferOvernightLeadSource(lead);
  const notes = [
    lead.funnelPath ? `path:${lead.funnelPath}` : null,
    args?.funnelId ? `funnel:${args.funnelId}` : null,
    args?.guideId ? `guide:${args.guideId}` : null,
    lead.email ? `lead:${lead.id}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  recordOvernightLeadAttribution({
    city,
    source,
    leads: 1,
    costCents: source === 'paid_forms' ? 500 : 0,
    notes: notes || undefined,
  });
}
