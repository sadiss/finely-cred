import type { LeadIntelSourceId, OvernightCity } from './types';

export const DEFAULT_OVERNIGHT50_CITIES = ["Dallas", "Houston", "Atlanta", "Phoenix", "Charlotte"] as const;

const serviceIntents = ["credit repair help", "fix credit score consultation", "business credit funding readiness", "authorized user tradeline seller", "credit specialist remote role", "agency partner credit repair", "affiliate credit repair program", "business funding partner", "dispute letter help", "credit monitoring help", "debt collection validation", "startup funding readiness"] as const;
const modifiers = ["near me", "today", "consultation", "guide", "checklist", "help", "apply", "remote", "partner program", "Dallas", "Houston", "Atlanta", "Phoenix", "Charlotte", "free", "best", "local", "urgent", "how to", "looking for"] as const;

export type QueryPlan = { id: string; city: OvernightCity; sourceId: LeadIntelSourceId; query: string; priority: number; reason: string };

function stableHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h).toString(36);
}

export function buildQueryPool(args?: { cities?: OvernightCity[]; sourceIds?: LeadIntelSourceId[]; limit?: number }): QueryPlan[] {
  const cities = args?.cities?.length ? args.cities : [...DEFAULT_OVERNIGHT50_CITIES];
  const sourceIds: LeadIntelSourceId[] = args?.sourceIds?.length ? args.sourceIds : ['serper_web','serper_places','reddit_geo','craigslist_services','review_sites','dead_lead_revival','affiliate_referral_loop'];
  const out: QueryPlan[] = [];
  for (const city of cities) {
    for (const sourceId of sourceIds) {
      for (const intent of serviceIntents) {
        for (const mod of modifiers) {
          const query = `${city} ${intent} ${mod}`.replace(/\s+/g, ' ').trim();
          out.push({ id: `q_${stableHash(`${sourceId}:${query}`)}`, city, sourceId, query, priority: intent.includes('consultation') || intent.includes('apply') ? 90 : 50, reason: 'geo intent + source rotation' });
        }
      }
    }
  }
  const sorted = out.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  return typeof args?.limit === 'number' ? sorted.slice(0, Math.max(1, args.limit)) : sorted;
}
